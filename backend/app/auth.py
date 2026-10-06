"""Mocked authentication: signed-cookie sessions.

This is intentionally simple (as allowed by the assignment). A signed cookie
holds the user id; it is created on login and cleared on logout.
"""
from fastapi import Request, HTTPException, Depends, Response
from itsdangerous import URLSafeSerializer, BadSignature
from sqlalchemy.orm import Session

from .database import get_db
from . import models

SECRET_KEY = "route53-clone-dev-secret-change-me"
COOKIE_NAME = "r53_session"
_serializer = URLSafeSerializer(SECRET_KEY, salt="session")


def create_session_cookie(response: Response, user_id: str) -> None:
    token = _serializer.dumps({"user_id": user_id})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> models.User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data = _serializer.loads(token)
    except BadSignature:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = db.query(models.User).filter(models.User.id == data.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
