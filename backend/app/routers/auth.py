"""
Authentication routes: User Registration, Login, and Current Profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    """
    Registers a new user account:
    - Verifies that the email is not already taken.
    - Hashes the password using bcrypt.
    - Persists the new user record in MySQL.
    - Returns sanitized user profile without sensitive fields.
    """
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    hashed_pw = hash_password(user_in.password)
    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pw,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=schemas.Token,
    summary="Authenticate and receive JWT access token",
)
def login_user(
    credentials: schemas.UserLogin,
    db: Session = Depends(get_db),
):
    """
    Validates user credentials and issues a signed JSON Web Token (JWT).
    """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Subject claim ('sub') stores the user ID as string per JWT standards
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return schemas.Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=schemas.UserResponse,
    summary="Get current authenticated user profile",
)
def read_current_user(
    current_user: models.User = Depends(get_current_user),
):
    """
    Returns the profile information of the currently authenticated user.
    """
    return current_user
