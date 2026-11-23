"""Initial PostgreSQL schema for Chotu Restro AI

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-22 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Restaurants
    op.create_table(
        'restaurants',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('code', sa.String(64), unique=True, nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('city', sa.String(100), server_default='Mumbai', nullable=False),
        sa.Column('phone', sa.String(32), nullable=False),
        sa.Column('currency', sa.String(8), server_default='INR', nullable=False),
        sa.Column('cgst_percent', sa.Numeric(5, 2), server_default='2.50', nullable=False),
        sa.Column('sgst_percent', sa.Numeric(5, 2), server_default='2.50', nullable=False),
        sa.Column('service_charge_percent', sa.Numeric(5, 2), server_default='5.00', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 2. Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.String(32), server_default='cashier', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('phone', sa.String(32), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 3. Dining Tables
    op.create_table(
        'dining_tables',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('label', sa.String(32), nullable=False),
        sa.Column('capacity', sa.Integer(), server_default='4', nullable=False),
        sa.Column('status', sa.String(32), server_default='vacant', nullable=False),
        sa.Column('qr_token', sa.String(128), unique=True, nullable=False),
        sa.Column('current_order_id', sa.String(36), nullable=True),
        sa.Column('captain_name', sa.String(128), nullable=True),
        sa.Column('current_bill', sa.Numeric(12, 2), server_default='0.00', nullable=False),
        sa.Column('opened_at', sa.String(32), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 4. Menu Categories
    op.create_table(
        'menu_categories',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(128), nullable=False),
        sa.Column('slug', sa.String(128), nullable=False),
        sa.Column('display_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
    )

    # 5. Menu Items
    op.create_table(
        'menu_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category_id', sa.String(36), sa.ForeignKey('menu_categories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Numeric(12, 2), nullable=False),
        sa.Column('dietary', sa.String(16), server_default='veg', nullable=False),
        sa.Column('station', sa.String(32), server_default='curry', nullable=False),
        sa.Column('spice_level', sa.Integer(), server_default='1', nullable=False),
        sa.Column('is_bestseller', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_in_stock', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 6. Orders
    op.create_table(
        'orders',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('table_id', sa.String(36), sa.ForeignKey('dining_tables.id', ondelete='SET NULL'), nullable=True),
        sa.Column('order_number', sa.String(64), nullable=False),
        sa.Column('token_number', sa.String(64), nullable=False),
        sa.Column('customer_name', sa.String(255), server_default='Guest', nullable=False),
        sa.Column('customer_phone', sa.String(32), nullable=True),
        sa.Column('mode', sa.String(32), server_default='dine-in', nullable=False),
        sa.Column('delivery_address', sa.Text(), nullable=True),
        sa.Column('status', sa.String(32), server_default='preparing', nullable=False),
        sa.Column('payment_status', sa.String(32), server_default='pending', nullable=False),
        sa.Column('placed_by', sa.String(32), server_default='pos', nullable=False),
        sa.Column('subtotal', sa.Numeric(12, 2), server_default='0.00', nullable=False),
        sa.Column('cgst', sa.Numeric(12, 2), server_default='0.00', nullable=False),
        sa.Column('sgst', sa.Numeric(12, 2), server_default='0.00', nullable=False),
        sa.Column('service_charge', sa.Numeric(12, 2), server_default='0.00', nullable=False),
        sa.Column('discount', sa.Numeric(12, 2), server_default='0.00', nullable=False),
        sa.Column('total_amount', sa.Numeric(12, 2), server_default='0.00', nullable=False),
        sa.Column('aggregator_platform', sa.String(64), nullable=True),
        sa.Column('aggregator_order_id', sa.String(128), nullable=True),
        sa.Column('aggregator_rider_name', sa.String(128), nullable=True),
        sa.Column('aggregator_rider_status', sa.String(128), nullable=True),
        sa.Column('aggregator_otp', sa.String(16), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 7. Order Items
    op.create_table(
        'order_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('order_id', sa.String(36), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('menu_item_id', sa.String(36), sa.ForeignKey('menu_items.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('price', sa.Numeric(12, 2), nullable=False),
        sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('dietary', sa.String(16), server_default='veg', nullable=False),
        sa.Column('station', sa.String(32), server_default='curry', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(32), server_default='cooking', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 8. KOT Tickets
    op.create_table(
        'kots',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_id', sa.String(36), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('kot_number', sa.BigInteger(), nullable=False),
        sa.Column('table_id', sa.String(64), nullable=False),
        sa.Column('status', sa.String(32), server_default='cooking', nullable=False),
        sa.Column('placed_by', sa.String(32), server_default='pos', nullable=False),
        sa.Column('captain_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 9. KOT Items
    op.create_table(
        'kot_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('kot_id', sa.String(36), sa.ForeignKey('kots.id', ondelete='CASCADE'), nullable=False),
        sa.Column('dish_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('dietary', sa.String(16), server_default='veg', nullable=False),
        sa.Column('station', sa.String(32), server_default='curry', nullable=False),
        sa.Column('is_prepared', sa.Boolean(), server_default='false', nullable=False),
    )

    # 10. Raw Ingredients & Inventory
    op.create_table(
        'ingredients',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('unit', sa.String(16), server_default='kg', nullable=False),
        sa.Column('current_stock', sa.Numeric(14, 3), server_default='0.000', nullable=False),
        sa.Column('reorder_threshold', sa.Numeric(14, 3), server_default='5.000', nullable=False),
        sa.Column('cost_per_unit', sa.Numeric(12, 2), server_default='0.00', nullable=False),
        sa.Column('supplier_name', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 11. Recipe Items
    op.create_table(
        'recipe_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('menu_item_id', sa.String(36), sa.ForeignKey('menu_items.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ingredient_id', sa.String(36), sa.ForeignKey('ingredients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('quantity_required', sa.Numeric(14, 3), nullable=False),
    )

    # 12. Stock Transactions
    op.create_table(
        'stock_transactions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ingredient_id', sa.String(36), sa.ForeignKey('ingredients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('transaction_type', sa.String(32), nullable=False),
        sa.Column('quantity', sa.Numeric(14, 3), nullable=False),
        sa.Column('reference_id', sa.String(128), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 13. Payments
    op.create_table(
        'payments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('order_id', sa.String(36), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('method', sa.String(32), server_default='cash', nullable=False),
        sa.Column('status', sa.String(32), server_default='success', nullable=False),
        sa.Column('transaction_ref', sa.String(128), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

def downgrade() -> None:
    op.drop_table('payments')
    op.drop_table('stock_transactions')
    op.drop_table('recipe_items')
    op.drop_table('ingredients')
    op.drop_table('kot_items')
    op.drop_table('kots')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('menu_items')
    op.drop_table('menu_categories')
    op.drop_table('dining_tables')
    op.drop_table('users')
    op.drop_table('restaurants')
