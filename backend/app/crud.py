"""Database operations and business-rule enforcement.

Business rules implemented here:
  * Unique product SKUs and unique customer emails (raises 409 on conflict).
  * Inventory validation: an order is rejected when any line item requests
    more units than are in stock.
  * Automatic stock reduction: confirming an order atomically decrements
    product stock within the same transaction.
"""
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models, schemas


# ---------- Products ----------
def list_products(db: Session) -> list[models.Product]:
    return list(db.scalars(select(models.Product).order_by(models.Product.id)))


def get_product(db: Session, product_id: int) -> models.Product:
    product = db.get(models.Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product


def create_product(db: Session, data: schemas.ProductCreate) -> models.Product:
    exists = db.scalar(select(models.Product).where(models.Product.sku == data.sku))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, f"SKU '{data.sku}' already exists")
    product = models.Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, data: schemas.ProductUpdate) -> models.Product:
    product = get_product(db, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()


# ---------- Customers ----------
def list_customers(db: Session) -> list[models.Customer]:
    return list(db.scalars(select(models.Customer).order_by(models.Customer.id)))


def get_customer(db: Session, customer_id: int) -> models.Customer:
    customer = db.get(models.Customer, customer_id)
    if customer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Customer not found")
    return customer


def create_customer(db: Session, data: schemas.CustomerCreate) -> models.Customer:
    exists = db.scalar(select(models.Customer).where(models.Customer.email == data.email))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Email '{data.email}' already exists")
    customer = models.Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_customer(db: Session, customer_id: int, data: schemas.CustomerUpdate) -> models.Customer:
    customer = get_customer(db, customer_id)
    payload = data.model_dump(exclude_unset=True)
    new_email = payload.get("email")
    if new_email and new_email != customer.email:
        clash = db.scalar(select(models.Customer).where(models.Customer.email == new_email))
        if clash:
            raise HTTPException(status.HTTP_409_CONFLICT, f"Email '{new_email}' already exists")
    for field, value in payload.items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer(db, customer_id)
    db.delete(customer)
    db.commit()


# ---------- Orders ----------
def list_orders(db: Session) -> list[models.Order]:
    return list(db.scalars(select(models.Order).order_by(models.Order.id.desc())))


def get_order(db: Session, order_id: int) -> models.Order:
    order = db.get(models.Order, order_id)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


def create_order(db: Session, data: schemas.OrderCreate) -> models.Order:
    # Validate customer exists.
    get_customer(db, data.customer_id)

    # Collapse duplicate product lines so stock is validated against the total.
    requested: dict[int, int] = {}
    for item in data.items:
        requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

    # Lock product rows for the duration of the transaction to avoid races.
    products: dict[int, models.Product] = {}
    for product_id, qty in requested.items():
        product = db.scalar(
            select(models.Product).where(models.Product.id == product_id).with_for_update()
        )
        if product is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Product {product_id} not found")
        if product.stock_quantity < qty:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Insufficient stock for product '{product.name}' (SKU {product.sku}): "
                f"requested {qty}, available {product.stock_quantity}",
            )
        products[product_id] = product

    # All validations passed — build the order, reduce stock atomically.
    order = models.Order(customer_id=data.customer_id, status="confirmed", total_amount=Decimal("0"))
    total = Decimal("0")
    for product_id, qty in requested.items():
        product = products[product_id]
        product.stock_quantity -= qty
        line_total = Decimal(product.price) * qty
        total += line_total
        order.items.append(
            models.OrderItem(product_id=product_id, quantity=qty, unit_price=product.price)
        )
    order.total_amount = total

    db.add(order)
    db.commit()
    db.refresh(order)
    return order
