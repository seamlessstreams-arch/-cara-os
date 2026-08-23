// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD IMPACT API ROUTE
// GET /api/v1/child-impact/[childId]
// Returns a ChildImpactView for a specific child — holistic 10-domain impact
// assessment covering risk, care planning, behaviour, education, health,
// relationships, direct work, independence, voice, and safety/stability.
//
// CHR 2015 Reg 5, Reg 6, Reg 7, Reg 9, Reg 13, Reg 14, Reg 16.
// SCCIF: "Progress and experiences of children and young people."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";
import { feedbackTypeFromSentiment } from "@/lib/feedback/sentiment";
import {
  computeChildImpact,
  type RiskAssessmentInput,
  type OutcomeTargetInput,
  type IncidentInput,
  type EducationRecordInput,
  type HealthAssessmentInput,
  type KeyWorkSessionInput,
  type FamilyTimeSessionInput,
  type MissingEpisodeInput,
  type IndependenceSkillInput,
  type YPFeedbackInput,
  type BehaviourEntryInput,
  type LACReviewInput,
  type LessonLearnedInput,
} from "@/lib/impact/child-impact-engine";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const { childId } = await params;
  const [advocacyRecordsList, behaviourLogList, educationRecordsList, familyTimeSessionsList, healthAssessmentsList, incidentsList, independenceSkillsRecordsList, keyWorkingSessionsList, lacReviewsList, lessonsLearnedList, missingEpisodesList, outcomeTargetsList, riskAssessmentsList, youngPeopleList, ypFeedbackList] = await Promise.all([
      dal.advocacyRecords.findAll(),
      dal.behaviourLog.findAll(),
      dal.educationRecords.findAll(),
      dal.familyTimeSessions.findAll(),
      dal.healthAssessments.findAll(),
      dal.incidents.findAll(),
      dal.independenceSkillsRecords.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.lacReviews.findAll(),
      dal.lessonsLearned.findAll(),
      dal.missingEpisodes.findAll(),
      dal.outcomeTargets.findAll(),
      dal.riskAssessments.findAll(),
      dal.youngPeople.findAll(),
      dal.ypFeedback.findAll(),
    ]);
  const today = todayStr();

  // ── Find child ─────────────────────────────────────────────────────────
  const yp = (youngPeopleList ?? []).find(
    (y) => y.id === childId,
  );
  if (!yp) {
    return NextResponse.json(
      { error: "Child not found" },
      { status: 404 },
    );
  }

  // `yp.name` used to be read here through an `as any`. YoungPerson has no
  // such field, so that branch never fired and the concatenation below was
  // always what ran — typing the dal surfaced it. Behaviour is unchanged.
  const childName =
    `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || childId;

  // ── Risk Assessments ───────────────────────────────────────────────────
  const risk_assessments: RiskAssessmentInput[] = (riskAssessmentsList ?? [])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      child_id: r.child_id,
      risk_level: r.risk_level ?? r.level ?? "medium",
      date: typeof r.date === "string" ? r.date.slice(0, 10) : (r.created_at ?? today).slice(0, 10),
      review_date: r.review_date
        ? (typeof r.review_date === "string" ? r.review_date.slice(0, 10) : r.review_date)
        : null,
      controls: Array.isArray(r.controls) ? r.controls :
        Array.isArray(r.control_measures) ? r.control_measures.map((c: any) => c.measure ?? c) :
        [],
      category: r.category ?? "",
      status: r.status ?? "active",
    }));

  // ── Outcome Targets ────────────────────────────────────────────────────
  const outcome_targets: OutcomeTargetInput[] = (outcomeTargetsList ?? [])
    .filter((t: any) => t.child_id === childId)
    .map((t: any) => ({
      id: t.id,
      child_id: t.child_id,
      domain: t.domain ?? "",
      target_description: t.target_description ?? "",
      baseline_rating: t.baseline_rating ?? 1,
      current_rating: t.current_rating ?? 1,
      target_rating: t.target_rating ?? 5,
      direction: t.direction ?? "stable",
      status: t.status ?? "active",
      review_date: typeof t.review_date === "string" ? t.review_date.slice(0, 10) : (t.review_date ?? today),
      set_date: typeof t.set_date === "string" ? t.set_date.slice(0, 10) : (t.set_date ?? today),
      yp_voice: t.yp_voice ?? null,
    }));

  // ── Incidents ──────────────────────────────────────────────────────────
  const incidents: IncidentInput[] = (incidentsList ?? [])
    .filter((i: any) => (i.child_id === childId || i.young_person_id === childId))
    .map((i: any) => ({
      id: i.id,
      child_id: i.child_id ?? i.young_person_id ?? childId,
      young_person_id: i.young_person_id ?? i.child_id ?? childId,
      date: typeof i.date === "string" ? i.date.slice(0, 10) :
        (typeof i.created_at === "string" ? i.created_at.slice(0, 10) : today),
      severity: i.severity ?? "low",
      category: i.category ?? i.type ?? "",
      type: i.type ?? i.category ?? "",
      outcome: i.outcome ?? "",
    }));

  // ── Education Records ──────────────────────────────────────────────────
  const education_records: EducationRecordInput[] = (educationRecordsList ?? [])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      child_id: r.child_id,
      attendance_percentage: r.attendance_percentage ?? r.attendance ?? null,
      engagement_level: r.engagement_level ?? r.engagement ?? null,
      achievement_notes: r.achievement_notes ?? r.achievements ?? null,
      exclusions: r.exclusions ?? 0,
      date: typeof r.date === "string" ? r.date.slice(0, 10) : null,
      term: r.term ?? null,
    }));

  // ── Health Assessments ─────────────────────────────────────────────────
  const health_assessments: HealthAssessmentInput[] = (healthAssessmentsList ?? [])
    .filter((h: any) => h.child_id === childId)
    .map((h: any) => ({
      id: h.id,
      child_id: h.child_id,
      date: typeof h.date === "string" ? h.date.slice(0, 10) : (h.created_at ?? today).slice(0, 10),
      type: h.type ?? h.assessment_type ?? null,
      outcome: h.outcome ?? null,
      next_due: h.next_due ?? h.follow_up_date ?? null,
      attended: h.attended ?? true,
    }));

  // ── Key Work Sessions ──────────────────────────────────────────────────
  const key_work_sessions: KeyWorkSessionInput[] = (keyWorkingSessionsList ?? [])
    .filter((k: any) => k.child_id === childId)
    .map((k: any) => ({
      id: k.id,
      child_id: k.child_id,
      date: typeof k.date === "string" ? k.date.slice(0, 10) : (k.created_at ?? today).slice(0, 10),
      duration_minutes: k.duration_minutes ?? k.duration ?? 45,
      child_engaged: k.child_engaged ??
        (k.mood_after != null && k.mood_before != null ? k.mood_after >= k.mood_before : true),
      child_views_captured: k.child_views_captured ??
        !!(k.child_voice && k.child_voice.trim().length > 0),
      topics: Array.isArray(k.topics) ? k.topics : Array.isArray(k.themes) ? k.themes : [],
      themes: Array.isArray(k.themes) ? k.themes : Array.isArray(k.topics) ? k.topics : [],
      mood_before: k.mood_before ?? null,
      mood_after: k.mood_after ?? null,
    }));

  // ── Family Time Sessions ───────────────────────────────────────────────
  const family_time_sessions: FamilyTimeSessionInput[] = (familyTimeSessionsList ?? [])
    .filter((f: any) => f.child_id === childId)
    .map((f: any) => ({
      id: f.id,
      child_id: f.child_id,
      date: typeof f.date === "string" ? f.date.slice(0, 10) : (f.created_at ?? today).slice(0, 10),
      contact_type: f.contact_type ?? f.type ?? null,
      quality: f.quality ?? null,
      attended: f.attended ?? true,
      notes: f.notes ?? null,
    }));

  // ── Missing Episodes ───────────────────────────────────────────────────
  const missing_episodes: MissingEpisodeInput[] = (missingEpisodesList ?? [])
    .filter((m: any) => m.child_id === childId)
    .map((m: any) => ({
      id: m.id,
      child_id: m.child_id,
      date: typeof m.date === "string" ? m.date.slice(0, 10) :
        (typeof m.reported_at === "string" ? m.reported_at.slice(0, 10) : today),
      duration_hours: m.duration_hours ?? null,
      return_interview_completed: m.return_interview_completed ?? m.rhi_completed ?? false,
    }));

  // ── Independence Skills ────────────────────────────────────────────────
  const skillsRecord = (independenceSkillsRecordsList ?? []).find(
    (r: any) => r.child_id === childId,
  );
  const independence_skills: IndependenceSkillInput | null = skillsRecord
    ? {
        child_id: childId,
        skills: Array.isArray((skillsRecord as any).skills)
          ? (skillsRecord as any).skills.map((s: any) => ({
              name: s.name ?? "",
              proficiency: s.proficiency ?? "not_started",
              category: s.category ?? "",
            }))
          : [],
        strengths: Array.isArray((skillsRecord as any).strengths)
          ? (skillsRecord as any).strengths
          : [],
        areas_for_development: Array.isArray((skillsRecord as any).areas_for_development)
          ? (skillsRecord as any).areas_for_development
          : [],
      }
    : null;

  // ── YP Feedback ────────────────────────────────────────────────────────
  const yp_feedback: YPFeedbackInput[] = (ypFeedbackList ?? [])
    .filter((f: any) => f.child_id === childId)
    .map((f: any) => ({
      id: f.id,
      child_id: f.child_id,
      date: typeof f.date === "string" ? f.date.slice(0, 10) : (f.created_at ?? today).slice(0, 10),
      type: feedbackTypeFromSentiment(f.sentiment),
      category: f.category ?? null,
      sentiment: f.sentiment ?? null,
      response_given_to_child: f.response_given_to_child ?? f.response_given ?? false,
      status: f.status ?? "open",
    }));

  // ── Behaviour Entries ──────────────────────────────────────────────────
  const behaviour_entries: BehaviourEntryInput[] = (behaviourLogList ?? [])
    .filter((b: any) => b.child_id === childId)
    .map((b: any) => ({
      id: b.id,
      child_id: b.child_id,
      date: typeof b.date === "string" ? b.date.slice(0, 10) : (b.created_at ?? today).slice(0, 10),
      type: b.type ?? b.category ?? "",
      severity: b.severity ?? "low",
      category: b.category ?? b.type ?? "",
      regulation_support_given: b.regulation_support_given ?? b.de_escalation_used ?? false,
      outcome: b.outcome ?? "",
    }));

  // ── LAC Reviews ────────────────────────────────────────────────────────
  const lac_reviews: LACReviewInput[] = (lacReviewsList ?? [])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      child_id: r.child_id,
      date: typeof r.date === "string" ? r.date.slice(0, 10) : (r.created_at ?? today).slice(0, 10),
      child_participation: r.child_participation ?? "did_not_participate",
      child_views: r.child_views ?? "",
      outcome: r.outcome ?? "",
    }));

  // ── Lessons Learned ────────────────────────────────────────────────────
  const lessons_learned: LessonLearnedInput[] = (lessonsLearnedList ?? [])
    .filter((l: any) => !l.child_id || l.child_id === childId)
    .map((l: any) => ({
      id: l.id,
      child_id: l.child_id ?? null,
      lesson: l.lesson ?? l.description ?? l.title ?? "",
      date: typeof l.date === "string" ? l.date.slice(0, 10) : (l.created_at ?? today).slice(0, 10),
      category: l.category ?? null,
    }));

  // ── Advocacy Records ───────────────────────────────────────────────────
  const advocacy_records = (advocacyRecordsList ?? [])
    .filter((a: any) => a.child_id === childId)
    .map((a: any) => ({
      id: a.id,
      child_id: a.child_id,
      status: a.status ?? "active",
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildImpact({
    today,
    child_id: childId,
    child_name: childName,
    placement_start: (yp as any).placement_start ?? today,
    risk_assessments,
    outcome_targets,
    incidents,
    education_records,
    health_assessments,
    key_work_sessions,
    family_time_sessions,
    missing_episodes,
    independence_skills,
    yp_feedback,
    behaviour_entries,
    lac_reviews,
    lessons_learned,
    advocacy_records,
  });

  return NextResponse.json({ data: result });
}
