from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from typing import Dict, Any
import logging

from app.config import settings
from app.database import get_db
from app.routers import products_router, customers_router, orders_router
from app.models import Product, Customer, Order

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for the Inventory & Order Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = []
if settings.BACKEND_CORS_ORIGINS:
    # Handle wildcard or clean comma-separated lists
    if "*" in settings.BACKEND_CORS_ORIGINS:
        origins = ["*"]
    else:
        origins = [str(origin).strip() for origin in settings.BACKEND_CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/health", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    db_status = "unhealthy"
    try:
        # Check connection database
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "service": "api"
    }

# Dashboard Aggregated Stats Endpoint
@app.get("/api/dashboard/stats", status_code=status.HTTP_200_OK)
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        total_products = db.query(Product).count()
        total_customers = db.query(Customer).count()
        total_orders = db.query(Order).count()
        
        # Low stock threshold = 10
        low_stock_threshold = 10
        low_stock_products = (
            db.query(Product)
            .filter(Product.quantity_in_stock < low_stock_threshold)
            .order_by(Product.quantity_in_stock.asc())
            .all()
        )
        
        # Map low stock products to pydantic-friendly json
        low_stock_list = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "price": float(p.price),
                "quantity_in_stock": p.quantity_in_stock
            }
            for p in low_stock_products
        ]

        return {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "low_stock_count": len(low_stock_list),
            "low_stock_products": low_stock_list
        }
    except Exception as e:
        logger.exception("Failed to fetch dashboard stats")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard stats"
        )

# Include Routers
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(customers_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Inventory & Order Management System API",
        "docs": "/docs",
        "health": "/health"
    }
