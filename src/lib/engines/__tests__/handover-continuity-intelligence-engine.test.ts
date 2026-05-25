// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HANDOVER CONTINUITY INTELLIGENCE ENGINE — TESTS
//
// Comprehensive test suite for the handover continuity intelligence engine.
// Reg 34(1)(b), SCCIF shift communication, Quality Standards continuity.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHandoverContinuityIntelligence,
  average,
  type HandoverInput,
  type ChildUpdateInput,
  type SignOffInput,
  type StaffRef,
  type ChildRef,
} from "../handover-continuity-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `hnd_${++_id}`;
}

function makeChildUpdate(overrides: Partial<ChildUpdateInput> = {}): ChildUpdateInput {
  return {
    child_id: "yp_1",
    mood_score: 7,
    key_notes: "Settled day.",
    alerts: [],
    ...overrides,
  };
}

function makeSignOff(overrides: Partial<SignOffInput> = {}): SignOffInput {
  return {
    staff_id: "staff_1",
    acknowledged_at: "2026-05-25T08:00:00Z",
    notes: null,
    ...overrides,
  };
}

function makeHandover(overrides: Partial<HandoverInput> = {}): HandoverInput {
  return {
    id: overrides.id ?? uid(),
    shift_date: TODAY,
    shift_from: "day",
    shift_to: "night",
    handover_time: "21:00",
    completed_at: "21:15",
    outgoing_staff: ["staff_1"],
    incoming_staff: ["staff_2"],
    created_by: "staff_1",
    signed_off_by: "staff_2",
    sign_offs: [makeSignOff({ staff_id: "staff_2" })],
    child_updates: [makeChildUpdate()],
    general_notes: "All good.",
    flags: [],
    linked_incident_ids: [],
    created_at: "2026-05-25T21:00:00Z",
    ...overrides,
  };
}

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren Laville" },
  { id: "staff_ryan", name: "Ryan Clarke" },
  { id: "staff_edward", name: "Edward Scott" },
  { id: "staff_anna", name: "Anna Kowalski" },
  { id: "staff_1", name: "Staff One" },
  { id: "staff_2", name: "Staff Two" },
];

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex W" },
  { id: "yp_jordan", name: "Jordan T" },
  { id: "yp_casey", name: "Casey T" },
  { id: "yp_1", name: "Test Child" },
];

function run(
  handovers: HandoverInput[] = [],
  staff: StaffRef[] = STAFF,
  children: ChildRef[] = CHILDREN,
  today: string = TODAY,
) {
  return computeHandoverContinuityIntelligence({ handovers, staff, children, today });
}

// ── Helper Tests ────────────────────────────────────────────────────────────

describe("helpers", () => {
  it("average returns 0 for empty array", () => {
    expect(average([])).toBe(0);
  });

  it("average computes correctly", () => {
    expect(average([6, 8, 10])).toBe(8);
  });
});

