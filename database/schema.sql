-- =============================================================================
-- CHOTU RESTRO AI — POSTGRESQL 16+ PRODUCTION RELATIONAL SCHEMA
-- Database: chotu_restro_ai
-- Currency: INR (₹) | Timezone: Asia/Kolkata (TIMESTAMPTZ)
-- Driver: psycopg 3 (postgresql+psycopg://)
-- =============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- MODULE A: AUTHENTICATION & ORGANISATION
-- =============================================================================

-- 1. Restaurants (Multi-tenant root)
CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
    state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    country VARCHAR(64) NOT NULL DEFAULT 'India',
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    cgst_percent NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
    sgst_percent NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
    service_charge_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Restaurant Branches
CREATE TABLE IF NOT EXISTS restaurant_branches (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    branch_code VARCHAR(64) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(32),
    is_main_branch BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branch_code UNIQUE (restaurant_id, branch_code)
);

-- 3. Roles
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(64) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code VARCHAR(128) UNIQUE NOT NULL,
    module VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Role Permissions Junction
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(36) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 6. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Roles Junction
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 8. Staff Profiles
CREATE TABLE IF NOT EXISTS staff_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id VARCHAR(36) REFERENCES restaurant_branches(id) ON DELETE SET NULL,
    employee_code VARCHAR(64),
    designation VARCHAR(128),
    shift_timings VARCHAR(128),
    emergency_contact VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Restaurant Settings
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) UNIQUE NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    auto_accept_online_orders BOOLEAN NOT NULL DEFAULT TRUE,
    kds_sound_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    qr_ordering_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    whatsapp_receipts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    low_stock_notification_threshold NUMERIC(14, 3) NOT NULL DEFAULT 5.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MODULE B: RESTAURANT OPERATIONS & MENU
-- =============================================================================

-- 10. Dining Tables
CREATE TABLE IF NOT EXISTS dining_tables (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id VARCHAR(36) REFERENCES restaurant_branches(id) ON DELETE CASCADE,
    label VARCHAR(32) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    status VARCHAR(32) NOT NULL DEFAULT 'vacant', -- vacant, occupied, billed, reserved
    current_order_id VARCHAR(36),
    captain_name VARCHAR(128),
    current_bill NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    opened_at VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_table_label UNIQUE (restaurant_id, label)
);

-- 11. Table QR Tokens (Revocable secure tokens for contactless dining)
CREATE TABLE IF NOT EXISTS table_qr_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    table_id VARCHAR(36) UNIQUE NOT NULL REFERENCES dining_tables(id) ON DELETE CASCADE,
    token VARCHAR(128) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_category_slug UNIQUE (restaurant_id, slug)
);

-- 13. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id VARCHAR(36) NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    dietary VARCHAR(16) NOT NULL DEFAULT 'veg', -- veg, nonveg
    station VARCHAR(32) NOT NULL DEFAULT 'curry', -- tandoor, curry, bar, pantry
    spice_level INT NOT NULL DEFAULT 1,
    is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    is_in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. Menu Item Variants (Portion sizing: Half / Full / Regular / Large)
