// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RECORDING QUALITY INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import {
  computeHomeRecordingQuality,
  type CareFormInput,
  type HomeRecordingInput,
} from "../home-recording-quality-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeForm(overrides: Partial<CareFormInput> = {}): CareFormInput {
  return {
    id: "form_1",
    form_type: "risk_assessment",
    status: "approved",
    priority: "medium",
    has_linked_child: true,
    has_linked_incident: false,
    submitted_at: "2026-05-20",
    reviewed_at: "2026-05-20",
    approved_at: "2026-05-20",
    due_date: "2026-05-25",
    created_date: "2026-05-19",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeRecordingInput> = {}): HomeRecordingInput {
  return {
    today: TODAY,
    care_forms: [],
    ...overrides,
  };
}

// ── Insufficient Data ───────────────────────────────────────────────────────

describe("Home Recording Quality Intelligence Engine", () => {
  describe("insufficient data", () => {
    it("returns insufficient_data with no forms", () => {
      const r = computeHomeRecordingQuality(baseInput());
      expect(r.recording_rating).toBe("insufficient_data");
      expect(r.recording_score).toBe(0);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns insufficient_data when all forms outside lookback", () => {
      const r = computeHomeRecordingQuality(baseInput({
        care_forms: [makeForm({ created_date: "2026-01-01" })],
        lookback_days: 90,
      }));
      expect(r.recording_rating).toBe("insufficient_data");
    });

    it("includes forms within lookback window", () => {
      const r = computeHomeRecordingQuality(baseInput({
        care_forms: [makeForm({ created_date: "2026-05-01" })],
      }));
      expect(r.recording_rating).not.toBe("insufficient_data");
    });
  });

  // ── Outstanding ───────────────────────────────────────────────────────────

  describe("outstanding rating", () => {
    it("achieves outstanding with perfect recording practice", () => {
      // Need 4+ form types, all submitted, reviewed, approved, no overdue, no drafts
      const forms = [
        makeForm({ id: "f1", form_type: "risk_assessment", priority: "urgent", created_date: "2026-05-10" }),
        makeForm({ id: "f2", form_type: "safeguarding_referral", created_date: "2026-05-12" }),
        makeForm({ id: "f3", form_type: "supervision_record", created_date: "2026-05-14" }),
        makeForm({ id: "f4", form_type: "return_from_missing", created_date: "2026-05-16" }),
        makeForm({ id: "f5", form_type: "health_safety_check", created_date: "2026-05-18" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // Base 52
      // +5 submission 100%, +4 review 100%, +3 review days <=1 (same day)
      // +4 approval 100%, +3 no overdue, +3 draft 0%
      // +3 urgent reviewed, +3 types (5 >= 4)
      // = 52 + 28 = 80
      expect(r.recording_rating).toBe("outstanding");
      expect(r.recording_score).toBe(80);
    });

    it("generates strengths for outstanding", () => {
      const forms = [
        makeForm({ id: "f1", form_type: "risk_assessment", priority: "urgent", created_date: "2026-05-15" }),
        makeForm({ id: "f2", form_type: "safeguarding_referral", created_date: "2026-05-16" }),
        makeForm({ id: "f3", form_type: "supervision_record", created_date: "2026-05-17" }),
        makeForm({ id: "f4", form_type: "return_from_missing", created_date: "2026-05-18" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.strengths.some(s => s.includes("submission rate"))).toBe(true);
      expect(r.strengths.some(s => s.includes("review rate"))).toBe(true);
    });
  });

  // ── Good ──────────────────────────────────────────────────────────────────

  describe("good rating", () => {
    it("achieves good with minor gaps", () => {
      // 10 forms: 8 submitted+reviewed+approved, 1 submitted but not reviewed, 1 draft
      const forms = Array.from({ length: 10 }, (_, i) =>
        makeForm({
          id: `f${i}`,
          form_type: i % 4 === 0 ? "risk_assessment" : i % 4 === 1 ? "safeguarding_referral" : i % 4 === 2 ? "supervision_record" : "return_from_missing",
          created_date: `2026-05-${String(10 + i).padStart(2, "0")}`,
          status: i < 8 ? "approved" : i === 8 ? "submitted" : "draft",
          submitted_at: i < 9 ? "2026-05-20" : null,
          reviewed_at: i < 8 ? "2026-05-20" : null,
          approved_at: i < 8 ? "2026-05-20" : null,
        })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // submission: 9/10 = 90% → +5
      // review: 8/9 = 89% → +4
      // review days: 0 → +3
      // approval: 8/8 = 100% → +4
      // overdue: form 9(draft) due 2026-05-25 < today, not approved → 1 overdue
      // Wait - default due_date is "2026-05-25" which is < "2026-05-26", and draft is not approved
      // So overdue = 2 (submitted+not-approved form_8 and draft form_9)
      // Actually: form_8 status="submitted", due_date="2026-05-25" < today, not approved → overdue
      // form_9 status="draft", due_date="2026-05-25" < today, not approved → overdue
      // overdue = 2 → -1
      // draft: 1/10 = 10% → +3
      // urgent: 0 urgent → +1
      // types: 4 → +3
      // = 52+5+4+3+4-1+3+1+3 = 74
      expect(r.recording_rating).toBeDefined();
      expect(r.recording_score).toBe(74);
      expect(r.recording_rating).toBe("good");
    });
  });

  // ── Adequate ──────────────────────────────────────────────────────────────

  describe("adequate rating", () => {
    it("achieves adequate with moderate gaps", () => {
      // 10 forms: 6 submitted, 4 drafts, 3 reviewed, 1 approved, multiple overdue
      const forms = Array.from({ length: 10 }, (_, i) =>
        makeForm({
          id: `f${i}`,
          form_type: "risk_assessment",
          created_date: `2026-05-${String(10 + i).padStart(2, "0")}`,
          status: i < 1 ? "approved" : i < 3 ? "pending_review" : i < 6 ? "submitted" : "draft",
          submitted_at: i < 6 ? "2026-05-20" : null,
          reviewed_at: i < 3 ? "2026-05-21" : null,
          approved_at: i < 1 ? "2026-05-21" : null,
        })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // submission: 6/10 = 60% → (-1)
      // review: 3/6 = 50% → (-1) (>=30)
      // review days: 1 day → +3
      // approval: 1/3 = 33% → (-2)
      // overdue: all 10 have due_date 2026-05-25 < today, 9 not approved → 9
      // Hmm, that's a lot. overdue.length > 3 → -2
      // draft: 4/10 = 40% → -1
      // urgent: 0 → +1
      // types: 1 → -1
      // = 52-1-1+3-2-2-1+1-1 = 48
      expect(r.recording_rating).toBe("adequate");
      expect(r.recording_score).toBe(48);
    });
  });

  // ── Inadequate ────────────────────────────────────────────────────────────

  describe("inadequate rating", () => {
    it("scores inadequate with all drafts and no reviews", () => {
      const forms = Array.from({ length: 5 }, (_, i) =>
        makeForm({
          id: `f${i}`,
          form_type: "risk_assessment",
          created_date: `2026-05-${String(20 + i).padStart(2, "0")}`,
          status: "draft",
          submitted_at: null,
          reviewed_at: null,
          approved_at: null,
        })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // submission: 0% → -4
      // review: no submitted forms → skip
      // review days: no reviews → skip
      // approval: no reviewed forms → skip
      // overdue: all due 2026-05-25 < today, not approved → 5
      // overdue > 3 → -2
      // draft: 100% → -2
      // urgent: 0 → +1
      // types: 1 → -1
      // = 52-4-2-2+1-1 = 44
      expect(r.recording_rating).toBe("inadequate");
      expect(r.recording_score).toBe(44);
    });

    it("generates critical insights for poor practice", () => {
      const forms = Array.from({ length: 5 }, (_, i) =>
        makeForm({
          id: `f${i}`,
          form_type: "risk_assessment",
          priority: i < 2 ? "urgent" : "medium",
          created_date: `2026-05-${String(20 + i).padStart(2, "0")}`,
          status: "submitted",
          submitted_at: "2026-05-20",
          reviewed_at: null,
          approved_at: null,
        })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });

  // ── Submission Profile ────────────────────────────────────────────────────

  describe("submission profile", () => {
    it("calculates submission rate", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", submitted_at: "2026-05-20" }),
        makeForm({ id: "f2", created_date: "2026-05-21", submitted_at: null, status: "draft" }),
        makeForm({ id: "f3", created_date: "2026-05-22", submitted_at: "2026-05-22" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.submission_profile.total_forms).toBe(3);
      expect(r.submission_profile.submitted_count).toBe(2);
      expect(r.submission_profile.draft_count).toBe(1);
      expect(r.submission_profile.submission_rate).toBe(67);
    });

    it("counts overdue forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", due_date: "2026-05-24", status: "submitted", approved_at: null }),
        makeForm({ id: "f2", created_date: "2026-05-20", due_date: "2026-05-24", status: "approved", approved_at: "2026-05-24" }),
        makeForm({ id: "f3", created_date: "2026-05-20", due_date: "2026-05-27", status: "submitted", approved_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // f1: due 05-24 < today, not approved → overdue
      // f2: approved → not overdue
      // f3: due 05-27 >= today → not overdue
      expect(r.submission_profile.overdue_count).toBe(1);
    });
  });

  // ── Review Profile ────────────────────────────────────────────────────────

  describe("review profile", () => {
    it("calculates review rate from submitted forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", submitted_at: "2026-05-20", reviewed_at: "2026-05-21" }),
        makeForm({ id: "f2", created_date: "2026-05-21", submitted_at: "2026-05-21", reviewed_at: null, status: "submitted" }),
        makeForm({ id: "f3", created_date: "2026-05-22", status: "draft", submitted_at: null, reviewed_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // 2 submitted, 1 reviewed → 50%
      expect(r.review_profile.reviewed_count).toBe(1);
      expect(r.review_profile.review_rate).toBe(50);
    });

    it("counts pending review forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", submitted_at: "2026-05-20", reviewed_at: null, status: "pending_review" }),
        makeForm({ id: "f2", created_date: "2026-05-21", submitted_at: "2026-05-21", reviewed_at: null, status: "submitted" }),
        makeForm({ id: "f3", created_date: "2026-05-22", submitted_at: null, reviewed_at: null, status: "draft" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.review_profile.pending_review_count).toBe(2);
    });

    it("calculates average review days", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-15", submitted_at: "2026-05-15", reviewed_at: "2026-05-16" }), // 1 day
        makeForm({ id: "f2", created_date: "2026-05-17", submitted_at: "2026-05-17", reviewed_at: "2026-05-20" }), // 3 days
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.review_profile.avg_review_days).toBe(2); // (1+3)/2 = 2
    });
  });

  // ── Approval Profile ──────────────────────────────────────────────────────

  describe("approval profile", () => {
    it("calculates approval rate from reviewed forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", reviewed_at: "2026-05-21", approved_at: "2026-05-21" }),
        makeForm({ id: "f2", created_date: "2026-05-21", reviewed_at: "2026-05-22", approved_at: null, status: "pending_review" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // 2 reviewed, 1 approved → 50%
      expect(r.approval_profile.approved_count).toBe(1);
      expect(r.approval_profile.approval_rate).toBe(50);
    });

    it("calculates average approval days", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-10", submitted_at: "2026-05-10", approved_at: "2026-05-12" }), // 2 days
        makeForm({ id: "f2", created_date: "2026-05-12", submitted_at: "2026-05-12", approved_at: "2026-05-12" }), // 0 days
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.approval_profile.avg_approval_days).toBe(1); // (2+0)/2 = 1
    });
  });

  // ── Quality Profile ───────────────────────────────────────────────────────

  describe("quality profile", () => {
    it("counts urgent and high priority forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", priority: "urgent" }),
        makeForm({ id: "f2", created_date: "2026-05-21", priority: "high" }),
        makeForm({ id: "f3", created_date: "2026-05-22", priority: "medium" }),
        makeForm({ id: "f4", created_date: "2026-05-23", priority: "urgent" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.quality_profile.urgent_count).toBe(2);
      expect(r.quality_profile.high_priority_count).toBe(1);
    });

    it("calculates child linked rate", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", has_linked_child: true }),
        makeForm({ id: "f2", created_date: "2026-05-21", has_linked_child: false }),
        makeForm({ id: "f3", created_date: "2026-05-22", has_linked_child: true }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.quality_profile.child_linked_rate).toBe(67);
    });

    it("counts unreviewed urgent forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", priority: "urgent", submitted_at: "2026-05-20", reviewed_at: null, status: "submitted" }),
        makeForm({ id: "f2", created_date: "2026-05-21", priority: "urgent", submitted_at: "2026-05-21", reviewed_at: "2026-05-21" }),
        makeForm({ id: "f3", created_date: "2026-05-22", priority: "urgent", submitted_at: null, status: "draft", reviewed_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // f1: urgent, submitted, not reviewed → count
      // f2: urgent, reviewed → don't count
      // f3: urgent, not submitted → don't count (filter requires submitted_at !== null)
      expect(r.quality_profile.urgent_unreviewed_count).toBe(1);
    });

    it("counts unique form types", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", form_type: "risk_assessment" }),
        makeForm({ id: "f2", created_date: "2026-05-21", form_type: "safeguarding_referral" }),
        makeForm({ id: "f3", created_date: "2026-05-22", form_type: "risk_assessment" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.quality_profile.form_type_count).toBe(2);
    });
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  describe("scoring modifiers", () => {
    it("applies full submission bonus for 100% (+5)", () => {
      const forms = [
        makeForm({ id: "f1", form_type: "risk_assessment", priority: "urgent", created_date: "2026-05-15" }),
        makeForm({ id: "f2", form_type: "safeguarding", created_date: "2026-05-16" }),
        makeForm({ id: "f3", form_type: "supervision", created_date: "2026-05-17" }),
        makeForm({ id: "f4", form_type: "return_missing", created_date: "2026-05-18" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.recording_score).toBe(80);
    });

    it("penalises low submission rate (-4)", () => {
      // 5 forms, 1 submitted
      const forms = Array.from({ length: 5 }, (_, i) =>
        makeForm({
          id: `f${i}`,
          form_type: "risk_assessment",
          created_date: `2026-05-${String(20 + i).padStart(2, "0")}`,
          status: i === 0 ? "approved" : "draft",
          submitted_at: i === 0 ? "2026-05-20" : null,
          reviewed_at: i === 0 ? "2026-05-20" : null,
          approved_at: i === 0 ? "2026-05-20" : null,
        })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // submission 20% → -4
      // review: 1/1 = 100% → +4
      // review days: 0 → +3
      // approval: 1/1 = 100% → +4
      // overdue: due 2026-05-25 < today: 4 not approved → -2
      // draft: 80% → -2
      // urgent: 0 → +1
      // types: 1 → -1
      // = 52-4+4+3+4-2-2+1-1 = 55
      expect(r.recording_score).toBe(55);
    });

    it("gives bonus for no overdue forms (+3)", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", due_date: "2026-05-27" }), // future
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // overdue: 0 → +3
      expect(r.submission_profile.overdue_count).toBe(0);
    });

    it("gives review timeliness bonus for same-day review", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", submitted_at: "2026-05-20", reviewed_at: "2026-05-20" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // review days: 0 → +3
      expect(r.review_profile.avg_review_days).toBe(0);
    });

    it("penalises slow reviews (>7 days)", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-01", submitted_at: "2026-05-01", reviewed_at: "2026-05-15", approved_at: "2026-05-15", due_date: "2026-05-30" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // review days: 14 → -2 (instead of +3), diff = -5
      // For full trace: 52+5+4-2+4+3+3+1-1 = 69
      expect(r.review_profile.avg_review_days).toBe(14);
      expect(r.recording_score).toBe(69);
    });

    it("gives urgent handling bonus when all urgent reviewed", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", priority: "urgent", reviewed_at: "2026-05-20" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      // urgent reviewed → +3
      expect(r.quality_profile.urgent_unreviewed_count).toBe(0);
    });
  });

  // ── Lookback Window ───────────────────────────────────────────────────────

  describe("lookback window", () => {
    it("uses default 90-day lookback", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-03-01" }), // 86 days ago, within window
        makeForm({ id: "f2", created_date: "2026-02-20" }), // 95 days ago, outside
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.submission_profile.total_forms).toBe(1);
    });

    it("respects custom lookback_days", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20" }), // 6 days ago
        makeForm({ id: "f2", created_date: "2026-05-10" }), // 16 days ago
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms, lookback_days: 7 }));
      expect(r.submission_profile.total_forms).toBe(1);
    });

    it("excludes future forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-27" }), // tomorrow
        makeForm({ id: "f2", created_date: "2026-05-26" }), // today
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.submission_profile.total_forms).toBe(1);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes submission rate strength", () => {
      const forms = [makeForm({ created_date: "2026-05-20" })];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.strengths.some(s => s.includes("submission rate"))).toBe(true);
    });

    it("includes review rate strength when >= 80%", () => {
      const forms = [makeForm({ created_date: "2026-05-20" })];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.strengths.some(s => s.includes("review rate"))).toBe(true);
    });

    it("includes no overdue strength", () => {
      const forms = [makeForm({ created_date: "2026-05-20", due_date: "2026-05-30" })];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.strengths.some(s => s.includes("No overdue"))).toBe(true);
    });

    it("includes urgent reviewed strength", () => {
      const forms = [makeForm({ created_date: "2026-05-20", priority: "urgent" })];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.strengths.some(s => s.includes("urgent forms reviewed"))).toBe(true);
    });

    it("includes form diversity strength", () => {
      const types = ["risk", "safeguarding", "supervision", "return_missing"];
      const forms = types.map((t, i) => makeForm({ id: `f${i}`, form_type: t, created_date: `2026-05-${String(20 + i).padStart(2, "0")}` }));
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.strengths.some(s => s.includes("form types"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags draft backlog", () => {
      const forms = Array.from({ length: 4 }, (_, i) =>
        makeForm({
          id: `f${i}`,
          created_date: `2026-05-${String(20 + i).padStart(2, "0")}`,
          status: i < 3 ? "draft" : "approved",
          submitted_at: i === 3 ? "2026-05-23" : null,
          reviewed_at: i === 3 ? "2026-05-23" : null,
          approved_at: i === 3 ? "2026-05-23" : null,
        })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.concerns.some(c => c.includes("draft"))).toBe(true);
    });

    it("flags overdue forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", due_date: "2026-05-24", status: "submitted", approved_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("flags low review rate", () => {
      const forms = Array.from({ length: 5 }, (_, i) =>
        makeForm({
          id: `f${i}`,
          created_date: `2026-05-${String(20 + i).padStart(2, "0")}`,
          status: "submitted",
          submitted_at: "2026-05-20",
          reviewed_at: null,
          approved_at: null,
        })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.concerns.some(c => c.includes("review rate"))).toBe(true);
    });

    it("flags urgent unreviewed forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", priority: "urgent", status: "submitted", reviewed_at: null, approved_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.concerns.some(c => c.includes("urgent"))).toBe(true);
    });

    it("flags pending review backlog", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", status: "pending_review", reviewed_at: null, approved_at: null }),
        makeForm({ id: "f2", created_date: "2026-05-21", status: "submitted", reviewed_at: null, approved_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.concerns.some(c => c.includes("awaiting review"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends urgent review when urgent forms unreviewed", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", priority: "urgent", status: "submitted", reviewed_at: null, approved_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("urgent"))).toBe(true);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("recommends overdue clearance when many overdue", () => {
      const forms = Array.from({ length: 5 }, (_, i) =>
        makeForm({
          id: `f${i}`,
          created_date: `2026-05-${String(10 + i).padStart(2, "0")}`,
          due_date: "2026-05-15",
          status: "submitted",
          approved_at: null,
          reviewed_at: null,
        })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("overdue"))).toBe(true);
    });

    it("generates no recommendations for perfect practice", () => {
      const types = ["risk", "safeguarding", "supervision", "return_missing"];
      const forms = types.map((t, i) =>
        makeForm({ id: `f${i}`, form_type: t, created_date: `2026-05-${String(20 + i).padStart(2, "0")}`, due_date: "2026-05-30" })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for exemplary practice", () => {
      const forms = [makeForm({ created_date: "2026-05-20", due_date: "2026-05-30" })];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for unreviewed urgent forms", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", priority: "urgent", status: "submitted", reviewed_at: null, approved_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("urgent"))).toBe(true);
    });

    it("generates warning for overdue + draft combination", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", due_date: "2026-05-24", status: "submitted", approved_at: null, reviewed_at: null }),
        makeForm({ id: "f2", created_date: "2026-05-21", status: "draft", submitted_at: null, reviewed_at: null, approved_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("overdue"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("generates outstanding headline", () => {
      const types = ["risk", "safeguarding", "supervision", "return_missing"];
      const forms = types.map((t, i) =>
        makeForm({ id: `f${i}`, form_type: t, priority: i === 0 ? "urgent" : "medium", created_date: `2026-05-${String(20 + i).padStart(2, "0")}` })
      );
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.headline).toContain("Outstanding");
    });

    it("generates insufficient_data headline", () => {
      const r = computeHomeRecordingQuality(baseInput());
      expect(r.headline).toContain("No care form records");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single form", () => {
      const r = computeHomeRecordingQuality(baseInput({
        care_forms: [makeForm({ created_date: "2026-05-20" })],
      }));
      expect(r.recording_rating).not.toBe("insufficient_data");
      expect(r.submission_profile.total_forms).toBe(1);
    });

    it("handles all forms with no submission", () => {
      const forms = [
        makeForm({ id: "f1", created_date: "2026-05-20", status: "draft", submitted_at: null, reviewed_at: null, approved_at: null }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.submission_profile.submission_rate).toBe(0);
    });

    it("clamps score at minimum 0", () => {
      const r = computeHomeRecordingQuality(baseInput({
        care_forms: Array.from({ length: 20 }, (_, i) =>
          makeForm({
            id: `f${i}`,
            form_type: "risk",
            created_date: `2026-05-${String(Math.max(1, 26 - (i % 26))).padStart(2, "0")}`,
            status: "draft",
            submitted_at: null,
            reviewed_at: null,
            approved_at: null,
          })
        ),
      }));
      expect(r.recording_score).toBeGreaterThanOrEqual(0);
    });

    it("handles forms with same submitted and reviewed date", () => {
      const forms = [
        makeForm({ created_date: "2026-05-20", submitted_at: "2026-05-20", reviewed_at: "2026-05-20" }),
      ];
      const r = computeHomeRecordingQuality(baseInput({ care_forms: forms }));
      expect(r.review_profile.avg_review_days).toBe(0);
    });
  });
});
