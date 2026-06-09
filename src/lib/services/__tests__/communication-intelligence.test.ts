// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMMUNICATION INTELLIGENCE TESTS
// Pure-function unit tests for draft generators and template constants.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../communication-intelligence";

const {
  generateHandoverDraft,
  generateSocialWorkerDraft,
  generateShiftBriefingDraft,
  generateManagementSummaryDraft,
  COMMUNICATION_TEMPLATES,
} = _testing;

// ── generateHandoverDraft ─────────────────────────────────────────────────

describe("generateHandoverDraft", () => {
  const baseCtx = {
    shiftType: "Day",
    date: "2025-06-01",
    youngPeople: [
      {
        name: "Alex",
        mood: "Settled and calm",
        keyEvents: ["Attended school"],
        medicationNotes: ["Melatonin given at 9pm"],
        riskUpdates: ["No concerns"],
      },
    ],
    outstandingTasks: ["Phone social worker"],
    staffOnShift: ["Jane", "Mo"],
  };

  it("should produce the correct title with shift type and date", () => {
    const result = generateHandoverDraft(baseCtx);
    expect(result).toContain("# Handover Summary — Day Shift, 2025-06-01");
  });

  it("should include young people updates with mood, events, medication, and risk", () => {
    const result = generateHandoverDraft(baseCtx);
    expect(result).toContain("## Young People Updates");
    expect(result).toContain("### Alex");
    expect(result).toContain("**Mood/Presentation:** Settled and calm");
    expect(result).toContain("- Attended school");
    expect(result).toContain("**Medication:**");
    expect(result).toContain("- Melatonin given at 9pm");
    expect(result).toContain("**Risk Updates:**");
    expect(result).toContain("- No concerns");
  });

  it("should render multiple young people with separate subsections", () => {
    const ctx = {
      ...baseCtx,
      youngPeople: [
        { name: "Alex", mood: "Happy", keyEvents: [], medicationNotes: [], riskUpdates: [] },
        { name: "Jordan", mood: "Anxious", keyEvents: ["Refused dinner"], medicationNotes: [], riskUpdates: [] },
      ],
    };
    const result = generateHandoverDraft(ctx);
    expect(result).toContain("### Alex");
    expect(result).toContain("### Jordan");
    expect(result).toContain("**Mood/Presentation:** Happy");
    expect(result).toContain("**Mood/Presentation:** Anxious");
  });

  it("should omit Outstanding Tasks section when tasks array is empty", () => {
    const ctx = { ...baseCtx, outstandingTasks: [] };
    const result = generateHandoverDraft(ctx);
    expect(result).not.toContain("## Outstanding Tasks");
  });

  it("should omit medication and risk sub-sections when arrays are empty", () => {
    const ctx = {
      ...baseCtx,
      youngPeople: [
        { name: "Alex", mood: "Fine", keyEvents: ["Played football"], medicationNotes: [], riskUpdates: [] },
      ],
    };
    const result = generateHandoverDraft(ctx);
    expect(result).not.toContain("**Medication:**");
    expect(result).not.toContain("**Risk Updates:**");
  });

  it("should list staff on next shift", () => {
    const result = generateHandoverDraft(baseCtx);
    expect(result).toContain("## Staff on Next Shift");
    expect(result).toContain("Jane, Mo");
  });
});

// ── generateSocialWorkerDraft ─────────────────────────────────────────────

