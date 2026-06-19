from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app.models.product import Product
from app.models.order_item import OrderItem
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from typing import List, Optional, Literal

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    # Validate SKU uniqueness
    db_product = db.query(Product).filter(Product.sku == product_in.sku.strip()).first()
    if db_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product SKU '{product_in.sku}' already exists"
        )
    
    product = Product(
        name=product_in.name.strip(),
        sku=product_in.sku.strip(),
        price=product_in.price,
        quantity_in_stock=product_in.quantity_in_stock
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("", response_model=List[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: Literal["id", "name", "sku", "price", "quantity_in_stock", "created_at", "updated_at"] = Query("created_at"),
    sort_order: Literal["asc", "desc"] = Query("desc")
):
    query = db.query(Product)
    
    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.sku.ilike(search_term)
            )
        )
    
    # Sorting column map
    sort_columns = {
        "id": Product.id,
        "name": Product.name,
        "sku": Product.sku,
        "price": Product.price,
        "quantity_in_stock": Product.quantity_in_stock,
        "created_at": Product.created_at,
        "updated_at": Product.updated_at
    }
    
    sort_col = sort_columns.get(sort_by, Product.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))
        
    return query.offset(skip).limit(limit).all()

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
        
    # Check duplicate SKU if SKU is changing
    if product_in.sku and product_in.sku.strip() != product.sku:
        existing = db.query(Product).filter(Product.sku == product_in.sku.strip()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product SKU '{product_in.sku}' is already taken"
            )

    # Apply updates
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
        
    # Check if product is referenced in order items (to prevent database foreign key violations)
    is_ordered = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
    if is_ordered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete product '{product.name}' because it has been ordered in history. Consider adjusting stock quantity instead."
        )
        
    db.delete(product)
    db.commit()
    return None
