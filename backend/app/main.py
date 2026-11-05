"""
FastAPI application entry point.
Configures CORS, auto-creates database tables on startup, and registers routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect
from sqlalchemy.engine import Engine

from app.config import settings
from app.database import engine, Base
from app.routers import auth, resumes


def verify_database_schema(bind: Engine = engine) -> None:
    inspector = inspect(bind)
    missing_columns = []
    for table in Base.metadata.sorted_tables:
        existing_columns = {column["name"] for column in inspector.get_columns(table.name)}
        missing_columns.extend(
            f"{table.name}.{column.name}"
            for column in table.columns
            if column.name not in existing_columns
        )

    if missing_columns:
        missing = ", ".join(missing_columns)
        raise RuntimeError(
            f"FastAPI database schema is incomplete: missing columns {missing}. "
            "Apply the documented migrations before serving requests."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager that initializes database tables on application startup.
    In local dev, this ensures tables (users, resumes) are ready in MySQL automatically.
    """
    Base.metadata.create_all(bind=engine)
    verify_database_schema(engine)
    yield


app = FastAPI(
    title="ATS-Friendly Resume Builder API",
    description="Backend API by Mohammed Junaid Pasha for User Authentication, Resume Management, and ATS Scoring.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for configured frontend origin plus standard local Vite ports (5173 & 3000)
allowed_origins = list(
    dict.fromkeys(
        [
            origin.strip()
            for origin in settings.FRONTEND_URL.split(",")
            if origin.strip()
        ]
        + [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under standard /api namespace
app.include_router(auth.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Simple health check endpoint to verify backend service status.
    """
    return {
        "status": "healthy",
        "service": "ATS-Friendly Resume Builder API",
        "developer": "Mohammed Junaid Pasha",
    }
