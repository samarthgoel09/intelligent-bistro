# Intelligent Bistro

A React Native + Node.js take-home where users browse a small bistro menu and manage a cart either through standard touch UI or by chatting with an AI assistant in natural language.

The AI flow uses Gemini 2.5 Flash's function-calling to convert messages like *"add two spicy chicken sandwiches and a large water"* into typed cart actions that the mobile app applies to a Zustand store.

## Demo

[YOUR LOOM URL HERE — fill in after recording]

## Stack

**Mobile:** Expo (SDK 54) · TypeScript · NativeWind (Tailwind) · Zustand · React Navigation

**Backend:** Node.js · Express · TypeScript · `@google/genai` · better-sqlite3 · zod · vitest

**LLM:** Gemini 2.5 Flash (`@google/genai`) using native function-calling for structured cart actions.

## Architecture

The system is two parts, communicating over a small REST API:

```
┌─────────────────┐    HTTP    ┌──────────────────────┐
│  Expo mobile    │ ─────────► │  Node backend        │
│                 │            │                      │
│  - Menu screen  │            │  /menu               │
│  - Cart screen  │            │  /chat ──► Gemini    │
│  - Chat screen  │ ◄───────── │  /orders ──► SQLite  │
│  - Zustand cart │   actions  │                      │
└─────────────────┘            └──────────────────────┘
```

The interesting bit is the chat endpoint. Rather than asking the LLM to "return JSON in this shape" and parsing free text — fragile, breaks on extra prose — the backend declares four function tools (`add_to_cart`, `remove_from_cart`, `update_quantity`, `clear_cart`) with strict JSON schemas. The model emits structured `functionCall` blocks, the server collects them into a typed `CartAction[]`, and the mobile app dispatches each action through the Zustand store.

The cart is sent with every chat request, so the model has full context to resolve references like *"make that three"* or *"remove the water."* The backend is stateless — no conversation history — which makes the contract a clean function: `(message, cart) → (reply, actions)`.

A `synthesizeReply` step generates a warm confirmation message from the actions when Gemini returns terse output (which it tends to do when emitting function calls). This avoids brittle multi-call patterns and keeps demo latency at one round-trip.

## Project layout

```
intelligent-bistro/
├── backend/
│   └── src/
│       ├── index.ts       Express server, zod validation, error handler
│       ├── chat.ts        Gemini call + tool declarations + reply synthesizer
│       ├── menu.ts        10 menu items (4 mains, 2 sides, 2 drinks, 2 desserts)
│       ├── db.ts          better-sqlite3 wrapper for orders
│       ├── types.ts       Shared types (MenuItem, CartItem, CartAction)
│       └── chat.test.ts   vitest unit tests for tool-call parsing
└── mobile/
    └── src/
        ├── screens/
        │   ├── MenuScreen.tsx
        │   ├── CartScreen.tsx
        │   └── ChatScreen.tsx
        ├── components/
        │   ├── MenuCard.tsx
        │   └── CartRow.tsx
        ├── store/cartStore.ts   Zustand store + applyActions reducer
        ├── api/client.ts        fetch wrappers
        └── types.ts             Mirrors backend types
```

## Running locally

### Prerequisites

- Node.js 20+
- A Google AI Studio API key (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey))
- Expo Go app on a phone (App Store / Play Store)
- Phone and laptop on the same Wi-Fi network (or use a phone hotspot if your network has client isolation)

### 1. Clone

```bash
git clone <repo-url>
cd intelligent-bistro
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
GEMINI_API_KEY=your_key_here
PORT=3000
```

Start:

```bash
npm run dev
```

You should see `Bistro backend listening on http://localhost:3000`.

### 3. Mobile

In a separate terminal:

```bash
cd mobile
npm install
```

Find your laptop's LAN IP (`ipconfig` on Windows, `ifconfig` on macOS) — e.g. `192.168.1.42`.

Create `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000
```

Start:

```bash
npx expo start
```

Scan the QR code with Expo Go. The app will load and fetch the menu from your laptop.

### Verifying the backend is reachable

From your phone's browser, visit `http://YOUR_LAN_IP:3000/health`. You should see `{"status":"ok"}`. If not, check Windows Firewall / your router's client isolation settings (some enterprise networks block device-to-device traffic — a phone hotspot is the reliable fallback).

### Tests

```bash
cd backend
npm test
```

## API

