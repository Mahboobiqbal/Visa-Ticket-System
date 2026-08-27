"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-08-27
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    op.create_table('agents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('commission_rate', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )
    op.create_table('ticket_bookings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=True),
        sa.Column('passenger_name', sa.String(), nullable=False),
        sa.Column('passport_number', sa.String(), nullable=True),
        sa.Column('passport_expiry', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('airline', sa.String(), nullable=True),
        sa.Column('flight_from', sa.String(), nullable=False),
        sa.Column('flight_to', sa.String(), nullable=False),
        sa.Column('booking_ref', sa.String(), nullable=True),
        sa.Column('departure_date', sa.String(), nullable=False),
        sa.Column('return_date', sa.String(), nullable=True),
        sa.Column('ticket_price', sa.Float(), nullable=True),
        sa.Column('selling_price', sa.Float(), nullable=True),
        sa.Column('commission', sa.Float(), nullable=True),
        sa.Column('payment_received', sa.Float(), nullable=True),
        sa.Column('payment_status', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('visa_processings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=True),
        sa.Column('passenger_name', sa.String(), nullable=False),
        sa.Column('passport_number', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('occupation', sa.String(), nullable=True),
        sa.Column('visa_type', sa.String(), nullable=True),
        sa.Column('package', sa.String(), nullable=True),
        sa.Column('total_charges', sa.Float(), nullable=True),
        sa.Column('package_price', sa.Float(), nullable=True),
        sa.Column('total_commission', sa.Float(), nullable=True),
        sa.Column('payment_received', sa.Float(), nullable=True),
        sa.Column('payment_type', sa.String(), nullable=True),
        sa.Column('payment_cash', sa.Float(), nullable=True),
        sa.Column('payment_bank', sa.Float(), nullable=True),
        sa.Column('total_expenses', sa.Float(), nullable=True),
        sa.Column('analysis', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('cashouts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=True),
        sa.Column('visa_id', sa.Integer(), nullable=True),
        sa.Column('ticket_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('date', sa.String(), nullable=True),
        sa.Column('payment_method', sa.String(), nullable=True),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ),
        sa.ForeignKeyConstraint(['visa_id'], ['visa_processings.id'], ),
        sa.ForeignKeyConstraint(['ticket_id'], ['ticket_bookings.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('cashouts')
    op.drop_table('visa_processings')
    op.drop_table('ticket_bookings')
    op.drop_table('settings')
    op.drop_table('agents')
    op.drop_table('users')
