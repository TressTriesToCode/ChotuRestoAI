import re
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.customer import Customer, LoyaltyTransaction, CustomerFeedback, LoyaltyTxType
from app.models.order import Order

def normalize_phone_number(raw_phone: str) -> str:
    """
    Normalizes phone numbers to standard E.164 format.
    E.g. "98200 12345" -> "+919820012345"
         "09820012345" -> "+919820012345"
         "+91 9820012345" -> "+919820012345"
    """
    digits = re.sub(r"\D", "", raw_phone)
    if digits.startswith("91") and len(digits) == 12:
        return f"+{digits}"
    elif len(digits) == 10:
        return f"+91{digits}"
    elif digits.startswith("0") and len(digits) == 11:
        return f"+91{digits[1:]}"
    elif digits:
        return f"+{digits}"
    return raw_phone.strip()

class CRMService:
    @staticmethod
    def get_or_create_customer(
        db: Session,
        restaurant_id: str,
        name: str,
        phone: str,
        email: Optional[str] = None
    ) -> Customer:
        normalized_phone = normalize_phone_number(phone)
        customer = db.query(Customer).filter(
            Customer.restaurant_id == restaurant_id,
            Customer.phone == normalized_phone
        ).first()

        if not customer:
            customer = Customer(
                id=f"cust-{uuid.uuid4().hex[:10]}",
                restaurant_id=restaurant_id,
                name=name,
                phone=normalized_phone,
                email=email,
                total_orders=0,
                total_spend=Decimal("0.00"),
                loyalty_points_balance=0,
                marketing_consent=True
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)
        return customer

    @staticmethod
    def award_points_for_order(
        db: Session,
        order: Order
    ) -> Optional[LoyaltyTransaction]:
        if not order.customer_phone:
            return None

        normalized_phone = normalize_phone_number(order.customer_phone)
        # Row-lock customer to serialize balance updates
        customer = db.query(Customer).filter(
            Customer.restaurant_id == order.restaurant_id,
            Customer.phone == normalized_phone
        ).with_for_update().first()

        if not customer:
            customer = Customer(
                id=f"cust-{uuid.uuid4().hex[:10]}",
                restaurant_id=order.restaurant_id,
                name=order.customer_name or "Guest",
                phone=normalized_phone,
                total_orders=0,
                total_spend=Decimal("0.00"),
                loyalty_points_balance=0,
                marketing_consent=True
            )
            db.add(customer)
            db.flush()

        idempotency_key = f"earn_{order.id}"
        existing_tx = db.query(LoyaltyTransaction).filter(
            LoyaltyTransaction.idempotency_key == idempotency_key
        ).first()
        if existing_tx:
            return existing_tx

        # 5 points per ₹100 of subtotal
        points_to_award = int(order.subtotal // 100) * 5
        if points_to_award <= 0:
            points_to_award = 5  # minimum 5 points for visiting

        new_balance = customer.loyalty_points_balance + points_to_award
        customer.loyalty_points_balance = new_balance
        customer.total_orders += 1
        customer.total_spend += order.total_amount

        # Link order to customer
        order.customer_id = customer.id

        tx = LoyaltyTransaction(
            id=f"ltx-{uuid.uuid4().hex[:10]}",
            restaurant_id=order.restaurant_id,
            customer_id=customer.id,
            transaction_type=LoyaltyTxType.EARN,
            points=points_to_award,
            balance_after=new_balance,
            reference_order_id=order.id,
            idempotency_key=idempotency_key,
            notes=f"Earned from Order #{order.order_number}"
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def adjust_points(
        db: Session,
        customer_id: str,
        restaurant_id: str,
        tx_type: LoyaltyTxType,
        points: int,
        notes: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> LoyaltyTransaction:
        if not idempotency_key:
            idempotency_key = f"adj_{uuid.uuid4().hex[:12]}"

        # Check idempotency
        existing_tx = db.query(LoyaltyTransaction).filter(
            LoyaltyTransaction.idempotency_key == idempotency_key
        ).first()
        if existing_tx:
            return existing_tx

        customer = db.query(Customer).filter(
            Customer.id == customer_id,
            Customer.restaurant_id == restaurant_id
        ).with_for_update().first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        if tx_type in (LoyaltyTxType.REDEEM, LoyaltyTxType.EXPIRE):
            points_delta = -abs(points)
            if customer.loyalty_points_balance < abs(points):
                raise HTTPException(status_code=400, detail="Insufficient loyalty points balance")
        else:
            points_delta = abs(points)

        new_balance = customer.loyalty_points_balance + points_delta
        customer.loyalty_points_balance = new_balance

        tx = LoyaltyTransaction(
            id=f"ltx-{uuid.uuid4().hex[:10]}",
            restaurant_id=restaurant_id,
            customer_id=customer.id,
            transaction_type=tx_type,
            points=points_delta,
            balance_after=new_balance,
            idempotency_key=idempotency_key,
            notes=notes
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx
