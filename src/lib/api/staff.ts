import { apiFetch } from "./client";

export interface StaffMemberData {
  id: string;
  email: string;
  full_name: string;
  role: "owner" | "manager" | "cashier" | "waiter" | "kitchen_staff" | "chef" | "admin";
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface StaffCreateData {
  email: string;
  full_name: string;
  role: string;
  password: string;
  phone?: string;
}

export interface AuditLogData {
  id: string;
  action: string;
  actor: string;
  entity: string;
  details: string;
  created_at: string;
}

export async function fetchStaff(): Promise<StaffMemberData[]> {
  return apiFetch<StaffMemberData[]>("/staff");
}

export async function createStaff(data: StaffCreateData): Promise<StaffMemberData> {
  return apiFetch<StaffMemberData>("/staff", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateStaffStatus(
  staffId: string,
  isActive: boolean
): Promise<StaffMemberData> {
  return apiFetch<StaffMemberData>(`/staff/${staffId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function fetchAuditLogs(): Promise<AuditLogData[]> {
  return apiFetch<AuditLogData[]>("/staff/audit-logs");
}
