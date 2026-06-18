"""Tests for the core business rules. Runs against an in-memory SQLite DB so
no PostgreSQL instance is required:  pytest

Note: SQLite ignores `with_for_update()` row locking, which is fine for unit
testing the validation logic; PostgreSQL enforces it in production.
"""
import os

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import database
from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_unique_sku(client):
    p = {"sku": "A1", "name": "Widget", "price": 5, "stock_quantity": 10}
    assert client.post("/products", json=p).status_code == 201
    assert client.post("/products", json=p).status_code == 409


def test_unique_email(client):
    c = {"name": "Jane", "email": "jane@example.com"}
    assert client.post("/customers", json=c).status_code == 201
    assert client.post("/customers", json=c).status_code == 409


def test_order_reduces_stock(client):
    pid = client.post("/products", json={"sku": "B1", "name": "Item", "price": 10,
                                             "stock_quantity": 5}).json()["id"]
    cid = client.post("/customers", json={"name": "Joe", "email": "joe@example.com"}).json()["id"]

    resp = client.post("/orders", json={"customer_id": cid,
                                            "items": [{"product_id": pid, "quantity": 3}]})
    assert resp.status_code == 201
    assert resp.json()["total_amount"] == "30.00"
    assert client.get(f"/products/{pid}").json()["stock_quantity"] == 2


def test_order_rejected_when_insufficient_stock(client):
    pid = client.post("/products", json={"sku": "C1", "name": "Rare", "price": 10,
                                             "stock_quantity": 1}).json()["id"]
    cid = client.post("/customers", json={"name": "Sue", "email": "sue@example.com"}).json()["id"]

    resp = client.post("/orders", json={"customer_id": cid,
                                            "items": [{"product_id": pid, "quantity": 5}]})
    assert resp.status_code == 400
    assert "Insufficient stock" in resp.json()["detail"]
    # Stock must remain unchanged after a rejected order.
    assert client.get(f"/products/{pid}").json()["stock_quantity"] == 1


def test_cancel_order_restores_stock(client):
    pid = client.post("/products", json={"sku": "D1", "name": "Pen", "price": 2,
                                         "stock_quantity": 10}).json()["id"]
    cid = client.post("/customers", json={"name": "Dan", "email": "dan@example.com"}).json()["id"]
    oid = client.post("/orders", json={"customer_id": cid,
                                       "items": [{"product_id": pid, "quantity": 4}]}).json()["id"]
    assert client.get(f"/products/{pid}").json()["stock_quantity"] == 6

    assert client.delete(f"/orders/{oid}").status_code == 204
    # Cancelling returns the reserved stock.
    assert client.get(f"/products/{pid}").json()["stock_quantity"] == 10
    assert client.get(f"/orders/{oid}").status_code == 404


def test_stats(client):
    client.post("/products", json={"sku": "E1", "name": "Low", "price": 1, "stock_quantity": 2})
    client.post("/products", json={"sku": "E2", "name": "High", "price": 1, "stock_quantity": 500})
    client.post("/customers", json={"name": "Eve", "email": "eve@example.com"})

    s = client.get("/stats").json()
    assert s["total_products"] == 2
    assert s["total_customers"] == 1
    assert s["total_orders"] == 0
    # Only the low-stock product is flagged.
    skus = [p["sku"] for p in s["low_stock_products"]]
    assert "E1" in skus and "E2" not in skus
