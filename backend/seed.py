# seed.py
# Populates the database with initial test data.
# Run once after migrations. Safe to run multiple times.

import sys
import bcrypt
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Client, RateCard
from app.config import get_settings


def hash_password(password: str) -> str:
    """
    Hashes password using bcrypt directly.
    Using bcrypt library directly instead of passlib
    because of a version compatibility issue between
    passlib 1.7.4 and bcrypt 4.x
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def seed_users(db: Session):
    """Creates the two test users."""
    print("👥 Seeding users...")

    if db.query(User).filter(User.email == "crm@test.com").first():
        print("  ⚠️  Users already exist, skipping...")
        return

    users = [
        User(
            name="John Smith",
            email="crm@test.com",
            password_hash=hash_password("password123"),
            role="crm",
            business_unit="Technology"
        ),
        User(
            name="Jane Doe",
            email="approver@test.com",
            password_hash=hash_password("password123"),
            role="approver",
            business_unit="Management"
        )
    ]

    db.add_all(users)
    db.flush()
    print(f"  ✓ Created {len(users)} users")
    return users


def seed_clients(db: Session):
    """Creates mock client companies."""
    print("🏢 Seeding clients...")

    if db.query(Client).first():
        print("  ⚠️  Clients already exist, skipping...")
        return

    clients = [
        Client(
            legal_entity_name="ABC Corporation Ltd",
            registered_address="123 Business Park, Mumbai, MH 400001",
            billing_address=None,
            mode_of_payment="Bank Transfer",
            gst_number="27AABCU9603R1ZX",
            billing_currency="INR",
            contact_name="Raj Mehta",
            contact_designation="CFO",
            contact_phone="+91 98765 43210",
            contact_email="raj.mehta@abccorp.com"
        ),
        Client(
            legal_entity_name="XYZ Solutions Pvt Ltd",
            registered_address="456 Tech Hub, Bangalore, KA 560001",
            billing_address="456 Tech Hub, Bangalore, KA 560001",
            mode_of_payment="Credit Card",
            gst_number="29AABCX1234R1ZY",
            billing_currency="USD",
            contact_name="Priya Sharma",
            contact_designation="CEO",
            contact_phone="+91 99887 76655",
            contact_email="priya@xyzsolutions.com"
        ),
        Client(
            legal_entity_name="DEF Industries Ltd",
            registered_address="789 Industrial Area, Pune, MH 411001",
            billing_address=None,
            mode_of_payment="Cheque",
            gst_number="27AABCD5678R1ZZ",
            billing_currency="INR",
            contact_name="Amit Kumar",
            contact_designation="Managing Director",
            contact_phone="+91 91234 56789",
            contact_email="amit@defindustries.com"
        )
    ]

    db.add_all(clients)
    db.flush()
    print(f"  ✓ Created {len(clients)} clients")
    return clients


def seed_rate_cards(db: Session):
    """Creates the pricing catalog."""
    print("💰 Seeding rate cards...")

    if db.query(RateCard).first():
        print("  ⚠️  Rate cards already exist, skipping...")
        return

    rate_cards = [
        RateCard(
            title="Junior Developer",
            rate=50,
            currency="USD",
            unit="per hour"
        ),
        RateCard(
            title="Senior Developer",
            rate=150,
            currency="USD",
            unit="per hour"
        ),
        RateCard(
            title="Project Manager",
            rate=120,
            currency="USD",
            unit="per hour"
        ),
        RateCard(
            title="UI/UX Designer",
            rate=80,
            currency="USD",
            unit="per hour"
        ),
        RateCard(
            title="QA Engineer",
            rate=60,
            currency="USD",
            unit="per hour"
        ),
        RateCard(
            title="DevOps Engineer",
            rate=130,
            currency="USD",
            unit="per hour"
        ),
        RateCard(
            title="Business Analyst",
            rate=90,
            currency="USD",
            unit="per hour"
        ),
        RateCard(
            title="Technical Architect",
            rate=200,
            currency="USD",
            unit="per hour"
        ),
    ]

    db.add_all(rate_cards)
    db.flush()
    print(f"  ✓ Created {len(rate_cards)} rate cards")
    return rate_cards


def main():
    """Main seed entry point."""
    print("\n" + "=" * 50)
    print("🌱  Starting Database Seed...")
    print("=" * 50 + "\n")

    db = SessionLocal()

    try:
        seed_users(db)
        seed_clients(db)
        seed_rate_cards(db)

        db.commit()

        print("\n" + "=" * 50)
        print("✅  Seed Complete!")
        print("=" * 50)
        print("\n📋 Test Credentials:")
        print("   CRM User:  crm@test.com / password123")
        print("   Approver:  approver@test.com / password123")
        print("\n🏢 Clients Created:")
        print("   - ABC Corporation Ltd")
        print("   - XYZ Solutions Pvt Ltd")
        print("   - DEF Industries Ltd")
        print("\n💰 Rate Cards: 8 roles loaded\n")

    except Exception as e:
        print(f"\n❌ Seed failed: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()