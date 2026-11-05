"""Tests for the isolated, authenticated, database-free ATS service."""

import os
import secrets
import subprocess
import sys
from pathlib import Path

from fastapi.testclient import TestClient

TEST_TOKEN = secrets.token_hex(32)
os.environ["FASTAPI_ATS_TOKEN"] = TEST_TOKEN

from app.ats_main import app
from app.ats_processing import analyze_resume, calculate_job_match

client = TestClient(app)
AUTH_HEADERS = {"X-Internal-ATS-Token": TEST_TOKEN}
BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_internal_ats_service_rejects_missing_short_and_placeholder_tokens():
    for token in ("", "too-short", "replace_with_a_long_placeholder_value"):
        environment = os.environ.copy()
        environment["FASTAPI_ATS_TOKEN"] = token
        result = subprocess.run(
            [sys.executable, "-c", "import app.ats_config"],
            cwd=BACKEND_DIR,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode != 0
        assert "FASTAPI_ATS_TOKEN" in result.stderr
        if token:
            assert token not in result.stderr


def test_job_match_requires_internal_token_and_returns_validated_result():
    payload = {
        "resumeText": "Python React SQL Docker and AWS development experience.",
        "jobDescription": "Seeking Python React SQL Docker and AWS experience.",
        "targetRole": "Software Engineer",
    }

    unauthorized = client.post("/internal/ats/match", json=payload)
    assert unauthorized.status_code == 401

    response = client.post(
        "/internal/ats/match",
        json=payload,
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    assert 0 <= result["result"]["matchScore"] <= 98
    assert 0 <= result["result"]["tfidfCosineSimilarity"] <= 1
    assert "PYTHON" in result["result"]["matchedKeywords"]
    assert result["result"]["recommendations"]


def test_analysis_returns_the_frontend_contract_without_database_access():
    resume_text = (
        "Professional Summary\nPython React SQL\nSkills\nExperience\n"
        "Developed software and automated deployments. Education\n"
        "engineer@example.com +1 415 555 0198 LinkedIn GitHub"
    )
    response = client.post(
        "/internal/ats/analyze",
        json={"resumeText": resume_text, "jobDescription": "Python React SQL engineering role"},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 200
    result = response.json()
    assert 0 <= result["score"] <= 100
    assert result["scoreLabel"] in {"Poor", "Needs Work", "Good", "Excellent"}
    assert len(result["breakdown"]) == 6
    assert result["wordCount"] == len(resume_text.split())
    assert result["charCount"] == len(resume_text)
    assert result["aiSuggestions"]["suggestions"]


def test_ats_requests_reject_invalid_or_oversized_input():
    invalid_match = client.post(
        "/internal/ats/match",
        json={"resumeText": "", "jobDescription": "A job description"},
        headers=AUTH_HEADERS,
    )
    assert invalid_match.status_code == 422

    oversized_analysis = client.post(
        "/internal/ats/analyze",
        json={"resumeText": "x" * 25_001},
        headers=AUTH_HEADERS,
    )
    assert oversized_analysis.status_code == 422


def test_processing_is_deterministic_and_does_not_modify_inputs():
    resume = "Python React SQL developer"
    description = "Python React SQL engineering"
    assert calculate_job_match(resume, description) == calculate_job_match(resume, description)
    assert analyze_resume(resume) == analyze_resume(resume)
    assert "app.database" not in sys.modules
