from sqlalchemy.orm import Session
from sqlalchemy import inspect
from fastapi import HTTPException, status
from app.models import Product, Customer, Order, OrderItem
from app.schemas.order import OrderCreate, OrderItemCreate
from decimal import Decimal

def place_order(db: Session, order_data: OrderCreate) -> Order:
    # 1. Validate customer exists
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_data.customer_id} not found"
        )

    # 2. Process order items based on the provided format
    items_to_process = []
    
    if order_data.items:
        items_to_process = order_data.items
    elif order_data.products is not None:
        qty = order_data.quantity if order_data.quantity is not None else 1
        # Convert flat lists products and quantity to list of items
        items_to_process = [
            # Ensure quantity is positive
            OrderItemCreate(product_id=p_id, quantity=qty)
            for p_id in order_data.products
        ]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain either 'items' or 'products'"
        )

    if not items_to_process:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be empty"
        )

    # 3. Consolidate items if duplicate products are sent in the same request to avoid locking issues
    consolidated_items = {}
    for item in items_to_process:
        if item.product_id in consolidated_items:
            consolidated_items[item.product_id] += item.quantity
        else:
            consolidated_items[item.product_id] = item.quantity

    # 4. Lock and validate products in ascending ID order to prevent database deadlocks!
    sorted_product_ids = sorted(consolidated_items.keys())
    
    # Query products (apply row-locking only if NOT SQLite dialect)
    query = db.query(Product).filter(Product.id.in_(sorted_product_ids))
    dialect_name = inspect(db.get_bind()).dialect.name
    if dialect_name != "sqlite":
        query = query.with_for_update()
    db_products = query.all()
    
    product_map = {p.id: p for p in db_products}
    
    # Check if all products exist
    for p_id in sorted_product_ids:
        if p_id not in product_map:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {p_id} not found"
            )

    # 5. Check stock levels and compute total order amount
    total_amount = Decimal('0.00')
    items_to_create = []
    
    for p_id, quantity in consolidated_items.items():
        product = product_map[p_id]
        
        # Check sufficient stock
        if product.quantity_in_stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Requested: {quantity}, Available: {product.quantity_in_stock}"
            )
            
        # Decrement stock
        product.quantity_in_stock -= quantity
        
        # Calculate item price
        item_total = product.price * quantity
        total_amount += item_total
        
        # Prepare OrderItem record
        items_to_create.append(
            OrderItem(
                product_id=p_id,
                quantity=quantity,
                unit_price=product.price
            )
        )

    # 6. Create the Order
    db_order = Order(
        customer_id=order_data.customer_id,
        total_amount=total_amount,
        items=items_to_create
    )
    
    db.add(db_order)
    try:
        db.commit()
        db.refresh(db_order)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while placing the order. Please try again."
        )
    
    return db_order
