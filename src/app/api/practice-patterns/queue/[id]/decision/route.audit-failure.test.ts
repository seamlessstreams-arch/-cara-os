// No decision stands without its audit entry: when the audit trail cannot be
// written, the decision route must change nothing and say so.

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/practice-patterns/intake-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/practice-patterns/intake-store")>();
  return {
    ...actual,
    recordIntakeAudit: vi.fn(async () => ({ recorded: false, error: 'relation "cara_audit_logs" does not exist' })),
  };
});

import { NextRequest } from "next/server";
import { POST as DECIDE } from "./route";
import { runIntakePipeline } from "@/lib/practice-patterns/intake-pipeline";
import { candidateStore, loadPracticeLibrary } from "@/lib/practice-patterns/intake-store";

describe("POST /api/practice-patterns/queue/:id/decision — audit unavailable", () => {
  it("decides nothing, saves no pattern, and answers 503", async () => {
    const r = runIntakePipeline(
      {
        url: "https://practice-notes.example.org/posts/audit-down",
        author: "Sam Fieldwell",
        note: "Reg 45 reviews should explain the difference it made for each young person, not list activity.",
        publicly_available: true,
      },
      { roster: [], voices: [], existing: [], submittedBy: "staff_darren", now: "2026-11-09T10:00:00.000Z", today: "2026-11-09" },
    );
    if (r.outcome !== "accepted") throw new Error("fixture should be accepted");
    const c = await candidateStore.create(r.candidate);
    const before = (await loadPracticeLibrary()).patterns.length;

    const res = await DECIDE(
      new NextRequest(`http://localhost/api/practice-patterns/queue/${c.id}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-user-id": "staff_darren" },
        body: JSON.stringify({
          decision: "approve",
          reason: "Specific and well evidenced.",
          pattern: {
            name: "Evaluate the difference, not the activity",
            summary: "A review earns its place by explaining what changed for each child, rather than listing what was done.",
            key_questions: ["What changed for the child, and what tells us so?"],
          },
        }),
      }),
      { params: Promise.resolve({ id: c.id }) },
    );

    expect(res.status).toBe(503);
    expect((await res.json()).detail).toMatch(/Nothing has changed/);
    expect((await candidateStore.findById(c.id))?.status).toBe("pending_review");
    expect((await loadPracticeLibrary()).patterns.length).toBe(before);
  });
});
