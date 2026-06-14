// ══════════════════════════════════════════════════════════════════════════════
// Tests — Cara Task Creator (parser + component logic)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { parseTasksFromText } from "@/components/cara/cara-task-creator";
import type { ParsedTask } from "@/components/cara/cara-task-creator";

// ─── Task parser ─────────────────────────────────────────────────────────────

describe("parseTasksFromText", () => {
  it("parses numbered task list", () => {
    const text = `
1. Follow up with social worker — Update on child's return interview outcome
2. Review risk assessment — Ensure behaviour support plan is current
3. Schedule team debrief — Discuss the incident and lessons learned
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks.length).toBe(3);
    expect(tasks[0].title).toBe("Follow up with social worker");
    expect(tasks[0].description).toContain("return interview outcome");
    expect(tasks[1].title).toBe("Review risk assessment");
    expect(tasks[2].title).toBe("Schedule team debrief");
  });

  it("parses bullet-point task list", () => {
    const text = `
- Update placement plan
- Contact school for education review
- Complete medication audit
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks.length).toBe(3);
    expect(tasks[0].title).toBe("Update placement plan");
    expect(tasks[2].title).toBe("Complete medication audit");
  });

  it("parses tasks with metadata lines", () => {
    const text = `
1. Complete safeguarding referral — Ensure referral is sent to LADO
   Priority: urgent
   Assigned to: Registered Manager
   Due: 2 days
2. Update risk assessment
   Priority: high
   Assigned to: Team Leader
   Due: 7 days
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks.length).toBe(2);
    expect(tasks[0].priority).toBe("urgent");
    expect(tasks[0].assignedRole).toBe("Registered Manager");
    expect(tasks[0].dueDays).toBe(2);
    expect(tasks[1].priority).toBe("high");
    expect(tasks[1].assignedRole).toBe("Team Leader");
    expect(tasks[1].dueDays).toBe(7);
  });

  it("detects safeguarding-related tasks", () => {
    const text = `
1. Follow up safeguarding concern — Refer to LADO
2. Order new stationery — Routine admin
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks[0].isSafeguarding).toBe(true);
    expect(tasks[1].isSafeguarding).toBe(false);
  });

  it("defaults safeguarding tasks to urgent priority", () => {
    const text = `
1. Report missing from care episode
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks[0].isSafeguarding).toBe(true);
    expect(tasks[0].priority).toBe("urgent");
  });

  it("defaults non-safeguarding tasks to medium priority", () => {
    const text = `
1. File team meeting minutes
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks[0].isSafeguarding).toBe(false);
    expect(tasks[0].priority).toBe("medium");
  });

  it("handles bold markdown titles", () => {
    const text = `
1. **Complete DBS renewal** — Chase outstanding DBS for new starter
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks[0].title).toBe("Complete DBS renewal");
  });

  it("returns empty array for non-task text", () => {
    const text = "This is just a paragraph of text with no task structure.";
    const tasks = parseTasksFromText(text);
    expect(tasks.length).toBe(0);
  });

  it("parses tasks with category metadata", () => {
    const text = `
1. Review fire drill records
   Category: health_safety
   Priority: medium
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks[0].category).toBe("health_safety");
  });

  it("handles mixed numbered and dash formats", () => {
    const text = `
1. First task
- Second task
* Third task
2) Fourth task
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks.length).toBe(4);
  });

  it("truncates long descriptions to 500 chars", () => {
    const longDesc = "A".repeat(600);
    const text = `1. Task title — ${longDesc}`;
    const tasks = parseTasksFromText(text);
    expect(tasks[0].description.length).toBeLessThanOrEqual(500);
  });

  it("handles tasks with due date in days format", () => {
    const text = `
1. Complete training
   Due: 14 days
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks[0].dueDays).toBe(14);
  });

  it("generates unique IDs for each task", () => {
    const text = `
1. Task one
2. Task two
3. Task three
    `.trim();

    const tasks = parseTasksFromText(text);
    const ids = new Set(tasks.map((t) => t.id));
    expect(ids.size).toBe(3);
  });

  it("detects exploitation and allegation as safeguarding", () => {
    const text = `
1. Review exploitation concern
2. Follow up allegation against staff
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks[0].isSafeguarding).toBe(true);
    expect(tasks[1].isSafeguarding).toBe(true);
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe("parseTasksFromText edge cases", () => {
  it("handles empty string", () => {
    expect(parseTasksFromText("").length).toBe(0);
  });

  it("handles string with only whitespace", () => {
    expect(parseTasksFromText("   \n  \n  ").length).toBe(0);
  });

  it("handles single task with no description", () => {
    const tasks = parseTasksFromText("1. Send report");
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe("Send report");
    expect(tasks[0].description).toBe("");
  });

  it("ignores separator lines", () => {
    const text = `
1. Task one
──────────────
2. Task two
===========
3. Task three
    `.trim();

    const tasks = parseTasksFromText(text);
    expect(tasks.length).toBe(3);
    // Separator lines should not become part of descriptions
    for (const t of tasks) {
      expect(t.description).not.toContain("───");
      expect(t.description).not.toContain("===");
    }
  });
});
