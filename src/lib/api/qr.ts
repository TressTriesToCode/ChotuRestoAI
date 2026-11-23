import { apiFetch } from "./client";
import { MenuItem } from "@/types/restaurant";
import { mapBackendMenuItem, BackendMenuItem } from "./menu";

export interface QRMenuResponse {
  restaurant_name: string;
  table_id: string;
  table_label: string;
  items: BackendMenuItem[];
}

export interface QROrderItemInput {
  dish_id: string;
  name: string;
  price: number;
  quantity: number;
  dietary?: "veg" | "nonveg";
  station?: "tandoor" | "curry" | "bar" | "pantry";
  notes?: string;
}

export interface QROrderSubmission {
  customer_name: string;
  items: QROrderItemInput[];
  captain_notes?: string;
}

export async function fetchQRMenu(token: string): Promise<QRMenuResponse> {
  return await apiFetch<QRMenuResponse>(`/qr/${token}/menu`);
}

export async function submitQROrder(token: string, payload: QROrderSubmission): Promise<any> {
  return await apiFetch(`/qr/${token}/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
