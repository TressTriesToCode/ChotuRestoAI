import { apiFetch } from "./client";

export interface AIChatResponse {
  reply: string;
  action_taken?: {
    action: string;
    table_id?: string;
    items?: Array<{ name: string; quantity: number }>;
    status?: string;
  };
  data_context?: Record<string, any>;
}

export async function askChotu(message: string, restaurantId: string = "rest-spice-jct"): Promise<AIChatResponse> {
  return await apiFetch<AIChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      restaurant_id: restaurantId,
    }),
  });
}
