"""Seed the database with a default user and sample data."""
from passlib.hash import pbkdf2_sha256
from sqlalchemy.orm import Session

from . import models
from .database import SessionLocal
from .utils import generate_zone_id


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

        # Default session ("First Principles") for the admin user
        user = db.query(models.User).filter(models.User.username == "admin").first()
        session = (
            db.query(models.AccountSession)
            .filter(models.AccountSession.user_id == user.id)
            .first()
        )
        if not session:
            session = models.AccountSession(user_id=user.id, name="First Principles")
            db.add(session)
            db.commit()
            db.refresh(session)

        # Sample hosted zones (scoped to the default session)
        if not db.query(models.HostedZone).first():
            samples = [
                ("example.com.", "Public", "Primary company domain"),
                ("myapp.io.", "Public", "Production application domain"),
                ("internal.local.", "Private", "Internal services"),
            ]
            for name, ztype, comment in samples:
                zone = models.HostedZone(
                    session_id=session.id,
                    zone_id=generate_zone_id(),
                    name=name,
                    type=ztype,
                    comment=comment,
                    private=(ztype == "Private"),
                )
                db.add(zone)
                db.flush()

                records = [
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
                        zone_id=zone.id, name=name, type="A", ttl=300,
                        value="192.0.2.1",
                    ),
                    models.DnsRecord(
                        zone_id=zone.id, name=f"www.{name}", type="CNAME", ttl=300,
                        value=name,
                    ),
                    models.DnsRecord(
                        zone_id=zone.id, name=f"mail.{name}", type="MX", ttl=3600,
                        value="10 mailserver.example.com.",
                    ),
                ]
                db.add_all(records)
            db.commit()
    finally:
        db.close()
