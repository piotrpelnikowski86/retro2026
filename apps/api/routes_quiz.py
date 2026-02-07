from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import random
import uuid

from database import get_db
from auth import get_current_user
from schemas import (
    StartQuizResponse, QuizQuestionResponse, SubmitQuizRequest, SubmitQuizResponse,
    QuizResult, QuizAttemptSummary
)
from models import User, QuizAttempt, QuizType

router = APIRouter()

# In-memory storage for quiz sessions (in production, use Redis)
quiz_sessions = {}

PASSING_THRESHOLD = 80  # 80% to pass


class QuizQuestion:
    """Internal quiz question representation."""
    def __init__(self, question_id: int, operation: str, operand1: int, operand2: int, question_text: str, correct_answer: int):
        self.question_id = question_id
        self.operation = operation
        self.operand1 = operand1
        self.operand2 = operand2
        self.question_text = question_text
        self.correct_answer = correct_answer


def generate_math_question(operation: str, question_id: int) -> QuizQuestion:
    """
    Generate a single math question with operands 2-9 ONLY.
    
    CRITICAL RULES:
    - Operands must be 2-9 (NO 1 or 10!)
    - Division must always be divisible (no remainder)
    """
    if operation == 'multiplication':
        operand1 = random.randint(2, 9)
        operand2 = random.randint(2, 9)
        answer = operand1 * operand2
        text = f"{operand1} × {operand2} = ?"
        return QuizQuestion(question_id, operation, operand1, operand2, text, answer)
    
    elif operation == 'division':
        # Generate division that's always divisible
        divisor = random.randint(2, 9)
        quotient = random.randint(2, 9)
        dividend = divisor * quotient
        text = f"{dividend} ÷ {divisor} = ?"
        return QuizQuestion(question_id, operation, dividend, divisor, text, quotient)
    
    else:
        raise ValueError(f"Unknown operation: {operation}")


def generate_quiz_session() -> List[QuizQuestion]:
    """
    Generate 20 questions for a math quiz.
    - 10 multiplication
    - 10 division
    - All shuffled
    """
    questions = []
    question_id = 1
    
    # 10 multiplication
    for _ in range(10):
        q = generate_math_question('multiplication', question_id)
        questions.append(q)
        question_id += 1
    
    # 10 division
    for _ in range(10):
        q = generate_math_question('division', question_id)
        questions.append(q)
        question_id += 1
    
    # Shuffle
    random.shuffle(questions)
    
    # Renumber after shuffle
    for i, q in enumerate(questions, 1):
        q.question_id = i
    
    return questions


@router.post("/quiz/math/start", response_model=StartQuizResponse)
async def start_math_quiz(
    current_user: User = Depends(get_current_user)
):
    """Start a new math quiz session."""
    # Generate questions
    questions = generate_quiz_session()
    
    # Create session ID
    session_id = str(uuid.uuid4())
    
    # Store session (in production, use Redis with expiry)
    quiz_sessions[session_id] = {
        'user_id': str(current_user.id),
        'questions': questions,
        'created_at': datetime.utcnow()
    }
    
    # Return questions without answers
    return StartQuizResponse(
        session_id=session_id,
        questions=[
            QuizQuestionResponse(
                question_id=q.question_id,
                operation=q.operation,
                question_text=q.question_text
            )
            for q in questions
        ]
    )


@router.post("/quiz/math/submit", response_model=SubmitQuizResponse)
async def submit_math_quiz(
    request: SubmitQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit quiz answers and get results."""
    # Validate session
    if request.session_id not in quiz_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found or expired"
        )
    
    session = quiz_sessions[request.session_id]
    
    # Verify user owns this session
    if session['user_id'] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit this quiz"
        )
    
    questions = session['questions']
    
    # Create answer lookup
    answer_dict = {a.question_id: a.answer for a in request.answers}
    
    # Grade quiz
    results = []
    correct_count = 0
    
    for q in questions:
        user_answer = answer_dict.get(q.question_id)
        is_correct = user_answer == q.correct_answer if user_answer is not None else False
        
        if is_correct:
            correct_count += 1
        
        results.append(QuizResult(
            question_id=q.question_id,
            question_text=q.question_text,
            user_answer=user_answer,
            correct_answer=q.correct_answer,
            is_correct=is_correct
        ))
    
    # Calculate score
    total_questions = len(questions)
    score_percentage = (correct_count / total_questions) * 100
    passed = score_percentage >= PASSING_THRESHOLD
    
    # Save to database
    quiz_attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_type=QuizType.MATH,
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=round(score_percentage, 2),
        passed=passed,
        questions=[
            {
                'question_id': q.question_id,
                'operation': q.operation,
                'operand1': q.operand1,
                'operand2': q.operand2,
                'question_text': q.question_text,
                'correct_answer': q.correct_answer
            }
            for q in questions
        ],
        answers=[
            {'question_id': qid, 'answer': ans}
            for qid, ans in answer_dict.items()
        ],
        time_taken_seconds=request.time_taken_seconds
    )
    
    db.add(quiz_attempt)
    db.commit()
    db.refresh(quiz_attempt)
    
    # Clean up session
    del quiz_sessions[request.session_id]
    
    return SubmitQuizResponse(
        attempt_id=str(quiz_attempt.id),
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=round(score_percentage, 1),
        passed=passed,
        passing_threshold=PASSING_THRESHOLD,
        results=results
    )


@router.get("/quiz/attempts", response_model=List[QuizAttemptSummary])
async def get_quiz_history(
    quiz_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get quiz attempt history for current user."""
    query = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id)
    
    if quiz_type:
        if quiz_type not in ['MATH', 'ENGLISH']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid quiz type"
            )
        quiz_type_enum = QuizType.MATH if quiz_type == 'MATH' else QuizType.ENGLISH
        query = query.filter(QuizAttempt.quiz_type == quiz_type_enum)
    
    attempts = query.order_by(QuizAttempt.created_at.desc()).all()
    
    return [
        QuizAttemptSummary(
            id=str(attempt.id),
            quiz_type=attempt.quiz_type.value,
            score_percentage=float(attempt.score_percentage),
            passed=attempt.passed,
            created_at=attempt.created_at.isoformat()
        )
        for attempt in attempts
    ]
