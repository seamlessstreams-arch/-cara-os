// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RESTRAINT INTELLIGENCE ENGINE — TEST SUITE
// Reg 20/35 — use of restraint, behaviour management, positive strategies
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeRestraintIntelligence,
  daysBetween,
  average,
  majority,
  getTimePeriod,
  computeFrequencyTrend,
  type ChildInput,
  type RestraintInput,
  type StaffInvolvedInput,
  type RestraintIntelligenceInput,
} from "../restraint-intelligence-engine";

// ── Factories ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

function makeChild(overrides: Partial<ChildInput> = {}): ChildInput {
  return { id: "yp_alex", name: "Alex", ...overrides };
}

function makeStaffInvolved(overrides: Partial<StaffInvolvedInput> = {}): StaffInvolvedInput {
  return { staff_id: "staff_1", role: "lead", team_teach_trained: true, ...overrides };
}

function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: "rst_1",
    date: "2026-05-20",
    start_time: "18:30",
    end_time: "18:33",
    duration_minutes: 3,
    child_id: "yp_alex",
    staff_involved: [makeStaffInvolved()],
    reason: "imminent_harm_to_others",
    restraint_type: "standing_hold",
    de_escalation_attempts: ["Verbal reassurance", "Offered quiet space"],
    injuries: [],
    child_debriefed: true,
    staff_debriefed: true,
    review_status: "reviewed",
    body_map_completed: true,
    medical_check_completed: false,
    notifications_sent: 2,
    ...overrides,
  };
}

// ── Unit Tests: Helpers ───────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("returns correct days regardless of order", () => {
    expect(daysBetween("2026-05-20", "2026-05-25")).toBe(5);
    expect(daysBetween("2026-05-25", "2026-05-20")).toBe(5);
  });
});

describe("average", () => {
  it("returns 0 for empty array", () => {
    expect(average([])).toBe(0);
  });

  it("computes average correctly", () => {
    expect(average([2, 4, 6])).toBe(4);
  });
});

describe("majority", () => {
  it("returns null for empty array", () => {
    expect(majority([])).toBeNull();
  });

  it("returns most common value", () => {
    expect(majority(["a", "b", "a", "c", "a"])).toBe("a");
  });

  it("handles single element", () => {
    expect(majority(["x"])).toBe("x");
  });
});

describe("getTimePeriod", () => {
  it("classifies morning", () => {
    expect(getTimePeriod("08:30")).toBe("Morning (6-12)");
  });

  it("classifies afternoon", () => {
    expect(getTimePeriod("14:00")).toBe("Afternoon (12-17)");
  });

  it("classifies evening", () => {
    expect(getTimePeriod("18:45")).toBe("Evening (17-21)");
  });

  it("classifies night", () => {
    expect(getTimePeriod("22:15")).toBe("Night (21-6)");
    expect(getTimePeriod("03:00")).toBe("Night (21-6)");
  });
});

describe("computeFrequencyTrend", () => {
  it("returns insufficient_data for 0-1 incidents in 30d", () => {
    const incidents = [makeRestraint({ date: "2026-05-20" })];
    expect(computeFrequencyTrend(incidents, TODAY)).toBe("insufficient_data");
  });

  it("returns increasing when recent > prior", () => {
    const incidents = [
      makeRestraint({ id: "r1", date: "2026-05-22" }), // recent (3 days ago)
      makeRestraint({ id: "r2", date: "2026-05-20" }), // recent (5 days ago)
      makeRestraint({ id: "r3", date: "2026-05-02" }), // prior (23 days ago)
    ];
    expect(computeFrequencyTrend(incidents, TODAY)).toBe("increasing");
  });

  it("returns decreasing when recent < prior", () => {
    const incidents = [
      makeRestraint({ id: "r1", date: "2026-05-12" }), // recent (13 days ago)
      makeRestraint({ id: "r2", date: "2026-05-02" }), // prior (23 days ago)
      makeRestraint({ id: "r3", date: "2026-04-29" }), // prior (26 days ago)
    ];
    expect(computeFrequencyTrend(incidents, TODAY)).toBe("decreasing");
  });

  it("returns stable when equal", () => {
    const incidents = [
      makeRestraint({ id: "r1", date: "2026-05-20" }), // recent (5 days)
      makeRestraint({ id: "r2", date: "2026-05-02" }), // prior (23 days)
    ];
    expect(computeFrequencyTrend(incidents, TODAY)).toBe("stable");
  });
});

