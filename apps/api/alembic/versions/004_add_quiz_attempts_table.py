"""add quiz_attempts table

Revision ID: 004
Revises: 003
Create Date: 2026-02-03 21:31:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create QuizType enum
    op.execute("CREATE TYPE quiztype AS ENUM ('MATH', 'ENGLISH')")
    
    # Create quiz_attempts table
    op.create_table('quiz_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quiz_type', postgresql.ENUM('MATH', 'ENGLISH', name='quiztype'), nullable=False),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('correct_answers', sa.Integer(), nullable=False),
        sa.Column('score_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('passed', sa.Boolean(), nullable=False),
        sa.Column('questions', postgresql.JSON(), nullable=False),
        sa.Column('answers', postgresql.JSON(), nullable=False),
        sa.Column('time_taken_seconds', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_quiz_attempts_user_id', 'quiz_attempts', ['user_id'])
    op.create_index('ix_quiz_attempts_quiz_type', 'quiz_attempts', ['quiz_type'])
    op.create_index('ix_quiz_attempts_passed', 'quiz_attempts', ['passed'])
    op.create_index('ix_quiz_attempts_created_at', 'quiz_attempts', ['created_at'], postgresql_ops={'created_at': 'DESC'})


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_quiz_attempts_created_at', table_name='quiz_attempts')
    op.drop_index('ix_quiz_attempts_passed', table_name='quiz_attempts')
    op.drop_index('ix_quiz_attempts_quiz_type', table_name='quiz_attempts')
    op.drop_index('ix_quiz_attempts_user_id', table_name='quiz_attempts')
    
    # Drop table
    op.drop_table('quiz_attempts')
    
    # Drop enum
    op.execute('DROP TYPE quiztype')
