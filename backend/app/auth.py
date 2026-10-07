"""Mocked authentication: signed-cookie sessions.

This is intentionally simple (as allowed by the assignment). A signed cookie
holds the user id; it is created on login and cleared on logout.
"""
from fastapi import Request, HTTPException, Depends, Response
from itsdangerous import URLSafeSerializer, BadSignature
from sqlalchemy.orm import Session

from .database import get_db
from . import models

import os

SECRET_KEY = os.environ.get("SESSION_SECRET", "route53-clone-dev-secret-change-me")
COOKIE_NAME = "r53_session"
_serializer = URLSafeSerializer(SECRET_KEY, salt="session")

# When the frontend and backend are hosted on different domains, the session
# cookie must be SameSite=None and Secure for the browser to send it cross-site.
# Set COOKIE_CROSS_SITE=1 in the deployed backend's environment to enable that.
_CROSS_SITE = os.environ.get("COOKIE_CROSS_SITE", "") == "1"
_SAMESITE = "none" if _CROSS_SITE else "lax"
_SECURE = _CROSS_SITE


def create_session_cookie(response: Response, user_id: str, session_id: str | None = None) -> None:
    token = _serializer.dumps({"user_id": user_id, "session_id": session_id})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite=_SAMESITE,
        secure=_SECURE,
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


def get_active_session_id(request: Request) -> str | None:
    """Return the active session id embedded in the signed cookie, if any."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        data = _serializer.loads(token)
    except BadSignature:
        return None
    return data.get("session_id")


def require_active_session(
    request: Request,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> models.AccountSession:
    """Resolve the active session; fall back to the user's first session."""
    sid = get_active_session_id(request)
    q = db.query(models.AccountSession).filter(
        models.AccountSession.user_id == user.id
    )
    sess = None
    if sid:
        sess = q.filter(models.AccountSession.id == sid).first()
    if not sess:
        sess = q.order_by(models.AccountSession.created_at.asc()).first()
    if not sess:
        raise HTTPException(status_code=400, detail="No active session")
    return sess
