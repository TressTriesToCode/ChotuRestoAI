from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.menu import MenuItem, MenuCategory
from app.schemas.menu import MenuItemResponse, MenuCategoryResponse, StockStatusUpdate, MenuItemUpdate
from app.api.deps import get_current_user
from app.models.user import User
from app.websocket.manager import ws_manager
from app.websocket.events import WSEventType, create_ws_message

router = APIRouter()

@router.get("/items", response_model=List[MenuItemResponse])
def get_menu_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(MenuItem).filter(MenuItem.restaurant_id == current_user.restaurant_id, MenuItem.is_active == True).all()

@router.get("/categories", response_model=List[MenuCategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    categories = db.query(MenuCategory).filter(MenuCategory.restaurant_id == current_user.restaurant_id, MenuCategory.is_active == True).order_by(MenuCategory.display_order).all()
    return categories

@router.patch("/items/{dish_id}/stock", response_model=MenuItemResponse)
async def toggle_dish_stock(
    dish_id: str,
    stock_data: StockStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dish = db.query(MenuItem).filter(MenuItem.id == dish_id, MenuItem.restaurant_id == current_user.restaurant_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
        
    dish.is_in_stock = stock_data.is_in_stock
    db.commit()
    db.refresh(dish)

    # Broadcast stock change
    await ws_manager.broadcast_to_restaurant(
        current_user.restaurant_id,
        create_ws_message(WSEventType.DISH_STOCK_TOGGLED, {"dish_id": dish.id, "is_in_stock": dish.is_in_stock})
    )
    return dish

@router.patch("/items/{dish_id}", response_model=MenuItemResponse)
async def update_menu_item(
    dish_id: str,
    update_data: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dish = db.query(MenuItem).filter(MenuItem.id == dish_id, MenuItem.restaurant_id == current_user.restaurant_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
        
    if update_data.is_in_stock is not None:
        dish.is_in_stock = update_data.is_in_stock
    if update_data.price is not None:
        dish.price = update_data.price
        
    db.commit()
    db.refresh(dish)

    await ws_manager.broadcast_to_restaurant(
        current_user.restaurant_id,
        create_ws_message(WSEventType.DISH_STOCK_TOGGLED, {"dish_id": dish.id, "is_in_stock": dish.is_in_stock, "price": float(dish.price)})
    )
    return dish
