from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random

from database import get_db
from auth import get_current_user
from schemas import (
    CreateVocabularyRequest, UpdateVocabularyRequest, VocabularyResponse,
    StartQuizResponse, QuizQuestionResponse, SubmitQuizRequest, SubmitQuizResponse,
    QuizResult
)
from models import User, UserRole, Vocabulary, QuizAttempt, QuizType
from datetime import datetime
import uuid

router = APIRouter()

# In-memory storage for vocab quiz sessions
vocab_quiz_sessions = {}

PASSING_THRESHOLD = 80  # 80% to pass


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============= ADMIN CRUD =============

@router.post("/admin/vocabulary", response_model=VocabularyResponse, status_code=status.HTTP_201_CREATED)
async def create_vocabulary(
    request: CreateVocabularyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new vocabulary word (admin only)."""
    vocab = Vocabulary(
        english_word=request.english_word,
        polish_translation=request.polish_translation,
        category=request.category,
        difficulty_level=request.difficulty_level,
        created_by=current_user.id
    )
    db.add(vocab)
    db.commit()
    db.refresh(vocab)
    
    return VocabularyResponse(
        id=str(vocab.id),
        english_word=vocab.english_word,
        polish_translation=vocab.polish_translation,
        category=vocab.category,
        difficulty_level=vocab.difficulty_level,
        created_by=str(vocab.created_by),
        created_at=vocab.created_at.isoformat(),
        updated_at=vocab.updated_at.isoformat()
    )


@router.get("/admin/vocabulary", response_model=List[VocabularyResponse])
async def list_vocabulary(
    category: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all vocabulary words (admin only)."""
    query = db.query(Vocabulary)
    
    if category:
        query = query.filter(Vocabulary.category == category)
    
    vocab_list = query.order_by(Vocabulary.english_word).all()
    
    return [
        VocabularyResponse(
            id=str(v.id),
            english_word=v.english_word,
            polish_translation=v.polish_translation,
            category=v.category,
            difficulty_level=v.difficulty_level,
            created_by=str(v.created_by),
            created_at=v.created_at.isoformat(),
            updated_at=v.updated_at.isoformat()
        )
        for v in vocab_list
    ]


@router.get("/admin/vocabulary/{vocab_id}", response_model=VocabularyResponse)
async def get_vocabulary(
    vocab_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get a specific vocabulary word (admin only)."""
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    return VocabularyResponse(
        id=str(vocab.id),
        english_word=vocab.english_word,
        polish_translation=vocab.polish_translation,
        category=vocab.category,
        difficulty_level=vocab.difficulty_level,
        created_by=str(vocab.created_by),
        created_at=vocab.created_at.isoformat(),
        updated_at=vocab.updated_at.isoformat()
    )


@router.patch("/admin/vocabulary/{vocab_id}", response_model=VocabularyResponse)
async def update_vocabulary(
    vocab_id: str,
    request: UpdateVocabularyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a vocabulary word (admin only)."""
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    if request.english_word is not None:
        vocab.english_word = request.english_word
    if request.polish_translation is not None:
        vocab.polish_translation = request.polish_translation
    if request.category is not None:
        vocab.category = request.category
    if request.difficulty_level is not None:
        vocab.difficulty_level = request.difficulty_level
    
    vocab.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(vocab)
    
    return VocabularyResponse(
        id=str(vocab.id),
        english_word=vocab.english_word,
        polish_translation=vocab.polish_translation,
        category=vocab.category,
        difficulty_level=vocab.difficulty_level,
        created_by=str(vocab.created_by),
        created_at=vocab.created_at.isoformat(),
        updated_at=vocab.updated_at.isoformat()
    )


@router.delete("/admin/vocabulary/{vocab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vocabulary(
    vocab_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a vocabulary word (admin only)."""
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    db.delete(vocab)
    db.commit()


# ============= ENGLISH QUIZ =============

class VocabQuizQuestion:
    """Internal vocab quiz question representation."""
    def __init__(self, question_id: int, direction: str, question_text: str, correct_answer: str, vocab_id: str):
        self.question_id = question_id
        self.direction = direction  # 'en_to_pl' or 'pl_to_en'
        self.question_text = question_text
        self.correct_answer = correct_answer
        self.vocab_id = vocab_id


def generate_vocab_quiz(db: Session) -> List[VocabQuizQuestion]:
    """
    Generate 20 vocabulary questions.
    - 10 EN→PL
    - 10 PL→EN
    - Randomly selected from database
    """
    # Get all vocabulary
    all_vocab = db.query(Vocabulary).all()
    
    if len(all_vocab) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough vocabulary words (minimum 10 required)"
        )
    
    # Sample 20 words (or all if less than 20)
    sample_size = min(20, len(all_vocab))
    selected_vocab = random.sample(all_vocab, sample_size)
    
    questions = []
    question_id = 1
    
    # Create questions - half EN→PL, half PL→EN
    for i, vocab in enumerate(selected_vocab):
        if i < sample_size // 2:
            # EN→PL
            questions.append(VocabQuizQuestion(
                question_id=question_id,
                direction='en_to_pl',
                question_text=f"Translate: {vocab.english_word} → ?",
                correct_answer=vocab.polish_translation.lower().strip(),
                vocab_id=str(vocab.id)
            ))
        else:
            # PL→EN
            questions.append(VocabQuizQuestion(
                question_id=question_id,
                direction='pl_to_en',
                question_text=f"Przetłumacz: {vocab.polish_translation} → ?",
                correct_answer=vocab.english_word.lower().strip(),
                vocab_id=str(vocab.id)
            ))
        question_id += 1
    
    # Shuffle
    random.shuffle(questions)
    
    # Renumber
    for i, q in enumerate(questions, 1):
        q.question_id = i
    
    return questions


@router.post("/quiz/english/start", response_model=StartQuizResponse)
async def start_english_quiz(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new English vocabulary quiz."""
    questions = generate_vocab_quiz(db)
    
    session_id = str(uuid.uuid4())
    
    vocab_quiz_sessions[session_id] = {
        'user_id': str(current_user.id),
        'questions': questions,
        'created_at': datetime.utcnow()
    }
    
    return StartQuizResponse(
        session_id=session_id,
        questions=[
            QuizQuestionResponse(
                question_id=q.question_id,
                operation=q.direction,  # 'en_to_pl' or 'pl_to_en'
                question_text=q.question_text
            )
            for q in questions
        ]
    )


@router.post("/quiz/english/submit", response_model=SubmitQuizResponse)
async def submit_english_quiz(
    request: SubmitQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit English quiz answers and get results."""
    if request.session_id not in vocab_quiz_sessions:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    session = vocab_quiz_sessions[request.session_id]
    
    if session['user_id'] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    questions = session['questions']
    answer_dict = {a.question_id: a.answer for a in request.answers}
    
    # Grade quiz
    results = []
    correct_count = 0
    
    for q in questions:
        user_answer_raw = answer_dict.get(q.question_id)
        # Normalize: lowercase and strip
        user_answer = str(user_answer_raw).lower().strip() if user_answer_raw is not None else ""
        is_correct = user_answer == q.correct_answer
        
        if is_correct:
            correct_count += 1
        
        results.append(QuizResult(
            question_id=q.question_id,
            question_text=q.question_text,
            user_answer=user_answer_raw,
            correct_answer=q.correct_answer,
            is_correct=is_correct
        ))
    
    total_questions = len(questions)
    score_percentage = (correct_count / total_questions) * 100
    passed = score_percentage >= PASSING_THRESHOLD
    
    # Save to database
    quiz_attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_type=QuizType.ENGLISH,
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=round(score_percentage, 2),
        passed=passed,
        questions=[
            {
                'question_id': q.question_id,
                'direction': q.direction,
                'question_text': q.question_text,
                'correct_answer': q.correct_answer,
                'vocab_id': q.vocab_id
            }
            for q in questions
        ],
        answers=[{'question_id': qid, 'answer': ans} for qid, ans in answer_dict.items()],
        time_taken_seconds=request.time_taken_seconds
    )
    
    db.add(quiz_attempt)
    db.commit()
    db.refresh(quiz_attempt)
    
    del vocab_quiz_sessions[request.session_id]
    
    return SubmitQuizResponse(
        attempt_id=str(quiz_attempt.id),
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=round(score_percentage, 1),
        passed=passed,
        passing_threshold=PASSING_THRESHOLD,
        results=results
    )
