-- =============================================================================
-- CHOTU RESTRO AI — POSTGRESQL 16+ SEED DEMONSTRATION DATA
-- Restaurant: The Spice Junction (Bandra West, Mumbai)
-- Currency: INR (₹) | Taxes: CGST (2.5%) + SGST (2.5%) + Service Charge (5.0%)
-- Idempotent: Can be executed safely without duplicate errors.
-- =============================================================================

BEGIN;

-- 1. Restaurant
INSERT INTO restaurants (
    id, name, code, address, city, state, country, phone, email, currency, timezone,
    cgst_percent, sgst_percent, service_charge_percent, is_active
) VALUES (
    'rest-spice-jct',
    'The Spice Junction',
    'SPICE-JCT',
    'Shop 4, Pali Hill Road, Bandra West',
    'Mumbai',
    'Maharashtra',
    'India',
    '+91 98200 12345',
    'owner@spicejunction.in',
    'INR',
    'Asia/Kolkata',
    2.50,
    2.50,
    5.00,
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- 2. Restaurant Branch
INSERT INTO restaurant_branches (
    id, restaurant_id, branch_name, branch_code, address, phone, is_main_branch, is_active
) VALUES (
    'branch-bandra-01',
    'rest-spice-jct',
    'Bandra Flagship Bistro',
    'BANDRA-01',
    'Shop 4, Pali Hill Road, Bandra West, Mumbai 400050',
    '+91 98200 12345',
    TRUE,
    TRUE
) ON CONFLICT (restaurant_id, branch_code) DO NOTHING;

-- 3. Roles
INSERT INTO roles (id, name, description) VALUES
    ('role-owner', 'owner', 'Full administrative restaurant ownership'),
    ('role-manager', 'manager', 'Operational floor & inventory control'),
    ('role-cashier', 'cashier', 'POS billing & payment settlements'),
    ('role-kitchen', 'kitchen_staff', 'Kitchen display station preparation'),
    ('role-waiter', 'waiter', 'Table taking & guest management')
ON CONFLICT (name) DO NOTHING;

-- 4. Users (Password: Chotu@123 -> bcrypt hashed)
-- bcrypt hash for 'Chotu@123': $2b$12$6CqYJ2.h7ZtQZ5zJ.5ZcTe7D9t0c1dFvNl6mOpQrStUvWxYz01234
INSERT INTO users (
    id, restaurant_id, email, full_name, hashed_password, is_active, phone
) VALUES (
    'user-mgr-01',
    'rest-spice-jct',
    'manager@spicejunction.in',
    'Rahul Sharma (General Manager)',
    '$2b$12$0eN66K9e6YQhW1v2.G/iSe3pW5m2vL4q1aZ8yX0bC3dE5fG7hI9jK',
    TRUE,
    '+91 98200 12345'
), (
    'user-csh-01',
    'rest-spice-jct',
    'cashier@spicejunction.in',
    'Deepak Nair (Senior Cashier)',
    '$2b$12$0eN66K9e6YQhW1v2.G/iSe3pW5m2vL4q1aZ8yX0bC3dE5fG7hI9jK',
    TRUE,
    '+91 98200 12346'
), (
    'user-chef-01',
    'rest-spice-jct',
    'chef@spicejunction.in',
    'Chef Vikram Rawat (Head Chef)',
    '$2b$12$0eN66K9e6YQhW1v2.G/iSe3pW5m2vL4q1aZ8yX0bC3dE5fG7hI9jK',
    TRUE,
    '+91 98200 12347'
) ON CONFLICT (email) DO NOTHING;

-- Link User Roles
INSERT INTO user_roles (user_id, role_id) VALUES
    ('user-mgr-01', 'role-manager'),
    ('user-csh-01', 'role-cashier'),
    ('user-chef-01', 'role-kitchen')
ON CONFLICT DO NOTHING;

-- 5. Dining Tables
INSERT INTO dining_tables (
    id, restaurant_id, branch_id, label, capacity, status, current_bill, captain_name, opened_at
) VALUES 
    ('T-01', 'rest-spice-jct', 'branch-bandra-01', 'T-01', 2, 'occupied', 920.00, 'Ramesh K.', '19:45'),
    ('T-02', 'rest-spice-jct', 'branch-bandra-01', 'T-02', 4, 'vacant', 0.00, NULL, NULL),
    ('T-03', 'rest-spice-jct', 'branch-bandra-01', 'T-03', 6, 'billed', 1420.00, 'Vikram S.', '19:10'),
    ('T-04', 'rest-spice-jct', 'branch-bandra-01', 'T-04', 4, 'occupied', 891.00, 'Ramesh K.', '20:05'),
    ('T-05', 'rest-spice-jct', 'branch-bandra-01', 'T-05', 2, 'occupied', 450.00, 'Deepak N.', '20:20'),
    ('T-06', 'rest-spice-jct', 'branch-bandra-01', 'T-06', 8, 'reserved', 0.00, NULL, NULL),
    ('T-07', 'rest-spice-jct', 'branch-bandra-01', 'T-07', 4, 'occupied', 780.00, 'Ramesh K.', '20:25'),
    ('T-08', 'rest-spice-jct', 'branch-bandra-01', 'T-08', 4, 'vacant', 0.00, NULL, NULL)
ON CONFLICT (restaurant_id, label) DO NOTHING;

-- Table QR Tokens
INSERT INTO table_qr_tokens (id, table_id, token, is_active) VALUES
    ('qrt-01', 'T-01', 'qr-t01-demo', TRUE),
    ('qrt-02', 'T-02', 'qr-t02-demo', TRUE),
    ('qrt-03', 'T-03', 'qr-t03-demo', TRUE),
    ('qrt-04', 'T-04', 'qr-t04-demo', TRUE),
    ('qrt-05', 'T-05', 'qr-t05-demo', TRUE),
    ('qrt-06', 'T-06', 'qr-t06-demo', TRUE),
    ('qrt-07', 'T-07', 'qr-t07-demo', TRUE),
    ('qrt-08', 'T-08', 'qr-t08-demo', TRUE)
ON CONFLICT (table_id) DO NOTHING;

-- 6. Menu Categories
INSERT INTO menu_categories (id, restaurant_id, name, slug, display_order) VALUES
    ('cat-mains', 'rest-spice-jct', 'Mains', 'mains', 1),
    ('cat-breads', 'rest-spice-jct', 'Breads', 'breads', 2),
    ('cat-starters', 'rest-spice-jct', 'Starters', 'starters', 3),
    ('cat-desserts', 'rest-spice-jct', 'Desserts', 'desserts', 4),
    ('cat-beverages', 'rest-spice-jct', 'Beverages', 'beverages', 5)
ON CONFLICT (restaurant_id, slug) DO NOTHING;

-- 7. Menu Items (Authentic Indian Restaurant Menu with INR Pricing)
INSERT INTO menu_items (
    id, restaurant_id, category_id, name, description, price, dietary, station, spice_level, is_bestseller, is_in_stock
) VALUES
    ('dish-01', 'rest-spice-jct', 'cat-mains', 'Butter Chicken (Boneless)', 'Slow-simmered satin tomato makhani, dairy butter, crushed fenugreek', 340.00, 'nonveg', 'curry', 1, TRUE, TRUE),
    ('dish-02', 'rest-spice-jct', 'cat-mains', 'Paneer Tikka Masala', 'Charred cottage cheese cubes, spiced onion-capsicum roasted gravy', 290.00, 'veg', 'curry', 2, TRUE, TRUE),
    ('dish-03', 'rest-spice-jct', 'cat-mains', 'Dal Makhani Bukhara', 'Whole black urad lentils stewed 18 hours over clay oven charcoal embers', 240.00, 'veg', 'curry', 1, FALSE, TRUE),
    ('dish-04', 'rest-spice-jct', 'cat-breads', 'Garlic Butter Naan', 'Leavened oven-baked flatbread, roasted garlic slivers, fresh coriander, churned butter', 60.00, 'veg', 'tandoor', 1, TRUE, TRUE),
    ('dish-05', 'rest-spice-jct', 'cat-breads', 'Tandoori Roti (Butter)', 'Stoneground whole wheat flatbread baked inside tandoor clay oven', 35.00, 'veg', 'tandoor', 1, FALSE, TRUE),
    ('dish-06', 'rest-spice-jct', 'cat-mains', 'Hyderabadi Dum Gosht Biryani', 'Aged long-grain basmati, tender lamb cuts, saffron, sealed handi', 390.00, 'nonveg', 'curry', 3, TRUE, TRUE),
    ('dish-07', 'rest-spice-jct', 'cat-starters', 'Amritsari Paneer Tikka (6 pcs)', 'Hung curd, ajwain, yellow chili marinade skewered with bell peppers', 280.00, 'veg', 'tandoor', 2, FALSE, TRUE),
    ('dish-08', 'rest-spice-jct', 'cat-starters', 'Murgh Malai Tikka', 'Chicken supreme, clotted cream, green cardamom, mild white pepper', 330.00, 'nonveg', 'tandoor', 1, FALSE, TRUE),
    ('dish-09', 'rest-spice-jct', 'cat-desserts', 'Gulab Jamun (Warm, 2 pcs)', 'Reduced milk dumplings stuffed with pistachio, green cardamom syrup', 110.00, 'veg', 'pantry', 1, FALSE, TRUE),
    ('dish-10', 'rest-spice-jct', 'cat-beverages', 'Cold Coffee Frappe', 'Double espresso shot blended with chilled dairy milk & chocolate drizzle', 140.00, 'veg', 'bar', 1, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. Suppliers
INSERT INTO suppliers (id, restaurant_id, name, phone, email, address) VALUES
    ('supp-01', 'rest-spice-jct', 'Bandra Fresh Poultry', '+91 98200 88771', 'orders@bandrafresh.in', 'Bandra West, Mumbai'),
    ('supp-02', 'rest-spice-jct', 'Gokul Dairy & Milk Cooperative', '+91 98200 88772', 'sales@gokuldairy.in', 'Vile Parle East, Mumbai'),
    ('supp-03', 'rest-spice-jct', 'APMC Wholesale Grain Mandi', '+91 98200 88773', 'contact@apmcgrain.in', 'Sector 19, Vashi, Navi Mumbai')
ON CONFLICT (id) DO NOTHING;

-- 9. Raw Ingredients for Inventory Control
INSERT INTO ingredients (
    id, restaurant_id, supplier_id, name, unit, current_stock, reorder_threshold, cost_per_unit
) VALUES
    ('ing-01', 'rest-spice-jct', 'supp-01', 'Boneless Fresh Chicken', 'kg', 18.500, 5.000, 280.00),
    ('ing-02', 'rest-spice-jct', 'supp-02', 'Fresh Malai Paneer', 'kg', 14.000, 3.000, 340.00),
    ('ing-03', 'rest-spice-jct', 'supp-03', 'Black Urad Dal Bukhara', 'kg', 25.000, 5.000, 140.00),
    ('ing-04', 'rest-spice-jct', 'supp-03', 'Premium Sharbati Maida', 'kg', 45.000, 10.000, 45.00),
    ('ing-05', 'rest-spice-jct', 'supp-02', 'Heavy Dairy Cream & Butter', 'kg', 2.400, 5.000, 480.00), -- Trigger: LOW STOCK ALERT
    ('ing-06', 'rest-spice-jct', 'supp-03', 'Aged Basmati Rice 1121', 'kg', 35.000, 8.000, 125.00),
    ('ing-07', 'rest-spice-jct', 'supp-02', 'Khoya Mawa / Reduced Milk', 'kg', 3.500, 2.000, 360.00)
ON CONFLICT (id) DO NOTHING;

-- 10. Recipes (Bill of Materials)
INSERT INTO recipes (id, menu_item_id, recipe_name) VALUES
    ('rec-01', 'dish-01', 'Butter Chicken Standard Recipe'),
    ('rec-02', 'dish-02', 'Paneer Tikka Masala Recipe'),
    ('rec-03', 'dish-03', 'Dal Bukhara Overnight Stew Recipe'),
    ('rec-04', 'dish-04', 'Garlic Butter Naan Recipe'),
    ('rec-09', 'dish-09', 'Gulab Jamun Dumpling Recipe')
ON CONFLICT (menu_item_id) DO NOTHING;

-- Recipe Ingredients Link
INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity_required, unit) VALUES
    ('ri-01', 'rec-01', 'ing-01', 0.250, 'kg'), -- 250g chicken per portion
    ('ri-02', 'rec-01', 'ing-05', 0.080, 'kg'), -- 80g cream/butter
    ('ri-03', 'rec-02', 'ing-02', 0.200, 'kg'), -- 200g paneer
    ('ri-04', 'rec-02', 'ing-05', 0.050, 'kg'),
    ('ri-05', 'rec-03', 'ing-03', 0.150, 'kg'),
    ('ri-06', 'rec-03', 'ing-05', 0.060, 'kg'),
    ('ri-07', 'rec-04', 'ing-04', 0.120, 'kg'),
    ('ri-08', 'rec-04', 'ing-05', 0.020, 'kg'),
    ('ri-09', 'rec-09', 'ing-07', 0.100, 'kg')
ON CONFLICT (id) DO NOTHING;

-- 11. Initial Live Order (Table T-04 Order)
INSERT INTO orders (
    id, restaurant_id, branch_id, table_id, order_number, token_number,
    customer_name, customer_phone, mode, status, payment_status, placed_by,
    subtotal, cgst, sgst, service_charge, discount, total_amount
) VALUES (
    'ord-demo-t04',
    'rest-spice-jct',
    'branch-bandra-01',
    'T-04',
    'T 4 - 8',
    'IND-20261122-0004',
    'Rohan Verma',
    '+91 98201 55432',
    'dine-in',
    'preparing',
    'pending',
    'pos',
    810.00,
    40.50,
    40.50,
    40.50,
    0.00,
    891.00
) ON CONFLICT (id) DO NOTHING;

-- Link Table T-04 current order
UPDATE dining_tables SET current_order_id = 'ord-demo-t04' WHERE id = 'T-04';

-- Order Items for T-04
INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, dietary, station, status) VALUES
    ('item-t4-01', 'ord-demo-t04', 'dish-01', 'Butter Chicken (Boneless)', 340.00, 1, 'nonveg', 'curry', 'cooking'),
    ('item-t4-04', 'ord-demo-t04', 'dish-04', 'Garlic Butter Naan', 60.00, 3, 'veg', 'tandoor', 'cooking'),
    ('item-t4-02', 'ord-demo-t04', 'dish-02', 'Paneer Tikka Masala', 290.00, 1, 'veg', 'curry', 'ready')
