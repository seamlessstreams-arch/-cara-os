import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/feedback/suggestion-outcome.service", () => ({
  recordSuggestionOutcome: vi.fn(async () => ({ persisted: true, id: "so1" })),
  isSuggestionType: (v: unknown) => ["smart_link", "early_warning", "pattern_alert"].includes(v as string),
  isSuggestionOutcome: (v: unknown) => ["accepted", "dismissed", "escalated"].includes(v as string),
}));
vi.mock("@/lib/auth-guard", () => ({
  getRequestIdentity: vi.fn(async () => ({ userId: "staff1" })),
}));

import { recordSuggestionOutcome } from "@/lib/feedback/suggestion-outcome.service";
import { getRequestIdentity } from "@/lib/auth-guard";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/v1/suggestion-outcome", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/v1/suggestion-outcome", () => {
  it("records a valid outcome attributed to the user", async () => {
    const { POST } = await import("../route");
    const res = await POST(post({ suggestion_type: "smart_link", suggestion_ref: "lnk_1", outcome: "accepted" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, persisted: true, id: "so1" });
    expect(recordSuggestionOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ suggestion_type: "smart_link", suggestion_ref: "lnk_1", outcome: "accepted", user_id: "staff1" }),
    );
  });

  it("rejects a bad suggestion_type", async () => {
    const { POST } = await import("../route");
    const res = await POST(post({ suggestion_type: "nope", suggestion_ref: "x", outcome: "accepted" }));
    expect(res.status).toBe(400);
    expect(recordSuggestionOutcome).not.toHaveBeenCalled();
  });

  it("rejects a missing suggestion_ref or bad outcome", async () => {
    const { POST } = await import("../route");
    expect((await POST(post({ suggestion_type: "early_warning", outcome: "accepted" }))).status).toBe(400);
    expect((await POST(post({ suggestion_type: "early_warning", suggestion_ref: "x", outcome: "meh" }))).status).toBe(400);
    expect(recordSuggestionOutcome).not.toHaveBeenCalled();
  });

  it("records anonymously when the session is unresolved", async () => {
    vi.mocked(getRequestIdentity).mockResolvedValueOnce(NextResponse.json({ error: "no" }, { status: 403 }));
    const { POST } = await import("../route");
    const res = await POST(post({ suggestion_type: "pattern_alert", suggestion_ref: "pat_1", outcome: "escalated" }));
    expect(res.status).toBe(200);
    expect(recordSuggestionOutcome).toHaveBeenCalledWith(expect.objectContaining({ user_id: null, outcome: "escalated" }));
  });
});
