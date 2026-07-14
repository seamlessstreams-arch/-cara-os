import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  computeChild360,
  type Child360Input,
} from "@/lib/engines/child-360-intelligence-engine";
import { getChildTwin } from "@/lib/cpie/get-child-twin";
import { buildCpie360Spine } from "@/lib/cpie/child-360-spine";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const store = getStore();
  const childId = req.nextUrl.searchParams.get("childId");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId query parameter required" }, { status: 400 });
  }

  const child = store.youngPeople.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const incidents = store.incidents
    .filter((i) => i.child_id === childId)
    .map((i) => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      date: i.date.slice(0, 10),
      description: i.description,
      status: i.status,
      outcome: i.outcome,
    }));

  const daily_logs = store.dailyLog
    .filter((l) => l.child_id === childId)
    .map((l) => ({
      date: l.date.slice(0, 10),
      entry_type: l.entry_type,
      mood_score: l.mood_score,
      is_significant: l.is_significant,
      content: l.content,
    }));

  const medications = store.medications
    .filter((m) => m.child_id === childId)
    .map((m) => ({
      name: m.name,
      type: m.type,
      dosage: m.dosage,
      frequency: m.frequency,
      is_active: m.is_active,
      start_date: m.start_date.slice(0, 10),
      end_date: m.end_date?.slice(0, 10) ?? null,
    }));

  const medication_administrations = store.medicationAdministrations
    .filter((a) => a.child_id === childId)
    .map((a) => ({
      scheduled_time: a.scheduled_time,
      status: a.status,
      medication_id: a.medication_id,
    }));

  const missing_episodes = store.missingEpisodes
    .filter((m) => m.child_id === childId)
    .map((m) => ({
      date_missing: m.date_missing.slice(0, 10),
      date_returned: m.date_returned?.slice(0, 10) ?? null,
      duration_hours: m.duration_hours,
      risk_level: m.risk_level,
      return_interview_completed: m.return_interview_completed,
      status: m.status,
    }));

  const risk_assessments = store.riskAssessments
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      domain: r.domain,
      current_level: r.current_level,
      previous_level: r.previous_level,
      trend: r.trend,
      status: r.status,
      assessed_date: r.assessed_date.slice(0, 10),
      review_date: r.review_date.slice(0, 10),
      triggers: r.triggers,
    }));

  // KeyWorkingSession has no theme/status/completed_at — those reads were
  // undefined, so the engine's keywork_sessions_30d was ALWAYS 0 and
  // last_keywork_date always null for every child. A stored session is a
  // session that took place, so it maps to a completed one on its date.
  const keywork_sessions = store.keyWorkingSessions
    .filter((k) => k.child_id === childId)
    .map((k) => ({
      theme: k.topics.join(", ") || k.type,
      status: "completed",
      child_voice: k.child_voice || undefined,
      created_at: k.created_at.slice(0, 10),
      completed_at: k.date.slice(0, 10),
    }));

  const outcome_targets = store.outcomeTargets
    .filter((t) => t.child_id === childId)
    .map((t) => ({
      domain: t.domain,
      target_description: t.target_description,
      baseline_rating: t.baseline_rating,
      current_rating: t.current_rating,
      target_rating: t.target_rating,
      direction: t.direction,
      status: t.status,
      review_date: t.review_date.slice(0, 10),
    }));

  const outcome_reviews = store.outcomeReviews
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      target_id: r.target_id,
      review_date: r.review_date.slice(0, 10),
      previous_rating: r.previous_rating,
      new_rating: r.new_rating,
      direction: r.direction,
      yp_participated: r.yp_participated,
    }));

  const contact_logs = store.familyTimeSessions
    .filter((f) => f.child_id === childId)
    .map((f) => ({
      date: f.date.slice(0, 10),
      contact_type: f.supervision_level === "unsupervised" ? "face_to_face" : "supervised",
      outcome: f.was_it_safe && f.concerns_raised.length === 0 ? "positive" : f.concerns_raised.length > 0 ? "mixed" : "positive",
      yp_voice: f.child_voice_after || null,
    }));

  const education_records = store.educationRecords
    .filter((r) => r.child_id === childId)
    .map((r: any) => ({
      record_type: r.record_type,
      date: r.date.slice(0, 10),
      school: r.school ?? "",
      attendance_status: r.attendance_status ?? "",
      status: r.status ?? "",
    }));

  const care_forms = store.careForms
    .filter((f) => f.linked_child_id === childId)
    .map((f) => ({
      form_type: f.form_type,
      status: f.status,
      next_review: f.due_date?.slice(0, 10) ?? null,
      created_at: f.created_at.slice(0, 10),
    }));

  const behaviour_logs = store.behaviourLog
    .filter((b) => b.child_id === childId)
    .map((b) => ({
      date: b.date.slice(0, 10),
      direction: b.direction,
      intensity: b.intensity,
      antecedent: b.antecedent,
      behaviour: b.behaviour,
      consequence: b.consequence,
    }));

  const appointments = store.appointments
    .filter((a) => a.child_id === childId)
    .map((a) => ({
      date: a.date.slice(0, 10),
      type: a.type,
      provider: a.professional_name,
      status: a.status,
      outcome: a.outcome,
    }));

  // ChronologyEntry records significance/title, not severity/summary — the
  // old reads were undefined for every entry.
  const chronology_entries = store.chronology
    .filter((c) => c.child_id === childId)
    .map((c) => ({
      date: c.date.slice(0, 10),
      category: c.category,
      severity: c.significance,
      summary: c.title,
    }));

  const staffNameMap: Record<string, string> = {};
  for (const s of store.staff) {
    staffNameMap[s.id] = s.full_name || `${s.first_name} ${s.last_name}`;
  }

  const input: Child360Input = {
    today,
    child: {
      id: child.id,
      first_name: child.first_name,
      preferred_name: child.preferred_name,
      date_of_birth: child.date_of_birth.slice(0, 10),
      gender: child.gender,
      ethnicity: child.ethnicity,
      religion: child.religion,
      placement_start: child.placement_start.slice(0, 10),
      placement_end: child.placement_end?.slice(0, 10) ?? null,
      placement_type: child.placement_type,
      legal_status: child.legal_status,
      local_authority: child.local_authority,
      social_worker_name: child.social_worker_name,
      key_worker_id: child.key_worker_id,
      risk_flags: child.risk_flags,
      allergies: child.allergies,
      school_name: child.school_name,
      status: child.status,
    },
    incidents,
    daily_logs,
    medications,
    medication_administrations,
    missing_episodes,
    risk_assessments,
    keywork_sessions,
    outcome_targets,
    outcome_reviews,
    contact_logs,
    education_records,
    care_forms,
    behaviour_logs,
    appointments,
    chronology_entries,
    staff_name_map: staffNameMap,
  };

  const result = computeChild360(input);

  // Consolidation: the whole-child spine comes from the canonical CPIE Digital
  // Twin (the same layer Ask CARA, weekly/monthly summaries and the Reg 44 pack
  // read) — not re-derived here. The 360 analytics below are supporting detail.
  const twin = getChildTwin(childId);
  const cpie = twin ? buildCpie360Spine(twin) : null;

  return NextResponse.json({ data: result, cpie });
}
