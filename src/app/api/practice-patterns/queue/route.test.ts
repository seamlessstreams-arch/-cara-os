// The review queue end to end in demo mode: submit through the intake route,
// list the queue, decide through the decision route, read the merged library.
// Every person named in the bodies is fictional.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { POST as SUBMIT } from "../intake/route";
import { POST as DECIDE } from "./[id]/decision/route";
import { dal } from "@/lib/db/dal";
import { PRACTICE_PATTERNS } from "@/lib/practice-patterns/practice-patterns";
import {
  findRuntimePatternBySourceUrl,
  intakeAuditLogForTests,
  loadPracticeLibrary,
  resetIntakeRateLimitForTests,
} from "@/lib/practice-patterns/intake-store";

let seq = 0;

async function submit(): Promise<{ id: string; url: string }> {
  seq += 1;
  const res = await SUBMIT(
    new NextRequest("http://localhost/api/practice-patterns/intake", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "staff_darren" },
      body: JSON.stringify({
        url: `https://practice-notes.example.org/queue/${seq}`,
        author: "Sam Fieldwell",
        note: "Reg 45 reviews should explain the difference it made for each young person, not list activity.",
        publicly_available: true,
      }),
    }),
  );
  expect(res.status).toBe(201);
  return (await res.json()).data;
}

function decide(id: string, payload: unknown, userId = "staff_darren") {
  return DECIDE(
    new NextRequest(`http://localhost/api/practice-patterns/queue/${id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": userId },
      body: JSON.stringify(payload),
    }),
    { params: Promise.resolve({ id }) },
  );
}

async function queueIds(userId = "staff_darren"): Promise<string[]> {
  const res = await GET(new NextRequest("http://localhost/api/practice-patterns/queue", { headers: { "x-user-id": userId } }));
  expect(res.status).toBe(200);
  return (await res.json()).data.map((c: { id: string }) => c.id);
}

const WORDING = {
  name: "Evaluate the difference, not the activity",
  summary: "A review earns its place by explaining what changed for each child and how the home knows, rather than listing what was done.",
  key_questions: ["What changed for the child, and what tells us so?"],
};

describe("review queue routes", () => {
  beforeEach(() => resetIntakeRateLimitForTests());

  it("lists pending candidates for managers only", async () => {
    const c = await submit();
    expect(await queueIds()).toContain(c.id);
    const refused = await GET(new NextRequest("http://localhost/api/practice-patterns/queue", { headers: { "x-user-id": "staff_edward" } }));
    expect(refused.status).toBe(403);
  });

  it("approves with a named reviewer: who, when and why are recorded and the pattern joins the library with no deploy", async () => {
    const c = await submit();
    const res = await decide(c.id, { decision: "approve", reason: "Specific, and it changes how we write reviews.", pattern: WORDING });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("approved");
    expect(json.data.decision).toMatchObject({
      outcome: "approved",
      by: "staff_darren",
      reason: "Specific, and it changes how we write reviews.",
      pattern_id: json.pattern.id,
    });
    expect(json.data.decision.by_name.length).toBeGreaterThan(0);
    expect(json.pattern).toMatchObject({ claim_basis: "practitioner_view", provenance: "derived_external", status: "approved" });

    const library = await loadPracticeLibrary();
    expect(library.runtimeLoaded).toBe(true);
    expect(library.patterns.length).toBeGreaterThan(PRACTICE_PATTERNS.length);
    expect(library.patterns.some((p) => p.id === json.pattern.id)).toBe(true);
    expect(await queueIds()).not.toContain(c.id);
    expect((await findRuntimePatternBySourceUrl(c.url))?.id).toBe(json.pattern.id);
  });

  it("EVAL: every decision is audited with who, which and why", async () => {
    const a = await submit();
    const b = await submit();
    expect((await decide(a.id, { decision: "approve", reason: "Specific and well evidenced.", pattern: WORDING })).status).toBe(200);
    expect((await decide(b.id, { decision: "reject", reason: "Too general to change practice." })).status).toBe(200);
    const log = intakeAuditLogForTests();
    expect(log.some((e) => e.action === "pattern_candidate_approved" && e.entityId === a.id && e.actorId === "staff_darren")).toBe(true);
    expect(
      log.some((e) => e.action === "pattern_candidate_rejected" && e.entityId === b.id && e.reason === "Too general to change practice."),
    ).toBe(true);
  });

  it("EVAL: refuses approval when the reviewer's staff record has no name, and leaves the candidate pending", async () => {
    const c = await submit();
    const real = await dal.staff.findById("staff_darren");
    expect(real).toBeTruthy();
    const spy = vi
      .spyOn(dal.staff, "findById")
      .mockResolvedValueOnce({ ...real!, full_name: "", first_name: "", last_name: "" });
    const res = await decide(c.id, { decision: "approve", reason: "Specific and well evidenced.", pattern: WORDING });
    expect(res.status).toBe(403);
    spy.mockRestore();
    expect(await queueIds()).toContain(c.id);
  });

  it("refuses a care worker, an unknown id, malformed bodies and a second decision", async () => {
    const c = await submit();
    const reject = { decision: "reject", reason: "Too general to change practice." };
    expect((await decide(c.id, reject, "staff_edward")).status).toBe(403);
    expect((await decide("no-such-candidate", reject)).status).toBe(404);
    expect((await decide(c.id, { decision: "maybe" })).status).toBe(400);
    expect((await decide(c.id, { decision: "approve", reason: "Specific.", pattern: { ...WORDING, extra: 1 } })).status).toBe(400);
    expect((await decide(c.id, reject)).status).toBe(200);
    expect((await decide(c.id, reject)).status).toBe(409);
  });

  it("P4-5: refuses a direct quotation in the approved wording", async () => {
    const c = await submit();
    const res = await decide(c.id, {
      decision: "approve",
      reason: "Good insight for the team.",
      pattern: { ...WORDING, summary: 'She said "every review should tell the story of change for the child" and that stuck with us.' },
    });
    expect(res.status).toBe(422);
  });
});
