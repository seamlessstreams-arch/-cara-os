// POST /api/practice-patterns/queue/:id/draft in demo mode. AI is hard-off
// (CARA_AI_ENABLED=false) so no test can reach a real model, whatever the
// machine's own provider settings: the deterministic draft is what saves.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as DRAFT } from "./route";
import { POST as SUBMIT } from "../../../intake/route";
import { POST as DECIDE } from "../decision/route";
import { candidateStore, resetIntakeRateLimitForTests } from "@/lib/practice-patterns/intake-store";

let previousAiFlag: string | undefined;
beforeAll(() => {
  previousAiFlag = process.env.CARA_AI_ENABLED;
  process.env.CARA_AI_ENABLED = "false";
});
afterAll(() => {
  if (previousAiFlag === undefined) delete process.env.CARA_AI_ENABLED;
  else process.env.CARA_AI_ENABLED = previousAiFlag;
});

let seq = 0;
async function submit(): Promise<string> {
  seq += 1;
  const res = await SUBMIT(
    new NextRequest("http://localhost/api/practice-patterns/intake", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "staff_darren" },
      body: JSON.stringify({
        url: `https://practice-notes.example.org/drafts/${seq}`,
        author: "Sam Fieldwell",
        note: "Our quality review stopped listing activity and started explaining the difference it made.",
        publicly_available: true,
      }),
    }),
  );
  expect(res.status).toBe(201);
  return (await res.json()).data.id;
}

function draft(id: string, userId = "staff_darren") {
  return DRAFT(
    new NextRequest(`http://localhost/api/practice-patterns/queue/${id}/draft`, { method: "POST", headers: { "x-user-id": userId } }),
    { params: Promise.resolve({ id }) },
  );
}

describe("POST /api/practice-patterns/queue/:id/draft", () => {
  beforeEach(() => resetIntakeRateLimitForTests());

  it("saves a deterministic draft when AI is off, and leaves the candidate in review", async () => {
    const id = await submit();
    const res = await draft(id);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ai.method).toBe("refused");
    expect(json.draft).toMatchObject({ method: "deterministic" });
    expect(json.draft.flags).toContain("ai_unavailable");
    expect(json.data.status).toBe("pending_review");
    const stored = await candidateStore.findById(id);
    expect(stored?.status).toBe("pending_review");
    expect(stored?.draft?.method).toBe("deterministic");
  });

  it("refuses a care worker, an unknown id and a candidate already decided", async () => {
    const id = await submit();
    expect((await draft(id, "staff_edward")).status).toBe(403);
    expect((await draft("no-such-candidate")).status).toBe(404);
    const decided = await DECIDE(
      new NextRequest(`http://localhost/api/practice-patterns/queue/${id}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-user-id": "staff_darren" },
        body: JSON.stringify({ decision: "reject", reason: "Too general to change practice." }),
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(decided.status).toBe(200);
    expect((await draft(id)).status).toBe(409);
  });
});
