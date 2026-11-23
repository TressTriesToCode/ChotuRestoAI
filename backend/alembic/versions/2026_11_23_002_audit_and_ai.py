"""Add audit_logs and ai_conversations tables

Revision ID: 002_audit_and_ai
Revises: 001_initial_schema
Create Date: 2026-11-23 22:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_audit_and_ai'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('action', sa.String(64), nullable=False),
        sa.Column('entity', sa.String(64), nullable=False),
        sa.Column('entity_id', sa.String(64), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('ix_audit_logs_restaurant_id', 'audit_logs', ['restaurant_id'])

    # 2. AI Conversations
    op.create_table(
        'ai_conversations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('restaurant_id', sa.String(36), sa.ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('role', sa.String(32), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('intent', sa.String(64), nullable=True),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('ix_ai_conversations_restaurant_id', 'ai_conversations', ['restaurant_id'])

def downgrade() -> None:
    op.drop_table('ai_conversations')
    op.drop_table('audit_logs')
