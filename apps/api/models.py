import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Enum as SQLEnum, UniqueConstraint, Text, ARRAY, DateTime, JSON, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"


class MaterialStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Group(Base):
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, nullable=False, unique=True, index=True)

    # Relationships
    users = relationship("User", back_populates="group")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, nullable=False, unique=True, index=True)
    role = Column(SQLEnum(UserRole), nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True)
    student_no = Column(Integer, nullable=True)
    password_hash = Column(String, nullable=False)
    must_change_password = Column(Boolean, default=True, nullable=False)
    avatar_preset_id = Column(String, nullable=False, default="default")

    # Relationships
    group = relationship("Group", back_populates="users")
    materials = relationship("Material", back_populates="creator")

    # Constraints
    __table_args__ = (
        UniqueConstraint('group_id', 'student_no', name='uq_group_student_no'),
    )


class Material(Base):
    __tablename__ = "materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    status = Column(SQLEnum(MaterialStatus), nullable=False, default=MaterialStatus.DRAFT, index=True)
    tags = Column(ARRAY(String), nullable=False, default=[])
    target_classes = Column(ARRAY(String), nullable=True)  # NULL = all classes
    file_url = Column(String(500), nullable=True)
    file_type = Column(String(50), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="materials")


class ExerciseType(str, enum.Enum):
    MULTIPLICATION = "multiplication"
    DIVISION = "division"
    COLUMN_MULT = "column_mult"
    COLUMN_DIV = "column_div"


class MathAttempt(Base):
    __tablename__ = "math_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    exercise_type = Column(SQLEnum(ExerciseType), nullable=False, index=True)
    operand1 = Column(Integer, nullable=False)
    operand2 = Column(Integer, nullable=False)
    correct_answer = Column(Integer, nullable=False)
    user_answer = Column(Integer, nullable=True)
    is_correct = Column(Boolean, nullable=False)
    time_spent_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User")


class QuizType(str, enum.Enum):
    MATH = "MATH"
    ENGLISH = "ENGLISH"


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    quiz_type = Column(SQLEnum(QuizType), nullable=False, index=True)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percentage = Column(Numeric(5, 2), nullable=False)
    passed = Column(Boolean, nullable=False, index=True)
    questions = Column(JSON, nullable=False)  # Array of question objects
    answers = Column(JSON, nullable=False)    # Array of user answers
    time_taken_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User")


class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    english_word = Column(String(255), nullable=False, index=True)
    polish_translation = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)  # e.g., "animals", "colors", "verbs"
    difficulty_level = Column(String(50), nullable=True)  # "easy", "medium", "hard"
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User")

