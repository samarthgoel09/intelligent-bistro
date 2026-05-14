import type { CartItem, ChatResponse, MenuItem } from "../types";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn("EXPO_PUBLIC_API_URL is not set — API calls will fail");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(`Request to ${path} failed (${res.status}): ${detail || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchMenu(): Promise<MenuItem[]> {
  const { items } = await request<{ items: MenuItem[] }>("/menu");
  return items;
}

export async function sendChatMessage(message: string, cart: CartItem[]): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ message, cart }),
  });
}

export async function placeOrder(cart: CartItem[]): Promise<{ orderId: string; total: number }> {
  return request<{ orderId: string; total: number }>("/orders", {
    method: "POST",
    body: JSON.stringify({ cart }),
  });
}
