import { describe, it, expect } from "vitest";
import { assessEvidence, calculateOverallConfidence } from "../evidence.service";
import type { CaraStudioSource } from "@/types/cara-studio";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — EVIDENCE SERVICE TESTS
// ══════════════════════════════════════════════════════════════════════════════

function makeSource(overrides: Partial<CaraStudioSource> = {}): CaraStudioSource {
  return {
    id: "test-source-1",
    home_id: "home-1",
    child_id: null,
    staff_id: null,
    linked_record_id: null,
    linked_record_type: null,
    source_type: "daily_log",
    title: "Daily log entry",
    summary: null,
    content: "The young person had a good day. They said they felt happy.",
    extracted_text: null,
    source_date: new Date().toISOString(),
    category: null,
    tags: [],
    confidentiality_level: "standard",
    approval_status: "approved",
    is_sensitive: false,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
    ...overrides,
  };
}

describe("assessEvidence", () => {
  it("returns an assessment with all scoring dimensions", async () => {
    const source = makeSource();
    const result = await assessEvidence(source);
    expect(result).toBeDefined();
    expect(result).toHaveProperty("relevance_score");
    expect(result).toHaveProperty("recency_score");
    expect(result).toHaveProperty("reliability_score");
    expect(result).toHaveProperty("approval_score");
    expect(result).toHaveProperty("child_voice_score");
    expect(result).toHaveProperty("overall_confidence_score");
    expect(result).toHaveProperty("evidence_level");
  });

  it("scores recent sources higher than old sources", async () => {
    const recent = makeSource({ source_date: new Date().toISOString() });
    const old = makeSource({
      source_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const recentResult = await assessEvidence(recent);
    const oldResult = await assessEvidence(old);
    expect(recentResult.recency_score!).toBeGreaterThan(oldResult.recency_score!);
  });

  it("scores approved sources higher than unapproved", async () => {
    const approved = makeSource({ approval_status: "approved" });
    const draft = makeSource({ approval_status: "draft" });
    const approvedResult = await assessEvidence(approved);
    const draftResult = await assessEvidence(draft);
    expect(approvedResult.approval_score!).toBeGreaterThan(draftResult.approval_score!);
  });

  it("detects child voice in content", async () => {
    const withVoice = makeSource({
      content: 'The young person said "I want to go home". They expressed feeling sad.',
    });
    const withoutVoice = makeSource({
      content: "Staff completed routine checks. Nothing to report.",
    });
    const withResult = await assessEvidence(withVoice);
    const withoutResult = await assessEvidence(withoutVoice);
    expect(withResult.child_voice_score!).toBeGreaterThan(withoutResult.child_voice_score!);
  });

  it("scores incident records as more reliable than daily logs", async () => {
    const incident = makeSource({ source_type: "incident" });
    const dailyLog = makeSource({ source_type: "daily_log" });
    const incidentResult = await assessEvidence(incident);
    const dailyLogResult = await assessEvidence(dailyLog);
    expect(incidentResult.reliability_score!).toBeGreaterThan(dailyLogResult.reliability_score!);
  });
});

describe("calculateOverallConfidence", () => {
  it("returns high for all-high assessments", () => {
    const assessments = [
      { overall_confidence_score: 90 },
      { overall_confidence_score: 85 },
      { overall_confidence_score: 92 },
    ];
    const level = calculateOverallConfidence(assessments as any);
    expect(level).toBe("high");
  });

  it("returns low or unverified for low-scoring assessments", () => {
    const assessments = [
      { overall_confidence_score: 25 },
      { overall_confidence_score: 30 },
    ];
    const level = calculateOverallConfidence(assessments as any);
    // Score ~27.5 average — should be low or unverified
    expect(["low", "unverified"]).toContain(level);
  });

  it("returns missing for empty assessments", () => {
    const level = calculateOverallConfidence([]);
    expect(level).toBe("missing");
  });
});
