// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/activities — Activities & Enrichment Intelligence
//
// Analyses activity participation, variety, engagement, and community integration.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 9 alignment (Enjoyment and Achievement).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseActivities } from "@/lib/cara/activities-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ActivityInput, Activity, ActivityCategory } from "@/lib/cara/activities-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();
    let input: ActivityInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseActivities(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[cara/activities] Error:", err);
    return NextResponse.json(
      { error: "Activities intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<ActivityInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // Activities (last 90 days)
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const { data: rawActivities } = await (sb.from("activities") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const activities: Activity[] = (rawActivities ?? []).map((a: any) => ({
    id: a.id,
    date: a.date,
    name: a.name ?? "Activity",
    category: (a.category ?? "other") as ActivityCategory,
    duration: a.duration ?? 60,
    childChose: a.child_chose ?? true,
    childEngagement: a.engagement ?? "moderate",
    communityBased: a.community_based ?? false,
    peerInteraction: a.peer_interaction ?? false,
    achievementNoted: a.achievement ?? undefined,
    recurring: a.recurring ?? false,
    supervisedOnly: a.supervised_only ?? false,
  }));

  // Activity config
  const { data: config } = await (sb.from("activity_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  return {
    childId,
    childName,
    age,
    activities,
    hobbiesIdentified: config?.hobbies_identified ?? true,
    interestsExplored: config?.interests_explored ?? true,
    activityBudgetAvailable: config?.budget_available ?? true,
    memberOfClubOrGroup: config?.club_member ?? false,
    attendsCommunityActivities: config?.community_activities ?? false,
    hasAchievementsRecorded: config?.achievements_recorded ?? false,
    pocketMoneyForActivities: config?.pocket_money ?? true,
    restrictedFromActivities: config?.restricted ?? false,
    restrictionReason: config?.restriction_reason ?? undefined,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): ActivityInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    // Sam — good variety
    return {
      childId,
      childName: "Sam",
      age: 14,
      activities: [
        { id: "a1", date: "2026-03-05", name: "Swimming club", category: "sport", duration: 60, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
        { id: "a2", date: "2026-03-08", name: "Art class", category: "creative_arts", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false, achievementNoted: "Work displayed in school exhibition" },
        { id: "a3", date: "2026-03-12", name: "Swimming club", category: "sport", duration: 60, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
        { id: "a4", date: "2026-03-14", name: "Cinema with friends", category: "social", duration: 150, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: false, supervisedOnly: false },
        { id: "a5", date: "2026-03-15", name: "Art class", category: "creative_arts", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
        { id: "a6", date: "2026-03-19", name: "Swimming club", category: "sport", duration: 60, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false, achievementNoted: "25m backstroke badge" },
        { id: "a7", date: "2026-03-22", name: "Baking at home", category: "life_skills", duration: 45, childChose: true, childEngagement: "moderate", communityBased: false, peerInteraction: false, recurring: false, supervisedOnly: false },
        { id: "a8", date: "2026-03-26", name: "Swimming club", category: "sport", duration: 60, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
        { id: "a9", date: "2026-03-29", name: "Museum trip", category: "cultural", duration: 180, childChose: false, childEngagement: "moderate", communityBased: true, peerInteraction: false, recurring: false, supervisedOnly: false },
        { id: "a10", date: "2026-04-02", name: "Football in park", category: "outdoor", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: false, supervisedOnly: false },
        { id: "a11", date: "2026-04-05", name: "Art class", category: "creative_arts", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
        { id: "a12", date: "2026-04-09", name: "Swimming club", category: "sport", duration: 60, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
      ],
      hobbiesIdentified: true,
      interestsExplored: true,
      activityBudgetAvailable: true,
      memberOfClubOrGroup: true,
      attendsCommunityActivities: true,
      hasAchievementsRecorded: true,
      pocketMoneyForActivities: true,
      restrictedFromActivities: false,
    };
  }

  // Jordan — active but could broaden
  return {
    childId,
    childName: "Jordan",
    age: 15,
    activities: [
      { id: "a1", date: "2026-03-04", name: "Football training", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a2", date: "2026-03-07", name: "Football match", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false, achievementNoted: "Man of the match" },
      { id: "a3", date: "2026-03-11", name: "Football training", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a4", date: "2026-03-14", name: "Football match", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a5", date: "2026-03-16", name: "Gaming with mates online", category: "digital", duration: 120, childChose: true, childEngagement: "high", communityBased: false, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a6", date: "2026-03-18", name: "Football training", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a7", date: "2026-03-21", name: "Football match", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a8", date: "2026-03-23", name: "Gaming with mates online", category: "digital", duration: 90, childChose: true, childEngagement: "high", communityBased: false, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a9", date: "2026-03-25", name: "Football training", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a10", date: "2026-03-28", name: "Football match", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false, achievementNoted: "Selected for county trials" },
      { id: "a11", date: "2026-04-01", name: "Football training", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a12", date: "2026-04-04", name: "Cinema", category: "social", duration: 150, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: false, supervisedOnly: false },
      { id: "a13", date: "2026-04-08", name: "Football training", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
      { id: "a14", date: "2026-04-12", name: "Cooking session", category: "life_skills", duration: 60, childChose: false, childEngagement: "moderate", communityBased: false, peerInteraction: false, recurring: false, supervisedOnly: false },
      { id: "a15", date: "2026-04-15", name: "Football training", category: "sport", duration: 90, childChose: true, childEngagement: "high", communityBased: true, peerInteraction: true, recurring: true, supervisedOnly: false },
    ],
    hobbiesIdentified: true,
    interestsExplored: true,
    activityBudgetAvailable: true,
    memberOfClubOrGroup: true,
    attendsCommunityActivities: true,
    hasAchievementsRecorded: true,
    pocketMoneyForActivities: true,
    restrictedFromActivities: false,
  };
}
