import { describe, it, expect } from "vitest";
import { deriveManagerAlerts, detectPatterns, oversightSummary, OVERSIGHT_DISCLAIMER, type OversightInput } from "../manager-oversight-engine";
import type { IncidentSession, IncidentTimelineEntry, AriaRecordingReview } from "../aria-incident-engine";

const TODAY = "2026-06-10";
function at(days: number, time = "T20:00:00Z"): string {
  const d = new Date(TODAY + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10) + time;
}

function session(over: Partial<IncidentSession> & { id: string; child_id: string }): IncidentSession {
  return {
    home_id: "home_oak", started_by_user_id: "staff_a", started_at: at(-1), ended_at: at(-1, "T21:00:00Z"),
    incident_type: "emotional_dysregulation", incident_status: "ended", immediate_risk_level: "medium",
    manager_notified: true, manager_notified_at: at(-1), ai_support_used: true, final_record_created: true,
    workflow_progress: {}, created_at: at(-1), updated_at: at(-1), ...over,
  };
}
function entry(sessionId: string, entry_type: string, raw_text: string, ts = at(-1, "T20:10:00Z")): IncidentTimelineEntry {
  return { id: `${sessionId}-${entry_type}-${raw_text.length}`, incident_session_id: sessionId, home_id: "home_oak", child_id: "c1", user_id: "staff_a", entry_type, raw_text, ai_rewritten_text: null, accepted_text: null, timestamp: ts, created_at: ts };
}
function input(over: Partial<OversightInput> = {}): OversightInput {
  return { sessions: [], entries: [], reviews: [], restoratives: [], reflections: [], alertStates: [], today: TODAY, ...over };
}

describe("deriveManagerAlerts", () => {
  it("flags missing record, child voice, restorative, and manager notification on an ended session", () => {
    const alerts = deriveManagerAlerts(input({
      sessions: [session({ id: "s1", child_id: "c1", final_record_created: false, manager_notified: false })],
    }));
    const types = alerts.map((a) => a.key.split(":")[0]);
    expect(types).toEqual(expect.arrayContaining(["missing_record", "missing_child_voice", "missing_debrief", "missing_notification"]));
  });

  it("clears alerts when the practice has happened (voice + restorative entry + notified + record)", () => {
    const alerts = deriveManagerAlerts(input({
      sessions: [session({ id: "s1", child_id: "c1" })],
      entries: [entry("s1", "child_voice", "Said what helped."), entry("s1", "restorative_action", "Restorative completed.")],
    }));
    expect(alerts).toHaveLength(0);
  });

  it("raises an urgent Reg-40 consideration for restraint/missing/safeguarding types, with 'consider' wording", () => {
    const alerts = deriveManagerAlerts(input({
      sessions: [session({ id: "s1", child_id: "c1", incident_type: "physical_intervention" })],
      entries: [entry("s1", "child_voice", "x"), entry("s1", "restorative_action", "y")],
    }));
    const reg = alerts.find((a) => a.alert_type === "possible_regulation_40")!;
    expect(reg.priority).toBe("urgent");
    expect(reg.description).toMatch(/manager should consider whether/i);
    expect(reg.description).not.toMatch(/Regulation 40 is required|must (be )?notif/i); // never definitive
  });

  it("skips active sessions (live board handles those) and surfaces awaiting AI-record approvals", () => {
    const review: AriaRecordingReview = {
      id: "r1", home_id: "home_oak", child_id: "c1", user_id: "staff_a", incident_session_id: "s9",
      record_type: "incident_report", raw_text: "raw", ai_suggested_text: "ai", final_accepted_text: "final",
      ai_quality_flags: [], staff_accepted: true, accepted_at: at(0), manager_review_required: true,
      manager_reviewed_by: null, manager_reviewed_at: null, created_at: at(0), updated_at: at(0),
    };
    const alerts = deriveManagerAlerts(input({
      sessions: [session({ id: "s2", child_id: "c1", incident_status: "active", ended_at: null, final_record_created: false, manager_notified: false })],
      reviews: [review],
    }));
    expect(alerts.find((a) => a.incident_session_id === "s2")).toBeUndefined();
    const approval = alerts.find((a) => a.review_id === "r1")!;
    expect(approval.title).toMatch(/awaiting approval/i);
  });

  it("applies manager resolve/dismiss state and sorts open-first by priority", () => {
    const alerts = deriveManagerAlerts(input({
      sessions: [session({ id: "s1", child_id: "c1", incident_type: "physical_intervention", final_record_created: false })],
      alertStates: [{ id: "possible_regulation_40:s1", status: "resolved", resolved_by_user_id: "rm", resolved_at: at(0) }],
    }));
    const reg = alerts.find((a) => a.key === "possible_regulation_40:s1")!;
    expect(reg.status).toBe("resolved");
    expect(alerts[0].status).toBe("open"); // open alerts sort before resolved
  });
});

