import { apiFetch } from "./client";
import { OrderItem, Dietary } from "@/types/restaurant";

export interface BackendOrderItem {
  id?: string;
  dish_id: string;
  name: string;
  unit_price: number | string;
  quantity: number;
  dietary: Dietary;
  station: "tandoor" | "curry" | "bar" | "pantry";
  notes?: string;
  status?: "queued" | "cooking" | "ready" | "served";
}

export interface BackendOrder {
  id: string;
  order_number: string;
  table_id?: string;
  customer_name?: string;
  customer_phone?: string;
  mode: string;
  status: string;
  subtotal: number | string;
  cgst: number | string;
  sgst: number | string;
  service_charge: number | string;
  discount_amount: number | string;
  total_amount: number | string;
  placed_by: string;
  items: BackendOrderItem[];
}

export function mapBackendOrderItem(i: BackendOrderItem): OrderItem {
  return {
    dishId: i.dish_id,
    name: i.name,
    price: Number(i.unit_price),
    quantity: i.quantity,
    dietary: i.dietary,
    station: i.station,
    notes: i.notes,
    status: i.status,
  };
}

export async function getTableOrder(tableId: string): Promise<{ order: BackendOrder; items: OrderItem[] }> {
  const order = await apiFetch<BackendOrder>(`/pos/tables/${tableId}/order`);
  const items = (order.items || []).map(mapBackendOrderItem);
  return { order, items };
}

export async function addOrUpdateOrderItem(
  tableId: string,
  dishId: string,
  delta_qty: number = 1,
  notes?: string
): Promise<{ order: BackendOrder; items: OrderItem[] }> {
  const order = await apiFetch<BackendOrder>(`/pos/tables/${tableId}/order/items`, {
    method: "POST",
    body: JSON.stringify({
      dish_id: dishId,
      delta_qty,
      notes,
    }),
  });
  const items = (order.items || []).map(mapBackendOrderItem);
  return { order, items };
}

export async function removeOrderItem(
  tableId: string,
  dishId: string
): Promise<{ order: BackendOrder; items: OrderItem[] }> {
  const order = await apiFetch<BackendOrder>(`/pos/tables/${tableId}/order/items/${dishId}`, {
    method: "DELETE",
  });
  const items = (order.items || []).map(mapBackendOrderItem);
  return { order, items };
}

export async function transmitTableKot(tableId: string, notes?: string): Promise<any> {
  return await apiFetch(`/pos/tables/${tableId}/fire-kot`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function settleTableBill(
  tableId: string,
  paymentMethod: "cash" | "card" | "upi" = "upi",
  discountAmount: number = 0
): Promise<any> {
  return await apiFetch(`/pos/tables/${tableId}/settle`, {
    method: "POST",
    body: JSON.stringify({
      payment_method: paymentMethod,
      discount_amount: discountAmount,
    }),
  });
}
