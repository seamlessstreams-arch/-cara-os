import { describe, it, expect } from "vitest";
import {
  analyseIncidents,
  type IncidentRecord,
} from "../incident-analysis";

// ── Helpers ────────────────────────────────────────────────────────���────────

function makeDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

function makeIncident(overrides: Partial<IncidentRecord> = {}): IncidentRecord {
  return {
    id: `inc_${Math.random().toString(36).slice(2, 8)}`,
    date: makeDate(3),
    time: "15:30",
    childId: "child_1",
    childName: "Jordan P",
    category: "aggression_verbal",
    severity: "medium",
    description: "Test incident",
    trigger: "transition",
    deEscalationAttempted: true,
    deEscalationSuccessful: true,
    restraintUsed: false,
    staffInvolved: ["staff_1"],
    injuryToChild: false,
    injuryToStaff: false,
    notifiedOfsted: false,
    notifiedSocialWorker: false,
    notifiedParent: true,
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<IncidentRecord> = {}): IncidentRecord {
  return makeIncident({
    category: "aggression_physical",
    severity: "high",
    restraintUsed: true,
    restraintType: "physical",
    restraintDurationMinutes: 5,
    deEscalationAttempted: true,
    deEscalationSuccessful: false,
    debriefCompleted: true,
    bodyMapCompleted: true,
    notifiedOfsted: true,
    ...overrides,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Incident Analysis", () => {
  describe("basic structure", () => {
    it("returns correct structure with no records", () => {
      const result = analyseIncidents([], "home_oak", 28);
      expect(result.homeId).toBe("home_oak");
      expect(result.windowDays).toBe(28);
      expect(result.totalIncidents).toBe(0);
      expect(result.incidentsPerWeek).toBe(0);
      expect(result.trend).toBe("stable");
      expect(result.alerts).toHaveLength(0);
      expect(result.regulatoryStatus.compliant).toBe(true);
    });

    it("calculates incidents per week", () => {
      const records = Array.from({ length: 8 }, (_, i) => makeIncident({ date: makeDate(i) }));
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.incidentsPerWeek).toBe(2); // 8 in 28 days = 2/week
    });
  });

  // ── Trend detection ───────────────────────────────────────────────────────

  describe("trend detection", () => {
    it("detects increasing trend", () => {
      const records = [
        makeIncident({ date: makeDate(25) }),
        makeIncident({ date: makeDate(5) }),
        makeIncident({ date: makeDate(4) }),
        makeIncident({ date: makeDate(3) }),
        makeIncident({ date: makeDate(2) }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.trend).toBe("increasing");
    });

    it("detects decreasing trend", () => {
      const records = [
        makeIncident({ date: makeDate(25) }),
        makeIncident({ date: makeDate(24) }),
        makeIncident({ date: makeDate(23) }),
        makeIncident({ date: makeDate(22) }),
        makeIncident({ date: makeDate(2) }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.trend).toBe("decreasing");
    });

    it("stable when evenly distributed", () => {
      const records = [
        makeIncident({ date: makeDate(20) }),
        makeIncident({ date: makeDate(15) }),
        makeIncident({ date: makeDate(10) }),
        makeIncident({ date: makeDate(5) }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.trend).toBe("stable");
    });
  });

  // ── Severity breakdown ────────────────────────────────────────────────────

  describe("severity breakdown", () => {
    it("counts by severity level", () => {
      const records = [
        makeIncident({ severity: "low" }),
        makeIncident({ severity: "medium" }),
        makeIncident({ severity: "medium" }),
        makeIncident({ severity: "high" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      const medium = result.severityBreakdown.find((s) => s.severity === "medium");
      expect(medium!.count).toBe(2);
      expect(medium!.percent).toBe(50);
    });
  });

  // ── Category breakdown ────────────────────────────────────────────────────

  describe("category breakdown", () => {
    it("counts by category", () => {
      const records = [
        makeIncident({ category: "aggression_verbal" }),
        makeIncident({ category: "aggression_verbal" }),
        makeIncident({ category: "property_damage" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.categoryBreakdown[0].category).toBe("aggression_verbal");
      expect(result.categoryBreakdown[0].count).toBe(2);
    });

    it("sorted by count descending", () => {
      const records = [
        makeIncident({ category: "self_harm" }),
        makeIncident({ category: "aggression_physical" }),
        makeIncident({ category: "aggression_physical" }),
        makeIncident({ category: "aggression_physical" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.categoryBreakdown[0].category).toBe("aggression_physical");
    });
  });

  // ── Restraint analysis ────────────────────────────────────────────────────

  describe("restraint analysis", () => {
    it("counts restraints and calculates rate", () => {
      const records = [
        makeIncident(),
        makeIncident(),
        makeRestraint(),
        makeRestraint(),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.restraintAnalysis.totalRestraints).toBe(2);
      expect(result.restraintAnalysis.restraintRate).toBe(50);
    });

    it("calculates average restraint duration", () => {
      const records = [
        makeRestraint({ restraintDurationMinutes: 4 }),
        makeRestraint({ restraintDurationMinutes: 8 }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.restraintAnalysis.averageDuration).toBe(6);
    });

    it("calculates debrief rate", () => {
      const records = [
        makeRestraint({ debriefCompleted: true }),
        makeRestraint({ debriefCompleted: true }),
        makeRestraint({ debriefCompleted: false }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.restraintAnalysis.debriefRate).toBe(67);
    });

    it("tracks de-escalation before restraint", () => {
      const records = [
        makeRestraint({ deEscalationAttempted: true }),
        makeRestraint({ deEscalationAttempted: true }),
        makeRestraint({ deEscalationAttempted: false }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.restraintAnalysis.deEscalationBeforeRestraint).toBe(67);
    });

    it("tracks injury during restraint", () => {
      const records = [
        makeRestraint({ injuryToChild: true }),
        makeRestraint({ injuryToStaff: true }),
        makeRestraint({ injuryToChild: false, injuryToStaff: false }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.restraintAnalysis.injuryDuringRestraint).toBe(2);
    });
  });

  // ── Time patterns ─────────────────────────────────────────────────────────

  describe("time patterns", () => {
    it("identifies peak hour", () => {
      const records = [
        makeIncident({ time: "15:30" }),
        makeIncident({ time: "15:45" }),
        makeIncident({ time: "15:10" }),
        makeIncident({ time: "08:00" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.timePatterns.peakHour).toBe(15);
    });

    it("counts weekday vs weekend", () => {
      // Use specific dates — Wed=weekday, Sat=weekend
      const wed = "2026-05-13"; // Wednesday
      const sat = "2026-05-10"; // Saturday
      const records = [
        makeIncident({ date: wed }),
        makeIncident({ date: wed }),
        makeIncident({ date: sat }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.timePatterns.weekdayVsWeekend.weekday).toBe(2);
      expect(result.timePatterns.weekdayVsWeekend.weekend).toBe(1);
    });
  });

  // ── Per-child breakdown ───────────────────────────────────────────────────

  describe("child breakdown", () => {
    it("groups incidents by child", () => {
      const records = [
        makeIncident({ childId: "c1", childName: "Jordan" }),
        makeIncident({ childId: "c1", childName: "Jordan" }),
        makeIncident({ childId: "c1", childName: "Jordan" }),
        makeIncident({ childId: "c2", childName: "Sam" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.childBreakdown).toHaveLength(2);
      expect(result.childBreakdown[0].childName).toBe("Jordan");
      expect(result.childBreakdown[0].totalIncidents).toBe(3);
    });

    it("identifies most common trigger per child", () => {
      const records = [
        makeIncident({ childId: "c1", trigger: "transition" }),
        makeIncident({ childId: "c1", trigger: "transition" }),
        makeIncident({ childId: "c1", trigger: "boundary" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.childBreakdown[0].mostCommonTrigger).toBe("transition");
    });

    it("sorted by incident count descending", () => {
      const records = [
        makeIncident({ childId: "c1", childName: "Less" }),
        makeIncident({ childId: "c2", childName: "More" }),
        makeIncident({ childId: "c2", childName: "More" }),
        makeIncident({ childId: "c2", childName: "More" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.childBreakdown[0].childName).toBe("More");
    });
  });

  // ── Trigger analysis ──────────────────────────────────────────────────────

  describe("trigger analysis", () => {
    it("aggregates triggers across all incidents", () => {
      const records = [
        makeIncident({ trigger: "transition" }),
        makeIncident({ trigger: "transition" }),
        makeIncident({ trigger: "boundary" }),
        makeIncident({ trigger: "peer_conflict" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.triggerAnalysis[0].trigger).toBe("transition");
      expect(result.triggerAnalysis[0].count).toBe(2);
    });

    it("tracks which children associated with each trigger", () => {
      const records = [
        makeIncident({ childId: "c1", childName: "Jordan", trigger: "transition" }),
        makeIncident({ childId: "c2", childName: "Sam", trigger: "transition" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      const transition = result.triggerAnalysis.find((t) => t.trigger === "transition");
      expect(transition!.associatedChildren).toContain("Jordan");
      expect(transition!.associatedChildren).toContain("Sam");
    });
  });

  // ── De-escalation ─────────────────────────────────────────────────────────

  describe("de-escalation", () => {
    it("calculates de-escalation success rate", () => {
      const records = [
        makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: true }),
        makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: true }),
        makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: false }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.deEscalationRate).toBe(67);
    });
  });

  // ── Alerts ────────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("high alert for increasing trend", () => {
      const records = [
        makeIncident({ date: makeDate(25) }),
        makeIncident({ date: makeDate(5) }),
        makeIncident({ date: makeDate(4) }),
        makeIncident({ date: makeDate(3) }),
        makeIncident({ date: makeDate(2) }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      const trendAlert = result.alerts.find((a) => a.category === "trend");
      expect(trendAlert).toBeDefined();
      expect(trendAlert!.severity).toBe("high");
    });

    it("critical alert for restraint without de-escalation", () => {
      const records = [
        makeRestraint({ deEscalationAttempted: false }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      const alert = result.alerts.find((a) => a.category === "restraint" && a.severity === "critical");
      expect(alert).toBeDefined();
      expect(alert!.regulation).toContain("Reg 12");
    });

    it("critical alert for missing Ofsted notifications", () => {
      const records = [
        makeIncident({ severity: "critical", notifiedOfsted: false }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      const alert = result.alerts.find((a) => a.category === "notification");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("critical");
      expect(alert!.regulation).toContain("Reg 40");
    });

    it("no notification alert when all notified", () => {
      const records = [
        makeIncident({ severity: "critical", notifiedOfsted: true }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      const alert = result.alerts.find((a) => a.category === "notification");
      expect(alert).toBeUndefined();
    });

    it("high alert for self-harm pattern (3+)", () => {
      const records = [
        makeIncident({ category: "self_harm" }),
        makeIncident({ category: "self_harm" }),
        makeIncident({ category: "self_harm" }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      const shAlert = result.alerts.find((a) => a.category === "safeguarding");
      expect(shAlert).toBeDefined();
    });

    it("medium alert for incomplete debriefs", () => {
      const records = [
        makeRestraint({ debriefCompleted: false }),
        makeRestraint({ debriefCompleted: true }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      const debriefAlert = result.alerts.find((a) => a.title.includes("debrief"));
      expect(debriefAlert).toBeDefined();
    });

    it("alerts sorted by severity", () => {
      const records = [
        makeRestraint({ deEscalationAttempted: false }), // critical
        makeIncident({ date: makeDate(25) }), // for trend (need enough)
        makeIncident({ date: makeDate(3) }),
        makeIncident({ date: makeDate(2) }),
        makeIncident({ date: makeDate(1) }),
        makeIncident({ date: makeDate(1) }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      if (result.alerts.length >= 2) {
        expect(result.alerts[0].severity).toBe("critical");
      }
    });
  });

  // ── Regulatory status ─────────────────────────────────────────────────────

  describe("regulatory status", () => {
    it("compliant when no issues", () => {
      const records = [
        makeIncident({ severity: "low", deEscalationAttempted: true, deEscalationSuccessful: true }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.regulatoryStatus.compliant).toBe(true);
    });

    it("non-compliant with missing notifications", () => {
      const records = [
        makeIncident({ severity: "critical", notifiedOfsted: false }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.regulatoryStatus.compliant).toBe(false);
      expect(result.regulatoryStatus.issues.some((i) => i.includes("Reg 40"))).toBe(true);
    });

    it("strength for no restraints", () => {
      const records = [
        makeIncident({ restraintUsed: false }),
        makeIncident({ restraintUsed: false }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.regulatoryStatus.strengths.some((s) => s.includes("No restraints"))).toBe(true);
    });

    it("strength for good de-escalation rate", () => {
      const records = [
        makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: true }),
        makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: true }),
        makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: true }),
        makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: true }),
        makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: false }),
      ];
      const result = analyseIncidents(records, "home_oak", 28);
      expect(result.regulatoryStatus.strengths.some((s) => s.includes("de-escalation"))).toBe(true);
    });
  });
});
