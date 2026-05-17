// ════���═════════════════════════════��═══════════════════════════════════════════
// Cornerstone Daily Log & Key Events — Engine Tests
// ��═════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateDailyCompliance,
  analyzeChildWellbeing,
  generateHandoverSummary,
  calculateHomeActivityMetrics,
  getShiftLabel,
  getEventCategoryLabel,
  getMoodLabel,
} from "../daily-engine";
import type {
  DailyLogEntry,
  ChildShiftEntry,
  KeyEvent,
  ShiftType,
  MoodRating,
  EventCategory,
} from "../daily-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeKeyEvent(overrides: Partial<KeyEvent> = {}): KeyEvent {
  return {
    id: "ev-001",
    category: "activity",
    priority: "routine",
    time: "2026-05-15T14:00:00Z",
    description: "Played football in the garden with peers for 1 hour.",
    staffInvolved: ["staff-002"],
    ...overrides,
  };
}

function makeChildEntry(overrides: Partial<ChildShiftEntry> = {}): ChildShiftEntry {
  return {
    childId: "child-jordan",
    childName: "Jordan Williams",
    moodRating: 4,
    moodNotes: "Happy and engaged throughout shift. Good interactions with peers.",
    presentInHome: true,
    schoolAttended: true,
    keyEvents: [makeKeyEvent()],
    medicationAdministered: [
      { medicationName: "Melatonin", dose: "2mg", time: "2026-05-15T21:00:00Z", administeredBy: "staff-001", witnessed: true, witnessedBy: "staff-002", refused: false },
    ],
    mealsEaten: [
      { meal: "lunch", eaten: "full" },
      { meal: "dinner", eaten: "full" },
    ],
    ...overrides,
  };
}

function makeEntry(overrides: Partial<DailyLogEntry> = {}): DailyLogEntry {
  return {
    id: "log-001",
    homeId: "home-oak",
    date: "2026-05-15",
    shift: "afternoon",
    staffOnShift: ["staff-001", "staff-002", "staff-003"],
    shiftLeader: "staff-001",

    childEntries: [
      makeChildEntry(),
      makeChildEntry({ childId: "child-alex", childName: "Alex Reeves", moodRating: 3, moodNotes: "Quiet today. Preferred to stay in room." }),
      makeChildEntry({ childId: "child-mia", childName: "Mia Chen", moodRating: 5, moodNotes: "Excellent day. Came home excited from school trip." }),
    ],

    homeNotes: "Quiet shift. All children home by 4pm. Garden tidy completed.",
    maintenanceIssues: [],
    visitorsToHome: [],

    handoverNotes: "All calm. Jordan's medication at 9pm. Alex prefers space tonight.",
    handoverPriorities: ["Jordan medication at 9pm", "Alex — give space, check in gently"],
    handoverCompletedAt: "2026-05-15T21:30:00Z",
    handoverReceivedBy: "staff-004",

    createdBy: "staff-001",
    createdAt: "2026-05-15T21:30:00Z",
    signedOffBy: "staff-001",
    signedOffAt: "2026-05-15T21:45:00Z",
    ...overrides,
  };
}

