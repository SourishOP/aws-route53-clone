"""Authentication routes (mocked)."""
from fastapi import APIRouter, Depends, Response, Request, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import pbkdf2_sha256

from ..database import get_db
from .. import models, schemas
from ..auth import (
    create_session_cookie,
    clear_session_cookie,
    get_current_user,
    get_active_session_id,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _first_session_id(db: Session, user_id: str) -> str | None:
    s = (
        db.query(models.AccountSession)
        .filter(models.AccountSession.user_id == user_id)
        .order_by(models.AccountSession.created_at.asc())
        .first()
    )
    return s.id if s else None


@router.post("/login", response_model=schemas.UserOut)
def login(payload: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not pbkdf2_sha256.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    # Default to the user's first session as active.
    create_session_cookie(response, user.id, _first_session_id(db, user.id))
    return user


@router.post("/logout")
def logout(response: Response):
    clear_session_cookie(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ---------- Sessions (workspaces under one account) ----------
@router.get("/sessions", response_model=list[schemas.SessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rows = (
        db.query(models.AccountSession)
        .filter(models.AccountSession.user_id == user.id)
        .order_by(models.AccountSession.created_at.asc())
        .all()
    )
    out = []
    for s in rows:
        count = (
            db.query(models.HostedZone)
            .filter(models.HostedZone.session_id == s.id)
            .count()
        )
        out.append({"id": s.id, "name": s.name, "zone_count": count})
    return out


@router.post("/sessions", response_model=schemas.SessionOut, status_code=201)
def create_session(
    payload: schemas.SessionCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    sess = models.AccountSession(user_id=user.id, name=payload.name.strip())
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return {"id": sess.id, "name": sess.name, "zone_count": 0}


@router.post("/sessions/activate", response_model=schemas.UserOut)
def activate_session(
    payload: schemas.ActivateSession,
    response: Response,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    sess = (
        db.query(models.AccountSession)
        .filter(
            models.AccountSession.id == payload.session_id,
            models.AccountSession.user_id == user.id,
        )
        .first()
    )
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    create_session_cookie(response, user.id, sess.id)
    return user
