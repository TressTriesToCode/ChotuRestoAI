import { apiFetch } from "./client";
import { MenuItem, Dietary } from "@/types/restaurant";

export interface BackendMenuItem {
  id: string;
  name: string;
  description: string;
  price: number | string;
  category: "starters" | "mains" | "breads" | "beverages" | "desserts";
  dietary: Dietary;
  station: "tandoor" | "curry" | "bar" | "pantry";
  is_active: boolean;
  in_stock: boolean;
  spice_level?: 1 | 2 | 3;
  bestseller?: boolean;
}

export function mapBackendMenuItem(item: BackendMenuItem): MenuItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    price: Number(item.price),
    dietary: item.dietary,
    station: item.station,
    inStock: item.in_stock,
    spiceLevel: item.spice_level,
    bestseller: item.bestseller,
  };
}

export async function fetchMenuItems(category?: string): Promise<MenuItem[]> {
  const qs = category && category !== "all" ? `?category=${category}` : "";
  const data = await apiFetch<BackendMenuItem[]>(`/menu/items${qs}`);
  return data.map(mapBackendMenuItem);
}

export async function updateMenuItem(dishId: string, updates: { inStock?: boolean; price?: number }): Promise<MenuItem> {
  const body: any = {};
  if (updates.inStock !== undefined) body.is_in_stock = updates.inStock;
  if (updates.price !== undefined) body.price = updates.price;
  const data = await apiFetch<BackendMenuItem>(`/menu/items/${dishId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapBackendMenuItem(data);
}
