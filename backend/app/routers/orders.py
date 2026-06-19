from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import inspect
from app.database import get_db
from app.models.order import Order
from app.models.product import Product
from app.models.order_item import OrderItem
from app.schemas.order import OrderCreate, OrderResponse
from app.services.inventory_service import place_order
from typing import List, Optional

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    # Delegated to transactional inventory service
    return place_order(db=db, order_data=order_in)

@router.get("", response_model=List[OrderResponse])
def get_orders(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product)
        )
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product)
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    return order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    # Restoring stock on order deletion is standard professional business logic
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )

    try:
        # Load and lock order items to restore stock
        items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
        dialect_name = inspect(db.get_bind()).dialect.name
        for item in items:
            query = db.query(Product).filter(Product.id == item.product_id)
            if dialect_name != "sqlite":
                query = query.with_for_update()
            product = query.first()
            if product:
                product.quantity_in_stock += item.quantity
        
        # Delete order (will cascade delete order items)
        db.delete(order)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the order"
        )
        
    return None
