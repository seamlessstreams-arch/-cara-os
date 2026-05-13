// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MULTI-AGENCY WORKING SERVICE TESTS
// Pure-function unit tests for multi-agency metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 5/13, Working Together 2018.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  PROFESSIONAL_ROLES,
  CONTACT_STATUSES,
  LAC_REVIEW_TYPES,
  CONTRIBUTION_METHODS,
  REVIEW_STATUSES,
  MEETING_TYPES,
  MEETING_STATUSES,
  listContacts,
  createContact,
  updateContact,
  listLACReviews,
  createLACReview,
  updateLACReview,
  listMeetings,
  createMeeting,
  updateMeeting,
} from "../multi-agency-service";

import type {
  ProfessionalContact,
  LACReview,
  ProfessionalMeeting,
} from "../multi-agency-service";

const {
  computeMultiAgencyMetrics,
  identifyMultiAgencyAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

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

/** Build a minimal ProfessionalContact with sensible defaults. */
function makeContact(
  overrides: Partial<ProfessionalContact> = {},
): ProfessionalContact {
  return {
    id: "contact-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Smith",
    professional_name: "Dr. Jones",
    role: "social_worker",
    organisation: "Local Authority",
    email: "jones@la.gov.uk",
    phone: "01onal234567",
    is_primary_contact: false,
    relationship_start_date: daysAgo(90),
    last_contact_date: daysAgo(7),
    next_contact_due: daysFromNow(7),
    status: "active",
    notes: null,
    created_at: daysAgoISO(90),
    updated_at: daysAgoISO(7),
    ...overrides,
  };
}

/** Build a minimal LACReview with sensible defaults. */
function makeReview(
  overrides: Partial<LACReview> = {},
): LACReview {
  return {
    id: "review-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Smith",
    review_date: daysAgo(10),
    review_type: "subsequent",
    chaired_by: "IRO Name",
    venue: "Council Offices",
    child_attended: true,
    child_contributed: true,
    contribution_method: "attended_in_person",
    care_plan_agreed: true,
    placement_confirmed: true,
    key_decisions: [],
    actions: [],
    next_review_date: daysFromNow(90),
    next_review_type: "subsequent",
    home_report_submitted: true,
    home_report_submitted_date: daysAgo(17),
    status: "completed",
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(10),
    ...overrides,
  };
}

/** Build a minimal ProfessionalMeeting with sensible defaults. */
function makeMeeting(
  overrides: Partial<ProfessionalMeeting> = {},
): ProfessionalMeeting {
  return {
    id: "meeting-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Smith",
    meeting_date: daysAgo(5),
    meeting_type: "professionals_meeting",
    purpose: "Review progress",
    location: "Home Office",
    attendees: [],
    apologies: [],
    home_representative: "Manager Name",
    key_decisions: [],
    actions: [],
    follow_up_date: daysFromNow(14),
    follow_up_completed: false,
    status: "completed",
    notes: null,
    created_at: daysAgoISO(10),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("PROFESSIONAL_ROLES", () => {
  it("has exactly 18 roles", () => {
    expect(PROFESSIONAL_ROLES).toHaveLength(18);
  });

  it("contains unique role values", () => {
    const roles = PROFESSIONAL_ROLES.map((r) => r.role);
    expect(new Set(roles).size).toBe(roles.length);
  });

  it("contains unique label values", () => {
    const labels = PROFESSIONAL_ROLES.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes social_worker", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "social_worker")).toBeDefined();
  });

  it("includes irm", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "irm")).toBeDefined();
  });

  it("includes irp", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "irp")).toBeDefined();
  });

  it("includes guardian", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "guardian")).toBeDefined();
  });

  it("includes solicitor", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "solicitor")).toBeDefined();
  });

  it("includes camhs", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "camhs")).toBeDefined();
  });

  it("includes psychologist", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "psychologist")).toBeDefined();
  });

  it("includes gp", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "gp")).toBeDefined();
  });

  it("includes dentist", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "dentist")).toBeDefined();
  });

  it("includes nurse", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "nurse")).toBeDefined();
  });

  it("includes senco", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "senco")).toBeDefined();
  });

  it("includes teacher", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "teacher")).toBeDefined();
  });

  it("includes virtual_school_head", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "virtual_school_head")).toBeDefined();
  });

  it("includes yot_worker", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "yot_worker")).toBeDefined();
  });

  it("includes police_liaison", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "police_liaison")).toBeDefined();
  });

  it("includes housing_officer", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "housing_officer")).toBeDefined();
  });

  it("includes employment_advisor", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "employment_advisor")).toBeDefined();
  });

  it("includes other", () => {
    expect(PROFESSIONAL_ROLES.find((r) => r.role === "other")).toBeDefined();
  });

  it("every entry has both role and label", () => {
    for (const entry of PROFESSIONAL_ROLES) {
      expect(entry.role).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("CONTACT_STATUSES", () => {
  it("has exactly 3 statuses", () => {
    expect(CONTACT_STATUSES).toHaveLength(3);
  });

  it("contains unique status values", () => {
    const statuses = CONTACT_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = CONTACT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes active", () => {
    expect(CONTACT_STATUSES.find((s) => s.status === "active")).toBeDefined();
  });

  it("includes inactive", () => {
    expect(CONTACT_STATUSES.find((s) => s.status === "inactive")).toBeDefined();
  });

  it("includes changed", () => {
    expect(CONTACT_STATUSES.find((s) => s.status === "changed")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of CONTACT_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("LAC_REVIEW_TYPES", () => {
  it("has exactly 5 types", () => {
    expect(LAC_REVIEW_TYPES).toHaveLength(5);
  });

  it("contains unique type values", () => {
    const types = LAC_REVIEW_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = LAC_REVIEW_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes initial", () => {
    expect(LAC_REVIEW_TYPES.find((t) => t.type === "initial")).toBeDefined();
  });

  it("includes second", () => {
    expect(LAC_REVIEW_TYPES.find((t) => t.type === "second")).toBeDefined();
  });

  it("includes subsequent", () => {
    expect(LAC_REVIEW_TYPES.find((t) => t.type === "subsequent")).toBeDefined();
  });

  it("includes interim", () => {
    expect(LAC_REVIEW_TYPES.find((t) => t.type === "interim")).toBeDefined();
  });

  it("includes emergency", () => {
    expect(LAC_REVIEW_TYPES.find((t) => t.type === "emergency")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of LAC_REVIEW_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("CONTRIBUTION_METHODS", () => {
  it("has exactly 5 methods", () => {
    expect(CONTRIBUTION_METHODS).toHaveLength(5);
  });

  it("contains unique method values", () => {
    const methods = CONTRIBUTION_METHODS.map((m) => m.method);
    expect(new Set(methods).size).toBe(methods.length);
  });

  it("contains unique label values", () => {
    const labels = CONTRIBUTION_METHODS.map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes attended_in_person", () => {
    expect(CONTRIBUTION_METHODS.find((m) => m.method === "attended_in_person")).toBeDefined();
  });

  it("includes attended_virtually", () => {
    expect(CONTRIBUTION_METHODS.find((m) => m.method === "attended_virtually")).toBeDefined();
  });

  it("includes written_views", () => {
    expect(CONTRIBUTION_METHODS.find((m) => m.method === "written_views")).toBeDefined();
  });

  it("includes advocate_represented", () => {
    expect(CONTRIBUTION_METHODS.find((m) => m.method === "advocate_represented")).toBeDefined();
  });

  it("includes chose_not_participate", () => {
    expect(CONTRIBUTION_METHODS.find((m) => m.method === "chose_not_participate")).toBeDefined();
  });

  it("every entry has both method and label", () => {
    for (const entry of CONTRIBUTION_METHODS) {
      expect(entry.method).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("REVIEW_STATUSES", () => {
  it("has exactly 4 statuses", () => {
    expect(REVIEW_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const statuses = REVIEW_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = REVIEW_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes scheduled", () => {
    expect(REVIEW_STATUSES.find((s) => s.status === "scheduled")).toBeDefined();
  });

  it("includes completed", () => {
    expect(REVIEW_STATUSES.find((s) => s.status === "completed")).toBeDefined();
  });

  it("includes cancelled", () => {
    expect(REVIEW_STATUSES.find((s) => s.status === "cancelled")).toBeDefined();
  });

  it("includes rescheduled", () => {
    expect(REVIEW_STATUSES.find((s) => s.status === "rescheduled")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of REVIEW_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("MEETING_TYPES", () => {
  it("has exactly 9 types", () => {
    expect(MEETING_TYPES).toHaveLength(9);
  });

  it("contains unique type values", () => {
    const types = MEETING_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = MEETING_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes strategy_meeting", () => {
    expect(MEETING_TYPES.find((t) => t.type === "strategy_meeting")).toBeDefined();
  });

  it("includes child_protection_conference", () => {
    expect(MEETING_TYPES.find((t) => t.type === "child_protection_conference")).toBeDefined();
  });

  it("includes mace", () => {
    expect(MEETING_TYPES.find((t) => t.type === "mace")).toBeDefined();
  });

  it("includes pep_meeting", () => {
    expect(MEETING_TYPES.find((t) => t.type === "pep_meeting")).toBeDefined();
  });

  it("includes professionals_meeting", () => {
    expect(MEETING_TYPES.find((t) => t.type === "professionals_meeting")).toBeDefined();
  });

  it("includes network_meeting", () => {
    expect(MEETING_TYPES.find((t) => t.type === "network_meeting")).toBeDefined();
  });

  it("includes disruption_meeting", () => {
    expect(MEETING_TYPES.find((t) => t.type === "disruption_meeting")).toBeDefined();
  });

  it("includes placement_planning", () => {
    expect(MEETING_TYPES.find((t) => t.type === "placement_planning")).toBeDefined();
  });

  it("includes other", () => {
    expect(MEETING_TYPES.find((t) => t.type === "other")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of MEETING_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("MEETING_STATUSES", () => {
  it("has exactly 3 statuses", () => {
    expect(MEETING_STATUSES).toHaveLength(3);
  });

  it("contains unique status values", () => {
    const statuses = MEETING_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = MEETING_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes scheduled", () => {
    expect(MEETING_STATUSES.find((s) => s.status === "scheduled")).toBeDefined();
  });

  it("includes completed", () => {
    expect(MEETING_STATUSES.find((s) => s.status === "completed")).toBeDefined();
  });

  it("includes cancelled", () => {
    expect(MEETING_STATUSES.find((s) => s.status === "cancelled")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of MEETING_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeMultiAgencyMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeMultiAgencyMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computeMultiAgencyMetrics([], [], []);
    expect(result.total_contacts).toBe(0);
    expect(result.active_contacts).toBe(0);
    expect(result.children_with_social_worker).toBe(0);
    expect(result.overdue_contacts).toBe(0);
    expect(result.lac_reviews_this_year).toBe(0);
    expect(result.child_participation_rate).toBe(0);
    expect(result.care_plan_agreement_rate).toBe(0);
    expect(result.home_report_submission_rate).toBe(0);
    expect(result.meetings_this_quarter).toBe(0);
    expect(result.by_meeting_type).toEqual({});
    expect(result.follow_up_completion_rate).toBe(0);
  });

  // ── Contact metrics ────────────────────────────────────────────────────

  it("counts total contacts correctly", () => {
    const contacts = [
      makeContact({ id: "c1" }),
      makeContact({ id: "c2" }),
      makeContact({ id: "c3" }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.total_contacts).toBe(3);
  });

  it("counts single contact correctly", () => {
    const contacts = [makeContact({ id: "c1" })];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.total_contacts).toBe(1);
  });

  it("counts active contacts only", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active" }),
      makeContact({ id: "c2", status: "inactive" }),
      makeContact({ id: "c3", status: "active" }),
      makeContact({ id: "c4", status: "changed" }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.active_contacts).toBe(2);
  });

  it("returns 0 active contacts when all inactive", () => {
    const contacts = [
      makeContact({ id: "c1", status: "inactive" }),
      makeContact({ id: "c2", status: "changed" }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.active_contacts).toBe(0);
  });

  it("counts children with active social worker", () => {
    const contacts = [
      makeContact({ id: "c1", child_id: "child-1", role: "social_worker", status: "active" }),
      makeContact({ id: "c2", child_id: "child-2", role: "social_worker", status: "active" }),
      makeContact({ id: "c3", child_id: "child-1", role: "gp", status: "active" }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.children_with_social_worker).toBe(2);
  });

  it("does not count inactive social workers", () => {
    const contacts = [
      makeContact({ id: "c1", child_id: "child-1", role: "social_worker", status: "inactive" }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.children_with_social_worker).toBe(0);
  });

  it("does not count social workers with null child_id", () => {
    const contacts = [
      makeContact({ id: "c1", child_id: null, role: "social_worker", status: "active" }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.children_with_social_worker).toBe(0);
  });

  it("deduplicates children with multiple social workers", () => {
    const contacts = [
      makeContact({ id: "c1", child_id: "child-1", role: "social_worker", status: "active" }),
      makeContact({ id: "c2", child_id: "child-1", role: "social_worker", status: "active" }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.children_with_social_worker).toBe(1);
  });

  it("counts overdue contacts where next_contact_due is in the past", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active", next_contact_due: daysAgo(5) }),
      makeContact({ id: "c2", status: "active", next_contact_due: daysFromNow(5) }),
      makeContact({ id: "c3", status: "active", next_contact_due: daysAgo(10) }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.overdue_contacts).toBe(2);
  });

  it("does not count inactive contacts as overdue", () => {
    const contacts = [
      makeContact({ id: "c1", status: "inactive", next_contact_due: daysAgo(5) }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.overdue_contacts).toBe(0);
  });

  it("does not count contacts with null next_contact_due as overdue", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active", next_contact_due: null }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.overdue_contacts).toBe(0);
  });

  it("returns 0 overdue contacts when all are future dated", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active", next_contact_due: daysFromNow(5) }),
      makeContact({ id: "c2", status: "active", next_contact_due: daysFromNow(14) }),
    ];
    const result = computeMultiAgencyMetrics(contacts, [], []);
    expect(result.overdue_contacts).toBe(0);
  });

  // ── LAC review metrics ─────────────────────────────────────────────────

  it("counts completed reviews this year", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", review_date: daysAgo(10) }),
      makeReview({ id: "r2", status: "completed", review_date: daysAgo(20) }),
      makeReview({ id: "r3", status: "scheduled", review_date: daysAgo(5) }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.lac_reviews_this_year).toBe(2);
  });

  it("excludes reviews from previous years", () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const reviews = [
      makeReview({ id: "r1", status: "completed", review_date: lastYear.toISOString().split("T")[0] }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.lac_reviews_this_year).toBe(0);
  });

  it("returns 0 reviews this year for empty reviews", () => {
    const result = computeMultiAgencyMetrics([], [], []);
    expect(result.lac_reviews_this_year).toBe(0);
  });

  it("computes child participation rate for completed reviews", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", child_contributed: true }),
      makeReview({ id: "r2", status: "completed", child_contributed: false }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.child_participation_rate).toBe(50);
  });

  it("computes 100% child participation when all contributed", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", child_contributed: true }),
      makeReview({ id: "r2", status: "completed", child_contributed: true }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.child_participation_rate).toBe(100);
  });

  it("computes 0% child participation when none contributed", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", child_contributed: false }),
      makeReview({ id: "r2", status: "completed", child_contributed: false }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.child_participation_rate).toBe(0);
  });

  it("returns 0 child participation rate when no completed reviews", () => {
    const reviews = [
      makeReview({ id: "r1", status: "scheduled", child_contributed: true }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.child_participation_rate).toBe(0);
  });

  it("ignores non-completed reviews for participation rate", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", child_contributed: true }),
      makeReview({ id: "r2", status: "cancelled", child_contributed: false }),
      makeReview({ id: "r3", status: "scheduled", child_contributed: false }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.child_participation_rate).toBe(100);
  });

  it("computes care plan agreement rate", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", care_plan_agreed: true }),
      makeReview({ id: "r2", status: "completed", care_plan_agreed: false }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.care_plan_agreement_rate).toBe(50);
  });

  it("computes 100% care plan agreement rate when all agreed", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", care_plan_agreed: true }),
      makeReview({ id: "r2", status: "completed", care_plan_agreed: true }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.care_plan_agreement_rate).toBe(100);
  });

  it("returns 0 care plan agreement rate with no completed reviews", () => {
    const result = computeMultiAgencyMetrics([], [], []);
    expect(result.care_plan_agreement_rate).toBe(0);
  });

  it("computes home report submission rate", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", home_report_submitted: true }),
      makeReview({ id: "r2", status: "completed", home_report_submitted: false }),
      makeReview({ id: "r3", status: "completed", home_report_submitted: true }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    // 2/3 = 66.7%
    expect(result.home_report_submission_rate).toBe(66.7);
  });

  it("computes 100% home report submission rate when all submitted", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", home_report_submitted: true }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.home_report_submission_rate).toBe(100);
  });

  it("computes 0% home report submission rate when none submitted", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", home_report_submitted: false }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    expect(result.home_report_submission_rate).toBe(0);
  });

  it("returns 0 home report submission rate with no completed reviews", () => {
    const result = computeMultiAgencyMetrics([], [], []);
    expect(result.home_report_submission_rate).toBe(0);
  });

  // ── Meeting metrics ────────────────────────────────────────────────────

  it("counts completed meetings this quarter", () => {
    const meetings = [
      makeMeeting({ id: "m1", status: "completed", meeting_date: daysAgo(5) }),
      makeMeeting({ id: "m2", status: "completed", meeting_date: daysAgo(10) }),
      makeMeeting({ id: "m3", status: "scheduled", meeting_date: daysAgo(3) }),
    ];
    const result = computeMultiAgencyMetrics([], [], meetings);
    expect(result.meetings_this_quarter).toBe(2);
  });

  it("returns 0 meetings this quarter for empty meetings", () => {
    const result = computeMultiAgencyMetrics([], [], []);
    expect(result.meetings_this_quarter).toBe(0);
  });

  it("groups completed meetings by type", () => {
    const meetings = [
      makeMeeting({ id: "m1", status: "completed", meeting_type: "strategy_meeting" }),
      makeMeeting({ id: "m2", status: "completed", meeting_type: "strategy_meeting" }),
      makeMeeting({ id: "m3", status: "completed", meeting_type: "pep_meeting" }),
      makeMeeting({ id: "m4", status: "scheduled", meeting_type: "pep_meeting" }),
    ];
    const result = computeMultiAgencyMetrics([], [], meetings);
    expect(result.by_meeting_type).toEqual({
      strategy_meeting: 2,
      pep_meeting: 1,
    });
  });

  it("returns empty by_meeting_type for no completed meetings", () => {
    const meetings = [
      makeMeeting({ id: "m1", status: "scheduled" }),
    ];
    const result = computeMultiAgencyMetrics([], [], meetings);
    expect(result.by_meeting_type).toEqual({});
  });

  it("handles single meeting type across all completed meetings", () => {
    const meetings = [
      makeMeeting({ id: "m1", status: "completed", meeting_type: "network_meeting" }),
      makeMeeting({ id: "m2", status: "completed", meeting_type: "network_meeting" }),
    ];
    const result = computeMultiAgencyMetrics([], [], meetings);
    expect(result.by_meeting_type).toEqual({ network_meeting: 2 });
  });

  it("computes follow-up completion rate for meetings with follow-up dates", () => {
    const meetings = [
      makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: true }),
      makeMeeting({ id: "m2", status: "completed", follow_up_date: daysAgo(3), follow_up_completed: false }),
    ];
    const result = computeMultiAgencyMetrics([], [], meetings);
    expect(result.follow_up_completion_rate).toBe(50);
  });

  it("computes 100% follow-up rate when all completed", () => {
    const meetings = [
      makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: true }),
      makeMeeting({ id: "m2", status: "completed", follow_up_date: daysAgo(3), follow_up_completed: true }),
    ];
    const result = computeMultiAgencyMetrics([], [], meetings);
    expect(result.follow_up_completion_rate).toBe(100);
  });

  it("computes 0% follow-up rate when none completed", () => {
    const meetings = [
      makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: false }),
    ];
    const result = computeMultiAgencyMetrics([], [], meetings);
    expect(result.follow_up_completion_rate).toBe(0);
  });

  it("returns 0 follow-up rate when no meetings have follow-up dates", () => {
    const meetings = [
      makeMeeting({ id: "m1", status: "completed", follow_up_date: null }),
    ];
    const result = computeMultiAgencyMetrics([], [], meetings);
    expect(result.follow_up_completion_rate).toBe(0);
  });

  it("excludes non-completed meetings from follow-up rate", () => {
    const meetings = [
      makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: true }),
      makeMeeting({ id: "m2", status: "scheduled", follow_up_date: daysAgo(3), follow_up_completed: false }),
    ];
    const result = computeMultiAgencyMetrics([], [], meetings);
    expect(result.follow_up_completion_rate).toBe(100);
  });

  // ── Combined scenarios ─────────────────────────────────────────────────

  it("handles mixed contacts, reviews, and meetings together", () => {
    const contacts = [
      makeContact({ id: "c1", status: "active", role: "social_worker", child_id: "child-1", next_contact_due: daysAgo(3) }),
      makeContact({ id: "c2", status: "inactive", role: "gp", child_id: "child-2" }),
      makeContact({ id: "c3", status: "active", role: "teacher", child_id: "child-1" }),
    ];
    const reviews = [
      makeReview({ id: "r1", status: "completed", child_contributed: true, care_plan_agreed: true, home_report_submitted: true, review_date: daysAgo(15) }),
      makeReview({ id: "r2", status: "completed", child_contributed: false, care_plan_agreed: false, home_report_submitted: false, review_date: daysAgo(30) }),
    ];
    const meetings = [
      makeMeeting({ id: "m1", status: "completed", meeting_type: "strategy_meeting", follow_up_date: daysAgo(5), follow_up_completed: true, meeting_date: daysAgo(10) }),
      makeMeeting({ id: "m2", status: "completed", meeting_type: "pep_meeting", follow_up_date: null, meeting_date: daysAgo(20) }),
    ];
    const result = computeMultiAgencyMetrics(contacts, reviews, meetings);
    expect(result.total_contacts).toBe(3);
    expect(result.active_contacts).toBe(2);
    expect(result.children_with_social_worker).toBe(1);
    expect(result.overdue_contacts).toBe(1);
    expect(result.child_participation_rate).toBe(50);
    expect(result.care_plan_agreement_rate).toBe(50);
    expect(result.home_report_submission_rate).toBe(50);
    expect(result.by_meeting_type).toEqual({ strategy_meeting: 1, pep_meeting: 1 });
    expect(result.follow_up_completion_rate).toBe(100);
  });

  it("rounds rates to one decimal place", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", child_contributed: true }),
      makeReview({ id: "r2", status: "completed", child_contributed: true }),
      makeReview({ id: "r3", status: "completed", child_contributed: false }),
    ];
    const result = computeMultiAgencyMetrics([], reviews, []);
    // 2/3 = 66.666... => 66.7
    expect(result.child_participation_rate).toBe(66.7);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyMultiAgencyAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyMultiAgencyAlerts", () => {
  it("returns empty array for empty inputs", () => {
    const alerts = identifyMultiAgencyAlerts([], [], []);
    expect(alerts).toHaveLength(0);
  });

  // ── Missing social worker alerts ─────────────────────────────────────

  describe("missing social worker alerts", () => {
    it("generates critical alert for child without active social worker", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", role: "gp", status: "active" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const missing = alerts.filter((a) => a.type === "missing_social_worker");
      expect(missing).toHaveLength(1);
      expect(missing[0].severity).toBe("critical");
      expect(missing[0].id).toBe("child-1");
    });

    it("does not flag child with active social worker", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", role: "social_worker", status: "active" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const missing = alerts.filter((a) => a.type === "missing_social_worker");
      expect(missing).toHaveLength(0);
    });

    it("flags child with only inactive social worker", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", role: "social_worker", status: "inactive" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const missing = alerts.filter((a) => a.type === "missing_social_worker");
      expect(missing).toHaveLength(1);
    });

    it("discovers child IDs from LAC reviews", () => {
      const reviews = [
        makeReview({ id: "r1", child_id: "child-2", child_name: "Ben Taylor" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const missing = alerts.filter((a) => a.type === "missing_social_worker");
      expect(missing.some((a) => a.id === "child-2")).toBe(true);
    });

    it("discovers child IDs from meetings", () => {
      const meetings = [
        makeMeeting({ id: "m1", child_id: "child-3", child_name: "Charlie Brown" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const missing = alerts.filter((a) => a.type === "missing_social_worker");
      expect(missing.some((a) => a.id === "child-3")).toBe(true);
    });

    it("includes child name in alert message", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", child_name: "Alex Smith", role: "gp", status: "active" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const missing = alerts.find((a) => a.type === "missing_social_worker");
      expect(missing?.message).toContain("Alex Smith");
    });

    it("mentions Reg 5 in missing social worker message", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", role: "gp", status: "active" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const missing = alerts.find((a) => a.type === "missing_social_worker");
      expect(missing?.message).toContain("Reg 5");
    });

    it("does not duplicate alerts for the same child across sources", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", role: "gp", status: "active" }),
      ];
      const reviews = [
        makeReview({ id: "r1", child_id: "child-1" }),
      ];
      const meetings = [
        makeMeeting({ id: "m1", child_id: "child-1" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, reviews, meetings);
      const missing = alerts.filter((a) => a.type === "missing_social_worker" && a.id === "child-1");
      expect(missing).toHaveLength(1);
    });

    it("flags multiple children each missing a social worker", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", role: "gp", status: "active" }),
        makeContact({ id: "c2", child_id: "child-2", role: "teacher", status: "active" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const missing = alerts.filter((a) => a.type === "missing_social_worker");
      expect(missing).toHaveLength(2);
    });

    it("uses Unknown when child name is not available", () => {
      const reviews = [
        makeReview({ id: "r1", child_id: "child-orphan", child_name: "" }),
      ];
      // child_name empty string - contact lookup returns undefined, review returns ""
      // The code checks contactForChild?.child_name ?? reviewForChild?.child_name
      // "" is falsy but not null, so it will be "". Let's use a scenario where name is truly absent.
      const contacts = [
        makeContact({ id: "c1", child_id: "child-orphan", child_name: null, role: "gp", status: "active" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const missing = alerts.find((a) => a.type === "missing_social_worker" && a.id === "child-orphan");
      // Name resolved from contact's child_name (null), so falls to "Unknown"
      expect(missing?.message).toContain("Unknown");
    });
  });

  // ── Social worker contact overdue alerts ─────────────────────────────

  describe("social worker contact overdue alerts", () => {
    it("generates high alert for social worker contact overdue > 14 days", () => {
      const contacts = [
        makeContact({ id: "c1", role: "social_worker", status: "active", next_contact_due: daysAgo(20) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.filter((a) => a.type === "sw_contact_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
      expect(overdue[0].id).toBe("c1");
    });

    it("does not flag social worker contact overdue < 14 days", () => {
      const contacts = [
        makeContact({ id: "c1", role: "social_worker", status: "active", next_contact_due: daysAgo(10) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.filter((a) => a.type === "sw_contact_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag future-dated social worker contact", () => {
      const contacts = [
        makeContact({ id: "c1", role: "social_worker", status: "active", next_contact_due: daysFromNow(5) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.filter((a) => a.type === "sw_contact_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag inactive social worker contacts", () => {
      const contacts = [
        makeContact({ id: "c1", role: "social_worker", status: "inactive", next_contact_due: daysAgo(20) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.filter((a) => a.type === "sw_contact_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag non-social-worker roles", () => {
      const contacts = [
        makeContact({ id: "c1", role: "gp", status: "active", next_contact_due: daysAgo(30) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.filter((a) => a.type === "sw_contact_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag social worker with null next_contact_due", () => {
      const contacts = [
        makeContact({ id: "c1", role: "social_worker", status: "active", next_contact_due: null }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.filter((a) => a.type === "sw_contact_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("includes days overdue in message", () => {
      const contacts = [
        makeContact({ id: "c1", role: "social_worker", status: "active", next_contact_due: daysAgo(20), professional_name: "Ms. Adams" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.find((a) => a.type === "sw_contact_overdue");
      expect(overdue?.message).toContain("20 days overdue");
    });

    it("includes professional name in message", () => {
      const contacts = [
        makeContact({ id: "c1", role: "social_worker", status: "active", next_contact_due: daysAgo(20), professional_name: "Ms. Adams" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.find((a) => a.type === "sw_contact_overdue");
      expect(overdue?.message).toContain("Ms. Adams");
    });

    it("mentions Working Together 2018 in message", () => {
      const contacts = [
        makeContact({ id: "c1", role: "social_worker", status: "active", next_contact_due: daysAgo(20) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.find((a) => a.type === "sw_contact_overdue");
      expect(overdue?.message).toContain("Working Together 2018");
    });

    it("flags multiple overdue social worker contacts", () => {
      const contacts = [
        makeContact({ id: "c1", role: "social_worker", status: "active", next_contact_due: daysAgo(20) }),
        makeContact({ id: "c2", role: "social_worker", status: "active", next_contact_due: daysAgo(30) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, [], []);
      const overdue = alerts.filter((a) => a.type === "sw_contact_overdue");
      expect(overdue).toHaveLength(2);
    });
  });

  // ── No professional contacts alerts ──────────────────────────────────

  describe("no professional contacts alerts", () => {
    it("generates high alert for child with no active professional contacts", () => {
      const reviews = [
        makeReview({ id: "r1", child_id: "child-1", child_name: "Alex Smith" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noContacts = alerts.filter((a) => a.type === "no_professional_contacts");
      expect(noContacts.some((a) => a.id === "child-1")).toBe(true);
      expect(noContacts[0].severity).toBe("high");
    });

    it("does not flag child with active professional contacts", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", status: "active" }),
      ];
      const reviews = [
        makeReview({ id: "r1", child_id: "child-1" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, reviews, []);
      const noContacts = alerts.filter((a) => a.type === "no_professional_contacts" && a.id === "child-1");
      expect(noContacts).toHaveLength(0);
    });

    it("flags child with only inactive contacts", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", status: "inactive" }),
      ];
      const reviews = [
        makeReview({ id: "r1", child_id: "child-1" }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, reviews, []);
      const noContacts = alerts.filter((a) => a.type === "no_professional_contacts" && a.id === "child-1");
      expect(noContacts).toHaveLength(1);
    });

    it("mentions Reg 5 in message", () => {
      const reviews = [
        makeReview({ id: "r1", child_id: "child-1", child_name: "Alex Smith" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noContacts = alerts.find((a) => a.type === "no_professional_contacts");
      expect(noContacts?.message).toContain("Reg 5");
    });

    it("includes child name in message", () => {
      const reviews = [
        makeReview({ id: "r1", child_id: "child-1", child_name: "Alex Smith" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noContacts = alerts.find((a) => a.type === "no_professional_contacts" && a.id === "child-1");
      expect(noContacts?.message).toContain("Alex Smith");
    });
  });

  // ── LAC review overdue alerts ────────────────────────────────────────

  describe("LAC review overdue alerts", () => {
    it("generates critical alert for scheduled review with past date", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysAgo(5), child_name: "Alex Smith" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const overdue = alerts.filter((a) => a.type === "lac_review_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("critical");
      expect(overdue[0].id).toBe("r1");
    });

    it("does not flag completed reviews", () => {
      const reviews = [
        makeReview({ id: "r1", status: "completed", review_date: daysAgo(5) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const overdue = alerts.filter((a) => a.type === "lac_review_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag scheduled review with future date", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysFromNow(5) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const overdue = alerts.filter((a) => a.type === "lac_review_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("includes days overdue in message", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysAgo(10) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const overdue = alerts.find((a) => a.type === "lac_review_overdue");
      expect(overdue?.message).toContain("10 days overdue");
    });

    it("includes child name in message", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysAgo(5), child_name: "Alex Smith" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const overdue = alerts.find((a) => a.type === "lac_review_overdue");
      expect(overdue?.message).toContain("Alex Smith");
    });

    it("flags multiple overdue reviews", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysAgo(5) }),
        makeReview({ id: "r2", status: "scheduled", review_date: daysAgo(10) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const overdue = alerts.filter((a) => a.type === "lac_review_overdue");
      expect(overdue).toHaveLength(2);
    });
  });

  // ── Home report not submitted alerts ─────────────────────────────────

  describe("home report not submitted alerts", () => {
    it("generates high alert when home report not submitted within 7 days of review", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysFromNow(3), home_report_submitted: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noReport = alerts.filter((a) => a.type === "home_report_not_submitted");
      expect(noReport).toHaveLength(1);
      expect(noReport[0].severity).toBe("high");
      expect(noReport[0].id).toBe("r1");
    });

    it("does not flag when home report already submitted", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysFromNow(3), home_report_submitted: true }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noReport = alerts.filter((a) => a.type === "home_report_not_submitted");
      expect(noReport).toHaveLength(0);
    });

    it("does not flag when review is more than 7 days away", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysFromNow(14), home_report_submitted: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noReport = alerts.filter((a) => a.type === "home_report_not_submitted");
      expect(noReport).toHaveLength(0);
    });

    it("does not flag completed reviews", () => {
      const reviews = [
        makeReview({ id: "r1", status: "completed", review_date: daysAgo(3), home_report_submitted: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noReport = alerts.filter((a) => a.type === "home_report_not_submitted");
      expect(noReport).toHaveLength(0);
    });

    it("flags past-dated scheduled review without report (within 7-day window)", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysAgo(2), home_report_submitted: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noReport = alerts.filter((a) => a.type === "home_report_not_submitted");
      expect(noReport).toHaveLength(1);
    });

    it("mentions Reg 13 in message", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysFromNow(3), home_report_submitted: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noReport = alerts.find((a) => a.type === "home_report_not_submitted");
      expect(noReport?.message).toContain("Reg 13");
    });

    it("includes child name in message", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysFromNow(3), home_report_submitted: false, child_name: "Alex Smith" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noReport = alerts.find((a) => a.type === "home_report_not_submitted");
      expect(noReport?.message).toContain("Alex Smith");
    });

    it("includes review date in message", () => {
      const reviewDate = daysFromNow(3);
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: reviewDate, home_report_submitted: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const noReport = alerts.find((a) => a.type === "home_report_not_submitted");
      expect(noReport?.message).toContain(reviewDate);
    });
  });

  // ── Child not participating alerts ───────────────────────────────────

  describe("child not participating alerts", () => {
    it("generates medium alert when child did not contribute to completed review", () => {
      const reviews = [
        makeReview({ id: "r1", status: "completed", child_contributed: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const notParticipating = alerts.filter((a) => a.type === "child_not_participating");
      expect(notParticipating).toHaveLength(1);
      expect(notParticipating[0].severity).toBe("medium");
      expect(notParticipating[0].id).toBe("r1");
    });

    it("does not flag when child contributed", () => {
      const reviews = [
        makeReview({ id: "r1", status: "completed", child_contributed: true }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const notParticipating = alerts.filter((a) => a.type === "child_not_participating");
      expect(notParticipating).toHaveLength(0);
    });

    it("does not flag non-completed reviews", () => {
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", child_contributed: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const notParticipating = alerts.filter((a) => a.type === "child_not_participating");
      expect(notParticipating).toHaveLength(0);
    });

    it("mentions Working Together 2018 in message", () => {
      const reviews = [
        makeReview({ id: "r1", status: "completed", child_contributed: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const notParticipating = alerts.find((a) => a.type === "child_not_participating");
      expect(notParticipating?.message).toContain("Working Together 2018");
    });

    it("includes child name in message", () => {
      const reviews = [
        makeReview({ id: "r1", status: "completed", child_contributed: false, child_name: "Alex Smith" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const notParticipating = alerts.find((a) => a.type === "child_not_participating");
      expect(notParticipating?.message).toContain("Alex Smith");
    });

    it("includes review date in message", () => {
      const reviewDate = daysAgo(5);
      const reviews = [
        makeReview({ id: "r1", status: "completed", child_contributed: false, review_date: reviewDate }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const notParticipating = alerts.find((a) => a.type === "child_not_participating");
      expect(notParticipating?.message).toContain(reviewDate);
    });

    it("flags multiple reviews where children did not participate", () => {
      const reviews = [
        makeReview({ id: "r1", status: "completed", child_contributed: false }),
        makeReview({ id: "r2", status: "completed", child_contributed: false }),
        makeReview({ id: "r3", status: "completed", child_contributed: true }),
      ];
      const alerts = identifyMultiAgencyAlerts([], reviews, []);
      const notParticipating = alerts.filter((a) => a.type === "child_not_participating");
      expect(notParticipating).toHaveLength(2);
    });
  });

  // ── Follow-up overdue alerts ─────────────────────────────────────────

  describe("follow-up overdue alerts", () => {
    it("generates high alert for completed meeting with overdue follow-up", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
      expect(overdue[0].id).toBe("m1");
    });

    it("does not flag completed follow-up", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: true }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag future follow-up date", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: daysFromNow(5), follow_up_completed: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag meetings without follow-up date", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: null, follow_up_completed: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag non-completed meetings", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "scheduled", follow_up_date: daysAgo(5), follow_up_completed: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("includes days overdue in message", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(10), follow_up_completed: false, meeting_date: daysAgo(20) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const overdue = alerts.find((a) => a.type === "follow_up_overdue");
      expect(overdue?.message).toContain("10 days overdue");
    });

    it("mentions Reg 13 in message", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const overdue = alerts.find((a) => a.type === "follow_up_overdue");
      expect(overdue?.message).toContain("Reg 13");
    });

    it("includes meeting type in message (with underscores replaced by spaces)", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: false, meeting_type: "strategy_meeting" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const overdue = alerts.find((a) => a.type === "follow_up_overdue");
      expect(overdue?.message).toContain("strategy meeting");
    });

    it("flags multiple overdue follow-ups", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: false }),
        makeMeeting({ id: "m2", status: "completed", follow_up_date: daysAgo(10), follow_up_completed: false }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(2);
    });
  });

  // ── Meeting cancelled without reschedule alerts ──────────────────────

  describe("meeting cancelled without reschedule alerts", () => {
    it("generates medium alert for cancelled meeting without reschedule", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "cancelled", child_id: "child-1", meeting_type: "strategy_meeting", meeting_date: daysAgo(5) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const cancelled = alerts.filter((a) => a.type === "meeting_cancelled_no_reschedule");
      expect(cancelled).toHaveLength(1);
      expect(cancelled[0].severity).toBe("medium");
      expect(cancelled[0].id).toBe("m1");
    });

    it("does not flag cancelled meeting when rescheduled", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "cancelled", child_id: "child-1", meeting_type: "strategy_meeting", meeting_date: daysAgo(10) }),
        makeMeeting({ id: "m2", status: "scheduled", child_id: "child-1", meeting_type: "strategy_meeting", meeting_date: daysAgo(3) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const cancelled = alerts.filter((a) => a.type === "meeting_cancelled_no_reschedule");
      expect(cancelled).toHaveLength(0);
    });

    it("still flags if reschedule is for a different child", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "cancelled", child_id: "child-1", meeting_type: "strategy_meeting", meeting_date: daysAgo(10) }),
        makeMeeting({ id: "m2", status: "scheduled", child_id: "child-2", meeting_type: "strategy_meeting", meeting_date: daysAgo(3) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const cancelled = alerts.filter((a) => a.type === "meeting_cancelled_no_reschedule");
      expect(cancelled).toHaveLength(1);
    });

    it("still flags if reschedule is for a different meeting type", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "cancelled", child_id: "child-1", meeting_type: "strategy_meeting", meeting_date: daysAgo(10) }),
        makeMeeting({ id: "m2", status: "scheduled", child_id: "child-1", meeting_type: "pep_meeting", meeting_date: daysAgo(3) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const cancelled = alerts.filter((a) => a.type === "meeting_cancelled_no_reschedule");
      expect(cancelled).toHaveLength(1);
    });

    it("does not flag non-cancelled meetings", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "completed" }),
        makeMeeting({ id: "m2", status: "scheduled" }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const cancelled = alerts.filter((a) => a.type === "meeting_cancelled_no_reschedule");
      expect(cancelled).toHaveLength(0);
    });

    it("mentions Working Together 2018 in message", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "cancelled", meeting_type: "network_meeting", meeting_date: daysAgo(5) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const cancelled = alerts.find((a) => a.type === "meeting_cancelled_no_reschedule");
      expect(cancelled?.message).toContain("Working Together 2018");
    });

    it("includes meeting type in message (with underscores replaced by spaces)", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "cancelled", meeting_type: "child_protection_conference", meeting_date: daysAgo(5) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const cancelled = alerts.find((a) => a.type === "meeting_cancelled_no_reschedule");
      expect(cancelled?.message).toContain("child protection conference");
    });

    it("includes meeting date in message", () => {
      const meetingDate = daysAgo(5);
      const meetings = [
        makeMeeting({ id: "m1", status: "cancelled", meeting_date: meetingDate }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const cancelled = alerts.find((a) => a.type === "meeting_cancelled_no_reschedule");
      expect(cancelled?.message).toContain(meetingDate);
    });

    it("does not count cancelled reschedule as valid", () => {
      const meetings = [
        makeMeeting({ id: "m1", status: "cancelled", child_id: "child-1", meeting_type: "strategy_meeting", meeting_date: daysAgo(10) }),
        makeMeeting({ id: "m2", status: "cancelled", child_id: "child-1", meeting_type: "strategy_meeting", meeting_date: daysAgo(3) }),
      ];
      const alerts = identifyMultiAgencyAlerts([], [], meetings);
      const cancelled = alerts.filter((a) => a.type === "meeting_cancelled_no_reschedule");
      // Both are cancelled, neither reschedules the other
      expect(cancelled).toHaveLength(2);
    });
  });

  // ── Combined / complex scenarios ────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates multiple alert types simultaneously", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", child_name: "Alex Smith", role: "gp", status: "active" }),
        makeContact({ id: "c2", child_id: "child-1", role: "social_worker", status: "active", next_contact_due: daysAgo(20) }),
      ];
      const reviews = [
        makeReview({ id: "r1", child_id: "child-2", child_name: "Ben Taylor", status: "scheduled", review_date: daysAgo(5), home_report_submitted: false }),
        makeReview({ id: "r2", child_id: "child-1", status: "completed", child_contributed: false }),
      ];
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: false }),
        makeMeeting({ id: "m2", status: "cancelled", child_id: "child-1", meeting_type: "pep_meeting", meeting_date: daysAgo(5) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, reviews, meetings);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("sw_contact_overdue");
      expect(types).toContain("missing_social_worker"); // child-2 has no SW
      expect(types).toContain("lac_review_overdue");
      expect(types).toContain("home_report_not_submitted");
      expect(types).toContain("child_not_participating");
      expect(types).toContain("follow_up_overdue");
      expect(types).toContain("meeting_cancelled_no_reschedule");
    });

    it("returns no alerts for healthy state", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", role: "social_worker", status: "active", next_contact_due: daysFromNow(7) }),
        makeContact({ id: "c2", child_id: "child-1", role: "gp", status: "active" }),
      ];
      const reviews = [
        makeReview({ id: "r1", child_id: "child-1", status: "completed", child_contributed: true }),
      ];
      const meetings = [
        makeMeeting({ id: "m1", child_id: "child-1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: true }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, reviews, meetings);
      expect(alerts).toHaveLength(0);
    });

    it("all alerts have required fields: type, severity, message, id", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", role: "gp", status: "active" }),
        makeContact({ id: "c2", role: "social_worker", status: "active", next_contact_due: daysAgo(20) }),
      ];
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysAgo(5), home_report_submitted: false }),
        makeReview({ id: "r2", status: "completed", child_contributed: false }),
      ];
      const meetings = [
        makeMeeting({ id: "m1", status: "completed", follow_up_date: daysAgo(5), follow_up_completed: false }),
        makeMeeting({ id: "m2", status: "cancelled", meeting_date: daysAgo(5) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, reviews, meetings);
      for (const alert of alerts) {
        expect(alert.type).toBeTruthy();
        expect(alert.severity).toBeTruthy();
        expect(alert.message).toBeTruthy();
        expect(alert.id).toBeTruthy();
      }
    });

    it("all alert severities are valid values", () => {
      const contacts = [
        makeContact({ id: "c1", child_id: "child-1", role: "gp", status: "active" }),
      ];
      const reviews = [
        makeReview({ id: "r1", status: "scheduled", review_date: daysAgo(5) }),
        makeReview({ id: "r2", status: "completed", child_contributed: false }),
      ];
      const meetings = [
        makeMeeting({ id: "m1", status: "cancelled", meeting_date: daysAgo(5) }),
      ];
      const alerts = identifyMultiAgencyAlerts(contacts, reviews, meetings);
      const validSeverities = ["critical", "high", "medium"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Professional Contacts (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listContacts", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listContacts("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listContacts("home-1", {
      childId: "child-1",
      role: "social_worker",
      status: "active",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createContact", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createContact({
      homeId: "home-1",
      professionalName: "Dr. Jones",
      role: "social_worker",
      organisation: "Local Authority",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateContact", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateContact("contact-1", { status: "inactive" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — LAC Reviews (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listLACReviews", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listLACReviews("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listLACReviews("home-1", {
      childId: "child-1",
      reviewType: "initial",
      status: "scheduled",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createLACReview", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createLACReview({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alex Smith",
      reviewDate: "2026-06-01",
      reviewType: "subsequent",
      chairedBy: "IRO Name",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateLACReview", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateLACReview("review-1", { status: "completed" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Professional Meetings (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listMeetings", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listMeetings("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listMeetings("home-1", {
      childId: "child-1",
      meetingType: "strategy_meeting",
      status: "scheduled",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createMeeting", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createMeeting({
      homeId: "home-1",
      meetingDate: "2026-06-01",
      meetingType: "strategy_meeting",
      purpose: "Review safeguarding concerns",
      homeRepresentative: "Manager Name",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateMeeting", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateMeeting("meeting-1", { status: "completed" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
