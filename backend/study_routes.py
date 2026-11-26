"""Routes FastAPI Sprint 3 : /study/*.

Ce fichier est ajoute a main.py avec :
    from study_routes import router as study_router
    app.include_router(study_router)
"""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from main import get_current_user
from study_service import (
    StudyGenerationError,
    generate_quiz,
    generate_study_text,
    get_progress,
    submit_quiz,
)

router = APIRouter(prefix="/study", tags=["Sprint 3 - Revision et progression"])


class DocumentRequest(BaseModel):
    course_id: str
    pdf_id: str
    language: Literal["fr", "en"] = "fr"


class QuizRequest(DocumentRequest):
    question_count: int = Field(default=5, ge=3, le=10)


class QuizAnswer(BaseModel):
    question_id: str
    option_id: str


class QuizSubmission(BaseModel):
    quiz_id: str
    answers: list[QuizAnswer] = Field(min_length=1)


def _http_error(error: Exception):
    if isinstance(error, ValueError):
        detail = str(error)
        lower = detail.lower()
        if "aucun texte" in lower:
            return HTTPException(status_code=422, detail=detail)
        status = 400 if "invalide" in lower or "repondre" in lower or "repetee" in lower else 404
        return HTTPException(status_code=status, detail=detail)
    return HTTPException(status_code=502, detail=str(error))


@router.post("/summary")
async def study_summary(
    data: DocumentRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return await generate_study_text(
            data.course_id, data.pdf_id, current_user["id"],
            data.language, "summary",
        )
    except (ValueError, StudyGenerationError) as error:
        raise _http_error(error) from error


@router.post("/revision-sheet")
async def study_revision_sheet(
    data: DocumentRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return await generate_study_text(
            data.course_id, data.pdf_id, current_user["id"],
            data.language, "sheet",
        )
    except (ValueError, StudyGenerationError) as error:
        raise _http_error(error) from error


@router.post("/quiz")
async def study_quiz(
    data: QuizRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return await generate_quiz(
            data.course_id, data.pdf_id, current_user["id"],
            data.language, data.question_count,
        )
    except (ValueError, StudyGenerationError) as error:
        raise _http_error(error) from error


@router.post("/quiz/submit")
async def study_quiz_submit(
    data: QuizSubmission,
    current_user: dict = Depends(get_current_user),
):
    try:
        return await submit_quiz(
            data.quiz_id,
            current_user["id"],
            [answer.model_dump() for answer in data.answers],
        )
    except ValueError as error:
        raise _http_error(error) from error


@router.get("/progress")
async def study_progress(current_user: dict = Depends(get_current_user)):
    return await get_progress(current_user["id"])
