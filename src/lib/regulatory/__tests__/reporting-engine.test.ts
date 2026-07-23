// ══════════════════════════════════════════════════════════════════════════════
// Cara Regulatory — Reporting Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateRegulatoryCompliance,
  checkNotificationTimeliness,
  generateReg44Schedule,
  validateReg44Report,
  summarizeActionPoints,
  getNotificationDeadlineHours,
  getReg44Sections,
  getNotificationTypeLabel,
  getReg44SectionLabel,
} from "../reporting-engine";
import type {
  Reg44Report,
  Reg45Review,
  StatutoryNotification,
  ActionPoint,
  Reg44SectionEntry,
  Reg44Section,
} from "../reporting-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeReg44Report(overrides: Partial<Reg44Report> = {}): Reg44Report {
  return {
    id: "reg44-001",
    homeId: "home-oak",
    visitDate: "2026-05-10T10:00:00Z",
    visitorId: "visitor-001",
    visitorName: "Margaret Wilson",
    status: "published",
    reportMonth: "2026-05",
    dueDate: "2026-05-17T10:00:00Z",
    submittedAt: "2026-05-12T14:00:00Z",
    sections: buildAllSections(),
    actionPoints: [
      makeActionPoint({ id: "ap-1", status: "completed", completedAt: "2026-05-14T10:00:00Z" }),
      makeActionPoint({ id: "ap-2", status: "open", dueDate: "2026-05-30T00:00:00Z" }),
    ],
    overallJudgement: "good",
    childrenSpokenTo: 3,
    staffSpokenTo: 4,
    announced: false,
    ...overrides,
  };
}

function makeReg45Review(overrides: Partial<Reg45Review> = {}): Reg45Review {
  return {
    id: "reg45-001",
    homeId: "home-oak",
    reviewPeriod: "2025-H2",
    reviewedBy: "user-ri-1",
    reviewerRole: "responsible_individual",
    status: "published",
    dueDate: "2026-01-31T00:00:00Z",
    submittedAt: "2026-01-25T10:00:00Z",
    schedule4Findings: [
      { matter: "child_progress", finding: "Good progress across all children.", trend: "improving", dataPoints: 12, concern: false },
      { matter: "restraint_use", finding: "2 incidents in period, both justified.", trend: "stable", dataPoints: 2, concern: false },
    ],
    qualityRating: "good",
    improvementActions: [
      makeActionPoint({ id: "reg45-ap-1", status: "completed" }),
    ],
    developmentPlan: ["Increase therapeutic interventions", "Develop independence skills programme"],
    sentToOfsted: true,
    sentToOfstedAt: "2026-02-01T10:00:00Z",
    ...overrides,
  };
}

function makeNotification(overrides: Partial<StatutoryNotification> = {}): StatutoryNotification {
  return {
    id: "notif-001",
    homeId: "home-oak",
    type: "absconding",
    incidentDate: "2026-05-10T22:00:00Z",
    reportedAt: "2026-05-11T08:00:00Z",
    reportedBy: "user-tl-1",
    sentToOfsted: true,
    sentToOfstedAt: "2026-05-11T09:00:00Z",
    sentToLA: true,
    sentToLAAt: "2026-05-11T09:00:00Z",
    dueBy: "2026-05-11T22:00:00Z",
    isOverdue: false,
    summary: "Jordan left the home without permission at 22:00. Located by police at 23:30 and returned safely.",
    childId: "child-jordan",
    ...overrides,
  };
}

function makeActionPoint(overrides: Partial<ActionPoint> = {}): ActionPoint {
  return {
    id: "ap-default",
    description: "Review fire evacuation procedure and update signage.",
    priority: "medium",
    assignedTo: "user-rm-1",
    dueDate: "2026-06-01T00:00:00Z",
    status: "open",
    ...overrides,
  };
}