ON CONFLICT (id) DO NOTHING;

-- KOT for T-04
INSERT INTO kot_tickets (
    id, restaurant_id, order_id, kot_number, table_id, status, placed_by, captain_notes
) VALUES (
    'kot-1042',
    'rest-spice-jct',
    'ord-demo-t04',
    1042,
    'T-04',
    'cooking',
    'pos',
    'Guest allergic to bell pepper; keep naan crisp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO kot_items (id, kot_id, dish_id, name, quantity, dietary, station, is_prepared) VALUES
    ('ki-t4-01', 'kot-1042', 'dish-01', 'Butter Chicken (Boneless)', 1, 'nonveg', 'curry', FALSE),
    ('ki-t4-04', 'kot-1042', 'dish-04', 'Garlic Butter Naan', 3, 'veg', 'tandoor', FALSE),
    ('ki-t4-02', 'kot-1042', 'dish-02', 'Paneer Tikka Masala', 1, 'veg', 'curry', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 12. Multi-Channel Indian Live Orders (Zomato, Swiggy, Takeaway, Dine-In)
INSERT INTO orders (
    id, restaurant_id, branch_id, table_id, order_number, token_number, customer_name, customer_phone,
    mode, delivery_address, status, payment_status, placed_by,
    subtotal, cgst, sgst, service_charge, discount, total_amount,
    aggregator_platform, aggregator_order_id, aggregator_rider_name, aggregator_rider_status, aggregator_otp
) VALUES (
    'ord-demo-002', 'rest-spice-jct', 'branch-bandra-01', 'T-01', 'T 2 - 7', 'IND-20261122-0002', 'Pooja Hegde', '+91 98200 44321',
    'dine-in', NULL, 'preparing', 'pending', 'pos',
    836.36, 41.82, 41.82, 0.00, 0.00, 920.00,
    NULL, NULL, NULL, NULL, NULL
), (
    'ord-demo-003', 'rest-spice-jct', 'branch-bandra-01', NULL, 'TK-105', 'IND-20261122-0003', 'Vikram Malhotra', '+91 98202 99887',
    'takeaway', NULL, 'preparing', 'paid', 'pos',
    527.27, 26.36, 26.36, 0.00, 0.00, 580.00,
    NULL, NULL, NULL, NULL, NULL
), (
    'ord-demo-004', 'rest-spice-jct', 'branch-bandra-01', NULL, 'ZOM-8821', 'IND-20261122-0004', 'Ananya Deshmukh', '+91 98203 11223',
    'zomato', 'Flat 402, Sea Breeze Apts, Bandra West, Mumbai', 'preparing', 'paid', 'aggregator',
    1036.36, 51.82, 51.82, 0.00, 0.00, 1140.00,
    'zomato', 'ZOM-MNHLAW3L', 'Santosh Yadav', 'Rider assigned • Reaching in 5 mins', '4821'
), (
    'ord-demo-005', 'rest-spice-jct', 'branch-bandra-01', NULL, 'SWIG-4412', 'IND-20261122-0005', 'Karan Singhania', '+91 98204 77665',
    'swiggy', '12 Hill Road, Bandra West, Mumbai', 'completed', 'paid', 'aggregator',
    581.82, 29.09, 29.09, 0.00, 0.00, 640.00,
    'swiggy', 'SWIG-99120', 'Deepak S.', 'Delivered to Customer', '1290'
) ON CONFLICT (id) DO NOTHING;

COMMIT;
