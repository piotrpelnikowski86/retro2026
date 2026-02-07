"""add math_attempts table

Revision ID: 003
Revises: 002
Create Date: 2026-02-03 21:17:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ExerciseType enum
    op.execute("CREATE TYPE exercisetype AS ENUM ('multiplication', 'division', 'column_mult', 'column_div')")
    
    # Create math_attempts table
    op.create_table('math_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('exercise_type', postgresql.ENUM('multiplication', 'division', 'column_mult', 'column_div', name='exercisetype'), nullable=False),
        sa.Column('operand1', sa.Integer(), nullable=False),
        sa.Column('operand2', sa.Integer(), nullable=False),
        sa.Column('correct_answer', sa.Integer(), nullable=False),
        sa.Column('user_answer', sa.Integer(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('time_spent_seconds', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_math_attempts_user_id', 'math_attempts', ['user_id'])
    op.create_index('ix_math_attempts_exercise_type', 'math_attempts', ['exercise_type'])
    op.create_index('ix_math_attempts_created_at', 'math_attempts', ['created_at'], postgresql_ops={'created_at': 'DESC'})


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_math_attempts_created_at', table_name='math_attempts')
    op.drop_index('ix_math_attempts_exercise_type', table_name='math_attempts')
    op.drop_index('ix_math_attempts_user_id', table_name='math_attempts')
    
    # Drop table
    op.drop_table('math_attempts')
    
    # Drop enum
    op.execute('DROP TYPE exercisetype')
