import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => {
  class GoogleGenAI {
    models = { generateContent: mockGenerateContent };
    constructor(_: unknown) {}
  }
  return {
    GoogleGenAI,
    Type: {
      OBJECT: "OBJECT",
      STRING: "STRING",
      INTEGER: "INTEGER",
      ARRAY: "ARRAY",
    },
  };
});

process.env.GEMINI_API_KEY = "test-key";

import { handleChat } from "./chat";

describe("handleChat", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it("parses a single add_to_cart function call into an ADD action", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "",
      functionCalls: [
        {
          name: "add_to_cart",
          args: { itemId: "spicy_chicken_sandwich", quantity: 2 },
        },
      ],
    });

    const result = await handleChat("Add two spicy chicken sandwiches", []);

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      type: "ADD",
      itemId: "spicy_chicken_sandwich",
      quantity: 2,
    });
    // Empty model text triggers reply synthesis.
    expect(result.reply).toContain("Spicy Chicken Sandwich");
  });

  it("parses multiple function calls in one response into ordered actions", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "",
      functionCalls: [
        {
          name: "add_to_cart",
          args: { itemId: "spicy_chicken_sandwich", quantity: 2 },
        },
        {
          name: "add_to_cart",
          args: { itemId: "still_water", quantity: 1, modifiers: ["large"] },
        },
      ],
    });

    const result = await handleChat(
      "Two spicy chicken sandwiches and a large water",
      []
    );

    expect(result.actions).toHaveLength(2);
    expect(result.actions[0].type).toBe("ADD");
    expect(result.actions[1].type).toBe("ADD");
    expect(result.actions[1]).toMatchObject({
      itemId: "still_water",
      quantity: 1,
      modifiers: ["large"],
    });
  });

  it("returns no actions and preserves model text when only text is emitted", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "I'm sorry, we don't have pizza on our menu.",
      functionCalls: [],
    });

    const result = await handleChat("Do you have pizza?", []);

    expect(result.actions).toHaveLength(0);
    expect(result.reply).toContain("pizza");
  });

  it("parses update_quantity correctly when given cart context", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "",
      functionCalls: [
        {
          name: "update_quantity",
          args: { itemId: "grilled_atlantic_salmon", quantity: 3 },
        },
      ],
    });

    const result = await handleChat("make that three", [
      {
        id: "grilled_atlantic_salmon",
        name: "Grilled Atlantic Salmon",
        price: 22,
        category: "main",
        description: "x",
        quantity: 1,
      },
    ]);

    expect(result.actions).toEqual([
      {
        type: "UPDATE_QUANTITY",
        itemId: "grilled_atlantic_salmon",
        quantity: 3,
      },
    ]);
  });

  it("parses clear_cart as a CLEAR action", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "",
      functionCalls: [{ name: "clear_cart", args: {} }],
    });

    const result = await handleChat("clear the cart", []);

    expect(result.actions).toEqual([{ type: "CLEAR" }]);
    expect(result.reply.toLowerCase()).toContain("cleared");
  });
});