// ── Empty State ─────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns zeroed overview with no handovers", () => {
    const r = run([]);
    expect(r.overview.total_handovers).toBe(0);
    expect(r.overview.completion_rate).toBe(100);
    expect(r.overview.sign_off_rate).toBe(100);
    expect(r.overview.avg_mood_score).toBe(0);
    expect(r.handover_profiles).toHaveLength(0);
    expect(r.child_mood_summary).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ── Overview ────────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts total handovers", () => {
    const r = run([makeHandover(), makeHandover()]);
    expect(r.overview.total_handovers).toBe(2);
  });

  it("counts completed and incomplete", () => {
    const r = run([
      makeHandover({ completed_at: "21:15" }),
      makeHandover({ completed_at: null }),
    ]);
    expect(r.overview.completed_count).toBe(1);
    expect(r.overview.incomplete_count).toBe(1);
    expect(r.overview.completion_rate).toBe(50);
  });

  it("counts fully signed off handovers", () => {
    const r = run([
      makeHandover({
        incoming_staff: ["staff_1", "staff_2"],
        sign_offs: [makeSignOff({ staff_id: "staff_1" }), makeSignOff({ staff_id: "staff_2" })],
      }),
      makeHandover({
        incoming_staff: ["staff_1", "staff_2"],
        sign_offs: [makeSignOff({ staff_id: "staff_1" })], // only 1 of 2
      }),
    ]);
    expect(r.overview.fully_signed_off_count).toBe(1);
    expect(r.overview.sign_off_rate).toBe(50);
  });

  it("calculates average mood across all child updates", () => {
    const r = run([
      makeHandover({
        child_updates: [
          makeChildUpdate({ mood_score: 6 }),
          makeChildUpdate({ mood_score: 8 }),
        ],
      }),
      makeHandover({
        child_updates: [makeChildUpdate({ mood_score: 4 })],
      }),
    ]);
    // (6 + 8 + 4) / 3 = 6.0
    expect(r.overview.avg_mood_score).toBe(6);
  });

  it("excludes null mood scores from average", () => {
    const r = run([
      makeHandover({
        child_updates: [
          makeChildUpdate({ mood_score: 8 }),
          makeChildUpdate({ mood_score: null }),
        ],
      }),
    ]);
    expect(r.overview.avg_mood_score).toBe(8);
  });

  it("counts total child updates and alerts", () => {
    const r = run([
      makeHandover({
        child_updates: [
          makeChildUpdate({ alerts: ["alert1"] }),
          makeChildUpdate({ alerts: ["alert2", "alert3"] }),
        ],
      }),
    ]);
    expect(r.overview.total_child_updates).toBe(2);
    expect(r.overview.total_child_alerts).toBe(3);
  });

  it("counts total flags and incident links", () => {
    const r = run([
      makeHandover({ flags: ["f1", "f2"], linked_incident_ids: ["inc_1"] }),
      makeHandover({ flags: ["f3"], linked_incident_ids: ["inc_2", "inc_3"] }),
    ]);
    expect(r.overview.total_flags).toBe(3);
    expect(r.overview.total_incident_links).toBe(3);
  });

  it("counts unique children covered", () => {
    const r = run([
      makeHandover({
        child_updates: [
          makeChildUpdate({ child_id: "yp_alex" }),
          makeChildUpdate({ child_id: "yp_jordan" }),
        ],
      }),
      makeHandover({
        child_updates: [makeChildUpdate({ child_id: "yp_alex" })], // duplicate
      }),
    ]);
    expect(r.overview.children_covered).toBe(2);
  });
});

// ── Handover Profiles ───────────────────────────────────────────────────────

describe("handover profiles", () => {
  it("generates shift label", () => {
    const r = run([makeHandover({ shift_from: "day", shift_to: "sleep_in" })]);
    expect(r.handover_profiles[0].shift_label).toBe("Day → Sleep-in");
  });

  it("resolves staff names", () => {
    const r = run([
      makeHandover({
        outgoing_staff: ["staff_darren"],
        incoming_staff: ["staff_ryan"],
        signed_off_by: "staff_ryan",
      }),
    ]);
    expect(r.handover_profiles[0].outgoing_staff_names).toEqual(["Darren Laville"]);
    expect(r.handover_profiles[0].incoming_staff_names).toEqual(["Ryan Clarke"]);
    expect(r.handover_profiles[0].signed_off_by_name).toBe("Ryan Clarke");
  });

  it("falls back to staff_id for unknown staff", () => {
    const r = run([makeHandover({ outgoing_staff: ["staff_unknown"] })], []);
    expect(r.handover_profiles[0].outgoing_staff_names).toEqual(["staff_unknown"]);
  });

  it("identifies low mood children (mood <=4)", () => {
    const r = run([
      makeHandover({
        child_updates: [
          makeChildUpdate({ child_id: "yp_casey", mood_score: 3 }),
          makeChildUpdate({ child_id: "yp_jordan", mood_score: 8 }),
        ],
      }),
    ]);
    expect(r.handover_profiles[0].low_mood_children).toEqual(["Casey T"]);
  });

  it("calculates per-handover average mood", () => {
    const r = run([
      makeHandover({
        child_updates: [
          makeChildUpdate({ mood_score: 6 }),
          makeChildUpdate({ mood_score: 4 }),
        ],
      }),
    ]);
    expect(r.handover_profiles[0].avg_mood).toBe(5);
  });
});

// ── Risk Flags ──────────────────────────────────────────────────────────────