CREATE TABLE IF NOT EXISTS menu_item_variants (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    menu_item_id VARCHAR(36) NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    variant_name VARCHAR(64) NOT NULL,
    price_delta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Menu Customisations (Modifier groups: Extra Cheese, Spice Adjustment)
CREATE TABLE IF NOT EXISTS menu_customisations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    max_options INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. Customisation Options
CREATE TABLE IF NOT EXISTS menu_item_customisation_options (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customisation_id VARCHAR(36) NOT NULL REFERENCES menu_customisations(id) ON DELETE CASCADE,
    option_name VARCHAR(128) NOT NULL,
    additional_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MODULE C: ORDERS, BILLING & KITCHEN TICKETS
-- =============================================================================

-- 17. Customers
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    loyalty_points INT NOT NULL DEFAULT 0,
    total_orders_count INT NOT NULL DEFAULT 0,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_phone UNIQUE (restaurant_id, phone)
);

-- 18. Orders (Central unified ledger for POS, QR, Delivery & Aggregators)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id VARCHAR(36) REFERENCES restaurant_branches(id) ON DELETE CASCADE,
    table_id VARCHAR(36) REFERENCES dining_tables(id) ON DELETE SET NULL,
    customer_id VARCHAR(36) REFERENCES customers(id) ON DELETE SET NULL,
    order_number VARCHAR(64) NOT NULL,
    token_number VARCHAR(64) NOT NULL,
    customer_name VARCHAR(255) NOT NULL DEFAULT 'Guest',
    customer_phone VARCHAR(32),
    mode VARCHAR(32) NOT NULL DEFAULT 'dine-in', -- dine-in, takeaway, delivery, zomato, swiggy
    delivery_address TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'preparing', -- new, preparing, ready, out-for-delivery, completed, cancelled
    payment_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, initiated, paid, failed, refunded
    placed_by VARCHAR(32) NOT NULL DEFAULT 'pos', -- pos, qr, voice, aggregator
    
    -- Exact Decimal financial calculations
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    service_charge NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Online aggregator sync metadata
    aggregator_platform VARCHAR(64),
    aggregator_order_id VARCHAR(128),
    aggregator_rider_name VARCHAR(128),
    aggregator_rider_status VARCHAR(128),
    aggregator_otp VARCHAR(16),
    
    idempotency_key VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 19. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id VARCHAR(36) NOT NULL REFERENCES menu_items(id),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    dietary VARCHAR(16) NOT NULL DEFAULT 'veg',
    station VARCHAR(32) NOT NULL DEFAULT 'curry',
    notes TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'cooking', -- queued, cooking, ready, served
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 20. Order Item Customisations Junction
CREATE TABLE IF NOT EXISTS order_item_customisations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_item_id VARCHAR(36) NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    customisation_option_id VARCHAR(36) NOT NULL REFERENCES menu_item_customisation_options(id),
    option_name VARCHAR(128) NOT NULL,
    additional_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 21. KOT Tickets (Kitchen Order Tickets routed to kitchen display system)
CREATE TABLE IF NOT EXISTS kot_tickets (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    kot_number BIGINT NOT NULL,
    table_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'cooking', -- cooking, ready, bumped
    placed_by VARCHAR(32) NOT NULL DEFAULT 'pos',
    captain_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 22. KOT Items
CREATE TABLE IF NOT EXISTS kot_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    kot_id VARCHAR(36) NOT NULL REFERENCES kot_tickets(id) ON DELETE CASCADE,
    dish_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    dietary VARCHAR(16) NOT NULL DEFAULT 'veg',
    station VARCHAR(32) NOT NULL DEFAULT 'curry',
    is_prepared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 23. Payments
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(32) NOT NULL DEFAULT 'cash', -- cash, upi, card, online
    status VARCHAR(32) NOT NULL DEFAULT 'success', -- success, pending, failed, refunded
    transaction_ref VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id VARCHAR(36) UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    cgst NUMERIC(12, 2) NOT NULL,
    sgst NUMERIC(12, 2) NOT NULL,
    service_charge NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) NOT NULL,
    grand_total NUMERIC(12, 2) NOT NULL,
    pdf_url TEXT,
    whatsapp_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MODULE D: INVENTORY & RECIPES
-- =============================================================================

-- 25. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(128),
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 26. Raw Ingredients
CREATE TABLE IF NOT EXISTS ingredients (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    supplier_id VARCHAR(36) REFERENCES suppliers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(16) NOT NULL DEFAULT 'kg', -- kg, g, l, ml, pcs
    current_stock NUMERIC(14, 3) NOT NULL DEFAULT 0.000,
    reorder_threshold NUMERIC(14, 3) NOT NULL DEFAULT 5.000,
    cost_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 27. Recipes (Link Menu Items -> Ingredients)
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    menu_item_id VARCHAR(36) UNIQUE NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    recipe_name VARCHAR(255) NOT NULL,
    prep_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 28. Recipe Ingredients (Bill of Materials)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    recipe_id VARCHAR(36) NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(36) NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity_required NUMERIC(14, 3) NOT NULL, -- Quantity per standard portion
    unit VARCHAR(16) NOT NULL DEFAULT 'kg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 29. Inventory Stock Transactions Ledger (Full consumption, purchase, wastage history)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(36) NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    transaction_type VARCHAR(32) NOT NULL, -- consumption, purchase, adjustment, wastage
    quantity NUMERIC(14, 3) NOT NULL,
    previous_stock NUMERIC(14, 3) NOT NULL,
    resulting_stock NUMERIC(14, 3) NOT NULL,
    reference_id VARCHAR(128), -- e.g. order_id or purchase order number
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MODULE E: ANALYTICS & AUDIT LOGS
-- =============================================================================

-- 30. Business Audit Logs
CREATE TABLE IF NOT EXISTS business_audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    entity VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 31. Daily Business Summaries (Pre-aggregated rollups for analytics velocity)
CREATE TABLE IF NOT EXISTS daily_business_summaries (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_orders_count INT NOT NULL DEFAULT 0,
    dine_in_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    takeaway_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    delivery_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    aggregator_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_daily_summary UNIQUE (restaurant_id, summary_date)
);

-- =============================================================================
-- MODULE F: CHOTU AI ASSISTANT
-- =============================================================================

-- 32. AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    session_title VARCHAR(255) DEFAULT 'Chotu Restro Copilot Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 33. AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id VARCHAR(36) NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    intent VARCHAR(64),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
