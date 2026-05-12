import { describe, it, expect } from "vitest";
import { _testing } from "@/components/aria/aria-command-palette";

const { DEFAULT_COMMANDS, CATEGORY_ICONS } = _testing;

// ── DEFAULT_COMMANDS ────────────────────────────────────────────────────────

describe("DEFAULT_COMMANDS", () => {
  it("contains at least 20 commands", () => {
    expect(DEFAULT_COMMANDS.length).toBeGreaterThanOrEqual(20);
  });

  it("each command has required fields", () => {
    for (const cmd of DEFAULT_COMMANDS) {
      expect(cmd).toHaveProperty("id");
      expect(cmd).toHaveProperty("label");
      expect(cmd).toHaveProperty("description");
      expect(cmd).toHaveProperty("category");
      expect(cmd).toHaveProperty("module");
      expect(typeof cmd.id).toBe("string");
      expect(cmd.id.length).toBeGreaterThan(0);
    }
  });

  it("has unique command IDs", () => {
    const ids = DEFAULT_COMMANDS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("covers multiple categories", () => {
    const categories = new Set(DEFAULT_COMMANDS.map((c) => c.category));
    expect(categories.size).toBeGreaterThanOrEqual(8);
  });

  it("includes writing commands", () => {
    const writing = DEFAULT_COMMANDS.filter((c) => c.category === "writing");
    expect(writing.length).toBeGreaterThanOrEqual(3);
  });

  it("includes incident commands", () => {
    const incidents = DEFAULT_COMMANDS.filter((c) => c.category === "incident");
    expect(incidents.length).toBeGreaterThanOrEqual(2);
  });

  it("includes management commands", () => {
    const mgmt = DEFAULT_COMMANDS.filter((c) => c.category === "management");
    expect(mgmt.length).toBeGreaterThanOrEqual(1);
  });
});

// ── CATEGORY_ICONS ──────────────────────────────────────────────────────────

describe("CATEGORY_ICONS", () => {
  it("defines icons for all categories used in commands", () => {
    const usedCategories = new Set(DEFAULT_COMMANDS.map((c) => c.category));
    for (const cat of usedCategories) {
      expect(CATEGORY_ICONS).toHaveProperty(cat);
      expect(CATEGORY_ICONS[cat]).toBeTruthy(); // React component (forwardRef or function)
    }
  });

  it("has at least 8 categories", () => {
    expect(Object.keys(CATEGORY_ICONS).length).toBeGreaterThanOrEqual(8);
  });
});
