import { apiFetch } from "./client";
import { Table, TableStatus } from "@/types/restaurant";

export interface BackendTable {
  id: string;
  restaurant_id: string;
  label?: string;
  table_number?: string;
  capacity: number;
  status: TableStatus;
  current_bill: number | string;
  current_order_id?: string;
  active_order_id?: string;
  captain_name?: string;
  opened_at?: string;
  qr_token?: string;
}

export function mapBackendTable(t: BackendTable): Table {
  const rawLabel = t.label || t.table_number || t.id;
  // Map section based on table ID
  let section = "Main AC Hall";
  if (t.id === "T-05" || t.id === "T-06") section = "Garden Terrace";
  if (t.id === "T-07" || t.id === "T-08") section = "VIP Lounge";

  return {
    id: t.id,
    label: rawLabel.startsWith("T-") ? `Table ${rawLabel.replace("T-", "")}` : rawLabel,
    capacity: t.capacity,
    status: t.status,
    currentBill: Number(t.current_bill || 0),
    captainName: t.captain_name || (t.status === "occupied" ? "Captain Ramesh" : undefined),
    openedAt: t.opened_at,
    qrToken: t.qr_token,
    currentOrderId: t.current_order_id || t.active_order_id,
    section,
  };
}

export async function fetchTables(): Promise<Table[]> {
  const data = await apiFetch<BackendTable[]>("/tables");
  return data.map(mapBackendTable);
}

export async function updateTableStatus(tableId: string, status: TableStatus): Promise<Table> {
  const data = await apiFetch<BackendTable>(`/tables/${tableId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return mapBackendTable(data);
}

export async function transferTable(fromTableId: string, targetTableId: string): Promise<Table> {
  const data = await apiFetch<BackendTable>(`/tables/${fromTableId}/transfer`, {
    method: "POST",
    body: JSON.stringify({ target_table_id: targetTableId }),
  });
  return mapBackendTable(data);
}

export async function assignTableWaiter(tableId: string, waiterId: string | null): Promise<Table> {
  const data = await apiFetch<BackendTable>(`/tables/${tableId}/waiter`, {
    method: "POST",
    body: JSON.stringify({ waiter_id: waiterId }),
  });
  return mapBackendTable(data);
}

export async function regenerateTableQR(tableId: string): Promise<Table> {
  const data = await apiFetch<BackendTable>(`/tables/${tableId}/regenerate-qr`, {
    method: "POST",
  });
  return mapBackendTable(data);
}

