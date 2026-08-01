// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHIFT HANDOVER SERVICE TESTS
// Pure-function unit tests for handover compliance computation, quality metrics,
// alert identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../handover-service";
import {
  HANDOVER_TYPES,
  CHILD_STATUS_OPTIONS,
  PRIORITY_FLAGS,
} from "../handover-service";

import type { Handover, ChildUpdate } from "../handover-service";

const {
  computeHandoverCompliance,
  computeHandoverQuality,
  identifyHandoverAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal ChildUpdate with sensible defaults. */
function makeChildUpdate(
  overrides: Partial<ChildUpdate> = {},
): ChildUpdate {
  return {
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alex Smith",
    status: "status" in overrides ? overrides.status! : "settled",
    mood_notes: "mood_notes" in overrides ? overrides.mood_notes! : "Happy and engaged",
    medication_notes: "medication_notes" in overrides ? overrides.medication_notes! : "Administered on time",
    behaviour_notes: "behaviour_notes" in overrides ? overrides.behaviour_notes! : "Good behaviour throughout",
    risk_changes: "risk_changes" in overrides ? overrides.risk_changes! : "No changes",
    tasks_outstanding: "tasks_outstanding" in overrides ? overrides.tasks_outstanding! : [],
  };
}

/** Build a minimal Handover with sensible defaults. */
function makeHandover(
  overrides: Partial<Handover> = {},
): Handover {
  return {
    id: "id" in overrides ? overrides.id! : "handover-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    handover_type: "handover_type" in overrides ? overrides.handover_type! : "shift_change",
    shift_date: "shift_date" in overrides ? overrides.shift_date! : "2026-05-10",
    outgoing_staff: "outgoing_staff" in overrides ? overrides.outgoing_staff! : ["staff-1"],
    incoming_staff: "incoming_staff" in overrides ? overrides.incoming_staff! : ["staff-2"],
    child_updates: "child_updates" in overrides ? overrides.child_updates! : [makeChildUpdate()],
    incidents_summary: "incidents_summary" in overrides ? overrides.incidents_summary! : [],
    tasks_carried_forward: "tasks_carried_forward" in overrides ? overrides.tasks_carried_forward! : [],
    safeguarding_flags: "safeguarding_flags" in overrides ? overrides.safeguarding_flags! : [],
    general_notes: "general_notes" in overrides ? overrides.general_notes! : undefined,
    priority: "priority" in overrides ? overrides.priority! : "routine",
    completed: "completed" in overrides ? overrides.completed! : true,
    completed_at: "completed_at" in overrides ? overrides.completed_at! : "2026-05-10T15:00:00Z",
    created_by: "created_by" in overrides ? overrides.created_by! : "user-1",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-10T14:00:00Z",
  };
}

// ── Constants ─────────────────────────────────────────────────────────────

describe("HANDOVER_TYPES", () => {
  it("contains exactly 4 handover types", () => {
    expect(HANDOVER_TYPES).toHaveLength(4);
  });

  it("every entry has type and label fields", () => {
    for (const ht of HANDOVER_TYPES) {
      expect(ht).toHaveProperty("type");
      expect(ht).toHaveProperty("label");
      expect(typeof ht.type).toBe("string");
      expect(typeof ht.label).toBe("string");
    }
  });

  it("includes shift_change and emergency types", () => {
    const types = HANDOVER_TYPES.map((ht) => ht.type);
    expect(types).toContain("shift_change");
    expect(types).toContain("emergency");
  });

  it("includes sleep and waking transition types", () => {
    const types = HANDOVER_TYPES.map((ht) => ht.type);
    expect(types).toContain("sleep_in_waking");
    expect(types).toContain("waking_day");
  });
});

describe("CHILD_STATUS_OPTIONS", () => {
  it("contains exactly 7 status options", () => {
    expect(CHILD_STATUS_OPTIONS).toHaveLength(7);
  });

  it("includes core wellbeing statuses", () => {
    expect(CHILD_STATUS_OPTIONS).toContain("settled");
    expect(CHILD_STATUS_OPTIONS).toContain("unsettled");
    expect(CHILD_STATUS_OPTIONS).toContain("distressed");
    expect(CHILD_STATUS_OPTIONS).toContain("sleeping");
  });

  it("includes location-based statuses", () => {
    expect(CHILD_STATUS_OPTIONS).toContain("absent");
    expect(CHILD_STATUS_OPTIONS).toContain("in_school");
    expect(CHILD_STATUS_OPTIONS).toContain("with_family");
  });

  it("contains only strings", () => {
    for (const s of CHILD_STATUS_OPTIONS) {
      expect(typeof s).toBe("string");
    }
  });
});

describe("PRIORITY_FLAGS", () => {
  it("contains exactly 4 priority levels", () => {
    expect(PRIORITY_FLAGS).toHaveLength(4);
  });

  it("includes routine and critical priorities", () => {
    expect(PRIORITY_FLAGS).toContain("routine");
    expect(PRIORITY_FLAGS).toContain("critical");
  });

  it("includes important and urgent priorities", () => {
    expect(PRIORITY_FLAGS).toContain("important");
    expect(PRIORITY_FLAGS).toContain("urgent");
  });

  it("contains only strings", () => {
    for (const p of PRIORITY_FLAGS) {
      expect(typeof p).toBe("string");
    }
  });
});

// ── computeHandoverCompliance ─────────────────────────────────────────────

describe("computeHandoverCompliance", () => {
  const FROM = "2026-05-01";
  const TO = "2026-05-31";

  it("returns zeroed stats for empty array", () => {
    const result = computeHandoverCompliance([], FROM, TO);
    expect(result.total_handovers).toBe(0);
    expect(result.completed_count).toBe(0);
    expect(result.completion_rate).toBeNull();;
    expect(result.by_type).toEqual({});
    expect(result.avg_children_covered).toBeNull();;
    expect(result.with_safeguarding_flags).toBe(0);
    expect(result.with_incidents).toBe(0);
    expect(result.avg_tasks_carried_forward).toBeNull();;
  });

  it("filters handovers by date range — excludes out-of-range", () => {
    const handovers = [
      makeHandover({ shift_date: "2026-05-10" }),
      makeHandover({ id: "h2", shift_date: "2026-04-30" }),
      makeHandover({ id: "h3", shift_date: "2026-06-01" }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    expect(result.total_handovers).toBe(1);
  });

  it("includes handovers on exact boundary dates", () => {
    const handovers = [
      makeHandover({ shift_date: "2026-05-01" }),
      makeHandover({ id: "h2", shift_date: "2026-05-31" }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    expect(result.total_handovers).toBe(2);
  });

  it("calculates completion rate correctly", () => {
    const handovers = [
      makeHandover({ completed: true }),
      makeHandover({ id: "h2", completed: true }),
      makeHandover({ id: "h3", completed: false }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    expect(result.completed_count).toBe(2);
    expect(result.completion_rate).toBe(67); // Math.round(2/3 * 100)
  });

  it("returns 100% completion when all are completed", () => {
    const handovers = [
      makeHandover({ completed: true }),
      makeHandover({ id: "h2", completed: true }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    expect(result.completion_rate).toBe(100);
  });

  it("groups handovers by type", () => {
    const handovers = [
      makeHandover({ handover_type: "shift_change" }),
      makeHandover({ id: "h2", handover_type: "shift_change" }),
      makeHandover({ id: "h3", handover_type: "emergency" }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    expect(result.by_type).toEqual({ shift_change: 2, emergency: 1 });
  });

  it("computes average children covered with rounding to 1 decimal", () => {
    const handovers = [
      makeHandover({ child_updates: [makeChildUpdate(), makeChildUpdate({ child_id: "c2", child_name: "Bob" }), makeChildUpdate({ child_id: "c3", child_name: "Carol" })] }),
      makeHandover({ id: "h2", child_updates: [makeChildUpdate()] }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    // (3 + 1) / 2 = 2.0
    expect(result.avg_children_covered).toBe(2);
  });

  it("counts handovers with safeguarding flags", () => {
    const handovers = [
      makeHandover({ safeguarding_flags: ["concern-1"] }),
      makeHandover({ id: "h2", safeguarding_flags: [] }),
      makeHandover({ id: "h3", safeguarding_flags: ["concern-2", "concern-3"] }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    expect(result.with_safeguarding_flags).toBe(2);
  });

  it("counts handovers with incidents", () => {
    const handovers = [
      makeHandover({ incidents_summary: ["Incident A"] }),
      makeHandover({ id: "h2", incidents_summary: [] }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    expect(result.with_incidents).toBe(1);
  });

  it("computes average tasks carried forward with rounding", () => {
    const handovers = [
      makeHandover({ tasks_carried_forward: ["t1", "t2", "t3"] }),
      makeHandover({ id: "h2", tasks_carried_forward: ["t4"] }),
      makeHandover({ id: "h3", tasks_carried_forward: [] }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    // (3 + 1 + 0) / 3 = 1.333... → round to 1.3
    expect(result.avg_tasks_carried_forward).toBe(1.3);
  });

  it("returns zero rates when all handovers are outside date range", () => {
    const handovers = [
      makeHandover({ shift_date: "2025-01-01" }),
      makeHandover({ id: "h2", shift_date: "2027-12-31" }),
    ];
    const result = computeHandoverCompliance(handovers, FROM, TO);
    expect(result.total_handovers).toBe(0);
    expect(result.completion_rate).toBeNull();;
    expect(result.avg_children_covered).toBeNull();;
  });
});

// ── computeHandoverQuality ────────────────────────────────────────────────

describe("computeHandoverQuality", () => {
  it("returns zeroed stats for empty array", () => {
    const result = computeHandoverQuality([]);
    expect(result.total).toBe(0);
    expect(result.with_mood_notes_rate).toBeNull();;
    expect(result.with_medication_notes_rate).toBeNull();;
    expect(result.with_behaviour_notes_rate).toBeNull();;
    expect(result.with_risk_changes_rate).toBeNull();;
    expect(result.fully_detailed_rate).toBeNull();;
    expect(result.priority_breakdown).toEqual({});
  });

  it("reports 100% mood notes when all updates have them", () => {
    const handovers = [
      makeHandover({
        child_updates: [
          makeChildUpdate({ mood_notes: "Happy" }),
          makeChildUpdate({ child_id: "c2", mood_notes: "Calm" }),
        ],
      }),
    ];
    const result = computeHandoverQuality(handovers);
    expect(result.with_mood_notes_rate).toBe(100);
  });

  it("reports 0% medication notes when all are missing", () => {
    const handovers = [
      makeHandover({
        child_updates: [
          makeChildUpdate({ medication_notes: undefined }),
          makeChildUpdate({ child_id: "c2", medication_notes: "" }),
        ],
      }),
    ];
    const result = computeHandoverQuality(handovers);
    expect(result.with_medication_notes_rate).toBe(0);
  });

  it("calculates partial behaviour notes rate", () => {
    const handovers = [
      makeHandover({
        child_updates: [
          makeChildUpdate({ behaviour_notes: "Good" }),
          makeChildUpdate({ child_id: "c2", behaviour_notes: "" }),
          makeChildUpdate({ child_id: "c3", behaviour_notes: undefined }),
        ],
      }),
    ];
    const result = computeHandoverQuality(handovers);
    // 1 out of 3 = 33%
    expect(result.with_behaviour_notes_rate).toBe(33);
  });

  it("calculates risk changes rate across multiple handovers", () => {
    const handovers = [
      makeHandover({
        child_updates: [makeChildUpdate({ risk_changes: "Escalated" })],
      }),
      makeHandover({
        id: "h2",
        child_updates: [makeChildUpdate({ risk_changes: "" })],
      }),
    ];
    const result = computeHandoverQuality(handovers);
    // 1 out of 2 = 50%
    expect(result.with_risk_changes_rate).toBe(50);
  });

  it("counts fully detailed handover — all 4 note types present on all children", () => {
    const fullyDetailed = makeHandover({
      child_updates: [
        makeChildUpdate({
          mood_notes: "Good",
          medication_notes: "Given",
          behaviour_notes: "Calm",
          risk_changes: "None",
        }),
      ],
    });
    const partial = makeHandover({
      id: "h2",
      child_updates: [
        makeChildUpdate({ medication_notes: "" }),
      ],
    });
    const result = computeHandoverQuality([fullyDetailed, partial]);
    // 1 of 2 fully detailed = 50%
    expect(result.fully_detailed_rate).toBe(50);
  });

  it("skips handovers with no child updates for fully detailed count", () => {
    const handovers = [
      makeHandover({ child_updates: [] }),
      makeHandover({
        id: "h2",
        child_updates: [
          makeChildUpdate({
            mood_notes: "Fine",
            medication_notes: "Done",
            behaviour_notes: "OK",
            risk_changes: "None",
          }),
        ],
      }),
    ];
    const result = computeHandoverQuality(handovers);
    // Only h2 is considered, and it's fully detailed → 50% of 2 total
    expect(result.fully_detailed_rate).toBe(50);
  });

  it("treats whitespace-only notes as missing", () => {
    const handovers = [
      makeHandover({
        child_updates: [
          makeChildUpdate({
            mood_notes: "   ",
            medication_notes: "  \t  ",
            behaviour_notes: "\n",
            risk_changes: "  ",
          }),
        ],
      }),
    ];
    const result = computeHandoverQuality(handovers);
    expect(result.with_mood_notes_rate).toBe(0);
    expect(result.with_medication_notes_rate).toBe(0);
    expect(result.with_behaviour_notes_rate).toBe(0);
    expect(result.with_risk_changes_rate).toBe(0);
    expect(result.fully_detailed_rate).toBe(0);
  });

  it("builds priority breakdown across all handovers", () => {
    const handovers = [
      makeHandover({ priority: "routine" }),
      makeHandover({ id: "h2", priority: "routine" }),
      makeHandover({ id: "h3", priority: "urgent" }),
      makeHandover({ id: "h4", priority: "critical" }),
    ];
    const result = computeHandoverQuality(handovers);
    expect(result.priority_breakdown).toEqual({
      routine: 2,
      urgent: 1,
      critical: 1,
    });
  });

  it("reports correct total count", () => {
    const handovers = [makeHandover(), makeHandover({ id: "h2" }), makeHandover({ id: "h3" })];
    const result = computeHandoverQuality(handovers);
    expect(result.total).toBe(3);
  });

  it("handles mixed completeness across multiple children and handovers", () => {
    const handovers = [
      makeHandover({
        child_updates: [
          makeChildUpdate({ mood_notes: "OK", medication_notes: "Done", behaviour_notes: "Fine", risk_changes: "None" }),
          makeChildUpdate({ child_id: "c2", mood_notes: "OK", medication_notes: "", behaviour_notes: "Fine", risk_changes: "None" }),
        ],
      }),
    ];
    const result = computeHandoverQuality(handovers);
    // mood: 2/2 = 100, medication: 1/2 = 50, behaviour: 2/2 = 100, risk: 2/2 = 100
    expect(result.with_mood_notes_rate).toBe(100);
    expect(result.with_medication_notes_rate).toBe(50);
    expect(result.with_behaviour_notes_rate).toBe(100);
    expect(result.with_risk_changes_rate).toBe(100);
    // Not fully detailed because one child is missing medication_notes
    expect(result.fully_detailed_rate).toBe(0);
  });
});

// ── identifyHandoverAlerts ────────────────────────────────────────────────

describe("identifyHandoverAlerts", () => {
  it("returns empty alerts for empty array", () => {
    const alerts = identifyHandoverAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("returns no alerts for a completed, clean handover", () => {
    const handovers = [makeHandover({ completed: true })];
    const alerts = identifyHandoverAlerts(handovers);
    expect(alerts).toEqual([]);
  });

  it("flags incomplete handover older than 2 hours", () => {
    const handovers = [
      makeHandover({
        completed: false,
        created_at: "2020-01-01T00:00:00Z",
        shift_date: "2020-01-01",
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const incomplete = alerts.filter((a) => a.type === "incomplete_handover");
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0].severity).toBe("high");
    expect(incomplete[0].message).toContain("2020-01-01");
  });

  it("does NOT flag incomplete handover if created less than 2 hours ago", () => {
    const recentDate = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago
    const handovers = [
      makeHandover({
        completed: false,
        created_at: recentDate,
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const incomplete = alerts.filter((a) => a.type === "incomplete_handover");
    expect(incomplete).toHaveLength(0);
  });

  it("flags safeguarding flags as critical severity", () => {
    const handovers = [
      makeHandover({
        safeguarding_flags: ["Physical harm concern", "Disclosure"],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const safeguarding = alerts.filter((a) => a.type === "safeguarding_flag");
    expect(safeguarding).toHaveLength(1);
    expect(safeguarding[0].severity).toBe("critical");
    expect(safeguarding[0].message).toContain("2");
    expect(safeguarding[0].message).toContain("Physical harm concern");
    expect(safeguarding[0].message).toContain("Disclosure");
  });

  it("does NOT flag safeguarding when flags array is empty", () => {
    const handovers = [makeHandover({ safeguarding_flags: [] })];
    const alerts = identifyHandoverAlerts(handovers);
    const safeguarding = alerts.filter((a) => a.type === "safeguarding_flag");
    expect(safeguarding).toHaveLength(0);
  });

  it("flags missing child coverage when expectedChildCount given", () => {
    const handovers = [
      makeHandover({
        completed: true,
        child_updates: [makeChildUpdate()],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers, 3);
    const missing = alerts.filter((a) => a.type === "missing_child");
    expect(missing).toHaveLength(1);
    expect(missing[0].severity).toBe("medium");
    expect(missing[0].message).toContain("1 of 3");
  });

  it("does NOT flag missing child if handover is NOT completed", () => {
    const recentDate = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const handovers = [
      makeHandover({
        completed: false,
        created_at: recentDate,
        child_updates: [makeChildUpdate()],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers, 3);
    const missing = alerts.filter((a) => a.type === "missing_child");
    expect(missing).toHaveLength(0);
  });

  it("does NOT flag missing child when expectedChildCount is not provided", () => {
    const handovers = [
      makeHandover({ completed: true, child_updates: [] }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const missing = alerts.filter((a) => a.type === "missing_child");
    expect(missing).toHaveLength(0);
  });

  it("flags high tasks carried forward (>= 5)", () => {
    const handovers = [
      makeHandover({
        tasks_carried_forward: ["t1", "t2", "t3", "t4", "t5"],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const highTasks = alerts.filter((a) => a.type === "high_tasks_carried");
    expect(highTasks).toHaveLength(1);
    expect(highTasks[0].severity).toBe("medium");
    expect(highTasks[0].message).toContain("5");
  });

  it("does NOT flag tasks carried forward when fewer than 5", () => {
    const handovers = [
      makeHandover({
        tasks_carried_forward: ["t1", "t2", "t3", "t4"],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const highTasks = alerts.filter((a) => a.type === "high_tasks_carried");
    expect(highTasks).toHaveLength(0);
  });

  it("flags no_medication_notes when child has medication tasks but no notes", () => {
    const handovers = [
      makeHandover({
        child_updates: [
          makeChildUpdate({
            child_name: "Sam Jones",
            medication_notes: "",
            tasks_outstanding: ["Give medication at 8pm"],
          }),
        ],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const medAlerts = alerts.filter((a) => a.type === "no_medication_notes");
    expect(medAlerts).toHaveLength(1);
    expect(medAlerts[0].severity).toBe("medium");
    expect(medAlerts[0].message).toContain("Sam Jones");
  });

  it("flags no_medication_notes for 'meds' keyword in tasks", () => {
    const handovers = [
      makeHandover({
        child_updates: [
          makeChildUpdate({
            child_name: "Taylor",
            medication_notes: undefined,
            tasks_outstanding: ["Check meds stock"],
          }),
        ],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const medAlerts = alerts.filter((a) => a.type === "no_medication_notes");
    expect(medAlerts).toHaveLength(1);
    expect(medAlerts[0].message).toContain("Taylor");
  });

  it("does NOT flag medication when notes ARE present despite medication tasks", () => {
    const handovers = [
      makeHandover({
        child_updates: [
          makeChildUpdate({
            medication_notes: "Administered at 8pm",
            tasks_outstanding: ["Give medication at 8pm"],
          }),
        ],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const medAlerts = alerts.filter((a) => a.type === "no_medication_notes");
    expect(medAlerts).toHaveLength(0);
  });

  it("does NOT flag medication when tasks have no medication-related keywords", () => {
    const handovers = [
      makeHandover({
        child_updates: [
          makeChildUpdate({
            medication_notes: "",
            tasks_outstanding: ["Complete homework", "Pack school bag"],
          }),
        ],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const medAlerts = alerts.filter((a) => a.type === "no_medication_notes");
    expect(medAlerts).toHaveLength(0);
  });

  it("generates multiple alerts for a single problematic handover", () => {
    const handovers = [
      makeHandover({
        completed: false,
        created_at: "2020-01-01T00:00:00Z",
        shift_date: "2020-01-01",
        safeguarding_flags: ["Disclosure"],
        tasks_carried_forward: ["t1", "t2", "t3", "t4", "t5", "t6"],
        child_updates: [
          makeChildUpdate({
            medication_notes: "",
            tasks_outstanding: ["Administer medication"],
          }),
        ],
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("incomplete_handover");
    expect(types).toContain("safeguarding_flag");
    expect(types).toContain("high_tasks_carried");
    expect(types).toContain("no_medication_notes");
    expect(alerts.length).toBe(4);
  });

  it("generates alerts across multiple handovers independently", () => {
    const handovers = [
      makeHandover({
        id: "h1",
        safeguarding_flags: ["Flag A"],
        shift_date: "2026-05-10",
      }),
      makeHandover({
        id: "h2",
        safeguarding_flags: ["Flag B"],
        shift_date: "2026-05-11",
      }),
    ];
    const alerts = identifyHandoverAlerts(handovers);
    const safeguarding = alerts.filter((a) => a.type === "safeguarding_flag");
    expect(safeguarding).toHaveLength(2);
  });
});
