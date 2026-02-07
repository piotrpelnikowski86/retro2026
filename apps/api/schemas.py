from pydantic import BaseModel
from typing import Optional
from models import UserRole


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# User schemas
class UserBase(BaseModel):
    username: str
    role: UserRole


class UserResponse(BaseModel):
    id: str
    username: str
    role: UserRole
    group_id: Optional[str]
    student_no: Optional[int]
    must_change_password: bool
    avatar_preset_id: str

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateAvatarRequest(BaseModel):
    avatar_preset_id: str


# Group schemas
class GroupBase(BaseModel):
    code: str


class CreateGroupRequest(BaseModel):
    code: str


class UpdateGroupRequest(BaseModel):
    code: str


class GroupResponse(BaseModel):
    id: str
    code: str
    student_count: int = 0

    class Config:
        from_attributes = True


# Student management schemas
class BulkCreateStudentsRequest(BaseModel):
    group_id: str
    start_number: int
    end_number: int
    default_password: str = "password123"


class StudentCreatedResponse(BaseModel):
    username: str
    password: str
    is_new: bool


class BulkCreateStudentsResponse(BaseModel):
    created_count: int
    skipped_count: int
    students: list[StudentCreatedResponse]


class ResetPasswordRequest(BaseModel):
    new_password: str


class StudentResponse(BaseModel):
    id: str
    username: str
    role: UserRole
    group_id: str | None
    student_no: int | None
    must_change_password: bool
    avatar_preset_id: str

    class Config:
        from_attributes = True


# Material schemas
class MaterialStatus(str, BaseModel):
    DRAFT = "draft"
    PUBLISHED = "published"


class CreateMaterialRequest(BaseModel):
    title: str
    description: str | None = None
    content: str | None = None
    status: str = "draft"  # 'draft' or 'published'
    tags: list[str] = []
    target_classes: list[str] | None = None
    file_url: str | None = None
    file_type: str | None = None


class UpdateMaterialRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    content: str | None = None
    status: str | None = None
    tags: list[str] | None = None
    target_classes: list[str] | None = None
    file_url: str | None = None
    file_type: str | None = None


class MaterialResponse(BaseModel):
    id: str
    title: str
    description: str | None
    content: str | None
    status: str
    tags: list[str]
    target_classes: list[str] | None
    file_url: str | None
    file_type: str | None
    created_by: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# Math exercise schemas
class SaveMathAttemptRequest(BaseModel):
    exercise_type: str  # 'multiplication', 'division', 'column_mult', 'column_div'
    operand1: int
    operand2: int
    user_answer: int
    time_spent_seconds: int | None = None


class SaveMathAttemptResponse(BaseModel):
    is_correct: bool
    correct_answer: int
    attempt_id: str


class WeakPair(BaseModel):
    operand1: int
    operand2: int
    error_count: int


class MathStatisticsResponse(BaseModel):
    total_attempts: int
    correct_count: int
    accuracy_percentage: float
    current_streak: int
    best_streak: int
    weakest_pairs: list[WeakPair]


# Quiz schemas
class QuizQuestionResponse(BaseModel):
    question_id: int
    operation: str  # 'multiplication' or 'division'
    question_text: str


class StartQuizResponse(BaseModel):
    session_id: str
    questions: list[QuizQuestionResponse]


class SubmitAnswer(BaseModel):
    question_id: int
    answer: int


class SubmitQuizRequest(BaseModel):
    session_id: str
    answers: list[SubmitAnswer]
    time_taken_seconds: int | None = None


class QuizResult(BaseModel):
    question_id: int
    question_text: str
    user_answer: int | None
    correct_answer: int
    is_correct: bool


class SubmitQuizResponse(BaseModel):
    attempt_id: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    passed: bool
    passing_threshold: int
    results: list[QuizResult]


class QuizAttemptSummary(BaseModel):
    id: str
    quiz_type: str
    score_percentage: float
    passed: bool
    created_at: str


# Vocabulary schemas
class CreateVocabularyRequest(BaseModel):
    english_word: str
    polish_translation: str
    category: str | None = None
    difficulty_level: str | None = None


class UpdateVocabularyRequest(BaseModel):
    english_word: str | None = None
    polish_translation: str | None = None
    category: str | None = None
    difficulty_level: str | None = None


class VocabularyResponse(BaseModel):
    id: str
    english_word: str
    polish_translation: str
    category: str | None
    difficulty_level: str | None
    created_by: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

