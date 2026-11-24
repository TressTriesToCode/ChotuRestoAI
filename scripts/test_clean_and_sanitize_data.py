import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
import secrets
from decimal import Decimal
from sqlalchemy import create_engine, text
from app.core.security import get_password_hash
from app.core.permissions import UserRole

def sanitize_database(db_url):
    print(f"Sanitizing database: {db_url}")
    engine = create_engine(db_url)
    
    with engine.begin() as conn:
        # 1. Reset dining tables active links
        print("1. Resetting dining table active orders...")
        conn.execute(text("""
            UPDATE dining_tables 
            SET current_order_id = NULL,
                current_bill = 0.00,
                status = 'VACANT',
                opened_at = NULL,
                captain_name = NULL;
        """))
        
        # 2. Delete test feedback, loyalty, payments
        print("2. Deleting sample customer feedback & loyalty transactions...")
        conn.execute(text("DELETE FROM customer_feedback;"))
        conn.execute(text("DELETE FROM loyalty_transactions;"))
        conn.execute(text("DELETE FROM payments;"))
        
        # 3. Delete KOT items & KOTs
        print("3. Deleting sample KOT items and KOT tickets...")
        conn.execute(text("DELETE FROM kot_items;"))
        conn.execute(text("DELETE FROM kots;"))
        
        # 4. Delete Order items & Orders
        print("4. Deleting sample order items and orders...")
        conn.execute(text("DELETE FROM order_items;"))
        conn.execute(text("DELETE FROM orders;"))
        
        # 5. Delete Stock transactions
        print("5. Deleting sample stock transactions...")
        conn.execute(text("DELETE FROM stock_transactions;"))
        
        # 6. Delete PO items & POs
        print("6. Deleting sample purchase orders...")
        conn.execute(text("DELETE FROM purchase_order_items;"))
        conn.execute(text("DELETE FROM purchase_orders;"))
        
        # 7. Delete sample customers
        print("7. Deleting sample customer records...")
        conn.execute(text("DELETE FROM customers;"))
        
        # 8. Delete audit logs, AI conversations, notifications
        print("8. Deleting sample audit logs, AI conversations, and notifications...")
        conn.execute(text("DELETE FROM audit_logs;"))
        conn.execute(text("DELETE FROM ai_conversations;"))
        conn.execute(text("DELETE FROM notifications;"))
        
        # 9. Clean duplicate test users, ensure Owner, Manager, Cashier, Chef, Waiter exist
        print("9. Normalizing users table (Owner, Manager, Cashier, Chef, Waiter)...")
        conn.execute(text("DELETE FROM users WHERE email LIKE '%gaurav.waiter.%';"))
        
        # Check/insert owner
        owner_exists = conn.execute(text("SELECT id FROM users WHERE email = 'owner@spicejunction.in'")).first()
        if not owner_exists:
            pw_hash = get_password_hash("Chotu@123")
            conn.execute(text("""
                INSERT INTO users (id, restaurant_id, email, full_name, hashed_password, role, is_active, phone, created_at, updated_at)
                VALUES ('user-own-01', 'rest-spice-jct', 'owner@spicejunction.in', 'Aditya Hirekar (Owner)', :pwhash, 'OWNER', true, '+91 98200 12345', NOW(), NOW())
            """), {"pwhash": pw_hash})
            
        # Check/insert waiter
        waiter_exists = conn.execute(text("SELECT id FROM users WHERE email = 'waiter@spicejunction.in'")).first()
        if not waiter_exists:
            pw_hash = get_password_hash("Chotu@123")
            conn.execute(text("""
                INSERT INTO users (id, restaurant_id, email, full_name, hashed_password, role, is_active, phone, created_at, updated_at)
                VALUES ('user-wtr-01', 'rest-spice-jct', 'waiter@spicejunction.in', 'Gaurav Mane (Captain/Waiter)', :pwhash, 'WAITER', true, '+91 98200 12345', NOW(), NOW())
            """), {"pwhash": pw_hash})
            
        # 10. Reset ingredient stock levels to clean positive demo values
        print("10. Resetting ingredients to clean positive baseline stock...")
        baseline_stocks = {
            "ing-01": 20.000,  # Chicken (kg)
            "ing-02": 15.000,  # Paneer (kg)
            "ing-03": 25.000,  # Black Urad Dal (kg)
            "ing-04": 50.000,  # Sharbati Maida (kg)
            "ing-05": 15.000,  # Heavy Cream & Butter (kg) -> fixes -0.040 kg!
            "ing-06": 40.000,  # Aged Basmati Rice (kg)
            "ing-07": 10.000,  # Khoya Mawa (kg)
        }
        for ing_id, stock_val in baseline_stocks.items():
            conn.execute(text("""
                UPDATE ingredients 
                SET current_stock = :stock, updated_at = NOW() 
                WHERE id = :iid
            """), {"stock": stock_val, "iid": ing_id})
            
        # 11. Generate unique 256-bit cryptographically secure QR tokens for all tables
        print("11. Upgrading all dining table QR tokens to 256-bit secure tokens...")
        tables = conn.execute(text("SELECT id FROM dining_tables")).fetchall()
        for tb in tables:
            secure_tok = f"chotu_qr_{secrets.token_urlsafe(32)}"
            conn.execute(text("""
                UPDATE dining_tables 
                SET qr_token = :tok, updated_at = NOW() 
                WHERE id = :tid
            """), {"tok": secure_tok, "tid": tb[0]})
            
    print("SUCCESS: Database sanitization completed cleanly in transaction.")

if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "chotu_test"
    db_url = f"postgresql://postgres:postgres@127.0.0.1:5432/{target}"
    sanitize_database(db_url)
