-- =============================================================================
-- CHOTU RESTRO AI — POSTGRESQL 16+ PERFORMANCE INDEXES
-- Optimizes query latency across POS, KDS, Orders Hub, and Inventory queries.
-- =============================================================================

-- 1. Restaurant Multi-Tenant Boundary Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_branches_restaurant_id ON restaurant_branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dining_tables_restaurant_id ON dining_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_kot_tickets_restaurant_id ON kot_tickets(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant_id ON ingredients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inv_txns_restaurant_id ON inventory_transactions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_id ON business_audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_restaurant_id ON ai_conversations(restaurant_id);

-- 2. Foreign Key Relational Indexes
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON staff_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_dining_tables_branch_id ON dining_tables(branch_id);
CREATE INDEX IF NOT EXISTS idx_table_qr_tokens_table_id ON table_qr_tokens(table_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_menu_item_id ON menu_item_variants(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_kot_tickets_order_id ON kot_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_kot_items_kot_id ON kot_items(kot_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item_id ON recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inv_txns_ingredient_id ON inventory_transactions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- 3. Composite Operational Indexes (Real-time Dashboards, KDS, & POS)
-- Rapid retrieval of active KDS tickets by status and order
CREATE INDEX IF NOT EXISTS idx_kots_active_status ON kot_tickets(restaurant_id, status, created_at DESC);

-- Fast lookup of live table orders in POS
CREATE INDEX IF NOT EXISTS idx_tables_order_lookup ON dining_tables(restaurant_id, id, current_order_id);

-- Orders filter by status and date
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(restaurant_id, status, created_at DESC);

-- Orders filter by mode (dine-in, takeaway, online aggregators)
CREATE INDEX IF NOT EXISTS idx_orders_mode_date ON orders(restaurant_id, mode, created_at DESC);

-- Financial Aggregation index (Today's revenue calculations)
CREATE INDEX IF NOT EXISTS idx_orders_revenue_calc ON orders(restaurant_id, payment_status, created_at);

-- Low stock rapid scan
CREATE INDEX IF NOT EXISTS idx_ingredients_stock_scan ON ingredients(restaurant_id, current_stock, reorder_threshold);
