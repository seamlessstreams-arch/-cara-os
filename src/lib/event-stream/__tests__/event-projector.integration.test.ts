// Integration test: projects the REAL demo store into the canonical event stream
// (the same mapping the API route performs), verifying the wiring end-to-end.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildEventStream } from "../event-projector";

const d = (v: unknown, fb = ""): string => (v == null ? fb : v.toString().slice(0, 10));

describe("event-projector integration (real seed data)", () => {
  const store = getStore();

  const result = buildEventStream({
    homeId: "home_oak",
    incidents: (store.incidents as any[]).map((i) => ({
      id: i.id, child_id: i.child_id, reference: i.reference, type: i.type, severity: i.severity,
      date: d(i.date ?? i.created_at), time: i.time, description: i.description, status: i.status,
      requires_oversight: i.requires_oversight, body_map_required: i.body_map_required, body_map_completed: i.body_map_completed,
      outcome: i.outcome, reported_by: i.reported_by, linked_task_ids: i.linked_task_ids, linked_document_ids: i.linked_document_ids,
      home_id: i.home_id, created_at: i.created_at, updated_at: i.updated_at,
    })),
    missingEpisodes: (store.missingEpisodes as any[]).map((m) => ({
      id: m.id, child_id: m.child_id, reference: m.reference, date_missing: d(m.date_missing ?? m.created_at), time_missing: m.time_missing,
      date_returned: m.date_returned, risk_level: m.risk_level, reported_to_police: m.reported_to_police, reported_to_la: m.reported_to_la,
      return_interview_completed: m.return_interview_completed, status: m.status, home_id: m.home_id, created_at: m.created_at, created_by: m.created_by,
    })),
    restraints: (store.restraints as any[]).map((r) => ({
      id: r.id, child_id: r.child_id, date: d(r.date ?? r.created_at), start_time: r.start_time, restraint_type: r.restraint_type,
      injuries_count: Array.isArray(r.injuries) ? r.injuries.length : 0, child_debriefed: r.child_debriefed, recorded_by: r.recorded_by, created_at: r.created_at,
    })),
    medicationErrors: (store.medicationErrors as any[]).map((e) => ({
      id: e.id, child_id: e.child_id, date_occurred: d(e.date_occurred ?? e.created_at), time_occurred: e.time_occurred, error_type: e.error_type,
      severity: e.severity, medication: e.medication, duty_of_candour: e.duty_of_candour, duty_of_candour_completed: e.duty_of_candour_completed,
      status: e.status, reported_by: e.reported_by, created_at: e.created_at,
    })),
    dailyLogs: (store.dailyLog as any[]).map((l) => ({
      id: l.id, child_id: l.child_id, staff_id: l.staff_id, date: d(l.date ?? l.created_at), time: l.time, entry_type: l.entry_type,
      content: l.content, is_significant: l.is_significant, linked_incident_id: l.linked_incident_id, home_id: l.home_id, created_at: l.created_at, updated_at: l.updated_at, created_by: l.created_by,
    })),
    keyworkSessions: (store.keyWorkingSessions as any[]).map((k) => ({
      id: k.id, child_id: k.child_id, staff_id: k.staff_id, date: d(k.date ?? k.created_at), type: k.type, mood_before: k.mood_before, mood_after: k.mood_after, home_id: k.home_id, created_at: k.created_at,
    })),
    educationRecords: (store.educationRecords as any[]).map((e) => ({
      id: e.id, child_id: e.child_id, staff_id: e.staff_id, date: d(e.date ?? e.created_at), record_type: e.record_type, attendance_status: e.attendance_status, title: e.title, status: e.status, home_id: e.home_id, created_at: e.created_at,
    })),
    supervisions: (store.supervisions as any[]).map((s) => ({
      id: s.id, staff_id: s.staff_id, supervisor_id: s.supervisor_id, type: s.type, scheduled_date: d(s.scheduled_date), actual_date: s.actual_date ? d(s.actual_date) : null, status: s.status, home_id: s.home_id, created_at: s.created_at, updated_at: s.updated_at,
    })),
    shifts: (store.shifts as any[]).map((s) => ({
      id: s.id, staff_id: s.staff_id, date: d(s.date ?? s.created_at), start_time: s.start_time, shift_type: s.shift_type, overtime_minutes: s.overtime_minutes, status: s.status, home_id: s.home_id, created_at: s.created_at,
    })),
    maintenance: (store.maintenance as any[]).map((m) => ({
      id: m.id, title: m.title, category: m.category, priority: m.priority, status: m.status, due_date: d(m.due_date), home_id: m.home_id, created_at: m.created_at,
    })),
    audits: (store.audits as any[]).map((a) => ({
      id: a.id, title: a.title, category: a.category, date: d(a.date ?? a.created_at), score: a.score, max_score: a.max_score, status: a.status, home_id: a.home_id, created_at: a.created_at,
    })),
    reg44Reports: (store.reg44VisitReports as any[]).map((r) => ({
      id: r.id, visit_date: d(r.visit_date), visitor: r.visitor, overall_judgement: r.overall_judgement, report_sent_to_ofsted: r.report_sent_to_ofsted, home_id: r.home_id, created_at: r.created_at,
    })),
    appointments: (store.appointments as any[]).map((a) => ({
      id: a.id, child_id: a.child_id, date: d(a.date ?? a.created_at), time: a.time, type: a.type, title: a.title, status: a.status, outcome: a.outcome, recorded_by: a.recorded_by, home_id: a.home_id, created_at: a.created_at,
    })),
    leaveRequests: (store.leaveRequests as any[]).map((l) => ({
      id: l.id, staff_id: l.staff_id, leave_type: l.leave_type, start_date: d(l.start_date), end_date: d(l.end_date), total_days: l.total_days, status: l.status, return_to_work_required: l.return_to_work_required, return_to_work_completed: l.return_to_work_completed, home_id: l.home_id, created_at: l.created_at,
    })),
  });

  it("projects multiple domains into one normalised stream", () => {
    expect(result.events.length).toBeGreaterThan(0);
    const types = new Set(result.events.map((e) => e.eventType));
    // at least incidents + missing + medication should be present from the seed
    expect(types.size).toBeGreaterThanOrEqual(3);
  });

  it("every event has the canonical required fields", () => {
    for (const e of result.events) {
      expect(typeof e.id).toBe("string");
      expect(e.id.length).toBeGreaterThan(0);
      expect(["low", "medium", "high", "critical"]).toContain(e.riskLevel);
      expect(typeof e.occurredAt).toBe("string");
      expect(Array.isArray(e.structuredTags)).toBe(true);
      expect(e.audit).toBeTruthy();
      expect(typeof e.audit.version).toBe("number");
    }
  });

  it("derives a meaningful overview with pending approvals and compliance flags", () => {
    expect(result.overview.total).toBe(result.events.length);
    expect(result.overview.pending_approvals).toBeGreaterThan(0);
    expect(result.overview.compliance_flags).toBeGreaterThan(0);
  });

  it("returns events newest-first", () => {
    for (let i = 1; i < result.events.length; i++) {
      expect(result.events[i - 1].occurredAt >= result.events[i].occurredAt).toBe(true);
    }
  });
});
