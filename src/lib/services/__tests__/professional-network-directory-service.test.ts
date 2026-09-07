// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROFESSIONAL NETWORK DIRECTORY SERVICE TESTS
// Pure-function tests for professional network metrics, alert identification,
// breakdown validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";

import {
  _testing,
  type ProfessionalNetworkRecord,
} from "../professional-network-directory-service";

const { computeProfessionalNetworkMetrics, identifyProfessionalNetworkAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(todayStr());

function makeRecord(
  overrides?: Partial<ProfessionalNetworkRecord>,
): ProfessionalNetworkRecord {
  return {
    id: "a-1",
    home_id: "home-1",
    professional_role: "social_worker",
    contact_frequency: "monthly",
    engagement_quality: "good",
    relationship_status: "active",
    session_date: todayStr(),
    child_name: "Child A",
    recorded_by: "Manager A",
    professional_name: "J. Smith",
    organisation: "Local Authority",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    contact_email: "contact_email" in (overrides ?? {}) ? (overrides!.contact_email ?? null) : null,
    contact_phone: "contact_phone" in (overrides ?? {}) ? (overrides!.contact_phone ?? null) : null,
    last_contact_date: "last_contact_date" in (overrides ?? {}) ? (overrides!.last_contact_date ?? null) : null,
    next_planned_contact: "next_planned_contact" in (overrides ?? {}) ? (overrides!.next_planned_contact ?? null) : null,
    relationship_notes: "relationship_notes" in (overrides ?? {}) ? (overrides!.relationship_notes ?? null) : null,
    communication_preferences: "communication_preferences" in (overrides ?? {}) ? (overrides!.communication_preferences ?? null) : null,
    escalation_contact: "escalation_contact" in (overrides ?? {}) ? (overrides!.escalation_contact ?? null) : null,
    referral_source: "referral_source" in (overrides ?? {}) ? (overrides!.referral_source ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    contact_details_current: true,
    consent_to_share: true,
    regular_communication: true,
    attends_reviews: true,
    responsive_to_contact: true,
    child_aware_of_professional: true,
    child_views_shared: true,
    information_sharing_agreed: true,
    emergency_contact_confirmed: true,
    statutory_requirements_met: true,
    relationship_quality_reviewed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

// ── computeProfessionalNetworkMetrics ──────────────────────────────────────

describe("computeProfessionalNetworkMetrics", () => {
  it("returns zeros for empty", () => {
    const m = computeProfessionalNetworkMetrics([]);
    expect(m.total_contacts).toBe(0); expect(m.poor_engagement_count).toBe(0); expect(m.pending_allocation_count).toBe(0); expect(m.ended_count).toBe(0); expect(m.active_count).toBe(0);
  });

  it("returns empty breakdowns", () => {
    const m = computeProfessionalNetworkMetrics([]);
    expect(m.by_professional_role).toEqual({}); expect(m.by_contact_frequency).toEqual({}); expect(m.by_engagement_quality).toEqual({}); expect(m.by_relationship_status).toEqual({});
  });

  it("total_contacts counts records", () => { expect(computeProfessionalNetworkMetrics([makeRecord(), makeRecord({ id: "a-2" })]).total_contacts).toBe(2); });

  it("counts poor engagement", () => { expect(computeProfessionalNetworkMetrics([makeRecord({ engagement_quality: "poor" })]).poor_engagement_count).toBe(1); });

  it("counts disengaged as poor engagement", () => { expect(computeProfessionalNetworkMetrics([makeRecord({ engagement_quality: "disengaged" })]).poor_engagement_count).toBe(1); });

  it("does not count adequate as poor", () => { expect(computeProfessionalNetworkMetrics([makeRecord({ engagement_quality: "adequate" })]).poor_engagement_count).toBe(0); });

  it("counts pending_allocation", () => { expect(computeProfessionalNetworkMetrics([makeRecord({ relationship_status: "pending_allocation" })]).pending_allocation_count).toBe(1); });

  it("counts ended", () => { expect(computeProfessionalNetworkMetrics([makeRecord({ relationship_status: "ended" })]).ended_count).toBe(1); });

  it("counts active", () => { expect(computeProfessionalNetworkMetrics([makeRecord()]).active_count).toBe(1); });

  it("returns 100% boolean rates with defaults", () => {
    const m = computeProfessionalNetworkMetrics([makeRecord()]);
    expect(m.contact_current_rate).toBe(100); expect(m.consent_rate).toBe(100); expect(m.communication_rate).toBe(100); expect(m.attends_reviews_rate).toBe(100); expect(m.responsive_rate).toBe(100); expect(m.child_aware_rate).toBe(100); expect(m.child_views_rate).toBe(100); expect(m.info_sharing_rate).toBe(100); expect(m.emergency_contact_rate).toBe(100); expect(m.statutory_met_rate).toBe(100); expect(m.quality_reviewed_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100);
  });

  it("contact_current_rate 0 when false", () => { expect(computeProfessionalNetworkMetrics([makeRecord({ contact_details_current: false })]).contact_current_rate).toBe(0); });

  it("mixed boolean rate", () => {
    const m = computeProfessionalNetworkMetrics([makeRecord({ id: "a-1" }), makeRecord({ id: "a-2", contact_details_current: false }), makeRecord({ id: "a-3" })]);
    expect(m.contact_current_rate).toBe(66.7);
  });

  it("unique_children distinct", () => {
    const m = computeProfessionalNetworkMetrics([makeRecord({ id: "a-1", child_name: "Child A" }), makeRecord({ id: "a-2", child_name: "Child B" }), makeRecord({ id: "a-3", child_name: "Child A" })]);
    expect(m.unique_children).toBe(2);
  });

  it("counts all 10 professional roles", () => {
    const roles = ["social_worker", "independent_reviewing_officer", "camhs_therapist", "guardian_ad_litem", "advocate", "education_link", "health_visitor", "yot_worker", "family_support_worker", "other"] as const;
    const recs = roles.map((r, i) => makeRecord({ id: `r-${i}`, professional_role: r }));
    const m = computeProfessionalNetworkMetrics(recs);
    for (const r of roles) expect(m.by_professional_role[r]).toBe(1);
  });

  it("counts all 10 contact frequencies", () => {
    const freqs = ["daily", "weekly", "fortnightly", "monthly", "quarterly", "as_needed", "annually", "on_referral", "statutory_only", "other"] as const;
    const recs = freqs.map((f, i) => makeRecord({ id: `f-${i}`, contact_frequency: f }));
    const m = computeProfessionalNetworkMetrics(recs);
    for (const f of freqs) expect(m.by_contact_frequency[f]).toBe(1);
  });

  it("counts all 5 engagement qualities", () => {
    const quals = ["excellent", "good", "adequate", "poor", "disengaged"] as const;
    const recs = quals.map((q, i) => makeRecord({ id: `q-${i}`, engagement_quality: q }));
    const m = computeProfessionalNetworkMetrics(recs);
    for (const q of quals) expect(m.by_engagement_quality[q]).toBe(1);
  });

  it("counts all 5 relationship statuses", () => {
    const statuses = ["active", "pending_allocation", "on_leave", "changed", "ended"] as const;
    const recs = statuses.map((s, i) => makeRecord({ id: `s-${i}`, relationship_status: s }));
    const m = computeProfessionalNetworkMetrics(recs);
    for (const s of statuses) expect(m.by_relationship_status[s]).toBe(1);
  });
});

// ── identifyProfessionalNetworkAlerts ──────────────────────────────────────

describe("identifyProfessionalNetworkAlerts", () => {
  it("returns empty for clean", () => { expect(identifyProfessionalNetworkAlerts([makeRecord()])).toEqual([]); });

  it("returns empty for empty", () => { expect(identifyProfessionalNetworkAlerts([])).toEqual([]); });

  it("fires disengaged_statutory", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ engagement_quality: "disengaged", statutory_requirements_met: false })]);
    const c = a.find((x) => x.type === "disengaged_statutory");
    expect(c).toBeDefined(); expect(c!.severity).toBe("critical"); expect(c!.message).toContain("Child A"); expect(c!.message).toContain("social worker"); expect(c!.record_id).toBe("a-1");
  });

  it("no critical when disengaged + statutory met", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ engagement_quality: "disengaged", statutory_requirements_met: true })]);
    expect(a.find((x) => x.type === "disengaged_statutory")).toBeUndefined();
  });

  it("no critical when poor + statutory not met", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ engagement_quality: "poor", statutory_requirements_met: false })]);
    expect(a.find((x) => x.type === "disengaged_statutory")).toBeUndefined();
  });

  it("per-record", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ id: "x-1", engagement_quality: "disengaged", statutory_requirements_met: false }), makeRecord({ id: "x-2", engagement_quality: "disengaged", statutory_requirements_met: false })]);
    expect(a.filter((x) => x.type === "disengaged_statutory")).toHaveLength(2);
  });

  it("fires pending_allocation singular", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ relationship_status: "pending_allocation" })]);
    const p = a.find((x) => x.type === "pending_allocation");
    expect(p).toBeDefined(); expect(p!.severity).toBe("high"); expect(p!.message).toContain("1 professional role is");
  });

  it("pending_allocation plural", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ id: "p-1", relationship_status: "pending_allocation" }), makeRecord({ id: "p-2", relationship_status: "pending_allocation" })]);
    const p = a.find((x) => x.type === "pending_allocation");
    expect(p!.message).toContain("2 professional roles are");
  });

  it("fires contact_details_outdated", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ contact_details_current: false })]);
    const o = a.find((x) => x.type === "contact_details_outdated");
    expect(o).toBeDefined(); expect(o!.severity).toBe("high");
  });

  it("poor_engagement not for 1", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ engagement_quality: "poor" })]);
    expect(a.find((x) => x.type === "poor_engagement")).toBeUndefined();
  });

  it("poor_engagement fires for 2", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ id: "e-1", engagement_quality: "poor" }), makeRecord({ id: "e-2", engagement_quality: "poor" })]);
    const p = a.find((x) => x.type === "poor_engagement");
    expect(p).toBeDefined(); expect(p!.severity).toBe("medium");
  });

  it("no_information_sharing not for 1", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ information_sharing_agreed: false })]);
    expect(a.find((x) => x.type === "no_information_sharing")).toBeUndefined();
  });

  it("no_information_sharing fires for 2", () => {
    const a = identifyProfessionalNetworkAlerts([makeRecord({ id: "i-1", information_sharing_agreed: false }), makeRecord({ id: "i-2", information_sharing_agreed: false })]);
    const n = a.find((x) => x.type === "no_information_sharing");
    expect(n).toBeDefined(); expect(n!.severity).toBe("medium");
  });

  it("fires all applicable", () => {
    const recs = [
      makeRecord({ id: "z-1", engagement_quality: "disengaged", statutory_requirements_met: false, contact_details_current: false, information_sharing_agreed: false, relationship_status: "pending_allocation" }),
      makeRecord({ id: "z-2", engagement_quality: "disengaged", statutory_requirements_met: false, contact_details_current: false, information_sharing_agreed: false, relationship_status: "pending_allocation" }),
    ];
    const a = identifyProfessionalNetworkAlerts(recs);
    const types = a.map((x) => x.type);
    expect(types).toContain("disengaged_statutory"); expect(types).toContain("pending_allocation"); expect(types).toContain("contact_details_outdated"); expect(types).toContain("poor_engagement"); expect(types).toContain("no_information_sharing");
  });
});
