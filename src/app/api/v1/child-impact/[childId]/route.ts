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

// The store holds BOTH vocabularies for behaviour intensity at runtime — low,
// medium, moderate, high, severe, critical — even though `BehaviourIntensity`
// admits only four of them. Seeded rows assert themselves in with a blanket
// `as BehaviourEntry[]`, which is why the divergence has never surfaced. Read
// as a plain string here so the compiler does not insist the other spellings
// are impossible, and normalised onto the vocabulary the type declares.
function normaliseIntensity(intensity: string): string {
  return intensity === "severe" ? "critical" : intensity === "medium" ? "moderate" : intensity;
}

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
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      id: r.id,
      child_id: r.child_id,
      // `risk_level`, `controls`/`control_measures` and `category` are not on
      // RiskAssessment, so this used to send the engine a constant "medium",
      // an always-empty controls list and an empty category for every
      // assessment. The record calls them current_level, mitigations and
      // domain.
      risk_level: r.current_level,
      date: r.assessed_date.slice(0, 10),
      review_date: r.review_date ? r.review_date.slice(0, 10) : null,
      controls: r.mitigations.map((m) => m.strategy),
      category: r.domain,
      status: r.status,
    }));

  // ── Outcome Targets ────────────────────────────────────────────────────
  const outcome_targets: OutcomeTargetInput[] = (outcomeTargetsList ?? [])
    .filter((t) => t.child_id === childId)
    .map((t) => ({
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
    .filter((i) => i.child_id === childId)
    .map((i) => ({
      id: i.id,
      child_id: i.child_id,
      young_person_id: i.child_id,
      date: i.date.slice(0, 10),
      severity: i.severity,
      category: i.type,
      type: i.type,
      outcome: i.outcome ?? "",
    }));

  // ── Education Records ──────────────────────────────────────────────────
  const education_records: EducationRecordInput[] = (educationRecordsList ?? [])
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      id: r.id,
      child_id: r.child_id,
      // EducationRecord has none of attendance_percentage, engagement_level,
      // achievement_notes, exclusions or term. Every one of those read as its
      // fallback, so the whole education picture was null / null / null / 0.
      //
      // Two of them the record CAN answer, through record_type:
      achievement_notes: r.record_type === "achievement" ? r.details : undefined,
      exclusions: r.record_type === "exclusion" || r.record_type === "suspension" ? 1 : 0,
      date: r.date.slice(0, 10),
      // The other three it cannot. Attendance is modelled per event as
      // `attendance_status` (present / absent_authorised / late / …), not as a
      // percentage, and there is no engagement grade or term on the record —
      // deriving either would mean inventing a scale. The engine's fields are
      // optional and it filters `attendance_percentage != null` before
      // averaging, so omitting them leaves the domain unmeasured rather than
      // scored at zero.
    }));

  // ── Health Assessments ─────────────────────────────────────────────────
  const health_assessments: HealthAssessmentInput[] = (healthAssessmentsList ?? [])
    .filter((h) => h.child_id === childId)
    .map((h) => ({
      id: h.id,
      child_id: h.child_id,
      date: h.date.slice(0, 10),
      type: h.type,
      // `outcome` and `attended` are not on HealthAssessment — outcome always
      // read null and attended always read TRUE, so no health assessment had
      // ever been missed. The record carries key_findings, and a status that
      // says whether it happened.
      outcome: h.key_findings.length > 0 ? h.key_findings.join("; ") : undefined,
      next_due: h.next_due ?? undefined,
      attended:
        h.status === "completed" ? true : h.status === "overdue" ? false : undefined,
    }));

  // ── Key Work Sessions ──────────────────────────────────────────────────
  const key_work_sessions: KeyWorkSessionInput[] = (keyWorkingSessionsList ?? [])
    .filter((k) => k.child_id === childId)
    .map((k) => ({
      id: k.id,
      child_id: k.child_id,
      date: k.date.slice(0, 10),
      // duration_minutes / child_engaged / child_views_captured / themes are
      // not on KeyWorkingSession, but each already had a live operand after it,
      // so the values were right and only the reads were dead.
      duration_minutes: k.duration,
      child_engaged:
        k.mood_after != null && k.mood_before != null ? k.mood_after >= k.mood_before : true,
      child_views_captured: !!(k.child_voice && k.child_voice.trim().length > 0),
      topics: k.topics,
      themes: k.topics,
      mood_before: k.mood_before ?? null,
      mood_after: k.mood_after ?? null,
    }));

  // ── Family Time Sessions ───────────────────────────────────────────────
  const family_time_sessions: FamilyTimeSessionInput[] = (familyTimeSessionsList ?? [])
    .filter((f) => f.child_id === childId)
    .map((f) => ({
      id: f.id,
      child_id: f.child_id,
      date: f.date.slice(0, 10),
      // FamilyTimeSession has no contact_type, quality, attended or notes.
      // What it does have is a written observation, so that is what goes.
      notes: f.interactions_observed || undefined,
      // `quality` is left out rather than guessed: the engine looks for
      // "good" / "excellent" / "positive", and the record's nearest fields
      // (warmth_affection_shown, parent_engagement) are free text, so any
      // mapping would be a grade this home never awarded.
      //
      // `attended` is left out too. It used to read TRUE for every session;
      // the record has no attendance field at all, and the engine reads an
      // absent value as attended — which is the right default for a session
      // that was written up, without asserting it.
    }));

  // ── Missing Episodes ───────────────────────────────────────────────────
  const missing_episodes: MissingEpisodeInput[] = (missingEpisodesList ?? [])
    .filter((m) => m.child_id === childId)
    .map((m) => ({
      id: m.id,
      child_id: m.child_id,
      // Neither `date` nor `reported_at` is on MissingEpisode, so this fell
      // through to `today` — every missing episode appeared on the child's
      // timeline as having happened today, which makes any recency or trend
      // reading of them meaningless. The record calls it date_missing.
      date: m.date_missing.slice(0, 10),
      duration_hours: m.duration_hours ?? undefined,
      return_interview_completed: m.return_interview_completed,
    }));

  // ── Independence Skills ────────────────────────────────────────────────
  const skillsRecord = (independenceSkillsRecordsList ?? []).find(
    (r) => r.child_id === childId,
  );
  const independence_skills: IndependenceSkillInput | null = skillsRecord
    ? {
        child_id: childId,
        // Was read through three `skillsRecord as any` casts. The record's
        // shape already matches what the engine asks for, so the casts were
        // buying nothing except the loss of checking.
        skills: skillsRecord.skills.map((sk) => ({
          name: sk.name,
          proficiency: sk.proficiency,
          category: sk.category,
        })),
        strengths: skillsRecord.strengths,
        areas_for_development: skillsRecord.areas_for_development,
      }
    : null;

  // ── YP Feedback ────────────────────────────────────────────────────────
  const yp_feedback: YPFeedbackInput[] = (ypFeedbackList ?? [])
    .filter((f) => f.child_id === childId)
    .map((f) => ({
      id: f.id,
      child_id: f.child_id,
      date: f.date.slice(0, 10),
      type: feedbackTypeFromSentiment(f.sentiment),
      category: f.category,
      sentiment: f.sentiment,
      response_given_to_child: f.response_given_to_child,
      // YPFeedbackEntry has no `status`, so every entry read as open — even
      // the ones the child had already had answered. Same derivation as
      // child-voice-participation now uses.
      status: f.response_given_to_child ? "resolved" : "open",
    }));

  // ── Behaviour Entries ──────────────────────────────────────────────────
  const behaviour_entries: BehaviourEntryInput[] = (behaviourLogList ?? [])
    .filter((b) => b.child_id === childId)
    .map((b) => ({
      id: b.id,
      child_id: b.child_id,
      date: b.date.slice(0, 10),
      // None of type, category, severity or regulation_support_given is on
      // BehaviourEntry, so every entry reached the engine as severity "low",
      // no type, no category and no regulation support — including the one
      // recorded as a self-harm attempt. The record calls them direction,
      // intensity and strategy_used.
      //
      // Both spellings of both scales are live in the store: direction holds
      // "concern" and "concerning", intensity holds all six of low, medium,
      // moderate, high, severe, critical. Normalised onto the vocabulary
      // extended.ts declares, by testing the value that has only one spelling
      // — the other way round files a "concerning" row as positive.
      type: b.direction === "positive" ? "positive" : "concern",
      category: b.direction === "positive" ? "positive" : "concern",
      severity: normaliseIntensity(b.intensity),
      regulation_support_given: b.strategy_used.trim().length > 0,
      outcome: b.outcome ?? "",
    }));

  // ── LAC Reviews ────────────────────────────────────────────────────────
  const lac_reviews: LACReviewInput[] = (lacReviewsList ?? [])
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      id: r.id,
      child_id: r.child_id,
      date: typeof r.date === "string" ? r.date.slice(0, 10) : (r.created_at ?? today).slice(0, 10),
      child_participation: r.child_participation ?? "did_not_participate",
      child_views: r.child_views ?? "",
      outcome: r.outcome ?? "",
    }));

  // ── Lessons Learned ────────────────────────────────────────────────────
  const lessons_learned: LessonLearnedInput[] = (lessonsLearnedList ?? [])
    // A LessonLearned is home-level: it has no child_id, so `!l.child_id` was
    // always true and every lesson already reached every child. Stated rather
    // than left looking like a filter that does something.
    .map((l) => ({
      id: l.id,
      lesson: l.lesson,
      date: l.date_identified.slice(0, 10),
      category: l.theme_area,
    }));

  // ── Advocacy Records ───────────────────────────────────────────────────
  const advocacy_records = (advocacyRecordsList ?? [])
    .filter((a) => a.child_id === childId)
    .map((a) => ({
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
