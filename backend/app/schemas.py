"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, field_validator, model_validator

from .validators import validate_record_value

RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]


# ---------- Auth ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: str
    username: str
    account_id: str

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: str
    name: str
    zone_count: int = 0

    model_config = {"from_attributes": True}


class SessionCreate(BaseModel):
    name: str = Field(..., min_length=1)


class ActivateSession(BaseModel):
    session_id: str


# ---------- Hosted Zones ----------
class HostedZoneBase(BaseModel):
    name: str = Field(..., min_length=1)
    type: str = "Public"
    comment: str = ""

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("Public", "Private"):
            raise ValueError("type must be 'Public' or 'Private'")
        return v

    @field_validator("name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith("."):
            v = v + "."
        return v


class HostedZoneCreate(HostedZoneBase):
    pass


class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None


class HostedZoneOut(BaseModel):
    id: str
    zone_id: str
    name: str
    type: str
    comment: str
    private: bool
    record_count: int
    created_by: str = "Route 53 console"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- DNS Records ----------
class DnsRecordBase(BaseModel):
    name: str = Field(..., min_length=0)
    type: str
    ttl: int = Field(default=300, ge=0)
    value: str = Field(..., min_length=1)
    routing_policy: str = "Simple"

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.upper()
        if v not in RECORD_TYPES:
            raise ValueError(f"type must be one of {RECORD_TYPES}")
        return v

    @model_validator(mode="after")
    def validate_value_for_type(self):
        validate_record_value(self.type, self.value)
        return self


class DnsRecordCreate(DnsRecordBase):
    pass


class DnsRecordUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    ttl: Optional[int] = Field(default=None, ge=0)
    value: Optional[str] = None
    routing_policy: Optional[str] = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if v is None:
            return v
        v = v.upper()
        if v not in RECORD_TYPES:
            raise ValueError(f"type must be one of {RECORD_TYPES}")
        return v


class DnsRecordOut(BaseModel):
    id: str
    zone_id: str
    name: str
    type: str
    ttl: int
    value: str
    routing_policy: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- Paginated responses ----------
class PaginatedZones(BaseModel):
    items: List[HostedZoneOut]
    total: int
    page: int
    page_size: int


class PaginatedRecords(BaseModel):
    items: List[DnsRecordOut]
    total: int
    page: int
    page_size: int


# ---------- Import / Export ----------
class ImportRequest(BaseModel):
    content: str


class ImportResult(BaseModel):
    created: int
    skipped: int
    errors: List[str]


class ZoneExport(BaseModel):
    zone: HostedZoneOut
    records: List[DnsRecordOut]
