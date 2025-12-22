"""Add favorites table

Revision ID: 002
Revises: 001
Create Date: 2024-12-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Favorites table
    op.create_table(
        'favorites',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('destination_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id']),
        sa.UniqueConstraint('user_id', 'destination_id', name='unique_user_destination'),
    )
    op.create_index('ix_favorites_user_id', 'favorites', ['user_id'])
    op.create_index('ix_favorites_destination_id', 'favorites', ['destination_id'])


def downgrade() -> None:
    op.drop_index('ix_favorites_destination_id', table_name='favorites')
    op.drop_index('ix_favorites_user_id', table_name='favorites')
    op.drop_table('favorites')

