// ══════════════════════════════════════════════════════════════════════════════
// CARA — OVERSIGHT SERVICE TESTS
// Pure-function tests for Cara prompt generation and regulation reference
// constants. Covers all record types, edge cases, and prompt structure.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../oversight-service";

const { generateOversightPrompts, OVERSIGHT_REGULATION_REFS } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal OversightPromptContext with sensible defaults. */
function promptCtx(
  overrides: Partial<{
    recordType: string;
    recordSummary: string;
    childName: string | undefined;
    childAge: number | undefined;
    historicalContext: string | undefined;
    regulationRefs: string[] | undefined;
  }> = {},
) {
  return {
    recordType: overrides.recordType ?? "incident",
    recordSummary: "recordSummary" in overrides ? overrides.recordSummary : "A test record summary",
    childName: "childName" in overrides ? overrides.childName : "Alex",
    childAge: "childAge" in overrides ? overrides.childAge : 14,
    historicalContext: "historicalContext" in overrides ? overrides.historicalContext : undefined,
    regulationRefs: "regulationRefs" in overrides ? overrides.regulationRefs : undefined,
  } as Parameters<typeof generateOversightPrompts>[0];
}

// ── OVERSIGHT_REGULATION_REFS ─────────────────────────────────────────────

describe("OVERSIGHT_REGULATION_REFS", () => {
  it("has exactly 13 record type keys", () => {
    expect(Object.keys(OVERSIGHT_REGULATION_REFS)).toHaveLength(13);
  });

  it("contains all expected record type keys", () => {
    const keys = Object.keys(OVERSIGHT_REGULATION_REFS);
    expect(keys).toContain("incident");
    expect(keys).toContain("safeguarding");
    expect(keys).toContain("missing_episode");
    expect(keys).toContain("complaint");
    expect(keys).toContain("daily_log");
    expect(keys).toContain("medication_error");
    expect(keys).toContain("restraint");
    expect(keys).toContain("disclosure");
    expect(keys).toContain("risk_assessment");
    expect(keys).toContain("care_plan_review");
    expect(keys).toContain("supervision");
    expect(keys).toContain("key_work_session");
    expect(keys).toContain("contact_session");
  });

  it("each value is a non-empty array of strings", () => {
    for (const [, refs] of Object.entries(OVERSIGHT_REGULATION_REFS)) {
      expect(Array.isArray(refs)).toBe(true);
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) {
        expect(typeof ref).toBe("string");
        expect(ref.length).toBeGreaterThan(0);
      }
    }
  });

  it("all regulation refs follow CHR2015 or SCCIF or KCSIE prefix pattern", () => {
    const validPrefixes = ["CHR2015:", "SCCIF:", "KCSIE:"];
    for (const refs of Object.values(OVERSIGHT_REGULATION_REFS)) {
      for (const ref of refs) {
        const hasValidPrefix = validPrefixes.some((p) => ref.startsWith(p));
        expect(hasValidPrefix).toBe(true);
      }
    }
  });

  it("incident references include Reg7, Reg12, and SafeChildren", () => {
    const refs = OVERSIGHT_REGULATION_REFS.incident;
    expect(refs).toContain("CHR2015:Reg7");
    expect(refs).toContain("CHR2015:Reg12");
    expect(refs).toContain("SCCIF:SafeChildren");
  });

  it("safeguarding references include KCSIE:Part1", () => {
    const refs = OVERSIGHT_REGULATION_REFS.safeguarding;
    expect(refs).toContain("KCSIE:Part1");
    expect(refs).toContain("CHR2015:Reg7");
    expect(refs).toContain("SCCIF:SafeChildren");
  });

  it("supervision references include Reg8 and Leadership", () => {
    const refs = OVERSIGHT_REGULATION_REFS.supervision;
    expect(refs).toContain("CHR2015:Reg8");
    expect(refs).toContain("SCCIF:Leadership");
  });

  it("contact_session references include Reg13", () => {
    const refs = OVERSIGHT_REGULATION_REFS.contact_session;
    expect(refs).toContain("CHR2015:Reg13");
    expect(refs).toContain("SCCIF:OverallExperiences");
  });

  it("care_plan_review references include Reg5, Reg9, and OverallExperiences", () => {
    const refs = OVERSIGHT_REGULATION_REFS.care_plan_review;
    expect(refs).toContain("CHR2015:Reg5");
    expect(refs).toContain("CHR2015:Reg9");
    expect(refs).toContain("SCCIF:OverallExperiences");
  });

  it("restraint references include Reg12 and SafeChildren", () => {
    const refs = OVERSIGHT_REGULATION_REFS.restraint;
    expect(refs).toContain("CHR2015:Reg12");
    expect(refs).toContain("SCCIF:SafeChildren");
  });

  it("missing_episode references include Reg14", () => {
    const refs = OVERSIGHT_REGULATION_REFS.missing_episode;
    expect(refs).toContain("CHR2015:Reg14");
    expect(refs).toContain("CHR2015:Reg7");
    expect(refs).toContain("SCCIF:SafeChildren");
  });

  it("medication_error references include Reg10", () => {
    const refs = OVERSIGHT_REGULATION_REFS.medication_error;
    expect(refs).toContain("CHR2015:Reg10");
    expect(refs).toContain("SCCIF:SafeChildren");
  });
});

