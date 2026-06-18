"""Optional helper to populate the database with sample data.

Run inside the backend container:  python seed.py
"""
from decimal import Decimal

from app.database import Base, SessionLocal, engine
from app.models import Customer, Product

Base.metadata.create_all(bind=engine)


def run() -> None:
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            db.add_all(
                [
                    Product(sku="SKU-001", name="Wireless Mouse", description="Ergonomic mouse",
                            price=Decimal("24.99"), stock_quantity=100),
                    Product(sku="SKU-002", name="Mechanical Keyboard", description="RGB keyboard",
                            price=Decimal("79.50"), stock_quantity=40),
                    Product(sku="SKU-003", name="USB-C Hub", description="7-in-1 hub",
                            price=Decimal("39.00"), stock_quantity=8),
                    Product(sku="SKU-004", name="Laptop Stand", description="Aluminium stand",
                            price=Decimal("49.99"), stock_quantity=3),
                    Product(sku="SKU-005", name="Webcam 1080p", description="Full-HD webcam",
                            price=Decimal("59.00"), stock_quantity=0),
                ]
            )
        if db.query(Customer).count() == 0:
            db.add_all(
                [
                    Customer(name="Alice Johnson", email="alice@example.com", phone="555-0101"),
                    Customer(name="Bob Smith", email="bob@example.com", phone="555-0102"),
                ]
            )
        db.commit()
        print("Seed data inserted.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
