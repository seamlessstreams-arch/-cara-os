import { describe, it, expect } from "vitest";
import {
  projectEvents,
  buildEventStream,
  deriveApproval,
  type IncidentSource,
  type MissingSource,
  type RestraintSource,
  type MedErrorSource,
  type DailyLogSource,
  type KeyworkSource,
  type EducationSource,
} from "../event-projector";

const inc = (o: Partial<IncidentSource> & { id: string }): IncidentSource => ({
  child_id: "yp_alex", type: "behaviour", severity: "medium", date: "2026-06-01", time: "14:00", ...o,
});
const mis = (o: Partial<MissingSource> & { id: string }): MissingSource => ({
  child_id: "yp_alex", date_missing: "2026-06-01", risk_level: "high", return_interview_completed: false, ...o,
});
const res = (o: Partial<RestraintSource> & { id: string }): RestraintSource => ({
  child_id: "yp_alex", date: "2026-06-01", ...o,
});
const med = (o: Partial<MedErrorSource> & { id: string }): MedErrorSource => ({
  child_id: "yp_casey", date_occurred: "2026-06-01", error_type: "wrong_dose", severity: "moderate", ...o,
});

// ══════════════════════════════════════════════════════════════════════════════
describe("deriveApproval", () => {
  it("routes safeguarding to manager (critical → RI)", () => {
    expect(deriveApproval("safeguarding", "high")).toEqual({ requiresApproval: true, approvalLevel: "manager" });
    expect(deriveApproval("safeguarding", "critical")).toEqual({ requiresApproval: true, approvalLevel: "ri" });
  });
  it("routes physical intervention to at least manager", () => {
    expect(deriveApproval("physical_intervention", "high")).toEqual({ requiresApproval: true, approvalLevel: "manager" });
  });
  it("routes missing to at least deputy, medication harm to manager", () => {
    expect(deriveApproval("missing", "high").approvalLevel).toBe("deputy");
    expect(deriveApproval("medication", "high").approvalLevel).toBe("manager");
  });
  it("does not require approval for low-risk routine events", () => {
    expect(deriveApproval("incident", "low")).toEqual({ requiresApproval: false });
    expect(deriveApproval("incident", "medium")).toEqual({ requiresApproval: true, approvalLevel: "team_leader" });
  });
  it("routes Reg 44/45 to the RI", () => {
    expect(deriveApproval("reg44", "low").approvalLevel).toBe("ri");
  });
});

describe("incident projection", () => {
  it("classifies a safeguarding incident, escalates risk and routes approval", () => {
    const e = projectEvents({ incidents: [inc({ id: "1", type: "safeguarding_concern", severity: "medium" })] })[0];
    expect(e.eventType).toBe("safeguarding");
    expect(e.riskLevel).toBe("high"); // safeguarding floors risk at high
    expect(e.requiresApproval).toBe(true);
    expect(e.approvalLevel).toBe("manager");
    expect(e.structuredTags).toContain("safeguarding");
    expect(e.ariaAnalysis?.complianceFlags.some((f) => /Reg 40/.test(f))).toBe(true);
    expect(e.occurredAt).toBe("2026-06-01T14:00:00.000Z");
  });
  it("keeps a routine low incident unapproved", () => {
    const e = projectEvents({ incidents: [inc({ id: "2", type: "behaviour", severity: "low" })] })[0];
    expect(e.eventType).toBe("incident");
    expect(e.riskLevel).toBe("low");
    expect(e.requiresApproval).toBe(false);
  });
  it("flags an incomplete body map", () => {
    const e = projectEvents({ incidents: [inc({ id: "3", body_map_required: true, body_map_completed: false })] })[0];
    expect(e.structuredTags).toContain("body_map_outstanding");
  });
});

describe("missing projection", () => {
  const e = projectEvents({ missingEpisodes: [mis({ id: "1", reported_to_police: true, return_interview_completed: false })] })[0];
  it("derives risk, tags and approval", () => {
    expect(e.eventType).toBe("missing");
    expect(e.riskLevel).toBe("high");
    expect(e.approvalLevel).toBe("deputy");
    expect(e.structuredTags).toContain("police_notified");
    expect(e.structuredTags).toContain("rhi_outstanding");
  });
  it("raises a return-home-interview compliance flag", () => {
    expect(e.ariaAnalysis?.complianceFlags.some((f) => /Return home interview/i.test(f))).toBe(true);
  });
});