describe("detectPatterns", () => {
  it("matches the spec's family-contact insight sentence at >=2 linked incidents", () => {
    const s1 = session({ id: "s1", child_id: "c1", incident_type: "family_contact_distress", started_at: at(-3) });
    const s2 = session({ id: "s2", child_id: "c1", started_at: at(-10) });
    const patterns = detectPatterns(input({
      sessions: [s1, s2],
      entries: [entry("s2", "observation", "Became upset after the phone call with mum.")],
    }));
    const fam = patterns.find((p) => p.key === "family_contact:c1")!;
    expect(fam.insight).toMatch(/incidents in the last 30 days occurred after family contact/);
    expect(fam.insight).toMatch(/family contact support plan, emotional preparation before calls, and post-contact regulation support/);
  });

  it("detects frequency (>=3 in 30d), escalation, and bedtime clusters", () => {
    const sessions = [
      session({ id: "a", child_id: "c1", started_at: at(-2, "T20:30:00Z") }),
      session({ id: "b", child_id: "c1", started_at: at(-5, "T21:15:00Z") }),
      session({ id: "c", child_id: "c1", started_at: at(-20, "T09:00:00Z") }),
    ];
    const patterns = detectPatterns(input({ sessions }));
    expect(patterns.find((p) => p.key === "frequency:c1")?.count).toBe(3);
    expect(patterns.find((p) => p.key === "escalation:c1")).toBeTruthy();   // 2 in last 14d vs 1 prior
    expect(patterns.find((p) => p.key === "bedtime:c1")?.count).toBe(2);    // two evening starts
  });

  it("spots the missing-child-voice pattern with the spec wording", () => {
    const sessions = [session({ id: "a", child_id: "c1" }), session({ id: "b", child_id: "c1", started_at: at(-4) })];
    const patterns = detectPatterns(input({ sessions })); // no child_voice entries at all
    const v = patterns.find((p) => p.key === "missing_voice:c1")!;
    expect(v.insight).toMatch(/often miss the child's voice. Consider a key-work session or advocacy support/);
  });

  it("raises a supportive recording-quality theme at >=2 flagged reviews per staff member", () => {
    const review = (id: string, flags: string[]): AriaRecordingReview => ({
      id, home_id: "home_oak", child_id: "c1", user_id: "staff_a", incident_session_id: null,
      record_type: "incident_report", raw_text: "r", ai_suggested_text: null, final_accepted_text: "f",
      ai_quality_flags: flags, staff_accepted: true, accepted_at: at(0), manager_review_required: false,
      manager_reviewed_by: null, manager_reviewed_at: null, created_at: at(0), updated_at: at(0),
    });
    const patterns = detectPatterns(input({ reviews: [review("r1", ["Child's voice"]), review("r2", ["Context"])] }));
    const q = patterns.find((p) => p.kind === "recording_quality_issue")!;
    expect(q.suggestion).toMatch(/supportive coaching/i);
    expect(q.suggestion).toMatch(/not blame/i);
  });

  it("frames repeated staff–child pairing as support, never blame", () => {
    const sessions = ["a", "b", "c"].map((id, i) => session({ id, child_id: "c1", started_at: at(-i - 1) }));
    const patterns = detectPatterns(input({ sessions }));
    const pair = patterns.find((p) => p.kind === "staff_support_needed")!;
    expect(pair.suggestion).toMatch(/support prompt, not a blame signal/);
  });

  it("is deterministic and ignores sessions older than 30 days", () => {
    const args = input({ sessions: [session({ id: "old", child_id: "c1", started_at: at(-45) })] });
    expect(detectPatterns(args)).toEqual(detectPatterns(args));
    expect(detectPatterns(args)).toHaveLength(0);
  });
});

describe("summary + disclaimer", () => {
  it("summarises and stays calm when clear", () => {
    expect(oversightSummary([], [], 0).headline).toMatch(/Nothing needs your oversight/);
    expect(OVERSIGHT_DISCLAIMER).toMatch(/ARIA never decides/);
  });
});