describe("risk flags", () => {
  it("flags incomplete handovers", () => {
    const r = run([makeHandover({ completed_at: null })]);
    expect(r.handover_profiles[0].risk_flags).toContain("incomplete");
  });

  it("flags missing sign-offs", () => {
    const r = run([
      makeHandover({
        incoming_staff: ["staff_1", "staff_2"],
        sign_offs: [makeSignOff({ staff_id: "staff_1" })],
      }),
    ]);
    expect(r.handover_profiles[0].risk_flags).toContain("missing_sign_offs");
  });

  it("flags low mood children", () => {
    const r = run([
      makeHandover({
        child_updates: [makeChildUpdate({ mood_score: 3 })],
      }),
    ]);
    expect(r.handover_profiles[0].risk_flags).toContain("low_mood_child");
  });

  it("flags child alerts", () => {
    const r = run([
      makeHandover({
        child_updates: [makeChildUpdate({ alerts: ["something"] })],
      }),
    ]);
    expect(r.handover_profiles[0].risk_flags).toContain("child_alerts");
  });

  it("flags escalation flags", () => {
    const r = run([makeHandover({ flags: ["security_issue"] })]);
    expect(r.handover_profiles[0].risk_flags).toContain("escalation_flags");
  });

  it("flags incident-linked handovers", () => {
    const r = run([makeHandover({ linked_incident_ids: ["inc_1"] })]);
    expect(r.handover_profiles[0].risk_flags).toContain("incident_linked");
  });

  it("no risk flags for a clean, complete handover with happy kids", () => {
    const r = run([
      makeHandover({
        completed_at: "21:15",
        incoming_staff: ["staff_1"],
        sign_offs: [makeSignOff({ staff_id: "staff_1" })],
        child_updates: [makeChildUpdate({ mood_score: 8, alerts: [] })],
        flags: [],
        linked_incident_ids: [],
      }),
    ]);
    expect(r.handover_profiles[0].risk_flags).toHaveLength(0);
  });
});

// ── Child Mood Summary ──────────────────────────────────────────────────────

describe("child mood summary", () => {
  it("aggregates mood per child across handovers", () => {
    const r = run([
      makeHandover({
        child_updates: [makeChildUpdate({ child_id: "yp_alex", mood_score: 6 })],
      }),
      makeHandover({
        child_updates: [makeChildUpdate({ child_id: "yp_alex", mood_score: 8 })],
      }),
    ]);
    const alex = r.child_mood_summary.find((c) => c.child_id === "yp_alex")!;
    expect(alex.mood_entries).toBe(2);
    expect(alex.avg_mood).toBe(7);
    expect(alex.latest_mood).toBe(8);
  });

  it("resolves child names", () => {
    const r = run([
      makeHandover({
        child_updates: [makeChildUpdate({ child_id: "yp_jordan" })],
      }),
    ]);
    expect(r.child_mood_summary[0].child_name).toBe("Jordan T");
  });

  it("falls back to child_id for unknown children", () => {
    const r = run(
      [makeHandover({ child_updates: [makeChildUpdate({ child_id: "yp_unknown" })] })],
      STAFF,
      [], // no children refs
    );
    expect(r.child_mood_summary[0].child_name).toBe("yp_unknown");
  });

  it("collects unique alert themes", () => {
    const r = run([
      makeHandover({
        child_updates: [makeChildUpdate({ child_id: "yp_alex", alerts: ["phone usage", "anxiety"] })],
      }),
      makeHandover({
        child_updates: [makeChildUpdate({ child_id: "yp_alex", alerts: ["phone usage"] })], // duplicate
      }),
    ]);
    const alex = r.child_mood_summary.find((c) => c.child_id === "yp_alex")!;
    expect(alex.total_alerts).toBe(3);
    expect(alex.alert_themes).toHaveLength(2); // unique
  });

  it("sorts by lowest average mood first", () => {
    const r = run([
      makeHandover({
        child_updates: [
          makeChildUpdate({ child_id: "yp_alex", mood_score: 8 }),
          makeChildUpdate({ child_id: "yp_casey", mood_score: 3 }),
        ],
      }),
    ]);
    expect(r.child_mood_summary[0].child_id).toBe("yp_casey");
    expect(r.child_mood_summary[1].child_id).toBe("yp_alex");
  });
});

// ── Alerts ──────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("critical: incomplete handovers", () => {
    const r = run([makeHandover({ completed_at: null })]);
    const critical = r.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].message).toContain("not completed");
  });

  it("high: missing sign-offs", () => {
    const r = run([
      makeHandover({
        incoming_staff: ["staff_1", "staff_2"],
        sign_offs: [makeSignOff({ staff_id: "staff_1" })],
      }),
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("sign-off"));
    expect(high).toHaveLength(1);
  });

  it("high: low mood children", () => {
    const r = run([
      makeHandover({
        child_updates: [makeChildUpdate({ child_id: "yp_casey", mood_score: 3 })],
      }),
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("low average mood"));
    expect(high).toHaveLength(1);
    expect(high[0].message).toContain("Casey T");
  });

  it("medium: child alerts raised", () => {
    const r = run([
      makeHandover({
        child_updates: [makeChildUpdate({ alerts: ["alert1"] })],
      }),
    ]);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("child alert"));
    expect(med).toHaveLength(1);
  });

  it("medium: escalation flags", () => {
    const r = run([makeHandover({ flags: ["security"] })]);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("escalation flag"));
    expect(med).toHaveLength(1);
  });

  it("low: no child updates", () => {
    const r = run([makeHandover({ child_updates: [] })]);
    const low = r.alerts.filter((a) => a.severity === "low");
    expect(low).toHaveLength(1);
    expect(low[0].message).toContain("No child updates");
  });
});

