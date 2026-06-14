import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-activity-card";

const { formatCommandId } = _testing;

// ── formatCommandId ─────────────────────────────────────────────────────────

describe("formatCommandId (activity card)", () => {
  it("converts snake_case to Title Case", () => {
    expect(formatCommandId("improve_writing")).toBe("Improve Writing");
  });

  it("handles single word", () => {
    expect(formatCommandId("summarise")).toBe("Summarise");
  });

  it("handles multiple underscores", () => {
    expect(formatCommandId("draft_management_oversight")).toBe(
      "Draft Management Oversight",
    );
  });

  it("handles empty string", () => {
    expect(formatCommandId("")).toBe("");
  });

  it("handles command with many segments", () => {
    expect(formatCommandId("create_task_from_incident")).toBe(
      "Create Task From Incident",
    );
  });
});
