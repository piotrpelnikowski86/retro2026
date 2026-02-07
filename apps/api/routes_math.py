from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import datetime

from database import get_db
from auth import get_current_user
from schemas import SaveMathAttemptRequest, SaveMathAttemptResponse, MathStatisticsResponse, WeakPair
from models import User, MathAttempt, ExerciseType

router = APIRouter()


def calculate_answer(exercise_type: str, operand1: int, operand2: int) -> int:
    """Calculate the correct answer based on exercise type."""
    if exercise_type in ['multiplication', 'column_mult']:
        return operand1 * operand2
    elif exercise_type in ['division', 'column_div']:
        # For division, operand1 is dividend, operand2 is divisor
        return operand1 // operand2
    else:
        raise ValueError(f"Unknown exercise type: {exercise_type}")


@router.post("/math/attempts", response_model=SaveMathAttemptResponse)
async def save_math_attempt(
    request: SaveMathAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a math practice attempt and return feedback."""
    # Validate exercise type
    if request.exercise_type not in ['multiplication', 'division', 'column_mult', 'column_div']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid exercise type"
        )
    
    # Calculate correct answer
    correct_answer = calculate_answer(request.exercise_type, request.operand1, request.operand2)
    is_correct = request.user_answer == correct_answer
    
    # Map string to enum
    exercise_type_enum = {
        'multiplication': ExerciseType.MULTIPLICATION,
        'division': ExerciseType.DIVISION,
        'column_mult': ExerciseType.COLUMN_MULT,
        'column_div': ExerciseType.COLUMN_DIV
    }[request.exercise_type]
    
    # Create attempt record
    attempt = MathAttempt(
        user_id=current_user.id,
        exercise_type=exercise_type_enum,
        operand1=request.operand1,
        operand2=request.operand2,
        correct_answer=correct_answer,
        user_answer=request.user_answer,
        is_correct=is_correct,
        time_spent_seconds=request.time_spent_seconds
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return SaveMathAttemptResponse(
        is_correct=is_correct,
        correct_answer=correct_answer,
        attempt_id=str(attempt.id)
    )


@router.get("/math/statistics", response_model=MathStatisticsResponse)
async def get_math_statistics(
    exercise_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get statistics for the current user's math practice."""
    # Base query
    query = db.query(MathAttempt).filter(MathAttempt.user_id == current_user.id)
    
    # Filter by exercise type if provided
    if exercise_type:
        if exercise_type not in ['multiplication', 'division', 'column_mult', 'column_div']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid exercise type"
            )
        exercise_type_enum = {
            'multiplication': ExerciseType.MULTIPLICATION,
            'division': ExerciseType.DIVISION,
            'column_mult': ExerciseType.COLUMN_MULT,
            'column_div': ExerciseType.COLUMN_DIV
        }[exercise_type]
        query = query.filter(MathAttempt.exercise_type == exercise_type_enum)
    
    # Get all attempts (ordered by created_at)
    attempts = query.order_by(MathAttempt.created_at).all()
    
    # Calculate statistics
    total_attempts = len(attempts)
    correct_count = sum(1 for a in attempts if a.is_correct)
    accuracy_percentage = (correct_count / total_attempts * 100) if total_attempts > 0 else 0.0
    
    # Calculate streaks
    current_streak = 0
    best_streak = 0
    temp_streak = 0
    
    for attempt in reversed(attempts):  # Start from most recent
        if attempt.is_correct:
            temp_streak += 1
            if current_streak == 0:  # Still building current streak
                current_streak = temp_streak
        else:
            if current_streak > 0:  # Current streak just ended
                best_streak = max(best_streak, current_streak)
                current_streak = 0
            temp_streak = 0
    
    # Update best streak if current streak is still ongoing
    best_streak = max(best_streak, current_streak)
    
    # Calculate weakest pairs (pairs with most errors)
    # Only for multiplication/division (not column math)
    weakest_pairs = []
    if not exercise_type or exercise_type in ['multiplication', 'division']:
        error_dict = {}
        
        for attempt in attempts:
            if not attempt.is_correct and attempt.exercise_type in [ExerciseType.MULTIPLICATION, ExerciseType.DIVISION]:
                pair = (attempt.operand1, attempt.operand2)
                error_dict[pair] = error_dict.get(pair, 0) + 1
        
        # Sort by error count and take top 5
        sorted_errors = sorted(error_dict.items(), key=lambda x: x[1], reverse=True)[:5]
        weakest_pairs = [
            WeakPair(operand1=pair[0], operand2=pair[1], error_count=count)
            for pair, count in sorted_errors
        ]
    
    return MathStatisticsResponse(
        total_attempts=total_attempts,
        correct_count=correct_count,
        accuracy_percentage=round(accuracy_percentage, 1),
        current_streak=current_streak,
        best_streak=best_streak,
        weakest_pairs=weakest_pairs
    )