// ── ARIA Insights ───────────────────────────────────────────────────────────

describe("ARIA insights", () => {
  it("critical: incomplete handovers", () => {
    const r = run([makeHandover({ completed_at: null })]);
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].text).toContain("incomplete");
  });

  it("warning: sign-off rate below 100%", () => {
    const r = run([
      makeHandover({
        incoming_staff: ["staff_1", "staff_2"],
        sign_offs: [makeSignOff({ staff_id: "staff_1" })],
      }),
    ]);
    const warnings = r.insights.filter((i) => i.severity === "warning" && i.text.includes("Sign-off rate"));
    expect(warnings).toHaveLength(1);
  });

  it("warning: low mood children", () => {
    const r = run([
      makeHandover({
        child_updates: [makeChildUpdate({ child_id: "yp_casey", mood_score: 3 })],
      }),
    ]);
    const warnings = r.insights.filter((i) => i.text.includes("low average mood"));
    expect(warnings).toHaveLength(1);
  });

  it("positive: all handovers complete", () => {
    const r = run([makeHandover({ completed_at: "21:15" })]);
    const pos = r.insights.filter((i) => i.text.includes("All") && i.text.includes("complete"));
    expect(pos).toHaveLength(1);
  });

  it("positive: full sign-off compliance", () => {
    const r = run([
      makeHandover({
        incoming_staff: ["staff_1"],
        sign_offs: [makeSignOff({ staff_id: "staff_1" })],
      }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("100% sign-off"));
    expect(pos).toHaveLength(1);
  });

  it("positive: good average mood (>=7)", () => {
    const r = run([
      makeHandover({
        child_updates: [
          makeChildUpdate({ mood_score: 8 }),
          makeChildUpdate({ mood_score: 7 }),
        ],
      }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("Average child mood"));
    expect(pos).toHaveLength(1);
  });

  it("positive: comprehensive child coverage (>=3)", () => {
    const r = run([
      makeHandover({
        child_updates: [
          makeChildUpdate({ child_id: "yp_alex" }),
          makeChildUpdate({ child_id: "yp_jordan" }),
          makeChildUpdate({ child_id: "yp_casey" }),
        ],
      }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("3 children"));
    expect(pos).toHaveLength(1);
  });

  it("positive: incident linkage", () => {
    const r = run([makeHandover({ linked_incident_ids: ["inc_1"] })]);
    const pos = r.insights.filter((i) => i.text.includes("incident(s) linked"));
    expect(pos).toHaveLength(1);
  });
});

// ── Oak House Integration ───────────────────────────────────────────────────

describe("Oak House integration", () => {
  const oakHandovers: HandoverInput[] = [
    {
      id: "hnd_001", shift_date: TODAY, shift_from: "day", shift_to: "sleep_in",
      handover_time: "21:30", completed_at: null,
      outgoing_staff: ["staff_darren", "staff_lackson"],
      incoming_staff: ["staff_anna", "staff_mirela", "staff_alex"],
      created_by: "staff_darren", signed_off_by: null, sign_offs: [],
      child_updates: [
        { child_id: "yp_alex", mood_score: 6, key_notes: "Settled day overall.", alerts: ["Phone usage overnight", "Court proceedings anxiety"] },
        { child_id: "yp_jordan", mood_score: 9, key_notes: "Excellent day.", alerts: [] },
        { child_id: "yp_casey", mood_score: 4, key_notes: "Struggled this afternoon.", alerts: ["Contact distress", "Medication delay"] },
      ],
      general_notes: "Rear gate latch needs fixing.",
      flags: ["gate_security", "casey_medication_delay", "alex_safeguarding_strategy_tomorrow"],
      linked_incident_ids: ["inc_004"],
      created_at: "2026-05-25T21:00:00Z",
    },
    {
      id: "hnd_002", shift_date: TODAY, shift_from: "night", shift_to: "day",
      handover_time: "07:30", completed_at: "07:45",
      outgoing_staff: ["staff_edward"],
      incoming_staff: ["staff_darren", "staff_ryan"],
      created_by: "staff_edward", signed_off_by: "staff_darren",
      sign_offs: [
        { staff_id: "staff_darren", acknowledged_at: "2026-05-25T07:40:00Z", notes: null },
        { staff_id: "staff_ryan", acknowledged_at: "2026-05-25T07:42:00Z", notes: "Noted Casey sleep issue" },
      ],
      child_updates: [
        { child_id: "yp_alex", mood_score: 6, key_notes: "Settled night.", alerts: ["Phone usage overnight"] },
        { child_id: "yp_jordan", mood_score: 8, key_notes: "Slept well.", alerts: [] },
        { child_id: "yp_casey", mood_score: 5, key_notes: "Difficult night.", alerts: ["Sleep disturbance", "Medication refusal risk"] },
      ],
      general_notes: "Rear gate latch needs fixing.",
      flags: ["gate_security", "alex_phone_overnight", "casey_sleep_disturbance"],
      linked_incident_ids: ["inc_001", "inc_004"],
      created_at: "2026-05-25T07:30:00Z",
    },
  ];

  it("produces correct overview for Oak House handover data", () => {
    const r = run(oakHandovers, STAFF, CHILDREN);
    const o = r.overview;

    expect(o.total_handovers).toBe(2);
    expect(o.completed_count).toBe(1);  // hnd_002
    expect(o.incomplete_count).toBe(1); // hnd_001
    expect(o.completion_rate).toBe(50);

    // hnd_001: 0 of 3 signed, hnd_002: 2 of 2 signed → 1 fully signed
    expect(o.fully_signed_off_count).toBe(1);
    expect(o.sign_off_rate).toBe(50);

    // Moods: 6, 9, 4, 6, 8, 5 → avg 6.3
    expect(o.avg_mood_score).toBe(6.3);

    // 6 child updates, 7 alerts total
    expect(o.total_child_updates).toBe(6);
    expect(o.total_child_alerts).toBe(7);

    // Flags: 3 + 3 = 6
    expect(o.total_flags).toBe(6);

    // Incident links: 1 + 2 = 3
    expect(o.total_incident_links).toBe(3);

    // 3 unique children
    expect(o.children_covered).toBe(3);
  });

  it("produces correct child mood summary for Oak House", () => {
    const r = run(oakHandovers, STAFF, CHILDREN);

    // Sorted by lowest mood first → Casey (avg 4.5), Alex (avg 6), Jordan (avg 8.5)
    expect(r.child_mood_summary[0].child_id).toBe("yp_casey");
    expect(r.child_mood_summary[0].avg_mood).toBe(4.5);
    expect(r.child_mood_summary[0].total_alerts).toBe(4);

    expect(r.child_mood_summary[1].child_id).toBe("yp_alex");
    expect(r.child_mood_summary[1].avg_mood).toBe(6);

    expect(r.child_mood_summary[2].child_id).toBe("yp_jordan");
    expect(r.child_mood_summary[2].avg_mood).toBe(8.5);
  });

  it("fires expected alerts for Oak House data", () => {
    const r = run(oakHandovers, STAFF, CHILDREN);

    // Critical: 1 incomplete handover
    const incompleteCrit = r.alerts.filter((a) => a.severity === "critical");
    expect(incompleteCrit).toHaveLength(1);

    // High: missing sign-offs (hnd_001 has 3 incoming, 0 signed)
    const signHigh = r.alerts.filter((a) => a.severity === "high" && a.message.includes("sign-off"));
    expect(signHigh).toHaveLength(1);

    // High: Casey low mood (avg 4.5)
    const moodHigh = r.alerts.filter((a) => a.severity === "high" && a.message.includes("low average mood"));
    expect(moodHigh).toHaveLength(1);
    expect(moodHigh[0].message).toContain("Casey T");

    // Medium: child alerts (7 total)
    const alertMed = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("child alert"));
    expect(alertMed).toHaveLength(1);

    // Medium: flags (6 total)
    const flagMed = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("escalation flag"));
    expect(flagMed).toHaveLength(1);
  });

  it("fires expected ARIA insights for Oak House data", () => {
    const r = run(oakHandovers, STAFF, CHILDREN);

    // Critical: incomplete
    expect(r.insights.filter((i) => i.severity === "critical")).toHaveLength(1);

    // Warning: sign-off rate 50%
    const signW = r.insights.filter((i) => i.text.includes("Sign-off rate"));
    expect(signW).toHaveLength(1);

    // Warning: Casey low mood
    const moodW = r.insights.filter((i) => i.text.includes("low average mood"));
    expect(moodW).toHaveLength(1);

    // Positive: 3 children covered
    const childPos = r.insights.filter((i) => i.text.includes("3 children"));
    expect(childPos).toHaveLength(1);

    // Positive: incident linkage
    const incPos = r.insights.filter((i) => i.text.includes("incident(s) linked"));
    expect(incPos).toHaveLength(1);
  });
});
