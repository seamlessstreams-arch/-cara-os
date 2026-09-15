import { describe, it, expect } from "vitest";
import { _testing, type VolunteerRecord } from "../volunteer-management-service";
import { todayStr } from "@/lib/utils";

const { computeVolunteerMetrics, identifyVolunteerAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<VolunteerRecord>): VolunteerRecord {
  return {
    id: "v-1",
    home_id: "home-1",
    volunteer_name: "Vol A",
    volunteer_role: "mentor",
    volunteer_status: "active",
    dbs_status: "clear",
    training_status: "up_to_date",
    supervision_frequency: "monthly",
    start_date: todayStr(),
    dbs_check_date: "dbs_check_date" in (overrides ?? {}) ? (overrides!.dbs_check_date ?? null) : todayStr(),
    dbs_expiry_date: "dbs_expiry_date" in (overrides ?? {}) ? (overrides!.dbs_expiry_date ?? null) : null,
    safeguarding_trained: true,
    first_aid_trained: true,
    health_safety_trained: true,
    data_protection_trained: true,
    lone_working_allowed: true,
    references_obtained: true,
    interview_completed: true,
    induction_completed: true,
    last_supervision_date: "last_supervision_date" in (overrides ?? {}) ? (overrides!.last_supervision_date ?? null) : null,
    next_supervision_date: "next_supervision_date" in (overrides ?? {}) ? (overrides!.next_supervision_date ?? null) : null,
    hours_this_month: 10,
    children_worked_with: ["Child A"],
    skills_offered: [],
    issues_found: [],
    actions_taken: [],
    managed_by: "Manager A",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("volunteer-management-service", () => {
  // ── computeVolunteerMetrics ─────────────────────────────────────────

  describe("computeVolunteerMetrics", () => {
    describe("empty records", () => {
      it("returns zeros for all fields", () => {
        const m = computeVolunteerMetrics([]);
        expect(m.total_volunteers).toBe(0);
        expect(m.active_count).toBe(0);
        expect(m.pending_count).toBe(0);
        expect(m.suspended_count).toBe(0);
        expect(m.dbs_clear_rate).toBeNull();;
        expect(m.dbs_expired_count).toBe(0);
        expect(m.dbs_pending_count).toBe(0);
        expect(m.training_up_to_date_rate).toBeNull();;
        expect(m.training_overdue_count).toBe(0);
        expect(m.safeguarding_trained_rate).toBeNull();;
        expect(m.first_aid_trained_rate).toBeNull();;
        expect(m.references_obtained_rate).toBeNull();;
        expect(m.induction_completed_rate).toBeNull();;
        expect(m.interview_completed_rate).toBeNull();;
        expect(m.lone_working_count).toBe(0);
        expect(m.total_hours).toBe(0);
        expect(m.average_hours).toBeNull();;
        expect(m.unique_children).toBe(0);
      });

      it("returns empty breakdowns", () => {
        const m = computeVolunteerMetrics([]);
        expect(m.by_volunteer_status).toEqual({});
        expect(m.by_dbs_status).toEqual({});
        expect(m.by_training_status).toEqual({});
        expect(m.by_volunteer_role).toEqual({});
      });
    });

    describe("single record defaults", () => {
      it("returns correct counts", () => {
        const m = computeVolunteerMetrics([makeRecord()]);
        expect(m.total_volunteers).toBe(1);
        expect(m.active_count).toBe(1);
        expect(m.pending_count).toBe(0);
        expect(m.suspended_count).toBe(0);
      });

      it("returns 100% rates for all-true booleans", () => {
        const m = computeVolunteerMetrics([makeRecord()]);
        expect(m.dbs_clear_rate).toBe(100);
        expect(m.training_up_to_date_rate).toBe(100);
        expect(m.safeguarding_trained_rate).toBe(100);
        expect(m.first_aid_trained_rate).toBe(100);
        expect(m.references_obtained_rate).toBe(100);
        expect(m.induction_completed_rate).toBe(100);
        expect(m.interview_completed_rate).toBe(100);
      });

      it("returns correct hours", () => {
        const m = computeVolunteerMetrics([makeRecord()]);
        expect(m.total_hours).toBe(10);
        expect(m.average_hours).toBe(10);
      });

      it("returns correct unique_children", () => {
        const m = computeVolunteerMetrics([makeRecord()]);
        expect(m.unique_children).toBe(1);
      });
    });

    describe("volunteer status counting", () => {
      it("counts active", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_status: "active" })]);
        expect(m.active_count).toBe(1);
      });

      it("counts pending_checks", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_status: "pending_checks" })]);
        expect(m.pending_count).toBe(1);
        expect(m.active_count).toBe(0);
      });

      it("counts suspended", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_status: "suspended" })]);
        expect(m.suspended_count).toBe(1);
      });

      it("counts inactive separately", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_status: "inactive" })]);
        expect(m.active_count).toBe(0);
        expect(m.pending_count).toBe(0);
        expect(m.suspended_count).toBe(0);
      });

      it("counts departed separately", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_status: "departed" })]);
        expect(m.active_count).toBe(0);
      });

      it("builds by_volunteer_status breakdown", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", volunteer_status: "active" }),
          makeRecord({ id: "2", volunteer_status: "active" }),
          makeRecord({ id: "3", volunteer_status: "suspended" }),
        ]);
        expect(m.by_volunteer_status).toEqual({ active: 2, suspended: 1 });
      });

      it("includes all 5 statuses in breakdown when present", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", volunteer_status: "active" }),
          makeRecord({ id: "2", volunteer_status: "pending_checks" }),
          makeRecord({ id: "3", volunteer_status: "suspended" }),
          makeRecord({ id: "4", volunteer_status: "inactive" }),
          makeRecord({ id: "5", volunteer_status: "departed" }),
        ]);
        expect(Object.keys(m.by_volunteer_status)).toHaveLength(5);
      });
    });

    describe("DBS status counting", () => {
      it("counts clear", () => {
        const m = computeVolunteerMetrics([makeRecord({ dbs_status: "clear" })]);
        expect(m.dbs_clear_rate).toBe(100);
        expect(m.dbs_expired_count).toBe(0);
      });

      it("counts expired", () => {
        const m = computeVolunteerMetrics([makeRecord({ dbs_status: "expired" })]);
        expect(m.dbs_expired_count).toBe(1);
        expect(m.dbs_clear_rate).toBe(0);
      });

      it("counts pending", () => {
        const m = computeVolunteerMetrics([makeRecord({ dbs_status: "pending" })]);
        expect(m.dbs_pending_count).toBe(1);
      });

      it("counts barred in breakdown", () => {
        const m = computeVolunteerMetrics([makeRecord({ dbs_status: "barred" })]);
        expect(m.by_dbs_status).toEqual({ barred: 1 });
      });

      it("counts not_submitted in breakdown", () => {
        const m = computeVolunteerMetrics([makeRecord({ dbs_status: "not_submitted" })]);
        expect(m.by_dbs_status).toEqual({ not_submitted: 1 });
      });

      it("calculates dbs_clear_rate with rounding", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", dbs_status: "clear" }),
          makeRecord({ id: "2", dbs_status: "clear" }),
          makeRecord({ id: "3", dbs_status: "expired" }),
        ]);
        expect(m.dbs_clear_rate).toBe(66.7);
      });

      it("calculates dbs_clear_rate at 0 when none clear", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", dbs_status: "pending" }),
          makeRecord({ id: "2", dbs_status: "expired" }),
        ]);
        expect(m.dbs_clear_rate).toBe(0);
      });

      it("builds by_dbs_status breakdown", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", dbs_status: "clear" }),
          makeRecord({ id: "2", dbs_status: "clear" }),
          makeRecord({ id: "3", dbs_status: "pending" }),
        ]);
        expect(m.by_dbs_status).toEqual({ clear: 2, pending: 1 });
      });
    });

    describe("training status counting", () => {
      it("counts up_to_date", () => {
        const m = computeVolunteerMetrics([makeRecord({ training_status: "up_to_date" })]);
        expect(m.training_up_to_date_rate).toBe(100);
      });

      it("counts overdue", () => {
        const m = computeVolunteerMetrics([makeRecord({ training_status: "overdue" })]);
        expect(m.training_overdue_count).toBe(1);
        expect(m.training_up_to_date_rate).toBe(0);
      });

      it("counts due_soon in breakdown", () => {
        const m = computeVolunteerMetrics([makeRecord({ training_status: "due_soon" })]);
        expect(m.by_training_status).toEqual({ due_soon: 1 });
      });

      it("counts not_started in breakdown", () => {
        const m = computeVolunteerMetrics([makeRecord({ training_status: "not_started" })]);
        expect(m.by_training_status).toEqual({ not_started: 1 });
      });

      it("counts exempt in breakdown", () => {
        const m = computeVolunteerMetrics([makeRecord({ training_status: "exempt" })]);
        expect(m.by_training_status).toEqual({ exempt: 1 });
      });

      it("calculates training_up_to_date_rate with rounding", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", training_status: "up_to_date" }),
          makeRecord({ id: "2", training_status: "overdue" }),
          makeRecord({ id: "3", training_status: "up_to_date" }),
        ]);
        expect(m.training_up_to_date_rate).toBe(66.7);
      });

      it("builds by_training_status breakdown", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", training_status: "up_to_date" }),
          makeRecord({ id: "2", training_status: "overdue" }),
          makeRecord({ id: "3", training_status: "due_soon" }),
        ]);
        expect(m.by_training_status).toEqual({ up_to_date: 1, overdue: 1, due_soon: 1 });
      });
    });

    describe("boolean rates", () => {
      it("calculates safeguarding_trained_rate", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", safeguarding_trained: true }),
          makeRecord({ id: "2", safeguarding_trained: false }),
        ]);
        expect(m.safeguarding_trained_rate).toBe(50);
      });

      it("calculates first_aid_trained_rate", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", first_aid_trained: true }),
          makeRecord({ id: "2", first_aid_trained: false }),
          makeRecord({ id: "3", first_aid_trained: false }),
        ]);
        expect(m.first_aid_trained_rate).toBe(33.3);
      });

      it("calculates references_obtained_rate", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", references_obtained: true }),
          makeRecord({ id: "2", references_obtained: true }),
          makeRecord({ id: "3", references_obtained: false }),
        ]);
        expect(m.references_obtained_rate).toBe(66.7);
      });

      it("calculates induction_completed_rate", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", induction_completed: false }),
        ]);
        expect(m.induction_completed_rate).toBe(0);
      });

      it("calculates interview_completed_rate", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", interview_completed: true }),
          makeRecord({ id: "2", interview_completed: true }),
        ]);
        expect(m.interview_completed_rate).toBe(100);
      });

      it("returns 0 rates for empty records", () => {
        const m = computeVolunteerMetrics([]);
        expect(m.safeguarding_trained_rate).toBeNull();;
        expect(m.first_aid_trained_rate).toBeNull();;
      });

      it("calculates lone_working_count", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", lone_working_allowed: true }),
          makeRecord({ id: "2", lone_working_allowed: false }),
          makeRecord({ id: "3", lone_working_allowed: true }),
        ]);
        expect(m.lone_working_count).toBe(2);
      });

      it("handles all booleans false", () => {
        const m = computeVolunteerMetrics([makeRecord({
          safeguarding_trained: false,
          first_aid_trained: false,
          references_obtained: false,
          induction_completed: false,
          interview_completed: false,
          lone_working_allowed: false,
        })]);
        expect(m.safeguarding_trained_rate).toBe(0);
        expect(m.first_aid_trained_rate).toBe(0);
        expect(m.references_obtained_rate).toBe(0);
        expect(m.induction_completed_rate).toBe(0);
        expect(m.interview_completed_rate).toBe(0);
        expect(m.lone_working_count).toBe(0);
      });

      it("rounds rate with 1/6 precision", () => {
        const recs = Array.from({ length: 6 }, (_, i) =>
          makeRecord({ id: `v-${i}`, safeguarding_trained: i === 0 }),
        );
        const m = computeVolunteerMetrics(recs);
        expect(m.safeguarding_trained_rate).toBe(16.7);
      });

      it("rounds rate with 1/7 precision", () => {
        const recs = Array.from({ length: 7 }, (_, i) =>
          makeRecord({ id: `v-${i}`, first_aid_trained: i === 0 }),
        );
        const m = computeVolunteerMetrics(recs);
        expect(m.first_aid_trained_rate).toBe(14.3);
      });
    });

    describe("hours calculation", () => {
      it("sums total_hours", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", hours_this_month: 5 }),
          makeRecord({ id: "2", hours_this_month: 15 }),
          makeRecord({ id: "3", hours_this_month: 10 }),
        ]);
        expect(m.total_hours).toBe(30);
      });

      it("calculates average_hours", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", hours_this_month: 5 }),
          makeRecord({ id: "2", hours_this_month: 15 }),
        ]);
        expect(m.average_hours).toBe(10);
      });

      it("rounds total_hours to 1 decimal", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", hours_this_month: 3.33 }),
          makeRecord({ id: "2", hours_this_month: 3.33 }),
          makeRecord({ id: "3", hours_this_month: 3.33 }),
        ]);
        expect(m.total_hours).toBe(10);
      });

      it("rounds average_hours to 1 decimal", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", hours_this_month: 10 }),
          makeRecord({ id: "2", hours_this_month: 10 }),
          makeRecord({ id: "3", hours_this_month: 10 }),
        ]);
        expect(m.average_hours).toBe(10);
      });

      it("handles zero hours", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", hours_this_month: 0 }),
        ]);
        expect(m.total_hours).toBe(0);
        expect(m.average_hours).toBe(0);
      });

      it("returns 0 average for empty", () => {
        const m = computeVolunteerMetrics([]);
        expect(m.average_hours).toBeNull();;
      });
    });

    describe("unique_children", () => {
      it("counts unique children from flatMap", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", children_worked_with: ["Child A", "Child B"] }),
          makeRecord({ id: "2", children_worked_with: ["Child B", "Child C"] }),
        ]);
        expect(m.unique_children).toBe(3);
      });

      it("handles empty arrays", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", children_worked_with: [] }),
        ]);
        expect(m.unique_children).toBe(0);
      });

      it("deduplicates same children across volunteers", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", children_worked_with: ["Child A"] }),
          makeRecord({ id: "2", children_worked_with: ["Child A"] }),
          makeRecord({ id: "3", children_worked_with: ["Child A"] }),
        ]);
        expect(m.unique_children).toBe(1);
      });

      it("handles mix of empty and populated arrays", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", children_worked_with: ["Child A"] }),
          makeRecord({ id: "2", children_worked_with: [] }),
          makeRecord({ id: "3", children_worked_with: ["Child B"] }),
        ]);
        expect(m.unique_children).toBe(2);
      });
    });

    describe("role breakdown", () => {
      it("counts mentor", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "mentor" })]);
        expect(m.by_volunteer_role).toEqual({ mentor: 1 });
      });

      it("counts tutor", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "tutor" })]);
        expect(m.by_volunteer_role).toEqual({ tutor: 1 });
      });

      it("counts activity_leader", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "activity_leader" })]);
        expect(m.by_volunteer_role).toEqual({ activity_leader: 1 });
      });

      it("counts befriender", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "befriender" })]);
        expect(m.by_volunteer_role).toEqual({ befriender: 1 });
      });

      it("counts advocate", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "advocate" })]);
        expect(m.by_volunteer_role).toEqual({ advocate: 1 });
      });

      it("counts sports_coach", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "sports_coach" })]);
        expect(m.by_volunteer_role).toEqual({ sports_coach: 1 });
      });

      it("counts music_teacher", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "music_teacher" })]);
        expect(m.by_volunteer_role).toEqual({ music_teacher: 1 });
      });

      it("counts general_support", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "general_support" })]);
        expect(m.by_volunteer_role).toEqual({ general_support: 1 });
      });

      it("counts fundraiser", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "fundraiser" })]);
        expect(m.by_volunteer_role).toEqual({ fundraiser: 1 });
      });

      it("counts other role", () => {
        const m = computeVolunteerMetrics([makeRecord({ volunteer_role: "other" })]);
        expect(m.by_volunteer_role).toEqual({ other: 1 });
      });

      it("aggregates multiple roles", () => {
        const m = computeVolunteerMetrics([
          makeRecord({ id: "1", volunteer_role: "mentor" }),
          makeRecord({ id: "2", volunteer_role: "mentor" }),
          makeRecord({ id: "3", volunteer_role: "tutor" }),
        ]);
        expect(m.by_volunteer_role).toEqual({ mentor: 2, tutor: 1 });
      });
    });
  });

  // ── identifyVolunteerAlerts ─────────────────────────────────────────

  describe("identifyVolunteerAlerts", () => {
    describe("no alerts from clean records", () => {
      it("returns empty for clean records", () => {
        const alerts = identifyVolunteerAlerts([makeRecord()]);
        expect(alerts).toEqual([]);
      });

      it("returns empty for empty records", () => {
        const alerts = identifyVolunteerAlerts([]);
        expect(alerts).toEqual([]);
      });

      it("returns empty when all clear and trained", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1" }),
          makeRecord({ id: "2" }),
          makeRecord({ id: "3" }),
        ]);
        expect(alerts).toEqual([]);
      });
    });

    describe("dbs_barred — critical per-record", () => {
      it("generates alert for barred volunteer", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "v-1", dbs_status: "barred", volunteer_name: "John" }),
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("dbs_barred");
        expect(alerts[0].severity).toBe("critical");
        expect(alerts[0].id).toBe("v-1");
        expect(alerts[0].message).toContain("John");
        expect(alerts[0].message).toContain("barred DBS status");
      });

      it("generates separate alerts for each barred volunteer", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "v-1", dbs_status: "barred", volunteer_name: "John" }),
          makeRecord({ id: "v-2", dbs_status: "barred", volunteer_name: "Jane" }),
        ]);
        const barred = alerts.filter((a) => a.type === "dbs_barred");
        expect(barred).toHaveLength(2);
        expect(barred[0].id).toBe("v-1");
        expect(barred[1].id).toBe("v-2");
      });

      it("includes volunteer name in message", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "v-1", dbs_status: "barred", volunteer_name: "Sarah Smith" }),
        ]);
        expect(alerts[0].message).toBe("Volunteer Sarah Smith has a barred DBS status — remove from duties immediately");
      });

      it("does not alert for non-barred statuses", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", dbs_status: "clear" }),
          makeRecord({ id: "2", dbs_status: "pending" }),
          makeRecord({ id: "3", dbs_status: "expired" }),
          makeRecord({ id: "4", dbs_status: "not_submitted" }),
        ]);
        expect(alerts.filter((a) => a.type === "dbs_barred")).toHaveLength(0);
      });
    });

    describe("dbs_expired — high", () => {
      it("generates alert for 1 expired (singular)", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", dbs_status: "expired" }),
        ]);
        const a = alerts.find((x) => x.type === "dbs_expired")!;
        expect(a.severity).toBe("high");
        expect(a.message).toBe("1 volunteer has expired DBS — renew before contact with children");
        expect(a.id).toBe("dbs_expired");
      });

      it("generates alert for 2 expired (plural)", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", dbs_status: "expired" }),
          makeRecord({ id: "2", dbs_status: "expired" }),
        ]);
        const a = alerts.find((x) => x.type === "dbs_expired")!;
        expect(a.message).toBe("2 volunteers have expired DBS — renew before contact with children");
      });

      it("does not alert when no expired", () => {
        const alerts = identifyVolunteerAlerts([makeRecord({ dbs_status: "clear" })]);
        expect(alerts.filter((a) => a.type === "dbs_expired")).toHaveLength(0);
      });

      it("counts only expired not pending", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", dbs_status: "pending" }),
        ]);
        expect(alerts.filter((a) => a.type === "dbs_expired")).toHaveLength(0);
      });
    });

    describe("training_overdue — high", () => {
      it("generates alert for 1 overdue (singular)", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", training_status: "overdue" }),
        ]);
        const a = alerts.find((x) => x.type === "training_overdue")!;
        expect(a.severity).toBe("high");
        expect(a.message).toBe("1 volunteer has overdue training — schedule promptly");
        expect(a.id).toBe("training_overdue");
      });

      it("generates alert for 3 overdue (plural)", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", training_status: "overdue" }),
          makeRecord({ id: "2", training_status: "overdue" }),
          makeRecord({ id: "3", training_status: "overdue" }),
        ]);
        const a = alerts.find((x) => x.type === "training_overdue")!;
        expect(a.message).toBe("3 volunteers have overdue training — schedule promptly");
      });

      it("does not alert for due_soon", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", training_status: "due_soon" }),
        ]);
        expect(alerts.filter((a) => a.type === "training_overdue")).toHaveLength(0);
      });

      it("does not alert for not_started", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", training_status: "not_started" }),
        ]);
        expect(alerts.filter((a) => a.type === "training_overdue")).toHaveLength(0);
      });
    });

    describe("no_safeguarding — high, active only", () => {
      it("generates alert for active volunteer without safeguarding", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", volunteer_status: "active", safeguarding_trained: false }),
        ]);
        const a = alerts.find((x) => x.type === "no_safeguarding")!;
        expect(a.severity).toBe("high");
        expect(a.message).toBe("1 active volunteer without safeguarding training — complete before duties");
        expect(a.id).toBe("no_safeguarding");
      });

      it("uses plural for multiple", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", volunteer_status: "active", safeguarding_trained: false }),
          makeRecord({ id: "2", volunteer_status: "active", safeguarding_trained: false }),
        ]);
        const a = alerts.find((x) => x.type === "no_safeguarding")!;
        expect(a.message).toBe("2 active volunteers without safeguarding training — complete before duties");
      });

      it("excludes inactive volunteers", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", volunteer_status: "inactive", safeguarding_trained: false }),
        ]);
        expect(alerts.filter((a) => a.type === "no_safeguarding")).toHaveLength(0);
      });

      it("excludes departed volunteers", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", volunteer_status: "departed", safeguarding_trained: false }),
        ]);
        expect(alerts.filter((a) => a.type === "no_safeguarding")).toHaveLength(0);
      });

      it("excludes pending_checks volunteers", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", volunteer_status: "pending_checks", safeguarding_trained: false }),
        ]);
        expect(alerts.filter((a) => a.type === "no_safeguarding")).toHaveLength(0);
      });

      it("excludes suspended volunteers", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", volunteer_status: "suspended", safeguarding_trained: false }),
        ]);
        expect(alerts.filter((a) => a.type === "no_safeguarding")).toHaveLength(0);
      });

      it("does not alert when active volunteers have safeguarding", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", volunteer_status: "active", safeguarding_trained: true }),
        ]);
        expect(alerts.filter((a) => a.type === "no_safeguarding")).toHaveLength(0);
      });

      it("only counts active without safeguarding in mixed set", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", volunteer_status: "active", safeguarding_trained: false }),
          makeRecord({ id: "2", volunteer_status: "departed", safeguarding_trained: false }),
          makeRecord({ id: "3", volunteer_status: "active", safeguarding_trained: true }),
        ]);
        const a = alerts.find((x) => x.type === "no_safeguarding")!;
        expect(a.message).toContain("1 active volunteer");
      });
    });

    describe("no_references — medium, >=2 threshold, excludes departed", () => {
      it("does not alert for 1 without references", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", references_obtained: false }),
        ]);
        expect(alerts.filter((a) => a.type === "no_references")).toHaveLength(0);
      });

      it("alerts for 2 without references", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", references_obtained: false }),
          makeRecord({ id: "2", references_obtained: false }),
        ]);
        const a = alerts.find((x) => x.type === "no_references")!;
        expect(a.severity).toBe("medium");
        expect(a.message).toBe("2 volunteers without references obtained — complete safer recruitment checks");
        expect(a.id).toBe("no_references");
      });

      it("alerts for 3 without references", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", references_obtained: false }),
          makeRecord({ id: "2", references_obtained: false }),
          makeRecord({ id: "3", references_obtained: false }),
        ]);
        const a = alerts.find((x) => x.type === "no_references")!;
        expect(a.message).toContain("3 volunteers");
      });

      it("excludes departed from count", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", references_obtained: false, volunteer_status: "departed" }),
          makeRecord({ id: "2", references_obtained: false, volunteer_status: "departed" }),
        ]);
        expect(alerts.filter((a) => a.type === "no_references")).toHaveLength(0);
      });

      it("counts non-departed without references", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", references_obtained: false, volunteer_status: "active" }),
          makeRecord({ id: "2", references_obtained: false, volunteer_status: "departed" }),
          makeRecord({ id: "3", references_obtained: false, volunteer_status: "pending_checks" }),
        ]);
        const a = alerts.find((x) => x.type === "no_references")!;
        expect(a.message).toContain("2 volunteers");
      });

      it("does not count those with references obtained", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", references_obtained: true }),
          makeRecord({ id: "2", references_obtained: false }),
        ]);
        expect(alerts.filter((a) => a.type === "no_references")).toHaveLength(0);
      });
    });

    describe("multiple alert types simultaneously", () => {
      it("generates all alert types together", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", dbs_status: "barred", volunteer_name: "Barred Vol" }),
          makeRecord({ id: "2", dbs_status: "expired" }),
          makeRecord({ id: "3", training_status: "overdue" }),
          makeRecord({ id: "4", volunteer_status: "active", safeguarding_trained: false }),
          makeRecord({ id: "5", references_obtained: false, volunteer_status: "active" }),
          makeRecord({ id: "6", references_obtained: false, volunteer_status: "active" }),
        ]);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("dbs_barred");
        expect(types).toContain("dbs_expired");
        expect(types).toContain("training_overdue");
        expect(types).toContain("no_safeguarding");
        expect(types).toContain("no_references");
      });

      it("critical alerts appear first", () => {
        const alerts = identifyVolunteerAlerts([
          makeRecord({ id: "1", dbs_status: "barred", volunteer_name: "X" }),
          makeRecord({ id: "2", dbs_status: "expired" }),
        ]);
        expect(alerts[0].severity).toBe("critical");
      });
    });
  });
});
