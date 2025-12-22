"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-12-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Destinations table
    op.create_table(
        'destinations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('latitude', sa.Numeric(10, 8), nullable=False),
        sa.Column('longitude', sa.Numeric(11, 8), nullable=False),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
    )

    # Navigation Sessions table
    op.create_table(
        'navigation_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('destination_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('start_latitude', sa.Numeric(10, 8), nullable=True),
        sa.Column('start_longitude', sa.Numeric(11, 8), nullable=True),
        sa.Column('end_latitude', sa.Numeric(10, 8), nullable=True),
        sa.Column('end_longitude', sa.Numeric(11, 8), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'COMPLETED', 'CANCELLED', name='sessionstatus'), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('total_distance', sa.Numeric(10, 2), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id']),
    )
    op.create_index('idx_sessions_user_status', 'navigation_sessions', ['user_id', 'status'])

    # Navigation Points table
    op.create_table(
        'navigation_points',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('latitude', sa.Numeric(10, 8), nullable=False),
        sa.Column('longitude', sa.Numeric(11, 8), nullable=False),
        sa.Column('heading', sa.Numeric(5, 2), nullable=True),
        sa.Column('accuracy', sa.Numeric(5, 2), nullable=True),
        sa.Column('distance_to_target', sa.Numeric(10, 2), nullable=True),
        sa.Column('bearing', sa.Numeric(5, 2), nullable=True),
        sa.Column('relative_angle', sa.Numeric(5, 2), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['navigation_sessions.id']),
    )
    op.create_index('idx_nav_points_session_time', 'navigation_points', ['session_id', 'recorded_at'])

    # Feedback table
    op.create_table(
        'feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['navigation_sessions.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    op.create_index('idx_feedback_session', 'feedback', ['session_id'])

    # Analytics Events table
    op.create_table(
        'analytics_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('event_data', postgresql.JSONB(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['navigation_sessions.id']),
    )
    op.create_index('idx_analytics_session_type_time', 'analytics_events', ['session_id', 'event_type', 'recorded_at'])


def downgrade() -> None:
    op.drop_index('idx_analytics_session_type_time', table_name='analytics_events')
    op.drop_table('analytics_events')
    op.drop_index('idx_feedback_session', table_name='feedback')
    op.drop_table('feedback')
    op.drop_index('idx_nav_points_session_time', table_name='navigation_points')
    op.drop_table('navigation_points')
    op.drop_index('idx_sessions_user_status', table_name='navigation_sessions')
    op.drop_table('navigation_sessions')
    op.drop_table('destinations')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
    op.execute('DROP TYPE sessionstatus')

