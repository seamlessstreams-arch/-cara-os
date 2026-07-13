import { describe, it, expect, vi } from "vitest";
import { mergeExtraction, parseAiFields, enhanceReferralExtraction } from "../enhance-extraction";
import type { ReferralExtraction, ExtractedReferralFields } from "../referral-extraction-engine";
import type { AiGatewayResult } from "@/lib/cara/ai-gateway";

const CORE = ["child_name", "date_of_birth", "referral_source", "local_authority", "referral_date", "presenting_needs", "risk_factors"] as const;

function det(fields: Partial<ExtractedReferralFields>): ReferralExtraction {
  const f: ExtractedReferralFields = {
    child_name: null, date_of_birth: null, gender: null, referral_source: null,
    referred_by: null, local_authority: null, referral_date: null,
    presenting_needs: [], risk_factors: [], estimated_placement_date: null, ...fields,
  };
  const present = (k: (typeof CORE)[number]) => (Array.isArray(f[k]) ? (f[k] as unknown[]).length > 0 : f[k] != null);
  const found = CORE.filter(present);
  return { fields: f, found: [...found], missing: CORE.filter((k) => !present(k)), confidence: found.length / 7, note: "n" };
}

const gw = (over: Partial<AiGatewayResult>): AiGatewayResult =>
  ({ output: "", method: "ai", llmUsed: true, identifiableDataSent: false, sensitivity: "operational", ...over }) as AiGatewayResult;

describe("mergeExtraction — deterministic always wins, AI fills non-PII gaps only", () => {
  it("null ai → unchanged", () => {
    const d = det({ child_name: "Alex" });
    expect(mergeExtraction(d, null).extraction).toBe(d);
  });

  it("a deterministic source is NOT overwritten by the AI", () => {
    const m = mergeExtraction(det({ referral_source: "local_authority" }), { referral_source: "agency" });
    expect(m.extraction.fields.referral_source).toBe("local_authority");
    expect(m.ai_filled).toEqual([]);
  });

  it("fills an empty source only with a VALID enum", () => {
    expect(mergeExtraction(det({}), { referral_source: "emergency" }).extraction.fields.referral_source).toBe("emergency");
    // invalid value is ignored
    const bad = mergeExtraction(det({}), { referral_source: "made_up" as never });
    expect(bad.extraction.fields.referral_source).toBeNull();
    expect(bad.ai_filled).toEqual([]);
  });

  it("fills empty needs/risks, cleaning bullets + de-duping; never touches PII fields", () => {
    const m = mergeExtraction(det({ child_name: null }), {
      presenting_needs: ["- Emotional support", "Emotional support", "Education"],
      risk_factors: ["Going missing"],
      child_name: "Should Be Ignored",
    } as never);
    expect(m.extraction.fields.presenting_needs).toEqual(["Emotional support", "Education"]);
    expect(m.extraction.fields.risk_factors).toEqual(["Going missing"]);
    expect(m.extraction.fields.child_name).toBeNull(); // PII never AI-filled
    expect(m.ai_filled.sort()).toEqual(["presenting_needs", "risk_factors"]);
  });

  it("does NOT append to a non-empty list", () => {
    const m = mergeExtraction(det({ presenting_needs: ["Existing"] }), { presenting_needs: ["New"] });
    expect(m.extraction.fields.presenting_needs).toEqual(["Existing"]);
  });

  it("recomputes confidence upward as gaps are filled", () => {
    const d = det({ child_name: "Alex", date_of_birth: "2011-01-01" }); // 2/7
    const m = mergeExtraction(d, { referral_source: "agency", presenting_needs: ["x"], risk_factors: ["y"] });
    expect(m.extraction.confidence).toBeGreaterThan(d.confidence);
  });
});

describe("parseAiFields", () => {
  it("parses plain and fenced JSON; returns null on garbage", () => {
    expect(parseAiFields('{"referral_source":"agency"}')?.referral_source).toBe("agency");
    expect(parseAiFields('```json\n{"referral_source":"emergency"}\n```')?.referral_source).toBe("emergency");
    expect(parseAiFields("not json")).toBeNull();
  });
});

describe("enhanceReferralExtraction — graceful by construction", () => {
  it("skips the model entirely when there are no fillable gaps", async () => {
    const d = det({ referral_source: "agency", presenting_needs: ["a"], risk_factors: ["b"] });
    const invoke = vi.fn();
    const r = await enhanceReferralExtraction(d, "text", { invoke });
    expect(invoke).not.toHaveBeenCalled();
    expect(r).toMatchObject({ ai_used: false, method: "skipped:complete" });
  });

  it("uses the model when it fills a gap", async () => {
    const d = det({ child_name: "Alex" });
    const invoke = vi.fn(async () => gw({ output: '{"referral_source":"emergency","risk_factors":["Going missing"]}' }));
    const r = await enhanceReferralExtraction(d, "referral text here", { invoke });
    expect(r.ai_used).toBe(true);
    expect(r.method).toBe("ai");
    expect(r.extraction.fields.referral_source).toBe("emergency");
    expect(r.ai_filled).toContain("referral_source");
  });

  it("falls back to deterministic when the model is not used (no credits)", async () => {
    const d = det({ child_name: "Alex" });
    const invoke = vi.fn(async () => gw({ llmUsed: false, method: "deterministic", output: "" }));
    const r = await enhanceReferralExtraction(d, "text", { invoke });
    expect(r.ai_used).toBe(false);
    expect(r.method).toBe("fallback:deterministic");
    expect(r.extraction).toBe(d);
  });

  it("falls back on refusal (safeguarding-sensitive)", async () => {
    const d = det({ child_name: "Alex" });
    const invoke = vi.fn(async () => gw({ llmUsed: false, method: "refused", refusedReason: "safeguarding_sensitive" }));
    const r = await enhanceReferralExtraction(d, "self-harm risk noted", { invoke });
    expect(r.method).toBe("fallback:refused");
    expect(r.ai_used).toBe(false);
  });

  it("falls back on a thrown error", async () => {
    const d = det({ child_name: "Alex" });
    const invoke = vi.fn(async () => { throw new Error("network"); });
    const r = await enhanceReferralExtraction(d, "text", { invoke });
    expect(r.method).toBe("fallback:error");
    expect(r.extraction).toBe(d);
  });

  it("malformed model output → no fields filled (ai_used false)", async () => {
    const d = det({ child_name: "Alex" });
    const invoke = vi.fn(async () => gw({ output: "sorry I cannot" }));
    const r = await enhanceReferralExtraction(d, "text", { invoke });
    expect(r.ai_used).toBe(false);
  });
});
