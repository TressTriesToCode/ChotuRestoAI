import { apiFetch } from "./client";
import { Table, TableStatus } from "@/types/restaurant";

export interface BackendTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  current_bill: number | string;
  active_order_id?: string;
  captain_name?: string;
  opened_at?: string;
}

export function mapBackendTable(t: BackendTable): Table {
  return {
    id: t.id,
    label: t.table_number.startsWith("T-") ? `Table ${t.table_number.replace("T-", "")}` : t.table_number,
    capacity: t.capacity,
    status: t.status,
    currentBill: Number(t.current_bill || 0),
    captainName: t.captain_name,
    openedAt: t.opened_at,
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
