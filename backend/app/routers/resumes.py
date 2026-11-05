"""
Resume CRUD endpoints.
Guarantees strict tenant isolation: users can only view, create, edit, or delete their own resumes.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post(
    "",
    response_model=schemas.ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new resume",
)
def create_resume(
    resume_in: schemas.ResumeCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new resume tied to the authenticated user.
    """
    new_resume = models.Resume(
        user_id=current_user.id,
        title=resume_in.title,
        template_id=resume_in.templateId or resume_in.template_id or "tmpl-1",
        accent_color=resume_in.accentColor or resume_in.accent_color or "#C98B5E",
        content=resume_in.content,
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    return new_resume


@router.get(
    "",
    response_model=List[schemas.ResumeResponse],
    summary="List all resumes for current user",
)
def list_user_resumes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves all resume records belonging exclusively to the currently authenticated user.
    """
    resumes = (
        db.query(models.Resume)
        .filter(models.Resume.user_id == current_user.id)
        .order_by(models.Resume.updated_at.desc())
        .all()
    )
    return resumes


@router.get(
    "/{resume_id}",
    response_model=schemas.ResumeResponse,
    summary="Get a single resume by ID",
)
def get_resume(
    resume_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetches a specific resume. Enforces ownership check to prevent unauthorized access.
    """
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or you do not have permission to view it.",
        )
    return resume


@router.put(
    "/{resume_id}",
    response_model=schemas.ResumeResponse,
    summary="Update an existing resume",
)
def update_resume(
    resume_id: int,
    resume_update: schemas.ResumeUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates the title or content of an existing resume owned by the current user.
    """
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or you do not have permission to edit it.",
        )

    if resume_update.title is not None:
        resume.title = resume_update.title
    resolved_tmpl = resume_update.templateId or resume_update.template_id
    if resolved_tmpl is not None:
        resume.template_id = resolved_tmpl
    resolved_accent = resume_update.accentColor or resume_update.accent_color
    if resolved_accent is not None:
        resume.accent_color = resolved_accent
    if resume_update.content is not None:
        resume.content = resume_update.content

    db.commit()
    db.refresh(resume)
    return resume


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a resume",
)
def delete_resume(
    resume_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes an existing resume owned by the current user.
    """
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or you do not have permission to delete it.",
        )

    db.delete(resume)
    db.commit()
    return None
