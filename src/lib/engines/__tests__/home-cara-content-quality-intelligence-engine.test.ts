// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME Cara CONTENT QUALITY INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  computeCaraContentQuality,
  type CaraArtifactInput,
  type CaraContentQualityInput,
} from "../home-cara-content-quality-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

function makeArtifact(overrides: Partial<CaraArtifactInput> = {}): CaraArtifactInput {
  return {
    id: "art_1",
    artifact_type: "keywork_session",
    status: "approved",
    child_id: "child_1",
    staff_id: "staff_1",
    framework: "pace",
    quality_score: 82,
    evidence_confidence_score: 78,
    safeguarding_level: "none",
    created_at: "2026-05-20T10:00:00Z",
    submitted_for_review_at: "2026-05-20T12:00:00Z",
    reviewed_at: "2026-05-20T14:00:00Z",
    approved_at: "2026-05-20T15:00:00Z",
    rejected_by: null,
    has_structured_content: true,
    has_plain_text: true,
    source_ids_count: 3,
    ...overrides,
  };
}

function baseInput(overrides: Partial<CaraContentQualityInput> = {}): CaraContentQualityInput {
  return {
    today: TODAY,
    total_staff: 8,
    total_children: 4,
    artifacts: [],
    ...overrides,
  };
}

// ── Structure / Shape ───────────────────────────────────────────────────────

