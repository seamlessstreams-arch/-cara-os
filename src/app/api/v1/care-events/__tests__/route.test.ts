import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/v1/care-events/route";
import { NextRequest } from "next/server";

function makeGet(url: string): NextRequest {
  return new NextRequest(new Request(url));
}
function makePost(body: unknown): NextRequest {
  return new NextRequest(
    new Request("http://x/api/v1/care-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("care-events base route (create classifies + list)", () => {
  it("classifies a safeguarding event on create — Reg 40 + safeguarding flags + routing preview", async () => {
    const res = await POST(
      makePost({
        title: "Disclosure from young person",
        content: "YP disclosed a concern during the evening shift.",
        category: "safeguarding",
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();

    // Routing preview must be the object shape the UI consumes (not a string[]).
    expect(body.routing_preview).toBeTruthy();
    expect(body.routing_preview.requires_reg40_triage).toBe(true);
    expect(Array.isArray(body.routing_preview.routes)).toBe(true);
    expect(body.routing_preview.routes.length).toBeGreaterThan(0);
    expect(Array.isArray(body.routing_preview.evidence_prompts)).toBe(true);

    // Stored event carries the classification flags (processCareEvent reads these
    // on submit for routing priority / oversight).
    expect(body.data.requires_reg40_triage).toBe(true);
    expect(body.data.is_safeguarding).toBe(true);
    expect(body.data.status).toBe("draft");
    expect(body.data.id).toBeTruthy();
  });

  it("does NOT flag a routine general event for Reg 40 or safeguarding", async () => {
    const res = await POST(
      makePost({
        title: "Quiet afternoon",
        content: "Watched a film and cooked dinner together.",
        category: "general",
      }),
    );
    const body = await res.json();
    expect(body.data.requires_reg40_triage).toBe(false);
    expect(body.data.is_safeguarding).toBe(false);
    expect(body.routing_preview.requires_reg40_triage).toBe(false);
  });

  it("flags Reg 40 from text even when the category is general (keyword fail-safe)", async () => {
    const res = await POST(
      makePost({
        title: "Concern raised at handover",
        content: "An allegation was made against a member of staff during handover.",
        category: "general",
      }),
    );
    const body = await res.json();
    expect(body.data.requires_reg40_triage).toBe(true);
    expect(body.routing_preview.requires_reg40_triage).toBe(true);
  });

  it("rejects a create with no title or no content", async () => {
    expect((await POST(makePost({ title: "", content: "x", category: "general" }))).status).toBe(400);
    expect((await POST(makePost({ title: "x", content: "", category: "general" }))).status).toBe(400);
  });

  it("treats the 'none' child_id sentinel as not-child-specific", async () => {
    const body = await (
      await POST(makePost({ title: "House meeting", content: "Weekly house meeting.", category: "general", child_id: "none" }))
    ).json();
    expect(body.data.child_id).toBeNull();
  });

  it("GET returns created events with status_counts; new draft is findable + enriched", async () => {
    const created = await (
      await POST(makePost({ title: "Findable event", content: "Created for the GET test.", category: "general" }))
    ).json();

    const res = await GET(makeGet("http://x/api/v1/care-events"));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.status_counts).toBeTypeOf("object");
    expect(body.meta.status_counts.draft).toBeGreaterThanOrEqual(1);

    const found = body.data.find((e: { id: string }) => e.id === created.data.id);
    expect(found).toBeTruthy();
    expect(found).toHaveProperty("staff_name"); // display-name enrichment
  });

  it("GET honours from_date / to_date range (inspection-readiness consumer)", async () => {
    const old = await (
      await POST(makePost({ title: "Old event", content: "Happened a while ago.", category: "general", event_date: "2020-01-15" }))
    ).json();

    // from_date in the future of the old event excludes it…
    const excluded = await (await GET(makeGet("http://x/api/v1/care-events?from_date=2021-01-01"))).json();
    expect(excluded.data.find((e: { id: string }) => e.id === old.data.id)).toBeFalsy();

    // …and a from_date before it includes it.
    const included = await (await GET(makeGet("http://x/api/v1/care-events?from_date=2019-01-01"))).json();
    expect(included.data.find((e: { id: string }) => e.id === old.data.id)).toBeTruthy();
  });

  it("GET days window does not drop a just-created (same-day) event", async () => {
    const created = await (
      await POST(makePost({ title: "Today event", content: "Happened today.", category: "general" }))
    ).json();
    const body = await (await GET(makeGet("http://x/api/v1/care-events?days=7"))).json();
    const found = body.data.find((e: { id: string }) => e.id === created.data.id);
    expect(found).toBeTruthy();
  });
});
