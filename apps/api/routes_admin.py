from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import io
import csv

from database import get_db
from auth import get_current_user, get_password_hash
from schemas import (
    CreateGroupRequest, UpdateGroupRequest, GroupResponse,
    BulkCreateStudentsRequest, BulkCreateStudentsResponse, StudentCreatedResponse,
    ResetPasswordRequest, StudentResponse
)
from models import User, Group, UserRole

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.post("/admin/groups", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    request: CreateGroupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new group/class. Admin only."""
    # Check if group code already exists
    existing_group = db.query(Group).filter(Group.code == request.code).first()
    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Group with code '{request.code}' already exists"
        )
    
    # Create new group
    new_group = Group(code=request.code)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Count students in this group
    student_count = db.query(User).filter(User.group_id == new_group.id).count()
    
    return GroupResponse(
        id=str(new_group.id),
        code=new_group.code,
        student_count=student_count
    )


@router.get("/admin/groups", response_model=List[GroupResponse])
async def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all groups. Admin only."""
    groups = db.query(Group).all()
    
    result = []
    for group in groups:
        student_count = db.query(User).filter(User.group_id == group.id).count()
        result.append(GroupResponse(
            id=str(group.id),
            code=group.code,
            student_count=student_count
        ))
    
    return result


@router.get("/admin/groups/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get a specific group by ID. Admin only."""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    student_count = db.query(User).filter(User.group_id == group.id).count()
    
    return GroupResponse(
        id=str(group.id),
        code=group.code,
        student_count=student_count
    )


@router.patch("/admin/groups/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    request: UpdateGroupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a group's code. Admin only."""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if new code already exists (excluding current group)
    existing_group = db.query(Group).filter(
        Group.code == request.code,
        Group.id != group_id
    ).first()
    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Group with code '{request.code}' already exists"
        )
    
    # Update group
    group.code = request.code
    db.commit()
    db.refresh(group)
    
    student_count = db.query(User).filter(User.group_id == group.id).count()
    
    return GroupResponse(
        id=str(group.id),
        code=group.code,
        student_count=student_count
    )


@router.delete("/admin/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a group. Admin only. Cannot delete if group has students."""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if group has students
    student_count = db.query(User).filter(User.group_id == group.id).count()
    if student_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete group with {student_count} students. Remove students first."
        )
    
    db.delete(group)
    db.commit()
    
    return None


# ============= Student Management =============

@router.post("/admin/students/bulk-create", response_model=BulkCreateStudentsResponse)
async def bulk_create_students(
    request: BulkCreateStudentsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Bulk create students for a group with format: {groupCode}-{studentNo}.
    Example: For group "2C", student #15 becomes "2C-15" (NO leading zeros).
    Skips existing students.
    Admin only.
    """
    # Verify group exists
    group = db.query(Group).filter(Group.id == request.group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Validate number range
    if request.start_number < 1 or request.end_number < request.start_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student number range"
        )
    
    if request.end_number - request.start_number > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create more than 100 students at once"
        )
    
    created_count = 0
    skipped_count = 0
    students_result = []
    
    for student_no in range(request.start_number, request.end_number + 1):
        # Format: 2C-15 (NO leading zeros)
        username = f"{group.code}-{student_no}"
        
        # Check if student already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            skipped_count += 1
            students_result.append(StudentCreatedResponse(
                username=username,
                password="(existing)",
                is_new=False
            ))
            continue
        
        # Create new student
        new_student = User(
            username=username,
            role=UserRole.STUDENT,
            group_id=group.id,
            student_no=student_no,
            password_hash=get_password_hash(request.default_password),
            must_change_password=True,
            avatar_preset_id="default"
        )
        db.add(new_student)
        created_count += 1
        
        students_result.append(StudentCreatedResponse(
            username=username,
            password=request.default_password,
            is_new=True
        ))
    
    db.commit()
    
    return BulkCreateStudentsResponse(
        created_count=created_count,
        skipped_count=skipped_count,
        students=students_result
    )


@router.get("/admin/students/export.csv")
async def export_students_csv(
    group_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Export students to CSV. If group_id is provided, export only that group.
    Admin only.
    """
    query = db.query(User).filter(User.role == UserRole.STUDENT)
    
    if group_id:
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )
        query = query.filter(User.group_id == group_id)
    
    students = query.all()
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Username", "Group Code", "Student No", "Must Change Password", "Avatar"])
    
    # Data
    for student in students:
        group_code = student.group.code if student.group else "N/A"
        writer.writerow([
            student.username,
            group_code,
            student.student_no,
            "Yes" if student.must_change_password else "No",
            student.avatar_preset_id
        ])
    
    # Return CSV as download
    output.seek(0)
    filename = f"students_{group.code if group_id else 'all'}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/admin/students", response_model=List[StudentResponse])
async def list_students(
    group_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all students or students from a specific group. Admin only."""
    query = db.query(User).filter(User.role == UserRole.STUDENT)
    
    if group_id:
        query = query.filter(User.group_id == group_id)
    
    students = query.all()
    
    return [
        StudentResponse(
            id=str(s.id),
            username=s.username,
            role=s.role,
            group_id=str(s.group_id) if s.group_id else None,
            student_no=s.student_no,
            must_change_password=s.must_change_password,
            avatar_preset_id=s.avatar_preset_id
        )
        for s in students
    ]


@router.post("/admin/students/{student_id}/reset-password")
async def reset_student_password(
    student_id: str,
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Reset a student's password. Admin only."""
    student = db.query(User).filter(
        User.id == student_id,
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    student.password_hash = get_password_hash(request.new_password)
    student.must_change_password = True
    db.commit()
    
    return {"message": f"Password reset for {student.username}"}


@router.post("/admin/groups/{group_id}/reset-passwords")
async def reset_group_passwords(
    group_id: str,
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Reset passwords for all students in a group. Admin only."""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    students = db.query(User).filter(
        User.group_id == group_id,
        User.role == UserRole.STUDENT
    ).all()
    
    if not students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No students found in this group"
        )
    
    count = 0
    for student in students:
        student.password_hash = get_password_hash(request.new_password)
        student.must_change_password = True
        count += 1
    
    db.commit()
    
    return {"message": f"Password reset for {count} students in group {group.code}"}

