"""add materials table

Revision ID: 002
Revises: 001
Create Date: 2026-02-03 21:06:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create MaterialStatus enum
    op.execute("CREATE TYPE materialstatus AS ENUM ('draft', 'published')")
    
    # Create materials table
    op.create_table('materials',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('status', postgresql.ENUM('draft', 'published', name='materialstatus'), nullable=False, server_default='draft'),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('target_classes', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('file_url', sa.String(length=500), nullable=True),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_materials_status', 'materials', ['status'])
    op.create_index('ix_materials_created_at', 'materials', ['created_at'], postgresql_ops={'created_at': 'DESC'})


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_materials_created_at', table_name='materials')
    op.drop_index('ix_materials_status', table_name='materials')
    
    # Drop table
    op.drop_table('materials')
    
    # Drop enum
    op.execute('DROP TYPE materialstatus')
