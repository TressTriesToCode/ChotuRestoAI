import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.table import DiningTable
from app.models.audit_log import AuditLog
from app.schemas.staff import StaffCreate, StaffResponse, StaffStatusUpdate, WaiterAssignmentRequest
from app.api.deps import get_current_user, check_permission
from app.core.security import get_password_hash

router = APIRouter()

@router.get("", response_model=List[StaffResponse])
def get_staff_directory(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("staff:read"))
):
    users = db.query(User).filter(User.restaurant_id == current_user.restaurant_id).order_by(User.full_name).all()
    return users

@router.post("", response_model=StaffResponse)
def create_staff_account(
    req: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("staff:write"))
):
    # Check if email is already taken
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email address already exists")

    new_user = User(
        id=f"user-{uuid.uuid4().hex[:8]}",
        restaurant_id=current_user.restaurant_id,
        email=req.email.lower().strip(),
        full_name=req.full_name,
        hashed_password=get_password_hash(req.password),
        role=req.role,
        is_active=True,
        phone=req.phone
    )
    db.add(new_user)

    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        restaurant_id=current_user.restaurant_id,
        user_id=current_user.id,
        action="STAFF_CREATED",
        entity="user",
        entity_id=new_user.id,
        details=f"Created {req.role.value} account for {req.full_name} ({req.email})"
    )
    db.add(audit)

    db.commit()
    db.refresh(new_user)
    return new_user

@router.patch("/{user_id}/status", response_model=StaffResponse)
def update_staff_status(
    user_id: str,
    req: StaffStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("staff:write"))
):
    target_user = db.query(User).filter(
        User.id == user_id,
        User.restaurant_id == current_user.restaurant_id
    ).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    target_user.is_active = req.is_active

    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        restaurant_id=current_user.restaurant_id,
        user_id=current_user.id,
        action="STAFF_STATUS_UPDATED",
        entity="user",
        entity_id=target_user.id,
        details=f"Set is_active={req.is_active} for {target_user.full_name}"
    )
    db.add(audit)

    db.commit()
    db.refresh(target_user)
    return target_user

@router.get("/audit-logs")
def get_staff_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("audit:read"))
):
    logs = db.query(AuditLog).filter(
        AuditLog.restaurant_id == current_user.restaurant_id
    ).order_by(AuditLog.created_at.desc()).limit(100).all()
    return logs
