from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Tuple
from app.models.restaurant import Restaurant

def round_money(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

class BillingService:
    @staticmethod
    def calculate_totals(
        items: List[Dict[str, Any]],
        restaurant: Restaurant,
        discount_amount: Decimal = Decimal("0.00")
    ) -> Tuple[Decimal, Decimal, Decimal, Decimal, Decimal, Decimal]:
        """
        Returns:
        (subtotal, cgst, sgst, service_charge, discount, grand_total)
        """
        subtotal = Decimal("0.00")
        for it in items:
            price = Decimal(str(it["price"]))
            qty = Decimal(str(it["quantity"]))
            subtotal += price * qty
        
        subtotal = round_money(subtotal)
        discount = round_money(discount_amount)
        discounted_subtotal = max(Decimal("0.00"), subtotal - discount)
        
        cgst_rate = Decimal(str(restaurant.cgst_percent)) / Decimal("100.0")
        sgst_rate = Decimal(str(restaurant.sgst_percent)) / Decimal("100.0")
        sc_rate = Decimal(str(restaurant.service_charge_percent)) / Decimal("100.0")
        
        cgst = round_money(discounted_subtotal * cgst_rate)
        sgst = round_money(discounted_subtotal * sgst_rate)
        service_charge = round_money(discounted_subtotal * sc_rate)
        
        grand_total = round_money(discounted_subtotal + cgst + sgst + service_charge)
        return subtotal, cgst, sgst, service_charge, discount, grand_total
