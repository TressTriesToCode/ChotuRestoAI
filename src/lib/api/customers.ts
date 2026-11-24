import { apiFetch } from "./client";

export interface CustomerData {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  email?: string | null;
  loyalty_points: number;
  total_spend: number;
  visit_count: number;
  dietary_preference?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CustomerCreateData {
  name: string;
  phone: string;
  email?: string;
  dietary_preference?: string;
  notes?: string;
}

export interface LoyaltyAdjustmentData {
  points: number;
  reason: string;
  idempotency_key?: string;
}

export interface CustomerFeedbackData {
  rating: number;
  order_id?: string;
  comments?: string;
  tags?: string[];
}

export async function fetchCustomers(query = ""): Promise<CustomerData[]> {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  return apiFetch<CustomerData[]>(`/customers${params}`);
}

export async function fetchCustomerById(customerId: string): Promise<CustomerData> {
  return apiFetch<CustomerData>(`/customers/${customerId}`);
}

export async function createCustomer(data: CustomerCreateData): Promise<CustomerData> {
  return apiFetch<CustomerData>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchCustomerOrders(customerId: string): Promise<any[]> {
  return apiFetch<any[]>(`/customers/${customerId}/orders`);
}

export async function adjustCustomerLoyalty(
  customerId: string,
  data: LoyaltyAdjustmentData
): Promise<CustomerData> {
  return apiFetch<CustomerData>(`/customers/${customerId}/loyalty`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function submitCustomerFeedback(
  customerId: string,
  data: CustomerFeedbackData
): Promise<any> {
  return apiFetch<any>(`/customers/${customerId}/feedback`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