describe("restraint projection", () => {
  it("scores critical when there is an injury and flags the debrief", () => {
    const e = projectEvents({ restraints: [res({ id: "1", injuries_count: 1, child_debriefed: false })] })[0];
    expect(e.eventType).toBe("physical_intervention");
    expect(e.riskLevel).toBe("critical");
    expect(e.approvalLevel).toBe("manager");
    expect(e.structuredTags).toContain("injury");
    expect(e.structuredTags).toContain("debrief_outstanding");
  });
  it("scores high with no injury", () => {
    const e = projectEvents({ restraints: [res({ id: "2", injuries_count: 0, child_debriefed: true })] })[0];
    expect(e.riskLevel).toBe("high");
  });
});

describe("medication projection", () => {
  it("maps severity to risk and flags outstanding candour", () => {
    const e = projectEvents({ medicationErrors: [med({ id: "1", severity: "moderate", duty_of_candour: true, duty_of_candour_completed: null })] })[0];
    expect(e.eventType).toBe("medication");
    expect(e.riskLevel).toBe("medium");
    expect(e.structuredTags).toContain("harm");
    expect(e.structuredTags).toContain("candour_outstanding");
  });
  it("escalates a death to critical with manager approval", () => {
    const e = projectEvents({ medicationErrors: [med({ id: "2", severity: "death" })] })[0];
    expect(e.riskLevel).toBe("critical");
    expect(e.approvalLevel).toBe("manager");
  });
});

describe("daily log / keywork / education projection", () => {
  it("treats a significant daily log as medium risk needing team-leader sign-off", () => {
    const log: DailyLogSource = { id: "1", child_id: "yp_alex", staff_id: "staff_anna", date: "2026-06-01", time: "09:00", entry_type: "behaviour", content: "x", is_significant: true };
    const e = projectEvents({ dailyLogs: [log] })[0];
    expect(e.eventType).toBe("daily_log");
    expect(e.riskLevel).toBe("medium");
    expect(e.requiresApproval).toBe(true);
    expect(e.approvalLevel).toBe("team_leader");
  });
  it("flags a key-working mood decline", () => {
    const kw: KeyworkSource = { id: "1", child_id: "yp_alex", staff_id: "staff_edward", date: "2026-06-01", type: "one_to_one", mood_before: 4, mood_after: 2 };
    const e = projectEvents({ keyworkSessions: [kw] })[0];
    expect(e.riskLevel).toBe("medium");
    expect(e.structuredTags).toContain("mood_declined");
  });
  it("scores an exclusion as high risk", () => {
    const edu: EducationSource = { id: "1", child_id: "yp_jordan", date: "2026-06-01", record_type: "attendance", attendance_status: "excluded" };
    const e = projectEvents({ educationRecords: [edu] })[0];
    expect(e.riskLevel).toBe("high");
  });
});

