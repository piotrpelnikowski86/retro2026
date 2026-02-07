"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-02-03 18:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create groups table
    op.create_table(
        'groups',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('code', sa.String(), nullable=False),
        sa.UniqueConstraint('code', name='uq_groups_code'),
    )
    op.create_index('ix_groups_code', 'groups', ['code'])

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('STUDENT', 'ADMIN', name='userrole'), nullable=False),
        sa.Column('group_id', UUID(as_uuid=True), nullable=True),
        sa.Column('student_no', sa.Integer(), nullable=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('must_change_password', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('avatar_preset_id', sa.String(), nullable=False, server_default='default'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name='fk_users_group_id'),
        sa.UniqueConstraint('username', name='uq_users_username'),
        sa.UniqueConstraint('group_id', 'student_no', name='uq_group_student_no'),
    )
    op.create_index('ix_users_username', 'users', ['username'])


def downgrade() -> None:
    op.drop_index('ix_users_username', table_name='users')
    op.drop_table('users')
    op.drop_index('ix_groups_code', table_name='groups')
    op.drop_table('groups')
    op.execute('DROP TYPE userrole')
