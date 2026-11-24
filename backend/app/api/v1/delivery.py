from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.order import Order, OrderMode
from app.schemas.delivery import (
    DeliveryOrderResponse, DispatchOrderRequest,
    VerifyOTPRequest, VerifyOTPResponse
)
from app.services.delivery_service import DeliveryService
from app.api.deps import check_permission

router = APIRouter()

@router.get("/orders", response_model=List[DeliveryOrderResponse])
def get_delivery_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("delivery:read"))
):
    # Delivery orders in DB
    orders = db.query(Order).filter(
        Order.restaurant_id == current_user.restaurant_id,
        Order.mode.in_([OrderMode.DELIVERY, OrderMode.ZOMATO, OrderMode.SWIGGY, OrderMode.UBEREATS, OrderMode.DOORDASH])
    ).order_by(Order.created_at.desc()).limit(50).all()

    res = []
    for o in orders:
        item = DeliveryOrderResponse(
            id=o.id,
            restaurant_id=o.restaurant_id,
            order_number=o.order_number,
            token_number=o.token_number,
            customer_name=o.customer_name,
            customer_phone=o.customer_phone,
            delivery_address=o.delivery_address,
            mode=o.mode,
            status=o.status,
            total_amount=o.total_amount,
            dispatch_time=o.dispatch_time,
            delivered_time=o.delivered_time,
            aggregator_platform=o.aggregator_platform,
            aggregator_rider_name=o.aggregator_rider_name,
            aggregator_rider_status=o.aggregator_rider_status,
            has_otp=bool(o.delivery_otp_hash),
            otp_verified=bool(o.delivery_otp_verified_at),
            created_at=o.created_at
        )
        res.append(item)
    return res

@router.post("/orders/{order_id}/dispatch")
def dispatch_delivery_order(
    order_id: str,
    req: DispatchOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("delivery:dispatch"))
):
    order, plain_otp = DeliveryService.dispatch_order(
        db, order_id, current_user.restaurant_id, req.rider_name, req.rider_phone
    )
    return {
        "status": "success",
        "message": f"Order #{order.order_number} dispatched to rider {req.rider_name}",
        "order_id": order.id,
        "dispatch_time": order.dispatch_time,
        "delivery_otp": plain_otp,
        "otp_for_customer": plain_otp  # Returned once to dispatcher for SMS/WhatsApp alert
    }

@router.post("/orders/{order_id}/verify-otp", response_model=VerifyOTPResponse)
def verify_delivery_handover_otp(
    order_id: str,
    req: VerifyOTPRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("delivery:dispatch"))
):
    order = DeliveryService.verify_handover_otp(
        db, order_id, current_user.restaurant_id, req.otp
    )
    return VerifyOTPResponse(
        status="verified",
        message=f"Order #{order.order_number} handover verified and marked completed.",
        order_id=order.id,
        delivered_at=order.delivered_time or datetime.now(timezone.utc)
    )
