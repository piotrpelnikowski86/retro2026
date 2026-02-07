"""add vocabulary table

Revision ID: 005
Revises: 004
Create Date: 2026-02-03 21:38:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create vocabulary table
    op.create_table('vocabulary',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column('english_word', sa.String(length=255), nullable=False),
        sa.Column('polish_translation', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('difficulty_level', sa.String(length=50), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index
    op.create_index('ix_vocabulary_english_word', 'vocabulary', ['english_word'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_vocabulary_english_word', table_name='vocabulary')
    
    # Drop table
    op.drop_table('vocabulary')