function makeNightEntry(overrides: Partial<DailyLogEntry> = {}): DailyLogEntry {
  // Generate 18 night checks per child (30-min intervals)
  const nightChecks = Array.from({ length: 18 }, (_, i) => ({
    time: `2026-05-15T${String(22 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}:00Z`,
    checkedBy: "staff-004",
    childPresent: true,
    awake: i === 3, // one awake check
  }));

  return makeEntry({
    shift: "waking_night",
    childEntries: [
      makeChildEntry({ nightChecks, schoolAttended: undefined }),
      makeChildEntry({ childId: "child-alex", childName: "Alex Reeves", moodRating: 3, moodNotes: "Settled", nightChecks, schoolAttended: undefined }),
      makeChildEntry({ childId: "child-mia", childName: "Mia Chen", moodRating: 4, moodNotes: "Asleep quickly", nightChecks, schoolAttended: undefined }),
    ],
    ...overrides,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateDailyCompliance
// ══��═══════════════════���═══════════════════════════════════════════════════════

describe("evaluateDailyCompliance", () => {
  it("returns compliant for complete entry", () => {
    const entry = makeEntry();
    const result = evaluateDailyCompliance(entry);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.childEntriesComplete).toBe(true);
    expect(result.handoverComplete).toBe(true);
    expect(result.medicationDocumented).toBe(true);
    expect(result.signedOff).toBe(true);
  });

  it("flags incomplete child entries (missing mood notes)", () => {
    const entry = makeEntry({
      childEntries: [makeChildEntry({ moodNotes: "" })],
    });
    const result = evaluateDailyCompliance(entry);
    expect(result.childEntriesComplete).toBe(false);
    expect(result.issues.some(i => i.includes("wellbeing entries"))).toBe(true);
  });

  it("flags missing handover", () => {
    const entry = makeEntry({
      handoverNotes: "",
      handoverCompletedAt: undefined,
      handoverReceivedBy: undefined,
    });
    const result = evaluateDailyCompliance(entry);
    expect(result.handoverComplete).toBe(false);
    expect(result.issues.some(i => i.includes("handover"))).toBe(true);
  });

  it("flags unwitnessed medication", () => {
    const entry = makeEntry({
      childEntries: [
        makeChildEntry({
          medicationAdministered: [
            { medicationName: "Melatonin", dose: "2mg", time: "2026-05-15T21:00:00Z", administeredBy: "staff-001", witnessed: false, refused: false },
          ],
        }),
      ],
    });
    const result = evaluateDailyCompliance(entry);
    expect(result.medicationDocumented).toBe(false);
    expect(result.issues.some(i => i.includes("Medication"))).toBe(true);
  });

  it("accepts refused medication as documented", () => {
    const entry = makeEntry({
      childEntries: [
        makeChildEntry({
          medicationAdministered: [
            { medicationName: "Melatonin", dose: "2mg", time: "2026-05-15T21:00:00Z", administeredBy: "staff-001", witnessed: false, refused: true, refusalNotes: "Refused saying felt okay" },
          ],
        }),
      ],
    });
    const result = evaluateDailyCompliance(entry);
    expect(result.medicationDocumented).toBe(true);
  });

  it("flags insufficient night checks for night shift", () => {
    const entry = makeNightEntry({
      childEntries: [
        makeChildEntry({ nightChecks: [{ time: "2026-05-15T23:00:00Z", checkedBy: "staff-004", childPresent: true, awake: false }] }),
        makeChildEntry({ childId: "child-alex", childName: "Alex", moodRating: 3, moodNotes: "Settled", nightChecks: [] }),
        makeChildEntry({ childId: "child-mia", childName: "Mia", moodRating: 4, moodNotes: "Asleep", nightChecks: [] }),
      ],
    });
    const result = evaluateDailyCompliance(entry);
    expect(result.nightChecksComplete).toBe(false);
    expect(result.issues.some(i => i.includes("Night checks incomplete"))).toBe(true);
  });

  it("passes night checks at 80% threshold", () => {
    const entry = makeNightEntry();
    const result = evaluateDailyCompliance(entry);
    expect(result.nightChecksComplete).toBe(true);
  });

  it("skips night check validation for non-night shifts", () => {
    const entry = makeEntry({ shift: "afternoon" });
    const result = evaluateDailyCompliance(entry);
    expect(result.nightChecksComplete).toBe(true);
  });

  it("flags not signed off", () => {
    const entry = makeEntry({ signedOffBy: undefined, signedOffAt: undefined });
    const result = evaluateDailyCompliance(entry);
    expect(result.signedOff).toBe(false);
    expect(result.issues.some(i => i.includes("signed off"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyzeChildWellbeing
// ══════════════════════════════════════════════════════════════════════════════

describe("analyzeChildWellbeing", () => {
  function makeEntriesWithMoods(moods: MoodRating[]): DailyLogEntry[] {
    return moods.map((mood, i) => {
      const date = new Date(new Date(FIXED_NOW).getTime() - (moods.length - 1 - i) * 24 * 60 * 60 * 1000);
      return makeEntry({
        id: `log-${i}`,
        date: date.toISOString().split("T")[0],
        childEntries: [makeChildEntry({ moodRating: mood })],
      });
    });
  }

  it("calculates average mood", () => {
    const entries = makeEntriesWithMoods([3, 4, 4, 5, 4]);
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.averageMood).toBe(4);
  });

  it("detects improving mood trend", () => {
    const entries = makeEntriesWithMoods([2, 2, 3, 3, 4, 4, 5, 5]);
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.moodTrend).toBe("improving");
  });

  it("detects declining mood trend", () => {
    const entries = makeEntriesWithMoods([5, 5, 4, 4, 3, 3, 2, 2]);
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.moodTrend).toBe("declining");
  });

  it("detects stable mood", () => {
    const entries = makeEntriesWithMoods([3, 4, 3, 4, 3, 4]);
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.moodTrend).toBe("stable");
  });

  it("calculates school attendance rate", () => {
    const entries = [
      makeEntry({ id: "l1", date: "2026-05-15", childEntries: [makeChildEntry({ schoolAttended: true })] }),
      makeEntry({ id: "l2", date: "2026-05-14", childEntries: [makeChildEntry({ schoolAttended: true })] }),
      makeEntry({ id: "l3", date: "2026-05-13", childEntries: [makeChildEntry({ schoolAttended: false })] }),
      makeEntry({ id: "l4", date: "2026-05-12", childEntries: [makeChildEntry({ schoolAttended: true })] }),
    ];
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.schoolAttendanceRate).toBe(75);
  });

  it("counts meal refusals", () => {
    const entries = [
      makeEntry({
        id: "l1",
        date: "2026-05-15",
        childEntries: [makeChildEntry({
          mealsEaten: [
            { meal: "breakfast", eaten: "refused" },
            { meal: "lunch", eaten: "full" },
            { meal: "dinner", eaten: "refused" },
          ],
        })],
      }),
    ];
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.mealRefusals).toBe(2);
  });

  it("counts medication refusals", () => {
    const entries = [
      makeEntry({
        id: "l1",
        date: "2026-05-15",
        childEntries: [makeChildEntry({
          medicationAdministered: [
            { medicationName: "Med A", dose: "1mg", time: "08:00", administeredBy: "staff-1", witnessed: true, refused: false },
            { medicationName: "Med B", dose: "2mg", time: "20:00", administeredBy: "staff-1", witnessed: false, refused: true, refusalNotes: "Refused" },
          ],
        })],
      }),
    ];
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.medicationRefusals).toBe(1);
  });

  it("counts night disturbances (awake checks)", () => {
    const entries = [
      makeEntry({
        id: "l1",
        date: "2026-05-15",
        shift: "waking_night",
        childEntries: [makeChildEntry({
          nightChecks: [
            { time: "23:00", checkedBy: "staff-4", childPresent: true, awake: true },
            { time: "23:30", checkedBy: "staff-4", childPresent: true, awake: false },
            { time: "00:00", checkedBy: "staff-4", childPresent: true, awake: true },
          ],
        })],
      }),
    ];
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.nightDisturbances).toBe(2);
  });

  it("generates recommendation for low mood", () => {
    const entries = makeEntriesWithMoods([1, 2, 1, 2, 2]);
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("CAMHS"))).toBe(true);
  });

  it("generates recommendation for low school attendance", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({
        id: `l-${i}`,
        date: new Date(new Date(FIXED_NOW).getTime() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        childEntries: [makeChildEntry({ schoolAttended: i < 3 })],
      }),
    );
    const result = analyzeChildWellbeing(entries, "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.schoolAttendanceRate).toBe(30);
    expect(result.recommendations.some(r => r.includes("PEP"))).toBe(true);
  });

  it("handles no entries gracefully", () => {
    const result = analyzeChildWellbeing([], "child-jordan", "Jordan Williams", 30, FIXED_NOW);
    expect(result.averageMood).toBe(3);
    expect(result.moodTrend).toBe("stable");
    expect(result.totalEpisodes).toBeUndefined(); // shouldn't have this
    expect(result.schoolAttendanceRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateHandoverSummary
// ══════════════════════════════════════════════════════════════════════════════

describe("generateHandoverSummary", () => {
  it("returns child summaries with mood and key info", () => {
    const entry = makeEntry();
    const result = generateHandoverSummary(entry);
    expect(result.childSummaries).toHaveLength(3);
    expect(result.childSummaries[0].childName).toBe("Jordan Williams");
    expect(result.childSummaries[0].mood).toBe(4);
  });

  it("includes critical events in key info", () => {
    const entry = makeEntry({
      childEntries: [
        makeChildEntry({
          keyEvents: [makeKeyEvent({ priority: "critical", description: "Disclosure made about family member" })],
        }),
      ],
    });
    const result = generateHandoverSummary(entry);
    expect(result.childSummaries[0].keyInfo).toContain("Disclosure");
  });

  it("uses mood notes when no critical events", () => {
    const entry = makeEntry({
      childEntries: [
        makeChildEntry({ keyEvents: [makeKeyEvent({ priority: "routine" })] }),
      ],
    });
    const result = generateHandoverSummary(entry);
    expect(result.childSummaries[0].keyInfo).toContain("Happy and engaged");
  });

  it("collects outstanding actions", () => {
    const entry = makeEntry({
      childEntries: [
        makeChildEntry({
          keyEvents: [makeKeyEvent({ actionRequired: "Chase CAMHS referral tomorrow" })],
        }),
      ],
    });
    const result = generateHandoverSummary(entry);
    expect(result.outstandingActions).toHaveLength(1);
    expect(result.outstandingActions[0]).toContain("CAMHS");
  });

  it("includes handover priorities", () => {
    const entry = makeEntry();
    const result = generateHandoverSummary(entry);
    expect(result.priorities).toHaveLength(2);
    expect(result.priorities[0]).toContain("Jordan medication");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateHomeActivityMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeActivityMetrics", () => {
  function makeMultipleEntries(count: number): DailyLogEntry[] {
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(new Date(FIXED_NOW).getTime() - i * 24 * 60 * 60 * 1000);
      return makeEntry({
        id: `log-${i}`,
        date: date.toISOString().split("T")[0],
      });
    });
  }

  it("counts total entries for home", () => {
    const entries = makeMultipleEntries(5);
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.totalEntries).toBe(5);
  });

  it("calculates entries per day", () => {
    const entries = [
      makeEntry({ id: "l1", date: "2026-05-15" }),
      makeEntry({ id: "l2", date: "2026-05-15", shift: "evening" }),
      makeEntry({ id: "l3", date: "2026-05-14" }),
    ];
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.entriesPerDay).toBe(1.5); // 3 entries / 2 days
  });

  it("calculates compliance rate", () => {
    const entries = [
      makeEntry({ id: "l1", date: "2026-05-15" }), // compliant
      makeEntry({ id: "l2", date: "2026-05-14", signedOffBy: undefined, signedOffAt: undefined }), // non-compliant
    ];
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.complianceRate).toBe(50);
  });

  it("calculates average home mood", () => {
    const entries = [
      makeEntry({
        id: "l1",
        date: "2026-05-15",
        childEntries: [
          makeChildEntry({ moodRating: 4 }),
          makeChildEntry({ childId: "child-alex", childName: "Alex", moodRating: 2, moodNotes: "Low" }),
        ],
      }),
    ];
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.averageHomeMood).toBe(3);
  });

  it("groups events by category", () => {
    const entries = [
      makeEntry({
        id: "l1",
        date: "2026-05-15",
        childEntries: [
          makeChildEntry({
            keyEvents: [
              makeKeyEvent({ category: "activity" }),
              makeKeyEvent({ id: "ev-2", category: "activity" }),
              makeKeyEvent({ id: "ev-3", category: "safeguarding" }),
            ],
          }),
        ],
      }),
    ];
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.eventsByCategory[0].category).toBe("activity");
    expect(result.eventsByCategory[0].count).toBe(2);
  });

  it("calculates school attendance rate across home", () => {
    const entries = [
      makeEntry({
        id: "l1",
        date: "2026-05-15",
        childEntries: [
          makeChildEntry({ schoolAttended: true }),
          makeChildEntry({ childId: "child-alex", childName: "Alex", moodRating: 3, moodNotes: "Ok", schoolAttended: false }),
        ],
      }),
    ];
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.schoolAttendanceRate).toBe(50);
  });

  it("calculates medication compliance rate", () => {
    const entries = [
      makeEntry({
        id: "l1",
        date: "2026-05-15",
        childEntries: [
          makeChildEntry({
            medicationAdministered: [
              { medicationName: "Med A", dose: "1mg", time: "08:00", administeredBy: "s1", witnessed: true, refused: false },
              { medicationName: "Med B", dose: "2mg", time: "20:00", administeredBy: "s1", witnessed: true, refused: true, refusalNotes: "No" },
            ],
          }),
        ],
      }),
    ];
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.medicationComplianceRate).toBe(50);
  });

  it("calculates handover completion rate", () => {
    const entries = [
      makeEntry({ id: "l1", date: "2026-05-15" }), // complete
      makeEntry({ id: "l2", date: "2026-05-14", handoverCompletedAt: undefined, handoverReceivedBy: undefined }), // incomplete
    ];
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.handoverCompletionRate).toBe(50);
  });

  it("generates child engagement scores", () => {
    const entries = [
      makeEntry({
        id: "l1",
        date: "2026-05-15",
        childEntries: [
          makeChildEntry({ moodRating: 5 }),
          makeChildEntry({ childId: "child-alex", childName: "Alex Reeves", moodRating: 2, moodNotes: "Low" }),
        ],
      }),
    ];
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.childEngagementScores[0].childName).toBe("Jordan Williams");
    expect(result.childEngagementScores[0].score).toBe(5);
    expect(result.childEngagementScores[1].score).toBe(2);
  });

  it("filters to correct home", () => {
    const entries = [
      makeEntry({ id: "l1", date: "2026-05-15", homeId: "home-oak" }),
      makeEntry({ id: "l2", date: "2026-05-14", homeId: "home-elm" }),
    ];
    const result = calculateHomeActivityMetrics(entries, "home-oak", 30, FIXED_NOW);
    expect(result.totalEntries).toBe(1);
  });

  it("returns defaults for empty entries", () => {
    const result = calculateHomeActivityMetrics([], "home-oak", 30, FIXED_NOW);
    expect(result.totalEntries).toBe(0);
    expect(result.complianceRate).toBe(100);
    expect(result.averageHomeMood).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getShiftLabel returns labels for all shifts", () => {
    expect(getShiftLabel("morning")).toBe("Morning (7am–2pm)");
    expect(getShiftLabel("waking_night")).toBe("Waking Night (10pm–7am)");
  });

  it("getEventCategoryLabel returns labels", () => {
    expect(getEventCategoryLabel("wellbeing")).toBe("Wellbeing");
    expect(getEventCategoryLabel("safeguarding")).toBe("Safeguarding");
  });

  it("getMoodLabel returns labels for all ratings", () => {
    expect(getMoodLabel(1)).toBe("Very Low / Distressed");
    expect(getMoodLabel(3)).toBe("Neutral / Okay");
    expect(getMoodLabel(5)).toBe("Excellent / Thriving");
  });
});
