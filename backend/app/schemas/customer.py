from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional
import re

class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., description="Customer email address")
    phone: Optional[str] = Field(None, max_length=50)

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, value: str) -> str:
        # Standard robust email regex validation
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_regex, value):
            raise ValueError("Invalid email format")
        return value.lower().strip()

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
