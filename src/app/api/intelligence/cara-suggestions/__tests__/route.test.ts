import { describe, it, expect, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/intelligence/cara-suggestions/route";
import { caraSuggestions } from "@/lib/intelligence/fallback-store";
import { NextRequest } from "next/server";

function makeReq(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

describe("cara-suggestions route (fallback mode)", () => {
  beforeEach(() => {
    // Reset audit_timeline / status mutations between tests by reloading from snapshot.
    // Each test below uses its own suggestion id and only asserts on transitions
    // that are idempotent enough to be re-run.
  });

  it("GET returns all suggestions sorted by created_at desc", async () => {
    const res = await GET(makeReq("http://x/api/intelligence/cara-suggestions"));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    for (let i = 1; i < body.items.length; i++) {
      expect(body.items[i - 1].created_at >= body.items[i].created_at).toBe(true);
    }
  });

  it("GET filters by status", async () => {
    const res = await GET(makeReq("http://x/api/intelligence/cara-suggestions?status=awaiting_review"));
    const body = await res.json();
    expect(body.ok).toBe(true);
    for (const it of body.items) expect(it.status).toBe("awaiting_review");
  });

  it("GET ?id= returns a single item", async () => {
    const seed = caraSuggestions[0];
    const res = await GET(makeReq(`http://x/api/intelligence/cara-suggestions?id=${seed.id}`));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.item?.id).toBe(seed.id);
  });

  it("PATCH requires id and status", async () => {
    const res = await PATCH(
      makeReq("http://x/api/intelligence/cara-suggestions", {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("PATCH approves a suggestion and stamps approved_at + appends audit", async () => {
    const seed = caraSuggestions[0];
    const before = seed.audit_timeline.length;
    const res = await PATCH(
      makeReq("http://x/api/intelligence/cara-suggestions", {
        method: "PATCH",
        body: JSON.stringify({
          id: seed.id,
          status: "approved",
          finalText: "Approved final wording.",
          actorRole: "registered_manager",
        }),
      }),
    );
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.item.status).toBe("approved");
    expect(body.item.approved_at).toBeTruthy();
    expect(body.item.final_text).toBe("Approved final wording.");
    expect(body.item.audit_timeline.length).toBe(before + 1);
    expect(body.item.audit_timeline.at(-1).action).toBe("suggestion_approved");
  });

  it("PATCH rejects with reason", async () => {
    const seed = caraSuggestions[1];
    const res = await PATCH(
      makeReq("http://x/api/intelligence/cara-suggestions", {
        method: "PATCH",
        body: JSON.stringify({
          id: seed.id,
          status: "rejected",
          rejectionReason: "Not appropriate at this time.",
          actorRole: "registered_manager",
        }),
      }),
    );
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.item.status).toBe("rejected");
    expect(body.item.rejected_at).toBeTruthy();
    expect(body.item.rejection_reason).toBe("Not appropriate at this time.");
  });
});
