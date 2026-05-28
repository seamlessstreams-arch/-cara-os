// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CULTURAL IDENTITY & DIVERSITY INTELLIGENCE API ROUTE
// GET /api/v1/home-cultural-identity-diversity-intelligence
// Cross-domain composite: culturalIdentityPlans + culturalReligiousMentors
// + culturalVisits + diversityCalendarEvents + personalPassports
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeCulturalIdentityDiversity,
  type CulturalIdentityPlanInput,
  type CulturalReligiousMentorInput,
  type CulturalVisitInput,
  type DiversityCalendarEventInput,
  type PersonalPassportInput,
} from "@/lib/engines/home-cultural-identity-diversity-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawPlans = (store.culturalIdentityPlans ?? []) as any[];
    const cultural_identity_plans: CulturalIdentityPlanInput[] = rawPlans.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      plan_date: (p.plan_date ?? today).toString(),
      ethnicity_documented: !!p.ethnicity_documented,
      religion_documented: !!p.religion_documented,
      language_needs_documented: !!p.language_needs_documented,
      identity_goals_set: !!p.identity_goals_set,
      child_voice_captured: !!p.child_voice_captured,
      reviewed: !!p.reviewed,
      review_date: (p.review_date ?? "").toString(),
      next_review_date: (p.next_review_date ?? "").toString(),
      active: p.active !== false,
      life_story_work_active: !!p.life_story_work_active,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawMentors = (store.culturalReligiousMentors ?? []) as any[];
    const cultural_religious_mentors: CulturalReligiousMentorInput[] = rawMentors.map((m: any) => ({
      id: m.id ?? "",
      child_id: m.child_id ?? "",
      mentor_name: m.mentor_name ?? "",
      mentor_type: m.mentor_type ?? "cultural",
      start_date: (m.start_date ?? today).toString(),
      active: m.active !== false,
      meetings_held: m.meetings_held ?? 0,
      last_meeting_date: (m.last_meeting_date ?? "").toString(),
      created_at: (m.created_at ?? today).toString(),
    }));

    const rawVisits = (store.culturalVisits ?? []) as any[];
    const cultural_visits: CulturalVisitInput[] = rawVisits.map((v: any) => ({
      id: v.id ?? "",
      child_id: v.child_id ?? "",
      visit_date: (v.visit_date ?? today).toString(),
      visit_type: v.visit_type ?? "cultural_site",
      description: v.description ?? "",
      child_feedback_positive: !!v.child_feedback_positive,
      staff_accompanied: v.staff_accompanied !== false,
      created_at: (v.created_at ?? today).toString(),
    }));

    const rawEvents = (store.diversityCalendarEvents ?? []) as any[];
    const diversity_calendar_events: DiversityCalendarEventInput[] = rawEvents.map((e: any) => ({
      id: e.id ?? "",
      event_name: e.event_name ?? "",
      event_date: (e.event_date ?? today).toString(),
      event_type: e.event_type ?? "cultural_celebration",
      children_participated: Array.isArray(e.children_participated) ? e.children_participated : [],
      staff_participated: Array.isArray(e.staff_participated) ? e.staff_participated : [],
      activities_held: !!e.activities_held,
      learning_documented: !!e.learning_documented,
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawPassports = (store.personalPassports ?? []) as any[];
    const personal_passports: PersonalPassportInput[] = rawPassports.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      last_updated: (p.last_updated ?? today).toString(),
      photo_current: !!p.photo_current,
      identity_info_complete: !!p.identity_info_complete,
      cultural_needs_documented: !!p.cultural_needs_documented,
      preferences_documented: !!p.preferences_documented,
      created_at: (p.created_at ?? today).toString(),
    }));

    const result = computeCulturalIdentityDiversity({
      today,
      total_children,
      cultural_identity_plans,
      cultural_religious_mentors,
      cultural_visits,
      diversity_calendar_events,
      personal_passports,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
