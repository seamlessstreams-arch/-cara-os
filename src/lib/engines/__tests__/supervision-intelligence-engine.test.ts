// ══════════════════════════════════════════════════════════════════════════════
// CARA — SUPERVISION INTELLIGENCE ENGINE — TEST SUITE
// Reg 33/32/29 — supervision, staff fitness, RM qualifications
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSupervisionIntelligence,
  daysBetween,
  daysUntil,
  average,
  computeSupervisionCompliance,
  computeWellbeingTrend,
  type StaffInput,
  type SupervisionInput,
  type TrainingInput,
  type SupervisionActionInput,
  type SupervisionIntelligenceInput,
} from "../supervision-intelligence-engine";

// ── Factories ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-24";

function makeStaff(overrides: Partial<StaffInput> = {}): StaffInput {
  return {
    id: "staff_1",
    name: "Anna Smith",
    role: "RSW",
    ...overrides,
  };
}

function makeSupervision(overrides: Partial<SupervisionInput> = {}): SupervisionInput {
  return {
    id: "sup_1",
    staff_id: "staff_1",
    supervisor_id: "staff_rm",
    type: "formal",
    scheduled_date: "2026-05-10",
    actual_date: "2026-05-10",
    duration_minutes: 60,
    status: "completed",
    actions_agreed: [],
    wellbeing_score: 7,
    next_date: "2026-06-07",
    ...overrides,
  };
}

function makeTraining(overrides: Partial<TrainingInput> = {}): TrainingInput {
  return {
    id: "tr_1",
    staff_id: "staff_1",
    course_name: "Safeguarding Level 3",
    category: "safeguarding",
    status: "compliant",
    is_mandatory: true,
    expiry_date: "2027-01-15",
    completed_date: "2026-01-15",
    ...overrides,
  };
}

function makeAction(overrides: Partial<SupervisionActionInput> = {}): SupervisionActionInput {
  return {
    description: "Complete online training",
    owner: "staff_1",
    due_date: "2026-06-01",
    status: "pending",
    ...overrides,
  };
}

// ── Unit Tests: Helpers ───────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-24", "2026-05-24")).toBe(0);
  });

  it("returns correct days regardless of order", () => {
    expect(daysBetween("2026-05-20", "2026-05-24")).toBe(4);
    expect(daysBetween("2026-05-24", "2026-05-20")).toBe(4);
  });

  it("handles month boundaries", () => {
    expect(daysBetween("2026-04-28", "2026-05-03")).toBe(5);
  });
});

describe("daysUntil", () => {
  it("returns positive for future dates", () => {
    expect(daysUntil("2026-05-24", "2026-05-31")).toBe(7);
  });

  it("returns negative for past dates", () => {
    expect(daysUntil("2026-05-24", "2026-05-17")).toBe(-7);
  });

  it("returns 0 for same day", () => {
    expect(daysUntil("2026-05-24", "2026-05-24")).toBe(0);
  });
});

describe("average", () => {
  it("returns 0 for empty array", () => {
    expect(average([])).toBe(0);
  });

  it("computes average correctly", () => {
    expect(average([6, 7, 8])).toBe(7);
  });

  it("handles single value", () => {
    expect(average([9])).toBe(9);
  });
});

describe("computeSupervisionCompliance", () => {
  it("returns on_track when next_date is 14+ days ahead", () => {
    expect(computeSupervisionCompliance("2026-06-10", null, TODAY)).toBe("on_track");
  });

  it("returns due_soon when next_date is within 7 days", () => {
    expect(computeSupervisionCompliance("2026-05-28", null, TODAY)).toBe("due_soon");
  });

  it("returns due_soon when next_date is past but within 7 day grace", () => {
    expect(computeSupervisionCompliance("2026-05-20", null, TODAY)).toBe("due_soon");
  });

  it("returns overdue when next_date is more than 7 days past", () => {
    expect(computeSupervisionCompliance("2026-05-15", null, TODAY)).toBe("overdue");
  });

  it("falls back to lastDate when no nextDate", () => {
    // 10 days since last = on_track
    expect(computeSupervisionCompliance(null, "2026-05-14", TODAY)).toBe("on_track");
  });

  it("returns due_soon from lastDate when 26-35 days", () => {
    // 28 days ago
    expect(computeSupervisionCompliance(null, "2026-04-26", TODAY)).toBe("due_soon");
  });

  it("returns overdue from lastDate when >35 days", () => {
    // 40 days ago
    expect(computeSupervisionCompliance(null, "2026-04-14", TODAY)).toBe("overdue");
  });

  it("returns overdue when no dates available", () => {
    expect(computeSupervisionCompliance(null, null, TODAY)).toBe("overdue");
  });
});