describe("generateSocialWorkerDraft", () => {
  const baseCtx = {
    childName: "Sam",
    socialWorkerName: "Rachel Green",
    periodFrom: "2025-05-01",
    periodTo: "2025-05-31",
    placementSummary: "Sam has settled well into the home.",
    presentation: "Generally positive and engaging with staff.",
    achievements: ["Passed maths exam"],
    concerns: ["Occasional refusal to attend school"],
    contactSummary: "Weekly phone contact with mother.",
    actionsRequired: ["Update care plan"],
  };

  it("should produce the correct title, recipient, and period", () => {
    const result = generateSocialWorkerDraft(baseCtx);
    expect(result).toContain("# Professional Update: Sam");
    expect(result).toContain("**To:** Rachel Green");
    expect(result).toContain("**Period:** 2025-05-01 to 2025-05-31");
  });

  it("should include placement overview, presentation, contact, and actions", () => {
    const result = generateSocialWorkerDraft(baseCtx);
    expect(result).toContain("## Placement Overview");
    expect(result).toContain("Sam has settled well into the home.");
    expect(result).toContain("## Child's Presentation");
    expect(result).toContain("Generally positive and engaging with staff.");
    expect(result).toContain("## Contact Arrangements");
    expect(result).toContain("Weekly phone contact with mother.");
    expect(result).toContain("## Actions Required");
    expect(result).toContain("- [ ] Update care plan");
  });

  it("should omit Achievements section when achievements array is empty", () => {
    const ctx = { ...baseCtx, achievements: [] };
    const result = generateSocialWorkerDraft(ctx);
    expect(result).not.toContain("## Achievements & Progress");
  });

  it("should omit Concerns section when concerns array is empty", () => {
    const ctx = { ...baseCtx, concerns: [] };
    const result = generateSocialWorkerDraft(ctx);
    expect(result).not.toContain("## Concerns & Challenges");
  });
});

// ── generateShiftBriefingDraft ────────────────────────────────────────────

describe("generateShiftBriefingDraft", () => {
  const baseCtx = {
    date: "2025-06-01",
    shiftType: "Night",
    youngPeople: [
      { name: "Alex", currentPresentation: "Calm and settled", riskLevel: "Low", keyInfo: ["Sleeping well"] },
    ],
    medicationDue: [
      { childName: "Alex", medication: "Melatonin 3mg", time: "21:00" },
    ],
    activitiesPlanned: ["Movie night"],
    riskAlerts: [],
    visitorsExpected: [],
    keyTasks: ["Lock up checks"],
  };

  it("should produce the correct title with shift type and date", () => {
    const result = generateShiftBriefingDraft(baseCtx);
    expect(result).toContain("# Night Shift Briefing — 2025-06-01");
  });

  it("should include young people section with risk level and key info", () => {
    const result = generateShiftBriefingDraft(baseCtx);
    expect(result).toContain("### Alex (Risk: Low)");
    expect(result).toContain("Calm and settled");
    expect(result).toContain("- Sleeping well");
  });

  it("should render risk alerts section first when alerts are present", () => {
    const ctx = { ...baseCtx, riskAlerts: ["Alex at high risk of absconding"] };
    const result = generateShiftBriefingDraft(ctx);
    expect(result).toContain("## ⚠ Risk Alerts");
    expect(result).toContain("- **Alex at high risk of absconding**");
    // Risk alerts should appear before Young People
    const riskIndex = result.indexOf("## ⚠ Risk Alerts");
    const ypIndex = result.indexOf("## Young People");
    expect(riskIndex).toBeLessThan(ypIndex);
  });

  it("should format medication entries with time, child name, and medication", () => {
    const result = generateShiftBriefingDraft(baseCtx);
    expect(result).toContain("## Medication Due");
    expect(result).toContain("- **21:00** — Alex: Melatonin 3mg");
  });

  it("should omit empty optional sections", () => {
    const ctx = {
      ...baseCtx,
      riskAlerts: [],
      visitorsExpected: [],
      activitiesPlanned: [],
      medicationDue: [],
      keyTasks: [],
    };
    const result = generateShiftBriefingDraft(ctx);
    expect(result).not.toContain("## ⚠ Risk Alerts");
    expect(result).not.toContain("## Visitors Expected");
    expect(result).not.toContain("## Activities Planned");
    expect(result).not.toContain("## Medication Due");
    expect(result).not.toContain("## Key Tasks");
  });
});