describe("extended event types", () => {
  it("projects overtime only for shifts with overtime and routes significant overtime for sign-off", () => {
    const big = projectEvents({ shifts: [{ id: "s1", staff_id: "staff_anna", date: "2026-06-01", start_time: "20:00", shift_type: "waking_night", overtime_minutes: 90, status: "completed" }] });
    expect(big).toHaveLength(1);
    expect(big[0].eventType).toBe("overtime");
    expect(big[0].requiresApproval).toBe(true);
    expect(big[0].approvalLevel).toBe("team_leader");
    expect(big[0].shiftId).toBe("s1");
    const none = projectEvents({ shifts: [{ id: "s2", staff_id: "x", date: "2026-06-01", overtime_minutes: 0 }] });
    expect(none).toHaveLength(0);
  });
  it("flags urgent outstanding maintenance", () => {
    const e = projectEvents({ maintenance: [{ id: "m1", title: "Boiler fault", priority: "urgent", status: "open" }] })[0];
    expect(e.eventType).toBe("maintenance");
    expect(e.riskLevel).toBe("medium");
    expect(e.ariaAnalysis?.complianceFlags.some((f) => /Urgent maintenance/.test(f))).toBe(true);
  });
  it("scores a low QA audit as high risk with an action-plan flag", () => {
    const e = projectEvents({ audits: [{ id: "a1", title: "Medication audit", score: 5, max_score: 10, status: "completed" }] })[0];
    expect(e.eventType).toBe("qa_check");
    expect(e.riskLevel).toBe("high");
    expect(e.ariaAnalysis?.complianceFlags.some((f) => /below expected/.test(f))).toBe(true);
  });
  it("routes a Reg 44 visit to the RI and flags an unsent report", () => {
    const e = projectEvents({ reg44Reports: [{ id: "r1", visit_date: "2026-05-20", visitor: "J. Visitor", overall_judgement: "requires_improvement", report_sent_to_ofsted: false }] })[0];
    expect(e.eventType).toBe("reg44");
    expect(e.approvalLevel).toBe("ri");
    expect(e.riskLevel).toBe("medium");
    expect(e.ariaAnalysis?.complianceFlags.some((f) => /not yet sent to Ofsted/.test(f))).toBe(true);
  });
  it("flags a missed health appointment", () => {
    const e = projectEvents({ appointments: [{ id: "h1", child_id: "yp_casey", date: "2026-06-01", type: "dental", title: "Dental check", status: "missed" }] })[0];
    expect(e.eventType).toBe("health");
    expect(e.childId).toBe("yp_casey");
    expect(e.riskLevel).toBe("medium");
    expect(e.ariaAnalysis?.complianceFlags.some((f) => /missed/i.test(f))).toBe(true);
  });
  it("projects staff sickness absence (with RTW flag) and filters out annual leave", () => {
    const sick = projectEvents({ leaveRequests: [{ id: "l1", staff_id: "staff_anna", leave_type: "sick", start_date: "2026-06-01", total_days: 3, status: "approved", return_to_work_required: true, return_to_work_completed: false }] });
    expect(sick).toHaveLength(1);
    expect(sick[0].eventType).toBe("staff_absence");
    expect(sick[0].ariaAnalysis?.complianceFlags.some((f) => /Return-to-work/.test(f))).toBe(true);
    const annual = projectEvents({ leaveRequests: [{ id: "l2", staff_id: "x", leave_type: "annual", start_date: "2026-06-01" }] });
    expect(annual).toHaveLength(0);
  });
});

describe("buildEventStream overview", () => {
  const r = buildEventStream({
    incidents: [inc({ id: "1", type: "safeguarding_concern", severity: "critical", date: "2026-06-02" }), inc({ id: "2", severity: "low", date: "2026-05-01" })],
    missingEpisodes: [mis({ id: "1", date_missing: "2026-05-20" })],
    restraints: [res({ id: "1", injuries_count: 0, date: "2026-05-25" })],
  });
  it("aggregates totals, risk distribution and pending approvals", () => {
    expect(r.overview.total).toBe(4);
    expect(r.overview.by_type.safeguarding).toBe(1);
    expect(r.overview.by_risk.critical).toBe(1);
    expect(r.overview.pending_approvals).toBe(3); // safeguarding + missing + restraint (low incident excluded)
    expect(r.overview.high_or_critical).toBe(3);
  });
  it("returns events newest-first", () => {
    expect(r.events[0].occurredAt >= r.events[1].occurredAt).toBe(true);
    expect(r.overview.latest_occurred_at).toBe(r.events[0].occurredAt);
  });
  it("counts compliance flags from the ARIA analysis", () => {
    expect(r.overview.compliance_flags).toBeGreaterThan(0);
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const input = { incidents: [inc({ id: "1", type: "safeguarding_concern", severity: "high" })], missingEpisodes: [mis({ id: "1" })] };
    expect(JSON.stringify(buildEventStream(input))).toBe(JSON.stringify(buildEventStream(input)));
  });
});
