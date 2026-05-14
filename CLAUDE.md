# Intelligent Bistro

Take-home: React Native (Expo) + Node.js backend where users order food
from a bistro through a conversational AI assistant.

## Architecture

- `backend/` — Express + TypeScript. REST API with three endpoints:
  GET /menu, POST /chat, GET /health. SQLite via better-sqlite3 for
  orders. LLM is Claude via the Anthropic SDK; cart actions are emitted
  via tool-use, not free-text JSON parsing.
- `mobile/` — Expo + TypeScript + NativeWind + Zustand. Three screens:
  Menu, Cart, Chat. Cart state in a Zustand store, mutated by UI taps
  and by actions returned from the backend.

## Key contracts

CartAction (defined in backend/src/types.ts, mirrored in mobile/src/types.ts):

  type CartAction =
    | { type: "ADD"; itemId: string; quantity: number; modifiers?: string[] }
    | { type: "REMOVE"; itemId: string; quantity?: number }
    | { type: "UPDATE_QUANTITY"; itemId: string; quantity: number }
    | { type: "CLEAR" }

ChatResponse: { reply: string; actions: CartAction[] }

MenuItem:
  { id: string; name: string; description: string; price: number;
    category: "main" | "side" | "drink" | "dessert";
    modifiers?: string[] }

CartItem: MenuItem & { quantity: number; modifiers?: string[] }

## Conventions

- TypeScript strict mode both sides.
- Functional components + hooks only.
- Backend: no controller/service layers. Keep it ~5 files total.
- Validate request bodies with zod.
- Error responses: { error: { code: string, message: string } }
- NativeWind for styling. Extract a component once it has >5 classes.
- Never invent menu items — pass the menu into the LLM prompt so it
  only references real items.

## What "done" looks like

- User browses menu, taps to add to cart, sees cart, mock checkout.
- User opens chat, says "add two spicy chicken sandwiches and a large
  water," cart updates with friendly reply.
- User says "actually make that three" or "remove the water" — works.
- Loading, empty, error states everywhere.
- iOS and Android both render correctly.
- At least 2 tests on chat tool-use parsing.