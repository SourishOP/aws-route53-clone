"""Hosted Zone CRUD routes."""
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user, require_active_session
from ..utils import generate_zone_id
from .. import bind

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


def _unique_zone_id(db: Session) -> str:
    while True:
        zid = generate_zone_id()
        if not db.query(models.HostedZone).filter(models.HostedZone.zone_id == zid).first():
            return zid


CREATED_BY_VALUE = "Route 53 console"


@router.get("", response_model=schemas.PaginatedZones)
def list_zones(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
    search: str = Query("", description="Broad free-text search"),
    name: str = Query(""),
    type: str = Query("", alias="type"),
    created_by: str = Query(""),
    description: str = Query(""),
    zone_id: str = Query(""),
    record_count: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort: str = Query("name"),
    order: str = Query("asc"),
):
    query = db.query(models.HostedZone).filter(
        models.HostedZone.session_id == active.id
    )

    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                models.HostedZone.name.ilike(term),
                models.HostedZone.zone_id.ilike(term),
                models.HostedZone.comment.ilike(term),
            )
        )

    # Per-property filters (string: case-insensitive contains)
    if name:
        query = query.filter(models.HostedZone.name.ilike(f"%{name.strip().lower()}%"))
    if type:
        query = query.filter(models.HostedZone.type == type.strip())
    if description:
        query = query.filter(models.HostedZone.comment.ilike(f"%{description.strip()}%"))
    if zone_id:
        query = query.filter(models.HostedZone.zone_id.ilike(f"%{zone_id.strip()}%"))

    # created_by is a constant value; if it doesn't match, return empty.
    if created_by and created_by.strip().lower() not in CREATED_BY_VALUE.lower():
        return {"items": [], "total": 0, "page": page, "page_size": page_size}

    sort_col = {
        "name": models.HostedZone.name,
        "type": models.HostedZone.type,
        "created_at": models.HostedZone.created_at,
    }.get(sort, models.HostedZone.name)
    sort_col = sort_col.desc() if order == "desc" else sort_col.asc()
    query = query.order_by(sort_col)

    # record_count is a computed property, not a column -> filter in Python.
    rc_filter = None
    if record_count.strip().isdigit():
        rc_filter = int(record_count.strip())

    if rc_filter is not None:
        rows = [z for z in query.all() if z.record_count == rc_filter]
        total = len(rows)
        items = rows[(page - 1) * page_size : (page - 1) * page_size + page_size]
    else:
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=schemas.HostedZoneOut, status_code=201)
def create_zone(
    payload: schemas.HostedZoneCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    existing = (
        db.query(models.HostedZone)
        .filter(
            models.HostedZone.name == payload.name,
            models.HostedZone.session_id == active.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="A hosted zone with this name already exists")

    private = payload.type == "Private"
    zone = models.HostedZone(
        session_id=active.id,
        zone_id=_unique_zone_id(db),
        name=payload.name,
        type=payload.type,
        comment=payload.comment or "",
        private=private,
    )
    db.add(zone)
    db.flush()

    # Route53 auto-creates NS and SOA records for a new zone.
    ns_record = models.DnsRecord(
        zone_id=zone.id,
        name=zone.name,
        type="NS",
        ttl=172800,
        value="\n".join(
            [
                "ns-1.awsdns-00.org.",
                "ns-2.awsdns-01.co.uk.",
                "ns-3.awsdns-02.com.",
                "ns-4.awsdns-03.net.",
            ]
        ),
        routing_policy="Simple",
    )
    soa_record = models.DnsRecord(
        zone_id=zone.id,
        name=zone.name,
        type="SOA",
        ttl=900,
        value="ns-1.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
        routing_policy="Simple",
    )
    db.add_all([ns_record, soa_record])
    db.commit()
    db.refresh(zone)
    return zone


def _get_scoped_zone(db: Session, zone_id: str, session_id: str):
    return (
        db.query(models.HostedZone)
        .filter(
            models.HostedZone.id == zone_id,
            models.HostedZone.session_id == session_id,
        )
        .first()
    )


@router.get("/{zone_id}", response_model=schemas.HostedZoneOut)
def get_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    zone = _get_scoped_zone(db, zone_id, active.id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


@router.put("/{zone_id}", response_model=schemas.HostedZoneOut)
def update_zone(
    zone_id: str,
    payload: schemas.HostedZoneUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    zone = _get_scoped_zone(db, zone_id, active.id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    if payload.comment is not None:
        zone.comment = payload.comment
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=204)
def delete_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    zone = _get_scoped_zone(db, zone_id, active.id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    db.delete(zone)
    db.commit()
    return None


@router.post("/{zone_id}/import", response_model=schemas.ImportResult)
def import_records(
    zone_id: str,
    payload: schemas.ImportRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    """Import DNS records from a BIND zone file body into this zone."""
    zone = _get_scoped_zone(db, zone_id, active.id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    parsed, errors = bind.parse_zone(payload.content, zone.name)

    # Existing (name, type) pairs in the zone, to skip duplicates.
    existing = {
        (r.name, r.type)
        for r in db.query(models.DnsRecord)
        .filter(models.DnsRecord.zone_id == zone_id)
        .all()
    }
    seen = set(existing)

    created = 0
    skipped = 0
    for pr in parsed:
        key = (pr.name, pr.type)
        if key in seen:
            skipped += 1
            errors.append(f"duplicate name+type skipped: {pr.name} {pr.type}")
            continue
        seen.add(key)
        db.add(
            models.DnsRecord(
                zone_id=zone_id,
                name=pr.name,
                type=pr.type,
                ttl=pr.ttl,
                value=pr.value,
                routing_policy="Simple",
            )
        )
        created += 1

    db.commit()
    return {"created": created, "skipped": skipped, "errors": errors}


@router.get("/{zone_id}/export")
def export_zone(
    zone_id: str,
    format: str = Query("json"),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    active=Depends(require_active_session),
):
    """Export a zone + its records as JSON or a BIND zone file."""
    zone = _get_scoped_zone(db, zone_id, active.id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    records = (
        db.query(models.DnsRecord)
        .filter(models.DnsRecord.zone_id == zone_id)
        .order_by(models.DnsRecord.name.asc())
        .all()
    )
    zone_base = zone.name.rstrip(".")

    if format == "bind":
        text = bind.render_zone(zone.name, 300, records)
        return PlainTextResponse(
            content=text,
            media_type="text/plain",
            headers={
                "Content-Disposition": f'attachment; filename="{zone_base}.zone"'
            },
        )

    # default: json
    data = {
        "zone": schemas.HostedZoneOut.model_validate(zone).model_dump(mode="json"),
        "records": [
            schemas.DnsRecordOut.model_validate(r).model_dump(mode="json")
            for r in records
        ],
    }
    return JSONResponse(
        content=json.loads(json.dumps(data)),
        headers={
            "Content-Disposition": f'attachment; filename="{zone_base}.json"'
        },
    )
