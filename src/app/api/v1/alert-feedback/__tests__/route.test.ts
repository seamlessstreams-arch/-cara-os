import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/feedback/alert-feedback.service", () => ({
  recordAlertFeedback: vi.fn(async () => ({ persisted: true, id: "fb1" })),
  isAlertVerdict: (v: unknown) => ["useful", "not_useful", "wrong"].includes(v as string),
}));
vi.mock("@/lib/auth-guard", () => ({
  getRequestIdentity: vi.fn(async () => ({ userId: "staff1" })),
}));

import { recordAlertFeedback } from "@/lib/feedback/alert-feedback.service";
import { getRequestIdentity } from "@/lib/auth-guard";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/v1/alert-feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/v1/alert-feedback", () => {
  it("records valid feedback attributed to the acting user", async () => {
    const { POST } = await import("../route");
    const res = await POST(post({ rule_id: "missing_without_oversight", verdict: "useful", entity_type: "attention_item", entity_id: "ai_1" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, persisted: true, id: "fb1" });
    expect(recordAlertFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ rule_id: "missing_without_oversight", verdict: "useful", entity_id: "ai_1", user_id: "staff1" }),
    );
  });

  it("rejects a missing rule_id", async () => {
    const { POST } = await import("../route");
    const res = await POST(post({ verdict: "useful" }));
    expect(res.status).toBe(400);
    expect(recordAlertFeedback).not.toHaveBeenCalled();
  });

  it("rejects an invalid verdict", async () => {
    const { POST } = await import("../route");
    const res = await POST(post({ rule_id: "r1", verdict: "meh" }));
    expect(res.status).toBe(400);
    expect(recordAlertFeedback).not.toHaveBeenCalled();
  });

  it("still records (anonymously) when the session is unresolved", async () => {
    vi.mocked(getRequestIdentity).mockResolvedValueOnce(NextResponse.json({ error: "no" }, { status: 403 }));
    const { POST } = await import("../route");
    const res = await POST(post({ rule_id: "r1", verdict: "wrong" }));
    expect(res.status).toBe(200);
    expect(recordAlertFeedback).toHaveBeenCalledWith(expect.objectContaining({ user_id: null, verdict: "wrong" }));
  });
});
