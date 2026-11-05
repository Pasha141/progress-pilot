"""Configuration for the stateless, server-to-server ATS application."""

import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

FASTAPI_ATS_TOKEN = os.getenv("FASTAPI_ATS_TOKEN", "").strip()
if len(FASTAPI_ATS_TOKEN) < 32 or FASTAPI_ATS_TOKEN.casefold().startswith(
    ("replace_with_", "change_this_", "your_")
):
    raise RuntimeError(
        "FastAPI ATS startup blocked: FASTAPI_ATS_TOKEN must be configured "
        "with a non-placeholder secret of at least 32 characters."
    )
