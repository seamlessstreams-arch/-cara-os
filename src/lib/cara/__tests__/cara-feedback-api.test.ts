// ══════════════════════════════════════════════════════════════════════════════
// Tests: /api/cara/feedback route helpers
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => null,
  isSupabaseEnabled: () => false,
}));

import {
  validateRating,
  validateTags,
  sanitiseNote,
} from "@/app/api/cara/feedback/route";

// ── validateRating ─────────────────────────────────────────────────────────

describe("validateRating", () => {
  it("accepts 'positive'", () => {
    expect(validateRating("positive")).toBe(true);
  });

  it("accepts 'negative'", () => {
    expect(validateRating("negative")).toBe(true);
  });

  it("rejects null", () => {
    expect(validateRating(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(validateRating(undefined)).toBe(false);
  });

  it("rejects random string", () => {
    expect(validateRating("neutral")).toBe(false);
  });

  it("rejects number", () => {
    expect(validateRating(5)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateRating("")).toBe(false);
  });
});

// ── validateTags ───────────────────────────────────────────────────────────

describe("validateTags", () => {
  it("accepts empty array", () => {
    expect(validateTags([])).toBe(true);
  });

  it("accepts valid string array", () => {
    expect(validateTags(["inaccurate", "tone", "too_long"])).toBe(true);
  });

  it("rejects null", () => {
    expect(validateTags(null)).toBe(false);
  });

  it("rejects array with non-strings", () => {
    expect(validateTags(["ok", 42])).toBe(false);
  });

  it("rejects array with very long strings", () => {
    const longTag = "x".repeat(200);
    expect(validateTags([longTag])).toBe(false);
  });

  it("rejects string (not array)", () => {
    expect(validateTags("tag")).toBe(false);
  });
});

// ── sanitiseNote ───────────────────────────────────────────────────────────

describe("sanitiseNote", () => {
  it("returns null for non-string", () => {
    expect(sanitiseNote(null)).toBeNull();
    expect(sanitiseNote(undefined)).toBeNull();
    expect(sanitiseNote(42)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(sanitiseNote("")).toBeNull();
  });

  it("returns null for whitespace-only", () => {
    expect(sanitiseNote("   ")).toBeNull();
  });

  it("trims and returns valid note", () => {
    expect(sanitiseNote("  Good output  ")).toBe("Good output");
  });

  it("truncates to 500 characters", () => {
    const long = "a".repeat(600);
    const result = sanitiseNote(long);
    expect(result).toHaveLength(500);
  });

  it("preserves short notes exactly", () => {
    expect(sanitiseNote("Cara was very helpful here")).toBe("Cara was very helpful here");
  });
});
