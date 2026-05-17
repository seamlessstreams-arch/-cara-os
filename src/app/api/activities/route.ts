// ══════════════════════════════════════════════════════════════════════════════
// Activities & Enrichment — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateChildActivitiesCompliance,
  calculateHomeActivitiesMetrics,
} from "@/lib/activities";
import type { ChildActivitiesProfile } from "@/lib/activities";

// ── Demo Data ─────────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

const DEMO_PROFILES: ChildActivitiesProfile[] = [
  {
    childId: "child-alex",
    childName: "Alex",
    homeId: "home-oak",
    age: 14,
    activities: [
      { id: "act-a1", childId: "child-alex", name: "Football (Oakville FC U14)", category: "sport_team", participationLevel: "regular", startDate: "2025-09-01", frequency: "Twice weekly", venue: "Oakville Sports Centre", communityBased: true, cost: 25, fundedBy: "Home budget", childChosenActivity: true, sustainedFromPreviousPlacement: true, achievements: ["County Cup Runner-Up", "Player of Month (March)"] },
      { id: "act-a2", childId: "child-alex", name: "Guitar Lessons", category: "creative_arts", participationLevel: "regular", startDate: "2026-01-15", frequency: "Weekly", venue: "Oakville Music School", communityBased: true, cost: 30, fundedBy: "Home budget", childChosenActivity: true, sustainedFromPreviousPlacement: false, achievements: ["Grade 2 Passed"] },
      { id: "act-a3", childId: "child-alex", name: "Youth Club", category: "social_community", participationLevel: "regular", startDate: "2025-10-01", frequency: "Weekly", venue: "St Andrew's Centre", communityBased: true, cost: 0, fundedBy: "Free", childChosenActivity: true, sustainedFromPreviousPlacement: false },
      { id: "act-a4", childId: "child-alex", name: "Gaming Club (in-home)", category: "hobbies_interests", participationLevel: "regular", startDate: "2025-09-01", frequency: "Twice weekly", venue: "Home", communityBased: false, cost: 0, fundedBy: "N/A", childChosenActivity: true, sustainedFromPreviousPlacement: false },
      { id: "act-a5", childId: "child-alex", name: "Swimming", category: "sport_individual", participationLevel: "occasional", startDate: "2026-03-01", frequency: "Fortnightly", venue: "Oakville Leisure Centre", communityBased: true, cost: 5, fundedBy: "Home budget", childChosenActivity: false, sustainedFromPreviousPlacement: false },
    ],
    plan: { childId: "child-alex", lastReviewDate: "2026-04-01T10:00:00Z", nextReviewDate: "2026-07-01T10:00:00Z", interestsExplored: ["photography", "cooking", "skateboarding"], newExperiencesOffered: ["Rock climbing taster day", "Photography workshop"], monthlyBudget: 120, monthlySpend: 95, preferredActivities: ["Football", "Guitar", "Gaming"] },
    activitiesCancelledAsPunishment: 0,
    barriersIdentified: ["transport"],
    barriersResolved: ["transport"],
  },
  {
    childId: "child-jordan",
    childName: "Jordan",
    homeId: "home-oak",
    age: 15,
    activities: [
      { id: "act-j1", childId: "child-jordan", name: "Boxing (Elite Gym)", category: "sport_individual", participationLevel: "regular", startDate: "2026-02-01", frequency: "Three times weekly", venue: "Elite Boxing Gym", communityBased: true, cost: 40, fundedBy: "Home budget", childChosenActivity: true, sustainedFromPreviousPlacement: false, achievements: ["First bout win", "Fitness award"] },
      { id: "act-j2", childId: "child-jordan", name: "Cooking Club", category: "life_skills", participationLevel: "regular", startDate: "2026-01-10", frequency: "Weekly", venue: "Home (staff-led)", communityBased: false, cost: 15, fundedBy: "Home budget", childChosenActivity: true, sustainedFromPreviousPlacement: false, achievements: ["Cooked Sunday dinner solo"] },
      { id: "act-j3", childId: "child-jordan", name: "DofE Bronze", category: "outdoor_adventure", participationLevel: "regular", startDate: "2026-03-01", frequency: "Weekly + expeditions", venue: "School/Various", communityBased: true, cost: 10, fundedBy: "Pupil Premium", childChosenActivity: true, sustainedFromPreviousPlacement: false },
      { id: "act-j4", childId: "child-jordan", name: "Art Class", category: "creative_arts", participationLevel: "dropped_out", startDate: "2025-11-01", endDate: "2026-01-15", frequency: "Weekly", venue: "Community Centre", communityBased: true, cost: 0, fundedBy: "Free", childChosenActivity: false, sustainedFromPreviousPlacement: false, barriers: ["peer_issues"], barrierActions: ["Offered alternative group"] },
    ],
    plan: { childId: "child-jordan", lastReviewDate: "2026-03-15T10:00:00Z", nextReviewDate: "2026-06-15T10:00:00Z", interestsExplored: ["music production", "mechanics", "barbering"], newExperiencesOffered: ["Barber course taster", "Go-karting"], monthlyBudget: 130, monthlySpend: 105, preferredActivities: ["Boxing", "Cooking", "DofE"] },
    activitiesCancelledAsPunishment: 0,
    barriersIdentified: ["confidence", "peer_issues"],
    barriersResolved: ["peer_issues"],
  },
  {
    childId: "child-morgan",
    childName: "Morgan",
    homeId: "home-oak",
    age: 12,
    activities: [
      { id: "act-m1", childId: "child-morgan", name: "Gymnastics", category: "sport_individual", participationLevel: "regular", startDate: "2025-06-01", frequency: "Twice weekly", venue: "Oakville Gymnastics Club", communityBased: true, cost: 35, fundedBy: "Home budget", childChosenActivity: true, sustainedFromPreviousPlacement: true, achievements: ["Level 5 Award", "Regional qualifier"] },
      { id: "act-m2", childId: "child-morgan", name: "Drama Club", category: "creative_arts", participationLevel: "regular", startDate: "2025-09-01", frequency: "Weekly", venue: "School", communityBased: true, cost: 0, fundedBy: "School", childChosenActivity: true, sustainedFromPreviousPlacement: false, achievements: ["Lead in school play"] },
      { id: "act-m3", childId: "child-morgan", name: "Reading Group", category: "hobbies_interests", participationLevel: "regular", startDate: "2026-01-01", frequency: "Fortnightly", venue: "Library", communityBased: true, cost: 0, fundedBy: "Free", childChosenActivity: true, sustainedFromPreviousPlacement: false },
      { id: "act-m4", childId: "child-morgan", name: "Heritage Language Class (Polish)", category: "identity_heritage", participationLevel: "regular", startDate: "2025-11-01", frequency: "Weekly", venue: "Polish Community Centre", communityBased: true, cost: 10, fundedBy: "Home budget", childChosenActivity: true, sustainedFromPreviousPlacement: false },
      { id: "act-m5", childId: "child-morgan", name: "Brownies/Guides", category: "social_community", participationLevel: "regular", startDate: "2025-09-01", frequency: "Weekly", venue: "Church Hall", communityBased: true, cost: 5, fundedBy: "Home budget", childChosenActivity: true, sustainedFromPreviousPlacement: true },
    ],
    plan: { childId: "child-morgan", lastReviewDate: "2026-04-10T10:00:00Z", nextReviewDate: "2026-07-10T10:00:00Z", interestsExplored: ["horse riding", "coding", "dance"], newExperiencesOffered: ["Horse riding lesson", "Coding club trial", "Contemporary dance taster"], monthlyBudget: 110, monthlySpend: 100, preferredActivities: ["Gymnastics", "Drama", "Guides"] },
    activitiesCancelledAsPunishment: 0,
    barriersIdentified: [],
    barriersResolved: [],
  },
  {
    childId: "child-sam",
    childName: "Sam",
    homeId: "home-oak",
    age: 16,
    activities: [
      { id: "act-s1", childId: "child-sam", name: "Gym Membership", category: "health_wellbeing", participationLevel: "regular", startDate: "2026-01-01", frequency: "4x weekly", venue: "PureGym", communityBased: true, cost: 20, fundedBy: "Home budget (16+ rate)", childChosenActivity: true, sustainedFromPreviousPlacement: false },
      { id: "act-s2", childId: "child-sam", name: "Music Production", category: "creative_arts", participationLevel: "regular", startDate: "2026-02-01", frequency: "Weekly", venue: "Home (laptop)", communityBased: false, cost: 10, fundedBy: "Home budget", childChosenActivity: true, sustainedFromPreviousPlacement: false },
      { id: "act-s3", childId: "child-sam", name: "Volunteering (Charity Shop)", category: "social_community", participationLevel: "occasional", startDate: "2026-03-01", frequency: "Saturday mornings", venue: "High Street", communityBased: true, cost: 0, fundedBy: "N/A", childChosenActivity: true, sustainedFromPreviousPlacement: false },
      { id: "act-s4", childId: "child-sam", name: "Football (5-a-side)", category: "sport_team", participationLevel: "dropped_out", startDate: "2025-10-01", endDate: "2026-01-15", frequency: "Weekly", venue: "Goals Centre", communityBased: true, cost: 5, fundedBy: "Home budget", childChosenActivity: true, sustainedFromPreviousPlacement: false, barriers: ["peer_issues", "confidence"], barrierActions: ["Key-work sessions on confidence", "Offered alternative team sport"] },
    ],
    plan: { childId: "child-sam", lastReviewDate: "2026-03-20T10:00:00Z", nextReviewDate: "2026-06-20T10:00:00Z", interestsExplored: ["driving lessons", "barista course", "basketball"], newExperiencesOffered: ["Basketball drop-in session"], monthlyBudget: 100, monthlySpend: 55, preferredActivities: ["Gym", "Music production"] },
    activitiesCancelledAsPunishment: 0,
    barriersIdentified: ["confidence", "peer_issues"],
    barriersResolved: [],
  },
];

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "dashboard";
  const homeId = searchParams.get("homeId") ?? "home-oak";
  const childId = searchParams.get("childId");

  if (mode === "dashboard") {
    const homeProfiles = DEMO_PROFILES.filter(p => p.homeId === homeId);
    const metrics = calculateHomeActivitiesMetrics(homeProfiles, homeId, NOW);
    const childResults = homeProfiles.map(p => evaluateChildActivitiesCompliance(p, NOW));
    return NextResponse.json({ metrics, childResults, profiles: homeProfiles });
  }

  if (mode === "child" && childId) {
    const profile = DEMO_PROFILES.find(p => p.childId === childId);
    if (!profile) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    return NextResponse.json({ result, profile });
  }

  if (mode === "metrics") {
    const homeProfiles = DEMO_PROFILES.filter(p => p.homeId === homeId);
    const metrics = calculateHomeActivitiesMetrics(homeProfiles, homeId, NOW);
    return NextResponse.json(metrics);
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "evaluate") {
    const profile = body.profile as ChildActivitiesProfile;
    if (!profile) {
      return NextResponse.json({ error: "Missing profile" }, { status: 400 });
    }
    const result = evaluateChildActivitiesCompliance(profile, body.now ?? NOW);
    return NextResponse.json(result);
  }

  if (action === "metrics") {
    const profiles = body.profiles as ChildActivitiesProfile[];
    const homeId = body.homeId as string;
    if (!profiles || !homeId) {
      return NextResponse.json({ error: "Missing profiles or homeId" }, { status: 400 });
    }
    const metrics = calculateHomeActivitiesMetrics(profiles, homeId, body.now ?? NOW);
    return NextResponse.json(metrics);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
