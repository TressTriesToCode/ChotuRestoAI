-- =============================================================================
-- CHOTU RESTRO AI — POSTGRESQL 16+ DATA INTEGRITY CONSTRAINTS
-- Enforces business invariants, non-negative monetary math, and valid state transitions.
-- =============================================================================

-- 1. Dining Table Constraints
ALTER TABLE dining_tables 
    ADD CONSTRAINT chk_table_capacity_positive 
    CHECK (capacity > 0);

ALTER TABLE dining_tables 
    ADD CONSTRAINT chk_valid_table_status 
    CHECK (status IN ('vacant', 'occupied', 'billed', 'reserved'));

ALTER TABLE dining_tables 
    ADD CONSTRAINT chk_table_bill_non_negative 
    CHECK (current_bill >= 0.00);

-- 2. Menu Item Constraints
ALTER TABLE menu_items 
    ADD CONSTRAINT chk_item_price_positive 
    CHECK (price >= 0.00);

ALTER TABLE menu_items 
    ADD CONSTRAINT chk_valid_dietary 
    CHECK (dietary IN ('veg', 'nonveg'));

ALTER TABLE menu_items 
    ADD CONSTRAINT chk_valid_station 
    CHECK (station IN ('tandoor', 'curry', 'bar', 'pantry'));

ALTER TABLE menu_items 
    ADD CONSTRAINT chk_spice_level_range 
    CHECK (spice_level BETWEEN 1 AND 5);

-- 3. Order & Financial Decimal Constraints
ALTER TABLE orders 
    ADD CONSTRAINT chk_order_subtotal_non_negative 
    CHECK (subtotal >= 0.00);

ALTER TABLE orders 
    ADD CONSTRAINT chk_order_cgst_non_negative 
    CHECK (cgst >= 0.00);

ALTER TABLE orders 
    ADD CONSTRAINT chk_order_sgst_non_negative 
    CHECK (sgst >= 0.00);

ALTER TABLE orders 
    ADD CONSTRAINT chk_order_total_non_negative 
    CHECK (total_amount >= 0.00);

ALTER TABLE orders 
    ADD CONSTRAINT chk_valid_order_status 
    CHECK (status IN ('new', 'preparing', 'ready', 'out-for-delivery', 'completed', 'cancelled'));

ALTER TABLE orders 
    ADD CONSTRAINT chk_valid_payment_status 
    CHECK (payment_status IN ('pending', 'initiated', 'paid', 'failed', 'refunded'));

ALTER TABLE orders 
    ADD CONSTRAINT chk_valid_order_mode 
    CHECK (mode IN ('dine-in', 'takeaway', 'delivery', 'zomato', 'swiggy', 'ubereats', 'doordash'));

ALTER TABLE order_items 
    ADD CONSTRAINT chk_order_item_quantity_positive 
    CHECK (quantity > 0);

ALTER TABLE order_items 
    ADD CONSTRAINT chk_order_item_price_non_negative 
    CHECK (price >= 0.00);

-- 4. KOT Constraints
ALTER TABLE kot_tickets 
    ADD CONSTRAINT chk_valid_kot_status 
    CHECK (status IN ('cooking', 'ready', 'bumped'));

ALTER TABLE kot_items 
    ADD CONSTRAINT chk_kot_item_quantity_positive 
    CHECK (quantity > 0);

-- 5. Inventory & Recipe Constraints
ALTER TABLE ingredients 
    ADD CONSTRAINT chk_reorder_threshold_positive 
    CHECK (reorder_threshold >= 0.000);

ALTER TABLE ingredients 
    ADD CONSTRAINT chk_cost_per_unit_positive 
    CHECK (cost_per_unit >= 0.00);

ALTER TABLE recipe_ingredients 
    ADD CONSTRAINT chk_recipe_qty_positive 
    CHECK (quantity_required > 0.000);

ALTER TABLE inventory_transactions 
    ADD CONSTRAINT chk_valid_transaction_type 
    CHECK (transaction_type IN ('consumption', 'purchase', 'adjustment', 'wastage'));

-- 6. Payment Constraints
ALTER TABLE payments 
    ADD CONSTRAINT chk_payment_amount_positive 
    CHECK (amount > 0.00);

ALTER TABLE payments 
    ADD CONSTRAINT chk_valid_payment_method 
    CHECK (method IN ('cash', 'upi', 'card', 'online'));

ALTER TABLE payments 
    ADD CONSTRAINT chk_valid_payment_record_status 
    CHECK (status IN ('success', 'pending', 'failed', 'refunded'));
