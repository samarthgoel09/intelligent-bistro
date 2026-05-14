import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { CartItem } from "./types";

const dataDir = path.join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "bistro.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    items_json TEXT NOT NULL,
    total REAL NOT NULL,
    created_at TEXT NOT NULL
  )
`);

const insertStmt = db.prepare(
  "INSERT INTO orders (id, items_json, total, created_at) VALUES (?, ?, ?, ?)"
);
const selectStmt = db.prepare("SELECT id, items_json, total, created_at FROM orders WHERE id = ?");

export type OrderRow = {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: string;
};

export function saveOrder(items: CartItem[]): string {
  const id = randomUUID();
  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  insertStmt.run(id, JSON.stringify(items), total, new Date().toISOString());
  return id;
}

export function getOrder(id: string): OrderRow | null {
  const row = selectStmt.get(id) as
    | { id: string; items_json: string; total: number; created_at: string }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    items: JSON.parse(row.items_json) as CartItem[],
    total: row.total,
    createdAt: row.created_at,
  };
}
