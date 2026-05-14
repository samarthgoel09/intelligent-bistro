export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "main" | "side" | "drink" | "dessert";
  modifiers?: string[];
};

export type CartItem = MenuItem & {
  quantity: number;
  modifiers?: string[];
};

export type CartAction =
  | { type: "ADD"; itemId: string; quantity: number; modifiers?: string[] }
  | { type: "REMOVE"; itemId: string; quantity?: number }
  | { type: "UPDATE_QUANTITY"; itemId: string; quantity: number }
  | { type: "CLEAR" };

export type ChatRequest = {
  message: string;
  cart: CartItem[];
};

export type ChatResponse = {
  reply: string;
  actions: CartAction[];
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};