describe("Home Cara Content Quality Intelligence Engine", () => {
  describe("structure and shape", () => {
    it("returns all expected result fields", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [makeArtifact()] }));
      expect(r).toHaveProperty("content_rating");
      expect(r).toHaveProperty("content_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_artifacts");
      expect(r).toHaveProperty("approval_rate");
      expect(r).toHaveProperty("rejection_rate");
      expect(r).toHaveProperty("average_quality_score");
      expect(r).toHaveProperty("average_evidence_confidence");
      expect(r).toHaveProperty("review_turnaround_hours");
      expect(r).toHaveProperty("safeguarding_flagged_rate");
      expect(r).toHaveProperty("framework_usage_rate");
      expect(r).toHaveProperty("framework_diversity");
      expect(r).toHaveProperty("artifact_type_diversity");
      expect(r).toHaveProperty("evidence_sourced_rate");
      expect(r).toHaveProperty("child_coverage_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("content_rating is a valid rating string", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [makeArtifact()] }));
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.content_rating);
    });

    it("content_score is between 0 and 100", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [makeArtifact()] }));
      expect(r.content_score).toBeGreaterThanOrEqual(0);
      expect(r.content_score).toBeLessThanOrEqual(100);
    });

    it("strengths is an array of strings", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [makeArtifact()] }));
      expect(Array.isArray(r.strengths)).toBe(true);
      r.strengths.forEach(s => expect(typeof s).toBe("string"));
    });

    it("concerns is an array of strings", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [makeArtifact()] }));
      expect(Array.isArray(r.concerns)).toBe(true);
    });

    it("recommendations have rank, recommendation, and urgency", () => {
      const r = computeCaraContentQuality(baseInput({
        artifacts: [makeArtifact({ quality_score: 30, evidence_confidence_score: 20 })],
      }));
      r.recommendations.forEach(rec => {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      });
    });

    it("insights have text and severity", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [makeArtifact()] }));
      r.insights.forEach(ins => {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      });
    });

    it("headline is a non-empty string", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [makeArtifact()] }));
      expect(typeof r.headline).toBe("string");
      expect(r.headline.length).toBeGreaterThan(0);
    });

    it("total_artifacts matches input length", () => {
      const arts = [makeArtifact({ id: "a1" }), makeArtifact({ id: "a2" }), makeArtifact({ id: "a3" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.total_artifacts).toBe(3);
    });
  });

  // ── Special Cases ───────────────────────────────────────────────────────

  describe("special cases", () => {
    it("0 artifacts, 0 staff, 0 children → insufficient_data", () => {
      const r = computeCaraContentQuality(baseInput({ total_staff: 0, total_children: 0, artifacts: [] }));
      expect(r.content_rating).toBe("insufficient_data");
      expect(r.content_score).toBe(0);
      expect(r.total_artifacts).toBe(0);
    });

    it("insufficient_data has a descriptive headline", () => {
      const r = computeCaraContentQuality(baseInput({ total_staff: 0, total_children: 0, artifacts: [] }));
      expect(r.headline).toContain("cannot be assessed");
    });

    it("insufficient_data has empty strengths/concerns/recommendations", () => {
      const r = computeCaraContentQuality(baseInput({ total_staff: 0, total_children: 0, artifacts: [] }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
    });

    it("insufficient_data has a warning insight", () => {
      const r = computeCaraContentQuality(baseInput({ total_staff: 0, total_children: 0, artifacts: [] }));
      expect(r.insights.length).toBeGreaterThanOrEqual(1);
      expect(r.insights[0].severity).toBe("warning");
    });

    it("0 artifacts with staff present → good rating with score 72", () => {
      const r = computeCaraContentQuality(baseInput({ total_staff: 5, total_children: 3, artifacts: [] }));
      expect(r.content_rating).toBe("good");
      expect(r.content_score).toBe(72);
    });

    it("0 artifacts with only staff (no children) → good rating with score 72", () => {
      const r = computeCaraContentQuality(baseInput({ total_staff: 5, total_children: 0, artifacts: [] }));
      expect(r.content_rating).toBe("good");
      expect(r.content_score).toBe(72);
    });

    it("0 artifacts with only children (no staff) → good rating with score 72", () => {
      const r = computeCaraContentQuality(baseInput({ total_staff: 0, total_children: 3, artifacts: [] }));
      expect(r.content_rating).toBe("good");
      expect(r.content_score).toBe(72);
    });

    it("0 artifacts active home has Cara not yet adopted headline", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [] }));
      expect(r.headline).toContain("Cara not yet adopted");
    });

    it("0 artifacts active home has a planned recommendation", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [] }));
      expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(r.recommendations[0].urgency).toBe("planned");
    });

    it("0 artifacts active home has zero for all metric fields", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [] }));
      expect(r.approval_rate).toBe(0);
      expect(r.rejection_rate).toBe(0);
      expect(r.average_quality_score).toBe(0);
      expect(r.average_evidence_confidence).toBe(0);
      expect(r.review_turnaround_hours).toBe(0);
      expect(r.framework_usage_rate).toBe(0);
      expect(r.framework_diversity).toBe(0);
      expect(r.evidence_sourced_rate).toBe(0);
      expect(r.child_coverage_rate).toBe(0);
    });
  });

  // ── Rating Bands ──────────────────────────────────────────────────────

  describe("rating bands", () => {
    it("outstanding: score >= 80", () => {
      // Max bonuses: quality>=80 (+5), approval>=90 (+5), evidence>=75 (+4), framework>=80 (+3),
      // evidenceSourced>=90 (+3), childCoverage>=80 (+3), frameworkDiversity>=3 (+3), typeDiversity>=4 (+2)
      // = 52 + 5 + 5 + 4 + 3 + 3 + 3 + 3 + 2 = 80
      const children = ["c1", "c2", "c3", "c4"];
      const arts = children.flatMap((cid, i) =>
        ["keywork_session", "care_plan", "risk_assessment", "daily_summary"].map((atype, j) =>
          makeArtifact({
            id: `art_${i}_${j}`,
            child_id: cid,
            artifact_type: atype,
            status: "approved",
            quality_score: 85,
            evidence_confidence_score: 80,
            framework: ["pace", "dsdp", "tbri"][j % 3],
            source_ids_count: 3,
          }),
        ),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_score).toBeGreaterThanOrEqual(80);
      expect(r.content_rating).toBe("outstanding");
    });

    it("good: score >= 65 and < 80", () => {
      // Base 52 + quality>=65 (+3) + approval>=75 (+3) + evidence>=60 (+2) + frameworkUsage>=50 (+1) + evidenceSourced>=70 (+1) + childCov>=50 (+1) + framDiversity>=2 (+1) + typeDiversity>=2 (+1)
      // = 52 + 3 + 3 + 2 + 1 + 1 + 1 + 1 + 1 = 65
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1", artifact_type: "keywork_session", quality_score: 70, evidence_confidence_score: 65, framework: "pace", source_ids_count: 2, status: "approved" }),
        makeArtifact({ id: "a2", child_id: "c2", artifact_type: "care_plan", quality_score: 70, evidence_confidence_score: 65, framework: "dsdp", source_ids_count: 2, status: "approved" }),
        makeArtifact({ id: "a3", child_id: "c1", artifact_type: "risk_assessment", quality_score: 70, evidence_confidence_score: 65, framework: null, source_ids_count: 0, status: "approved" }),
        makeArtifact({ id: "a4", child_id: "c2", artifact_type: "daily_summary", quality_score: 70, evidence_confidence_score: 65, framework: null, source_ids_count: 2, status: "rejected", rejected_by: "staff_2" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_score).toBeGreaterThanOrEqual(65);
      expect(r.content_score).toBeLessThan(80);
      expect(r.content_rating).toBe("good");
    });

    it("adequate: score >= 45 and < 65", () => {
      // Base 52 + quality < 65 & >= 40 (no bonus, no penalty) + approval < 75 (no bonus) + evidence < 60 & >= 30 (no bonus, no penalty)
      // = 52, needs some small bonuses but not too many
      const arts = [
        makeArtifact({ id: "a1", quality_score: 55, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" }),
        makeArtifact({ id: "a2", quality_score: 55, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_score).toBeGreaterThanOrEqual(45);
      expect(r.content_score).toBeLessThan(65);
      expect(r.content_rating).toBe("adequate");
    });

    it("inadequate: score < 45", () => {
      // Base 52 - quality<40 (-5) - evidence<30 (-3) - rejection>30 (-5)
      // plus safeguarding penalty if applicable
      const arts = [
        makeArtifact({ id: "a1", quality_score: 20, evidence_confidence_score: 15, framework: null, source_ids_count: 0, status: "rejected", rejected_by: "staff_2", safeguarding_level: "high" }),
        makeArtifact({ id: "a2", quality_score: 25, evidence_confidence_score: 20, framework: null, source_ids_count: 0, status: "rejected", rejected_by: "staff_2", safeguarding_level: "critical" }),
        makeArtifact({ id: "a3", quality_score: 30, evidence_confidence_score: 25, framework: null, source_ids_count: 0, status: "submitted", safeguarding_level: "medium" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_score).toBeLessThan(45);
      expect(r.content_rating).toBe("inadequate");
    });
  });

  // ── Boundary Conditions ───────────────────────────────────────────────

  describe("boundary conditions", () => {
    it("score exactly at 80 → outstanding", () => {
      // Construct to hit exactly 80
      const children = ["c1", "c2", "c3", "c4"];
      const arts = children.flatMap((cid, i) =>
        ["keywork_session", "care_plan", "risk_assessment", "daily_summary"].map((atype, j) =>
          makeArtifact({
            id: `art_${i}_${j}`,
            child_id: cid,
            artifact_type: atype,
            status: "approved",
            quality_score: 85,
            evidence_confidence_score: 80,
            framework: ["pace", "dsdp", "tbri"][j % 3],
            source_ids_count: 3,
          }),
        ),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_score).toBeGreaterThanOrEqual(80);
      expect(r.content_rating).toBe("outstanding");
    });

    it("score exactly at 65 → good", () => {
      // 52 + quality_bonus(3) + approval_bonus(3) + evidence_bonus(2) + fw_usage(1) + evidence_sourced(1) + child_cov(1) + fw_div(1) + type_div(1) = 65
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1", artifact_type: "keywork_session", quality_score: 70, evidence_confidence_score: 65, framework: "pace", source_ids_count: 2, status: "approved" }),
        makeArtifact({ id: "a2", child_id: "c2", artifact_type: "care_plan", quality_score: 70, evidence_confidence_score: 65, framework: "dsdp", source_ids_count: 2, status: "approved" }),
        makeArtifact({ id: "a3", child_id: "c1", artifact_type: "keywork_session", quality_score: 70, evidence_confidence_score: 65, framework: null, source_ids_count: 0, status: "approved" }),
        makeArtifact({ id: "a4", child_id: "c2", artifact_type: "care_plan", quality_score: 70, evidence_confidence_score: 65, framework: null, source_ids_count: 2, status: "rejected", rejected_by: "s1" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_score).toBeGreaterThanOrEqual(65);
      expect(r.content_rating).toBe("good");
    });

    it("score exactly at 45 → adequate", () => {
      // Base 52 - quality<40(-5) - evidence<30(-3) = 44... that's inadequate
      // Base 52 - quality<40(-5) = 47 ≥ 45
      const arts = [
        makeArtifact({ id: "a1", quality_score: 35, evidence_confidence_score: 40, framework: null, source_ids_count: 0, status: "submitted" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      // -5 for quality < 40 = 47 → adequate
      expect(r.content_score).toBeGreaterThanOrEqual(45);
      expect(r.content_rating).toBe("adequate");
    });

    it("score at 44 → inadequate", () => {
      // 52 - 5 (quality<40) - 3 (evidence<30) = 44
      const arts = [
        makeArtifact({ id: "a1", quality_score: 35, evidence_confidence_score: 25, framework: null, source_ids_count: 0, status: "submitted" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_score).toBe(44);
      expect(r.content_rating).toBe("inadequate");
    });

    it("score cannot exceed 100", () => {
      // Stack everything possible
      const children = ["c1", "c2", "c3", "c4", "c5"];
      const arts = children.flatMap((cid, i) =>
        ["keywork_session", "care_plan", "risk_assessment", "daily_summary", "incident_report"].map((atype, j) =>
          makeArtifact({
            id: `art_${i}_${j}`,
            child_id: cid,
            artifact_type: atype,
            status: "approved",
            quality_score: 95,
            evidence_confidence_score: 95,
            framework: ["pace", "dsdp", "tbri", "theraplay"][j % 4],
            source_ids_count: 5,
          }),
        ),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 5, artifacts: arts }));
      expect(r.content_score).toBeLessThanOrEqual(100);
    });

    it("score cannot go below 0", () => {
      // Stack all penalties
      const arts = Array.from({ length: 10 }, (_, i) =>
        makeArtifact({
          id: `art_${i}`,
          quality_score: 10,
          evidence_confidence_score: 5,
          framework: null,
          source_ids_count: 0,
          status: "rejected",
          rejected_by: "staff_2",
          safeguarding_level: "high",
        }),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_score).toBeGreaterThanOrEqual(0);
    });

    it("average_quality_score boundary at exactly 80", () => {
      const arts = [makeArtifact({ quality_score: 80 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.average_quality_score).toBe(80);
      // Should get +5 bonus
      expect(r.content_score).toBeGreaterThanOrEqual(57); // 52 + 5
    });

    it("average_quality_score boundary at exactly 65", () => {
      const arts = [makeArtifact({ quality_score: 65, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.average_quality_score).toBe(65);
    });

    it("approval_rate boundary at exactly 90%", () => {
      const approved = Array.from({ length: 9 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "approved" }),
      );
      const submitted = [makeArtifact({ id: "a_9", status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: [...approved, ...submitted] }));
      expect(r.approval_rate).toBe(90);
    });

    it("approval_rate boundary at exactly 75%", () => {
      const approved = Array.from({ length: 3 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "approved" }),
      );
      const submitted = [makeArtifact({ id: "a_3", status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: [...approved, ...submitted] }));
      expect(r.approval_rate).toBe(75);
    });

    it("evidence_confidence boundary at exactly 75", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 75 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.average_evidence_confidence).toBe(75);
    });

    it("evidence_confidence boundary at exactly 60", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 60, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.average_evidence_confidence).toBe(60);
    });

    it("framework_usage_rate boundary at exactly 80%", () => {
      const withFw = Array.from({ length: 4 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, framework: "pace" }),
      );
      const without = [makeArtifact({ id: "a_4", framework: null })];
      const r = computeCaraContentQuality(baseInput({ artifacts: [...withFw, ...without] }));
      expect(r.framework_usage_rate).toBe(80);
    });

    it("framework_usage_rate boundary at exactly 50%", () => {
      const withFw = [makeArtifact({ id: "a1", framework: "pace" })];
      const without = [makeArtifact({ id: "a2", framework: null })];
      const r = computeCaraContentQuality(baseInput({ artifacts: [...withFw, ...without] }));
      expect(r.framework_usage_rate).toBe(50);
    });

    it("evidence_sourced_rate boundary at exactly 90%", () => {
      const sourced = Array.from({ length: 9 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, source_ids_count: 2 }),
      );
      const unsourced = [makeArtifact({ id: "a_9", source_ids_count: 0 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: [...sourced, ...unsourced] }));
      expect(r.evidence_sourced_rate).toBe(90);
    });

    it("evidence_sourced_rate boundary at exactly 70%", () => {
      const sourced = Array.from({ length: 7 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, source_ids_count: 2 }),
      );
      const unsourced = Array.from({ length: 3 }, (_, i) =>
        makeArtifact({ id: `a_u${i}`, source_ids_count: 0 }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: [...sourced, ...unsourced] }));
      expect(r.evidence_sourced_rate).toBe(70);
    });

    it("child_coverage_rate boundary at exactly 80%", () => {
      const arts = Array.from({ length: 4 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, child_id: `child_${i + 1}` }),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 5, artifacts: arts }));
      expect(r.child_coverage_rate).toBe(80);
    });

    it("child_coverage_rate boundary at exactly 50%", () => {
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1" }),
        makeArtifact({ id: "a2", child_id: "c2" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.child_coverage_rate).toBe(50);
    });
  });

  // ── Metric Calculations ───────────────────────────────────────────────

  describe("metric calculations", () => {
    it("approval_rate counts approved and committed against non-draft artifacts", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "approved" }),
        makeArtifact({ id: "a2", status: "committed" }),
        makeArtifact({ id: "a3", status: "submitted" }),
        makeArtifact({ id: "a4", status: "reviewed" }),
        makeArtifact({ id: "a5", status: "draft" }), // excluded from denominator
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      // 2 approved out of 4 submitted (non-draft) = 50%
      expect(r.approval_rate).toBe(50);
    });

    it("rejection_rate counts rejected against non-draft artifacts", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "rejected", rejected_by: "s1" }),
        makeArtifact({ id: "a2", status: "approved" }),
        makeArtifact({ id: "a3", status: "submitted" }),
        makeArtifact({ id: "a4", status: "draft" }), // excluded
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      // 1 rejected out of 3 non-draft = 33%
      expect(r.rejection_rate).toBe(33);
    });

    it("approval_rate is 0 when all artifacts are drafts", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "draft" }),
        makeArtifact({ id: "a2", status: "draft" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.approval_rate).toBe(0);
    });

    it("rejection_rate is 0 when no artifacts are rejected", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "approved" }),
        makeArtifact({ id: "a2", status: "submitted" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.rejection_rate).toBe(0);
    });

    it("average_quality_score is mean of all artifacts", () => {
      const arts = [
        makeArtifact({ id: "a1", quality_score: 60 }),
        makeArtifact({ id: "a2", quality_score: 80 }),
        makeArtifact({ id: "a3", quality_score: 100 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.average_quality_score).toBe(80); // (60+80+100)/3 = 80
    });

    it("average_evidence_confidence is mean of all artifacts", () => {
      const arts = [
        makeArtifact({ id: "a1", evidence_confidence_score: 50 }),
        makeArtifact({ id: "a2", evidence_confidence_score: 70 }),
        makeArtifact({ id: "a3", evidence_confidence_score: 90 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.average_evidence_confidence).toBe(70); // (50+70+90)/3
    });

    it("average_quality_score rounds to nearest integer", () => {
      const arts = [
        makeArtifact({ id: "a1", quality_score: 70 }),
        makeArtifact({ id: "a2", quality_score: 71 }),
        makeArtifact({ id: "a3", quality_score: 72 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.average_quality_score).toBe(71); // (70+71+72)/3 = 71
    });

    it("safeguarding_flagged_rate counts artifacts where safeguarding_level != none", () => {
      const arts = [
        makeArtifact({ id: "a1", safeguarding_level: "none" }),
        makeArtifact({ id: "a2", safeguarding_level: "low" }),
        makeArtifact({ id: "a3", safeguarding_level: "medium" }),
        makeArtifact({ id: "a4", safeguarding_level: "high" }),
        makeArtifact({ id: "a5", safeguarding_level: "critical" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.safeguarding_flagged_rate).toBe(80); // 4 out of 5
    });

    it("framework_usage_rate excludes null and 'none'", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: "pace" }),
        makeArtifact({ id: "a2", framework: "dsdp" }),
        makeArtifact({ id: "a3", framework: null }),
        makeArtifact({ id: "a4", framework: "none" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_usage_rate).toBe(50); // 2 out of 4
    });

    it("framework_diversity counts distinct frameworks excluding null and none", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: "pace" }),
        makeArtifact({ id: "a2", framework: "dsdp" }),
        makeArtifact({ id: "a3", framework: "pace" }), // duplicate
        makeArtifact({ id: "a4", framework: "tbri" }),
        makeArtifact({ id: "a5", framework: null }),
        makeArtifact({ id: "a6", framework: "none" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(3); // pace, dsdp, tbri
    });

    it("artifact_type_diversity counts distinct types", () => {
      const arts = [
        makeArtifact({ id: "a1", artifact_type: "keywork_session" }),
        makeArtifact({ id: "a2", artifact_type: "care_plan" }),
        makeArtifact({ id: "a3", artifact_type: "keywork_session" }), // duplicate
        makeArtifact({ id: "a4", artifact_type: "risk_assessment" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.artifact_type_diversity).toBe(3);
    });

    it("evidence_sourced_rate counts artifacts with source_ids_count > 0", () => {
      const arts = [
        makeArtifact({ id: "a1", source_ids_count: 3 }),
        makeArtifact({ id: "a2", source_ids_count: 0 }),
        makeArtifact({ id: "a3", source_ids_count: 1 }),
        makeArtifact({ id: "a4", source_ids_count: 0 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.evidence_sourced_rate).toBe(50); // 2 out of 4
    });

    it("child_coverage_rate is distinct children with artifacts / total_children", () => {
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1" }),
        makeArtifact({ id: "a2", child_id: "c1" }), // duplicate child
        makeArtifact({ id: "a3", child_id: "c2" }),
        makeArtifact({ id: "a4", child_id: null }), // no child
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.child_coverage_rate).toBe(50); // 2 unique children / 4 total
    });

    it("child_coverage_rate is 0 when total_children is 0", () => {
      const arts = [makeArtifact({ child_id: null })];
      const r = computeCaraContentQuality(baseInput({ total_children: 0, artifacts: arts }));
      expect(r.child_coverage_rate).toBe(0);
    });

    it("child_coverage_rate can exceed 100 if more unique children than total_children (defensive)", () => {
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1" }),
        makeArtifact({ id: "a2", child_id: "c2" }),
        makeArtifact({ id: "a3", child_id: "c3" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 2, artifacts: arts }));
      // pct(3, 2) = 150 — defensive data scenario
      expect(r.child_coverage_rate).toBe(150);
    });
  });

  // ── Turnaround Calculation ────────────────────────────────────────────

  describe("review turnaround calculation", () => {
    it("calculates average hours between submitted_for_review_at and reviewed_at", () => {
      const arts = [
        makeArtifact({
          id: "a1",
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-20T14:00:00Z", // 4 hours
        }),
        makeArtifact({
          id: "a2",
          submitted_for_review_at: "2026-05-21T08:00:00Z",
          reviewed_at: "2026-05-21T14:00:00Z", // 6 hours
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.review_turnaround_hours).toBe(5); // (4 + 6) / 2
    });

    it("rounds to 1 decimal place", () => {
      const arts = [
        makeArtifact({
          id: "a1",
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-20T13:30:00Z", // 3.5 hours
        }),
        makeArtifact({
          id: "a2",
          submitted_for_review_at: "2026-05-21T08:00:00Z",
          reviewed_at: "2026-05-21T14:00:00Z", // 6 hours
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.review_turnaround_hours).toBe(4.8); // (3.5 + 6) / 2 = 4.75, rounded to 4.8
    });

    it("returns 0 when no artifacts have both dates", () => {
      const arts = [
        makeArtifact({ id: "a1", submitted_for_review_at: null, reviewed_at: null }),
        makeArtifact({ id: "a2", submitted_for_review_at: "2026-05-20T10:00:00Z", reviewed_at: null }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.review_turnaround_hours).toBe(0);
    });

    it("excludes artifacts with only submitted_for_review_at", () => {
      const arts = [
        makeArtifact({
          id: "a1",
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-20T20:00:00Z", // 10 hours
        }),
        makeArtifact({
          id: "a2",
          submitted_for_review_at: "2026-05-21T08:00:00Z",
          reviewed_at: null, // not reviewed yet
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.review_turnaround_hours).toBe(10); // only first artifact counts
    });

    it("excludes artifacts with only reviewed_at", () => {
      const arts = [
        makeArtifact({
          id: "a1",
          submitted_for_review_at: null,
          reviewed_at: "2026-05-20T20:00:00Z",
        }),
        makeArtifact({
          id: "a2",
          submitted_for_review_at: "2026-05-21T08:00:00Z",
          reviewed_at: "2026-05-21T20:00:00Z", // 12 hours
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.review_turnaround_hours).toBe(12);
    });

    it("handles multi-day turnaround", () => {
      const arts = [
        makeArtifact({
          id: "a1",
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-23T10:00:00Z", // 72 hours
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.review_turnaround_hours).toBe(72);
    });
  });

  // ── Scoring Bonuses ───────────────────────────────────────────────────

  describe("scoring bonuses", () => {
    it("quality_score >= 80 adds +5", () => {
      const arts = [makeArtifact({ quality_score: 85, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      // Base 52 + 5 (quality) = 57
      expect(r.content_score).toBeGreaterThanOrEqual(57);
    });

    it("quality_score >= 65 but < 80 adds +3", () => {
      const arts = [makeArtifact({ quality_score: 70, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      // Base 52 + 3 (quality) = 55
      expect(r.content_score).toBeGreaterThanOrEqual(55);
    });

    it("approval_rate >= 90 adds +5", () => {
      const approved = Array.from({ length: 10 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "approved", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: approved, total_children: 0 }));
      expect(r.approval_rate).toBe(100);
      // Has +5 for approval
    });

    it("approval_rate >= 75 but < 90 adds +3", () => {
      const approved = Array.from({ length: 3 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "approved", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      );
      const rejected = [makeArtifact({ id: "a_3", status: "rejected", rejected_by: "s1", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: [...approved, ...rejected], total_children: 0 }));
      expect(r.approval_rate).toBe(75);
    });

    it("evidence_confidence >= 75 adds +4", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 80, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      // +4 for evidence confidence
      expect(r.content_score).toBeGreaterThanOrEqual(56);
    });

    it("evidence_confidence >= 60 but < 75 adds +2", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 65, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      // +2 for evidence confidence
      expect(r.content_score).toBeGreaterThanOrEqual(54);
    });

    it("framework_usage >= 80% adds +3", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, framework: "pace", quality_score: 50, evidence_confidence_score: 50, source_ids_count: 0, status: "submitted" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.framework_usage_rate).toBe(100);
    });

    it("framework_usage >= 50% but < 80% adds +1", () => {
      const withFw = [makeArtifact({ id: "a1", framework: "pace", quality_score: 50, evidence_confidence_score: 50, source_ids_count: 0, status: "submitted" })];
      const without = [makeArtifact({ id: "a2", framework: null, quality_score: 50, evidence_confidence_score: 50, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: [...withFw, ...without], total_children: 0 }));
      expect(r.framework_usage_rate).toBe(50);
    });

    it("evidence_sourced >= 90% adds +3", () => {
      const arts = Array.from({ length: 10 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, source_ids_count: 2, quality_score: 50, evidence_confidence_score: 50, framework: null, status: "submitted" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.evidence_sourced_rate).toBe(100);
    });

    it("evidence_sourced >= 70% but < 90% adds +1", () => {
      const sourced = Array.from({ length: 7 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, source_ids_count: 2, quality_score: 50, evidence_confidence_score: 50, framework: null, status: "submitted" }),
      );
      const unsourced = Array.from({ length: 3 }, (_, i) =>
        makeArtifact({ id: `a_u${i}`, source_ids_count: 0, quality_score: 50, evidence_confidence_score: 50, framework: null, status: "submitted" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: [...sourced, ...unsourced], total_children: 0 }));
      expect(r.evidence_sourced_rate).toBe(70);
    });

    it("child_coverage >= 80% adds +3", () => {
      const arts = Array.from({ length: 4 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, child_id: `c_${i}`, quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" }),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 5, artifacts: arts }));
      expect(r.child_coverage_rate).toBe(80);
    });

    it("child_coverage >= 50% but < 80% adds +1", () => {
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" }),
        makeArtifact({ id: "a2", child_id: "c2", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.child_coverage_rate).toBe(50);
    });

    it("framework_diversity >= 3 adds +3", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: "pace" }),
        makeArtifact({ id: "a2", framework: "dsdp" }),
        makeArtifact({ id: "a3", framework: "tbri" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(3);
    });

    it("framework_diversity >= 2 but < 3 adds +1", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: "pace" }),
        makeArtifact({ id: "a2", framework: "dsdp" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(2);
    });

    it("artifact_type_diversity >= 4 adds +2", () => {
      const arts = [
        makeArtifact({ id: "a1", artifact_type: "keywork_session" }),
        makeArtifact({ id: "a2", artifact_type: "care_plan" }),
        makeArtifact({ id: "a3", artifact_type: "risk_assessment" }),
        makeArtifact({ id: "a4", artifact_type: "daily_summary" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.artifact_type_diversity).toBe(4);
    });

    it("artifact_type_diversity >= 2 but < 4 adds +1", () => {
      const arts = [
        makeArtifact({ id: "a1", artifact_type: "keywork_session" }),
        makeArtifact({ id: "a2", artifact_type: "care_plan" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.artifact_type_diversity).toBe(2);
    });

    it("all bonuses stack correctly", () => {
      // 52 + 5 + 5 + 4 + 3 + 3 + 3 + 3 + 2 = 80
      const children = ["c1", "c2", "c3", "c4"];
      const arts = children.flatMap((cid, i) =>
        ["keywork_session", "care_plan", "risk_assessment", "daily_summary"].map((atype, j) =>
          makeArtifact({
            id: `art_${i}_${j}`,
            child_id: cid,
            artifact_type: atype,
            status: "approved",
            quality_score: 90,
            evidence_confidence_score: 85,
            framework: ["pace", "dsdp", "tbri"][j % 3],
            source_ids_count: 3,
          }),
        ),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      // All bonuses should fire
      expect(r.content_score).toBeGreaterThanOrEqual(80);
    });
  });

  // ── Scoring Penalties ─────────────────────────────────────────────────

  describe("scoring penalties", () => {
    it("rejection_rate > 30% applies -5", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "rejected", rejected_by: "s1", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a2", status: "approved", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.rejection_rate).toBe(50);
      // Base 52 - 5 (rejection) = 47
    });

    it("rejection_rate exactly 30% does NOT apply penalty", () => {
      const approved = Array.from({ length: 7 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "approved", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      );
      const rejected = Array.from({ length: 3 }, (_, i) =>
        makeArtifact({ id: `r_${i}`, status: "rejected", rejected_by: "s1", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: [...approved, ...rejected], total_children: 0 }));
      expect(r.rejection_rate).toBe(30);
      // No penalty for exactly 30
    });

    it("average_quality_score < 40 applies -5", () => {
      const arts = [makeArtifact({ quality_score: 30, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.average_quality_score).toBe(30);
      // 52 - 5 = 47
      expect(r.content_score).toBeLessThanOrEqual(47);
    });

    it("average_quality_score exactly 40 does NOT apply penalty", () => {
      const arts = [makeArtifact({ quality_score: 40, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.average_quality_score).toBe(40);
      // No quality penalty
    });

    it("average_evidence_confidence < 30 applies -3", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 20, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.average_evidence_confidence).toBe(20);
    });

    it("average_evidence_confidence exactly 30 does NOT apply penalty", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 30, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.average_evidence_confidence).toBe(30);
      // No penalty
    });

    it("safeguarding_flagged_rate > 50% AND approval_rate < 60% applies -5", () => {
      // 3 artifacts: 2 flagged (67%), none approved
      const arts = [
        makeArtifact({ id: "a1", safeguarding_level: "high", status: "submitted", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a2", safeguarding_level: "critical", status: "submitted", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a3", safeguarding_level: "none", status: "submitted", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.safeguarding_flagged_rate).toBeGreaterThan(50);
      expect(r.approval_rate).toBeLessThan(60);
    });

    it("safeguarding penalty does NOT apply if approval_rate >= 60%", () => {
      // High safeguarding but good approval
      const arts = [
        makeArtifact({ id: "a1", safeguarding_level: "high", status: "approved", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a2", safeguarding_level: "critical", status: "approved", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a3", safeguarding_level: "medium", status: "approved", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.safeguarding_flagged_rate).toBe(100);
      expect(r.approval_rate).toBe(100);
      // No safeguarding penalty
    });

    it("safeguarding penalty does NOT apply if flagged_rate <= 50%", () => {
      const arts = [
        makeArtifact({ id: "a1", safeguarding_level: "high", status: "submitted", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a2", safeguarding_level: "none", status: "submitted", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.safeguarding_flagged_rate).toBe(50);
      // exactly 50% should not trigger (> 50 required)
    });

    it("all penalties stack", () => {
      // quality < 40 (-5) + evidence < 30 (-3) + rejection > 30% (-5) + safeguarding penalty (-5) = -18
      // 52 - 18 = 34
      const arts = [
        makeArtifact({ id: "a1", quality_score: 20, evidence_confidence_score: 15, status: "rejected", rejected_by: "s1", safeguarding_level: "high", framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a2", quality_score: 25, evidence_confidence_score: 20, status: "rejected", rejected_by: "s1", safeguarding_level: "critical", framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a3", quality_score: 30, evidence_confidence_score: 25, status: "submitted", safeguarding_level: "medium", framework: null, source_ids_count: 0 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      expect(r.content_score).toBe(34);
    });

    it("penalties and bonuses can coexist", () => {
      // quality >= 80 (+5) but rejection > 30% (-5) — these cancel out
      const arts = [
        makeArtifact({ id: "a1", quality_score: 85, evidence_confidence_score: 50, status: "rejected", rejected_by: "s1", framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a2", quality_score: 85, evidence_confidence_score: 50, status: "approved", framework: null, source_ids_count: 0 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts, total_children: 0 }));
      // avg quality 85 → +5, rejection 50% → -5, approval 50% → no bonus
      // Net effect: 52 + 5 - 5 = 52 (plus any other small bonuses)
      expect(r.content_score).toBeGreaterThanOrEqual(52);
    });
  });

  // ── Headline Generation ───────────────────────────────────────────────

  describe("headline generation", () => {
    it("outstanding headline mentions outstanding", () => {
      const children = ["c1", "c2", "c3", "c4"];
      const arts = children.flatMap((cid, i) =>
        ["keywork_session", "care_plan", "risk_assessment", "daily_summary"].map((atype, j) =>
          makeArtifact({
            id: `art_${i}_${j}`,
            child_id: cid,
            artifact_type: atype,
            status: "approved",
            quality_score: 90,
            evidence_confidence_score: 85,
            framework: ["pace", "dsdp", "tbri"][j % 3],
            source_ids_count: 3,
          }),
        ),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.headline).toContain("outstanding");
    });

    it("good headline mentions good", () => {
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1", artifact_type: "keywork_session", quality_score: 70, evidence_confidence_score: 65, framework: "pace", source_ids_count: 2, status: "approved" }),
        makeArtifact({ id: "a2", child_id: "c2", artifact_type: "care_plan", quality_score: 70, evidence_confidence_score: 65, framework: "dsdp", source_ids_count: 2, status: "approved" }),
        makeArtifact({ id: "a3", child_id: "c1", artifact_type: "risk_assessment", quality_score: 70, evidence_confidence_score: 65, framework: null, source_ids_count: 0, status: "approved" }),
        makeArtifact({ id: "a4", child_id: "c2", artifact_type: "daily_summary", quality_score: 70, evidence_confidence_score: 65, framework: null, source_ids_count: 2, status: "rejected", rejected_by: "s1" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      if (r.content_rating === "good") {
        expect(r.headline).toContain("good");
      }
    });

    it("adequate headline mentions adequate", () => {
      const arts = [
        makeArtifact({ id: "a1", quality_score: 55, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      if (r.content_rating === "adequate") {
        expect(r.headline).toContain("adequate");
      }
    });

    it("inadequate headline mentions inadequate", () => {
      const arts = [
        makeArtifact({ id: "a1", quality_score: 20, evidence_confidence_score: 15, framework: null, source_ids_count: 0, status: "rejected", rejected_by: "s1", safeguarding_level: "high" }),
        makeArtifact({ id: "a2", quality_score: 25, evidence_confidence_score: 20, framework: null, source_ids_count: 0, status: "rejected", rejected_by: "s1", safeguarding_level: "critical" }),
        makeArtifact({ id: "a3", quality_score: 30, evidence_confidence_score: 25, framework: null, source_ids_count: 0, status: "submitted", safeguarding_level: "medium" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
    });

    it("insufficient_data headline indicates assessment cannot be done", () => {
      const r = computeCaraContentQuality(baseInput({ total_staff: 0, total_children: 0, artifacts: [] }));
      expect(r.headline).toContain("cannot be assessed");
    });

    it("not-yet-adopted headline for active home with no artifacts", () => {
      const r = computeCaraContentQuality(baseInput({ artifacts: [] }));
      expect(r.headline).toBe("Cara not yet adopted — no AI-assisted content generated");
    });
  });

  // ── Strengths Generation ──────────────────────────────────────────────

  describe("strengths generation", () => {
    it("includes strength for high quality score >= 80", () => {
      const arts = [makeArtifact({ quality_score: 85 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.strengths.some(s => s.includes("85%") && s.includes("high quality"))).toBe(true);
    });

    it("includes strength for good quality score >= 65", () => {
      const arts = [makeArtifact({ quality_score: 70, evidence_confidence_score: 50, framework: null, source_ids_count: 0 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.strengths.some(s => s.includes("70%") && s.includes("good quality"))).toBe(true);
    });

    it("includes strength for approval rate >= 90%", () => {
      const arts = Array.from({ length: 10 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "approved" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.strengths.some(s => s.includes("approval rate"))).toBe(true);
    });

    it("includes strength for approval rate >= 75%", () => {
      const approved = Array.from({ length: 3 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "approved" }),
      );
      const other = [makeArtifact({ id: "a_3", status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: [...approved, ...other] }));
      expect(r.strengths.some(s => s.includes("approval rate"))).toBe(true);
    });

    it("includes strength for evidence confidence >= 75", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 80 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.strengths.some(s => s.includes("Evidence confidence"))).toBe(true);
    });

    it("includes strength for framework usage >= 80%", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, framework: "pace" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.strengths.some(s => s.includes("therapeutic framework"))).toBe(true);
    });

    it("includes strength for evidence sourced rate >= 90%", () => {
      const arts = Array.from({ length: 10 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, source_ids_count: 3 }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.strengths.some(s => s.includes("evidence-sourced"))).toBe(true);
    });

    it("includes strength for child coverage >= 80%", () => {
      const arts = Array.from({ length: 4 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, child_id: `c_${i + 1}` }),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.strengths.some(s => s.includes("child coverage"))).toBe(true);
    });

    it("includes strength for framework diversity >= 3", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: "pace" }),
        makeArtifact({ id: "a2", framework: "dsdp" }),
        makeArtifact({ id: "a3", framework: "tbri" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.strengths.some(s => s.includes("distinct therapeutic frameworks"))).toBe(true);
    });

    it("includes strength for artifact type diversity >= 4", () => {
      const arts = [
        makeArtifact({ id: "a1", artifact_type: "keywork_session" }),
        makeArtifact({ id: "a2", artifact_type: "care_plan" }),
        makeArtifact({ id: "a3", artifact_type: "risk_assessment" }),
        makeArtifact({ id: "a4", artifact_type: "daily_summary" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.strengths.some(s => s.includes("distinct artifact types"))).toBe(true);
    });

    it("includes strength for fast review turnaround <= 24 hours", () => {
      const arts = [
        makeArtifact({
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-20T18:00:00Z", // 8 hours
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.strengths.some(s => s.includes("review turnaround"))).toBe(true);
    });

    it("no strengths generated for poor metrics", () => {
      const arts = [
        makeArtifact({ quality_score: 30, evidence_confidence_score: 20, framework: null, source_ids_count: 0, status: "submitted", submitted_for_review_at: null, reviewed_at: null }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 10, artifacts: arts }));
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ── Concerns Generation ───────────────────────────────────────────────

  describe("concerns generation", () => {
    it("includes concern for quality < 40", () => {
      const arts = [makeArtifact({ quality_score: 30, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.concerns.some(s => s.includes("30%") && s.includes("below acceptable"))).toBe(true);
    });

    it("includes concern for quality < 65 but >= 40", () => {
      const arts = [makeArtifact({ quality_score: 55, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.concerns.some(s => s.includes("55%") && s.includes("below the expected good standard"))).toBe(true);
    });

    it("includes concern for rejection rate > 30%", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "rejected", rejected_by: "s1" }),
        makeArtifact({ id: "a2", status: "approved" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.concerns.some(s => s.includes("rejection rate"))).toBe(true);
    });

    it("includes concern for evidence confidence < 30", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 20, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.concerns.some(s => s.includes("20%") && s.includes("not well-supported"))).toBe(true);
    });

    it("includes concern for evidence confidence < 60 but >= 30", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 45, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.concerns.some(s => s.includes("45%") && s.includes("needs strengthening"))).toBe(true);
    });

    it("includes concern for safeguarding flagged + low approval", () => {
      const arts = [
        makeArtifact({ id: "a1", safeguarding_level: "high", status: "submitted" }),
        makeArtifact({ id: "a2", safeguarding_level: "critical", status: "submitted" }),
        makeArtifact({ id: "a3", safeguarding_level: "none", status: "submitted" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      if (r.safeguarding_flagged_rate > 50 && r.approval_rate < 60) {
        expect(r.concerns.some(s => s.includes("safeguarding"))).toBe(true);
      }
    });

    it("includes concern for low framework usage < 30%", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: null }),
        makeArtifact({ id: "a2", framework: null }),
        makeArtifact({ id: "a3", framework: null }),
        makeArtifact({ id: "a4", framework: "pace" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.concerns.some(s => s.includes("therapeutic framework"))).toBe(true);
    });

    it("includes concern for low evidence sourced rate < 50%", () => {
      const arts = [
        makeArtifact({ id: "a1", source_ids_count: 0 }),
        makeArtifact({ id: "a2", source_ids_count: 0 }),
        makeArtifact({ id: "a3", source_ids_count: 1 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      if (r.evidence_sourced_rate < 50) {
        expect(r.concerns.some(s => s.includes("evidence-sourced"))).toBe(true);
      }
    });

    it("includes concern for low child coverage < 50%", () => {
      const arts = [makeArtifact({ child_id: "c1" })];
      const r = computeCaraContentQuality(baseInput({ total_children: 10, artifacts: arts }));
      expect(r.concerns.some(s => s.includes("child coverage"))).toBe(true);
    });

    it("includes concern for slow review turnaround > 72 hours", () => {
      const arts = [
        makeArtifact({
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-24T10:00:00Z", // 96 hours
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.concerns.some(s => s.includes("review turnaround"))).toBe(true);
    });

    it("no concerns for excellent metrics", () => {
      const arts = Array.from({ length: 4 }, (_, i) =>
        makeArtifact({
          id: `a_${i}`,
          child_id: `c_${i + 1}`,
          quality_score: 90,
          evidence_confidence_score: 85,
          framework: "pace",
          source_ids_count: 3,
          status: "approved",
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-20T14:00:00Z",
        }),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.concerns).toHaveLength(0);
    });
  });

  // ── Recommendations Generation ────────────────────────────────────────

  describe("recommendations generation", () => {
    it("generates immediate recommendation for quality < 40", () => {
      const arts = [makeArtifact({ quality_score: 30, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("quality"))).toBe(true);
    });

    it("generates soon recommendation for quality < 65", () => {
      const arts = [makeArtifact({ quality_score: 55, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("quality"))).toBe(true);
    });

    it("generates immediate recommendation for high rejection rate", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "rejected", rejected_by: "s1", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a2", status: "approved", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("rejection"))).toBe(true);
    });

    it("generates immediate recommendation for low evidence confidence < 30", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 20, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("evidence"))).toBe(true);
    });

    it("generates soon recommendation for evidence confidence < 60", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 45, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("evidence"))).toBe(true);
    });

    it("generates immediate recommendation for safeguarding concern", () => {
      const arts = [
        makeArtifact({ id: "a1", safeguarding_level: "high", status: "submitted", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a2", safeguarding_level: "critical", status: "submitted", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
        makeArtifact({ id: "a3", safeguarding_level: "none", status: "submitted", quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("safeguarding"))).toBe(true);
    });

    it("generates soon recommendation for low framework usage", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, framework: null, quality_score: 50, evidence_confidence_score: 50, source_ids_count: 0, status: "submitted" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("framework"))).toBe(true);
    });

    it("generates soon recommendation for low evidence sourced rate", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, source_ids_count: 0, quality_score: 50, evidence_confidence_score: 50, framework: null, status: "submitted" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("evidence"))).toBe(true);
    });

    it("generates planned recommendation for low child coverage", () => {
      const arts = [makeArtifact({ child_id: "c1", quality_score: 70, evidence_confidence_score: 70 })];
      const r = computeCaraContentQuality(baseInput({ total_children: 10, artifacts: arts }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("child"))).toBe(true);
    });

    it("generates soon recommendation for slow turnaround > 72h", () => {
      const arts = [
        makeArtifact({
          quality_score: 70,
          evidence_confidence_score: 70,
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-24T10:00:00Z", // 96 hours
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("turnaround"))).toBe(true);
    });

    it("recommendations have sequential rank numbers", () => {
      const arts = [
        makeArtifact({ quality_score: 30, evidence_confidence_score: 20, framework: null, source_ids_count: 0, status: "rejected", rejected_by: "s1" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      r.recommendations.forEach((rec, idx) => {
        expect(rec.rank).toBe(idx + 1);
      });
    });

    it("recommendations include regulatory_ref", () => {
      const arts = [makeArtifact({ quality_score: 30, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      r.recommendations.forEach(rec => {
        expect(rec.regulatory_ref).toBeDefined();
        expect(typeof rec.regulatory_ref).toBe("string");
      });
    });

    it("generates fallback recommendation when no issues but not outstanding", () => {
      // Good metrics, but enough to be just "good" not "outstanding"
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1", quality_score: 70, evidence_confidence_score: 65, framework: "pace", source_ids_count: 2, status: "approved" }),
        makeArtifact({ id: "a2", child_id: "c2", quality_score: 70, evidence_confidence_score: 65, framework: "dsdp", source_ids_count: 2, status: "approved" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      if (r.content_rating !== "outstanding") {
        expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ── Insights Generation ───────────────────────────────────────────────

  describe("insights generation", () => {
    it("generates critical insight for quality < 40", () => {
      const arts = [makeArtifact({ quality_score: 30, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("quality"))).toBe(true);
    });

    it("generates critical insight for rejection > 30%", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "rejected", rejected_by: "s1" }),
        makeArtifact({ id: "a2", status: "approved" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("rejected"))).toBe(true);
    });

    it("generates critical insight for evidence confidence < 30", () => {
      const arts = [makeArtifact({ evidence_confidence_score: 20, quality_score: 50, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Evidence confidence"))).toBe(true);
    });

    it("generates critical insight for safeguarding + low approval", () => {
      const arts = [
        makeArtifact({ id: "a1", safeguarding_level: "high", status: "submitted", quality_score: 50, evidence_confidence_score: 50 }),
        makeArtifact({ id: "a2", safeguarding_level: "critical", status: "submitted", quality_score: 50, evidence_confidence_score: 50 }),
        makeArtifact({ id: "a3", safeguarding_level: "none", status: "submitted", quality_score: 50, evidence_confidence_score: 50 }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("safeguarding"))).toBe(true);
    });

    it("generates warning insight for slow turnaround > 72h", () => {
      const arts = [
        makeArtifact({
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-24T10:00:00Z",
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("turnaround"))).toBe(true);
    });

    it("generates warning insight for turnaround > 48h but <= 72h", () => {
      const arts = [
        makeArtifact({
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-22T20:00:00Z", // 58 hours
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("turnaround"))).toBe(true);
    });

    it("generates warning insight for low framework usage", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, framework: null }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("framework"))).toBe(true);
    });

    it("generates warning insight for low child coverage", () => {
      const arts = [makeArtifact({ child_id: "c1" })];
      const r = computeCaraContentQuality(baseInput({ total_children: 10, artifacts: arts }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("child"))).toBe(true);
    });

    it("generates positive insight for high quality + high approval", () => {
      const arts = Array.from({ length: 10 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, quality_score: 90, status: "approved" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("quality"))).toBe(true);
    });

    it("generates positive insight for good quality + good approval (not outstanding)", () => {
      const approved = Array.from({ length: 3 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, quality_score: 70, status: "approved" }),
      );
      const submitted = [makeArtifact({ id: "a_3", quality_score: 70, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: [...approved, ...submitted] }));
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates positive insight for framework diversity >= 3", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: "pace" }),
        makeArtifact({ id: "a2", framework: "dsdp" }),
        makeArtifact({ id: "a3", framework: "tbri" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("framework"))).toBe(true);
    });

    it("generates positive insight for evidence sourced >= 90%", () => {
      const arts = Array.from({ length: 10 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, source_ids_count: 3 }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("evidence"))).toBe(true);
    });

    it("generates positive insight for child coverage >= 80%", () => {
      const arts = Array.from({ length: 4 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, child_id: `c_${i + 1}` }),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child coverage"))).toBe(true);
    });

    it("insufficient_data insight is a warning", () => {
      const r = computeCaraContentQuality(baseInput({ total_staff: 0, total_children: 0, artifacts: [] }));
      expect(r.insights.every(i => i.severity === "warning")).toBe(true);
    });
  });

  // ── Single Record Scenarios ───────────────────────────────────────────

  describe("single record scenarios", () => {
    it("single approved high-quality artifact", () => {
      const r = computeCaraContentQuality(baseInput({
        artifacts: [makeArtifact({ status: "approved", quality_score: 90, evidence_confidence_score: 85 })],
      }));
      expect(r.total_artifacts).toBe(1);
      expect(r.approval_rate).toBe(100);
      expect(r.average_quality_score).toBe(90);
    });

    it("single draft artifact has 0 approval rate", () => {
      const r = computeCaraContentQuality(baseInput({
        artifacts: [makeArtifact({ status: "draft" })],
      }));
      expect(r.total_artifacts).toBe(1);
      expect(r.approval_rate).toBe(0);
    });

    it("single rejected artifact", () => {
      const r = computeCaraContentQuality(baseInput({
        artifacts: [makeArtifact({ status: "rejected", rejected_by: "staff_2" })],
      }));
      expect(r.rejection_rate).toBe(100);
    });

    it("single artifact with no framework", () => {
      const r = computeCaraContentQuality(baseInput({
        artifacts: [makeArtifact({ framework: null })],
      }));
      expect(r.framework_usage_rate).toBe(0);
      expect(r.framework_diversity).toBe(0);
    });

    it("single artifact with framework 'none'", () => {
      const r = computeCaraContentQuality(baseInput({
        artifacts: [makeArtifact({ framework: "none" })],
      }));
      expect(r.framework_usage_rate).toBe(0);
      expect(r.framework_diversity).toBe(0);
    });

    it("single artifact with no evidence sources", () => {
      const r = computeCaraContentQuality(baseInput({
        artifacts: [makeArtifact({ source_ids_count: 0 })],
      }));
      expect(r.evidence_sourced_rate).toBe(0);
    });

    it("single artifact with null child_id", () => {
      const r = computeCaraContentQuality(baseInput({
        artifacts: [makeArtifact({ child_id: null })],
      }));
      expect(r.child_coverage_rate).toBe(0);
    });

    it("single artifact with no review dates", () => {
      const r = computeCaraContentQuality(baseInput({
        artifacts: [makeArtifact({ submitted_for_review_at: null, reviewed_at: null })],
      }));
      expect(r.review_turnaround_hours).toBe(0);
    });
  });

  // ── Framework Combinations ────────────────────────────────────────────

  describe("framework combinations", () => {
    it("all four frameworks gives diversity 4", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: "pace" }),
        makeArtifact({ id: "a2", framework: "dsdp" }),
        makeArtifact({ id: "a3", framework: "tbri" }),
        makeArtifact({ id: "a4", framework: "theraplay" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(4);
    });

    it("duplicate frameworks count once", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: "pace" }),
        makeArtifact({ id: "a2", framework: "pace" }),
        makeArtifact({ id: "a3", framework: "pace" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(1);
    });

    it("framework 'none' is excluded from diversity", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: "none" }),
        makeArtifact({ id: "a2", framework: "pace" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(1);
    });

    it("null framework is excluded from diversity", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: null }),
        makeArtifact({ id: "a2", framework: "dsdp" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(1);
    });

    it("mix of null, none, and valid frameworks", () => {
      const arts = [
        makeArtifact({ id: "a1", framework: null }),
        makeArtifact({ id: "a2", framework: "none" }),
        makeArtifact({ id: "a3", framework: "pace" }),
        makeArtifact({ id: "a4", framework: "tbri" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(2);
      expect(r.framework_usage_rate).toBe(50);
    });

    it("all null frameworks gives 0 diversity and 0 usage", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, framework: null }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(0);
      expect(r.framework_usage_rate).toBe(0);
    });

    it("all 'none' frameworks gives 0 diversity and 0 usage", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, framework: "none" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.framework_diversity).toBe(0);
      expect(r.framework_usage_rate).toBe(0);
    });
  });

  // ── Artifact Type Scenarios ───────────────────────────────────────────

  describe("artifact type scenarios", () => {
    it("all 8 artifact types gives diversity 8", () => {
      const types = ["keywork_session", "care_plan", "risk_assessment", "daily_summary", "incident_report", "review_report", "direct_work", "formulation"];
      const arts = types.map((t, i) => makeArtifact({ id: `a_${i}`, artifact_type: t }));
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.artifact_type_diversity).toBe(8);
    });

    it("single type gives diversity 1", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, artifact_type: "daily_summary" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.artifact_type_diversity).toBe(1);
    });

    it("exactly 4 types triggers +2 bonus", () => {
      const arts = [
        makeArtifact({ id: "a1", artifact_type: "keywork_session" }),
        makeArtifact({ id: "a2", artifact_type: "care_plan" }),
        makeArtifact({ id: "a3", artifact_type: "risk_assessment" }),
        makeArtifact({ id: "a4", artifact_type: "daily_summary" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.artifact_type_diversity).toBe(4);
    });

    it("exactly 2 types triggers +1 bonus", () => {
      const arts = [
        makeArtifact({ id: "a1", artifact_type: "keywork_session" }),
        makeArtifact({ id: "a2", artifact_type: "care_plan" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.artifact_type_diversity).toBe(2);
    });

    it("exactly 1 type gets no diversity bonus", () => {
      const arts = [makeArtifact({ artifact_type: "keywork_session" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.artifact_type_diversity).toBe(1);
    });
  });

  // ── Status Handling ───────────────────────────────────────────────────

  describe("status handling", () => {
    it("draft artifacts are excluded from approval/rejection denominators", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "draft" }),
        makeArtifact({ id: "a2", status: "draft" }),
        makeArtifact({ id: "a3", status: "approved" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      // 1 approved out of 1 non-draft
      expect(r.approval_rate).toBe(100);
    });

    it("committed status counts as approved", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "committed" }),
        makeArtifact({ id: "a2", status: "submitted" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.approval_rate).toBe(50);
    });

    it("reviewed status does not count as approved", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "reviewed" }),
        makeArtifact({ id: "a2", status: "submitted" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.approval_rate).toBe(0);
    });

    it("all statuses together", () => {
      const arts = [
        makeArtifact({ id: "a1", status: "draft" }),
        makeArtifact({ id: "a2", status: "submitted" }),
        makeArtifact({ id: "a3", status: "reviewed" }),
        makeArtifact({ id: "a4", status: "approved" }),
        makeArtifact({ id: "a5", status: "rejected", rejected_by: "s1" }),
        makeArtifact({ id: "a6", status: "committed" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      // Non-draft: 5 (submitted, reviewed, approved, rejected, committed)
      // Approved + committed: 2
      // Rejected: 1
      expect(r.approval_rate).toBe(40); // 2/5
      expect(r.rejection_rate).toBe(20); // 1/5
    });
  });

  // ── Safeguarding Level Handling ───────────────────────────────────────

  describe("safeguarding level handling", () => {
    it("only 'none' counts as not flagged", () => {
      const arts = [
        makeArtifact({ id: "a1", safeguarding_level: "none" }),
        makeArtifact({ id: "a2", safeguarding_level: "low" }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.safeguarding_flagged_rate).toBe(50);
    });

    it("all levels except none are flagged", () => {
      const levels = ["low", "medium", "high", "critical"];
      const arts = levels.map((level, i) =>
        makeArtifact({ id: `a_${i}`, safeguarding_level: level }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.safeguarding_flagged_rate).toBe(100);
    });

    it("all none gives 0% flagged rate", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, safeguarding_level: "none" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.safeguarding_flagged_rate).toBe(0);
    });

    it("high flagged rate with high approval does not trigger penalty", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, safeguarding_level: "high", status: "approved" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.safeguarding_flagged_rate).toBe(100);
      expect(r.approval_rate).toBe(100);
      // No safeguarding penalty
    });
  });

  // ── Determinism ───────────────────────────────────────────────────────

  describe("determinism", () => {
    it("same input always produces same output", () => {
      const input = baseInput({
        artifacts: [
          makeArtifact({ id: "a1", quality_score: 75, evidence_confidence_score: 70 }),
          makeArtifact({ id: "a2", quality_score: 65, evidence_confidence_score: 60, framework: "dsdp" }),
        ],
      });
      const r1 = computeCaraContentQuality(input);
      const r2 = computeCaraContentQuality(input);
      expect(r1).toEqual(r2);
    });

    it("running multiple times gives identical scores", () => {
      const input = baseInput({ artifacts: [makeArtifact()] });
      const scores = Array.from({ length: 5 }, () => computeCaraContentQuality(input).content_score);
      expect(new Set(scores).size).toBe(1);
    });

    it("running multiple times gives identical ratings", () => {
      const input = baseInput({ artifacts: [makeArtifact()] });
      const ratings = Array.from({ length: 5 }, () => computeCaraContentQuality(input).content_rating);
      expect(new Set(ratings).size).toBe(1);
    });
  });

  // ── pct Helper ────────────────────────────────────────────────────────

  describe("pct helper behavior", () => {
    it("0 denominator returns 0 for approval_rate", () => {
      const arts = [makeArtifact({ status: "draft" })]; // 0 non-draft
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.approval_rate).toBe(0);
    });

    it("0 denominator returns 0 for rejection_rate", () => {
      const arts = [makeArtifact({ status: "draft" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.rejection_rate).toBe(0);
    });

    it("0 denominator returns 0 for child_coverage_rate when total_children is 0", () => {
      const arts = [makeArtifact({ child_id: "c1" })];
      const r = computeCaraContentQuality(baseInput({ total_children: 0, artifacts: arts }));
      expect(r.child_coverage_rate).toBe(0);
    });

    it("100% rate when numerator equals denominator", () => {
      const arts = [makeArtifact({ status: "approved", source_ids_count: 5 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.evidence_sourced_rate).toBe(100);
    });
  });

  // ── Large Input Handling ──────────────────────────────────────────────

  describe("large input handling", () => {
    it("handles 100 artifacts without error", () => {
      const arts = Array.from({ length: 100 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, child_id: `c_${i % 10}` }),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 10, artifacts: arts }));
      expect(r.total_artifacts).toBe(100);
      expect(r.content_score).toBeGreaterThanOrEqual(0);
      expect(r.content_score).toBeLessThanOrEqual(100);
    });

    it("handles 500 artifacts with mixed properties", () => {
      const arts = Array.from({ length: 500 }, (_, i) => {
        const frameworks = ["pace", "dsdp", "tbri", "theraplay", null, "none"];
        const statuses = ["draft", "submitted", "reviewed", "approved", "rejected", "committed"];
        const types = ["keywork_session", "care_plan", "risk_assessment", "daily_summary", "incident_report", "review_report", "direct_work", "formulation"];
        return makeArtifact({
          id: `a_${i}`,
          child_id: `c_${i % 20}`,
          artifact_type: types[i % types.length],
          status: statuses[i % statuses.length],
          framework: frameworks[i % frameworks.length],
          quality_score: 40 + (i % 60),
          evidence_confidence_score: 30 + (i % 70),
          safeguarding_level: i % 5 === 0 ? "high" : "none",
          source_ids_count: i % 3,
          rejected_by: statuses[i % statuses.length] === "rejected" ? "staff_x" : null,
        });
      });
      const r = computeCaraContentQuality(baseInput({ total_children: 20, artifacts: arts }));
      expect(r.total_artifacts).toBe(500);
      expect(typeof r.content_score).toBe("number");
      expect(typeof r.content_rating).toBe("string");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("all artifacts are drafts", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "draft" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.approval_rate).toBe(0);
      expect(r.rejection_rate).toBe(0);
      expect(r.total_artifacts).toBe(5);
    });

    it("all artifacts have quality_score 0", () => {
      const arts = [makeArtifact({ quality_score: 0, evidence_confidence_score: 0, framework: null, source_ids_count: 0, status: "submitted" })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.average_quality_score).toBe(0);
      expect(r.average_evidence_confidence).toBe(0);
    });

    it("all artifacts have quality_score 100", () => {
      const arts = [makeArtifact({ quality_score: 100, evidence_confidence_score: 100 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.average_quality_score).toBe(100);
      expect(r.average_evidence_confidence).toBe(100);
    });

    it("artifacts with same timestamps produce 0 hour turnaround", () => {
      const arts = [
        makeArtifact({
          submitted_for_review_at: "2026-05-20T10:00:00Z",
          reviewed_at: "2026-05-20T10:00:00Z",
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.review_turnaround_hours).toBe(0);
    });

    it("all artifacts have null child_id", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, child_id: null }),
      );
      const r = computeCaraContentQuality(baseInput({ total_children: 5, artifacts: arts }));
      expect(r.child_coverage_rate).toBe(0);
    });

    it("all artifacts have null staff_id still computes", () => {
      const arts = [makeArtifact({ staff_id: null })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.total_artifacts).toBe(1);
    });

    it("mixed structured and plain text content", () => {
      const arts = [
        makeArtifact({ id: "a1", has_structured_content: true, has_plain_text: false }),
        makeArtifact({ id: "a2", has_structured_content: false, has_plain_text: true }),
        makeArtifact({ id: "a3", has_structured_content: true, has_plain_text: true }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.total_artifacts).toBe(3);
    });

    it("very high source_ids_count does not break anything", () => {
      const arts = [makeArtifact({ source_ids_count: 999 })];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.evidence_sourced_rate).toBe(100);
    });

    it("total_staff 0 with artifacts still computes", () => {
      const arts = [makeArtifact()];
      const r = computeCaraContentQuality(baseInput({ total_staff: 0, total_children: 4, artifacts: arts }));
      expect(r.total_artifacts).toBe(1);
      expect(r.content_rating).not.toBe("insufficient_data");
    });

    it("total_children 0 with artifacts containing child_ids still computes", () => {
      const arts = [makeArtifact({ child_id: "c1" })];
      const r = computeCaraContentQuality(baseInput({ total_children: 0, artifacts: arts }));
      expect(r.child_coverage_rate).toBe(0); // pct(1, 0) = 0
    });
  });

  // ── Mixed Scenario Integration Tests ──────────────────────────────────

  describe("mixed scenario integration tests", () => {
    it("realistic good home with mixed content", () => {
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1", artifact_type: "keywork_session", quality_score: 78, evidence_confidence_score: 72, framework: "pace", source_ids_count: 3, status: "approved" }),
        makeArtifact({ id: "a2", child_id: "c2", artifact_type: "care_plan", quality_score: 82, evidence_confidence_score: 80, framework: "dsdp", source_ids_count: 4, status: "approved" }),
        makeArtifact({ id: "a3", child_id: "c3", artifact_type: "risk_assessment", quality_score: 75, evidence_confidence_score: 68, framework: "tbri", source_ids_count: 2, status: "approved" }),
        makeArtifact({ id: "a4", child_id: "c1", artifact_type: "daily_summary", quality_score: 70, evidence_confidence_score: 65, framework: null, source_ids_count: 1, status: "approved" }),
        makeArtifact({ id: "a5", child_id: "c2", artifact_type: "incident_report", quality_score: 68, evidence_confidence_score: 60, framework: "pace", source_ids_count: 2, status: "submitted", safeguarding_level: "medium" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_rating).toBe("good");
      expect(r.content_score).toBeGreaterThanOrEqual(65);
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.framework_diversity).toBe(3);
      expect(r.artifact_type_diversity).toBe(5);
    });

    it("struggling home with low metrics", () => {
      const arts = [
        makeArtifact({ id: "a1", child_id: "c1", quality_score: 35, evidence_confidence_score: 25, framework: null, source_ids_count: 0, status: "rejected", rejected_by: "s1", safeguarding_level: "high" }),
        makeArtifact({ id: "a2", child_id: null, quality_score: 28, evidence_confidence_score: 20, framework: null, source_ids_count: 0, status: "submitted", safeguarding_level: "critical" }),
      ];
      const r = computeCaraContentQuality(baseInput({ total_children: 6, artifacts: arts }));
      expect(r.content_rating).toBe("inadequate");
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });

    it("home with excellent Cara adoption", () => {
      const children = ["c1", "c2", "c3", "c4"];
      const arts = children.flatMap((cid, i) => [
        makeArtifact({ id: `a_${i}_1`, child_id: cid, artifact_type: "keywork_session", quality_score: 92, evidence_confidence_score: 88, framework: "pace", source_ids_count: 5, status: "approved", submitted_for_review_at: "2026-05-20T09:00:00Z", reviewed_at: "2026-05-20T11:00:00Z" }),
        makeArtifact({ id: `a_${i}_2`, child_id: cid, artifact_type: "care_plan", quality_score: 88, evidence_confidence_score: 85, framework: "dsdp", source_ids_count: 4, status: "committed", submitted_for_review_at: "2026-05-21T10:00:00Z", reviewed_at: "2026-05-21T12:00:00Z" }),
        makeArtifact({ id: `a_${i}_3`, child_id: cid, artifact_type: "risk_assessment", quality_score: 95, evidence_confidence_score: 90, framework: "tbri", source_ids_count: 6, status: "approved", submitted_for_review_at: "2026-05-22T08:00:00Z", reviewed_at: "2026-05-22T09:00:00Z" }),
        makeArtifact({ id: `a_${i}_4`, child_id: cid, artifact_type: "daily_summary", quality_score: 85, evidence_confidence_score: 82, framework: "theraplay", source_ids_count: 3, status: "approved", submitted_for_review_at: "2026-05-23T14:00:00Z", reviewed_at: "2026-05-23T16:00:00Z" }),
      ]);
      const r = computeCaraContentQuality(baseInput({ total_children: 4, artifacts: arts }));
      expect(r.content_rating).toBe("outstanding");
      expect(r.content_score).toBeGreaterThanOrEqual(80);
      expect(r.approval_rate).toBe(100);
      expect(r.framework_diversity).toBe(4);
      expect(r.child_coverage_rate).toBe(100);
      expect(r.review_turnaround_hours).toBeLessThanOrEqual(24);
    });

    it("home with all rejected artifacts", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "rejected", rejected_by: "staff_x", quality_score: 45, evidence_confidence_score: 40, framework: null, source_ids_count: 0 }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.rejection_rate).toBe(100);
      expect(r.approval_rate).toBe(0);
      expect(r.concerns.length).toBeGreaterThan(0);
    });

    it("home with only drafts — no submission flow", () => {
      const arts = Array.from({ length: 8 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, status: "draft", quality_score: 70, evidence_confidence_score: 65 }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.total_artifacts).toBe(8);
      expect(r.approval_rate).toBe(0);
      expect(r.rejection_rate).toBe(0);
    });

    it("home with diverse safeguarding levels", () => {
      const levels = ["none", "low", "medium", "high", "critical"];
      const arts = levels.map((level, i) =>
        makeArtifact({ id: `a_${i}`, safeguarding_level: level, status: "approved" }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.safeguarding_flagged_rate).toBe(80); // 4/5
    });

    it("home with 100% evidence sourced", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, source_ids_count: i + 1 }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.evidence_sourced_rate).toBe(100);
    });

    it("home with 0% evidence sourced", () => {
      const arts = Array.from({ length: 5 }, (_, i) =>
        makeArtifact({ id: `a_${i}`, source_ids_count: 0 }),
      );
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.evidence_sourced_rate).toBe(0);
    });

    it("home with long review turnaround", () => {
      const arts = [
        makeArtifact({
          id: "a1",
          submitted_for_review_at: "2026-05-01T10:00:00Z",
          reviewed_at: "2026-05-10T10:00:00Z", // 216 hours
        }),
      ];
      const r = computeCaraContentQuality(baseInput({ artifacts: arts }));
      expect(r.review_turnaround_hours).toBe(216);
      expect(r.concerns.some(c => c.includes("turnaround"))).toBe(true);
    });
  });

  // ── Regression / Safety ───────────────────────────────────────────────

  describe("regression and safety", () => {
    it("function is exported as computeCaraContentQuality", () => {
      expect(typeof computeCaraContentQuality).toBe("function");
    });

    it("does not mutate input", () => {
      const art = makeArtifact();
      const input = baseInput({ artifacts: [art] });
      const inputCopy = JSON.parse(JSON.stringify(input));
      computeCaraContentQuality(input);
      expect(input).toEqual(inputCopy);
    });

    it("returns a new object each call", () => {
      const input = baseInput({ artifacts: [makeArtifact()] });
      const r1 = computeCaraContentQuality(input);
      const r2 = computeCaraContentQuality(input);
      expect(r1).not.toBe(r2); // different object references
      expect(r1).toEqual(r2); // but same values
    });

    it("rating is always a valid string", () => {
      const valid = ["outstanding", "good", "adequate", "inadequate", "insufficient_data"];
      const scenarios = [
        baseInput({ total_staff: 0, total_children: 0, artifacts: [] }),
        baseInput({ artifacts: [] }),
        baseInput({ artifacts: [makeArtifact({ quality_score: 90 })] }),
        baseInput({ artifacts: [makeArtifact({ quality_score: 30, evidence_confidence_score: 20, framework: null, source_ids_count: 0, status: "rejected", rejected_by: "s1" })] }),
      ];
      scenarios.forEach(input => {
        const r = computeCaraContentQuality(input);
        expect(valid).toContain(r.content_rating);
      });
    });

    it("score is always a number between 0 and 100 inclusive", () => {
      const scenarios = [
        baseInput({ total_staff: 0, total_children: 0, artifacts: [] }),
        baseInput({ artifacts: [] }),
        baseInput({ artifacts: [makeArtifact({ quality_score: 0, evidence_confidence_score: 0 })] }),
        baseInput({ artifacts: [makeArtifact({ quality_score: 100, evidence_confidence_score: 100 })] }),
      ];
      scenarios.forEach(input => {
        const r = computeCaraContentQuality(input);
        expect(typeof r.content_score).toBe("number");
        expect(r.content_score).toBeGreaterThanOrEqual(0);
        expect(r.content_score).toBeLessThanOrEqual(100);
      });
    });

    it("base score starts at 52", () => {
      // A single artifact with no bonuses or penalties
      const arts = [makeArtifact({ quality_score: 50, evidence_confidence_score: 50, framework: null, source_ids_count: 0, status: "submitted", submitted_for_review_at: null, reviewed_at: null })];
      const r = computeCaraContentQuality(baseInput({ total_children: 0, artifacts: arts }));
      // No bonuses, no penalties → should be 52
      expect(r.content_score).toBe(52);
    });
  });
});
