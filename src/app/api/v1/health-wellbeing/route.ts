// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HEALTH & WELLBEING API ROUTE
// GET /api/v1/health-wellbeing
// Returns health compliance, wellbeing trends, CAMHS, appointments analysis.
// Reg 23 — Health of children.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHealthWellbeing,
  type ChildInput,
  type AppointmentInput,
  type HealthAssessmentInput,
  type DentalRecordInput,
  type OpticiansRecordInput,
  type ImmunisationRecordInput,
  type CamhsReferralInput,
  type MoodEntryInput,
} from "@/lib/engines/health-wellbeing-engine";

export async function GET() {
  const store = getStore();

  // ── Map children ─────────────────────────────────────────────────────────
  const children: ChildInput[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
    date_of_birth: yp.date_of_birth,
  }));

  // ── Map appointments ─────────────────────────────────────────────────────
  const appointments: AppointmentInput[] = store.appointments.map((a) => ({
    id: a.id,
    child_id: a.child_id,
    date: a.date,
    type: a.type,
    status: a.status,
  }));

  // ── Map health assessments ───────────────────────────────────────────────
  const healthAssessments: HealthAssessmentInput[] = store.healthAssessments.map((ha) => ({
    id: ha.id,
    child_id: ha.child_id,
    type: ha.type,
    status: ha.status,
    date: ha.date,
    next_due: ha.next_due,
    sdq_total: ha.sdq_scores?.total ?? null,
    sdq_band: ha.sdq_scores?.band ?? null,
  }));

  // ── Map dental records ───────────────────────────────────────────────────
  const dentalRecords: DentalRecordInput[] = store.dentalRecords.map((dr) => ({
    id: dr.id,
    child_id: dr.child_id,
    last_check_up_date: dr.last_check_up_date,
    next_check_up_due: dr.next_check_up_due,
    registration_status: dr.registration_status,
  }));

  // ── Map opticians records ────────────────────────────────────────────────
  const opticiansRecords: OpticiansRecordInput[] = store.opticiansRecords.map((or) => ({
    id: or.id,
    child_id: or.child_id,
    last_exam_date: or.last_exam_date,
    next_exam_due: or.next_exam_due,
  }));

  // ── Map immunisation records ─────────────────────────────────────────────
  const immunisationRecords: ImmunisationRecordInput[] = store.immunisationRecords.map((ir) => ({
    id: ir.id,
    child_id: ir.child_id,
    missed_count: ir.missed_at_age.length,
    caught_up_count: ir.caught_up_during_placement.length,
    upcoming_due_count: ir.upcoming_due_within_90_days.length,
    gp_reviewed_schedule: ir.gp_reviewed_schedule,
  }));

  // ── Map CAMHS referrals ──────────────────────────────────────────────────
  const camhsReferrals: CamhsReferralInput[] = store.camhsReferrals.map((cr) => ({
    id: cr.id,
    child_id: cr.child_id,
    referral_date: cr.referral_date,
    referral_status: cr.referral_status,
    urgency: cr.urgency,
    sessions_held: cr.sessions_held,
    sessions_scheduled: cr.sessions_scheduled,
    engagement_level: cr.current_engagement_level,
    waiting_time_weeks: cr.waiting_time_weeks,
  }));

  // ── Map mood entries from daily log ──────────────────────────────────────
  const moodEntries: MoodEntryInput[] = store.dailyLog
    .filter((entry) => entry.mood_score != null && entry.mood_score > 0)
    .map((entry) => ({
      child_id: entry.child_id,
      date: entry.date,
      mood_score: entry.mood_score!,
    }));

  // Also include mental health check-ins (mood_rating is 1-5, scale to 1-10)
  const mentalHealthMoods: MoodEntryInput[] = store.mentalHealthCheckIns.map((mh) => ({
    child_id: mh.child_id,
    date: mh.date,
    mood_score: mh.mood_rating * 2, // Scale 1-5 → 2-10
  }));

  // ── Run engine ───────────────────────────────────────────────────────────
  const result = computeHealthWellbeing({
    children,
    appointments,
    healthAssessments,
    dentalRecords,
    opticiansRecords,
    immunisationRecords,
    camhsReferrals,
    moodEntries: [...moodEntries, ...mentalHealthMoods],
  });

  return NextResponse.json({ data: result });
}
