"""Make product_id nullable in order_items with SET NULL on delete

Revision ID: 002_nullable_product_fk
Revises: 001_initial_tables
Create Date: 2026-06-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_nullable_product_fk'
down_revision = '001_initial_tables'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Drop existing FK constraint (PostgreSQL auto-names it tablename_colname_fkey)
    op.drop_constraint('order_items_product_id_fkey', 'order_items', type_='foreignkey')
    # Make column nullable
    op.alter_column('order_items', 'product_id', nullable=True)
    # Re-create FK with SET NULL
    op.create_foreign_key(
        'order_items_product_id_fkey', 'order_items', 'products',
        ['product_id'], ['id'], ondelete='SET NULL'
    )

def downgrade() -> None:
    op.drop_constraint('order_items_product_id_fkey', 'order_items', type_='foreignkey')
    op.alter_column('order_items', 'product_id', nullable=False)
    op.create_foreign_key(
        'order_items_product_id_fkey', 'order_items', 'products',
        ['product_id'], ['id'], ondelete='RESTRICT'
    )
