import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-usage-badge";

const { formatCommandId, formatTimestamp, STATUS_LABELS } = _testing;

// ── formatCommandId ─────────────────────────────────────────────────────────

describe("formatCommandId", () => {
  it("converts snake_case to Title Case", () => {
    expect(formatCommandId("improve_writing")).toBe("Improve Writing");
  });

  it("handles single word", () => {
    expect(formatCommandId("summarise")).toBe("Summarise");
  });

  it("handles multiple underscores", () => {
    expect(formatCommandId("draft_daily_log")).toBe("Draft Daily Log");
  });

  it("handles empty string", () => {
    expect(formatCommandId("")).toBe("");
  });

  it("handles already capitalised words", () => {
    expect(formatCommandId("Draft_Daily")).toBe("Draft Daily");
  });
});

// ── formatTimestamp ──────────────────────────────────────────────────────────

describe("formatTimestamp", () => {
  it("formats a valid ISO date", () => {
    const result = formatTimestamp("2026-05-12T14:30:00.000Z");
    // Should contain day, month, hours, minutes
    expect(result).toMatch(/\d/);
    expect(result).toMatch(/May/);
  });

  it("returns fallback for invalid date", () => {
    // toLocaleString returns "Invalid Date" when parsing fails
    const result = formatTimestamp("not-a-date");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── STATUS_LABELS ───────────────────────────────────────────────────────────

describe("STATUS_LABELS", () => {
  it("defines all lifecycle statuses", () => {
    expect(STATUS_LABELS).toHaveProperty("draft");
    expect(STATUS_LABELS).toHaveProperty("edited");
    expect(STATUS_LABELS).toHaveProperty("submitted_for_approval");
    expect(STATUS_LABELS).toHaveProperty("approved");
    expect(STATUS_LABELS).toHaveProperty("committed");
    expect(STATUS_LABELS).toHaveProperty("rejected");
    expect(STATUS_LABELS).toHaveProperty("archived");
  });

  it("each status has a label and color", () => {
    for (const [key, value] of Object.entries(STATUS_LABELS)) {
      expect(value).toHaveProperty("label");
      expect(value).toHaveProperty("color");
      expect(typeof value.label).toBe("string");
      expect(value.color).toMatch(/^text-/);
    }
  });

  it("approved is green", () => {
    expect(STATUS_LABELS.approved.color).toContain("green");
  });

  it("rejected is red", () => {
    expect(STATUS_LABELS.rejected.color).toContain("red");
  });
});
