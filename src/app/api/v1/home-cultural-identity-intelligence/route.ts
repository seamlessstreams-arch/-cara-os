// ══════════════════════════════════════════════════════════════════════════════
// API — HOME CULTURAL IDENTITY & HERITAGE INTELLIGENCE
// Maps in-memory store → engine input → JSON response.
// CHR 2015 Reg 5/6 · UNCRC Article 30.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeCulturalIdentity,
  type CulturalIdentityPlanInput,
  type CulturalVisitInput,
  type ReligiousObservanceInput,
  type HeritageLanguageInput,
  type DiversityCalendarInput,
} from "@/lib/engines/home-cultural-identity-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Cultural Identity Plans ───────────────────────────────────────
  const cultural_identity_plans: CulturalIdentityPlanInput[] = (store.culturalIdentityPlans as any[]).map((p: any) => ({
    id: p.id,
    child_id: p.child_id,
    last_reviewed: (p.last_reviewed ?? "").toString().slice(0, 10),
    next_review: (p.next_review ?? "").toString().slice(0, 10),
    identity_areas_count: p.identity_areas?.length ?? 0,
    celebrations_count: p.celebrations?.length ?? 0,
    resources_count: p.resources?.length ?? 0,
    child_contributed: !!(p.child_contributed),
  }));

  // ── Cultural Visits ───────────────────────────────────────────────
  const cultural_visits: CulturalVisitInput[] = (store.culturalVisits as any[]).map((v: any) => ({
    id: v.id,
    date: (v.date ?? "").toString().slice(0, 10),
    children_attended_count: v.young_people_attended?.length ?? 0,
    learning_outcomes_count: v.learning_outcomes?.length ?? 0,
    child_comments_count: v.child_comments ? Object.keys(v.child_comments).length : 0,
    repeat_visit_interest: !!(v.repeat_visit_interest),
  }));

  // ── Religious Observance Records ──────────────────────────────────
  const religious_observance_records: ReligiousObservanceInput[] = (store.religiousObservanceRecords as any[]).map((r: any) => ({
    id: r.id,
    child_id: r.child_id,
    practices_count: r.regular_practices?.length ?? 0,
    practices_supported_count: r.practices_supported?.length ?? 0,
    festivals_count: r.festivals_observed?.length ?? 0,
    child_authored: !!(r.child_authored),
    next_review_date: (r.next_review_date ?? "").toString().slice(0, 10),
  }));

  // ── Heritage Language Records ─────────────────────────────────────
  const heritage_language_records: HeritageLanguageInput[] = (store.heritageLanguageRecords as any[]).map((r: any) => ({
    id: r.id,
    child_id: r.child_id,
    languages_count: r.languages?.length ?? 0,
    opportunities_count: r.opportunities_to_use?.length ?? 0,
    community_resources_count: r.community_resources?.length ?? 0,
    home_atmosphere_supports: !!(r.home_atmosphere_supports),
    child_voice_provided: !!(r.child_voice),
    review_date: (r.review_date ?? "").toString().slice(0, 10),
  }));

  // ── Diversity Calendar Events ─────────────────────────────────────
  const diversity_calendar_events: DiversityCalendarInput[] = (store.diversityCalendarEvents as any[]).map((e: any) => ({
    id: e.id,
    date: (e.date ?? "").toString().slice(0, 10),
    status: e.status ?? "planned",
    resources_count: e.resources?.length ?? 0,
  }));

  const result = computeHomeCulturalIdentity({
    today,
    cultural_identity_plans,
    cultural_visits,
    religious_observance_records,
    heritage_language_records,
    diversity_calendar_events,
    total_children: store.youngPeople?.length ?? 0,
  });

  return NextResponse.json({ data: result });
}
