"""
Pydantic schemas for data validation and response serialization.
Strictly validates all inbound client data and prevents sensitive attributes from leaking.
"""

from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ==========================================
# User Schemas
# ==========================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128, description="Password must be at least 6 characters")
    full_name: Optional[str] = Field(None, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Authentication & Token Schemas
# ==========================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    user_id: int
    email: str


# ==========================================
# Resume Schemas
# ==========================================

class ResumeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Name or title for this resume version")
    template_id: Optional[str] = Field("tmpl-1", max_length=64)
    templateId: Optional[str] = Field(None, max_length=64, exclude=True)
    accent_color: Optional[str] = Field("#C98B5E", max_length=32)
    accentColor: Optional[str] = Field(None, max_length=32, exclude=True)
    content: Dict[str, Any] = Field(..., description="Full structured JSON payload of the resume")


class ResumeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    template_id: Optional[str] = Field(None, max_length=64)
    templateId: Optional[str] = Field(None, max_length=64, exclude=True)
    accent_color: Optional[str] = Field(None, max_length=32)
    accentColor: Optional[str] = Field(None, max_length=32, exclude=True)
    content: Optional[Dict[str, Any]] = None


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    title: str
    template_id: str = "tmpl-1"
    accent_color: str = "#C98B5E"
    content: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