// ── Integration Tests ─────────────────────────────────────────────────────────

describe("computeRestraintIntelligence", () => {
  describe("empty state", () => {
    it("handles no data gracefully", () => {
      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints: [],
        today: TODAY,
      });

      expect(result.overview.total_incidents_30d).toBe(0);
      expect(result.overview.total_incidents_90d).toBe(0);
      expect(result.overview.avg_duration_minutes).toBe(0);
      expect(result.overview.children_involved_30d).toBe(0);
      expect(result.overview.child_debrief_rate).toBe(100);
      expect(result.overview.team_teach_compliance_rate).toBe(100);
      expect(result.child_profiles).toHaveLength(0);
      expect(result.reason_breakdown).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview", () => {
    it("computes correct 30d and 90d counts", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20" }),  // 5 days ago
        makeRestraint({ id: "r2", date: "2026-05-01" }),  // 24 days ago
        makeRestraint({ id: "r3", date: "2026-03-15" }),  // 71 days ago
        makeRestraint({ id: "r4", date: "2026-02-01" }),  // outside 90d
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      expect(result.overview.total_incidents_30d).toBe(2);
      expect(result.overview.total_incidents_90d).toBe(3);
    });

    it("computes duration stats correctly", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", duration_minutes: 3 }),
        makeRestraint({ id: "r2", date: "2026-05-15", duration_minutes: 7 }),
        makeRestraint({ id: "r3", date: "2026-05-10", duration_minutes: 2 }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      expect(result.overview.avg_duration_minutes).toBe(4);
      expect(result.overview.max_duration_minutes).toBe(7);
    });

    it("counts unique children involved in 30d", () => {
      const children = [
        makeChild({ id: "yp_alex", name: "Alex" }),
        makeChild({ id: "yp_jordan", name: "Jordan" }),
      ];
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", child_id: "yp_alex" }),
        makeRestraint({ id: "r2", date: "2026-05-15", child_id: "yp_alex" }),
        makeRestraint({ id: "r3", date: "2026-05-10", child_id: "yp_jordan" }),
      ];

      const result = computeRestraintIntelligence({ children, restraints, today: TODAY });
      expect(result.overview.children_involved_30d).toBe(2);
    });

    it("computes compliance rates", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", child_debriefed: true, staff_debriefed: true, review_status: "reviewed", body_map_completed: true }),
        makeRestraint({ id: "r2", date: "2026-05-15", child_debriefed: false, staff_debriefed: true, review_status: "pending", body_map_completed: true }),
        makeRestraint({ id: "r3", date: "2026-05-10", child_debriefed: true, staff_debriefed: false, review_status: "reviewed", body_map_completed: false }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      expect(result.overview.child_debrief_rate).toBe(67); // 2/3
      expect(result.overview.staff_debrief_rate).toBe(67); // 2/3
      expect(result.overview.review_completion_rate).toBe(67); // 2/3
      expect(result.overview.body_map_rate).toBe(67); // 2/3
    });

    it("computes team teach compliance rate", () => {
      const restraints = [
        makeRestraint({
          id: "r1",
          date: "2026-05-20",
          staff_involved: [
            makeStaffInvolved({ staff_id: "s1", team_teach_trained: true }),
            makeStaffInvolved({ staff_id: "s2", team_teach_trained: true }),
          ],
        }),
        makeRestraint({
          id: "r2",
          date: "2026-05-15",
          staff_involved: [
            makeStaffInvolved({ staff_id: "s1", team_teach_trained: true }),
            makeStaffInvolved({ staff_id: "s3", team_teach_trained: false }),
          ],
        }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      // 3/4 staff trained across all incidents
      expect(result.overview.team_teach_compliance_rate).toBe(75);
    });

    it("computes de-escalation documentation rate", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", de_escalation_attempts: ["verbal"] }),
        makeRestraint({ id: "r2", date: "2026-05-15", de_escalation_attempts: [] }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      expect(result.overview.de_escalation_documented_rate).toBe(50);
    });
  });

  describe("child profiles", () => {
    it("creates profiles only for children with incidents", () => {
      const children = [
        makeChild({ id: "yp_alex", name: "Alex" }),
        makeChild({ id: "yp_jordan", name: "Jordan" }),
      ];
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", child_id: "yp_alex" }),
      ];

      const result = computeRestraintIntelligence({ children, restraints, today: TODAY });
      expect(result.child_profiles).toHaveLength(1);
      expect(result.child_profiles[0].child_name).toBe("Alex");
    });

    it("computes correct profile metrics", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", duration_minutes: 3, reason: "imminent_harm_to_others", restraint_type: "standing_hold", child_debriefed: true }),
        makeRestraint({ id: "r2", date: "2026-05-10", duration_minutes: 5, reason: "imminent_harm_to_others", restraint_type: "planned_hold", child_debriefed: true }),
        makeRestraint({ id: "r3", date: "2026-04-01", duration_minutes: 7, reason: "imminent_harm_to_self", restraint_type: "wrap_hold", child_debriefed: false, injuries: [{ person: "Alex", description: "bruise" }] }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const profile = result.child_profiles[0];
      expect(profile.total_incidents_30d).toBe(2);
      expect(profile.total_incidents_90d).toBe(3);
      expect(profile.avg_duration).toBe(5); // (3+5+7)/3
      expect(profile.primary_reason).toBe("imminent_harm_to_others");
      expect(profile.injuries_count).toBe(1);
      expect(profile.debriefed_rate).toBe(67); // 2/3
    });
  });

  describe("reason breakdown", () => {
    it("groups by reason with correct percentages", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", reason: "imminent_harm_to_others" }),
        makeRestraint({ id: "r2", date: "2026-05-15", reason: "imminent_harm_to_others" }),
        makeRestraint({ id: "r3", date: "2026-05-10", reason: "imminent_harm_to_self" }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      expect(result.reason_breakdown).toHaveLength(2);
      expect(result.reason_breakdown[0].reason).toBe("imminent_harm_to_others");
      expect(result.reason_breakdown[0].count).toBe(2);
      expect(result.reason_breakdown[0].percentage).toBe(67);
      expect(result.reason_breakdown[1].reason).toBe("imminent_harm_to_self");
      expect(result.reason_breakdown[1].count).toBe(1);
      expect(result.reason_breakdown[1].percentage).toBe(33);
    });
  });

  describe("type breakdown", () => {
    it("groups by restraint type", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", restraint_type: "standing_hold" }),
        makeRestraint({ id: "r2", date: "2026-05-15", restraint_type: "standing_hold" }),
        makeRestraint({ id: "r3", date: "2026-05-10", restraint_type: "wrap_hold" }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      expect(result.type_breakdown).toHaveLength(2);
      expect(result.type_breakdown[0].type).toBe("standing_hold");
      expect(result.type_breakdown[0].count).toBe(2);
    });
  });

  describe("time patterns", () => {
    it("groups incidents by time of day", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", start_time: "18:30" }),  // Evening
        makeRestraint({ id: "r2", date: "2026-05-15", start_time: "19:00" }),  // Evening
        makeRestraint({ id: "r3", date: "2026-05-10", start_time: "14:50" }),  // Afternoon
        makeRestraint({ id: "r4", date: "2026-05-05", start_time: "21:15" }),  // Night
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      expect(result.time_patterns.length).toBeGreaterThanOrEqual(2);
      expect(result.time_patterns[0].period).toBe("Evening (17-21)");
      expect(result.time_patterns[0].count).toBe(2);
    });
  });

  describe("alerts", () => {
    it("generates critical alert for 3+ incidents in 30d per child", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-22" }),
        makeRestraint({ id: "r2", date: "2026-05-15" }),
        makeRestraint({ id: "r3", date: "2026-05-10" }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.some((a) => a.message.includes("Alex") && a.message.includes("3 restraints"))).toBe(true);
    });

    it("generates critical alert for injury without review", () => {
      const restraints = [
        makeRestraint({
          id: "r1",
          date: "2026-05-20",
          injuries: [{ person: "Alex", description: "bruise" }],
          review_status: "pending",
        }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.some((a) => a.message.includes("injury") && a.message.includes("pending review"))).toBe(true);
    });

    it("generates high alert for missing child debrief", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", child_debriefed: false }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("not debriefed"))).toBe(true);
    });

    it("generates medium alert for pending reviews", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", review_status: "pending" }),
        makeRestraint({ id: "r2", date: "2026-05-15", review_status: "pending" }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("2 restraint reviews pending"))).toBe(true);
    });

    it("generates medium alert for untrained staff", () => {
      const restraints = [
        makeRestraint({
          id: "r1",
          date: "2026-05-20",
          staff_involved: [makeStaffInvolved({ team_teach_trained: false })],
        }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("without current Team Teach"))).toBe(true);
    });

    it("generates no alerts when fully compliant", () => {
      const restraints = [
        makeRestraint({
          id: "r1",
          date: "2026-05-20",
          child_debriefed: true,
          staff_debriefed: true,
          review_status: "reviewed",
          body_map_completed: true,
          injuries: [],
        }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      // Only 1 incident in 30d — no critical frequency alert
      // Fully compliant — no other alerts
      const critical = result.alerts.filter((a) => a.severity === "critical");
      const high = result.alerts.filter((a) => a.severity === "high");
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(critical).toHaveLength(0);
      expect(high).toHaveLength(0);
      expect(medium).toHaveLength(0);
    });
  });

  describe("ARIA insights", () => {
    it("generates critical insight for high frequency (5+ in 30d)", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-24" }),
        makeRestraint({ id: "r2", date: "2026-05-20" }),
        makeRestraint({ id: "r3", date: "2026-05-15" }),
        makeRestraint({ id: "r4", date: "2026-05-10" }),
        makeRestraint({ id: "r5", date: "2026-05-05" }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].text).toContain("5 physical interventions");
      expect(critical[0].text).toContain("Reg 20");
    });

    it("generates warning for injuries", () => {
      const restraints = [
        makeRestraint({
          id: "r1",
          date: "2026-05-20",
          injuries: [{ person: "Alex", description: "bruise" }],
          review_status: "reviewed",
        }),
        makeRestraint({ id: "r2", date: "2026-05-15" }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("resulted in injury"))).toBe(true);
    });

    it("generates warning for low debrief rate", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", child_debriefed: false }),
        makeRestraint({ id: "r2", date: "2026-05-15", child_debriefed: true }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("debrief rate is 50%"))).toBe(true);
    });

    it("generates positive insight for 100% debrief completion", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", child_debriefed: true, staff_debriefed: true }),
        makeRestraint({ id: "r2", date: "2026-05-15", child_debriefed: true, staff_debriefed: true }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("100% debrief completion"))).toBe(true);
    });

    it("generates positive insight for zero incidents in 30d when some in 90d", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-03-20" }), // 66 days ago
        makeRestraint({ id: "r2", date: "2026-03-10" }), // 76 days ago
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("No physical interventions in the last 30 days"))).toBe(true);
    });

    it("generates positive insight for all reviews complete", () => {
      const restraints = [
        makeRestraint({ id: "r1", date: "2026-05-20", review_status: "reviewed" }),
        makeRestraint({ id: "r2", date: "2026-05-15", review_status: "reviewed" }),
      ];

      const result = computeRestraintIntelligence({
        children: [makeChild()],
        restraints,
        today: TODAY,
      });

      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 2 restraint records have been reviewed"))).toBe(true);
    });
  });

  describe("full Chamberlain House integration", () => {
    it("processes realistic multi-incident data", () => {
      const children: ChildInput[] = [
        { id: "yp_alex", name: "Alex" },
        { id: "yp_jordan", name: "Jordan" },
      ];

      const restraints: RestraintInput[] = [
        {
          id: "rst_001", date: "2026-04-20", start_time: "21:15", end_time: "21:18",
          duration_minutes: 3, child_id: "yp_alex",
          staff_involved: [
            { staff_id: "staff_edward", role: "lead", team_teach_trained: true },
            { staff_id: "staff_anna", role: "support", team_teach_trained: true },
          ],
          reason: "imminent_harm_to_others", restraint_type: "planned_hold",
          de_escalation_attempts: ["Verbal reassurance", "Offered quiet space", "Attempted redirect"],
          injuries: [], child_debriefed: true, staff_debriefed: true,
          review_status: "reviewed", body_map_completed: true, medical_check_completed: false,
          notifications_sent: 2,
        },
        {
          id: "rst_002", date: "2026-05-03", start_time: "14:50", end_time: "14:52",
          duration_minutes: 2, child_id: "yp_alex",
          staff_involved: [
            { staff_id: "staff_chervelle", role: "lead", team_teach_trained: true },
            { staff_id: "staff_ryan", role: "support", team_teach_trained: true },
          ],
          reason: "imminent_harm_to_others", restraint_type: "standing_hold",
          de_escalation_attempts: ["Verbal de-escalation", "Offered alternative", "Calm voice"],
          injuries: [], child_debriefed: true, staff_debriefed: true,
          review_status: "pending", body_map_completed: true, medical_check_completed: false,
          notifications_sent: 2,
        },
        {
          id: "rst_003", date: "2026-05-15", start_time: "18:30", end_time: "18:37",
          duration_minutes: 7, child_id: "yp_alex",
          staff_involved: [
            { staff_id: "staff_ryan", role: "lead", team_teach_trained: true },
            { staff_id: "staff_edward", role: "support", team_teach_trained: true },
          ],
          reason: "imminent_harm_to_self", restraint_type: "wrap_hold",
          de_escalation_attempts: ["Verbal de-escalation", "Attempt to remove object", "Offered coping"],
          injuries: [{ person: "Alex", description: "Minor bruise to left forearm" }],
          child_debriefed: false, staff_debriefed: true,
          review_status: "pending", body_map_completed: true, medical_check_completed: true,
          notifications_sent: 4,
        },
      ];

      const result = computeRestraintIntelligence({ children, restraints, today: TODAY });

      // Overview
      expect(result.overview.total_incidents_30d).toBe(2); // May 3 and May 15
      expect(result.overview.total_incidents_90d).toBe(3);
      expect(result.overview.avg_duration_minutes).toBe(4); // (3+2+7)/3
      expect(result.overview.max_duration_minutes).toBe(7);
      expect(result.overview.incidents_with_injury).toBe(1);
      expect(result.overview.child_debrief_rate).toBe(67); // 2/3
      expect(result.overview.team_teach_compliance_rate).toBe(100);
      expect(result.overview.de_escalation_documented_rate).toBe(100);

      // Child profiles — only Alex has incidents
      expect(result.child_profiles).toHaveLength(1);
      const alex = result.child_profiles[0];
      expect(alex.child_name).toBe("Alex");
      expect(alex.total_incidents_90d).toBe(3);
      expect(alex.primary_reason).toBe("imminent_harm_to_others");
      expect(alex.injuries_count).toBe(1);

      // Reason breakdown
      expect(result.reason_breakdown[0].reason).toBe("imminent_harm_to_others");
      expect(result.reason_breakdown[0].count).toBe(2);

      // Time patterns
      expect(result.time_patterns.length).toBeGreaterThanOrEqual(1);

      // Alerts
      expect(result.alerts.some((a) => a.severity === "critical" && a.message.includes("injury"))).toBe(true);
      expect(result.alerts.some((a) => a.severity === "high" && a.message.includes("not debriefed"))).toBe(true);
      expect(result.alerts.some((a) => a.severity === "medium" && a.message.includes("pending"))).toBe(true);

      // ARIA insights
      expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("resulted in injury"))).toBe(true);
      expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("debrief rate"))).toBe(true);
    });
  });
});
