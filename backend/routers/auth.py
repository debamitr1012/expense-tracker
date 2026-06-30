from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import AuthResponseDto, LoginDto, RegisterDto
from security import create_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponseDto)
def register(dto: RegisterDto, db: Session = Depends(get_db)) -> AuthResponseDto:
    username = dto.username.strip().lower()

    existing = db.scalar(select(User).where(User.username == username))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken.",
        )

    user = User(
        name=dto.name.strip(),
        username=username,
        password_hash=hash_password(dto.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponseDto(token=create_token(user), name=user.name, username=user.username)


@router.post("/login", response_model=AuthResponseDto)
def login(dto: LoginDto, db: Session = Depends(get_db)) -> AuthResponseDto:
    username = dto.username.strip().lower()
    user = db.scalar(select(User).where(User.username == username))

    if user is None or not verify_password(dto.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    return AuthResponseDto(token=create_token(user), name=user.name, username=user.username)
