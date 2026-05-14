import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { menu } from "./menu";
import type { CartAction, CartItem } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-2.5-flash";

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "add_to_cart",
    description:
      "Add one or more units of a menu item to the cart. " +
      "Call this multiple times in the same turn to add several different items at once.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: {
          type: Type.STRING,
          description: "Must exactly match an id from the menu provided in the system instruction.",
        },
        quantity: { type: Type.INTEGER, minimum: 1 },
        modifiers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Optional modifier names from the item's modifiers array (e.g. 'large', 'extra spicy').",
        },
      },
      required: ["itemId", "quantity"],
    },
  },
  {
    name: "remove_from_cart",
    description: "Remove some quantity of an item from the cart. Omit quantity to remove the item entirely.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: { type: Type.STRING },
        quantity: { type: Type.INTEGER, minimum: 1 },
      },
      required: ["itemId"],
    },
  },
  {
    name: "update_quantity",
    description: "Set an item to an exact quantity. Quantity 0 removes it entirely.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: { type: Type.STRING },
        quantity: { type: Type.INTEGER, minimum: 0 },
      },
      required: ["itemId", "quantity"],
    },
  },
  {
    name: "clear_cart",
    description: "Empty the entire cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

function buildSystemInstruction(cart: CartItem[]): string {
  return `You are a friendly, concise ordering assistant for a small bistro.

THE MENU (the only items that exist — never invent others):
${JSON.stringify(menu, null, 2)}

THE USER'S CURRENT CART:
${JSON.stringify(cart, null, 2)}

HOW TO RESPOND:
- When the user wants to modify their order, call the appropriate function(s).
- You may emit MULTIPLE function calls in one turn (e.g. add two different items in one user request).
- Match user phrasing to menu items by name and description. Prefer the closest match.
- If a requested item does not exist on the menu, do NOT call a function for it. Politely suggest the closest available option in your text reply instead.
- If the user references "that" or "it" without context (e.g. "make that three"), use the most recently added or modified item from the cart as the referent.
- After the function calls, give a short, warm one-sentence confirmation. Do not list everything in the cart back to them.
- Keep replies under two sentences. Be conversational, not robotic.`;
}

export async function handleChat(
  userMessage: string,
  currentCart: CartItem[]
): Promise<{ reply: string; actions: CartAction[] }> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userMessage,
    config: {
      systemInstruction: buildSystemInstruction(currentCart),
      tools: [{ functionDeclarations }],
    },
  });

  const actions: CartAction[] = [];
  let reply = "";

  // Gemini returns function calls and text on the response.
  const functionCalls = response.functionCalls ?? [];
  for (const call of functionCalls) {
    const args = (call.args ?? {}) as Record<string, unknown>;
    switch (call.name) {
      case "add_to_cart":
        actions.push({
          type: "ADD",
          itemId: args.itemId as string,
          quantity: args.quantity as number,
          modifiers: args.modifiers as string[] | undefined,
        });
        break;
      case "remove_from_cart":
        actions.push({
          type: "REMOVE",
          itemId: args.itemId as string,
          quantity: args.quantity as number | undefined,
        });
        break;
      case "update_quantity":
        actions.push({
          type: "UPDATE_QUANTITY",
          itemId: args.itemId as string,
          quantity: args.quantity as number,
        });
        break;
      case "clear_cart":
        actions.push({ type: "CLEAR" });
        break;
    }
  }

  // Text reply lives on response.text (may be empty when only function calls are emitted).
  // Text reply lives on response.text (may be empty when only function calls are emitted).
  reply = (response.text ?? "").trim();

  // Gemini tends to skip text when emitting function calls, returning "" or terse replies.
  // Synthesize a warm confirmation from the actions so the user gets meaningful feedback.
  if (!reply || reply.toLowerCase() === "done!" || reply.toLowerCase() === "done") {
    reply = synthesizeReply(actions);
  }

  return { reply, actions };
}

function synthesizeReply(actions: CartAction[]): string {
  if (actions.length === 0) return "Let me know what you'd like.";

  const parts: string[] = [];

  for (const action of actions) {
    switch (action.type) {
      case "ADD": {
        const item = menu.find((m) => m.id === action.itemId);
        const name = item?.name ?? action.itemId;
        const mods =
          action.modifiers && action.modifiers.length > 0
            ? ` (${action.modifiers.join(", ")})`
            : "";
        parts.push(
          action.quantity === 1
            ? `${name}${mods}`
            : `${action.quantity} × ${name}${mods}`
        );
        break;
      }
      case "REMOVE": {
        const item = menu.find((m) => m.id === action.itemId);
        const name = item?.name ?? action.itemId;
        parts.push(
          action.quantity
            ? `removed ${action.quantity} × ${name}`
            : `removed ${name}`
        );
        break;
      }
      case "UPDATE_QUANTITY": {
        const item = menu.find((m) => m.id === action.itemId);
        const name = item?.name ?? action.itemId;
        parts.push(`updated ${name} to ${action.quantity}`);
        break;
      }
      case "CLEAR":
        return "Cart cleared.";
    }
  }

  // Combine into a natural sentence. All-add cases get "Added X, Y, and Z."
  const allAdds = actions.every((a) => a.type === "ADD");
  if (allAdds) {
    return `Added ${joinList(parts)}.`;
  }
  // Mixed actions: just join with semicolons
  return parts.join("; ").replace(/^(.)/, (c) => c.toUpperCase()) + ".";
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}