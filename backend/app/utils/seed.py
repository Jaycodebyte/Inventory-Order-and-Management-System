import os
import sys
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session

# Add parent directory to sys.path so app can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.database import SessionLocal, Base, engine
from app.models import Product, Customer, Order, OrderItem

def seed_db():
    print("Initializing Database Seeding...")
    db: Session = SessionLocal()
    
    try:
        # Check if products already exist
        product_count = db.query(Product).count()
        if product_count > 0:
            print("Database already has data. Skipping seed script.")
            return

        print("Seeding initial products...")
        now = datetime.now(timezone.utc)
        products_data = [
            {"name": "LG UltraWide 34\" QHD Monitor", "sku": "MON-LG-UW34", "price": Decimal("45999.00"), "quantity_in_stock": 15, "created_at": now, "updated_at": now},
            {"name": "Logitech Mechanical Keyboard (Brown Switches)", "sku": "KEY-LOG-BRN", "price": Decimal("7499.00"), "quantity_in_stock": 8, "created_at": now, "updated_at": now},
            {"name": "HP Wireless Ergonomic Mouse", "sku": "MSE-HP-WRL", "price": Decimal("3999.00"), "quantity_in_stock": 25, "created_at": now, "updated_at": now},
            {"name": "Portronics USB-C Hub (8-in-1)", "sku": "HUB-PORT-8", "price": Decimal("2999.00"), "quantity_in_stock": 5, "created_at": now, "updated_at": now},
            {"name": "Sony WH-1000XM5 Headphones", "sku": "AUD-SONY-XM5", "price": Decimal("24990.00"), "quantity_in_stock": 12, "created_at": now, "updated_at": now},
            {"name": "Starbucks Coffee Mug (500ml)", "sku": "MUG-SBUX-500", "price": Decimal("1299.00"), "quantity_in_stock": 4, "created_at": now, "updated_at": now},
            {"name": "Feetech Adjustable Standing Desk", "sku": "DSK-FEET-ADJ", "price": Decimal("28999.00"), "quantity_in_stock": 20, "created_at": now, "updated_at": now},
            {"name": "Green Soul Ergonomic Office Chair", "sku": "CHR-GS-ERG", "price": Decimal("18499.00"), "quantity_in_stock": 3, "created_at": now, "updated_at": now},
        ]
        
        db_products = []
        for p in products_data:
            prod = Product(**p)
            db.add(prod)
            db_products.append(prod)
        db.commit()
        print(f"Successfully seeded {len(db_products)} products.")

        print("Seeding initial customers...")
        customers_data = [
            {"full_name": "Amit Sharma", "email": "amit.sharma@gmail.com", "phone": "+91-98765-43210", "created_at": now},
            {"full_name": "Priya Patel", "email": "priya.patel@outlook.com", "phone": "+91-98234-56789", "created_at": now},
            {"full_name": "Rahul Verma", "email": "rahul.verma@yahoo.com", "phone": "+91-99112-33445", "created_at": now},
            {"full_name": "Sneha Gupta", "email": "sneha.gupta@gmail.com", "phone": "+91-97654-32109", "created_at": now},
        ]
        
        db_customers = []
        for c in customers_data:
            cust = Customer(**c)
            db.add(cust)
            db_customers.append(cust)
        db.commit()
        print(f"Successfully seeded {len(db_customers)} customers.")

        print("Seeding initial orders...")
        
        # Order 1: Amit orders a monitor and keyboard
        order1 = Order(customer_id=db_customers[0].id, total_amount=Decimal("53498.00"), created_at=now)
        db.add(order1)
        db.flush() # get order id
        
        item1_1 = OrderItem(order_id=order1.id, product_id=db_products[0].id, quantity=1, unit_price=db_products[0].price)
        item1_2 = OrderItem(order_id=order1.id, product_id=db_products[1].id, quantity=1, unit_price=db_products[1].price)
        db.add_all([item1_1, item1_2])
        
        # Decrement stock for order1
        db_products[0].quantity_in_stock -= 1
        db_products[1].quantity_in_stock -= 1

        # Order 2: Priya orders an ergonomic chair and usb-c hub
        order2 = Order(customer_id=db_customers[1].id, total_amount=Decimal("24497.00"), created_at=now)
        db.add(order2)
        db.flush()
        
        item2_1 = OrderItem(order_id=order2.id, product_id=db_products[7].id, quantity=1, unit_price=db_products[7].price)
        item2_2 = OrderItem(order_id=order2.id, product_id=db_products[3].id, quantity=2, unit_price=db_products[3].price)
        db.add_all([item2_1, item2_2])
        
        # Decrement stock for order2
        db_products[7].quantity_in_stock -= 1
        db_products[3].quantity_in_stock -= 2

        # Order 3: Rahul orders headphones
        order3 = Order(customer_id=db_customers[2].id, total_amount=Decimal("24990.00"), created_at=now)
        db.add(order3)
        db.flush()
        
        item3_1 = OrderItem(order_id=order3.id, product_id=db_products[4].id, quantity=1, unit_price=db_products[4].price)
        db.add(item3_1)
        
        # Decrement stock for order3
        db_products[4].quantity_in_stock -= 1

        db.commit()
        print("Successfully seeded 3 orders.")
        print("Database seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error occurred during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
