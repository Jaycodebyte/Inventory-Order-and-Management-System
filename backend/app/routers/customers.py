from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse
from typing import List, Optional

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    # Validate email uniqueness
    normalized_email = customer_in.email.strip().lower()
    existing = db.query(Customer).filter(Customer.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer_in.email}' already exists"
        )
        
    customer = Customer(
        full_name=customer_in.full_name.strip(),
        email=normalized_email,
        phone=customer_in.phone.strip() if customer_in.phone else None
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.get("", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None)
):
    query = db.query(Customer)
    
    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Customer.full_name.ilike(search_term),
                Customer.email.ilike(search_term),
                Customer.phone.ilike(search_term)
            )
        )
        
    return query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
        
    # Check if customer has orders
    from app.models.order import Order
    has_orders = db.query(Order).filter(Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete customer '{customer.full_name}' because they have associated orders in history. Consider deactivating instead."
        )
        
    db.delete(customer)
    db.commit()
    return None
