
import re
import unicodedata
from collections import Counter


# 1. Decouper les pages du PDF en petits morceaux
def chunk_pdf_pages(pages, chunk_size=1000, overlap=150):
    chunks = []

    if chunk_size <= 0 or not 0 <= overlap < chunk_size:
        raise ValueError("Parametres de decoupage invalides")

    for page in pages:
        text = page["text"].strip()
        page_number = page["page"]

        if not text:
            continue

        start = 0

        while start < len(text):
            end = min(start + chunk_size, len(text))

            chunk_text = text[start:end]

            chunks.append({
                "page": page_number,
                "text": chunk_text
            })

            # Arreter si la fin de la page est atteinte
            if end == len(text):
                break

            # Garder 150 caracteres du morceau precedent
            start = end - overlap

    return chunks


# 2. Rechercher les passages pertinents pour une question
def search_relevant_chunks(chunks, question, top_k=5):

    # Normaliser les accents et les espaces
    def normalize(text):
        text = text.casefold()

        text = "".join(
            char
            for char in unicodedata.normalize("NFKD", text)
            if not unicodedata.combining(char)
        )

        # Transformer "5 V" en "5v"
        text = re.sub(
            r"\b(\d+)\s+([a-z])\b",
            r"\1\2",
            text
        )

        return text

    # Mots courants qui n'aident pas la recherche
    stop_words = {
        "est", "sont", "que", "qui", "quoi",
        "quel", "quelle", "quels", "quelles",
        "les", "des", "une", "dans", "pour",
        "avec", "sur", "comment", "the",
        "what", "and", "du", "de", "la",
        "le", "un", "aux"
    }

    # Extraire les mots importants de la question
    question_words = set(
        re.findall(r"\b\w+\b", normalize(question))
    )

    question_words = {
        word
        for word in question_words
        if (
            (len(word) >= 3 or any(c.isdigit() for c in word))
            and word not in stop_words
        )
    }

    if not question_words:
        return []

    results = []

    # Comparer la question avec chaque Chunk
    for chunk in chunks:
        text = normalize(chunk["text"])

        lines = text.splitlines()
        title = lines[0].strip() if lines else ""

        text_words = Counter(
            re.findall(r"\b\w+\b", text)
        )

        title_words = set(
            re.findall(r"\b\w+\b", title)
        )

        # Score de base : mots en commun
        score = sum(
            min(text_words[word], 3)
            for word in question_words
        )

        # Bonus si les mots apparaissent dans le titre
        score += 2 * len(
            question_words.intersection(title_words)
        )

        # Bonus important pour les sujets numerotes
        # Exemple : "5 V" dans le titre du passage
        numbered_words = {
            word
            for word in question_words
            if any(char.isdigit() for char in word)
        }

        score += 20 * len(
            numbered_words.intersection(title_words)
        )

        # Eviter de privilegier les pages de sommaire
        if title.startswith(("plan", "sommaire")):
            score -= 15

        # Ajouter uniquement les passages pertinents
        if score > 0:
            results.append({
                "page": chunk["page"],
                "text": chunk["text"],
                "score": score
            })

    # Trier les passages du plus pertinent au moins pertinent
    results.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    # Retourner les 5 meilleurs passages
    return results[:top_k]
