from datetime import datetime, timezone
import httpx
from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.table import DiningTable, TableStatus
from app.models.kot import KOT, KOTStatus
from app.models.menu import MenuItem
from app.models.inventory import Ingredient
from app.models.audit_log import AIConversation
from app.schemas.ai import AIChatResponse

class AIService:
    @staticmethod
    async def chat(db: Session, restaurant_id: str, message: str, user_id: Optional[str] = None) -> AIChatResponse:
        """
        AI conversational assistant grounded in genuine restaurant database records.
        """
        # 1. Fetch factual operational context from Database
        total_tables = db.query(DiningTable).filter(DiningTable.restaurant_id == restaurant_id).count()
        occupied_tables = db.query(DiningTable).filter(DiningTable.restaurant_id == restaurant_id, DiningTable.status == TableStatus.OCCUPIED).count()
        occupied_table_labels = [t.label for t in db.query(DiningTable).filter(DiningTable.restaurant_id == restaurant_id, DiningTable.status == TableStatus.OCCUPIED).all()]
        
        active_kots = db.query(KOT).filter(KOT.restaurant_id == restaurant_id, KOT.status != KOTStatus.BUMPED).count()
        
        today_paid_orders = db.query(Order).filter(
            Order.restaurant_id == restaurant_id,
            Order.payment_status == PaymentStatus.PAID
        ).all()
        today_sales = sum((o.total_amount for o in today_paid_orders), Decimal("0.00"))
        
        low_stock_ingredients = db.query(Ingredient).filter(
            Ingredient.restaurant_id == restaurant_id,
            Ingredient.current_stock <= Ingredient.reorder_threshold
        ).all()
        low_stock_names = [f"{ing.name} ({float(ing.current_stock)} {ing.unit})" for ing in low_stock_ingredients]

        msg_lower = message.lower()
        intent = "general_query"
        suggested_action = None
        action_data = None
        reply = ""

        # Check if Google Gemini API key is configured
        if settings.GEMINI_API_KEY:
            try:
                system_prompt = f"""You are Chotu, an intelligent, respectful Indian restaurant operating assistant for 'The Spice Junction'.
Current Live Real-Time Database State:
- Today's Total Sales: ₹ {today_sales:.2f}
- Occupied Tables: {occupied_tables}/{total_tables} ({', '.join(occupied_table_labels) if occupied_table_labels else 'None'})
- Active Kitchen Tickets: {active_kots}
- Low Stock Items: {', '.join(low_stock_names) if low_stock_names else 'All raw stock sufficient'}

Answer the staff question concisely, professionally, in a helpful hospitality tone (natural English or Hinglish).
Never invent financial or inventory metrics not in this context.
"""
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                        json={
                            "contents": [{"parts": [{"text": f"{system_prompt}\nUser Question: {message}"}]}]
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        reply = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception:
                reply = ""  # fallback to deterministic handler

        # Deterministic Grounded Handler (always executes if no Gemini key or on network failure)
        if not reply:
            if "sale" in msg_lower or "revenue" in msg_lower or "kamaai" in msg_lower or "earning" in msg_lower:
                intent = "QUERY_SALES"
                reply = f"Today's total settled sales are ₹ {today_sales:,.2f} across {len(today_paid_orders)} settled bills."
            elif "table" in msg_lower or "occupan" in msg_lower or "seated" in msg_lower:
                intent = "QUERY_TABLES"
                if occupied_tables > 0:
                    reply = f"{occupied_tables} out of {total_tables} tables are currently occupied: {', '.join(occupied_table_labels)}."
                else:
                    reply = f"All {total_tables} dining tables are currently vacant and ready for seating."
            elif "stock" in msg_lower or "inventory" in msg_lower or "ingredient" in msg_lower or "khatam" in msg_lower:
                intent = "QUERY_INVENTORY"
                if low_stock_names:
                    reply = f"⚠️ Low stock alert for {len(low_stock_names)} item(s): {', '.join(low_stock_names)}. Reorder is recommended."
                    suggested_action = "DISPATCH_PURCHASE_ORDER"
                    action_data = {"ingredients": [ing.name for ing in low_stock_ingredients]}
                else:
                    reply = "All raw ingredients and kitchen stocks are currently above safety thresholds."
            elif "kitchen" in msg_lower or "kot" in msg_lower or "prep" in msg_lower:
                intent = "QUERY_KITCHEN"
                reply = f"There are currently {active_kots} active KOT tickets cooking across the kitchen stations."
            elif "garlic naan" in msg_lower or "add" in msg_lower:
                intent = "ADD_ITEMS"
                reply = "Noted! To add items to a table, use the POS terminal or specify the exact table and items."
            else:
                reply = f"Chotu is active! Current floor: {occupied_tables}/{total_tables} tables occupied, {active_kots} KOTs in kitchen, and ₹ {today_sales:,.2f} today's sales."

        # Record conversation in Audit Log
        conv_log = AIConversation(
            id=f"aiconv-{int(datetime.now().timestamp())}",
            restaurant_id=restaurant_id,
            user_id=user_id,
            role="user",
            content=message,
            intent=intent
        )
        db.add(conv_log)
        db.commit()

        return AIChatResponse(
            reply=reply,
            intent=intent,
            suggested_action=suggested_action,
            action_data=action_data
        )
