from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.table import DiningTable, TableStatus
from app.models.restaurant import Restaurant
from app.models.menu import MenuItem
from app.models.order import PlacedBy
from app.schemas.menu import MenuItemResponse
from app.schemas.order import OrderItemCreate, OrderResponse
from app.services.order_service import OrderService
from app.websocket.manager import ws_manager
from app.websocket.events import WSEventType, create_ws_message

router = APIRouter()

class QROrderSubmission(BaseModel):
    customer_name: str = "Guest (QR)"
    items: List[OrderItemCreate]
    captain_notes: str = "Self-order via Table QR"

class QRMenuResponse(BaseModel):
    restaurant_name: str
    table_id: str
    table_label: str
    items: List[MenuItemResponse]

@router.get("/{token}/menu", response_model=QRMenuResponse)
def get_qr_menu(token: str, db: Session = Depends(get_db)):
    table = db.query(DiningTable).filter(DiningTable.qr_token == token).first()
    if not table:
        raise HTTPException(status_code=404, detail="Invalid or expired QR token")
        
    restaurant = db.query(Restaurant).filter(Restaurant.id == table.restaurant_id).first()
    items = db.query(MenuItem).filter(MenuItem.restaurant_id == table.restaurant_id, MenuItem.is_active == True).all()
    
    return QRMenuResponse(
        restaurant_name=restaurant.name,
        table_id=table.id,
        table_label=table.label,
        items=items
    )

@router.post("/{token}/orders", response_model=OrderResponse)
async def submit_qr_order(
    token: str,
    submission: QROrderSubmission,
    db: Session = Depends(get_db)
):
    """
    CRITICAL WORKFLOW: Customers scanning table QR code place a real order that:
    1. Attaches to this specific table.
    2. Enters central database.
    3. Fires KOT directly to Kitchen Display System (KDS).
    4. Broadcasts to POS and KDS via WebSockets.
    """
    table = db.query(DiningTable).filter(DiningTable.qr_token == token).first()
    if not table:
        raise HTTPException(status_code=404, detail="Invalid or expired QR token")
    if not submission.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order = OrderService.get_or_create_table_order(
        db, table.restaurant_id, table.id, customer_name=submission.customer_name, placed_by=PlacedBy.QR
    )
    order.placed_by = PlacedBy.QR

    for it in submission.items:
        OrderService.add_or_update_order_item(db, order.id, it.dish_id, it.quantity, it.notes)

    # Automatically fire KOT to Kitchen KDS!
    kot = OrderService.fire_kot(db, order.id, submission.captain_notes)

    # Broadcast real-time events to all connected staff (POS & Kitchen)
    await ws_manager.broadcast_to_restaurant(
        table.restaurant_id,
        create_ws_message(WSEventType.ORDER_CREATED, {"order_id": order.id, "table_id": table.id, "origin": "QR"})
    )
    await ws_manager.broadcast_to_restaurant(
        table.restaurant_id,
        create_ws_message(WSEventType.KOT_CREATED, {
            "kot_id": kot.id,
            "kot_number": kot.kot_number,
            "table_id": kot.table_id,
            "items_count": len(kot.items),
            "origin": "QR"
        })
    )

    db.refresh(order)
    return order
