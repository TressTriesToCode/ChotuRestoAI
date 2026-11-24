"""Phase 4: Complete Restaurant Administration & Advanced Operations

Revision ID: 003_phase4_admin_and_operations
Revises: 002_audit_and_ai
Create Date: 2026-11-24 11:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_phase4_admin_and_operations'
down_revision: Union[str, None] = '002_audit_and_ai'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. New Table: customers
    op.create_table(
        'customers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(128), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('email', sa.String(128), nullable=True),
        sa.Column('total_orders', sa.Integer(), server_default='0', nullable=False),
        sa.Column('total_spend', sa.Numeric(10, 2), server_default='0.00', nullable=False),
        sa.Column('loyalty_points_balance', sa.Integer(), server_default='0', nullable=False),
        sa.Column('marketing_consent', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('tags', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.UniqueConstraint('restaurant_id', 'phone', name='uq_customer_restaurant_phone')
    )
    op.create_index('ix_customers_restaurant_id', 'customers', ['restaurant_id'])
    op.create_index('ix_customers_phone', 'customers', ['phone'])

    # 2. New Table: loyalty_transactions
    op.create_table(
        'loyalty_transactions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('customer_id', sa.String(36), sa.ForeignKey('customers.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('transaction_type', sa.String(32), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('reference_order_id', sa.String(36), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
        sa.Column('idempotency_key', sa.String(128), unique=True, nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)
    )
    op.create_index('ix_loyalty_tx_customer', 'loyalty_transactions', ['customer_id', 'created_at'])

    # 3. New Table: customer_feedback
    op.create_table(
        'customer_feedback',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('customer_id', sa.String(36), sa.ForeignKey('customers.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('order_id', sa.String(36), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)
    )
    op.create_index('ix_feedback_customer', 'customer_feedback', ['customer_id'])

    # 4. New Table: suppliers
    op.create_table(
        'suppliers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(128), nullable=False),
        sa.Column('contact_person', sa.String(128), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('email', sa.String(128), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('gst_number', sa.String(32), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)
    )
    op.create_index('ix_suppliers_restaurant', 'suppliers', ['restaurant_id', 'is_active'])

    # 5. New Table: purchase_orders
    op.create_table(
        'purchase_orders',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('supplier_id', sa.String(36), sa.ForeignKey('suppliers.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('po_number', sa.String(64), nullable=False),
        sa.Column('status', sa.String(32), server_default='draft', nullable=False),
        sa.Column('total_amount', sa.Numeric(10, 2), server_default='0.00', nullable=False),
        sa.Column('invoice_ref', sa.String(64), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('issued_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.UniqueConstraint('restaurant_id', 'po_number', name='uq_po_restaurant_number')
    )
    op.create_index('ix_purchase_orders_supplier', 'purchase_orders', ['supplier_id'])

    # 6. New Table: purchase_order_items
    op.create_table(
        'purchase_order_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('purchase_order_id', sa.String(36), sa.ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ingredient_id', sa.String(36), sa.ForeignKey('ingredients.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('quantity', sa.Numeric(10, 3), nullable=False),
        sa.Column('unit_cost', sa.Numeric(10, 2), nullable=False),
        sa.Column('total_cost', sa.Numeric(10, 2), nullable=False)
    )
    op.create_index('ix_poi_order', 'purchase_order_items', ['purchase_order_id'])

    # 7. New Table: menu_item_variants
    op.create_table(
        'menu_item_variants',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('menu_item_id', sa.String(36), sa.ForeignKey('menu_items.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(64), nullable=False),
        sa.Column('price', sa.Numeric(10, 2), nullable=False),
        sa.Column('is_in_stock', sa.Boolean(), server_default='true', nullable=False),
        sa.UniqueConstraint('menu_item_id', 'name', name='uq_variant_item_name')
    )
    op.create_index('ix_variants_item', 'menu_item_variants', ['menu_item_id'])

    # 8. New Table: notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_fingerprint', sa.String(128), unique=True, nullable=False),
        sa.Column('type', sa.String(32), server_default='order', nullable=False),
        sa.Column('severity', sa.String(16), server_default='info', nullable=False),
        sa.Column('title', sa.String(128), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('reference_id', sa.String(64), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)
    )
    op.create_index('ix_notifications_unread', 'notifications', ['restaurant_id', 'is_read', 'created_at'])

    # 9. Alter Existing Tables (Strictly Backwards-Compatible Additions)
    # 9a. restaurants
    op.add_column('restaurants', sa.Column('logo_url', sa.String(255), nullable=True))
    op.add_column('restaurants', sa.Column('tagline', sa.String(255), nullable=True))
    op.add_column('restaurants', sa.Column('gstin', sa.String(32), nullable=True))
    op.add_column('restaurants', sa.Column('fssai_number', sa.String(32), nullable=True))
    op.add_column('restaurants', sa.Column('business_hours', sa.String(1024), nullable=True))
    op.add_column('restaurants', sa.Column('upi_vpa', sa.String(64), nullable=True))
    op.add_column('restaurants', sa.Column('auto_print_kot', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('restaurants', sa.Column('invoice_prefix', sa.String(16), server_default='INV', nullable=False))
    op.add_column('restaurants', sa.Column('timezone', sa.String(64), server_default='Asia/Kolkata', nullable=False))
    op.add_column('restaurants', sa.Column('tax_effective_from', sa.DateTime(timezone=True), nullable=True))

    # 9b. dining_tables
    op.add_column('dining_tables', sa.Column('assigned_waiter_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))

    # 9c. menu_items
    op.add_column('menu_items', sa.Column('photo_url', sa.String(255), nullable=True))
    op.add_column('menu_items', sa.Column('preparation_time_minutes', sa.Integer(), server_default='15', nullable=False))

    # 9d. orders
    op.add_column('orders', sa.Column('customer_id', sa.String(36), sa.ForeignKey('customers.id', ondelete='SET NULL'), nullable=True))
    op.add_column('orders', sa.Column('delivery_otp_hash', sa.String(128), nullable=True))
    op.add_column('orders', sa.Column('delivery_otp_salt', sa.String(32), nullable=True))
    op.add_column('orders', sa.Column('delivery_otp_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('delivery_otp_attempts', sa.Integer(), server_default='0', nullable=False))
    op.add_column('orders', sa.Column('delivery_otp_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('dispatch_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('delivered_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('cgst_rate_snapshot', sa.Numeric(5, 2), server_default='2.50', nullable=False))
    op.add_column('orders', sa.Column('sgst_rate_snapshot', sa.Numeric(5, 2), server_default='2.50', nullable=False))
    op.add_column('orders', sa.Column('service_charge_rate_snapshot', sa.Numeric(5, 2), server_default='5.00', nullable=False))

    # 9e. order_items
    op.add_column('order_items', sa.Column('variant_id', sa.String(36), sa.ForeignKey('menu_item_variants.id', ondelete='SET NULL'), nullable=True))
    op.add_column('order_items', sa.Column('variant_name', sa.String(64), nullable=True))


def downgrade() -> None:
    # Reverse alterations
    op.drop_column('order_items', 'variant_name')
    op.drop_column('order_items', 'variant_id')

    op.drop_column('orders', 'service_charge_rate_snapshot')
    op.drop_column('orders', 'sgst_rate_snapshot')
    op.drop_column('orders', 'cgst_rate_snapshot')
    op.drop_column('orders', 'delivered_time')
    op.drop_column('orders', 'dispatch_time')
    op.drop_column('orders', 'delivery_otp_verified_at')
    op.drop_column('orders', 'delivery_otp_attempts')
    op.drop_column('orders', 'delivery_otp_expires_at')
    op.drop_column('orders', 'delivery_otp_salt')
    op.drop_column('orders', 'delivery_otp_hash')
    op.drop_column('orders', 'customer_id')

    op.drop_column('menu_items', 'preparation_time_minutes')
    op.drop_column('menu_items', 'photo_url')

    op.drop_column('dining_tables', 'assigned_waiter_id')

    op.drop_column('restaurants', 'tax_effective_from')
    op.drop_column('restaurants', 'timezone')
    op.drop_column('restaurants', 'invoice_prefix')
    op.drop_column('restaurants', 'auto_print_kot')
    op.drop_column('restaurants', 'upi_vpa')
    op.drop_column('restaurants', 'business_hours')
    op.drop_column('restaurants', 'fssai_number')
    op.drop_column('restaurants', 'gstin')
    op.drop_column('restaurants', 'tagline')
    op.drop_column('restaurants', 'logo_url')

    # Drop new tables in reverse dependency order
    op.drop_table('notifications')
    op.drop_table('menu_item_variants')
    op.drop_table('purchase_order_items')
    op.drop_table('purchase_orders')
    op.drop_table('suppliers')
    op.drop_table('customer_feedback')
    op.drop_table('loyalty_transactions')
    op.drop_table('customers')
