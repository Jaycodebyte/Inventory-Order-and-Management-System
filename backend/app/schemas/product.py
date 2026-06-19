from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from datetime import datetime
from typing import Optional

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    sku: str = Field(..., min_length=2, max_length=100, description="Unique Stock Keeping Unit (SKU)")
    price: Decimal = Field(..., gt=Decimal('0.00'), max_digits=10, decimal_places=2, description="Price must be positive")
    quantity_in_stock: int = Field(default=0, ge=0, description="Quantity in stock must be non-negative")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=2, max_length=100)
    price: Optional[Decimal] = Field(None, gt=Decimal('0.00'), max_digits=10, decimal_places=2)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
