// POST /api/practice-patterns/intake, run for real in demo mode (Supabase off,
// in-memory stores, X-User-Id identity). Every person in the bodies below is
// fictional; the child-data test uses a child from the demo seed.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { dal } from "@/lib/db/dal";
import { db } from "@/lib/db/store";
import {
  candidateStore,
  intakeAuditLogForTests,
  resetIntakeRateLimitForTests,
} from "@/lib/practice-patterns/intake-store";

let seq = 0;
function uniqueUrl(tag: string): string {
  seq += 1;
  return `https://practice-notes.example.org/posts/${tag}-${seq}`;
}

function body(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    url: uniqueUrl("post"),
    author: "Sam Fieldwell",
    note: "Our Reg 45 review stopped listing activity and started explaining the difference it made for each young person.",
    publicly_available: true,
    ...overrides,
  };
}

function post(payload: unknown, userId = "staff_darren"): NextRequest {
  return new NextRequest("http://localhost/api/practice-patterns/intake", {
    method: "POST",
    headers: { "content-type": "application/json", "x-user-id": userId },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

async function storedCount(): Promise<number> {
  return (await candidateStore.findAll()).length;
}

describe("POST /api/practice-patterns/intake", () => {
  beforeEach(() => resetIntakeRateLimitForTests());

  it("queues a manager's submission as a pending candidate and audits it", async () => {
    const res = await POST(post(body()));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data).toMatchObject({
      record_kind: "practice_pattern_candidate",
      status: "pending_review",
      claim_basis: "practitioner_view",
      author: "Sam Fieldwell",
    });
    expect(
      intakeAuditLogForTests().some((e) => e.action === "pattern_candidate_submitted" && e.entityId === json.data.id),
    ).toBe(true);
  });

  it("EVAL: refuses a non-manager and stores nothing", async () => {
    const before = await storedCount();
    const res = await POST(post(body(), "staff_edward"));
    expect(res.status).toBe(403);
    expect(await storedCount()).toBe(before);
  });

  it("EVAL: malformed bodies fail cleanly with 400", async () => {
    expect((await POST(post("{not json"))).status).toBe(400);

    const missing = await POST(post({ url: uniqueUrl("missing") }));
    expect(missing.status).toBe(400);
    expect((await missing.json()).issues.length).toBeGreaterThan(0);

    const wrongType = await POST(post(body({ publicly_available: "yes" })));
    expect(wrongType.status).toBe(400);
  });

  it("refuses engagement data outright (likes, followers, comments are never collected)", async () => {
    const res = await POST(post(body({ likes: 240, followers: 9000, comments: ["great post"] })));
    expect(res.status).toBe(400);
  });

  it("EVAL: rejects an item naming a child at the home, stores nothing, and never echoes the name", async () => {
    const child = db.youngPeople.findAll().find((c) => c.first_name && c.last_name);
    expect(child).toBeDefined();
    const before = await storedCount();
    const res = await POST(
      post(body({ note: `A reflection on how ${child!.first_name} ${child!.last_name} found the first month in placement.` })),
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.reasons.map((r: { code: string }) => r.code)).toContain("child_identifiable");
    expect(JSON.stringify(json)).not.toContain(child!.first_name);
    expect(await storedCount()).toBe(before);
    expect(intakeAuditLogForTests().at(-1)).toMatchObject({
      action: "pattern_candidate_refused_at_intake",
      reason: "child_identifiable",
      entityId: null,
    });
  });

  it("EVAL: merges a second submission of the same post instead of queueing it twice", async () => {
    const first = await POST(
      post(body({ url: "https://www.linkedin.com/posts/example-author_practice-activity-7000000000000000001-abcd" })),
    );
    expect(first.status).toBe(201);
    const before = await storedCount();

    const second = await POST(
      post(
        body({
          url: "https://www.linkedin.com/feed/update/urn:li:activity:7000000000000000001/",
          note: "A second manager's note on why this matters for how we write our next quality review.",
        }),
        "staff_ryan",
      ),
    );
    expect(second.status).toBe(200);
    const json = await second.json();
    expect(json).toMatchObject({ merged: true, added: true });
    expect(json.data.submissions).toHaveLength(2);
    expect(await storedCount()).toBe(before);
  });

  it("never fetches the submitted link", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const res = await POST(post(body()));
    expect(res.status).toBe(201);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("stores nothing when the roster cannot be read: an unreadable roster is not a clean screen", async () => {
    const spy = vi.spyOn(dal.youngPeople, "findAll").mockRejectedValueOnce(new Error("database unavailable"));
    const before = await storedCount();
    const res = await POST(post(body()));
    expect(res.status).toBe(503);
    expect(await storedCount()).toBe(before);
    spy.mockRestore();
  });

  it("rate-limits one person after 20 submissions in ten minutes", async () => {
    for (let i = 0; i < 20; i += 1) {
      const r = await POST(post(body()));
      expect(r.status).toBe(201);
    }
    const res = await POST(post(body()));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    // Someone else is unaffected.
    expect((await POST(post(body(), "staff_ryan"))).status).toBe(201);
  });
});
