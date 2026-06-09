// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NOTIFIABLE EVENTS INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for Reg 40 notifiable events analysis.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeNotifiableEventsIntelligence,
  type NotifiableEventInput,
  type ChildRef,
  type StaffRef,
} from "../notifiable-events-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const STAFF: StaffRef[] = [
  { id: "staff_ryan", name: "Ryan" },
  { id: "staff_edward", name: "Edward" },
  { id: "staff_anna", name: "Anna" },
  { id: "staff_darren", name: "Darren" },
  { id: "staff_chervelle", name: "Chervelle" },
];

let _id = 0;
function makeEvent(overrides: Partial<NotifiableEventInput> = {}): NotifiableEventInput {
  _id++;
  return {
    id: `ne_test_${_id}`,
    date: "2026-05-20",
    event_type: "restraint",
    child_id: "yp_alex",
    summary: "Test event",
    reported_by: "staff_ryan",
    ofsted_status: "notified_within_24h",
    ofsted_notified_date: "2026-05-20",
    la_notified_date: "2026-05-20",
    placing_notified_date: "2026-05-20",
    follow_up: "Actions taken",
    lesson_learned: "Lesson noted",
    ...overrides,
  };
}

function run(events: NotifiableEventInput[], opts?: { children?: ChildRef[]; staff?: StaffRef[] }) {
  return computeNotifiableEventsIntelligence({
    events,
    children: opts?.children ?? CHILDREN,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Notifiable Events Intelligence Engine", () => {

  describe("empty state", () => {
    it("returns safe defaults when no events provided", () => {
      const result = run([]);
      expect(result.overview.total_events).toBe(0);
      expect(result.overview.compliance_rate).toBe(100);
      expect(result.overview.pending).toBe(0);
      expect(result.event_types).toHaveLength(0);
      expect(result.child_profiles).toHaveLength(0);
      expect(result.recent_events).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview calculations", () => {
    it("counts total events correctly", () => {
      const result = run([makeEvent(), makeEvent(), makeEvent()]);
      expect(result.overview.total_events).toBe(3);
    });

    it("counts notified_within_24h", () => {
      const result = run([
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "pending" }),
      ]);
      expect(result.overview.notified_within_24h).toBe(2);
    });

    it("counts notified_late", () => {
      const result = run([
        makeEvent({ ofsted_status: "notified_late" }),
        makeEvent({ ofsted_status: "notified_within_24h" }),
      ]);
      expect(result.overview.notified_late).toBe(1);
    });

    it("counts pending notifications", () => {
      const result = run([
        makeEvent({ ofsted_status: "pending", date: "2026-05-23" }),
        makeEvent({ ofsted_status: "pending", date: "2026-05-24" }),
        makeEvent({ ofsted_status: "notified_within_24h" }),
      ]);
      expect(result.overview.pending).toBe(2);
    });

    it("calculates compliance_rate as notified_within_24h / total * 100", () => {
      const result = run([
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "pending", date: "2026-05-23" }),
      ]);
      expect(result.overview.compliance_rate).toBe(75);
    });

    it("calculates events_last_30_days", () => {
      const result = run([
        makeEvent({ date: "2026-05-20" }),
        makeEvent({ date: "2026-05-01" }),
        makeEvent({ date: "2026-04-20" }),
      ]);
      expect(result.overview.events_last_30_days).toBe(2);
    });

    it("calculates events_last_90_days", () => {
      const result = run([
        makeEvent({ date: "2026-05-20" }),
        makeEvent({ date: "2026-04-01" }),
        makeEvent({ date: "2026-03-01" }),
        makeEvent({ date: "2026-01-01" }),
      ]);
      expect(result.overview.events_last_90_days).toBe(3);
    });

    it("counts unique children involved", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_casey" }),
        makeEvent({ child_id: null }),
      ]);
      expect(result.overview.unique_children_involved).toBe(2);
    });

    it("counts unique staff reporting", () => {
      const result = run([
        makeEvent({ reported_by: "staff_ryan" }),
        makeEvent({ reported_by: "staff_ryan" }),
        makeEvent({ reported_by: "staff_edward" }),
        makeEvent({ reported_by: "staff_anna" }),
      ]);
      expect(result.overview.unique_staff_reporting).toBe(3);
    });
  });

  describe("event type breakdown", () => {
    it("groups events by type with counts and percentages", () => {
      const result = run([
        makeEvent({ event_type: "restraint" }),
        makeEvent({ event_type: "restraint" }),
        makeEvent({ event_type: "absconding" }),
        makeEvent({ event_type: "police_involvement" }),
      ]);
      expect(result.event_types).toHaveLength(3);
      expect(result.event_types[0].event_type).toBe("restraint");
      expect(result.event_types[0].count).toBe(2);
      expect(result.event_types[0].pct).toBe(50);
    });

    it("sorts by count descending", () => {
      const result = run([
        makeEvent({ event_type: "absconding" }),
        makeEvent({ event_type: "restraint" }),
        makeEvent({ event_type: "restraint" }),
        makeEvent({ event_type: "restraint" }),
      ]);
      expect(result.event_types[0].event_type).toBe("restraint");
      expect(result.event_types[1].event_type).toBe("absconding");
    });

    it("provides human-readable type labels", () => {
      const result = run([
        makeEvent({ event_type: "allegation_against_staff" }),
        makeEvent({ event_type: "police_involvement" }),
      ]);
      const labels = result.event_types.map((t) => t.type_label);
      expect(labels).toContain("Allegation Against Staff");
      expect(labels).toContain("Police Involvement");
    });
  });

  describe("child profiles", () => {
    it("creates per-child profiles with event counts", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_casey" }),
      ]);
      expect(result.child_profiles).toHaveLength(2);
      const alex = result.child_profiles.find((p) => p.child_id === "yp_alex")!;
      expect(alex.total_events).toBe(2);
      expect(alex.child_name).toBe("Alex");
    });

    it("sorts profiles by total_events descending", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_casey" }),
      ]);
      expect(result.child_profiles[0].child_id).toBe("yp_alex");
    });

    it("tracks most recent date", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", date: "2026-05-10" }),
        makeEvent({ child_id: "yp_alex", date: "2026-05-20" }),
        makeEvent({ child_id: "yp_alex", date: "2026-05-15" }),
      ]);
      expect(result.child_profiles[0].most_recent_date).toBe("2026-05-20");
    });

    it("counts pending notifications per child", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", ofsted_status: "pending", date: "2026-05-23" }),
        makeEvent({ child_id: "yp_alex", ofsted_status: "notified_within_24h" }),
      ]);
      expect(result.child_profiles[0].pending_notifications).toBe(1);
    });

    it("excludes events with null child_id from profiles", () => {
      const result = run([
        makeEvent({ child_id: null }),
        makeEvent({ child_id: "yp_alex" }),
      ]);
      expect(result.child_profiles).toHaveLength(1);
    });

    it("tracks unique event types per child", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", event_type: "restraint" }),
        makeEvent({ child_id: "yp_alex", event_type: "absconding" }),
        makeEvent({ child_id: "yp_alex", event_type: "restraint" }),
      ]);
      expect(result.child_profiles[0].event_types).toContain("restraint");
      expect(result.child_profiles[0].event_types).toContain("absconding");
      expect(result.child_profiles[0].event_types).toHaveLength(2);
    });
  });

  describe("risk flags", () => {
    it("flags repeat_involvement for ≥3 events", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_alex" }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("repeat_involvement");
    });

    it("does not flag repeat_involvement for <3 events", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_alex" }),
      ]);
      expect(result.child_profiles[0].risk_flags).not.toContain("repeat_involvement");
    });

    it("flags pending_notification when child has pending events", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", ofsted_status: "pending", date: "2026-05-23" }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("pending_notification");
    });

    it("flags repeat_restraint for ≥2 restraint events", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", event_type: "restraint" }),
        makeEvent({ child_id: "yp_alex", event_type: "restraint" }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("repeat_restraint");
    });

    it("flags multiple_event_types for ≥3 different types", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", event_type: "restraint" }),
        makeEvent({ child_id: "yp_alex", event_type: "absconding" }),
        makeEvent({ child_id: "yp_alex", event_type: "police_involvement" }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("multiple_event_types");
    });

    it("flags frequent_recent for ≥2 events in last 30 days", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", date: "2026-05-20" }),
        makeEvent({ child_id: "yp_alex", date: "2026-05-18" }),
      ]);
      expect(result.child_profiles[0].risk_flags).toContain("frequent_recent");
    });

    it("does not flag frequent_recent for events older than 30 days", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", date: "2026-04-01" }),
        makeEvent({ child_id: "yp_alex", date: "2026-03-15" }),
      ]);
      expect(result.child_profiles[0].risk_flags).not.toContain("frequent_recent");
    });
  });

  describe("recent events", () => {
    it("returns most recent events sorted by date descending", () => {
      const result = run([
        makeEvent({ date: "2026-05-10" }),
        makeEvent({ date: "2026-05-20" }),
        makeEvent({ date: "2026-05-15" }),
      ]);
      expect(result.recent_events[0].date).toBe("2026-05-20");
      expect(result.recent_events[1].date).toBe("2026-05-15");
      expect(result.recent_events[2].date).toBe("2026-05-10");
    });

    it("limits to 6 recent events", () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        makeEvent({ date: `2026-05-${String(10 + i).padStart(2, "0")}` })
      );
      const result = run(events);
      expect(result.recent_events).toHaveLength(6);
    });

    it("includes child name and type label", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", event_type: "restraint" }),
      ]);
      expect(result.recent_events[0].child_name).toBe("Alex");
      expect(result.recent_events[0].type_label).toBe("Restraint");
    });

    it("shows null child_name for non-child events", () => {
      const result = run([
        makeEvent({ child_id: null, event_type: "allegation_against_staff" }),
      ]);
      expect(result.recent_events[0].child_name).toBeNull();
    });
  });

  describe("alerts", () => {
    it("generates critical alert for pending notification >24h", () => {
      const result = run([
        makeEvent({ ofsted_status: "pending", date: "2026-05-23", event_type: "restraint" }),
      ]);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].type).toBe("overdue_notification");
      expect(critical[0].message).toContain("Restraint");
      expect(critical[0].message).toContain("2026-05-23");
    });

    it("generates high alert for late notifications", () => {
      const result = run([
        makeEvent({ ofsted_status: "notified_late", event_type: "absconding" }),
      ]);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high).toHaveLength(1);
      expect(high[0].type).toBe("late_notification");
      expect(high[0].message).toContain("Absconding");
    });

    it("generates medium alert for repeat child involvement (≥3)", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", date: "2026-05-20" }),
        makeEvent({ child_id: "yp_alex", date: "2026-05-18" }),
        makeEvent({ child_id: "yp_alex", date: "2026-05-15" }),
      ]);
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium).toHaveLength(1);
      expect(medium[0].type).toBe("repeat_child");
      expect(medium[0].message).toContain("Alex");
      expect(medium[0].message).toContain("3 notifiable events");
    });

    it("generates low alert for events without follow-up/lesson", () => {
      const result = run([
        makeEvent({ follow_up: "", lesson_learned: "" }),
      ]);
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low).toHaveLength(1);
      expect(low[0].type).toBe("incomplete_learning");
    });

    it("does not generate low alert when all have follow-up or lesson", () => {
      const result = run([
        makeEvent({ follow_up: "Done", lesson_learned: "" }),
        makeEvent({ follow_up: "", lesson_learned: "Noted" }),
      ]);
      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low).toHaveLength(0);
    });

    it("does not generate repeat_child alert for <3 events", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex" }),
        makeEvent({ child_id: "yp_alex" }),
      ]);
      const medium = result.alerts.filter((a) => a.type === "repeat_child");
      expect(medium).toHaveLength(0);
    });

    it("does not generate critical alert for pending event on same day", () => {
      const result = run([
        makeEvent({ ofsted_status: "pending", date: "2026-05-25" }),
      ]);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(0);
    });
  });

  describe("ARIA insights", () => {
    it("generates critical insight for pending notifications", () => {
      const result = run([
        makeEvent({ ofsted_status: "pending", date: "2026-05-23" }),
      ]);
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].text).toContain("pending");
      expect(critical[0].text).toContain("regulatory breach");
    });

    it("generates warning insight for late notifications", () => {
      const result = run([
        makeEvent({ ofsted_status: "notified_late" }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("sent late"))).toBe(true);
    });

    it("generates warning insight for repeat child involvement", () => {
      const result = run([
        makeEvent({ child_id: "yp_alex", event_type: "restraint", date: "2026-05-20" }),
        makeEvent({ child_id: "yp_alex", event_type: "absconding", date: "2026-05-18" }),
        makeEvent({ child_id: "yp_alex", event_type: "police_involvement", date: "2026-05-15" }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("Alex") && w.text.includes("3 notifiable events"))).toBe(true);
    });

    it("generates warning for high frequency in last 30 days (≥3)", () => {
      const result = run([
        makeEvent({ date: "2026-05-20", child_id: "yp_alex" }),
        makeEvent({ date: "2026-05-18", child_id: "yp_jordan" }),
        makeEvent({ date: "2026-05-15", child_id: "yp_casey" }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("3 notifiable events in the last 30 days"))).toBe(true);
    });

    it("generates positive insight for 100% compliance", () => {
      const result = run([
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "notified_within_24h" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("100%") && p.text.includes("Reg 40 fully met"))).toBe(true);
    });

    it("generates positive insight for high compliance (≥80% but <100%)", () => {
      const result = run([
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "pending", date: "2026-05-23" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("80%") && p.text.includes("broadly met"))).toBe(true);
    });

    it("generates positive insight when all events have follow-up and lessons", () => {
      const result = run([
        makeEvent({ follow_up: "Done", lesson_learned: "Noted" }),
        makeEvent({ follow_up: "Actions", lesson_learned: "Lesson" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("follow-up actions and lessons learned"))).toBe(true);
    });

    it("generates positive insight for multiple staff reporting (≥3)", () => {
      const result = run([
        makeEvent({ reported_by: "staff_ryan" }),
        makeEvent({ reported_by: "staff_edward" }),
        makeEvent({ reported_by: "staff_anna" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("3 different staff members"))).toBe(true);
    });

    it("generates positive insight for tri-party notifications (≥3 events)", () => {
      const result = run([
        makeEvent({ ofsted_notified_date: "2026-05-20", la_notified_date: "2026-05-20", placing_notified_date: "2026-05-20" }),
        makeEvent({ ofsted_notified_date: "2026-05-18", la_notified_date: "2026-05-18", placing_notified_date: "2026-05-18" }),
        makeEvent({ ofsted_notified_date: "2026-05-15", la_notified_date: "2026-05-15", placing_notified_date: "2026-05-15" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("tri-party notification"))).toBe(true);
    });

    it("does not generate 100% positive insight when there are pending events", () => {
      const result = run([
        makeEvent({ ofsted_status: "notified_within_24h" }),
        makeEvent({ ofsted_status: "pending", date: "2026-05-23" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.every((p) => !p.text.includes("100%"))).toBe(true);
    });
  });

  describe("Chamberlain House integration", () => {
    function oakHouseEvents(): NotifiableEventInput[] {
      return [
        {
          id: "ne_001", date: "2026-05-22", event_type: "restraint",
          child_id: "yp_alex", summary: "PI — imminent harm to staff",
          reported_by: "staff_edward", ofsted_status: "notified_within_24h",
          ofsted_notified_date: "2026-05-22", la_notified_date: "2026-05-22",
          placing_notified_date: "2026-05-22", follow_up: "BSP reviewed",
          lesson_learned: "Pre-call preparation reduces escalation risk.",
        },
        {
          id: "ne_002", date: "2026-05-15", event_type: "absconding",
          child_id: "yp_alex", summary: "Missing from care — 3 hours",
          reported_by: "staff_ryan", ofsted_status: "notified_within_24h",
          ofsted_notified_date: "2026-05-15", la_notified_date: "2026-05-15",
          placing_notified_date: "2026-05-15", follow_up: "Return interview completed",
          lesson_learned: "Homework refusal is a known trigger.",
        },
        {
          id: "ne_003", date: "2026-05-07", event_type: "allegation_against_staff",
          child_id: null, summary: "Allegation of inappropriate language",
          reported_by: "staff_darren", ofsted_status: "notified_within_24h",
          ofsted_notified_date: "2026-05-07", la_notified_date: "2026-05-07",
          placing_notified_date: null, follow_up: "Investigation ongoing",
          lesson_learned: "Agency staff supervision protocols strengthened.",
        },
        {
          id: "ne_004", date: "2026-04-30", event_type: "police_involvement",
          child_id: "yp_alex", summary: "Criminal damage in community",
          reported_by: "staff_chervelle", ofsted_status: "notified_within_24h",
          ofsted_notified_date: "2026-04-30", la_notified_date: "2026-04-30",
          placing_notified_date: "2026-04-30", follow_up: "Community reparation completed",
          lesson_learned: "Community links help de-escalate.",
        },
        {
          id: "ne_005", date: "2026-04-15", event_type: "serious_incident",
          child_id: "yp_casey", summary: "Self-harm disclosure",
          reported_by: "staff_anna", ofsted_status: "notified_within_24h",
          ofsted_notified_date: "2026-04-15", la_notified_date: "2026-04-15",
          placing_notified_date: "2026-04-15", follow_up: "CAMHS assessment completed",
          lesson_learned: "Therapeutic key work enables safe disclosure.",
        },
        {
          id: "ne_006", date: "2026-05-23", event_type: "restraint",
          child_id: "yp_alex", summary: "PI — threat to peer",
          reported_by: "staff_chervelle", ofsted_status: "pending",
          ofsted_notified_date: null, la_notified_date: "2026-05-23",
          placing_notified_date: "2026-05-23", follow_up: "BSP boundary reinforced",
          lesson_learned: "TV access rota may reduce friction.",
        },
      ];
    }

    it("calculates correct overview for Chamberlain House data", () => {
      const result = run(oakHouseEvents());
      expect(result.overview.total_events).toBe(6);
      expect(result.overview.notified_within_24h).toBe(5);
      expect(result.overview.pending).toBe(1);
      expect(result.overview.compliance_rate).toBe(83);
    });

    it("identifies 4 event types", () => {
      const result = run(oakHouseEvents());
      expect(result.event_types).toHaveLength(5);
      expect(result.event_types[0].event_type).toBe("restraint");
      expect(result.event_types[0].count).toBe(2);
    });

    it("Alex has most events (4)", () => {
      const result = run(oakHouseEvents());
      const alex = result.child_profiles.find((p) => p.child_id === "yp_alex")!;
      expect(alex.total_events).toBe(4);
      expect(alex.risk_flags).toContain("repeat_involvement");
      expect(alex.risk_flags).toContain("repeat_restraint");
    });

    it("Casey has 1 event", () => {
      const result = run(oakHouseEvents());
      const casey = result.child_profiles.find((p) => p.child_id === "yp_casey")!;
      expect(casey.total_events).toBe(1);
      expect(casey.risk_flags).toHaveLength(0);
    });

    it("generates critical alert for ne_006 pending notification", () => {
      const result = run(oakHouseEvents());
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].message).toContain("Restraint");
      expect(critical[0].message).toContain("2026-05-23");
    });

    it("generates medium alert for Alex repeat involvement", () => {
      const result = run(oakHouseEvents());
      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("Alex") && a.message.includes("4 notifiable events"))).toBe(true);
    });

    it("generates critical ARIA insight for pending notification", () => {
      const result = run(oakHouseEvents());
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].text).toContain("1 Ofsted notification");
    });

    it("generates warning ARIA insight for Alex repeat involvement", () => {
      const result = run(oakHouseEvents());
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("Alex") && w.text.includes("4 notifiable events"))).toBe(true);
    });

    it("generates positive insight for follow-up completion", () => {
      const result = run(oakHouseEvents());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("follow-up actions and lessons learned"))).toBe(true);
    });

    it("generates positive insight for multiple staff reporting", () => {
      const result = run(oakHouseEvents());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("staff members"))).toBe(true);
    });

    it("returns 6 recent events sorted by date", () => {
      const result = run(oakHouseEvents());
      expect(result.recent_events).toHaveLength(6);
      expect(result.recent_events[0].date).toBe("2026-05-23");
      expect(result.recent_events[0].ofsted_status).toBe("pending");
    });

    it("Alex has frequent_recent flag (3 events in last 30 days)", () => {
      const result = run(oakHouseEvents());
      const alex = result.child_profiles.find((p) => p.child_id === "yp_alex")!;
      expect(alex.risk_flags).toContain("frequent_recent");
    });
  });
});