function buildAllSections(): Reg44SectionEntry[] {
  const sections: Reg44Section[] = [
    "children_views", "practice_standards", "staffing", "safeguarding",
    "environment", "health", "education", "records", "complaints",
    "previous_actions", "overall_judgement",
  ];
  return sections.map(section => ({
    section,
    findings: `Findings for ${section}`,
    rating: "adequate" as const,
    evidenceNotes: "Evidence reviewed.",
  }));
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateRegulatoryCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRegulatoryCompliance", () => {
  it("returns compliant status when all requirements met", () => {
    const reports = [makeReg44Report()];
    const reviews = [makeReg45Review()];
    const notifications = [makeNotification()];

    const result = evaluateRegulatoryCompliance(reports, reviews, notifications, "home-oak", FIXED_NOW);
    expect(result.overallStatus).toBe("compliant");
    expect(result.issues).toHaveLength(0);
  });

  it("detects overdue Reg 44 visit (>35 days since last)", () => {
    const reports = [makeReg44Report({ visitDate: "2026-04-01T10:00:00Z" })]; // 45 days ago
    const result = evaluateRegulatoryCompliance(reports, [], [], "home-oak", FIXED_NOW);
    expect(result.overallStatus).toBe("non_compliant");
    expect(result.issues.some(i => i.includes("Reg 44 visit overdue"))).toBe(true);
    expect(result.reg44Compliance.daysSinceLastVisit).toBeGreaterThan(35);
  });

  it("counts completed Reg 44 reports", () => {
    const reports = [
      makeReg44Report({ id: "r1", reportMonth: "2026-05" }),
      makeReg44Report({ id: "r2", reportMonth: "2026-04", visitDate: "2026-04-10T10:00:00Z" }),
      makeReg44Report({ id: "r3", reportMonth: "2026-03", visitDate: "2026-03-10T10:00:00Z", status: "overdue" }),
    ];
    const result = evaluateRegulatoryCompliance(reports, [], [], "home-oak", FIXED_NOW);
    expect(result.reg44Compliance.completed).toBe(2);
    expect(result.reg44Compliance.overdue).toBe(1);
  });

  it("warns when majority of visits are announced", () => {
    const reports = [
      makeReg44Report({ id: "r1", announced: true }),
      makeReg44Report({ id: "r2", announced: true, visitDate: "2026-04-10T10:00:00Z" }),
      makeReg44Report({ id: "r3", announced: true, visitDate: "2026-03-10T10:00:00Z" }),
      makeReg44Report({ id: "r4", announced: false, visitDate: "2026-02-10T10:00:00Z" }),
    ];
    const result = evaluateRegulatoryCompliance(reports, [], [], "home-oak", FIXED_NOW);
    expect(result.issues.some(i => i.includes("announced"))).toBe(true);
    expect(result.reg44Compliance.announcedPercentage).toBe(75);
  });

  it("tracks open and overdue action points", () => {
    const reports = [makeReg44Report({
      actionPoints: [
        makeActionPoint({ id: "ap-1", status: "open", dueDate: "2026-04-01T00:00:00Z" }), // overdue
        makeActionPoint({ id: "ap-2", status: "open", dueDate: "2026-06-01T00:00:00Z" }), // not overdue
        makeActionPoint({ id: "ap-3", status: "completed" }),
      ],
    })];
    const result = evaluateRegulatoryCompliance(reports, [], [], "home-oak", FIXED_NOW);
    expect(result.reg44Compliance.openActionPoints).toBe(2);
    expect(result.reg44Compliance.overdueActionPoints).toBe(1);
  });

  it("detects overdue Reg 45 review", () => {
    const reviews = [makeReg45Review({ status: "overdue" })];
    const result = evaluateRegulatoryCompliance([], reviews, [], "home-oak", FIXED_NOW);
    expect(result.reg45Compliance.overdue).toBe(1);
    expect(result.issues.some(i => i.includes("Reg 45"))).toBe(true);
  });

  it("detects Reg 45 not sent to Ofsted", () => {
    const reviews = [makeReg45Review({ sentToOfsted: false })];
    const result = evaluateRegulatoryCompliance([], reviews, [], "home-oak", FIXED_NOW);
    expect(result.issues.some(i => i.includes("Ofsted"))).toBe(true);
  });

  it("tracks notification compliance rate", () => {
    const notifications = [
      makeNotification({ id: "n1", isOverdue: false }),
      makeNotification({ id: "n2", isOverdue: false }),
      makeNotification({ id: "n3", isOverdue: true }),
    ];
    const result = evaluateRegulatoryCompliance([], [], notifications, "home-oak", FIXED_NOW);
    expect(result.notifications.total).toBe(3);
    expect(result.notifications.overdue).toBe(1);
    expect(result.notifications.withinTimescale).toBe(2);
    expect(result.notifications.complianceRate).toBe(67);
  });

  it("filters by homeId", () => {
    const reports = [
      makeReg44Report({ id: "r1", homeId: "home-oak" }),
      makeReg44Report({ id: "r2", homeId: "home-elm" }),
    ];
    const result = evaluateRegulatoryCompliance(reports, [], [], "home-oak", FIXED_NOW);
    expect(result.reg44Compliance.completed).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// checkNotificationTimeliness
// ══════════════════════════════════════════════════════════════════════════════

describe("checkNotificationTimeliness", () => {
  it("returns timely for notification within deadline", () => {
    const notification = makeNotification({
      type: "absconding",
      incidentDate: "2026-05-10T22:00:00Z",
      reportedAt: "2026-05-11T08:00:00Z", // 10 hours later (deadline: 24h)
    });
    const result = checkNotificationTimeliness(notification);
    expect(result.timely).toBe(true);
    expect(result.deadlineHours).toBe(24);
    expect(result.hoursToDeadline).toBeGreaterThan(0);
  });

  it("returns not timely for late notification", () => {
    const notification = makeNotification({
      type: "death",
      incidentDate: "2026-05-10T08:00:00Z",
      reportedAt: "2026-05-12T10:00:00Z", // 50 hours later (deadline: 24h)
    });
    const result = checkNotificationTimeliness(notification);
    expect(result.timely).toBe(false);
    expect(result.hoursToDeadline).toBeLessThan(0);
  });

  it("uses correct deadline for 'without delay' types", () => {
    const notification = makeNotification({
      type: "police_involvement",
      incidentDate: "2026-05-10T14:00:00Z",
      reportedAt: "2026-05-10T14:30:00Z", // 30 min
    });
    const result = checkNotificationTimeliness(notification);
    expect(result.deadlineHours).toBe(0);
    // Even 30 min exceeds 0-hour deadline
    expect(result.timely).toBe(false);
  });

  it("handles accommodation change (5 working days)", () => {
    const notification = makeNotification({
      type: "accommodation_change",
      incidentDate: "2026-05-10T08:00:00Z",
      reportedAt: "2026-05-12T08:00:00Z", // 48 hours (deadline: 120h)
    });
    const result = checkNotificationTimeliness(notification);
    expect(result.timely).toBe(true);
    expect(result.deadlineHours).toBe(120);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateReg44Schedule
// ══════════════════════════════════════════════════════════════════════════════

describe("generateReg44Schedule", () => {
  it("generates 12 monthly reports", () => {
    const schedule = generateReg44Schedule("home-oak", 2026, "visitor-001", "Margaret Wilson");
    expect(schedule).toHaveLength(12);
  });

  it("all reports are scheduled status", () => {
    const schedule = generateReg44Schedule("home-oak", 2026, "visitor-001", "Margaret Wilson");
    expect(schedule.every(r => r.status === "scheduled")).toBe(true);
  });

  it("majority are unannounced", () => {
    const schedule = generateReg44Schedule("home-oak", 2026, "visitor-001", "Margaret Wilson");
    const announced = schedule.filter(r => r.announced).length;
    expect(announced).toBeLessThan(6); // less than half
  });

  it("assigns correct homeId and visitor", () => {
    const schedule = generateReg44Schedule("home-oak", 2026, "visitor-001", "Margaret Wilson");
    expect(schedule[0].homeId).toBe("home-oak");
    expect(schedule[0].visitorId).toBe("visitor-001");
    expect(schedule[0].visitorName).toBe("Margaret Wilson");
  });

  it("report months cover all 12 months", () => {
    const schedule = generateReg44Schedule("home-oak", 2026, "visitor-001", "Margaret Wilson");
    const months = schedule.map(r => r.reportMonth);
    expect(months).toContain("2026-01");
    expect(months).toContain("2026-06");
    expect(months).toContain("2026-12");
  });

  it("due dates are after visit dates", () => {
    const schedule = generateReg44Schedule("home-oak", 2026, "visitor-001", "Margaret Wilson");
    for (const report of schedule) {
      expect(new Date(report.dueDate).getTime()).toBeGreaterThan(new Date(report.visitDate).getTime());
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// validateReg44Report
// ══════════════════════════════════════════════════════════════════════════════

describe("validateReg44Report", () => {
  it("validates complete report", () => {
    const report = makeReg44Report();
    const result = validateReg44Report(report);
    expect(result.isComplete).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.missingSections).toHaveLength(0);
  });

  it("detects missing sections", () => {
    const report = makeReg44Report({
      sections: buildAllSections().slice(0, 5), // only 5 of 11
    });
    const result = validateReg44Report(report);
    expect(result.isComplete).toBe(false);
    expect(result.missingSections.length).toBe(6);
    expect(result.errors.some(e => e.includes("sections not completed"))).toBe(true);
  });

  it("errors when no children spoken to", () => {
    const report = makeReg44Report({ childrenSpokenTo: 0 });
    const result = validateReg44Report(report);
    expect(result.isComplete).toBe(false);
    expect(result.errors.some(e => e.includes("children"))).toBe(true);
  });

  it("warns when no staff spoken to", () => {
    const report = makeReg44Report({ staffSpokenTo: 0 });
    const result = validateReg44Report(report);
    expect(result.isComplete).toBe(true); // warning not error
    expect(result.warnings.some(w => w.includes("staff"))).toBe(true);
  });

  it("errors when overall judgement missing", () => {
    const report = makeReg44Report({ overallJudgement: undefined });
    const result = validateReg44Report(report);
    expect(result.isComplete).toBe(false);
    expect(result.errors.some(e => e.includes("judgement"))).toBe(true);
  });

  it("warns for action points without assignee", () => {
    const report = makeReg44Report({
      actionPoints: [makeActionPoint({ assignedTo: "" })],
    });
    const result = validateReg44Report(report);
    expect(result.warnings.some(w => w.includes("assignee"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// summarizeActionPoints
// ══════════════════════════════════════════════════════════════════════════════

describe("summarizeActionPoints", () => {
  it("summarizes action points across reports", () => {
    const reports = [
      makeReg44Report({
        actionPoints: [
          makeActionPoint({ id: "ap-1", status: "completed", completedAt: "2026-05-14T10:00:00Z" }),
          makeActionPoint({ id: "ap-2", status: "open", priority: "high" }),
          makeActionPoint({ id: "ap-3", status: "overdue", priority: "immediate" }),
        ],
      }),
    ];
    const result = summarizeActionPoints(reports, FIXED_NOW);
    expect(result.total).toBe(3);
    expect(result.completed).toBe(1);
    expect(result.open).toBe(1);
    expect(result.overdue).toBe(1);
    expect(result.completionRate).toBe(33);
    expect(result.byPriority.immediate).toBe(1);
    expect(result.byPriority.high).toBe(1);
  });

  it("calculates average resolution days", () => {
    const reports = [
      makeReg44Report({
        visitDate: "2026-05-01T10:00:00Z",
        actionPoints: [
          makeActionPoint({ id: "ap-1", status: "completed", completedAt: "2026-05-08T10:00:00Z" }), // 7 days
          makeActionPoint({ id: "ap-2", status: "completed", completedAt: "2026-05-15T10:00:00Z" }), // 14 days
        ],
      }),
    ];
    const result = summarizeActionPoints(reports, FIXED_NOW);
    expect(result.averageResolutionDays).toBe(11); // (7+14)/2 ≈ 10.5, rounds to 11
  });

  it("reports completion as unmeasured for an empty action list", () => {
    const reports = [makeReg44Report({ actionPoints: [] })];
    const result = summarizeActionPoints(reports, FIXED_NOW);
    expect(result.completionRate).toBeNull();
    expect(result.total).toBe(0);
  });

  it("detects overdue open items past due date", () => {
    const reports = [
      makeReg44Report({
        actionPoints: [
          makeActionPoint({ id: "ap-1", status: "open", dueDate: "2026-04-01T00:00:00Z" }), // past due
          makeActionPoint({ id: "ap-2", status: "in_progress", dueDate: "2026-04-15T00:00:00Z" }), // past due
          makeActionPoint({ id: "ap-3", status: "open", dueDate: "2026-06-01T00:00:00Z" }), // not due yet
        ],
      }),
    ];
    const result = summarizeActionPoints(reports, FIXED_NOW);
    expect(result.overdue).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getNotificationDeadlineHours returns correct deadlines", () => {
    expect(getNotificationDeadlineHours("death")).toBe(24);
    expect(getNotificationDeadlineHours("police_involvement")).toBe(0);
    expect(getNotificationDeadlineHours("accommodation_change")).toBe(120);
    expect(getNotificationDeadlineHours("manager_absence")).toBe(336);
  });

  it("getReg44Sections returns all 11 sections", () => {
    const sections = getReg44Sections();
    expect(sections).toHaveLength(11);
    expect(sections).toContain("children_views");
    expect(sections).toContain("overall_judgement");
  });

  it("getNotificationTypeLabel returns human-readable labels", () => {
    expect(getNotificationTypeLabel("death")).toBe("Death of a Child");
    expect(getNotificationTypeLabel("absconding")).toBe("Absconding");
    expect(getNotificationTypeLabel("allegation_against_staff")).toBe("Allegation Against Staff");
  });

  it("getReg44SectionLabel returns section labels", () => {
    expect(getReg44SectionLabel("children_views")).toBe("Children's Views");
    expect(getReg44SectionLabel("safeguarding")).toBe("Safeguarding");
    expect(getReg44SectionLabel("overall_judgement")).toBe("Overall Judgement");
  });
});
