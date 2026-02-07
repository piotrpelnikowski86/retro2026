from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from auth import get_current_user
from schemas import CreateMaterialRequest, UpdateMaterialRequest, MaterialResponse
from models import User, Material, MaterialStatus, UserRole

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============= Admin Endpoints =============

@router.post("/admin/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_material(
    request: CreateMaterialRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new material. Admin only."""
    # Validate status
    if request.status not in ['draft', 'published']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'draft' or 'published'"
        )
    
    # Create material
    material = Material(
        title=request.title,
        description=request.description,
        content=request.content,
        status=MaterialStatus.DRAFT if request.status == 'draft' else MaterialStatus.PUBLISHED,
        tags=request.tags or [],
        target_classes=request.target_classes,
        file_url=request.file_url,
        file_type=request.file_type,
        created_by=current_user.id
    )
    
    db.add(material)
    db.commit()
    db.refresh(material)
    
    return MaterialResponse(
        id=str(material.id),
        title=material.title,
        description=material.description,
        content=material.content,
        status=material.status.value,
        tags=material.tags or [],
        target_classes=material.target_classes,
        file_url=material.file_url,
        file_type=material.file_type,
        created_by=str(material.created_by),
        created_at=material.created_at.isoformat(),
        updated_at=material.updated_at.isoformat()
    )


@router.get("/admin/materials", response_model=List[MaterialResponse])
async def list_all_materials(
    status_filter: str | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all materials (admin can see drafts). Admin only."""
    query = db.query(Material)
    
    # Apply filters
    if status_filter:
        if status_filter == 'draft':
            query = query.filter(Material.status == MaterialStatus.DRAFT)
        elif status_filter == 'published':
            query = query.filter(Material.status == MaterialStatus.PUBLISHED)
    
    if tag:
        query = query.filter(Material.tags.contains([tag]))
    
    materials = query.order_by(Material.created_at.desc()).all()
    
    return [
        MaterialResponse(
            id=str(m.id),
            title=m.title,
            description=m.description,
            content=m.content,
            status=m.status.value,
            tags=m.tags or [],
            target_classes=m.target_classes,
            file_url=m.file_url,
            file_type=m.file_type,
            created_by=str(m.created_by),
            created_at=m.created_at.isoformat(),
            updated_at=m.updated_at.isoformat()
        )
        for m in materials
    ]


@router.get("/admin/materials/{material_id}", response_model=MaterialResponse)
async def get_material_admin(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get a specific material. Admin only."""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    return MaterialResponse(
        id=str(material.id),
        title=material.title,
        description=material.description,
        content=material.content,
        status=material.status.value,
        tags=material.tags or [],
        target_classes=material.target_classes,
        file_url=material.file_url,
        file_type=material.file_type,
        created_by=str(material.created_by),
        created_at=material.created_at.isoformat(),
        updated_at=material.updated_at.isoformat()
    )


@router.patch("/admin/materials/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: str,
    request: UpdateMaterialRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a material. Admin only."""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    # Update fields
    if request.title is not None:
        material.title = request.title
    if request.description is not None:
        material.description = request.description
    if request.content is not None:
        material.content = request.content
    if request.status is not None:
        if request.status not in ['draft', 'published']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be 'draft' or 'published'"
            )
        material.status = MaterialStatus.DRAFT if request.status == 'draft' else MaterialStatus.PUBLISHED
    if request.tags is not None:
        material.tags = request.tags
    if request.target_classes is not None:
        material.target_classes = request.target_classes
    if request.file_url is not None:
        material.file_url = request.file_url
    if request.file_type is not None:
        material.file_type = request.file_type
    
    material.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(material)
    
    return MaterialResponse(
        id=str(material.id),
        title=material.title,
        description=material.description,
        content=material.content,
        status=material.status.value,
        tags=material.tags or [],
        target_classes=material.target_classes,
        file_url=material.file_url,
        file_type=material.file_type,
        created_by=str(material.created_by),
        created_at=material.created_at.isoformat(),
        updated_at=material.updated_at.isoformat()
    )


@router.delete("/admin/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a material. Admin only."""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    db.delete(material)
    db.commit()
    
    return None


# ============= Student Endpoints =============

@router.get("/materials", response_model=List[MaterialResponse])
async def list_published_materials(
    tag: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List published materials accessible to the student."""
    query = db.query(Material).filter(Material.status == MaterialStatus.PUBLISHED)
    
    # Filter by student's class if they have one
    if current_user.group_id:
        # Show materials where target_classes is NULL OR contains student's group code
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Material.target_classes.is_(None),
                Material.target_classes.contains([current_user.group.code])
            )
        )
    else:
        # Student with no group sees only materials with no target
        query = query.filter(Material.target_classes.is_(None))
    
    # Filter by tag
    if tag:
        query = query.filter(Material.tags.contains([tag]))
    
    materials = query.order_by(Material.created_at.desc()).all()
    
    return [
        MaterialResponse(
            id=str(m.id),
            title=m.title,
            description=m.description,
            content=m.content,
            status=m.status.value,
            tags=m.tags or [],
            target_classes=m.target_classes,
            file_url=m.file_url,
            file_type=m.file_type,
            created_by=str(m.created_by),
            created_at=m.created_at.isoformat(),
            updated_at=m.updated_at.isoformat()
        )
        for m in materials
    ]


@router.get("/materials/{material_id}", response_model=MaterialResponse)
async def get_material_student(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific published material if student has access."""
    material = db.query(Material).filter(
        Material.id == material_id,
        Material.status == MaterialStatus.PUBLISHED
    ).first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    # Check access
    if material.target_classes is not None:
        if not current_user.group_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this material"
            )
        if current_user.group.code not in material.target_classes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this material"
            )
    
    return MaterialResponse(
        id=str(material.id),
        title=material.title,
        description=material.description,
        content=material.content,
        status=material.status.value,
        tags=material.tags or [],
        target_classes=material.target_classes,
        file_url=material.file_url,
        file_type=material.file_type,
        created_by=str(material.created_by),
        created_at=material.created_at.isoformat(),
        updated_at=material.updated_at.isoformat()
    )
