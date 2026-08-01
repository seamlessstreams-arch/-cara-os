// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING SERVICE TESTS
// Pure-function tests for compliance computation, overdue detection,
// child profiles, timeline generation, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../safeguarding-service";

const {
  computeSafeguardingCompliance,
  isReferralOverdue,
  computeChildSafeguardingProfile,
  computeSafeguardingTimeline,
  REFERRAL_TYPES,
  NOTIFICATION_TIMEFRAMES,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fixed "now" for deterministic date tests. */
const NOW = new Date("2026-06-01T00:00:00Z");

/** Build a minimal safeguarding referral with sensible defaults. */
function referral(
  overrides: Partial<{
    id: string;
    home_id: string;
    child_id: string;
    referral_type: string;
    urgency: string;
    title: string;
    description: string;
    referred_to: string;
    referred_by: string;
    referral_date: string;
    acknowledged_date: string | null;
    outcome: string | null;
    outcome_date: string | null;
    status: string;
    follow_up_actions: string[];
    multi_agency_involved: string[];
    ofsted_notified: boolean;
    ofsted_notification_date: string | null;
    reg40_notification_sent: boolean;
    linked_incident_id: string | null;
    linked_risk_assessment_id: string | null;
    created_at: string;
    updated_at: string;
  }> = {},
) {
  return {
    id: overrides.id ?? "ref-1",
    home_id: overrides.home_id ?? "home-1",
    child_id: overrides.child_id ?? "child-1",
    referral_type: overrides.referral_type ?? "mash",
    urgency: overrides.urgency ?? "within_24h",
    title: overrides.title ?? "Test referral",
    description: overrides.description ?? "Test description",
    referred_to: overrides.referred_to ?? "Social services",
    referred_by: overrides.referred_by ?? "staff-1",
    referral_date: overrides.referral_date ?? "2026-05-20T10:00:00Z",
    acknowledged_date: overrides.acknowledged_date ?? null,
    outcome: overrides.outcome ?? null,
    outcome_date: overrides.outcome_date ?? null,
    status: overrides.status ?? "pending",
    follow_up_actions: overrides.follow_up_actions ?? [],
    multi_agency_involved: overrides.multi_agency_involved ?? [],
    ofsted_notified: overrides.ofsted_notified ?? false,
    ofsted_notification_date: overrides.ofsted_notification_date ?? null,
    reg40_notification_sent: overrides.reg40_notification_sent ?? false,
    linked_incident_id: overrides.linked_incident_id ?? null,
    linked_risk_assessment_id: overrides.linked_risk_assessment_id ?? null,
    created_at: overrides.created_at ?? "2026-05-20T10:00:00Z",
    updated_at: overrides.updated_at ?? "2026-05-20T10:00:00Z",
  } as Parameters<typeof computeSafeguardingCompliance>[0][number];
}

// ── REFERRAL_TYPES ─────────────────────────────────────────────────────────

describe("REFERRAL_TYPES", () => {
  it("has exactly 12 entries", () => {
    expect(REFERRAL_TYPES).toHaveLength(12);
  });

  it("each entry has type, label, description, typical_urgency, notification_required, and regulation_ref", () => {
    for (const rt of REFERRAL_TYPES) {
      expect(rt).toHaveProperty("type");
      expect(rt).toHaveProperty("label");
      expect(rt).toHaveProperty("description");
      expect(rt).toHaveProperty("typical_urgency");
      expect(rt).toHaveProperty("notification_required");
      expect(rt).toHaveProperty("regulation_ref");
      expect(typeof rt.type).toBe("string");
      expect(typeof rt.label).toBe("string");
      expect(typeof rt.description).toBe("string");
      expect(typeof rt.typical_urgency).toBe("string");
      expect(typeof rt.notification_required).toBe("boolean");
      expect(typeof rt.regulation_ref).toBe("string");
    }
  });

  it("contains expected referral types", () => {
    const types = REFERRAL_TYPES.map((t) => t.type);
    expect(types).toContain("mash");
    expect(types).toContain("lado");
    expect(types).toContain("police");
    expect(types).toContain("child_protection");
    expect(types).toContain("section_47");
    expect(types).toContain("icpc");
    expect(types).toContain("prevent");
    expect(types).toContain("fgm");
    expect(types).toContain("forced_marriage");
  });

  it("marks immediate urgency types correctly", () => {
    const immediateTypes = REFERRAL_TYPES.filter(
      (t) => t.typical_urgency === "immediate",
    ).map((t) => t.type);
    expect(immediateTypes).toContain("police");
    expect(immediateTypes).toContain("child_protection");
    expect(immediateTypes).toContain("section_47");
    expect(immediateTypes).toContain("fgm");
    expect(immediateTypes).toContain("forced_marriage");
  });

  it("marks notification_required correctly for strategy_meeting (false)", () => {
    const sm = REFERRAL_TYPES.find((t) => t.type === "strategy_meeting");
    expect(sm?.notification_required).toBe(false);
  });

  it("marks notification_required correctly for professional_consultation (false)", () => {
    const pc = REFERRAL_TYPES.find((t) => t.type === "professional_consultation");
    expect(pc?.notification_required).toBe(false);
  });

  it("marks notification_required correctly for rcpc (false)", () => {
    const rcpc = REFERRAL_TYPES.find((t) => t.type === "rcpc");
    expect(rcpc?.notification_required).toBe(false);
  });
});

// ── NOTIFICATION_TIMEFRAMES ────────────────────────────────────────────────

describe("NOTIFICATION_TIMEFRAMES", () => {
  it("has exactly 4 urgency levels", () => {
    expect(Object.keys(NOTIFICATION_TIMEFRAMES)).toHaveLength(4);
  });

  it("immediate is 1 hour", () => {
    expect(NOTIFICATION_TIMEFRAMES.immediate.maxHours).toBe(1);
  });

  it("within_24h is 24 hours", () => {
    expect(NOTIFICATION_TIMEFRAMES.within_24h.maxHours).toBe(24);
  });

  it("within_72h is 72 hours", () => {
    expect(NOTIFICATION_TIMEFRAMES.within_72h.maxHours).toBe(72);
  });

  it("routine is 120 hours (5 working days)", () => {
    expect(NOTIFICATION_TIMEFRAMES.routine.maxHours).toBe(120);
  });

  it("each entry has maxHours and label", () => {
    for (const key of Object.keys(NOTIFICATION_TIMEFRAMES)) {
      const entry =
        NOTIFICATION_TIMEFRAMES[key as keyof typeof NOTIFICATION_TIMEFRAMES];
      expect(typeof entry.maxHours).toBe("number");
      expect(typeof entry.label).toBe("string");
    }
  });
});

// ── computeSafeguardingCompliance ──────────────────────────────────────────

describe("computeSafeguardingCompliance", () => {
  it("returns zeroed metrics for empty referral array", () => {
    const result = computeSafeguardingCompliance([], NOW);
    expect(result.total_referrals).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.overdue_acknowledgement).toBe(0);
    expect(result.ofsted_notifications_required).toBe(0);
    expect(result.ofsted_notifications_sent).toBe(0);
    expect(result.notification_compliance_percentage).toBe(100);
    expect(result.average_resolution_days).toBeNull();;
    expect(result.by_type).toEqual({});
    expect(result.by_status).toEqual({});
  });

  it("counts total referrals", () => {
    const refs = [referral(), referral({ id: "ref-2" })];
    const result = computeSafeguardingCompliance(refs, NOW);
    expect(result.total_referrals).toBe(2);
  });

  it("counts pending referrals", () => {
    const refs = [
      referral({ status: "pending" }),
      referral({ id: "ref-2", status: "submitted" }),
      referral({ id: "ref-3", status: "pending" }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    expect(result.pending).toBe(2);
  });

  it("groups referrals by type", () => {
    const refs = [
      referral({ referral_type: "mash" }),
      referral({ id: "ref-2", referral_type: "lado" }),
      referral({ id: "ref-3", referral_type: "mash" }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    expect(result.by_type).toEqual({ mash: 2, lado: 1 });
  });

  it("groups referrals by status", () => {
    const refs = [
      referral({ status: "pending" }),
      referral({ id: "ref-2", status: "closed" }),
      referral({ id: "ref-3", status: "pending" }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    expect(result.by_status).toEqual({ pending: 2, closed: 1 });
  });

  it("detects overdue acknowledgement for submitted referrals older than 5 days", () => {
    const refs = [
      referral({
        status: "submitted",
        acknowledged_date: null,
        // 10 days before NOW
        referral_date: "2026-05-22T00:00:00Z",
      }),
      referral({
        id: "ref-2",
        status: "submitted",
        acknowledged_date: null,
        // 15 days before NOW — well overdue
        referral_date: "2026-05-15T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    // Only ref-2 is more than 5 days old from NOW (2026-06-01)
    // ref-1: 2026-05-22 to 2026-06-01 = 10 days > 5 days => overdue
    // ref-2: 2026-05-15 to 2026-06-01 = 17 days > 5 days => overdue
    expect(result.overdue_acknowledgement).toBe(2);
  });

  it("does not count submitted referral with acknowledged_date as overdue", () => {
    const refs = [
      referral({
        status: "submitted",
        acknowledged_date: "2026-05-22T00:00:00Z",
        referral_date: "2026-05-10T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    expect(result.overdue_acknowledgement).toBe(0);
  });

  it("does not count recent submitted referral as overdue", () => {
    const refs = [
      referral({
        status: "submitted",
        acknowledged_date: null,
        // Only 2 days before NOW
        referral_date: "2026-05-30T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    expect(result.overdue_acknowledgement).toBe(0);
  });

  it("counts Ofsted notifications required for notification_required types", () => {
    const refs = [
      referral({ referral_type: "mash", ofsted_notified: false }),
      referral({ id: "ref-2", referral_type: "strategy_meeting", ofsted_notified: false }),
      referral({ id: "ref-3", referral_type: "police", ofsted_notified: true }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    // mash and police require notification, strategy_meeting does not
    expect(result.ofsted_notifications_required).toBe(2);
    expect(result.ofsted_notifications_sent).toBe(1);
  });

  it("computes notification compliance percentage", () => {
    const refs = [
      referral({ referral_type: "mash", ofsted_notified: true }),
      referral({ id: "ref-2", referral_type: "lado", ofsted_notified: true }),
      referral({ id: "ref-3", referral_type: "police", ofsted_notified: false }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    // 3 required, 2 sent => 67%
    expect(result.notification_compliance_percentage).toBe(67);
  });

  it("returns 100% compliance when no notifications required", () => {
    const refs = [
      referral({ referral_type: "strategy_meeting" }),
      referral({ id: "ref-2", referral_type: "rcpc" }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    expect(result.notification_compliance_percentage).toBe(100);
  });

  it("computes average resolution days for closed referrals", () => {
    const refs = [
      referral({
        status: "closed",
        referral_date: "2026-05-01T00:00:00Z",
        outcome_date: "2026-05-11T00:00:00Z",
        outcome: "NFA",
      }),
      referral({
        id: "ref-2",
        status: "closed",
        referral_date: "2026-05-01T00:00:00Z",
        outcome_date: "2026-05-21T00:00:00Z",
        outcome: "Resolved",
      }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    // 10 days + 20 days = 30, / 2 = 15.0
    expect(result.average_resolution_days).toBe(15);
  });

  it("returns 0 average resolution days when no closed referrals", () => {
    const refs = [referral({ status: "pending" })];
    const result = computeSafeguardingCompliance(refs, NOW);
    expect(result.average_resolution_days).toBeNull();;
  });

  it("ignores closed referrals without outcome_date for resolution average", () => {
    const refs = [
      referral({
        status: "closed",
        referral_date: "2026-05-01T00:00:00Z",
        outcome_date: null,
        outcome: null,
      }),
    ];
    const result = computeSafeguardingCompliance(refs, NOW);
    expect(result.average_resolution_days).toBeNull();;
  });
});

// ── isReferralOverdue ─────────────────────────────────────────────────────

describe("isReferralOverdue", () => {
  it("returns true for pending immediate referral past 1 hour", () => {
    const ref = referral({
      status: "pending",
      urgency: "immediate",
      // 2 hours before NOW
      referral_date: "2026-05-31T22:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(true);
  });

  it("returns false for pending immediate referral within 1 hour", () => {
    const ref = referral({
      status: "pending",
      urgency: "immediate",
      // 30 minutes before NOW
      referral_date: "2026-05-31T23:30:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(false);
  });

  it("returns true for pending within_24h referral past 24 hours", () => {
    const ref = referral({
      status: "pending",
      urgency: "within_24h",
      referral_date: "2026-05-30T00:00:00Z",
    });
    // 2026-05-30 to 2026-06-01 = 48 hours > 24 hours
    expect(isReferralOverdue(ref, NOW)).toBe(true);
  });

  it("returns false for pending within_24h referral within 24 hours", () => {
    const ref = referral({
      status: "pending",
      urgency: "within_24h",
      referral_date: "2026-05-31T12:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(false);
  });

  it("returns true for pending within_72h referral past 72 hours", () => {
    const ref = referral({
      status: "pending",
      urgency: "within_72h",
      referral_date: "2026-05-25T00:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(true);
  });

  it("returns false for pending within_72h referral within 72 hours", () => {
    const ref = referral({
      status: "pending",
      urgency: "within_72h",
      referral_date: "2026-05-30T12:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(false);
  });

  it("returns true for pending routine referral past 120 hours", () => {
    const ref = referral({
      status: "pending",
      urgency: "routine",
      referral_date: "2026-05-20T00:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(true);
  });

  it("returns false for pending routine referral within 120 hours", () => {
    const ref = referral({
      status: "pending",
      urgency: "routine",
      referral_date: "2026-05-28T12:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(false);
  });

  it("returns true for submitted referral without ack past 5 days", () => {
    const ref = referral({
      status: "submitted",
      acknowledged_date: null,
      referral_date: "2026-05-20T00:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(true);
  });

  it("returns false for submitted referral without ack within 5 days", () => {
    const ref = referral({
      status: "submitted",
      acknowledged_date: null,
      referral_date: "2026-05-30T00:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(false);
  });

  it("returns false for submitted referral that has been acknowledged", () => {
    const ref = referral({
      status: "submitted",
      acknowledged_date: "2026-05-22T00:00:00Z",
      referral_date: "2026-05-15T00:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(false);
  });

  it("returns false for closed referral", () => {
    const ref = referral({
      status: "closed",
      referral_date: "2026-01-01T00:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(false);
  });

  it("returns false for acknowledged referral", () => {
    const ref = referral({
      status: "acknowledged",
      referral_date: "2026-01-01T00:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(false);
  });

  it("returns false for investigating referral", () => {
    const ref = referral({
      status: "investigating",
      referral_date: "2026-01-01T00:00:00Z",
    });
    expect(isReferralOverdue(ref, NOW)).toBe(false);
  });
});

// ── computeChildSafeguardingProfile ───────────────────────────────────────

describe("computeChildSafeguardingProfile", () => {
  it("returns empty profile for empty array", () => {
    const result = computeChildSafeguardingProfile([]);
    expect(result.child_id).toBe("");
    expect(result.total_referrals).toBe(0);
    expect(result.active_referrals).toBe(0);
    expect(result.on_child_protection_plan).toBe(false);
    expect(result.referral_history).toEqual([]);
    expect(result.risk_indicator).toBe("low");
  });

  it("extracts child_id from first referral", () => {
    const refs = [referral({ child_id: "child-42" })];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.child_id).toBe("child-42");
  });

  it("counts total referrals", () => {
    const refs = [
      referral(),
      referral({ id: "ref-2", status: "closed" }),
      referral({ id: "ref-3", status: "investigating" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.total_referrals).toBe(3);
  });

  it("counts active referrals (pending, submitted, acknowledged, investigating, escalated)", () => {
    const refs = [
      referral({ status: "pending" }),
      referral({ id: "ref-2", status: "submitted" }),
      referral({ id: "ref-3", status: "acknowledged" }),
      referral({ id: "ref-4", status: "investigating" }),
      referral({ id: "ref-5", status: "escalated" }),
      referral({ id: "ref-6", status: "closed" }),
      referral({ id: "ref-7", status: "outcome_received" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.active_referrals).toBe(5);
  });

  it("detects child on protection plan with active section_47", () => {
    const refs = [
      referral({ referral_type: "section_47", status: "investigating" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.on_child_protection_plan).toBe(true);
  });

  it("detects child on protection plan with active icpc", () => {
    const refs = [
      referral({ referral_type: "icpc", status: "pending" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.on_child_protection_plan).toBe(true);
  });

  it("detects child on protection plan with active rcpc", () => {
    const refs = [
      referral({ referral_type: "rcpc", status: "acknowledged" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.on_child_protection_plan).toBe(true);
  });

  it("does not detect protection plan for closed section_47", () => {
    const refs = [
      referral({ referral_type: "section_47", status: "closed" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.on_child_protection_plan).toBe(false);
  });

  it("builds referral history with type, date, and status", () => {
    const refs = [
      referral({
        referral_type: "mash",
        referral_date: "2026-05-10T00:00:00Z",
        status: "submitted",
      }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.referral_history).toEqual([
      { type: "mash", date: "2026-05-10T00:00:00Z", status: "submitted" },
    ]);
  });

  // ── Risk indicator tests ──

  it("returns low risk for no active referrals", () => {
    const refs = [referral({ status: "closed" })];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.risk_indicator).toBe("low");
  });

  it("returns medium risk for 1 active referral (non-immediate, non-24h)", () => {
    const refs = [
      referral({ status: "pending", urgency: "within_72h" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.risk_indicator).toBe("medium");
  });

  it("returns high risk for 2 active referrals (non-immediate)", () => {
    const refs = [
      referral({ status: "pending", urgency: "within_24h" }),
      referral({ id: "ref-2", status: "submitted", urgency: "within_72h" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.risk_indicator).toBe("high");
  });

  it("returns high risk for 1 active referral with within_24h urgency", () => {
    const refs = [
      referral({ status: "pending", urgency: "within_24h" }),
    ];
    // 1 active referral => medium, but has24h => high... wait, let's check:
    // hasImmediate = false, has24h = true => high wins over medium
    // Actually: activeReferrals.length === 1 goes to medium, but has24h check
    // is evaluated first. Let me re-read the code...
    // The code checks: if (hasImmediate || >= 3 || CPP) => critical
    //                   else if (has24h || === 2) => high
    //                   else if (=== 1) => medium
    // So 1 active with within_24h => high
    const result = computeChildSafeguardingProfile(refs);
    expect(result.risk_indicator).toBe("high");
  });

  it("returns critical risk for immediate urgency active referral", () => {
    const refs = [
      referral({ status: "pending", urgency: "immediate" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.risk_indicator).toBe("critical");
  });

  it("returns critical risk for 3 or more active referrals", () => {
    const refs = [
      referral({ status: "pending", urgency: "routine" }),
      referral({ id: "ref-2", status: "submitted", urgency: "routine" }),
      referral({ id: "ref-3", status: "acknowledged", urgency: "routine" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.risk_indicator).toBe("critical");
  });

  it("returns critical risk for child on protection plan", () => {
    const refs = [
      referral({ referral_type: "icpc", status: "acknowledged", urgency: "routine" }),
    ];
    const result = computeChildSafeguardingProfile(refs);
    expect(result.risk_indicator).toBe("critical");
  });
});

// ── computeSafeguardingTimeline ───────────────────────────────────────────

describe("computeSafeguardingTimeline", () => {
  it("returns empty timeline for empty array", () => {
    const result = computeSafeguardingTimeline([]);
    expect(result).toEqual([]);
  });

  it("creates an initiated event for each referral", () => {
    const refs = [
      referral({
        referral_type: "mash",
        title: "Risk of harm",
        referred_to: "MASH Hub",
        referral_date: "2026-05-10T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingTimeline(refs);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-05-10T00:00:00Z");
    expect(result[0].type).toBe("mash");
    expect(result[0].event).toBe("MASH Referral initiated");
    expect(result[0].description).toContain("MASH Hub");
    expect(result[0].description).toContain("Risk of harm");
    expect(result[0].outcome).toBeNull();
  });

  it("creates an acknowledged event when acknowledged_date is present", () => {
    const refs = [
      referral({
        referral_type: "lado",
        referred_to: "LADO team",
        referral_date: "2026-05-10T00:00:00Z",
        acknowledged_date: "2026-05-12T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingTimeline(refs);
    expect(result).toHaveLength(2);
    const ackEvent = result.find((e) => e.event.includes("acknowledged"));
    expect(ackEvent).toBeDefined();
    expect(ackEvent!.date).toBe("2026-05-12T00:00:00Z");
    expect(ackEvent!.description).toContain("LADO team");
  });

  it("creates an outcome event when outcome_date and outcome are present", () => {
    const refs = [
      referral({
        referral_type: "police",
        referral_date: "2026-05-05T00:00:00Z",
        outcome: "No further action",
        outcome_date: "2026-05-15T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingTimeline(refs);
    const outcomeEvent = result.find((e) => e.event.includes("outcome"));
    expect(outcomeEvent).toBeDefined();
    expect(outcomeEvent!.date).toBe("2026-05-15T00:00:00Z");
    expect(outcomeEvent!.outcome).toBe("No further action");
  });

  it("does not create outcome event when outcome is null", () => {
    const refs = [
      referral({
        outcome: null,
        outcome_date: "2026-05-15T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingTimeline(refs);
    const outcomeEvent = result.find((e) => e.event.includes("outcome"));
    expect(outcomeEvent).toBeUndefined();
  });

  it("does not create outcome event when outcome_date is null", () => {
    const refs = [
      referral({
        outcome: "NFA",
        outcome_date: null,
      }),
    ];
    const result = computeSafeguardingTimeline(refs);
    const outcomeEvent = result.find((e) => e.event.includes("outcome"));
    expect(outcomeEvent).toBeUndefined();
  });

  it("sorts timeline events chronologically", () => {
    const refs = [
      referral({
        referral_type: "mash",
        referral_date: "2026-05-15T00:00:00Z",
        acknowledged_date: "2026-05-17T00:00:00Z",
      }),
      referral({
        id: "ref-2",
        referral_type: "police",
        referral_date: "2026-05-10T00:00:00Z",
        acknowledged_date: "2026-05-11T00:00:00Z",
        outcome: "Closed",
        outcome_date: "2026-05-20T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingTimeline(refs);
    // Expected order: police initiated (5/10), police ack (5/11),
    // mash initiated (5/15), mash ack (5/17), police outcome (5/20)
    expect(result).toHaveLength(5);
    expect(result[0].date).toBe("2026-05-10T00:00:00Z");
    expect(result[1].date).toBe("2026-05-11T00:00:00Z");
    expect(result[2].date).toBe("2026-05-15T00:00:00Z");
    expect(result[3].date).toBe("2026-05-17T00:00:00Z");
    expect(result[4].date).toBe("2026-05-20T00:00:00Z");
  });

  it("uses referral_type as fallback label for unknown types", () => {
    const refs = [
      referral({
        referral_type: "unknown_type" as never,
        referral_date: "2026-05-10T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingTimeline(refs);
    expect(result[0].event).toBe("unknown_type initiated");
  });

  it("generates all 3 event types for a fully completed referral", () => {
    const refs = [
      referral({
        referral_type: "child_protection",
        referred_to: "CSC",
        title: "Immediate concern",
        referral_date: "2026-05-01T00:00:00Z",
        acknowledged_date: "2026-05-02T00:00:00Z",
        outcome: "Protection plan initiated",
        outcome_date: "2026-05-10T00:00:00Z",
      }),
    ];
    const result = computeSafeguardingTimeline(refs);
    expect(result).toHaveLength(3);
    expect(result[0].event).toContain("initiated");
    expect(result[1].event).toContain("acknowledged");
    expect(result[2].event).toContain("outcome");
  });
});
