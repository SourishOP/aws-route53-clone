"""Seed the database with a default user and sample data.

Two sessions are seeded under the one admin account, each with its OWN distinct
hosted zones, so a reviewer can immediately verify that sessions are isolated
(switching sessions shows a different set of zones).
"""
from passlib.hash import pbkdf2_sha256
from sqlalchemy.orm import Session

from . import models
from .database import SessionLocal
from .utils import generate_zone_id


def _add_zone(db: Session, session_id: str, name: str, ztype: str, comment: str,
              a_value: str, mx_value: str) -> None:
    """Create one hosted zone (scoped to a session) with starter records."""
    zone = models.HostedZone(
        session_id=session_id,
        zone_id=generate_zone_id(),
        name=name,
        type=ztype,
        comment=comment,
        private=(ztype == "Private"),
    )
    db.add(zone)
    db.flush()

    db.add_all([
        models.DnsRecord(
            zone_id=zone.id, name=name, type="NS", ttl=172800,
            value="\n".join([
                "ns-1.awsdns-00.org.",
                "ns-2.awsdns-01.co.uk.",
                "ns-3.awsdns-02.com.",
                "ns-4.awsdns-03.net.",
            ]),
        ),
        models.DnsRecord(
            zone_id=zone.id, name=name, type="SOA", ttl=900,
            value="ns-1.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
        ),
        models.DnsRecord(
            zone_id=zone.id, name=name, type="A", ttl=300, value=a_value,
        ),
        models.DnsRecord(
            zone_id=zone.id, name=f"www.{name}", type="CNAME", ttl=300, value=name,
        ),
        models.DnsRecord(
            zone_id=zone.id, name=f"mail.{name}", type="MX", ttl=3600, value=mx_value,
        ),
    ])


def seed_if_empty() -> None:
    db: Session = SessionLocal()
    try:
        # Default user
        if not db.query(models.User).first():
            user = models.User(
                username="admin",
                password_hash=pbkdf2_sha256.hash("admin"),
                account_id="123456789012",
            )
            db.add(user)
            db.commit()

        user = db.query(models.User).filter(models.User.username == "admin").first()

        # Only seed sessions/zones once (when there are none yet).
        if db.query(models.HostedZone).first():
            return

        # --- Session 1: First Principles ---
        s1 = models.AccountSession(user_id=user.id, name="First Principles")
        db.add(s1)
        db.flush()
        _add_zone(db, s1.id, "example.com.", "Public",
                  "Primary company domain", "192.0.2.1", "10 mailserver.example.com.")
        _add_zone(db, s1.id, "myapp.io.", "Public",
                  "Production application domain", "192.0.2.2", "10 mail.myapp.io.")
        _add_zone(db, s1.id, "internal.local.", "Private",
                  "Internal services", "10.0.0.5", "10 mail.internal.local.")

        # --- Session 2: Production Account (different zones) ---
        s2 = models.AccountSession(user_id=user.id, name="Production Account")
        db.add(s2)
        db.flush()
        _add_zone(db, s2.id, "acme-corp.com.", "Public",
                  "Acme corporate site", "198.51.100.10", "10 mail.acme-corp.com.")
        _add_zone(db, s2.id, "shop-acme.net.", "Public",
                  "E-commerce storefront", "198.51.100.20", "10 mail.shop-acme.net.")
        _add_zone(db, s2.id, "vpc-internal.aws.", "Private",
                  "Private VPC zone", "10.1.2.3", "10 mail.vpc-internal.aws.")

        db.commit()
    finally:
        db.close()
