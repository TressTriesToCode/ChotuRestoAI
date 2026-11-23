from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.kot import KOTResponse, KOTItemResponse
from app.services.kitchen_service import KitchenService
from app.api.deps import get_current_user
from app.models.user import User
from app.websocket.manager import ws_manager
from app.websocket.events import WSEventType, create_ws_message

router = APIRouter()

@router.get("/tickets", response_model=List[KOTResponse])
def get_kitchen_tickets(
    status: str = "active",  # active or completed
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return KitchenService.get_kots(db, current_user.restaurant_id, status)

@router.patch("/items/{item_id}/toggle-prepared", response_model=KOTItemResponse)
async def toggle_kot_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        item = KitchenService.toggle_kot_item_prepared(db, item_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return item

@router.post("/tickets/{kot_id}/bump", response_model=KOTResponse)
async def bump_kitchen_ticket(
    kot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        kot = KitchenService.bump_kot(db, kot_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await ws_manager.broadcast_to_restaurant(
        current_user.restaurant_id,
        create_ws_message(WSEventType.KOT_UPDATED, {"kot_id": kot.id, "status": "bumped"})
    )
    return kot

@router.post("/tickets/{kot_id}/recall", response_model=KOTResponse)
async def recall_kitchen_ticket(
    kot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        kot = KitchenService.recall_kot(db, kot_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await ws_manager.broadcast_to_restaurant(
        current_user.restaurant_id,
        create_ws_message(WSEventType.KOT_UPDATED, {"kot_id": kot.id, "status": "recalled"})
    )
    return kot
