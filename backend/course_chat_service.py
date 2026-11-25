
from bson import ObjectId

from database import db
from pdf_utils import extract_course_pdf_pages
from text_utils import chunk_pdf_pages, search_relevant_chunks
from ai_utils import generate_ai_answer


async def answer_question_from_course(
    course_id: str,
    user_id: str,
    question: str
):
    # 1. Verifier la question et l'identifiant du cours
    if not question.strip():
        raise ValueError("La question est obligatoire")

    if not ObjectId.is_valid(course_id):
        raise ValueError("Identifiant du cours invalide")

    # 2. Verifier que ce cours appartient a l'etudiant connecte
    course = await db["courses"].find_one({
        "_id": ObjectId(course_id),
        "user_id": user_id
    })

    if not course:
        raise ValueError("Cours introuvable")

    # 3. Parcourir tous les PDF de ce cours
    cursor = db["fs.files"].find({
        "metadata.course_id": course_id,
        "metadata.user_id": user_id
    })

    relevant_passages = []
    pdf_count = 0

    async for pdf in cursor:
        pdf_count += 1

        pdf_id = str(pdf["_id"])
        filename = pdf.get("filename", "Document.pdf")

        # Extraire les pages de ce PDF
        pages = await extract_course_pdf_pages(
            pdf_id=pdf_id,
            course_id=course_id,
            user_id=user_id
        )

        if not pages:
            continue

        # Decouper en petits morceaux
        chunks = chunk_pdf_pages(pages)

        # Chercher les 5 meilleurs passages de ce PDF
        matches = search_relevant_chunks(
            chunks,
            question,
            top_k=5
        )

        # Conserver aussi le nom du PDF et son ID
        for match in matches:
            relevant_passages.append({
                "pdf_id": pdf_id,
                "filename": filename,
                "page": match["page"],
                "text": match["text"],
                "score": match["score"]
            })

    # Aucun document dans le cours
    if pdf_count == 0:
        return {
            "answer": "Ce cours ne contient aucun fichier PDF.",
            "sources": [],
            "source_pages": []
        }

    # 4. Comparer les passages de tous les PDF
    relevant_passages.sort(
        key=lambda passage: passage["score"],
        reverse=True
    )

    # Garder les 8 passages les plus pertinents
    selected_passages = relevant_passages[:8]

    if not selected_passages:
        return {
            "answer": (
                "Je n'ai pas trouve cette information "
                "dans les PDF de ce cours."
            ),
            "sources": [],
            "source_pages": []
        }

    # 5. Preparer les informations pour Gemini
    gemini_chunks = [
        {
            "page": (
                passage["filename"]
                + " - page "
                + str(passage["page"])
            ),
            "text": passage["text"]
        }
        for passage in selected_passages
    ]

    # Gemini genere une reponse a partir des extraits
    result = await generate_ai_answer(
        question,
        gemini_chunks
    )

    # 6. Preparer les sources sans doublons
    sources = []
    seen = set()

    for passage in selected_passages:
        key = (
            passage["pdf_id"],
            passage["page"]
        )

        if key in seen:
            continue

        seen.add(key)

        sources.append({
            "pdf_id": passage["pdf_id"],
            "filename": passage["filename"],
            "page": passage["page"]
        })

    # 7. Retourner la reponse et les passages consultes
    return {
        "answer": result["answer"],
        "sources": sources,
        "source_pages": []
    }
