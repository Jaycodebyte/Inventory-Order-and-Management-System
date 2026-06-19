from app.routers.products import router as products_router
from app.routers.customers import router as customers_router
from app.routers.orders import router as orders_router

__all__ = ["products_router", "customers_router", "orders_router"]
