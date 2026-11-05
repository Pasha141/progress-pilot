"""Standalone internal FastAPI entrypoint for stateless ATS processing."""

import secrets
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.ats_config import FASTAPI_ATS_TOKEN
from app.ats_processing import analyze_resume, calculate_job_match


class AtsMatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    resume_text: str = Field(alias="resumeText", min_length=1, max_length=20_000)
    job_description: str = Field(alias="jobDescription", min_length=1, max_length=10_000)
    target_role: str = Field(default="Professional", alias="targetRole", max_length=200)


class AtsMatchResult(BaseModel):
    match_score: int = Field(alias="matchScore", ge=0, le=98)
    tfidf_cosine_similarity: float = Field(alias="tfidfCosineSimilarity", ge=0, le=1)
    matched_keywords: list[str] = Field(alias="matchedKeywords", max_length=10)
    missing_keywords: list[str] = Field(alias="missingKeywords", max_length=8)
    recommendations: list[str] = Field(min_length=1, max_length=3)

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class AtsMatchResponse(BaseModel):
    success: Literal[True]
    result: AtsMatchResult

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class AtsAnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    resume_text: str = Field(alias="resumeText", min_length=20, max_length=25_000)
    job_description: str = Field(default="", alias="jobDescription", max_length=10_000)


class BreakdownItem(BaseModel):
    category: str
    score: int = Field(ge=0)
    max_score: int = Field(alias="maxScore", ge=0)
    icon: str

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class AtsIssue(BaseModel):
    id: str
    category: str
    severity: Literal["critical", "warning", "tip"]
    message: str
    fix_recommendation: str = Field(alias="fixRecommendation")

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class ExampleRewrite(BaseModel):
    before: str
    after: str


class AtsSuggestion(BaseModel):
    section: str
    issue: str
    fix: str
    example_rewrite: ExampleRewrite


class AtsSuggestions(BaseModel):
    score_improvement_estimate: int = Field(ge=0, le=100)
    suggestions: list[AtsSuggestion] = Field(max_length=5)
    rewritten_summary: str
    missing_keywords: list[str] = Field(max_length=6)


class AtsAnalysisResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    score_label: Literal["Poor", "Needs Work", "Good", "Excellent"] = Field(alias="scoreLabel")
    score_color: Literal["red", "orange", "green"] = Field(alias="scoreColor")
    breakdown: list[BreakdownItem] = Field(min_length=1, max_length=8)
    found_keywords: list[str] = Field(alias="foundKeywords", max_length=20)
    missing_keywords: list[str] = Field(alias="missingKeywords", max_length=20)
    issues: list[AtsIssue] = Field(max_length=20)
    ai_suggestions: AtsSuggestions = Field(alias="aiSuggestions")
    word_count: int = Field(alias="wordCount", ge=0)
    char_count: int = Field(alias="charCount", ge=0)

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


def require_internal_token(
    token: Annotated[str | None, Header(alias="X-Internal-ATS-Token")] = None,
) -> None:
    if token is None or not secrets.compare_digest(token, FASTAPI_ATS_TOKEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Internal service authentication required.",
        )


app = FastAPI(
    title="Internal ATS Processing API",
    description="Private server-to-server ATS scoring and job matching.",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


@app.post(
    "/internal/ats/match",
    response_model=AtsMatchResponse,
    dependencies=[Depends(require_internal_token)],
)
def match_job(request: AtsMatchRequest) -> dict:
    result = calculate_job_match(
        request.resume_text,
        request.job_description,
    )
    return {"success": True, "result": result}


@app.post(
    "/internal/ats/analyze",
    response_model=AtsAnalysisResponse,
    dependencies=[Depends(require_internal_token)],
)
def analyze(request: AtsAnalyzeRequest) -> dict:
    return analyze_resume(request.resume_text, request.job_description)


@app.get("/internal/ats/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "Internal ATS Processing API"}