describe("computeWellbeingTrend", () => {
  it("returns insufficient_data for 0-1 scores", () => {
    expect(computeWellbeingTrend([])).toBe("insufficient_data");
    expect(computeWellbeingTrend([7])).toBe("insufficient_data");
  });

  it("returns improving when last > previous", () => {
    expect(computeWellbeingTrend([5, 7])).toBe("improving");
  });

  it("returns declining when last < previous", () => {
    expect(computeWellbeingTrend([8, 6])).toBe("declining");
  });

  it("returns stable when equal", () => {
    expect(computeWellbeingTrend([7, 7])).toBe("stable");
  });

  it("uses only last two scores", () => {
    expect(computeWellbeingTrend([3, 5, 8, 6])).toBe("declining");
  });
});

// ── Integration Tests ─────────────────────────────────────────────────────────

describe("computeSupervisionIntelligence", () => {
  describe("empty state", () => {
    it("handles no data gracefully", () => {
      const result = computeSupervisionIntelligence({
        staff: [],
        supervisions: [],
        training: [],
        today: TODAY,
      });

      expect(result.overview.total_staff).toBe(0);
      expect(result.overview.supervisions_completed_90d).toBe(0);
      expect(result.overview.supervisions_overdue).toBe(0);
      expect(result.overview.action_completion_rate).toBeNull();
      expect(result.overview.training_compliance_rate).toBeNull();
      expect(result.staff_profiles).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview", () => {
    it("computes correct overview stats", () => {
      const staff = [
        makeStaff({ id: "staff_1", name: "Anna" }),
        makeStaff({ id: "staff_2", name: "Edward" }),
      ];

      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-05-10", next_date: "2026-06-07" }),
        makeSupervision({ id: "sup_2", staff_id: "staff_1", actual_date: "2026-04-10", next_date: "2026-05-10" }),
        makeSupervision({ id: "sup_3", staff_id: "staff_2", actual_date: "2026-03-15", next_date: "2026-04-12" }),
      ];

      const training: TrainingInput[] = [
        makeTraining({ id: "tr_1", staff_id: "staff_1", status: "compliant" }),
        makeTraining({ id: "tr_2", staff_id: "staff_2", status: "expired" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training, today: TODAY });

      expect(result.overview.total_staff).toBe(2);
      expect(result.overview.supervisions_completed_90d).toBe(3);
      expect(result.overview.avg_wellbeing_score).toBe(7);
      expect(result.overview.training_compliance_rate).toBe(50); // 1/2
    });

    it("computes avg days between supervisions", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-04-24", next_date: "2026-06-01" }),
        makeSupervision({ id: "sup_2", staff_id: "staff_1", actual_date: "2026-05-24", next_date: "2026-06-21" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      expect(result.overview.avg_days_between_supervisions).toBe(30);
    });

    it("computes action completion rate", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({
          id: "sup_1",
          staff_id: "staff_1",
          actual_date: "2026-05-10",
          next_date: "2026-06-07",
          actions_agreed: [
            makeAction({ status: "completed" }),
            makeAction({ status: "completed" }),
            makeAction({ status: "pending" }),
            makeAction({ status: "pending" }),
          ],
        }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      expect(result.overview.action_completion_rate).toBe(50);
    });
  });

  describe("staff profiles", () => {
    it("calculates correct profile metrics", () => {
      const staff = [makeStaff({ id: "staff_1", name: "Anna", role: "RSW" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({
          id: "sup_1",
          staff_id: "staff_1",
          actual_date: "2026-05-10",
          wellbeing_score: 8,
          next_date: "2026-06-07",
          actions_agreed: [
            makeAction({ status: "pending", due_date: "2026-05-20" }), // overdue
            makeAction({ status: "pending", due_date: "2026-06-01" }), // pending
            makeAction({ status: "completed" }),
          ],
        }),
        makeSupervision({
          id: "sup_2",
          staff_id: "staff_1",
          actual_date: "2026-04-10",
          wellbeing_score: 6,
          next_date: "2026-05-10",
        }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const profile = result.staff_profiles[0];

      expect(profile.staff_name).toBe("Anna");
      expect(profile.role).toBe("RSW");
      expect(profile.supervisions_90d).toBe(2);
      expect(profile.last_supervision_date).toBe("2026-05-10");
      expect(profile.last_supervision_days_ago).toBe(14);
      expect(profile.next_supervision_date).toBe("2026-06-07");
      expect(profile.avg_wellbeing).toBe(7);
      expect(profile.wellbeing_trend).toBe("improving"); // 6 → 8
      expect(profile.actions_pending).toBe(2);
      expect(profile.actions_overdue).toBe(1);
      expect(profile.compliance_status).toBe("on_track");
    });

    it("marks overdue staff correctly", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      // Last supervision was 50 days ago, no next date
      const supervisions: SupervisionInput[] = [
        makeSupervision({
          id: "sup_1",
          staff_id: "staff_1",
          actual_date: "2026-04-04",
          next_date: null,
        }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      expect(result.staff_profiles[0].compliance_status).toBe("overdue");
    });

    it("computes training status as non_compliant when mandatory training expired", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const training: TrainingInput[] = [
        makeTraining({ id: "tr_1", staff_id: "staff_1", status: "expired", is_mandatory: true }),
        makeTraining({ id: "tr_2", staff_id: "staff_1", status: "compliant", is_mandatory: true }),
      ];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-05-10", next_date: "2026-06-07" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training, today: TODAY });
      expect(result.staff_profiles[0].training_status).toBe("non_compliant");
    });

    it("computes training status as expiring when mandatory expiring_soon", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const training: TrainingInput[] = [
        makeTraining({ id: "tr_1", staff_id: "staff_1", status: "expiring_soon", is_mandatory: true }),
        makeTraining({ id: "tr_2", staff_id: "staff_1", status: "compliant", is_mandatory: true }),
      ];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-05-10", next_date: "2026-06-07" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training, today: TODAY });
      expect(result.staff_profiles[0].training_status).toBe("expiring");
    });

    it("marks staff with no supervision history as overdue", () => {
      const staff = [makeStaff({ id: "staff_new", name: "New Starter" })];

      const result = computeSupervisionIntelligence({ staff, supervisions: [], training: [], today: TODAY });
      const profile = result.staff_profiles[0];

      expect(profile.compliance_status).toBe("overdue");
      expect(profile.last_supervision_date).toBeNull();
      expect(profile.last_supervision_days_ago).toBe(999);
      expect(profile.wellbeing_trend).toBe("insufficient_data");
    });
  });

  describe("wellbeing analysis", () => {
    it("identifies staff below threshold", () => {
      const staff = [
        makeStaff({ id: "staff_1", name: "Anna" }),
        makeStaff({ id: "staff_2", name: "Edward" }),
      ];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-05-10", wellbeing_score: 4, next_date: "2026-06-07" }),
        makeSupervision({ id: "sup_2", staff_id: "staff_2", actual_date: "2026-05-10", wellbeing_score: 8, next_date: "2026-06-07" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      expect(result.wellbeing.staff_below_threshold).toBe(1);
      expect(result.wellbeing.lowest_score_staff).toBe("Anna");
      expect(result.wellbeing.highest_score_staff).toBe("Edward");
    });

    it("computes wellbeing trend from recent supervisions", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-04-10", wellbeing_score: 6, next_date: "2026-05-10" }),
        makeSupervision({ id: "sup_2", staff_id: "staff_1", actual_date: "2026-05-10", wellbeing_score: 8, next_date: "2026-06-07" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      expect(result.wellbeing.trend).toBe("improving");
    });

    it("returns insufficient_data with one supervision", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-05-10", wellbeing_score: 7, next_date: "2026-06-07" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      expect(result.wellbeing.trend).toBe("insufficient_data");
    });
  });

  describe("training compliance", () => {
    it("counts training statuses correctly", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const training: TrainingInput[] = [
        makeTraining({ id: "tr_1", status: "compliant", is_mandatory: true }),
        makeTraining({ id: "tr_2", status: "expiring_soon", is_mandatory: true }),
        makeTraining({ id: "tr_3", status: "expired", is_mandatory: true }),
        makeTraining({ id: "tr_4", status: "not_started", is_mandatory: false }),
        makeTraining({ id: "tr_5", status: "compliant", is_mandatory: false }),
      ];
      const supervisions = [makeSupervision({ staff_id: "staff_1", next_date: "2026-06-07" })];

      const result = computeSupervisionIntelligence({ staff, supervisions, training, today: TODAY });
      const tc = result.training_compliance;

      expect(tc.total_records).toBe(5);
      expect(tc.compliant).toBe(2);
      expect(tc.expiring_soon).toBe(1);
      expect(tc.expired).toBe(1);
      expect(tc.not_started).toBe(1);
      expect(tc.mandatory_compliant).toBe(2); // compliant + expiring_soon
      expect(tc.mandatory_total).toBe(3);
    });

    it("mandatory training compliance rate calculates correctly", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const training: TrainingInput[] = [
        makeTraining({ id: "tr_1", status: "compliant", is_mandatory: true }),
        makeTraining({ id: "tr_2", status: "compliant", is_mandatory: true }),
        makeTraining({ id: "tr_3", status: "expired", is_mandatory: true }),
        makeTraining({ id: "tr_4", status: "not_started", is_mandatory: true }),
      ];
      const supervisions = [makeSupervision({ staff_id: "staff_1", next_date: "2026-06-07" })];

      const result = computeSupervisionIntelligence({ staff, supervisions, training, today: TODAY });
      expect(result.overview.mandatory_training_compliance).toBe(50); // 2/4
    });
  });

  describe("alerts", () => {
    it("generates critical alert for overdue staff", () => {
      const staff = [makeStaff({ id: "staff_1", name: "Edward" })];
      // 50 days since last supervision, no next date
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-04-04", next_date: null }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].message).toContain("Edward");
      expect(critical[0].message).toContain("overdue");
    });

    it("generates high alert for low wellbeing", () => {
      const staff = [makeStaff({ id: "staff_1", name: "Anna" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", wellbeing_score: 4, actual_date: "2026-05-10", next_date: "2026-06-07" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.length).toBe(1);
      expect(high[0].message).toContain("Anna");
      expect(high[0].message).toContain("4/10");
    });

    it("generates medium alert for expired mandatory training", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const training: TrainingInput[] = [
        makeTraining({ id: "tr_1", staff_id: "staff_1", status: "expired", is_mandatory: true }),
      ];
      const supervisions = [makeSupervision({ staff_id: "staff_1", next_date: "2026-06-07" })];

      const result = computeSupervisionIntelligence({ staff, supervisions, training, today: TODAY });
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("mandatory training"))).toBe(true);
    });

    it("generates medium alert for overdue actions", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({
          id: "sup_1",
          staff_id: "staff_1",
          actual_date: "2026-05-10",
          next_date: "2026-06-07",
          actions_agreed: [
            makeAction({ status: "pending", due_date: "2026-05-15" }), // overdue
            makeAction({ status: "pending", due_date: "2026-05-20" }), // overdue
          ],
        }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("action"))).toBe(true);
    });

    it("generates low alert for due_soon supervisions", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-05-10", next_date: "2026-05-28" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.some((a) => a.message.includes("due within 7 days"))).toBe(true);
    });

    it("generates no alerts when fully compliant", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-05-10", wellbeing_score: 8, next_date: "2026-06-10" }),
      ];
      const training: TrainingInput[] = [
        makeTraining({ id: "tr_1", staff_id: "staff_1", status: "compliant", is_mandatory: true }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training, today: TODAY });
      expect(result.alerts).toHaveLength(0);
    });
  });

  describe("Cara insights", () => {
    it("generates critical insight for overdue supervision", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-04-01", next_date: null }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].text).toContain("Reg 33");
    });

    it("generates warning for declining wellbeing", () => {
      const staff = [makeStaff({ id: "staff_1", name: "Anna" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-04-10", wellbeing_score: 8, next_date: "2026-05-10" }),
        makeSupervision({ id: "sup_2", staff_id: "staff_1", actual_date: "2026-05-10", wellbeing_score: 5, next_date: "2026-06-07" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("Anna"))).toBe(true);
      expect(warnings.some((w) => w.text.includes("declining wellbeing"))).toBe(true);
    });

    it("generates warning for low training compliance", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const training: TrainingInput[] = [
        makeTraining({ id: "tr_1", status: "expired", is_mandatory: true }),
        makeTraining({ id: "tr_2", status: "not_started", is_mandatory: true }),
        makeTraining({ id: "tr_3", status: "compliant", is_mandatory: true }),
      ];
      const supervisions = [makeSupervision({ staff_id: "staff_1", next_date: "2026-06-07" })];

      const result = computeSupervisionIntelligence({ staff, supervisions, training, today: TODAY });
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("training compliance"))).toBe(true);
    });

    it("generates positive insight when all supervisions current", () => {
      const staff = [
        makeStaff({ id: "staff_1", name: "Anna" }),
        makeStaff({ id: "staff_2", name: "Edward" }),
      ];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-05-10", next_date: "2026-06-10" }),
        makeSupervision({ id: "sup_2", staff_id: "staff_2", actual_date: "2026-05-12", next_date: "2026-06-12" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 2 staff"))).toBe(true);
    });

    it("generates positive insight for high wellbeing", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({ id: "sup_1", staff_id: "staff_1", actual_date: "2026-04-10", wellbeing_score: 8, next_date: "2026-05-10" }),
        makeSupervision({ id: "sup_2", staff_id: "staff_1", actual_date: "2026-05-01", wellbeing_score: 8, next_date: "2026-05-30" }),
        makeSupervision({ id: "sup_3", staff_id: "staff_1", actual_date: "2026-05-10", wellbeing_score: 8, next_date: "2026-06-07" }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("wellbeing score is 8"))).toBe(true);
    });

    it("generates positive insight for high action completion", () => {
      const staff = [makeStaff({ id: "staff_1" })];
      const supervisions: SupervisionInput[] = [
        makeSupervision({
          id: "sup_1",
          staff_id: "staff_1",
          actual_date: "2026-05-10",
          next_date: "2026-06-07",
          actions_agreed: [
            makeAction({ status: "completed" }),
            makeAction({ status: "completed" }),
            makeAction({ status: "completed" }),
            makeAction({ status: "completed" }),
            makeAction({ status: "pending", due_date: "2026-06-01" }),
          ],
        }),
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training: [], today: TODAY });
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("action completion rate is 80%"))).toBe(true);
    });
  });

  describe("full Chamberlain House integration", () => {
    it("processes realistic multi-staff data", () => {
      const staff: StaffInput[] = [
        { id: "staff_edward", name: "Edward", role: "Night RSW" },
        { id: "staff_anna", name: "Anna", role: "RSW" },
        { id: "staff_lackson", name: "Lackson", role: "RSW" },
        { id: "staff_diane", name: "Diane", role: "Deputy Manager" },
      ];

      const supervisions: SupervisionInput[] = [
        // Edward — completed 2026-03-26, next_date: 2026-04-19 (now 35 days past)
        {
          id: "sup_001", staff_id: "staff_edward", supervisor_id: "staff_ryan",
          type: "formal", scheduled_date: "2026-03-26", actual_date: "2026-03-26",
          duration_minutes: 60, status: "completed",
          actions_agreed: [
            { description: "Book training", owner: "staff_edward", due_date: "2026-04-15", status: "pending" },
            { description: "Shadow senior", owner: "staff_edward", due_date: "2026-04-30", status: "pending" },
          ],
          wellbeing_score: 7, next_date: "2026-04-19",
        },
        // Anna — completed 2026-04-03, next_date: 2026-04-23 (now 31 days past)
        {
          id: "sup_002", staff_id: "staff_anna", supervisor_id: "staff_ryan",
          type: "formal", scheduled_date: "2026-04-03", actual_date: "2026-04-03",
          duration_minutes: 55, status: "completed",
          actions_agreed: [
            { description: "GDPR refresher", owner: "staff_anna", due_date: "2026-04-10", status: "completed" },
          ],
          wellbeing_score: 8, next_date: "2026-04-23",
        },
        // Lackson — completed 2026-03-28, next_date: 2026-04-25 (now 29 days past)
        {
          id: "sup_003", staff_id: "staff_lackson", supervisor_id: "staff_ryan",
          type: "formal", scheduled_date: "2026-03-28", actual_date: "2026-03-28",
          duration_minutes: 50, status: "completed",
          actions_agreed: [
            { description: "No further late arrivals", owner: "staff_lackson", due_date: "2026-04-25", status: "pending" },
          ],
          wellbeing_score: 8, next_date: "2026-04-25",
        },
        // Diane — scheduled for 2026-04-20 (past, not completed) — no completed supervisions
        {
          id: "sup_004", staff_id: "staff_diane", supervisor_id: "staff_ryan",
          type: "formal", scheduled_date: "2026-04-20", actual_date: null,
          duration_minutes: null, status: "scheduled",
          actions_agreed: [], wellbeing_score: null, next_date: null,
        },
      ];

      const training: TrainingInput[] = [
        { id: "tr_1", staff_id: "staff_edward", course_name: "Safeguarding L3", category: "safeguarding", status: "compliant", is_mandatory: true, expiry_date: "2027-01-15", completed_date: "2026-01-15" },
        { id: "tr_2", staff_id: "staff_anna", course_name: "First Aid", category: "health_safety", status: "expiring_soon", is_mandatory: true, expiry_date: "2026-06-01", completed_date: "2025-06-01" },
        { id: "tr_3", staff_id: "staff_lackson", course_name: "Fire Safety", category: "health_safety", status: "compliant", is_mandatory: true, expiry_date: "2027-03-01", completed_date: "2026-03-01" },
        { id: "tr_4", staff_id: "staff_diane", course_name: "Team Teach", category: "restraint", status: "expired", is_mandatory: true, expiry_date: "2026-04-01", completed_date: "2025-04-01" },
      ];

      const result = computeSupervisionIntelligence({ staff, supervisions, training, today: TODAY });

      // Overview
      expect(result.overview.total_staff).toBe(4);
      expect(result.overview.supervisions_completed_90d).toBe(3);

      // Edward: next_date 2026-04-19 is 35 days past today → overdue
      const edward = result.staff_profiles.find((p) => p.staff_id === "staff_edward")!;
      expect(edward.compliance_status).toBe("overdue");
      expect(edward.actions_pending).toBe(2);
      expect(edward.actions_overdue).toBe(2); // both past due

      // Anna: next_date 2026-04-23 is 31 days past today → overdue
      const anna = result.staff_profiles.find((p) => p.staff_id === "staff_anna")!;
      expect(anna.compliance_status).toBe("overdue");
      expect(anna.training_status).toBe("expiring");

      // Lackson: next_date 2026-04-25 is 29 days past today → overdue
      const lackson = result.staff_profiles.find((p) => p.staff_id === "staff_lackson")!;
      expect(lackson.compliance_status).toBe("overdue");

      // Diane: no completed supervision → overdue, training expired
      const diane = result.staff_profiles.find((p) => p.staff_id === "staff_diane")!;
      expect(diane.compliance_status).toBe("overdue");
      expect(diane.training_status).toBe("non_compliant");

      // All overdue → critical alerts for each
      expect(result.overview.supervisions_overdue).toBe(4);
      const criticalAlerts = result.alerts.filter((a) => a.severity === "critical");
      expect(criticalAlerts.length).toBe(4);

      // Training: 3/4 mandatory compliant (compliant + expiring_soon)
      expect(result.overview.mandatory_training_compliance).toBe(75);

      // Cara critical insight for overdue supervisions
      expect(result.insights.some((i) => i.severity === "critical")).toBe(true);

      // Wellbeing
      expect(result.wellbeing.avg_score).toBeGreaterThan(0);
      expect(result.wellbeing.staff_below_threshold).toBe(0);
    });
  });
});
