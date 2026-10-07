"""SQLAlchemy ORM models for the Route53 clone."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Boolean,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    account_id = Column(String, nullable=False, default="123456789012")
    created_at = Column(DateTime, default=_now)


class AccountSession(Base):
    """A named workspace/session under a single user account.

    Each session scopes its own set of hosted zones, mimicking the AWS
    "Choose AWS sessions" concept where one account can hold several sessions.
    """
    __tablename__ = "account_sessions"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=_now)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=_uuid)
    # Owning session (workspace). Nullable for legacy rows / safety.
    session_id = Column(
        String,
        ForeignKey("account_sessions.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # Route53-style zone id, e.g. Z1D633PJN98FT9
    zone_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, default="Public")  # Public | Private
    comment = Column(Text, default="")
    private = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    records = relationship(
        "DnsRecord",
        back_populates="zone",
        cascade="all, delete-orphan",
    )

    @property
    def record_count(self) -> int:
        return len(self.records)


class DnsRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=_uuid)
    zone_id = Column(
        String,
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, index=True)  # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
    ttl = Column(Integer, nullable=False, default=300)
    # value stores one or more resource records joined by newlines
    value = Column(Text, nullable=False, default="")
    routing_policy = Column(String, default="Simple")
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    zone = relationship("HostedZone", back_populates="records")
