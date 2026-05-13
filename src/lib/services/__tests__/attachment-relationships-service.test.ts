// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ATTACHMENT & RELATIONSHIPS SERVICE TESTS
// Pure-function unit tests for attachment metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 6 (quality and purpose of care —
// attachment-aware), Reg 10 (the care planning standard — relational
// security), Reg 12 (health and education — emotional wellbeing).
// SCCIF: Overall Experiences — "Children form trusting relationships
// with staff." "Attachment-aware practice supports children's recovery."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  ATTACHMENT_STYLES,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_QUALITIES,
  THERAPEUTIC_APPROACHES,
  ASSESSMENT_STATUSES,
  listRecords,
  createRecord,
  updateRecord,
} from "../attachment-relationships-service";

import type {
  AttachmentRecord,
  AttachmentStyle,
  RelationshipType,
  RelationshipQuality,
  TherapeuticApproach,
  AssessmentStatus,
} from "../attachment-relationships-service";

const { computeAttachmentMetrics, identifyAttachmentAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal AttachmentRecord with sensible defaults. */
function makeRecord(overrides: Partial<AttachmentRecord> = {}): AttachmentRecord {
  return {
    id: "ar-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    attachment_style: "secure",
    assessed_by: "staff-1",
    assessed_date: daysAgo(7),
    assessment_status: "current",
    next_review_date: daysFromNow(90),
    relationship_type: "key_worker",
    relationship_person: "Jane Doe",
    relationship_quality: "positive",
    therapeutic_approach: null,
    approach_start_date: null,
    progress_notes: null,
    child_views: null,
    staff_trained_attachment: true,
    psychologist_involved: false,
    key_triggers: ["transitions"],
    calming_strategies: ["deep breathing"],
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(7),
    ...overrides,
  } as AttachmentRecord;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("ATTACHMENT_STYLES", () => {
  it("has exactly 5 entries", () => {
    expect(ATTACHMENT_STYLES).toHaveLength(5);
  });

  it("contains unique style values", () => {
    const values = ATTACHMENT_STYLES.map((s) => s.style);
    expect(new Set(values).size).toBe(values.length);
  });

  it("includes all expected attachment styles", () => {
    const expected: AttachmentStyle[] = [
      "secure", "anxious_ambivalent", "anxious_avoidant", "disorganised", "not_yet_assessed",
    ];
    for (const style of expected) {
      expect(ATTACHMENT_STYLES.find((s) => s.style === style)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const s of ATTACHMENT_STYLES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("RELATIONSHIP_TYPES", () => {
  it("has exactly 12 entries", () => {
    expect(RELATIONSHIP_TYPES).toHaveLength(12);
  });

  it("contains unique type values", () => {
    const values = RELATIONSHIP_TYPES.map((r) => r.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = RELATIONSHIP_TYPES.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected relationship types", () => {
    const expected: RelationshipType[] = [
      "key_worker", "parent", "sibling", "extended_family", "foster_carer",
      "social_worker", "therapist", "teacher", "peer", "mentor",
      "other_professional", "other",
    ];
    for (const type of expected) {
      expect(RELATIONSHIP_TYPES.find((r) => r.type === type)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const r of RELATIONSHIP_TYPES) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

describe("RELATIONSHIP_QUALITIES", () => {
  it("has exactly 6 entries", () => {
    expect(RELATIONSHIP_QUALITIES).toHaveLength(6);
  });

  it("contains unique quality values", () => {
    const values = RELATIONSHIP_QUALITIES.map((q) => q.quality);
    expect(new Set(values).size).toBe(values.length);
  });

  it("includes all expected relationship qualities", () => {
    const expected: RelationshipQuality[] = [
      "strong_positive", "positive", "developing", "inconsistent", "strained", "broken",
    ];
    for (const quality of expected) {
      expect(RELATIONSHIP_QUALITIES.find((q) => q.quality === quality)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const q of RELATIONSHIP_QUALITIES) {
      expect(q.label.length).toBeGreaterThan(0);
    }
  });
});

describe("THERAPEUTIC_APPROACHES", () => {
  it("has exactly 12 entries", () => {
    expect(THERAPEUTIC_APPROACHES).toHaveLength(12);
  });

  it("contains unique approach values", () => {
    const values = THERAPEUTIC_APPROACHES.map((a) => a.approach);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = THERAPEUTIC_APPROACHES.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected therapeutic approaches", () => {
    const expected: TherapeuticApproach[] = [
      "pace", "dan_hughes", "theraplay", "dyadic_developmental",
      "nurture_group", "team_around_child", "life_story_work",
      "play_therapy", "art_therapy", "emdr", "cbt", "other",
    ];
    for (const approach of expected) {
      expect(THERAPEUTIC_APPROACHES.find((a) => a.approach === approach)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const a of THERAPEUTIC_APPROACHES) {
      expect(a.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ASSESSMENT_STATUSES", () => {
  it("has exactly 4 entries", () => {
    expect(ASSESSMENT_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const values = ASSESSMENT_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("includes all expected assessment statuses", () => {
    const expected: AssessmentStatus[] = ["current", "under_review", "outdated", "initial"];
    for (const status of expected) {
      expect(ASSESSMENT_STATUSES.find((s) => s.status === status)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const s of ASSESSMENT_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeAttachmentMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAttachmentMetrics", () => {
  it("returns zeroed metrics for empty records array", () => {
    const m = computeAttachmentMetrics([], 0);
    expect(m.total_records).toBe(0);
    expect(m.children_assessed).toBe(0);
    expect(m.assessment_coverage).toBe(0);
    expect(m.secure_count).toBe(0);
    expect(m.anxious_ambivalent_count).toBe(0);
    expect(m.anxious_avoidant_count).toBe(0);
    expect(m.disorganised_count).toBe(0);
    expect(m.not_assessed_count).toBe(0);
    expect(m.current_assessments).toBe(0);
    expect(m.outdated_assessments).toBe(0);
    expect(m.strong_positive_relationships).toBe(0);
    expect(m.strained_or_broken_count).toBe(0);
    expect(m.therapeutic_approach_rate).toBe(0);
    expect(m.psychologist_involved_rate).toBe(0);
    expect(m.staff_trained_rate).toBe(0);
    expect(m.child_views_rate).toBe(0);
    expect(Object.keys(m.by_attachment_style)).toHaveLength(0);
    expect(Object.keys(m.by_relationship_type)).toHaveLength(0);
    expect(Object.keys(m.by_relationship_quality)).toHaveLength(0);
    expect(Object.keys(m.by_therapeutic_approach)).toHaveLength(0);
  });

  // ── total_records ──────────────────────────────────────────────────

  it("total_records equals the number of records", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1" }),
      makeRecord({ id: "ar2", child_id: "c2" }),
      makeRecord({ id: "ar3", child_id: "c3" }),
    ];
    const m = computeAttachmentMetrics(records, 5);
    expect(m.total_records).toBe(3);
  });

  it("total_records is 1 for single record", () => {
    const m = computeAttachmentMetrics([makeRecord()], 1);
    expect(m.total_records).toBe(1);
  });

  // ── children_assessed ───────────────────────────────────────────────

  it("children_assessed counts unique child IDs", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1", relationship_type: "key_worker" }),
      makeRecord({ id: "ar2", child_id: "c1", relationship_type: "parent" }),
      makeRecord({ id: "ar3", child_id: "c2", relationship_type: "sibling" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.children_assessed).toBe(2);
  });

  it("children_assessed is 1 when all records belong to same child", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1", relationship_type: "key_worker" }),
      makeRecord({ id: "ar2", child_id: "c1", relationship_type: "parent" }),
      makeRecord({ id: "ar3", child_id: "c1", relationship_type: "therapist" }),
    ];
    const m = computeAttachmentMetrics(records, 5);
    expect(m.children_assessed).toBe(1);
  });

  it("children_assessed equals total when each record is a different child", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1" }),
      makeRecord({ id: "ar2", child_id: "c2" }),
      makeRecord({ id: "ar3", child_id: "c3" }),
      makeRecord({ id: "ar4", child_id: "c4" }),
    ];
    const m = computeAttachmentMetrics(records, 4);
    expect(m.children_assessed).toBe(4);
  });

  // ── assessment_coverage ─────────────────────────────────────────────

  it("assessment_coverage is 100 when all children assessed", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1" }),
      makeRecord({ id: "ar2", child_id: "c2" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.assessment_coverage).toBe(100);
  });

  it("assessment_coverage is 50 when half the children assessed", () => {
    const records = [makeRecord({ id: "ar1", child_id: "c1" })];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.assessment_coverage).toBe(50);
  });

  it("assessment_coverage is 0 when totalChildren is 0", () => {
    const m = computeAttachmentMetrics([], 0);
    expect(m.assessment_coverage).toBe(0);
  });

  it("assessment_coverage rounds to one decimal place", () => {
    const records = [makeRecord({ id: "ar1", child_id: "c1" })];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.assessment_coverage).toBe(33.3);
  });

  it("assessment_coverage is 0 with empty records and positive totalChildren", () => {
    const m = computeAttachmentMetrics([], 5);
    expect(m.assessment_coverage).toBe(0);
  });

  it("assessment_coverage with 2 children in 3 totalChildren", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1" }),
      makeRecord({ id: "ar2", child_id: "c2" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.assessment_coverage).toBe(66.7);
  });

  // ── attachment style counts ─────────────────────────────────────────

  it("secure_count counts records with secure attachment", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "secure" }),
      makeRecord({ id: "ar2", attachment_style: "secure" }),
      makeRecord({ id: "ar3", attachment_style: "disorganised" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.secure_count).toBe(2);
  });

  it("anxious_ambivalent_count counts correct records", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "anxious_ambivalent" }),
      makeRecord({ id: "ar2", attachment_style: "anxious_ambivalent" }),
      makeRecord({ id: "ar3", attachment_style: "secure" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.anxious_ambivalent_count).toBe(2);
  });

  it("anxious_avoidant_count counts correct records", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "anxious_avoidant" }),
      makeRecord({ id: "ar2", attachment_style: "secure" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.anxious_avoidant_count).toBe(1);
  });

  it("disorganised_count counts correct records", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "disorganised" }),
      makeRecord({ id: "ar2", attachment_style: "disorganised" }),
      makeRecord({ id: "ar3", attachment_style: "disorganised" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.disorganised_count).toBe(3);
  });

  it("not_assessed_count counts not_yet_assessed records", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "not_yet_assessed" }),
      makeRecord({ id: "ar2", attachment_style: "not_yet_assessed" }),
      makeRecord({ id: "ar3", attachment_style: "secure" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.not_assessed_count).toBe(2);
  });

  it("style counts sum to total_records", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "secure" }),
      makeRecord({ id: "ar2", attachment_style: "anxious_ambivalent" }),
      makeRecord({ id: "ar3", attachment_style: "anxious_avoidant" }),
      makeRecord({ id: "ar4", attachment_style: "disorganised" }),
      makeRecord({ id: "ar5", attachment_style: "not_yet_assessed" }),
    ];
    const m = computeAttachmentMetrics(records, 5);
    const sum = m.secure_count + m.anxious_ambivalent_count + m.anxious_avoidant_count + m.disorganised_count + m.not_assessed_count;
    expect(sum).toBe(m.total_records);
  });

  // ── assessment status counts ────────────────────────────────────────

  it("current_assessments counts current status records", () => {
    const records = [
      makeRecord({ id: "ar1", assessment_status: "current" }),
      makeRecord({ id: "ar2", assessment_status: "current" }),
      makeRecord({ id: "ar3", assessment_status: "outdated" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.current_assessments).toBe(2);
  });

  it("outdated_assessments counts outdated status records", () => {
    const records = [
      makeRecord({ id: "ar1", assessment_status: "outdated" }),
      makeRecord({ id: "ar2", assessment_status: "outdated" }),
      makeRecord({ id: "ar3", assessment_status: "current" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.outdated_assessments).toBe(2);
  });

  it("under_review status is not counted as current or outdated", () => {
    const records = [
      makeRecord({ id: "ar1", assessment_status: "under_review" }),
    ];
    const m = computeAttachmentMetrics(records, 1);
    expect(m.current_assessments).toBe(0);
    expect(m.outdated_assessments).toBe(0);
  });

  it("initial status is not counted as current or outdated", () => {
    const records = [
      makeRecord({ id: "ar1", assessment_status: "initial" }),
    ];
    const m = computeAttachmentMetrics(records, 1);
    expect(m.current_assessments).toBe(0);
    expect(m.outdated_assessments).toBe(0);
  });

  // ── relationship quality counts ─────────────────────────────────────

  it("strong_positive_relationships counts strong_positive quality", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "strong_positive" }),
      makeRecord({ id: "ar2", relationship_quality: "strong_positive" }),
      makeRecord({ id: "ar3", relationship_quality: "positive" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.strong_positive_relationships).toBe(2);
  });

  it("strained_or_broken_count counts strained records", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "strained" }),
      makeRecord({ id: "ar2", relationship_quality: "strained" }),
      makeRecord({ id: "ar3", relationship_quality: "positive" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.strained_or_broken_count).toBe(2);
  });

  it("strained_or_broken_count counts broken records", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "broken" }),
      makeRecord({ id: "ar2", relationship_quality: "positive" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.strained_or_broken_count).toBe(1);
  });

  it("strained_or_broken_count counts both strained and broken together", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "strained" }),
      makeRecord({ id: "ar2", relationship_quality: "broken" }),
      makeRecord({ id: "ar3", relationship_quality: "developing" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.strained_or_broken_count).toBe(2);
  });

  it("strained_or_broken_count does not count developing or inconsistent", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "developing" }),
      makeRecord({ id: "ar2", relationship_quality: "inconsistent" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.strained_or_broken_count).toBe(0);
  });

  // ── therapeutic_approach_rate ────────────────────────────────────────

  it("therapeutic_approach_rate is 100 when all records have a therapeutic approach", () => {
    const records = [
      makeRecord({ id: "ar1", therapeutic_approach: "pace" }),
      makeRecord({ id: "ar2", therapeutic_approach: "theraplay" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.therapeutic_approach_rate).toBe(100);
  });

  it("therapeutic_approach_rate is 0 when no records have a therapeutic approach", () => {
    const records = [
      makeRecord({ id: "ar1", therapeutic_approach: null }),
      makeRecord({ id: "ar2", therapeutic_approach: null }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.therapeutic_approach_rate).toBe(0);
  });

  it("therapeutic_approach_rate is 50 when half have a therapeutic approach", () => {
    const records = [
      makeRecord({ id: "ar1", therapeutic_approach: "dan_hughes" }),
      makeRecord({ id: "ar2", therapeutic_approach: null }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.therapeutic_approach_rate).toBe(50);
  });

  it("therapeutic_approach_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "ar1", therapeutic_approach: "pace" }),
      makeRecord({ id: "ar2", therapeutic_approach: null }),
      makeRecord({ id: "ar3", therapeutic_approach: null }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.therapeutic_approach_rate).toBe(33.3);
  });

  // ── psychologist_involved_rate ──────────────────────────────────────

  it("psychologist_involved_rate is 100 when all records have psychologist involved", () => {
    const records = [
      makeRecord({ id: "ar1", psychologist_involved: true }),
      makeRecord({ id: "ar2", psychologist_involved: true }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.psychologist_involved_rate).toBe(100);
  });

  it("psychologist_involved_rate is 0 when no records have psychologist involved", () => {
    const records = [
      makeRecord({ id: "ar1", psychologist_involved: false }),
      makeRecord({ id: "ar2", psychologist_involved: false }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.psychologist_involved_rate).toBe(0);
  });

  it("psychologist_involved_rate is 50 when half have psychologist involved", () => {
    const records = [
      makeRecord({ id: "ar1", psychologist_involved: true }),
      makeRecord({ id: "ar2", psychologist_involved: false }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.psychologist_involved_rate).toBe(50);
  });

  it("psychologist_involved_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "ar1", psychologist_involved: true }),
      makeRecord({ id: "ar2", psychologist_involved: true }),
      makeRecord({ id: "ar3", psychologist_involved: false }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.psychologist_involved_rate).toBe(66.7);
  });

  // ── staff_trained_rate ──────────────────────────────────────────────

  it("staff_trained_rate is 100 when all records have staff trained", () => {
    const records = [
      makeRecord({ id: "ar1", staff_trained_attachment: true }),
      makeRecord({ id: "ar2", staff_trained_attachment: true }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.staff_trained_rate).toBe(100);
  });

  it("staff_trained_rate is 0 when no records have staff trained", () => {
    const records = [
      makeRecord({ id: "ar1", staff_trained_attachment: false }),
      makeRecord({ id: "ar2", staff_trained_attachment: false }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.staff_trained_rate).toBe(0);
  });

  it("staff_trained_rate is 50 when half have staff trained", () => {
    const records = [
      makeRecord({ id: "ar1", staff_trained_attachment: true }),
      makeRecord({ id: "ar2", staff_trained_attachment: false }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.staff_trained_rate).toBe(50);
  });

  it("staff_trained_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "ar1", staff_trained_attachment: true }),
      makeRecord({ id: "ar2", staff_trained_attachment: false }),
      makeRecord({ id: "ar3", staff_trained_attachment: false }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.staff_trained_rate).toBe(33.3);
  });

  // ── child_views_rate ────────────────────────────────────────────────

  it("child_views_rate is 100 when all records have child views", () => {
    const records = [
      makeRecord({ id: "ar1", child_views: "I feel safe" }),
      makeRecord({ id: "ar2", child_views: "I like my key worker" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.child_views_rate).toBe(100);
  });

  it("child_views_rate is 0 when no records have child views", () => {
    const records = [
      makeRecord({ id: "ar1", child_views: null }),
      makeRecord({ id: "ar2", child_views: null }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.child_views_rate).toBe(0);
  });

  it("child_views_rate is 50 when half have child views", () => {
    const records = [
      makeRecord({ id: "ar1", child_views: "Views here" }),
      makeRecord({ id: "ar2", child_views: null }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.child_views_rate).toBe(50);
  });

  it("child_views_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "ar1", child_views: "Yes" }),
      makeRecord({ id: "ar2", child_views: "Yes" }),
      makeRecord({ id: "ar3", child_views: null }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.child_views_rate).toBe(66.7);
  });

  it("child_views_rate counts non-null values including empty string", () => {
    const records = [
      makeRecord({ id: "ar1", child_views: "" }),
      makeRecord({ id: "ar2", child_views: null }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.child_views_rate).toBe(50);
  });

  // ── by_attachment_style ─────────────────────────────────────────────

  it("by_attachment_style groups counts by style", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "secure" }),
      makeRecord({ id: "ar2", attachment_style: "secure" }),
      makeRecord({ id: "ar3", attachment_style: "disorganised" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.by_attachment_style["secure"]).toBe(2);
    expect(m.by_attachment_style["disorganised"]).toBe(1);
  });

  it("by_attachment_style has one entry per unique style", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "secure" }),
      makeRecord({ id: "ar2", attachment_style: "disorganised" }),
      makeRecord({ id: "ar3", attachment_style: "anxious_ambivalent" }),
      makeRecord({ id: "ar4", attachment_style: "secure" }),
    ];
    const m = computeAttachmentMetrics(records, 4);
    expect(Object.keys(m.by_attachment_style)).toHaveLength(3);
  });

  it("by_attachment_style values sum to total_records", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "secure" }),
      makeRecord({ id: "ar2", attachment_style: "anxious_ambivalent" }),
      makeRecord({ id: "ar3", attachment_style: "anxious_avoidant" }),
      makeRecord({ id: "ar4", attachment_style: "disorganised" }),
    ];
    const m = computeAttachmentMetrics(records, 4);
    const sum = Object.values(m.by_attachment_style).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_records);
  });

  it("by_attachment_style has 5 entries when all styles represented", () => {
    const styles: AttachmentStyle[] = [
      "secure", "anxious_ambivalent", "anxious_avoidant", "disorganised", "not_yet_assessed",
    ];
    const records = styles.map((s, i) =>
      makeRecord({ id: `ar${i}`, attachment_style: s }),
    );
    const m = computeAttachmentMetrics(records, 5);
    expect(Object.keys(m.by_attachment_style)).toHaveLength(5);
  });

  // ── by_relationship_type ────────────────────────────────────────────

  it("by_relationship_type groups counts by type", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_type: "key_worker" }),
      makeRecord({ id: "ar2", relationship_type: "key_worker" }),
      makeRecord({ id: "ar3", relationship_type: "parent" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.by_relationship_type["key_worker"]).toBe(2);
    expect(m.by_relationship_type["parent"]).toBe(1);
  });

  it("by_relationship_type values sum to total_records", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_type: "key_worker" }),
      makeRecord({ id: "ar2", relationship_type: "parent" }),
      makeRecord({ id: "ar3", relationship_type: "therapist" }),
      makeRecord({ id: "ar4", relationship_type: "key_worker" }),
    ];
    const m = computeAttachmentMetrics(records, 4);
    const sum = Object.values(m.by_relationship_type).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_records);
  });

  it("by_relationship_type has 12 entries when all types represented", () => {
    const types: RelationshipType[] = [
      "key_worker", "parent", "sibling", "extended_family", "foster_carer",
      "social_worker", "therapist", "teacher", "peer", "mentor",
      "other_professional", "other",
    ];
    const records = types.map((t, i) =>
      makeRecord({ id: `ar${i}`, relationship_type: t }),
    );
    const m = computeAttachmentMetrics(records, 12);
    expect(Object.keys(m.by_relationship_type)).toHaveLength(12);
  });

  // ── by_relationship_quality ─────────────────────────────────────────

  it("by_relationship_quality groups counts by quality", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "positive" }),
      makeRecord({ id: "ar2", relationship_quality: "positive" }),
      makeRecord({ id: "ar3", relationship_quality: "strained" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.by_relationship_quality["positive"]).toBe(2);
    expect(m.by_relationship_quality["strained"]).toBe(1);
  });

  it("by_relationship_quality values sum to total_records", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "strong_positive" }),
      makeRecord({ id: "ar2", relationship_quality: "developing" }),
      makeRecord({ id: "ar3", relationship_quality: "broken" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    const sum = Object.values(m.by_relationship_quality).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_records);
  });

  it("by_relationship_quality has 6 entries when all qualities represented", () => {
    const qualities: RelationshipQuality[] = [
      "strong_positive", "positive", "developing", "inconsistent", "strained", "broken",
    ];
    const records = qualities.map((q, i) =>
      makeRecord({ id: `ar${i}`, relationship_quality: q }),
    );
    const m = computeAttachmentMetrics(records, 6);
    expect(Object.keys(m.by_relationship_quality)).toHaveLength(6);
  });

  // ── by_therapeutic_approach ─────────────────────────────────────────

  it("by_therapeutic_approach tallies each approach across records", () => {
    const records = [
      makeRecord({ id: "ar1", therapeutic_approach: "pace" }),
      makeRecord({ id: "ar2", therapeutic_approach: "pace" }),
      makeRecord({ id: "ar3", therapeutic_approach: "theraplay" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.by_therapeutic_approach["pace"]).toBe(2);
    expect(m.by_therapeutic_approach["theraplay"]).toBe(1);
  });

  it("by_therapeutic_approach excludes null approaches", () => {
    const records = [
      makeRecord({ id: "ar1", therapeutic_approach: null }),
      makeRecord({ id: "ar2", therapeutic_approach: null }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(Object.keys(m.by_therapeutic_approach)).toHaveLength(0);
  });

  it("by_therapeutic_approach has 12 entries when all approaches represented", () => {
    const approaches: TherapeuticApproach[] = [
      "pace", "dan_hughes", "theraplay", "dyadic_developmental",
      "nurture_group", "team_around_child", "life_story_work",
      "play_therapy", "art_therapy", "emdr", "cbt", "other",
    ];
    const records = approaches.map((a, i) =>
      makeRecord({ id: `ar${i}`, therapeutic_approach: a }),
    );
    const m = computeAttachmentMetrics(records, 12);
    expect(Object.keys(m.by_therapeutic_approach)).toHaveLength(12);
  });

  it("by_therapeutic_approach mixes null and non-null correctly", () => {
    const records = [
      makeRecord({ id: "ar1", therapeutic_approach: "pace" }),
      makeRecord({ id: "ar2", therapeutic_approach: null }),
      makeRecord({ id: "ar3", therapeutic_approach: "pace" }),
      makeRecord({ id: "ar4", therapeutic_approach: "cbt" }),
    ];
    const m = computeAttachmentMetrics(records, 4);
    expect(m.by_therapeutic_approach["pace"]).toBe(2);
    expect(m.by_therapeutic_approach["cbt"]).toBe(1);
    expect(Object.keys(m.by_therapeutic_approach)).toHaveLength(2);
  });

  // ── single record ───────────────────────────────────────────────────

  it("single secure record with all flags true", () => {
    const records = [
      makeRecord({
        id: "ar1",
        attachment_style: "secure",
        therapeutic_approach: "pace",
        staff_trained_attachment: true,
        psychologist_involved: true,
        child_views: "I feel happy here",
      }),
    ];
    const m = computeAttachmentMetrics(records, 1);
    expect(m.secure_count).toBe(1);
    expect(m.therapeutic_approach_rate).toBe(100);
    expect(m.psychologist_involved_rate).toBe(100);
    expect(m.staff_trained_rate).toBe(100);
    expect(m.child_views_rate).toBe(100);
  });

  // ── mixed multi-child scenario ──────────────────────────────────────

  it("correctly computes metrics for multi-child mixed scenario", () => {
    const records = [
      makeRecord({
        id: "ar1", child_id: "c1", child_name: "Alice",
        attachment_style: "secure", assessment_status: "current",
        relationship_type: "key_worker", relationship_quality: "strong_positive",
        therapeutic_approach: "pace", staff_trained_attachment: true,
        psychologist_involved: true, child_views: "I feel safe",
      }),
      makeRecord({
        id: "ar2", child_id: "c1", child_name: "Alice",
        attachment_style: "secure", assessment_status: "current",
        relationship_type: "parent", relationship_quality: "strained",
        therapeutic_approach: null, staff_trained_attachment: true,
        psychologist_involved: false, child_views: null,
      }),
      makeRecord({
        id: "ar3", child_id: "c2", child_name: "Bob",
        attachment_style: "disorganised", assessment_status: "outdated",
        relationship_type: "therapist", relationship_quality: "developing",
        therapeutic_approach: "theraplay", staff_trained_attachment: false,
        psychologist_involved: false, child_views: null,
      }),
      makeRecord({
        id: "ar4", child_id: "c3", child_name: "Carol",
        attachment_style: "anxious_ambivalent", assessment_status: "under_review",
        relationship_type: "social_worker", relationship_quality: "positive",
        therapeutic_approach: null, staff_trained_attachment: false,
        psychologist_involved: true, child_views: "I want to go home",
      }),
    ];
    const m = computeAttachmentMetrics(records, 5);
    expect(m.total_records).toBe(4);
    expect(m.children_assessed).toBe(3);
    expect(m.assessment_coverage).toBe(60);
    expect(m.secure_count).toBe(2);
    expect(m.anxious_ambivalent_count).toBe(1);
    expect(m.disorganised_count).toBe(1);
    expect(m.current_assessments).toBe(2);
    expect(m.outdated_assessments).toBe(1);
    expect(m.strong_positive_relationships).toBe(1);
    expect(m.strained_or_broken_count).toBe(1);
    expect(m.therapeutic_approach_rate).toBe(50);
    expect(m.psychologist_involved_rate).toBe(50);
    expect(m.staff_trained_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
    expect(m.by_attachment_style["secure"]).toBe(2);
    expect(m.by_attachment_style["disorganised"]).toBe(1);
    expect(m.by_attachment_style["anxious_ambivalent"]).toBe(1);
    expect(m.by_relationship_type["key_worker"]).toBe(1);
    expect(m.by_relationship_type["parent"]).toBe(1);
    expect(m.by_relationship_type["therapist"]).toBe(1);
    expect(m.by_relationship_type["social_worker"]).toBe(1);
    expect(m.by_therapeutic_approach["pace"]).toBe(1);
    expect(m.by_therapeutic_approach["theraplay"]).toBe(1);
  });

  // ── large dataset ───────────────────────────────────────────────────

  it("handles large records array efficiently", () => {
    const records: AttachmentRecord[] = [];
    const styles: AttachmentStyle[] = ["secure", "anxious_ambivalent", "anxious_avoidant", "disorganised", "not_yet_assessed"];
    const types: RelationshipType[] = ["key_worker", "parent", "sibling", "therapist", "teacher", "peer"];
    const qualities: RelationshipQuality[] = ["strong_positive", "positive", "developing", "inconsistent", "strained", "broken"];
    for (let i = 0; i < 100; i++) {
      records.push(
        makeRecord({
          id: `ar-${i}`,
          child_id: `c-${i % 20}`,
          child_name: `Child ${i % 20}`,
          attachment_style: styles[i % 5],
          assessment_status: i % 4 === 0 ? "current" : i % 4 === 1 ? "outdated" : i % 4 === 2 ? "under_review" : "initial",
          relationship_type: types[i % 6],
          relationship_quality: qualities[i % 6],
          therapeutic_approach: i % 3 === 0 ? "pace" : null,
          staff_trained_attachment: i % 3 === 0,
          psychologist_involved: i % 4 === 0,
          child_views: i % 2 === 0 ? "views" : null,
        }),
      );
    }
    const m = computeAttachmentMetrics(records, 25);
    expect(m.total_records).toBe(100);
    expect(m.children_assessed).toBe(20);
    expect(m.assessment_coverage).toBe(80);
  });

  it("totalChildren parameter does not affect per-record metrics", () => {
    const records = [makeRecord({ id: "ar1", child_id: "c1" })];
    const m1 = computeAttachmentMetrics(records, 1);
    const m2 = computeAttachmentMetrics(records, 100);
    expect(m1.total_records).toBe(m2.total_records);
    expect(m1.secure_count).toBe(m2.secure_count);
    expect(m1.staff_trained_rate).toBe(m2.staff_trained_rate);
    expect(m1.therapeutic_approach_rate).toBe(m2.therapeutic_approach_rate);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyAttachmentAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyAttachmentAlerts", () => {
  // ── no alerts when clean ────────────────────────────────────────────

  it("returns empty array for empty records and zero children", () => {
    const alerts = identifyAttachmentAlerts([], 0, now);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all data is clean", () => {
    const records = [
      makeRecord({
        id: "ar1", child_id: "c1", attachment_style: "secure",
        assessment_status: "current", relationship_type: "key_worker",
        relationship_quality: "positive", staff_trained_attachment: true,
        therapeutic_approach: "pace", next_review_date: daysFromNow(30),
      }),
      makeRecord({
        id: "ar2", child_id: "c2", attachment_style: "secure",
        assessment_status: "current", relationship_type: "key_worker",
        relationship_quality: "strong_positive", staff_trained_attachment: true,
        next_review_date: daysFromNow(60),
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 2, now);
    expect(alerts).toEqual([]);
  });

  // ── no_assessment alert (children without assessment) ──────────────

  it("generates no_assessment alert when children lack assessments", () => {
    const alerts = identifyAttachmentAlerts([], 3, now);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("no_assessment");
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].id).toBe("assessment_gap");
  });

  it("no_assessment alert includes correct gap count for 1 child", () => {
    const alerts = identifyAttachmentAlerts([], 1, now);
    expect(alerts[0].message).toContain("1");
    expect(alerts[0].message).toContain("child has");
  });

  it("no_assessment alert uses plural for multiple children", () => {
    const alerts = identifyAttachmentAlerts([], 5, now);
    expect(alerts[0].message).toContain("5");
    expect(alerts[0].message).toContain("children have");
  });

  it("no_assessment alert counts only unassessed children", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1" }),
    ];
    const alerts = identifyAttachmentAlerts(records, 4, now);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap).toBeTruthy();
    expect(gap!.message).toContain("3");
  });

  it("no no_assessment alert when all children have assessments", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1" }),
      makeRecord({ id: "ar2", child_id: "c2" }),
    ];
    const alerts = identifyAttachmentAlerts(records, 2, now);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap).toBeUndefined();
  });

  it("no no_assessment alert when totalChildren is 0", () => {
    const alerts = identifyAttachmentAlerts([], 0, now);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap).toBeUndefined();
  });

  it("no_assessment alert gap is exact difference between total and assessed", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1" }),
      makeRecord({ id: "ar2", child_id: "c2" }),
    ];
    const alerts = identifyAttachmentAlerts(records, 7, now);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap!.message).toContain("5");
    expect(gap!.message).toContain("children have");
  });

  it("no_assessment alert counts unique children, not records", () => {
    const records = [
      makeRecord({ id: "ar1", child_id: "c1", relationship_type: "key_worker" }),
      makeRecord({ id: "ar2", child_id: "c1", relationship_type: "parent" }),
    ];
    const alerts = identifyAttachmentAlerts(records, 3, now);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap).toBeTruthy();
    expect(gap!.message).toContain("2");
  });

  it("no_assessment alert message mentions assess attachment style", () => {
    const alerts = identifyAttachmentAlerts([], 2, now);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap!.message).toContain("assess attachment style");
  });

  // ── disorganised_no_therapy alert ──────────────────────────────────

  it("generates disorganised_no_therapy alert for disorganised without therapeutic approach", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice", attachment_style: "disorganised",
        therapeutic_approach: null,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const disorg = alerts.find((a) => a.type === "disorganised_no_therapy");
    expect(disorg).toBeTruthy();
    expect(disorg!.severity).toBe("critical");
    expect(disorg!.id).toBe("ar1");
  });

  it("disorganised_no_therapy alert includes child name", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Bob Jones", attachment_style: "disorganised",
        therapeutic_approach: null,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const disorg = alerts.find((a) => a.type === "disorganised_no_therapy");
    expect(disorg!.message).toContain("Bob Jones");
  });

  it("disorganised_no_therapy alert mentions specialist input", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice", attachment_style: "disorganised",
        therapeutic_approach: null,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const disorg = alerts.find((a) => a.type === "disorganised_no_therapy");
    expect(disorg!.message).toContain("specialist input");
  });

  it("no disorganised_no_therapy alert when disorganised has therapeutic approach", () => {
    const records = [
      makeRecord({
        id: "ar1", attachment_style: "disorganised",
        therapeutic_approach: "theraplay",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const disorg = alerts.find((a) => a.type === "disorganised_no_therapy");
    expect(disorg).toBeUndefined();
  });

  it("no disorganised_no_therapy alert for secure with no therapeutic approach", () => {
    const records = [
      makeRecord({
        id: "ar1", attachment_style: "secure",
        therapeutic_approach: null,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const disorg = alerts.find((a) => a.type === "disorganised_no_therapy");
    expect(disorg).toBeUndefined();
  });

  it("no disorganised_no_therapy alert for anxious_ambivalent with no therapeutic approach", () => {
    const records = [
      makeRecord({
        id: "ar1", attachment_style: "anxious_ambivalent",
        therapeutic_approach: null,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const disorg = alerts.find((a) => a.type === "disorganised_no_therapy");
    expect(disorg).toBeUndefined();
  });

  it("generates multiple disorganised_no_therapy alerts for different records", () => {
    const records = [
      makeRecord({ id: "ar1", child_name: "Alice", attachment_style: "disorganised", therapeutic_approach: null }),
      makeRecord({ id: "ar2", child_name: "Bob", attachment_style: "disorganised", therapeutic_approach: null }),
      makeRecord({ id: "ar3", child_name: "Carol", attachment_style: "disorganised", therapeutic_approach: "pace" }),
    ];
    const alerts = identifyAttachmentAlerts(records, 3, now);
    const disorg = alerts.filter((a) => a.type === "disorganised_no_therapy");
    expect(disorg).toHaveLength(2);
  });

  it("disorganised_no_therapy alert is cleared by any therapeutic approach", () => {
    const approaches: TherapeuticApproach[] = [
      "pace", "dan_hughes", "theraplay", "dyadic_developmental",
      "nurture_group", "team_around_child", "life_story_work",
      "play_therapy", "art_therapy", "emdr", "cbt", "other",
    ];
    for (const approach of approaches) {
      const records = [
        makeRecord({ id: "ar1", attachment_style: "disorganised", therapeutic_approach: approach }),
      ];
      const alerts = identifyAttachmentAlerts(records, 1, now);
      const disorg = alerts.find((a) => a.type === "disorganised_no_therapy");
      expect(disorg).toBeUndefined();
    }
  });

  // ── key_worker_strained alert ──────────────────────────────────────

  it("generates key_worker_strained alert for strained key worker relationship", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice", relationship_type: "key_worker",
        relationship_person: "Jane Doe", relationship_quality: "strained",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw).toBeTruthy();
    expect(kw!.severity).toBe("high");
    expect(kw!.id).toBe("ar1");
  });

  it("generates key_worker_strained alert for broken key worker relationship", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Bob", relationship_type: "key_worker",
        relationship_person: "John Smith", relationship_quality: "broken",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw).toBeTruthy();
    expect(kw!.severity).toBe("high");
  });

  it("key_worker_strained alert includes child name", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Carol Davies", relationship_type: "key_worker",
        relationship_person: "Jane Doe", relationship_quality: "strained",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw!.message).toContain("Carol Davies");
  });

  it("key_worker_strained alert includes relationship person name", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice", relationship_type: "key_worker",
        relationship_person: "Jane Doe", relationship_quality: "strained",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw!.message).toContain("Jane Doe");
  });

  it("key_worker_strained alert includes the quality level", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice", relationship_type: "key_worker",
        relationship_person: "Jane Doe", relationship_quality: "strained",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw!.message).toContain("strained");
  });

  it("key_worker_strained alert mentions review key worker allocation", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice", relationship_type: "key_worker",
        relationship_person: "Jane Doe", relationship_quality: "broken",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw!.message).toContain("review key worker allocation");
  });

  it("no key_worker_strained alert when key_worker relationship is positive", () => {
    const records = [
      makeRecord({
        id: "ar1", relationship_type: "key_worker",
        relationship_quality: "positive",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw).toBeUndefined();
  });

  it("no key_worker_strained alert when key_worker relationship is strong_positive", () => {
    const records = [
      makeRecord({
        id: "ar1", relationship_type: "key_worker",
        relationship_quality: "strong_positive",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw).toBeUndefined();
  });

  it("no key_worker_strained alert when key_worker relationship is developing", () => {
    const records = [
      makeRecord({
        id: "ar1", relationship_type: "key_worker",
        relationship_quality: "developing",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw).toBeUndefined();
  });

  it("no key_worker_strained alert when key_worker relationship is inconsistent", () => {
    const records = [
      makeRecord({
        id: "ar1", relationship_type: "key_worker",
        relationship_quality: "inconsistent",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw).toBeUndefined();
  });

  it("no key_worker_strained alert for non-key_worker strained relationship", () => {
    const records = [
      makeRecord({
        id: "ar1", relationship_type: "parent",
        relationship_quality: "strained",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw).toBeUndefined();
  });

  it("generates multiple key_worker_strained alerts for different records", () => {
    const records = [
      makeRecord({ id: "ar1", child_name: "Alice", relationship_type: "key_worker", relationship_person: "Jane", relationship_quality: "strained" }),
      makeRecord({ id: "ar2", child_name: "Bob", relationship_type: "key_worker", relationship_person: "John", relationship_quality: "broken" }),
      makeRecord({ id: "ar3", child_name: "Carol", relationship_type: "key_worker", relationship_person: "Mary", relationship_quality: "positive" }),
    ];
    const alerts = identifyAttachmentAlerts(records, 3, now);
    const kw = alerts.filter((a) => a.type === "key_worker_strained");
    expect(kw).toHaveLength(2);
  });

  // ── staff_not_trained alert ────────────────────────────────────────

  it("generates staff_not_trained alert for anxious_ambivalent with untrained staff", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice", attachment_style: "anxious_ambivalent",
        staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeTruthy();
    expect(untrained!.severity).toBe("high");
    expect(untrained!.id).toBe("ar1");
  });

  it("generates staff_not_trained alert for anxious_avoidant with untrained staff", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Bob", attachment_style: "anxious_avoidant",
        staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeTruthy();
    expect(untrained!.severity).toBe("high");
  });

  it("generates staff_not_trained alert for disorganised with untrained staff", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Carol", attachment_style: "disorganised",
        staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeTruthy();
    expect(untrained!.severity).toBe("high");
  });

  it("staff_not_trained alert includes child name", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Carol Davies",
        attachment_style: "anxious_ambivalent", staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained!.message).toContain("Carol Davies");
  });

  it("staff_not_trained alert includes attachment style in message", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice",
        attachment_style: "anxious_ambivalent", staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained!.message).toContain("anxious ambivalent");
  });

  it("staff_not_trained alert mentions training required", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice",
        attachment_style: "disorganised", staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained!.message).toContain("training required");
  });

  it("no staff_not_trained alert when staff is trained on anxious_ambivalent", () => {
    const records = [
      makeRecord({
        id: "ar1", attachment_style: "anxious_ambivalent", staff_trained_attachment: true,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeUndefined();
  });

  it("no staff_not_trained alert when staff is trained on disorganised", () => {
    const records = [
      makeRecord({
        id: "ar1", attachment_style: "disorganised", staff_trained_attachment: true,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeUndefined();
  });

  it("no staff_not_trained alert for secure even when untrained", () => {
    const records = [
      makeRecord({
        id: "ar1", attachment_style: "secure", staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeUndefined();
  });

  it("no staff_not_trained alert for not_yet_assessed even when untrained", () => {
    const records = [
      makeRecord({
        id: "ar1", attachment_style: "not_yet_assessed", staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeUndefined();
  });

  it("generates multiple staff_not_trained alerts for different records", () => {
    const records = [
      makeRecord({ id: "ar1", child_name: "Alice", attachment_style: "anxious_ambivalent", staff_trained_attachment: false }),
      makeRecord({ id: "ar2", child_name: "Bob", attachment_style: "disorganised", staff_trained_attachment: false }),
      makeRecord({ id: "ar3", child_name: "Carol", attachment_style: "anxious_avoidant", staff_trained_attachment: false }),
    ];
    const alerts = identifyAttachmentAlerts(records, 3, now);
    const untrained = alerts.filter((a) => a.type === "staff_not_trained");
    expect(untrained).toHaveLength(3);
  });

  // ── review_overdue alert ───────────────────────────────────────────

  it("generates review_overdue alert when next_review_date is in the past", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice",
        next_review_date: daysAgo(10),
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("medium");
    expect(overdue!.id).toBe("ar1");
  });

  it("review_overdue alert includes child name", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Bob Jones",
        next_review_date: daysAgo(5),
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue!.message).toContain("Bob Jones");
  });

  it("review_overdue alert includes the overdue date in message", () => {
    const pastDate = daysAgo(15);
    const records = [
      makeRecord({ id: "ar1", next_review_date: pastDate }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue!.message).toContain(pastDate);
  });

  it("no review_overdue alert when next_review_date is in the future", () => {
    const records = [
      makeRecord({ id: "ar1", next_review_date: daysFromNow(30) }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("no review_overdue alert when next_review_date is null", () => {
    const records = [
      makeRecord({ id: "ar1", next_review_date: null }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("generates multiple review_overdue alerts for different records", () => {
    const records = [
      makeRecord({ id: "ar1", child_name: "Alice", next_review_date: daysAgo(5) }),
      makeRecord({ id: "ar2", child_name: "Bob", next_review_date: daysAgo(20) }),
      makeRecord({ id: "ar3", child_name: "Carol", next_review_date: daysFromNow(10) }),
    ];
    const alerts = identifyAttachmentAlerts(records, 3, now);
    const overdue = alerts.filter((a) => a.type === "review_overdue");
    expect(overdue).toHaveLength(2);
  });

  it("review_overdue uses the now parameter for comparison", () => {
    const futureNow = new Date(daysFromNow(60));
    const records = [
      makeRecord({ id: "ar1", next_review_date: daysFromNow(30) }),
    ];
    const alertsDefault = identifyAttachmentAlerts(records, 1, now);
    expect(alertsDefault.find((a) => a.type === "review_overdue")).toBeUndefined();
    const alertsFuture = identifyAttachmentAlerts(records, 1, futureNow);
    expect(alertsFuture.find((a) => a.type === "review_overdue")).toBeTruthy();
  });

  it("review_overdue with date exactly yesterday", () => {
    const records = [
      makeRecord({ id: "ar1", next_review_date: daysAgo(1) }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeTruthy();
  });

  it("review_overdue with date far in the future", () => {
    const records = [
      makeRecord({ id: "ar1", next_review_date: daysFromNow(365) }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  // ── combined alerts ────────────────────────────────────────────────

  it("generates all alert types together when conditions are met", () => {
    const records = [
      makeRecord({
        id: "ar1", child_id: "c1", child_name: "Alice",
        attachment_style: "disorganised", therapeutic_approach: null,
        relationship_type: "key_worker", relationship_person: "Jane Doe",
        relationship_quality: "strained", staff_trained_attachment: false,
        next_review_date: daysAgo(10),
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 3, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("no_assessment");
    expect(types).toContain("disorganised_no_therapy");
    expect(types).toContain("key_worker_strained");
    expect(types).toContain("staff_not_trained");
    expect(types).toContain("review_overdue");
  });

  it("all five alert types appear simultaneously", () => {
    const records = [
      makeRecord({
        id: "ar1", child_id: "c1", child_name: "Alice",
        attachment_style: "disorganised", therapeutic_approach: null,
        relationship_type: "key_worker", relationship_person: "Jane",
        relationship_quality: "broken", staff_trained_attachment: false,
        next_review_date: daysAgo(30),
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 3, now);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("no_assessment")).toBe(true);
    expect(types.has("disorganised_no_therapy")).toBe(true);
    expect(types.has("key_worker_strained")).toBe(true);
    expect(types.has("staff_not_trained")).toBe(true);
    expect(types.has("review_overdue")).toBe(true);
    expect(types.size).toBe(5);
  });

  it("alert severity values are correct types", () => {
    const records = [
      makeRecord({
        id: "ar1", child_id: "c1", child_name: "Alice",
        attachment_style: "disorganised", therapeutic_approach: null,
        relationship_type: "key_worker", relationship_quality: "strained",
        staff_trained_attachment: false, next_review_date: daysAgo(5),
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 2, now);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const records = [
      makeRecord({
        id: "ar1", child_id: "c1", child_name: "Alice",
        attachment_style: "disorganised", therapeutic_approach: null,
        relationship_type: "key_worker", relationship_quality: "strained",
        staff_trained_attachment: false, next_review_date: daysAgo(5),
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 2, now);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const records = [
      makeRecord({
        id: "ar1", attachment_style: "disorganised",
        therapeutic_approach: null, staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 2, now);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const records = [
      makeRecord({
        id: "ar1", attachment_style: "disorganised",
        therapeutic_approach: null, staff_trained_attachment: false,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 2, now);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });

  it("disorganised_no_therapy is the only critical severity alert", () => {
    const records = [
      makeRecord({
        id: "ar1", child_id: "c1", child_name: "Alice",
        attachment_style: "disorganised", therapeutic_approach: null,
        relationship_type: "key_worker", relationship_quality: "strained",
        staff_trained_attachment: false, next_review_date: daysAgo(5),
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 2, now);
    const criticals = alerts.filter((a) => a.severity === "critical");
    expect(criticals).toHaveLength(1);
    expect(criticals[0].type).toBe("disorganised_no_therapy");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listRecords ─────────────────────────────────────────────────────

  it("listRecords returns ok: true with empty array", async () => {
    const result = await listRecords("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with childId filter", async () => {
    const result = await listRecords("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with attachmentStyle filter", async () => {
    const result = await listRecords("home-1", { attachmentStyle: "secure" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with relationshipType filter", async () => {
    const result = await listRecords("home-1", { relationshipType: "key_worker" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with assessmentStatus filter", async () => {
    const result = await listRecords("home-1", { assessmentStatus: "current" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with limit filter", async () => {
    const result = await listRecords("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with all filters combined", async () => {
    const result = await listRecords("home-1", {
      childId: "child-1",
      attachmentStyle: "disorganised",
      relationshipType: "therapist",
      assessmentStatus: "under_review",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createRecord ────────────────────────────────────────────────────

  it("createRecord returns ok: false with error message", async () => {
    const result = await createRecord({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      attachmentStyle: "secure",
      assessedBy: "staff-1",
      assessedDate: daysAgo(1),
      assessmentStatus: "current",
      relationshipType: "key_worker",
      relationshipPerson: "Jane Doe",
      relationshipQuality: "positive",
      staffTrainedAttachment: true,
      psychologistInvolved: false,
      keyTriggers: ["transitions"],
      calmingStrategies: ["deep breathing"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createRecord error message is a string", async () => {
    const result = await createRecord({
      homeId: "home-1",
      childName: "Bob Jones",
      childId: "child-2",
      attachmentStyle: "disorganised",
      assessedBy: "staff-2",
      assessedDate: daysAgo(3),
      assessmentStatus: "current",
      nextReviewDate: daysFromNow(90),
      relationshipType: "therapist",
      relationshipPerson: "Dr Smith",
      relationshipQuality: "developing",
      therapeuticApproach: "theraplay",
      approachStartDate: daysAgo(30),
      progressNotes: "Good progress noted",
      childViews: "I like playing",
      staffTrainedAttachment: true,
      psychologistInvolved: true,
      keyTriggers: ["rejection", "separation"],
      calmingStrategies: ["weighted blanket", "quiet space"],
      notes: "Reviewed weekly",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateRecord ────────────────────────────────────────────────────

  it("updateRecord returns ok: false with error message", async () => {
    const result = await updateRecord("ar-1", { assessment_status: "current" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateRecord error message is a string for partial updates", async () => {
    const result = await updateRecord("ar-1", {
      attachment_style: "secure",
      notes: "Reassessed",
      staff_trained_attachment: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computeAttachmentMetrics with records from a single child across all 12 relationship types", () => {
    const types: RelationshipType[] = [
      "key_worker", "parent", "sibling", "extended_family", "foster_carer",
      "social_worker", "therapist", "teacher", "peer", "mentor",
      "other_professional", "other",
    ];
    const records = types.map((type, i) =>
      makeRecord({
        id: `ar-${i}`,
        child_id: "c1",
        child_name: "Alice",
        relationship_type: type,
      }),
    );
    const m = computeAttachmentMetrics(records, 1);
    expect(m.total_records).toBe(12);
    expect(m.children_assessed).toBe(1);
    expect(Object.keys(m.by_relationship_type)).toHaveLength(12);
  });

  it("computeAttachmentMetrics with all records at secure attachment", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "secure" }),
      makeRecord({ id: "ar2", attachment_style: "secure", child_id: "c2" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.secure_count).toBe(2);
    expect(m.anxious_ambivalent_count).toBe(0);
    expect(m.anxious_avoidant_count).toBe(0);
    expect(m.disorganised_count).toBe(0);
    expect(m.not_assessed_count).toBe(0);
  });

  it("computeAttachmentMetrics with all records at disorganised", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "disorganised" }),
      makeRecord({ id: "ar2", attachment_style: "disorganised", child_id: "c2" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.disorganised_count).toBe(2);
    expect(m.secure_count).toBe(0);
  });

  it("computeAttachmentMetrics all records outdated", () => {
    const records = [
      makeRecord({ id: "ar1", assessment_status: "outdated" }),
      makeRecord({ id: "ar2", assessment_status: "outdated", child_id: "c2" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.outdated_assessments).toBe(2);
    expect(m.current_assessments).toBe(0);
  });

  it("computeAttachmentMetrics by_attachment_style matches individual counts", () => {
    const records = [
      makeRecord({ id: "ar1", attachment_style: "secure" }),
      makeRecord({ id: "ar2", attachment_style: "anxious_ambivalent" }),
      makeRecord({ id: "ar3", attachment_style: "anxious_avoidant" }),
      makeRecord({ id: "ar4", attachment_style: "disorganised" }),
      makeRecord({ id: "ar5", attachment_style: "not_yet_assessed" }),
    ];
    const m = computeAttachmentMetrics(records, 5);
    expect(m.by_attachment_style["secure"]).toBe(m.secure_count);
    expect(m.by_attachment_style["anxious_ambivalent"]).toBe(m.anxious_ambivalent_count);
    expect(m.by_attachment_style["anxious_avoidant"]).toBe(m.anxious_avoidant_count);
    expect(m.by_attachment_style["disorganised"]).toBe(m.disorganised_count);
    expect(m.by_attachment_style["not_yet_assessed"]).toBe(m.not_assessed_count);
  });

  it("computeAttachmentMetrics with mixed rates combinations", () => {
    const records = [
      makeRecord({ id: "ar1", staff_trained_attachment: true, psychologist_involved: true, child_views: "Yes", therapeutic_approach: "pace" }),
      makeRecord({ id: "ar2", staff_trained_attachment: false, psychologist_involved: true, child_views: "Yes", therapeutic_approach: null }),
      makeRecord({ id: "ar3", staff_trained_attachment: true, psychologist_involved: false, child_views: null, therapeutic_approach: null }),
      makeRecord({ id: "ar4", staff_trained_attachment: false, psychologist_involved: false, child_views: null, therapeutic_approach: null }),
    ];
    const m = computeAttachmentMetrics(records, 4);
    expect(m.staff_trained_rate).toBe(50);
    expect(m.psychologist_involved_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
    expect(m.therapeutic_approach_rate).toBe(25);
  });

  it("computeAttachmentMetrics all 12 therapeutic approaches represented", () => {
    const approaches: TherapeuticApproach[] = [
      "pace", "dan_hughes", "theraplay", "dyadic_developmental",
      "nurture_group", "team_around_child", "life_story_work",
      "play_therapy", "art_therapy", "emdr", "cbt", "other",
    ];
    const records = approaches.map((a, i) =>
      makeRecord({ id: `ar${i}`, therapeutic_approach: a }),
    );
    const m = computeAttachmentMetrics(records, 12);
    expect(Object.keys(m.by_therapeutic_approach)).toHaveLength(12);
    for (const approach of approaches) {
      expect(m.by_therapeutic_approach[approach]).toBe(1);
    }
  });

  it("computeAttachmentMetrics by_relationship_quality with single quality", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "broken" }),
      makeRecord({ id: "ar2", relationship_quality: "broken", child_id: "c2" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(Object.keys(m.by_relationship_quality)).toHaveLength(1);
    expect(m.by_relationship_quality["broken"]).toBe(2);
  });

  it("identifyAttachmentAlerts empty records with 0 totalChildren produces no alerts", () => {
    const alerts = identifyAttachmentAlerts([], 0, now);
    expect(alerts).toHaveLength(0);
  });

  it("identifyAttachmentAlerts staff_not_trained only for non-secure non-unassessed styles", () => {
    const styles: AttachmentStyle[] = ["secure", "anxious_ambivalent", "anxious_avoidant", "disorganised", "not_yet_assessed"];
    const records = styles.map((style, i) =>
      makeRecord({ id: `ar${i}`, attachment_style: style, staff_trained_attachment: false }),
    );
    const alerts = identifyAttachmentAlerts(records, 5, now);
    const untrained = alerts.filter((a) => a.type === "staff_not_trained");
    expect(untrained).toHaveLength(3);
    const ids = untrained.map((a) => a.id);
    expect(ids).toContain("ar1"); // anxious_ambivalent
    expect(ids).toContain("ar2"); // anxious_avoidant
    expect(ids).toContain("ar3"); // disorganised
  });

  it("identifyAttachmentAlerts disorganised_no_therapy only for disorganised style", () => {
    const styles: AttachmentStyle[] = ["secure", "anxious_ambivalent", "anxious_avoidant", "disorganised", "not_yet_assessed"];
    const records = styles.map((style, i) =>
      makeRecord({ id: `ar${i}`, attachment_style: style, therapeutic_approach: null }),
    );
    const alerts = identifyAttachmentAlerts(records, 5, now);
    const disorg = alerts.filter((a) => a.type === "disorganised_no_therapy");
    expect(disorg).toHaveLength(1);
    expect(disorg[0].id).toBe("ar3"); // disorganised
  });

  it("identifyAttachmentAlerts key_worker_strained only for key_worker type", () => {
    const types: RelationshipType[] = ["key_worker", "parent", "sibling", "therapist", "teacher", "peer"];
    const records = types.map((type, i) =>
      makeRecord({ id: `ar${i}`, relationship_type: type, relationship_quality: "strained" }),
    );
    const alerts = identifyAttachmentAlerts(records, 6, now);
    const kw = alerts.filter((a) => a.type === "key_worker_strained");
    expect(kw).toHaveLength(1);
    expect(kw[0].id).toBe("ar0"); // key_worker
  });

  it("computeAttachmentMetrics assessment_coverage with 1 child in 3 totalChildren", () => {
    const records = [makeRecord({ id: "ar1", child_id: "c1" })];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.assessment_coverage).toBe(33.3);
  });

  it("computeAttachmentMetrics staff_trained_rate 100 with single trained record", () => {
    const records = [makeRecord({ id: "ar1", staff_trained_attachment: true })];
    const m = computeAttachmentMetrics(records, 1);
    expect(m.staff_trained_rate).toBe(100);
  });

  it("computeAttachmentMetrics psychologist_involved_rate 100 with single record", () => {
    const records = [makeRecord({ id: "ar1", psychologist_involved: true })];
    const m = computeAttachmentMetrics(records, 1);
    expect(m.psychologist_involved_rate).toBe(100);
  });

  it("computeAttachmentMetrics child_views_rate 100 with single record having views", () => {
    const records = [makeRecord({ id: "ar1", child_views: "My views" })];
    const m = computeAttachmentMetrics(records, 1);
    expect(m.child_views_rate).toBe(100);
  });

  it("computeAttachmentMetrics therapeutic_approach_rate 100 with single record having approach", () => {
    const records = [makeRecord({ id: "ar1", therapeutic_approach: "emdr" })];
    const m = computeAttachmentMetrics(records, 1);
    expect(m.therapeutic_approach_rate).toBe(100);
  });

  it("computeAttachmentMetrics all relationships strained or broken", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "strained" }),
      makeRecord({ id: "ar2", relationship_quality: "broken", child_id: "c2" }),
      makeRecord({ id: "ar3", relationship_quality: "strained", child_id: "c3" }),
    ];
    const m = computeAttachmentMetrics(records, 3);
    expect(m.strained_or_broken_count).toBe(3);
    expect(m.strong_positive_relationships).toBe(0);
  });

  it("computeAttachmentMetrics all relationships strong_positive", () => {
    const records = [
      makeRecord({ id: "ar1", relationship_quality: "strong_positive" }),
      makeRecord({ id: "ar2", relationship_quality: "strong_positive", child_id: "c2" }),
    ];
    const m = computeAttachmentMetrics(records, 2);
    expect(m.strong_positive_relationships).toBe(2);
    expect(m.strained_or_broken_count).toBe(0);
  });

  it("identifyAttachmentAlerts broken key_worker shows broken in message", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice", relationship_type: "key_worker",
        relationship_person: "Jane", relationship_quality: "broken",
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const kw = alerts.find((a) => a.type === "key_worker_strained");
    expect(kw!.message).toContain("broken");
  });

  it("identifyAttachmentAlerts disorganised_no_therapy mentions disorganised attachment", () => {
    const records = [
      makeRecord({
        id: "ar1", child_name: "Alice",
        attachment_style: "disorganised", therapeutic_approach: null,
      }),
    ];
    const alerts = identifyAttachmentAlerts(records, 1, now);
    const disorg = alerts.find((a) => a.type === "disorganised_no_therapy");
    expect(disorg!.message).toContain("disorganised attachment");
  });

  it("identifyAttachmentAlerts no_assessment alert mentions care approach", () => {
    const alerts = identifyAttachmentAlerts([], 2, now);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap!.message).toContain("care approach");
  });
});
