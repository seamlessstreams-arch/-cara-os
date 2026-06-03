import { describe, it, expect } from "vitest";
import {
  computeConflictDetection,
  type ConflictDetectionInput,
  type SubjectInterval,
} from "../conflict-detection-engine";
import type { CornerstoneEvent, CornerstoneEventType, CornerstoneRiskLevel } from "@/types/cornerstone-event";

const TODAY = "2026-06-03";

function ev(o: {
  id: string; eventType: CornerstoneEventType; occurredAt: string;
  childId?: string; staffId?: string; createdBy?: string;
  summary?: string; tags?: string[]; risk?: CornerstoneRiskLevel;
}): CornerstoneEvent {
  return {
    id: o.id,
    eventType: o.eventType,
    homeId: "home_oak",
    childId: o.childId,
    staffId: o.staffId,
    occurredAt: o.occurredAt,
    createdBy: o.createdBy ?? o.staffId ?? "staff_x",
    summary: o.summary ?? "",
    structuredTags: o.tags ?? [],
    riskLevel: o.risk ?? "low",
    requiresApproval: false,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    audit: { createdAt: o.occurredAt, updatedAt: o.occurredAt, version: 1, changeHistory: [] },
  };
}

const CHILDREN = [{ id: "yp1", first_name: "Ava", last_name: "Reed", preferred_name: null }];
const STAFF = [{ id: "staff1", first_name: "Sam", last_name: "Lee", preferred_name: null }];