// ── generateOversightPrompts — structure ──────────────────────────────────

describe("generateOversightPrompts — structure", () => {
  it("returns an object with opening, dimensions, and closing", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result).toHaveProperty("opening");
    expect(result).toHaveProperty("dimensions");
    expect(result).toHaveProperty("closing");
    expect(typeof result.opening).toBe("string");
    expect(typeof result.closing).toBe("string");
    expect(Array.isArray(result.dimensions)).toBe(true);
  });

  it("returns exactly 5 quality dimensions", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.dimensions).toHaveLength(5);
  });

  it("each dimension has dimension, prompt, and guidance strings", () => {
    const result = generateOversightPrompts(promptCtx());
    for (const dim of result.dimensions) {
      expect(typeof dim.dimension).toBe("string");
      expect(typeof dim.prompt).toBe("string");
      expect(typeof dim.guidance).toBe("string");
      expect(dim.dimension.length).toBeGreaterThan(0);
      expect(dim.prompt.length).toBeGreaterThan(0);
      expect(dim.guidance.length).toBeGreaterThan(0);
    }
  });

  it("contains all 5 expected dimension names", () => {
    const result = generateOversightPrompts(promptCtx());
    const names = result.dimensions.map((d) => d.dimension);
    expect(names).toContain("Reflective Analysis");
    expect(names).toContain("Child Focus");
    expect(names).toContain("Professional Challenge");
    expect(names).toContain("Decision Clarity");
    expect(names).toContain("Action Specificity");
  });

  it("dimensions are returned in the correct order", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.dimensions[0].dimension).toBe("Reflective Analysis");
    expect(result.dimensions[1].dimension).toBe("Child Focus");
    expect(result.dimensions[2].dimension).toBe("Professional Challenge");
    expect(result.dimensions[3].dimension).toBe("Decision Clarity");
    expect(result.dimensions[4].dimension).toBe("Action Specificity");
  });
});

// ── generateOversightPrompts — record type labels ────────────────────────

describe("generateOversightPrompts — record type labels", () => {
  it("uses 'incident' label for incident type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "incident" }));
    expect(result.opening).toContain("a incident");
  });

  it("uses 'safeguarding concern' label for safeguarding type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "safeguarding" }));
    expect(result.opening).toContain("a safeguarding concern");
  });

  it("uses 'missing from care episode' label for missing_episode type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "missing_episode" }));
    expect(result.opening).toContain("a missing from care episode");
  });

  it("uses 'physical intervention / restraint' label for restraint type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "restraint" }));
    expect(result.opening).toContain("a physical intervention / restraint");
  });

  it("uses 'medication error' label for medication_error type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "medication_error" }));
    expect(result.opening).toContain("a medication error");
  });

  it("uses 'care plan review' label for care_plan_review type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "care_plan_review" }));
    expect(result.opening).toContain("a care plan review");
  });

  it("uses 'supervision session' label for supervision type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "supervision" }));
    expect(result.opening).toContain("a supervision session");
  });

  it("uses 'key work session' label for key_work_session type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "key_work_session" }));
    expect(result.opening).toContain("a key work session");
  });

  it("uses 'contact / family time session' label for contact_session type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "contact_session" }));
    expect(result.opening).toContain("a contact / family time session");
  });

  it("uses 'disclosure' label for disclosure type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "disclosure" }));
    expect(result.opening).toContain("a disclosure");
  });

  it("uses 'complaint' label for complaint type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "complaint" }));
    expect(result.opening).toContain("a complaint");
  });

  it("uses 'daily log entry' label for daily_log type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "daily_log" }));
    expect(result.opening).toContain("a daily log entry");
  });

  it("uses 'risk assessment' label for risk_assessment type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "risk_assessment" }));
    expect(result.opening).toContain("a risk assessment");
  });

  it("falls back to raw recordType for unknown type", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "unknown_custom_type" as never }));
    expect(result.opening).toContain("a unknown_custom_type");
  });
});

// ── generateOversightPrompts — child references ──────────────────────────

