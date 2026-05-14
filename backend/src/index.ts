import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { z, ZodError } from "zod";
import { menu } from "./menu";
import { saveOrder, getOrder } from "./db";
import { handleChat } from "./chat";
import type { ApiError, CartItem } from "./types";

const app = express();

// CORS open to all origins — dev only. Lock this down before production.
app.use(cors());
app.use(express.json());

const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.enum(["main", "side", "drink", "dessert"]),
  modifiers: z.array(z.string()).optional(),
  quantity: z.number().int().positive(),
});

const chatSchema = z.object({
  message: z.string().min(1),
  cart: z.array(cartItemSchema),
});

const ordersSchema = z.object({
  cart: z.array(cartItemSchema).min(1),
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/menu", (_req, res) => {
  res.json({ items: menu });
});

app.post("/chat", async (req, res, next) => {
  try {
    const { message, cart } = chatSchema.parse(req.body);
    const result = await handleChat(message, cart);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post("/orders", (req, res, next) => {
  try {
    const { cart } = ordersSchema.parse(req.body);
    const total = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const orderId = saveOrder(cart as CartItem[]);
    res.json({ orderId, total });
  } catch (err) {
    next(err);
  }
});

app.get("/orders/:id", (req, res, next) => {
  try {
    const order = getOrder(req.params.id);
    if (!order) {
      const body: ApiError = {
        error: { code: "NOT_FOUND", message: `Order ${req.params.id} not found` },
      };
      res.status(404).json(body);
      return;
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    const body: ApiError = {
      error: { code: "INVALID_INPUT", message: err.issues.map((i) => i.message).join("; ") },
    };
    res.status(400).json(body);
    return;
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  const body: ApiError = { error: { code: "INTERNAL_ERROR", message } };
  res.status(500).json(body);
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Bistro backend listening on http://localhost:${port}`);
});
