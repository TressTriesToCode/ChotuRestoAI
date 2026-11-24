import sys
from sqlalchemy import create_engine, inspect, text

def inspect_db(db_name):
    print(f"\n=======================================================")
    print(f"=== DATABASE AUDIT: {db_name} ===")
    print(f"=======================================================")
    engine = create_engine(f'postgresql://postgres:postgres@127.0.0.1:5432/{db_name}')
    insp = inspect(engine)
    tables = sorted(insp.get_table_names())
    print(f"Total tables: {len(tables)}")
    
    with engine.connect() as conn:
        # Check Alembic version
        try:
            alembic_ver = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
            print(f"Alembic version: {[v[0] for v in alembic_ver]}")
        except Exception as e:
            print(f"Alembic version table error: {e}")
            
        print("\n--- TABLE ROW COUNTS ---")
        for t in tables:
            cnt = conn.execute(text(f'SELECT count(*) FROM "{t}"')).scalar()
            print(f"  {t:<30}: {cnt} rows")

        print("\n--- RESTAURANTS ---")
        rests = conn.execute(text("SELECT id, name, code, phone, currency FROM restaurants")).fetchall()
        for r in rests:
            print(f"  ID: {r[0]} | Name: {r[1]} | Code: {r[2]} | Phone: {r[3]} | Currency: {r[4]}")

        print("\n--- USERS ---")
        users = conn.execute(text("SELECT id, restaurant_id, email, full_name, role, is_active FROM users")).fetchall()
        for u in users:
            print(f"  ID: {u[0]} | Rest: {u[1]} | Email: {u[2]} | Name: {u[3]} | Role: {u[4]} | Active: {u[5]}")

        print("\n--- TABLES & STATUS ---")
        tbls = conn.execute(text("SELECT id, label, capacity, status, current_order_id, qr_token FROM dining_tables ORDER BY label")).fetchall()
        for tb in tbls:
            token_display = (tb[5][:15] + '...') if tb[5] else 'None'
            print(f"  ID: {tb[0]} | Label: {tb[1]} | Cap: {tb[2]} | Status: {tb[3]} | Order: {tb[4]} | Token: {token_display}")

        print("\n--- ALL INGREDIENTS ---")
        ings = conn.execute(text("SELECT id, name, current_stock, unit, reorder_threshold, cost_per_unit FROM ingredients")).fetchall()
        for ing in ings:
            print(f"  ID: {ing[0]} | Name: {ing[1]:<25} | Stock: {float(ing[2]):>8.3f} {ing[3]} | Threshold: {float(ing[4]):>6.2f} | Cost: ₹{float(ing[5]):.2f}")

        print("\n--- ORDERS BREAKDOWN ---")
        order_status_counts = conn.execute(text("SELECT status, count(*) FROM orders GROUP BY status")).fetchall()
        for sc in order_status_counts:
            print(f"  Status: {sc[0]:<15} -> {sc[1]}")

        print("\n--- RECENT ORDERS ---")
        rec_orders = conn.execute(text("SELECT id, table_id, status, payment_status, placed_by, subtotal, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 5")).fetchall()
        for ro in rec_orders:
            print(f"  Order: {ro[0]} | Table: {ro[1]} | Status: {ro[2]} | Pay: {ro[3]} | PlacedBy: {ro[4]} | Total: ₹{ro[6]} | At: {ro[7]}")

if __name__ == '__main__':
    inspect_db('chotu_restro_ai')
    inspect_db('chotu_test')
