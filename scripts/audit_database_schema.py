import sys
from sqlalchemy import create_engine, inspect, text

def audit_schema():
    engine = create_engine('postgresql://postgres:postgres@127.0.0.1:5432/chotu_restro_ai')
    insp = inspect(engine)
    
    print("=== POSTGRESQL SCHEMA AUDIT: chotu_restro_ai ===")
    
    phase4_tables = [
        "customers", "loyalty_transactions", "customer_feedback",
        "suppliers", "purchase_orders", "purchase_order_items",
        "notifications", "menu_item_variants"
    ]
    
    for t in phase4_tables:
        print(f"\n--- TABLE: {t} ---")
        cols = insp.get_columns(t)
        for c in cols:
            print(f"  Col: {c['name']:<25} Type: {str(c['type']):<18} Nullable: {c['nullable']}")
            
        fks = insp.get_foreign_keys(t)
        print(f"  Foreign Keys ({len(fks)}):")
        for fk in fks:
            print(f"    {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']} (ondelete: {fk.get('options', {}).get('ondelete')})")
            
        uqs = insp.get_unique_constraints(t)
        print(f"  Unique Constraints ({len(uqs)}):")
        for u in uqs:
            print(f"    Name: {u['name']} Cols: {u['column_names']}")
            
        idxs = insp.get_indexes(t)
        print(f"  Indexes ({len(idxs)}):")
        for idx in idxs:
            print(f"    Name: {idx['name']} Unique: {idx['unique']} Cols: {idx['column_names']}")

    print("\n=== UPDATED EXISTING TABLES (restaurants, dining_tables, orders, order_items, menu_items) ===")
    for t in ["restaurants", "dining_tables", "orders", "order_items", "menu_items"]:
        print(f"\n--- TABLE: {t} (Phase 4 columns) ---")
        cols = insp.get_columns(t)
        for c in cols:
            print(f"  Col: {c['name']:<30} Type: {str(c['type']):<18} Nullable: {c['nullable']}")

    print("\n=== ORPHAN RECORD & INTEGRITY CHECKS ===")
    with engine.connect() as conn:
        # Check orphaned loyalty_transactions
        orph_loyalty = conn.execute(text("SELECT count(*) FROM loyalty_transactions lt LEFT JOIN customers c ON lt.customer_id = c.id WHERE c.id IS NULL")).scalar()
        print(f"Orphaned loyalty_transactions: {orph_loyalty}")
        
        # Check orphaned purchase_order_items
        orph_poi = conn.execute(text("SELECT count(*) FROM purchase_order_items poi LEFT JOIN purchase_orders po ON poi.purchase_order_id = po.id WHERE po.id IS NULL")).scalar()
        print(f"Orphaned purchase_order_items: {orph_poi}")
        
        # Check orphaned dining_tables assigned_waiter_id
        orph_waiter = conn.execute(text("SELECT count(*) FROM dining_tables dt LEFT JOIN users u ON dt.assigned_waiter_id = u.id WHERE dt.assigned_waiter_id IS NOT NULL AND u.id IS NULL")).scalar()
        print(f"Orphaned table assigned_waiter_id: {orph_waiter}")

        # Check negative balances or invalid stock
        neg_loyalty = conn.execute(text("SELECT count(*) FROM customers WHERE loyalty_points_balance < 0")).scalar()
        print(f"Customers with negative loyalty points: {neg_loyalty}")

        neg_stock = conn.execute(text("SELECT count(*) FROM ingredients WHERE current_stock < 0")).scalar()
        print(f"Ingredients with negative stock: {neg_stock}")

if __name__ == "__main__":
    audit_schema()
