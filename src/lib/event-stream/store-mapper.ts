// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STORE → EVENT-PROJECTOR MAPPER
// Single source of truth for projecting the store's domain collections into the
// EventProjectorInput. Used by both the unified event-stream route and the
// stream-native event-intelligence route, so "capture once" feeds both.
// ══════════════════════════════════════════════════════════════════════════════

import type { EventProjectorInput } from "./event-projector";
import { intelligenceDb } from "@/lib/intelligence/store";

const d = (v: unknown, fallback = ""): string => (v == null ? fallback : v.toString().slice(0, 10));

export function mapStoreToEventInput(store: any): EventProjectorInput {
  return {
    homeId: "home_oak",
    incidents: ((store.incidents ?? []) as any[]).map((i: any) => ({
      id: i.id, child_id: i.child_id, reference: i.reference, type: i.type, severity: i.severity,
      date: d(i.date ?? i.created_at), time: i.time, description: i.description, status: i.status,
      requires_oversight: i.requires_oversight, body_map_required: i.body_map_required, body_map_completed: i.body_map_completed,
      outcome: i.outcome, reported_by: i.reported_by, linked_task_ids: i.linked_task_ids, linked_document_ids: i.linked_document_ids,
      home_id: i.home_id, created_at: i.created_at, updated_at: i.updated_at,
    })),
    missingEpisodes: ((store.missingEpisodes ?? []) as any[]).map((m: any) => ({
      id: m.id, child_id: m.child_id, reference: m.reference, date_missing: d(m.date_missing ?? m.created_at), time_missing: m.time_missing,
      date_returned: m.date_returned, risk_level: m.risk_level, reported_to_police: m.reported_to_police, reported_to_la: m.reported_to_la,
      return_interview_completed: m.return_interview_completed, status: m.status, home_id: m.home_id, created_at: m.created_at, created_by: m.created_by,
    })),
    restraints: ((store.restraints ?? []) as any[]).map((r: any) => ({
      id: r.id, child_id: r.child_id, date: d(r.date ?? r.created_at), start_time: r.start_time, restraint_type: r.restraint_type,
      injuries_count: Array.isArray(r.injuries) ? r.injuries.length : 0, child_debriefed: r.child_debriefed, staff_debriefed: r.staff_debriefed,
      linked_incident_id: r.linked_incident_id, recorded_by: r.recorded_by, created_at: r.created_at,
    })),
    medicationErrors: ((store.medicationErrors ?? []) as any[]).map((e: any) => ({
      id: e.id, child_id: e.child_id, date_occurred: d(e.date_occurred ?? e.created_at), time_occurred: e.time_occurred, error_type: e.error_type,
      severity: e.severity, medication: e.medication, duty_of_candour: e.duty_of_candour, duty_of_candour_completed: e.duty_of_candour_completed,
      status: e.status, reported_by: e.reported_by, created_at: e.created_at,
    })),
    dailyLogs: ((store.dailyLog ?? []) as any[]).map((l: any) => ({
      id: l.id, child_id: l.child_id, staff_id: l.staff_id, date: d(l.date ?? l.created_at), time: l.time, entry_type: l.entry_type,
      content: l.content, is_significant: l.is_significant, linked_incident_id: l.linked_incident_id, home_id: l.home_id,
      created_at: l.created_at, updated_at: l.updated_at, created_by: l.created_by,
    })),
    keyworkSessions: ((store.keyWorkingSessions ?? []) as any[]).map((k: any) => ({
      id: k.id, child_id: k.child_id, staff_id: k.staff_id, date: d(k.date ?? k.created_at), type: k.type,
      mood_before: k.mood_before, mood_after: k.mood_after, home_id: k.home_id, created_at: k.created_at,
    })),
    educationRecords: ((store.educationRecords ?? []) as any[]).map((e: any) => ({
      id: e.id, child_id: e.child_id, staff_id: e.staff_id, date: d(e.date ?? e.created_at), record_type: e.record_type,
      attendance_status: e.attendance_status, title: e.title, status: e.status, home_id: e.home_id, created_at: e.created_at,
    })),
    supervisions: ((store.supervisions ?? []) as any[]).map((s: any) => ({
      id: s.id, staff_id: s.staff_id, supervisor_id: s.supervisor_id, type: s.type, scheduled_date: d(s.scheduled_date),
      actual_date: s.actual_date ? d(s.actual_date) : null, status: s.status, home_id: s.home_id, created_at: s.created_at, updated_at: s.updated_at,
    })),
    shifts: ((store.shifts ?? []) as any[]).map((s: any) => ({
      id: s.id, staff_id: s.staff_id, date: d(s.date ?? s.created_at), start_time: s.start_time, shift_type: s.shift_type,
      overtime_minutes: s.overtime_minutes, status: s.status, home_id: s.home_id, created_at: s.created_at,
    })),
    maintenance: ((store.maintenance ?? []) as any[]).map((m: any) => ({
      id: m.id, title: m.title, category: m.category, priority: m.priority, status: m.status, due_date: d(m.due_date), home_id: m.home_id, created_at: m.created_at,
    })),
    audits: ((store.audits ?? []) as any[]).map((a: any) => ({
      id: a.id, title: a.title, category: a.category, date: d(a.date ?? a.created_at), score: a.score, max_score: a.max_score, status: a.status, home_id: a.home_id, created_at: a.created_at,
    })),
    reg44Reports: ((store.reg44VisitReports ?? []) as any[]).map((r: any) => ({
      id: r.id, visit_date: d(r.visit_date), visitor: r.visitor, overall_judgement: r.overall_judgement,
      report_sent_to_ofsted: r.report_sent_to_ofsted, home_id: r.home_id, created_at: r.created_at,
    })),
    appointments: ((store.appointments ?? []) as any[]).map((a: any) => ({
      id: a.id, child_id: a.child_id, date: d(a.date ?? a.created_at), time: a.time, type: a.type, title: a.title,
      status: a.status, outcome: a.outcome, recorded_by: a.recorded_by, home_id: a.home_id, created_at: a.created_at,
    })),
    leaveRequests: ((store.leaveRequests ?? []) as any[]).map((l: any) => ({
      id: l.id, staff_id: l.staff_id, leave_type: l.leave_type, start_date: d(l.start_date), end_date: d(l.end_date),
      total_days: l.total_days, status: l.status, return_to_work_required: l.return_to_work_required, return_to_work_completed: l.return_to_work_completed,
      home_id: l.home_id, created_at: l.created_at,
    })),
    complaints: ((store.complaints ?? []) as any[]).map((c: any) => ({
      id: c.id, child_id: c.child_id, reference: c.reference, category: c.category, stage: c.stage, status: c.status,
      summary: c.summary, date_received: d(c.date_received ?? c.created_at), outcome: c.outcome,
      includes_safeguarding_element: c.includes_safeguarding_element, response_sent_at: c.response_sent_at,
      home_id: c.home_id, created_by: c.created_by, created_at: c.created_at,
    })),
    // Family contact lives in the separate intelligence store (contactLogs), so the
    // spine reads it from there — the assembly layer is the right place to bridge.
    familyContacts: ((intelligenceDb.contactLogs.findAll("home_oak") ?? []) as any[]).map((c: any) => ({
      id: c.id, child_id: c.child_id, contact_type: c.contact_type, date: d(c.date ?? c.created_at), start_time: c.start_time,
      supervision_level: c.supervision_level, outcome: c.outcome, status: c.status, narrative: c.narrative, yp_voice: c.yp_voice,
      yp_mood_after: c.yp_mood_after, concerns_identified: c.concerns_identified, safeguarding_concern: c.safeguarding_concern,
      follow_up_required: c.follow_up_required, supervised_by: c.supervised_by, home_id: c.home_id, created_at: c.created_at,
    })),
    riskAssessments: ((store.riskAssessments ?? []) as any[]).map((r: any) => ({
      id: r.id, child_id: r.child_id, domain: r.domain, current_level: r.current_level, previous_level: r.previous_level,
      trend: r.trend, status: r.status, assessed_by: r.assessed_by, assessed_date: d(r.assessed_date ?? r.created_at),
      review_date: d(r.review_date), home_id: r.home_id, created_at: r.created_at,
    })),
    lacReviews: ((store.lacReviews ?? []) as any[]).map((r: any) => ({
      id: r.id, child_id: r.child_id, date: d(r.date ?? r.created_at), review_type: r.review_type, iro: r.iro,
      child_participation: r.child_participation, outcome: r.outcome, placement_stability: r.placement_stability,
      care_plan_updated: r.care_plan_updated, recorded_by: r.recorded_by, home_id: r.home_id, created_at: r.created_at,
    })),
    notifiableEvents: ((store.notifiableEvents ?? []) as any[]).map((r: any) => ({
      id: r.id, date: d(r.date ?? r.created_at), event_type: r.event_type, child_id: r.child_id, summary: r.summary,
      reported_by: r.reported_by, ofsted_status: r.ofsted_status, home_id: r.home_id, created_at: r.created_at,
    })),
    behaviourSupportPlans: ((store.behaviourSupportPlans ?? []) as any[]).map((r: any) => ({
      id: r.id, child_id: r.child_id, created_date: d(r.created_date ?? r.created_at), created_by: r.created_by,
      review_date: d(r.review_date), last_reviewed: r.last_reviewed ? d(r.last_reviewed) : null, status: r.status,
      primary_behaviours: ((r.primary_behaviours ?? []) as any[]).map((b: any) => ({ severity: b.severity })),
      home_id: r.home_id, created_at: r.created_at,
    })),
  };
}