// ── generateManagementSummaryDraft ────────────────────────────────────────

describe("generateManagementSummaryDraft", () => {
  const baseCtx = {
    periodLabel: "Week 22, 2025",
    homeName: "Chamberlain House",
    occupancy: { current: 3, capacity: 4 },
    significantEvents: [
      { date: "2025-05-28", summary: "Missing from care episode", severity: "high" },
    ],
    staffingHighlights: ["Full complement achieved"],
    complianceStatus: [
      { area: "Medication", status: "compliant" as const },
      { area: "Fire drills", status: "attention" as const },
      { area: "DBS checks", status: "non_compliant" as const },
    ],
    outcomesHighlights: ["Two YP achieved attendance targets"],
    concerns: ["Agency staff usage above threshold"],
    decisionsNeeded: ["Approve new rota pattern"],
  };

  it("should produce the correct title and period", () => {
    const result = generateManagementSummaryDraft(baseCtx);
    expect(result).toContain("# Management Summary — Chamberlain House");
    expect(result).toContain("**Period:** Week 22, 2025");
  });

  it("should display occupancy correctly", () => {
    const result = generateManagementSummaryDraft(baseCtx);
    expect(result).toContain("3/4 places occupied");
  });

  it("should render compliance status with correct icons", () => {
    const result = generateManagementSummaryDraft(baseCtx);
    expect(result).toContain("✓ Medication: compliant");
    expect(result).toContain("⚠ Fire drills: attention");
    expect(result).toContain("✗ DBS checks: non-compliant");
  });

  it("should format significant events with uppercase severity", () => {
    const result = generateManagementSummaryDraft(baseCtx);
    expect(result).toContain("- **2025-05-28** [HIGH] — Missing from care episode");
  });

  it("should omit empty optional sections", () => {
    const ctx = {
      ...baseCtx,
      significantEvents: [],
      staffingHighlights: [],
      complianceStatus: [],
      outcomesHighlights: [],
      concerns: [],
      decisionsNeeded: [],
    };
    const result = generateManagementSummaryDraft(ctx);
    expect(result).not.toContain("## Significant Events");
    expect(result).not.toContain("## Staffing");
    expect(result).not.toContain("## Compliance");
    expect(result).not.toContain("## Outcomes");
    expect(result).not.toContain("## Concerns");
    expect(result).not.toContain("## Actions for Decision");
  });
});

// ── COMMUNICATION_TEMPLATES ───────────────────────────────────────────────

describe("COMMUNICATION_TEMPLATES", () => {
  const templateKeys = Object.keys(COMMUNICATION_TEMPLATES);

  it("should have exactly 12 template entries", () => {
    expect(templateKeys).toHaveLength(12);
  });

  it("should have label, description, and non-empty sections on every template", () => {
    for (const key of templateKeys) {
      const tpl = COMMUNICATION_TEMPLATES[key as keyof typeof COMMUNICATION_TEMPLATES];
      expect(tpl.label).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.sections.length).toBeGreaterThan(0);
    }
  });

  it("should include regulationRef on regulation-linked templates", () => {
    const regulationTypes = [
      "social_worker_update",
      "reg44_section",
      "reg45_section",
      "incident_notification",
      "missing_notification",
      "management_summary",
      "ofsted_notification",
    ] as const;

    for (const key of regulationTypes) {
      expect(COMMUNICATION_TEMPLATES[key].regulationRef).toBeTruthy();
    }
  });

  it("should not have regulationRef on templates without regulation links", () => {
    const nonRegTypes = [
      "handover_summary",
      "placement_update",
      "multi_agency_brief",
      "shift_briefing",
      "professional_update",
    ] as const;

    for (const key of nonRegTypes) {
      expect(COMMUNICATION_TEMPLATES[key].regulationRef).toBeUndefined();
    }
  });
});
