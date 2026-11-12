
from pdf_utils import extract_course_pdf_pages
from text_utils import chunk_pdf_pages, search_relevant_chunks
from ai_utils import generate_ai_answer


async def answer_question_from_pdf(
    pdf_id: str,
    course_id: str,
    user_id: str,
    question: str
):

    # 1. Verifier la question
    if not question.strip():
        raise ValueError("La question est obligatoire")

    # 2. Recuperer les pages du PDF depuis MongoDB
    pages = await extract_course_pdf_pages(
        pdf_id,
        course_id,
        user_id
    )

    # 3. Verifier si le PDF contient du texte
    if not pages:
        return {
            "answer": "Aucun texte extractible dans ce PDF.",
            "source_pages": []
        }

    # 4. Decouper le texte en morceaux
    chunks = chunk_pdf_pages(pages)

    # 5. Rechercher les passages pertinents
    relevant_chunks = search_relevant_chunks(
        chunks,
        question,
        top_k=5
    )

    # 6. Generer la reponse avec Gemini
    result = await generate_ai_answer(
        question,
        relevant_chunks
    )

    return result