describe("conflict-detection engine", () => {
  it("R1: flags a care log timestamped inside a recorded missing episode", () => {
    const intervals: SubjectInterval[] = [{
      kind: "missing", subject_kind: "child", subject_id: "yp1",
      start: "2026-05-01T20:00:00.000Z", end: "2026-05-01T23:00:00.000Z",
      label: "high-risk missing episode", source_event_id: "evt_mis_1", risk_level: "high",
    }];
    const events = [
      ev({ id: "evt_mis_1", eventType: "missing", childId: "yp1", occurredAt: "2026-05-01T20:00:00.000Z", summary: "Missing episode — active", risk: "high", tags: ["missing"] }),
      ev({ id: "evt_log_in", eventType: "daily_log", childId: "yp1", occurredAt: "2026-05-01T21:30:00.000Z", summary: "evening log: watched a film together, settled", tags: ["daily_log"] }),
      ev({ id: "evt_log_out", eventType: "daily_log", childId: "yp1", occurredAt: "2026-05-01T19:00:00.000Z", summary: "teatime log: ate well", tags: ["daily_log"] }),
    ];
    const r = computeConflictDetection({ events, intervals, children: CHILDREN, today: TODAY });
    const c = r.conflicts.filter((x) => x.category === "present_while_missing");
    expect(c.length).toBe(1); // only the inside-window log, not the 19:00 one
    expect(c[0].event_b.event_id).toBe("evt_log_in");
    expect(c[0].subject_name).toBe("Ava Reed");
    expect(c[0].severity).toBe("high");
    expect(c[0].aria_assessment.likely_accurate_event_id).toBe("evt_mis_1");
  });

  it("R2: flags an injury recorded in one record but denied in another within 24h", () => {
    const events = [
      ev({ id: "evt_pi", eventType: "physical_intervention", childId: "yp1", occurredAt: "2026-05-02T14:00:00.000Z", summary: "Physical intervention — injury recorded", tags: ["physical_intervention", "injury"], risk: "critical" }),
      ev({ id: "evt_log", eventType: "daily_log", childId: "yp1", occurredAt: "2026-05-02T18:00:00.000Z", summary: "evening log: calm, no injuries or marks observed", tags: ["daily_log"] }),
    ];
    const r = computeConflictDetection({ events, children: CHILDREN, today: TODAY });
    const c = r.conflicts.filter((x) => x.category === "injury_contradiction");
    expect(c.length).toBe(1);
    expect(c[0].event_a.event_id).toBe("evt_pi");   // the record documenting the injury leads
    expect(c[0].event_b.event_id).toBe("evt_log");
    expect(c[0].aria_assessment.likely_accurate_event_id).toBe("evt_pi"); // formal record
  });

  it("R3: flags the same event graded with two different severities", () => {
    const events = [
      ev({ id: "evt_a", eventType: "incident", childId: "yp1", occurredAt: "2026-05-03T10:00:00.000Z", summary: "Incident: altercation in the kitchen between two residents", risk: "high" }),
      ev({ id: "evt_b", eventType: "incident", childId: "yp1", occurredAt: "2026-05-03T13:00:00.000Z", summary: "Incident: altercation in the kitchen between residents", risk: "low" }),
    ];
    const r = computeConflictDetection({ events, children: CHILDREN, today: TODAY });
    const c = r.conflicts.filter((x) => x.category === "conflicting_severity");
    expect(c.length).toBe(1);
    expect(c[0].event_a.risk_level).toBe("high"); // higher risk leads
    expect(c[0].event_b.risk_level).toBe("low");
    expect(c[0].aria_assessment.likely_accurate_event_id).toBe("evt_a"); // precautionary: higher stands
  });

  it("R4: flags a staff member working inside a leave period", () => {
    const intervals: SubjectInterval[] = [{
      kind: "leave", subject_kind: "staff", subject_id: "staff1",
      start: "2026-05-10T00:00:00.000Z", end: "2026-05-12T23:59:00.000Z",
      label: "annual leave", source_event_id: "evt_abs_1", risk_level: "low",
    }];
    const events = [
      ev({ id: "evt_ot", eventType: "overtime", staffId: "staff1", occurredAt: "2026-05-11T09:00:00.000Z", summary: "Overtime: 90 minutes" }),
    ];
    const r = computeConflictDetection({ events, intervals, staff: STAFF, today: TODAY });
    const c = r.conflicts.filter((x) => x.category === "staff_unavailable_conflict");
    expect(c.length).toBe(1);
    expect(c[0].subject_name).toBe("Sam Lee");
    expect(c[0].severity).toBe("medium");
    expect(c[0].aria_assessment.likely_accurate_event_id).toBeNull(); // genuinely unclear
  });

  it("returns no conflicts and a positive insight for internally-consistent records", () => {
    const events = [
      ev({ id: "e1", eventType: "daily_log", childId: "yp1", occurredAt: "2026-05-04T09:00:00.000Z", summary: "morning log: breakfast, school run" }),
      ev({ id: "e2", eventType: "keywork", childId: "yp1", occurredAt: "2026-05-05T15:00:00.000Z", summary: "key-work session about goals" }),
    ];
    const r = computeConflictDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.conflicts.length).toBe(0);
    expect(r.insights[0].severity).toBe("positive");
    expect(r.overview.auto_resolved).toBe(0);
  });

  it("SAFEGUARD: every conflict needs human review and is never auto-resolved", () => {
    const intervals: SubjectInterval[] = [{
      kind: "missing", subject_kind: "child", subject_id: "yp1",
      start: "2026-05-01T20:00:00.000Z", end: "2026-05-01T23:00:00.000Z",
      label: "high-risk missing episode", source_event_id: "evt_mis_1", risk_level: "high",
    }];
    const events = [
      ev({ id: "evt_mis_1", eventType: "missing", childId: "yp1", occurredAt: "2026-05-01T20:00:00.000Z", summary: "Missing episode — active", risk: "high", tags: ["missing"] }),
      ev({ id: "evt_log_in", eventType: "daily_log", childId: "yp1", occurredAt: "2026-05-01T21:30:00.000Z", summary: "log: settled" }),
    ];
    const r = computeConflictDetection({ events, intervals, children: CHILDREN, today: TODAY });
    expect(r.conflicts.length).toBeGreaterThan(0);
    expect(r.overview.auto_resolved).toBe(0);
    for (const c of r.conflicts) {
      expect(c.status).toBe("needs_human_review");
      expect(c.auto_resolved).toBe(false);
      expect(c.aria_assessment.confidence).toBeGreaterThanOrEqual(0);
      expect(c.aria_assessment.confidence).toBeLessThanOrEqual(1);
    }
    // The transparency safeguard statement is always surfaced when conflicts exist.
    expect(r.insights.some((i) => /never auto-resolved/i.test(i.text))).toBe(true);
  });

  it("is deterministic — identical input yields identical JSON", () => {
    const input: ConflictDetectionInput = {
      events: [
        ev({ id: "evt_pi", eventType: "physical_intervention", childId: "yp1", occurredAt: "2026-05-02T14:00:00.000Z", summary: "Physical intervention — injury recorded", tags: ["injury"], risk: "critical" }),
        ev({ id: "evt_log", eventType: "daily_log", childId: "yp1", occurredAt: "2026-05-02T18:00:00.000Z", summary: "evening log: no injuries or marks observed" }),
      ],
      children: CHILDREN, today: TODAY,
    };
    expect(JSON.stringify(computeConflictDetection(input))).toBe(JSON.stringify(computeConflictDetection(input)));
  });
});