describe("generateOversightPrompts — child references", () => {
  it("uses childName and childAge when both are provided", () => {
    const result = generateOversightPrompts(promptCtx({ childName: "Sophie", childAge: 12 }));
    const prompts = result.dimensions.map((d) => d.prompt).join(" ");
    expect(prompts).toContain("Sophie (12)");
  });

  it("uses childName without age when childAge is undefined", () => {
    const result = generateOversightPrompts(promptCtx({ childName: "Jamie", childAge: undefined }));
    const prompts = result.dimensions.map((d) => d.prompt).join(" ");
    expect(prompts).toContain("Jamie");
    expect(prompts).not.toContain("Jamie (");
  });

  it("uses 'the young person' when childName is undefined", () => {
    const result = generateOversightPrompts(promptCtx({ childName: undefined, childAge: undefined }));
    const prompts = result.dimensions.map((d) => d.prompt).join(" ");
    expect(prompts).toContain("the young person");
  });

  it("uses 'the young person' when childName is not provided", () => {
    const ctx = {
      recordType: "incident" as const,
      recordSummary: "Summary",
    };
    const result = generateOversightPrompts(ctx);
    const prompts = result.dimensions.map((d) => d.prompt).join(" ");
    expect(prompts).toContain("the young person");
  });

  it("ignores childAge when childName is undefined", () => {
    const result = generateOversightPrompts(promptCtx({ childName: undefined, childAge: 10 }));
    const prompts = result.dimensions.map((d) => d.prompt).join(" ");
    expect(prompts).toContain("the young person");
    expect(prompts).not.toContain("10");
  });

  it("child reference appears in Reflective Analysis prompt", () => {
    const result = generateOversightPrompts(promptCtx({ childName: "Taylor", childAge: 15 }));
    expect(result.dimensions[0].prompt).toContain("Taylor (15)");
  });

  it("child reference appears in Child Focus prompt", () => {
    const result = generateOversightPrompts(promptCtx({ childName: "Taylor", childAge: 15 }));
    expect(result.dimensions[1].prompt).toContain("Taylor (15)");
  });

  it("record label appears in dimension prompts", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "restraint" }));
    const allPrompts = result.dimensions.map((d) => d.prompt).join(" ");
    expect(allPrompts).toContain("physical intervention / restraint");
  });
});

// ── generateOversightPrompts — regulation refs in closing ────────────────

describe("generateOversightPrompts — regulation refs in closing", () => {
  it("includes regulation refs in closing when provided", () => {
    const result = generateOversightPrompts(
      promptCtx({ regulationRefs: ["CHR2015:Reg7", "SCCIF:SafeChildren"] }),
    );
    expect(result.closing).toContain("Relevant regulations:");
    expect(result.closing).toContain("CHR2015:Reg7");
    expect(result.closing).toContain("SCCIF:SafeChildren");
  });

  it("does not include regulation section in closing when regulationRefs is undefined", () => {
    const result = generateOversightPrompts(promptCtx({ regulationRefs: undefined }));
    expect(result.closing).not.toContain("Relevant regulations:");
  });

  it("does not include regulation section in closing when regulationRefs is empty array", () => {
    const result = generateOversightPrompts(promptCtx({ regulationRefs: [] }));
    expect(result.closing).not.toContain("Relevant regulations:");
  });

  it("joins multiple regulation refs with commas", () => {
    const result = generateOversightPrompts(
      promptCtx({ regulationRefs: ["CHR2015:Reg5", "CHR2015:Reg9", "SCCIF:OverallExperiences"] }),
    );
    expect(result.closing).toContain("CHR2015:Reg5, CHR2015:Reg9, SCCIF:OverallExperiences");
  });

  it("handles a single regulation ref", () => {
    const result = generateOversightPrompts(
      promptCtx({ regulationRefs: ["CHR2015:Reg12"] }),
    );
    expect(result.closing).toContain("Relevant regulations: CHR2015:Reg12.");
  });

  it("closing always contains Ofsted reference", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.closing).toContain("Ofsted");
  });

  it("closing always contains regulatory requirement language", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.closing).toContain("regulatory requirement");
  });
});

// ── generateOversightPrompts — opening content ───────────────────────────

describe("generateOversightPrompts — opening content", () => {
  it("opening mentions management oversight", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.opening).toContain("management oversight");
  });

  it("opening mentions reflective analysis", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.opening).toContain("reflective analysis");
  });

  it("opening mentions professional curiosity", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.opening).toContain("professional curiosity");
  });

  it("opening includes the record type label", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "safeguarding" }));
    expect(result.opening).toContain("safeguarding concern");
  });
});

// ── generateOversightPrompts — dimension guidance content ────────────────

describe("generateOversightPrompts — dimension guidance", () => {
  it("Reflective Analysis guidance mentions professional curiosity", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.dimensions[0].guidance).toContain("professional curiosity");
  });

  it("Child Focus guidance mentions developmental stage", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.dimensions[1].guidance).toContain("developmental stage");
  });

  it("Professional Challenge guidance mentions practitioners", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.dimensions[2].guidance).toContain("practitioners");
  });

  it("Decision Clarity guidance mentions rationale", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.dimensions[3].guidance).toContain("rationale");
  });

  it("Action Specificity guidance mentions SMART", () => {
    const result = generateOversightPrompts(promptCtx());
    expect(result.dimensions[4].guidance).toContain("SMART");
  });

  it("Decision Clarity prompt uses the record type label", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "complaint" }));
    expect(result.dimensions[3].prompt).toContain("complaint");
  });

  it("Action Specificity prompt uses the record type label", () => {
    const result = generateOversightPrompts(promptCtx({ recordType: "medication_error" }));
    expect(result.dimensions[4].prompt).toContain("medication error");
  });
});
