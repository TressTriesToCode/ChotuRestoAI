import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.inventory import Ingredient, StockTransaction, TransactionType

class SupplierService:
    @staticmethod
    def create_purchase_order(
        db: Session,
        restaurant_id: str,
        supplier_id: str,
        items_data: List[Dict[str, Any]],
        notes: str = ""
    ) -> PurchaseOrder:
        supplier = db.query(Supplier).filter(
            Supplier.id == supplier_id,
            Supplier.restaurant_id == restaurant_id
        ).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")

        po_seq = db.query(PurchaseOrder).filter(PurchaseOrder.restaurant_id == restaurant_id).count() + 1
        now = datetime.now(timezone.utc)
        po_number = f"PO-{now.strftime('%Y%m')}-{po_seq:04d}"

        total_amount = Decimal("0.00")
        po = PurchaseOrder(
            id=f"po-{uuid.uuid4().hex[:10]}",
            restaurant_id=restaurant_id,
            supplier_id=supplier_id,
            po_number=po_number,
            status=PurchaseOrderStatus.ISSUED,
            total_amount=Decimal("0.00"),
            notes=notes,
            issued_at=now
        )
        db.add(po)
        db.flush()

        for it in items_data:
            ing = db.query(Ingredient).filter(
                Ingredient.id == it["ingredient_id"],
                Ingredient.restaurant_id == restaurant_id
            ).first()
            if not ing:
                raise HTTPException(status_code=400, detail=f"Ingredient {it['ingredient_id']} not found or does not belong to this restaurant")

            qty = Decimal(str(it["quantity"]))
            unit_cost = Decimal(str(it["unit_cost"]))
            if qty <= 0 or unit_cost < 0:
                raise HTTPException(status_code=400, detail="Quantity must be > 0 and unit cost >= 0")

            line_total = qty * unit_cost
            total_amount += line_total

            poi = PurchaseOrderItem(
                id=f"poi-{uuid.uuid4().hex[:10]}",
                purchase_order_id=po.id,
                ingredient_id=ing.id,
                quantity=qty,
                unit_cost=unit_cost,
                total_cost=line_total
            )
            db.add(poi)

        po.total_amount = total_amount
        db.commit()
        db.refresh(po)
        return po

    @staticmethod
    def receive_purchase_order(
        db: Session,
        po_id: str,
        restaurant_id: str,
        invoice_ref: str,
        notes: str = ""
    ) -> PurchaseOrder:
        """
        Transactional Stock Receipt:
        - Row locks the PO (SELECT FOR UPDATE)
        - Prevents duplicate receipt (checks status == ISSUED)
        - Row locks ingredients in ascending ID order (deadlock prevention)
        - Increments stock & updates Weighted Average Cost (WAC)
        - Creates immutable StockTransaction records
        - Marks PO as RECEIVED
        """
        po = db.query(PurchaseOrder).filter(
            PurchaseOrder.id == po_id,
            PurchaseOrder.restaurant_id == restaurant_id
        ).with_for_update().first()
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")

        if po.status != PurchaseOrderStatus.ISSUED:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot receive PO: current status is '{po.status.value}'. Must be 'issued'."
            )

        items = db.query(PurchaseOrderItem).filter(
            PurchaseOrderItem.purchase_order_id == po.id
        ).all()
        if not items:
            raise HTTPException(status_code=400, detail="Cannot receive an empty purchase order")

        # Row-lock all ingredients in ascending order
        ingredient_ids = sorted([it.ingredient_id for it in items])
        locked_ingredients = {
            ing.id: ing for ing in db.query(Ingredient).filter(
                Ingredient.id.in_(ingredient_ids),
                Ingredient.restaurant_id == restaurant_id
            ).order_by(Ingredient.id.asc()).with_for_update().all()
        }

        now = datetime.now(timezone.utc)
        for it in items:
            ing = locked_ingredients.get(it.ingredient_id)
            if not ing:
                raise HTTPException(status_code=400, detail=f"Ingredient {it.ingredient_id} not found")

            old_stock = ing.current_stock
            old_cost = ing.cost_per_unit
            received_qty = it.quantity
            po_unit_cost = it.unit_cost

            # Weighted Average Cost (WAC)
            total_qty = old_stock + received_qty
            if total_qty > 0:
                new_wac = ((old_stock * old_cost) + (received_qty * po_unit_cost)) / total_qty
                ing.cost_per_unit = new_wac.quantize(Decimal("0.01"))
            ing.current_stock = total_qty

            # Immutable StockTransaction
            tx = StockTransaction(
                id=f"stx-{uuid.uuid4().hex[:10]}",
                restaurant_id=restaurant_id,
                ingredient_id=ing.id,
                transaction_type=TransactionType.PURCHASE,
                quantity=received_qty,
                reference_id=po.po_number,
                notes=f"PO Receipt Ref: {invoice_ref}"
            )
            db.add(tx)

        po.status = PurchaseOrderStatus.RECEIVED
        po.received_at = now
        po.invoice_ref = invoice_ref
        if notes:
            po.notes = f"{po.notes or ''} | Receipt notes: {notes}".strip()

        db.commit()
        db.refresh(po)
        return po
