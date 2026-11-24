from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.settings import RestaurantSettingsResponse, RestaurantSettingsUpdate
from app.api.deps import get_current_user, check_permission
from app.models.audit_log import AuditLog
import uuid

router = APIRouter()

@router.get("", response_model=RestaurantSettingsResponse)
def get_restaurant_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("settings:read"))
):
    rest = db.query(Restaurant).filter(Restaurant.id == current_user.restaurant_id).first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant settings not found")
    return rest

@router.patch("", response_model=RestaurantSettingsResponse)
def update_restaurant_settings(
    req: RestaurantSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("settings:update"))
):
    rest = db.query(Restaurant).filter(Restaurant.id == current_user.restaurant_id).first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant settings not found")

    update_data = req.model_dump(exclude_unset=True)
    
    # If tax rates changed, update tax_effective_from
    tax_keys = {"cgst_percent", "sgst_percent", "service_charge_percent"}
    if any(k in update_data for k in tax_keys):
        rest.tax_effective_from = datetime.now(timezone.utc)

    for key, value in update_data.items():
        setattr(rest, key, value)

    # Audit log
    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        restaurant_id=current_user.restaurant_id,
        user_id=current_user.id,
        action="SETTINGS_UPDATED",
        entity="restaurant",
        entity_id=rest.id,
        details=f"Updated keys: {list(update_data.keys())}"
    )
    db.add(audit)

    db.commit()
    db.refresh(rest)
    return rest
