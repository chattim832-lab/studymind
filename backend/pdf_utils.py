
import pymupdf

from bson import ObjectId
from gridfs import AsyncGridFSBucket
from database import db


# 1. Extraire le texte d'un PDF page par page
def extract_pdf_pages(pdf_bytes: bytes):
    pages = []

    with pymupdf.open(
        stream=pdf_bytes,
        filetype="pdf"
    ) as document:

        for page_number, page in enumerate(document, start=1):
            text = page.get_text("text").strip()

            if text:
                pages.append({
                    "page": page_number,
                    "text": text
                })

    return pages


# 2. Lire un PDF depuis MongoDB GridFS
async def extract_course_pdf_pages(
    pdf_id: str,
    course_id: str,
    user_id: str
):
    # Verifier les identifiants
    if not ObjectId.is_valid(pdf_id):
        raise ValueError("Identifiant PDF invalide")

    if not ObjectId.is_valid(course_id):
        raise ValueError("Identifiant cours invalide")

    # Verifier que le cours appartient a l'etudiant
    course = await db["courses"].find_one({
        "_id": ObjectId(course_id),
        "user_id": user_id
    })

    if not course:
        raise ValueError("Cours introuvable")

    # Verifier que le PDF appartient au cours
    pdf_info = await db["fs.files"].find_one({
        "_id": ObjectId(pdf_id),
        "metadata.course_id": course_id,
        "metadata.user_id": user_id
    })

    if not pdf_info:
        raise ValueError("PDF introuvable")

    # Recuperer le PDF depuis MongoDB
    bucket = AsyncGridFSBucket(db)

    grid_file = await bucket.open_download_stream(
        pdf_info["_id"]
    )

    pdf_bytes = await grid_file.read()

    # Extraire le texte du PDF
    pages = extract_pdf_pages(pdf_bytes)

    return pages
