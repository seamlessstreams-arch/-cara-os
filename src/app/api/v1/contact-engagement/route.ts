// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT & FAMILY ENGAGEMENT API ROUTE
// GET /api/v1/contact-engagement
// Returns contact compliance, family time analysis, mood impact.
// Reg 6/7 — Quality of care, children's wishes about contact.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeContactEngagement,
  type ChildInput,
  type ContactPlanInput,
  type FamilyTimeSessionInput,
  type MoodEntryInput,
} from "@/lib/engines/contact-engagement-engine";

export async function GET() {
  const [contactPlansList, dailyLogList, familyTimeSessionsList, mentalHealthCheckInsList, youngPeopleList] = await Promise.all([
      dal.contactPlans.findAll(),
      dal.dailyLog.findAll(),
      dal.familyTimeSessions.findAll(),
      dal.mentalHealthCheckIns.findAll(),
      dal.youngPeople.findAll(),
    ]);

  // ── Map children ─────────────────────────────────────────────────────────
  const children: ChildInput[] = youngPeopleList.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
  }));

  // ── Map contact plans ────────────────────────────────────────────────────
  const contactPlans: ContactPlanInput[] = contactPlansList.map((p) => ({
    id: p.id,
    child_id: p.child_id,
    status: p.status,
    review_date: p.review_date,
    arrangements_count: p.arrangements.length,
    last_reviewed_date: p.last_reviewed_date,
  }));

  // ── Map family time sessions ─────────────────────────────────────────────
  const familyTimeSessions: FamilyTimeSessionInput[] = familyTimeSessionsList.map((s) => ({
    id: s.id,
    child_id: s.child_id,
    date: s.date,
    duration_minutes: s.duration_minutes,
    family_member: s.family_member,
    family_member_name: s.family_member_name,
    supervision_level: s.supervision_level,
    presentation_before: s.child_presentation_before,
    was_safe: s.was_it_safe,
    concerns_count: s.concerns_raised.length,
    positive_observations_count: s.positive_observations.length,
  }));

  // ── Map mood entries from daily log ──────────────────────────────────────
  const moodEntries: MoodEntryInput[] = dailyLogList
    .filter((entry) => entry.mood_score != null && entry.mood_score > 0)
    .map((entry) => ({
      child_id: entry.child_id,
      date: entry.date,
      mood_score: entry.mood_score!,
    }));

  // Also include mental health check-ins
  const mentalHealthMoods: MoodEntryInput[] = mentalHealthCheckInsList.map((mh) => ({
    child_id: mh.child_id,
    date: mh.date,
    mood_score: mh.mood_rating * 2, // Scale 1-5 → 2-10
  }));

  // ── Run engine ───────────────────────────────────────────────────────────
  const result = computeContactEngagement({
    children,
    contactPlans,
    familyTimeSessions,
    moodEntries: [...moodEntries, ...mentalHealthMoods],
  });

  return NextResponse.json({ data: result });
}
