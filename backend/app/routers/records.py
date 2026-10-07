"""DNS Record CRUD routes (scoped to a hosted zone)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user, require_active_session

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["records"])


def _get_zone_or_404(db: Session, zone_id: str, session_id: str) -> models.HostedZone:
    zone = (
        db.query(models.HostedZone)
        .filter(
            models.HostedZone.id == zone_id,
            models.HostedZone.session_id == session_id,
        )
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


@router.get("", response_model=schemas.PaginatedRecords)
def list_records(
    zone_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
    search: str = Query(""),
    type_filter: str = Query("", alias="type"),
    name: str = Query(""),
    value: str = Query(""),
    routing_policy: str = Query(""),
    ttl: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort: str = Query("name"),
    order: str = Query("asc"),
):
    _get_zone_or_404(db, zone_id, active.id)
    query = db.query(models.DnsRecord).filter(models.DnsRecord.zone_id == zone_id)

    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                models.DnsRecord.name.ilike(term),
                models.DnsRecord.value.ilike(term),
            )
        )
    if type_filter:
        query = query.filter(models.DnsRecord.type == type_filter.upper())
    if name:
        query = query.filter(models.DnsRecord.name.ilike(f"%{name.strip().lower()}%"))
    if value:
        query = query.filter(models.DnsRecord.value.ilike(f"%{value.strip()}%"))
    if routing_policy:
        query = query.filter(
            models.DnsRecord.routing_policy.ilike(f"%{routing_policy.strip()}%")
        )
    if ttl.strip().isdigit():
        query = query.filter(models.DnsRecord.ttl == int(ttl.strip()))

    sort_col = {
        "name": models.DnsRecord.name,
        "type": models.DnsRecord.type,
        "ttl": models.DnsRecord.ttl,
    }.get(sort, models.DnsRecord.name)
    sort_col = sort_col.desc() if order == "desc" else sort_col.asc()
    query = query.order_by(sort_col)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=schemas.DnsRecordOut, status_code=201)
def create_record(
    zone_id: str,
    payload: schemas.DnsRecordCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    zone = _get_zone_or_404(db, zone_id, active.id)

    name = payload.name.strip().lower()
    if name == "" or name == "@":
        name = zone.name
    elif not name.endswith("."):
        # treat as subdomain relative to the zone
        if not name.endswith(zone.name.rstrip(".")):
            name = f"{name}.{zone.name}"
        else:
            name = name + "."

    duplicate = (
        db.query(models.DnsRecord)
        .filter(
            models.DnsRecord.zone_id == zone_id,
            models.DnsRecord.name == name,
            models.DnsRecord.type == payload.type,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="A record with this name and type already exists",
        )

    record = models.DnsRecord(
        zone_id=zone_id,
        name=name,
        type=payload.type,
        ttl=payload.ttl,
        value=payload.value,
        routing_policy=payload.routing_policy or "Simple",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{record_id}", response_model=schemas.DnsRecordOut)
def get_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    _get_zone_or_404(db, zone_id, active.id)
    record = (
        db.query(models.DnsRecord)
        .filter(models.DnsRecord.id == record_id, models.DnsRecord.zone_id == zone_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.put("/{record_id}", response_model=schemas.DnsRecordOut)
def update_record(
    zone_id: str,
    record_id: str,
    payload: schemas.DnsRecordUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    _get_zone_or_404(db, zone_id, active.id)
    record = (
        db.query(models.DnsRecord)
        .filter(models.DnsRecord.id == record_id, models.DnsRecord.zone_id == zone_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    data = payload.model_dump(exclude_unset=True)
    # Determine the final type/value to validate the value format.
    final_type = (data.get("type") or record.type)
    final_value = data.get("value", record.value)
    if "value" in data or "type" in data:
        from ..validators import validate_record_value

        try:
            validate_record_value(final_type, final_value)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

    for field, val in data.items():
        setattr(record, field, val)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    _get_zone_or_404(db, zone_id, active.id)
    record = (
        db.query(models.DnsRecord)
        .filter(models.DnsRecord.id == record_id, models.DnsRecord.zone_id == zone_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return None
