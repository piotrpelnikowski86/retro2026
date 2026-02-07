"""
Seed script for initial data: admin user + test group 2C with students 2C-1, 2C-2, 2C-3
Run with: python seed.py
"""
import uuid
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base
from models import User, Group, UserRole, Vocabulary

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def seed_data():
    """Seed initial data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Create admin user
        admin_exists = db.query(User).filter(User.username == "admin").first()
        if not admin_exists:
            admin = User(
                id=uuid.uuid4(),
                username="admin",
                role=UserRole.ADMIN,
                password_hash=get_password_hash("admin123"),
                must_change_password=False,
                avatar_preset_id="default"
            )
            db.add(admin)
            print("✓ Created admin user (username: admin, password: admin123)")
        else:
            print("- Admin user already exists")

        # Create test group 2C
        group_2c = db.query(Group).filter(Group.code == "2C").first()
        if not group_2c:
            group_2c = Group(
                id=uuid.uuid4(),
                code="2C"
            )
            db.add(group_2c)
            db.flush()  # Get the ID
            print("✓ Created group 2C")
        else:
            print("- Group 2C already exists")

        # Create test students 2C-1, 2C-2, 2C-3 (bez zer wiodących!)
        for student_no in range(1, 4):
            username = f"2C-{student_no}"
            student_exists = db.query(User).filter(User.username == username).first()
            
            if not student_exists:
                student = User(
                    id=uuid.uuid4(),
                    username=username,
                    role=UserRole.STUDENT,
                    group_id=group_2c.id,
                    student_no=student_no,
                    password_hash=get_password_hash("password123"),
                    must_change_password=True,
                    avatar_preset_id="default"
                )
                db.add(student)
                print(f"✓ Created student {username} (password: password123)")
            else:
                print(f"- Student {username} already exists")

        # Create vocabulary words
        vocabulary_data = [
            # Animals
            ("cat", "kot", "animals", "easy"),
            ("dog", "pies", "animals", "easy"),
            ("bird", "ptak", "animals", "easy"),
            ("fish", "ryba", "animals", "easy"),
            ("horse", "koń", "animals", "easy"),
            
            # Colors
            ("red", "czerwony", "colors", "easy"),
            ("blue", "niebieski", "colors", "easy"),
            ("green", "zielony", "colors", "easy"),
            ("yellow", "żółty", "colors", "easy"),
            ("black", "czarny", "colors", "easy"),
            
            # Common verbs
            ("run", "biegać", "verbs", "medium"),
            ("jump", "skakać", "verbs", "medium"),
            ("eat", "jeść", "verbs", "easy"),
            ("drink", "pić", "verbs", "easy"),
            ("sleep", "spać", "verbs", "easy"),
            
            # Common nouns
            ("house", "dom", "nouns", "easy"),
            ("school", "szkoła", "nouns", "easy"),
            ("book", "książka", "nouns", "easy"),
            ("table", "stół", "nouns", "easy"),
            ("chair", "krzesło", "nouns", "easy"),
            
            # Numbers
            ("one", "jeden", "numbers", "easy"),
            ("two", "dwa", "numbers", "easy"),
            ("three", "trzy", "numbers", "easy"),
            ("four", "cztery", "numbers", "easy"),
            ("five", "pięć", "numbers", "easy"),
        ]
        
        # Get admin user for created_by field
        admin = db.query(User).filter(User.username == "admin").first()
        
        vocab_count = 0
        for english, polish, category, difficulty in vocabulary_data:
            vocab_exists = db.query(Vocabulary).filter(
                Vocabulary.english_word == english
            ).first()
            
            if not vocab_exists:
                vocab = Vocabulary(
                    id=uuid.uuid4(),
                    english_word=english,
                    polish_translation=polish,
                    category=category,
                    difficulty_level=difficulty,
                    created_by=admin.id
                )
                db.add(vocab)
                vocab_count += 1
        
        if vocab_count > 0:
            print(f"✓ Created {vocab_count} vocabulary words")
        else:
            print("- Vocabulary words already exist")

        db.commit()
        print("\n✅ Seed completed successfully!")
        print("\nTest credentials:")
        print("  Admin: admin / admin123")
        print("  Student: 2C-1 / password123")
        print("  Student: 2C-2 / password123")
        print("  Student: 2C-3 / password123")
        print("\n📚 Vocabulary: 25 English-Polish word pairs seeded")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
