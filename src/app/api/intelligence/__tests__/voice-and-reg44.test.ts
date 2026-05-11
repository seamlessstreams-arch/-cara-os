import { describe, it, expect } from "vitest";
import { GET as voiceGET, POST as voicePOST } from "@/app/api/intelligence/voice/route";
import { GET as reg44GET, POST as reg44POST } from "@/app/api/intelligence/reg44/route";
import { NextRequest } from "next/server";

function makeReq(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

describe("voice route (fallback mode)", () => {
  it("GET returns entries sorted by entry_date desc", async () => {
    const res = await voiceGET(makeReq("http://x/api/intelligence/voice"));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(true);
    expect(Array.isArray(body.entries)).toBe(true);
    for (let i = 1; i < body.entries.length; i++) {
      expect(body.entries[i - 1].entry_date >= body.entries[i].entry_date).toBe(true);
    }
  });

  it("GET filters by childId", async () => {
    const res = await voiceGET(makeReq("http://x/api/intelligence/voice?childId=child-a"));
    const body = await res.json();
    expect(body.ok).toBe(true);
    for (const e of body.entries) expect(e.child_id).toBe("child-a");
  });

  it("POST validates required fields", async () => {
    const res = await voicePOST(
      makeReq("http://x/api/intelligence/voice", {
        method: "POST",
        body: JSON.stringify({ childId: "child-a" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("POST creates a new entry and prepends it to the list", async () => {
    const before = (await (await voiceGET(makeReq("http://x/api/intelligence/voice"))).json()).entries.length;
    const res = await voicePOST(
      makeReq("http://x/api/intelligence/voice", {
        method: "POST",
        body: JSON.stringify({
          childId: "child-a",
          homeId: "home_oak",
          entryDate: "2026-05-10",
          category: "compliment",
          childWords: "Test entry from route test.",
          summary: "Test summary",
          actionTaken: "Test action",
          staffResponse: "Test response",
        }),
      }),
    );
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(true);
    expect(body.entry.child_id).toBe("child-a");
    expect(body.entry.id).toBeTruthy();

    const after = (await (await voiceGET(makeReq("http://x/api/intelligence/voice"))).json()).entries.length;
    expect(after).toBe(before + 1);
  });
});

describe("reg44 route (fallback mode)", () => {
  it("GET returns visits sorted by visit_date desc", async () => {
    const res = await reg44GET(makeReq("http://x/api/intelligence/reg44"));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(true);
    expect(Array.isArray(body.visits)).toBe(true);
    for (let i = 1; i < body.visits.length; i++) {
      expect(body.visits[i - 1].visit_date >= body.visits[i].visit_date).toBe(true);
    }
  });

  it("POST validates required fields", async () => {
    const res = await reg44POST(
      makeReq("http://x/api/intelligence/reg44", {
        method: "POST",
        body: JSON.stringify({ homeId: "home_oak" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("POST creates a new visit", async () => {
    const res = await reg44POST(
      makeReq("http://x/api/intelligence/reg44", {
        method: "POST",
        body: JSON.stringify({
          homeId: "home_oak",
          visitDate: "2026-05-10",
          visitorName: "Test Visitor",
        }),
      }),
    );
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.visit.visitor_name).toBe("Test Visitor");
    expect(body.visit.status).toBe("scheduled");
  });
});
