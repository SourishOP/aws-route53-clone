"""Authentication routes (mocked)."""
from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import pbkdf2_sha256

from ..database import get_db
from .. import models, schemas
from ..auth import (
    create_session_cookie,
    clear_session_cookie,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.UserOut)
def login(payload: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not pbkdf2_sha256.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    create_session_cookie(response, user.id)
    return user


@router.post("/logout")
def logout(response: Response):
    clear_session_cookie(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
