// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — Profile Builder
//
// Compiles a child's intelligence profile from Cara data sources.
// This produces a DISTILLED view (not raw data) suitable for LLM prompting.
//
// Sources:
//   - Care plan (objectives, status)
//   - Risk assessments (flags, mitigations)
//   - Key work sessions (recent themes, child voice)
//   - Daily logs (recent events, patterns)
//   - Incidents (triggers, patterns, frequency)
//   - Placement plan (needs, strengths)
//   - Education records (engagement, SEN)
//
// The profile is stored with a TTL (30 days) to ensure freshness.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { CaraChildProfile, EvidenceRef } from "./types";

type SB = any;

// ── Main Builder ─────────────────────────────────────────────────────────────

export async function buildChildProfile(
  childId: string,
  organisationId: string,
  homeId: string,
  userId: string,
): Promise<CaraChildProfile> {
  const sb = createServerClient();

  if (!sb || !isSupabaseEnabled()) {
    return buildDemoProfile(childId);
  }

  const evidenceRefs: EvidenceRef[] = [];

  // ── Fetch child basic info ─────────────────────────────────────────────────
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, preferred_name, date_of_birth, gender, pronouns, placement_start_date, key_worker_id")
    .eq("id", childId)
    .single();

  if (!child) {
    return buildDemoProfile(childId);
  }

  const age = child.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 0;

  // ── Fetch care plan objectives ─────────────────────────────────────────────
  const { data: objectives } = await (sb.from("care_plan_objectives") as SB)
    .select("id, title, status, created_at")
    .eq("child_id", childId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10);

  if (objectives?.length) {
    evidenceRefs.push({
      type: "care_plan",
      id: childId,
      date: new Date().toISOString().slice(0, 10),
      summary: `${objectives.length} active care plan objectives`,
    });
  }

  // ── Fetch recent incidents (last 28 days) ──────────────────────────────────
  const cutoff28 = new Date(Date.now() - 28 * 86400000).toISOString();
  const { data: incidents } = await (sb.from("incidents") as SB)
    .select("id, date, category, severity, trigger, description")
    .eq("child_id", childId)
    .gte("date", cutoff28)
    .order("date", { ascending: false })
    .limit(15);

  const triggers = extractUnique(incidents?.map((i: any) => i.trigger).filter(Boolean) ?? []);
  const riskFlags: string[] = [];
  if (incidents?.length >= 5) riskFlags.push("High incident frequency (5+ in 28 days)");
  if (incidents?.some((i: any) => i.category === "self_harm")) riskFlags.push("Self-harm risk");
  if (incidents?.some((i: any) => i.category === "missing")) riskFlags.push("Missing from care history");

  if (incidents?.length) {
    evidenceRefs.push({
      type: "incident",
      id: incidents[0].id,
      date: incidents[0].date,
      summary: `${incidents.length} incidents in last 28 days`,
    });
  }

  // ── Fetch recent key work sessions ─────────────────────────────────────────
  const { data: keyWork } = await (sb.from("key_work_sessions") as SB)
    .select("id, date, topics, child_voice, actions")
    .eq("child_id", childId)
    .order("date", { ascending: false })
    .limit(5);

  // ── Fetch risk assessment ──────────────────────────────────────────────────
  const { data: riskAssessment } = await (sb.from("risk_assessments") as SB)
    .select("id, strengths, needs, risk_factors, protective_factors, updated_at")
    .eq("child_id", childId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const strengths = riskAssessment?.strengths ?? [];
  const needs = riskAssessment?.needs ?? [];

  if (riskAssessment) {
    evidenceRefs.push({
      type: "assessment",
      id: riskAssessment.id,
      date: riskAssessment.updated_at?.slice(0, 10) ?? "",
      summary: "Current risk assessment",
    });
  }

  // ── Fetch placement plan for interests/communication ───────────────────────
  const { data: placementPlan } = await (sb.from("placement_plans") as SB)
    .select("id, interests, communication_preferences, cultural_considerations, updated_at")
    .eq("child_id", childId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // ── Build profile ──────────────────────────────────────────────────────────
  const profile: CaraChildProfile = {
    childId,
    childName: `${child.first_name} ${child.last_name}`,
    preferredName: child.preferred_name ?? undefined,
    age,
    gender: child.gender ?? undefined,
    pronouns: child.pronouns ?? undefined,
    placementStartDate: child.placement_start_date ?? undefined,
    strengths: Array.isArray(strengths) ? strengths.slice(0, 8) : [],
    needs: Array.isArray(needs) ? needs.slice(0, 8) : [],
    riskFlags,
    interests: Array.isArray(placementPlan?.interests) ? placementPlan.interests.slice(0, 6) : [],
    triggers,
    copingStrategies: riskAssessment?.protective_factors?.slice(0, 6) ?? [],
    communicationPreferences: placementPlan?.communication_preferences ?? undefined,
    culturalConsiderations: placementPlan?.cultural_considerations ?? undefined,
    carePlanObjectives: (objectives ?? []).map((o: any) => ({ title: o.title, status: o.status })),
    evidenceRefs,
  };

  // ── Persist profile snapshot ───────────────────────────────────────────────
  await (sb.from("cara_studio_profiles") as SB).insert({
    organisation_id: organisationId,
    home_id: homeId,
    child_id: childId,
    profile_json: profile,
    evidence_refs: evidenceRefs,
    risk_flags: riskFlags,
    strengths: profile.strengths,
    needs: profile.needs,
    created_by: userId,
  });

  return profile;
}

// ── Demo Profile (when Supabase not available) ───────────────────────────────

function buildDemoProfile(childId: string): CaraChildProfile {
  const isJordan = childId === "child_jordan" || childId.includes("jordan");
  return {
    childId,
    childName: isJordan ? "Jordan P" : "Sam W",
    preferredName: isJordan ? "Jordan" : "Sam",
    age: isJordan ? 15 : 14,
    gender: isJordan ? "male" : "male",
    pronouns: "he/him",
    placementStartDate: "2025-09-01",
    strengths: isJordan
      ? ["Creative and artistic", "Loyal to friends", "Good sense of humour", "Enjoys cooking", "Responds well to 1:1 attention", "DofE Bronze nearly complete"]
      : ["Quiet determination", "Kind to younger children", "Enjoys DofE", "Good relationship with key worker"],
    needs: isJordan
      ? ["Consistent boundaries with warmth", "Support with emotional regulation", "Gradual school reintegration", "Positive male role models"]
      : ["Social confidence building", "Sleep routine support", "Gradual exposure to new settings"],
    riskFlags: isJordan
      ? ["Verbal aggression when dysregulated", "Missing from care risk (1 episode)", "School refusal pattern"]
      : ["Self-harm risk (scratching)", "Social anxiety"],
    interests: isJordan
      ? ["Cooking", "Gaming", "Football", "DofE", "Art/Drawing"]
      : ["DofE volunteering", "Reading", "Animals", "Minecraft"],
    triggers: isJordan
      ? ["Transitions", "Boundary enforcement", "Family contact (sometimes)", "Peer conflict"]
      : ["New social situations", "Bedtime", "Unexpected changes"],
    copingStrategies: isJordan
      ? ["Breathing exercises", "Walking away to safe space", "Cooking as regulation", "Music"]
      : ["Quiet time in room", "Drawing", "Talking to key worker"],
    communicationPreferences: isJordan
      ? "Responds best to direct, honest communication. Don't talk down to him. Give choices. Avoid cornering."
      : "Needs time to process. Don't rush responses. Quiet environment preferred. Written prompts can help.",
    culturalConsiderations: undefined,
    carePlanObjectives: isJordan
      ? [
          { title: "Develop emotional regulation strategies", status: "active" },
          { title: "Maintain school attendance above 80%", status: "active" },
          { title: "Build independence through cooking and DofE", status: "active" },
          { title: "Supported weekly contact with mum", status: "active" },
        ]
      : [
          { title: "Complete DofE Bronze Award", status: "active" },
          { title: "Build confidence in social settings", status: "active" },
          { title: "Establish consistent sleep routine", status: "active" },
        ],
    recentProgress: isJordan
      ? "Jordan has shown improvement in using coping strategies independently. DofE Bronze nearly complete. School attendance still inconsistent but improving trend."
      : "Sam completed DofE volunteering section. Still struggles with new social settings but is engaging in key work.",
    evidenceRefs: [
      { type: "care_plan", id: "cp_1", date: "2026-05-01", summary: "Active care plan" },
      { type: "daily_log", id: "dl_1", date: "2026-05-14", summary: "Recent daily logs" },
      { type: "incident", id: "inc_1", date: "2026-05-12", summary: "Recent incidents" },
    ],
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractUnique(arr: string[]): string[] {
  return [...new Set(arr)].slice(0, 6);
}
