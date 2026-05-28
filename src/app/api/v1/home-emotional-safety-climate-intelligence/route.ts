// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMOTIONAL SAFETY CLIMATE INTELLIGENCE API ROUTE
// GET /api/v1/home-emotional-safety-climate-intelligence
// Cross-domain composite: restraints + sanctionRewards + postIncidentChildDebriefs
// + staffDebriefRecords + positiveAchievements
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeEmotionalSafetyClimate,
  type RestraintInput,
  type SanctionRewardInput,
  type PostIncidentDebriefInput,
  type StaffDebriefInput,
  type PositiveAchievementInput,
} from "@/lib/engines/home-emotional-safety-climate-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;
    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.is_active !== false).length;

    const rawRestraints = (store.restraints ?? []) as any[];
    const restraints: RestraintInput[] = rawRestraints.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      duration: r.duration ?? 0,
      restraint_type: r.restraint_type ?? "",
      child_debriefed: !!r.child_debriefed,
      staff_debriefed: !!r.staff_debriefed,
      review_status: r.review_status ?? "pending",
      de_escalation_attempts: Array.isArray(r.de_escalation_attempts) ? r.de_escalation_attempts : [],
      injuries: Array.isArray(r.injuries) ? r.injuries.map((inj: any) => ({ person: inj.person ?? "", description: inj.description ?? "" })) : [],
      body_map_completed: !!r.body_map_completed,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSR = (store.sanctionRewards ?? []) as any[];
    const sanction_rewards: SanctionRewardInput[] = rawSR.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      date: (s.date ?? today).toString(),
      direction: s.direction ?? "reward",
      reward_type: s.reward_type ?? null,
      sanction_type: s.sanction_type ?? null,
      proportionate: s.proportionate !== false,
      child_response: s.child_response ?? "",
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawDebriefs = (store.postIncidentChildDebriefs ?? []) as any[];
    const post_incident_debriefs: PostIncidentDebriefInput[] = rawDebriefs.map((d: any) => ({
      id: d.id ?? "",
      child_id: d.child_id ?? "",
      incident_id: d.incident_id ?? "",
      debrief_date: (d.debrief_date ?? d.date ?? today).toString(),
      child_voice_captured: !!d.child_voice_captured,
      child_feelings_explored: !!d.child_feelings_explored,
      learning_identified: !!d.learning_identified,
      follow_up_actions: d.follow_up_actions ?? null,
      quality_rating: d.quality_rating ?? 3,
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawStaffDebriefs = (store.staffDebriefRecords ?? []) as any[];
    const staff_debriefs: StaffDebriefInput[] = rawStaffDebriefs.map((d: any) => ({
      id: d.id ?? "",
      staff_id: d.staff_id ?? "",
      incident_id: d.incident_id ?? null,
      debrief_date: (d.debrief_date ?? d.date ?? today).toString(),
      emotional_impact_explored: !!d.emotional_impact_explored,
      support_offered: !!d.support_offered,
      learning_identified: !!d.learning_identified,
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawAchievements = (store.positiveAchievements ?? []) as any[];
    const positive_achievements: PositiveAchievementInput[] = rawAchievements.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      date: (a.date ?? today).toString(),
      category: a.category ?? "social",
      description: a.description ?? "",
      celebrated: a.celebrated !== false,
      shared_with_network: !!a.shared_with_network,
      created_at: (a.created_at ?? today).toString(),
    }));

    const result = computeEmotionalSafetyClimate({
      today,
      total_children,
      total_staff,
      restraints,
      sanction_rewards,
      post_incident_debriefs,
      staff_debriefs,
      positive_achievements,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
