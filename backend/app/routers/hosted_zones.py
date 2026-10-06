"""Hosted Zone CRUD routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..utils import generate_zone_id

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


def _unique_zone_id(db: Session) -> str:
    while True:
        zid = generate_zone_id()
        if not db.query(models.HostedZone).filter(models.HostedZone.zone_id == zid).first():
            return zid


@router.get("", response_model=schemas.PaginatedZones)
def list_zones(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
    search: str = Query("", description="Search by domain name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort: str = Query("name"),
    order: str = Query("asc"),
):
    query = db.query(models.HostedZone)
    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                models.HostedZone.name.ilike(term),
                models.HostedZone.zone_id.ilike(term),
                models.HostedZone.comment.ilike(term),
            )
        )

    sort_col = {
        "name": models.HostedZone.name,
        "type": models.HostedZone.type,
        "created_at": models.HostedZone.created_at,
    }.get(sort, models.HostedZone.name)
    sort_col = sort_col.desc() if order == "desc" else sort_col.asc()
    query = query.order_by(sort_col)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=schemas.HostedZoneOut, status_code=201)
def create_zone(
    payload: schemas.HostedZoneCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    existing = db.query(models.HostedZone).filter(models.HostedZone.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="A hosted zone with this name already exists")

    private = payload.type == "Private"
    zone = models.HostedZone(
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
        type="TXT",
        ttl=900,
        value='"SOA ns-1.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"',
        routing_policy="Simple",
    )
    db.add_all([ns_record, soa_record])
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/{zone_id}", response_model=schemas.HostedZoneOut)
def get_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


@router.put("/{zone_id}", response_model=schemas.HostedZoneOut)
def update_zone(
    zone_id: str,
    payload: schemas.HostedZoneUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
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
):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    db.delete(zone)
    db.commit()
    return None
