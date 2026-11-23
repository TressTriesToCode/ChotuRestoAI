import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.inventory import Ingredient, RecipeItem, StockTransaction, TransactionType
from app.models.menu import MenuItem

class InventoryService:
    @staticmethod
    def deduct_stock_for_order(db: Session, restaurant_id: str, order_items: List[Any], order_id: str):
        """
        Deducts raw ingredient stock based on recipe items configured for each menu item.
        """
        for item in order_items:
            recipe_items = db.query(RecipeItem).filter(RecipeItem.menu_item_id == item.menu_item_id).all()
            for r_item in recipe_items:
                ingredient = db.query(Ingredient).filter(Ingredient.id == r_item.ingredient_id).first()
                if ingredient:
                    total_needed = Decimal(str(r_item.quantity_required)) * Decimal(str(item.quantity))
                    ingredient.current_stock = Decimal(str(ingredient.current_stock)) - total_needed
                    
                    # Record transaction with unique primary key
                    txn = StockTransaction(
                        id=f"stxn-{uuid.uuid4().hex[:10]}",
                        restaurant_id=restaurant_id,
                        ingredient_id=ingredient.id,
                        transaction_type=TransactionType.CONSUMPTION,
                        quantity=-total_needed,
                        reference_id=order_id,
                        notes=f"Consumed by order {order_id} ({item.name} x{item.quantity})"
                    )
                    db.add(txn)
                    
                    # If ingredient reaches 0 or below, automatically toggle dish out-of-stock
                    if ingredient.current_stock <= 0:
                        dish = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
                        if dish:
                            dish.is_in_stock = False

        db.commit()

    @staticmethod
    def adjust_stock(db: Session, restaurant_id: str, ingredient_id: str, delta: Decimal, txn_type: TransactionType, notes: str = ""):
        ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id, Ingredient.restaurant_id == restaurant_id).first()
        if not ingredient:
            raise ValueError("Ingredient not found")
            
        ingredient.current_stock = Decimal(str(ingredient.current_stock)) + delta
        txn = StockTransaction(
            id=f"stxn-adj-{int(datetime.now().timestamp())}-{ingredient.id[-4:]}",
            restaurant_id=restaurant_id,
            ingredient_id=ingredient.id,
            transaction_type=txn_type,
            quantity=delta,
            reference_id=None,
            notes=notes
        )
        db.add(txn)
        db.commit()
        db.refresh(ingredient)
        return ingredient

    @staticmethod
    def get_low_stock_alerts(db: Session, restaurant_id: str) -> List[Dict[str, Any]]:
        ingredients = db.query(Ingredient).filter(Ingredient.restaurant_id == restaurant_id).all()
        alerts = []
        for ing in ingredients:
            if Decimal(str(ing.current_stock)) <= Decimal(str(ing.reorder_threshold)):
                alerts.append({
                    "ingredient_id": ing.id,
                    "name": ing.name,
                    "current_stock": float(ing.current_stock),
                    "reorder_threshold": float(ing.reorder_threshold),
                    "unit": ing.unit,
                    "supplier": ing.supplier_name or "Local Supplier"
                })
        return alerts
