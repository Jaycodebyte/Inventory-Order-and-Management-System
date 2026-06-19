from pydantic import BaseModel, Field, ConfigDict, model_validator
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from app.schemas.product import ProductResponse
from app.schemas.customer import CustomerResponse

class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, description="Quantity must be greater than zero")

class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    # Traditional structured items list
    items: Optional[List[OrderItemCreate]] = Field(default=None, description="List of items in the order")
    
    # Flat format option for specific API requirements
    products: Optional[List[int]] = Field(default=None, description="Flat list of product IDs")
    quantity: Optional[int] = Field(default=None, description="Quantity applied if products is specified")

    @model_validator(mode='after')
    def validate_items_or_products(self):
        if not self.items and not self.products:
            raise ValueError("Either 'items' or 'products' must be provided")
        return self

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