| Method | Endpoint        | Description                                            |
|--------|-----------------|--------------------------------------------------------|
| GET    | `/health`       | Returns `{ status: "ok" }`                             |
| GET    | `/menu`         | Returns `{ items: MenuItem[] }`                        |
| POST   | `/chat`         | Body `{ message, cart }`. Returns `{ reply, actions }` |
| POST   | `/orders`       | Body `{ cart }`. Returns `{ orderId, total }`. Persists to SQLite |
| GET    | `/orders/:id`   | Returns the order or 404                               |

All errors return `{ error: { code, message } }` with appropriate HTTP status codes. Input validation is done with zod; invalid input returns 400 `INVALID_INPUT`.

## Design decisions

**Stateless chat endpoint.** Cart state is passed in every turn rather than maintaining server-side conversation history. Simpler contract, easier to reason about, no session management. The tradeoff is that very long conversational references ("the one I added two messages ago") wouldn't work — but for a bistro ordering UX this is the right call.

**Function-calling over JSON parsing.** Gemini's native tool support enforces strict schemas on the model's output. This is far more reliable than prompting for JSON and parsing — no malformed responses, no extra prose to strip, no edge cases. The system prompt also includes the full menu so the model can only reference real item IDs.

**Reply synthesis as fallback.** Function-calling models tend to be terse when emitting tools — Gemini consistently returned "Done!" or empty text. Rather than burning a second LLM call for a warmer reply, the backend synthesizes a confirmation from the action list (`"Added 2 × Spicy Chicken Sandwich and Still Water (large)."`). Deterministic, instant, free.

**Zustand over Redux.** ~30 lines of store code vs ~150 with Redux Toolkit for this scope. The `applyActions` reducer accepts the action list from the backend and dispatches each one through the store's existing mutators, keeping mutation logic in one place.

**MenuItem.modifiers vs CartItem.modifiers.** Both have the same shape but different semantics: the menu defines *available* modifiers per item; the cart records *selected* modifiers for a line. Early versions accidentally spread the menu item directly into the cart item, copying the available list as if it were selected. The fix explicitly destructures menu modifiers off before building the cart item.

**Provider-agnostic LLM integration.** All LLM-specific code lives in `chat.ts`. The function declarations would translate directly to Anthropic tool-use or OpenAI function-calling — swapping providers is roughly a 30-line change in one file plus a dependency swap.

**No streaming.** Chat responses come back as one round-trip. Streaming combined with function-calling is fiddly across providers and the demo experience is identical at this scale (~1–2 second responses).

## How I used Claude Code

> **Replace this section with your own version before submitting.** This is the section the interviewer will probe — it has to be in your voice and accurately reflect what happened. A template to start from:

I used Claude Code as my primary development driver, with a `CLAUDE.md` file at the repo root providing project context and conventions. The scaffolding (Express server, screen components, Zustand store boilerplate, navigation setup) was almost entirely AI-generated from focused prompts that referenced the contracts in CLAUDE.md. I hand-wrote `chat.ts` and the function-call tool declarations specifically — the LLM-integration code is the highest-leverage 50 lines in the project, and I wanted to be able to defend every design decision.

Mid-build I caught Claude Code spreading the full `MenuItem` (including its available `modifiers` field) into new `CartItem`s, which made every tap-added item show fake modifier text in the cart; the fix was a one-line destructure. Other interventions: forcing `npx expo install` for version-pinned native modules after Claude Code's `npm install` produced an Expo SDK mismatch warning, and overriding the initial styling pattern to use a named `brand` color in `tailwind.config.js` rather than scattered hex values.

The pattern that worked best: prompt for one file or one feature at a time, review the diff, run it, then prompt for the next. Trying to one-shot the whole mobile app at once produces sprawling, harder-to-review output.

## Known limitations and future work

- **Compound orders with multiple modifier conditions** (e.g., "two waters, one cold and one room temp") may have modifiers silently dropped — the model prefers to act on what it understands rather than ask clarifying questions. A future iteration would have the assistant acknowledge partial completion or ask follow-ups.
- **No persistence between sessions on mobile.** Reloading the app empties the cart. Real ordering apps would persist cart state via AsyncStorage.
- **No authentication / multi-user.** Orders are stored but not tied to a user.
- **No streaming.** Chat replies arrive as a single response. Streaming would feel more conversational at the cost of significantly more complexity with tool-calling.
- **Backend deployed locally only.** Real deployment to Railway/Render would take ~20 minutes; left out for scope.
- **No image assets for menu items.** Each card shows a category emoji as a visual stand-in.

## What I'd add with more time

- Multi-turn conversation history so references like "the one I just added" work across turns
- Per-item customization UI (modifiers selectable via tap, in addition to chat)
- Real product photography on menu cards
- Streaming chat replies
- A small admin route for editing the menu without a redeploy
- Integration tests that hit the live Gemini API (the current tests mock it)
