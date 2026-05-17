// ══════════════════════════════════════════════════════════════════════════════
// API: /api/independence — Independence & Life Skills
//
// GET  — returns home metrics, individual evaluations, or dashboard data
// POST — evaluate specific child or custom metrics
//
// CHR 2015 Reg 9 — Quality of care (promoting independence)
// Children Act 1989 s.23C — Continuing functions (leaving care)
// SCCIF — Children develop skills for independence
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateChildIndependence,
  calculateHomeIndependenceMetrics,
} from "@/lib/independence";
import type { ChildIndependenceProfile } from "@/lib/independence";

// ── GET Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? "home-oak";
  const childId = url.searchParams.get("childId");
  const mode = url.searchParams.get("mode") ?? "dashboard";
  const now = new Date().toISOString();

  const profiles = getDemoProfiles(homeId);

  if (mode === "metrics") {
    return NextResponse.json(calculateHomeIndependenceMetrics(profiles, homeId, now));
  }

  if (mode === "child" && childId) {
    const profile = profiles.find(p => p.childId === childId);
    if (!profile) return NextResponse.json({ error: "Child not found" }, { status: 404 });
    return NextResponse.json(evaluateChildIndependence(profile, now));
  }

  // Dashboard mode
  const metrics = calculateHomeIndependenceMetrics(profiles, homeId, now);
  const children = profiles.map(p => evaluateChildIndependence(p, now));

  return NextResponse.json({ metrics, children });
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "evaluate") {
    const { profile, now } = body;
    if (!profile) return NextResponse.json({ error: "profile required" }, { status: 400 });
    return NextResponse.json(evaluateChildIndependence(profile as ChildIndependenceProfile, now));
  }

  if (action === "metrics") {
    const { profiles, homeId, now } = body;
    if (!profiles || !homeId) return NextResponse.json({ error: "profiles and homeId required" }, { status: 400 });
    return NextResponse.json(calculateHomeIndependenceMetrics(profiles as ChildIndependenceProfile[], homeId, now));
  }

  return NextResponse.json({ error: "Invalid action. Use 'evaluate' or 'metrics'" }, { status: 400 });
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoProfiles(homeId: string): ChildIndependenceProfile[] {
  return [
    {
      childId: "child-001", childName: "Jordan Williams", homeId,
      dateOfBirth: "2010-08-15T00:00:00Z", placementStartDate: "2024-01-01T00:00:00Z",
      expectedLeavingDate: "2028-08-15T00:00:00Z",
      hasPathwayPlan: false, personalAdvisorAssigned: false,
      skillAssessments: [
        { domain: "daily_living", level: 3, assessedAt: "2026-04-15T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Iron own clothes", "Weekly room tidy routine"], evidence: ["Makes bed daily", "Laundry independently"], childSelfRating: 4, nextReviewDate: "2026-07-15T00:00:00Z" },
        { domain: "cooking_nutrition", level: 2, assessedAt: "2026-04-15T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Cook 3 simple meals", "Plan a shopping list"], evidence: ["Can make toast and sandwiches"], childSelfRating: 3, nextReviewDate: "2026-07-15T00:00:00Z" },
        { domain: "money_management", level: 2, assessedAt: "2026-04-15T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Budget pocket money", "Understand bank account"], evidence: ["Saves for items"], childSelfRating: 2, nextReviewDate: "2026-07-15T00:00:00Z" },
        { domain: "health_self_care", level: 3, assessedAt: "2026-04-15T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Book own GP appointment"], evidence: ["Good hygiene routine", "Takes medication independently"], childSelfRating: 4, nextReviewDate: "2026-07-15T00:00:00Z" },
        { domain: "relationships_social", level: 4, assessedAt: "2026-04-15T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Manage peer conflict calmly"], evidence: ["Good friendships", "Helps others"], childSelfRating: 4, nextReviewDate: "2026-07-15T00:00:00Z" },
        { domain: "digital_skills", level: 4, assessedAt: "2026-04-15T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Online safety awareness"], evidence: ["Uses devices responsibly", "Understands privacy settings"], childSelfRating: 5, nextReviewDate: "2026-07-15T00:00:00Z" },
      ],
      milestones: [
        { id: "ms-j-1", domain: "daily_living", description: "Complete laundry cycle independently", targetDate: "2026-04-01T00:00:00Z", achievedDate: "2026-03-20T00:00:00Z", status: "achieved", supportNeeded: "None" },
        { id: "ms-j-2", domain: "cooking_nutrition", description: "Cook pasta dish from recipe", targetDate: "2026-06-01T00:00:00Z", status: "active", supportNeeded: "Staff in kitchen for oven" },
        { id: "ms-j-3", domain: "money_management", description: "Budget pocket money for 1 month", targetDate: "2026-07-01T00:00:00Z", status: "active", supportNeeded: "Weekly check-in with keyworker" },
      ],
      activities: [
        { id: "a-j-1", domain: "cooking_nutrition", description: "Made scrambled eggs on toast", date: "2026-05-12T08:00:00Z", duration: 20, childEngaged: true, outcomeNotes: "Managed independently, enjoyed it", facilitatedBy: "staff-rw-01" },
        { id: "a-j-2", domain: "daily_living", description: "Ironing school uniform", date: "2026-05-10T17:00:00Z", duration: 15, childEngaged: true, outcomeNotes: "Good technique, minimal help needed", facilitatedBy: "staff-sw-01" },
        { id: "a-j-3", domain: "money_management", description: "Shopping trip with budget", date: "2026-05-05T14:00:00Z", duration: 60, childEngaged: true, outcomeNotes: "Stayed within budget, compared prices", facilitatedBy: "staff-sw-01" },
      ],
      documents: [
        { type: "birth_certificate", obtained: true, obtainedDate: "2024-02-01T00:00:00Z" },
        { type: "passport", obtained: true, obtainedDate: "2024-06-01T00:00:00Z", expiryDate: "2034-06-01T00:00:00Z" },
        { type: "ni_number", obtained: false },
        { type: "bank_account", obtained: false },
      ],
    },
    {
      childId: "child-002", childName: "Aisha Patel", homeId,
      dateOfBirth: "2009-03-22T00:00:00Z", placementStartDate: "2023-09-01T00:00:00Z",
      expectedLeavingDate: "2027-03-22T00:00:00Z",
      hasPathwayPlan: true, pathwayPlanDate: "2025-09-01T00:00:00Z", pathwayPlanReviewDate: "2026-09-01T00:00:00Z",
      personalAdvisorAssigned: true, personalAdvisorName: "Karen Hughes",
      skillAssessments: [
        { domain: "daily_living", level: 4, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-rm-01", targets: ["Maintain full weekly routine"], evidence: ["Manages room, laundry, cooking rota"], childSelfRating: 4, nextReviewDate: "2026-07-01T00:00:00Z" },
        { domain: "cooking_nutrition", level: 4, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-rm-01", targets: ["Meal plan for a week"], evidence: ["Cooks 5 different meals", "Follows recipes"], childSelfRating: 4, nextReviewDate: "2026-07-01T00:00:00Z" },
        { domain: "money_management", level: 3, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-rm-01", targets: ["Open bank account", "Budget monthly"], evidence: ["Manages pocket money", "Understands saving"], childSelfRating: 3, nextReviewDate: "2026-07-01T00:00:00Z" },
        { domain: "health_self_care", level: 4, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-rm-01", targets: ["Manage medication independently"], evidence: ["Books own appointments", "Good self-care"], childSelfRating: 4, nextReviewDate: "2026-07-01T00:00:00Z" },
        { domain: "education_employment", level: 3, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-rm-01", targets: ["Research college options", "Work experience"], evidence: ["Attends school regularly", "Good grades"], childSelfRating: 3, nextReviewDate: "2026-07-01T00:00:00Z" },
        { domain: "housing_tenancy", level: 2, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-rm-01", targets: ["Understand tenancy agreement", "Visit supported housing"], evidence: ["Awareness of utility bills"], childSelfRating: 2, nextReviewDate: "2026-07-01T00:00:00Z" },
        { domain: "travel_transport", level: 4, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-rm-01", targets: ["Plan multi-leg journey"], evidence: ["Uses buses independently", "Has travel pass"], childSelfRating: 5, nextReviewDate: "2026-07-01T00:00:00Z" },
      ],
      milestones: [
        { id: "ms-a-1", domain: "money_management", description: "Open bank account", targetDate: "2026-06-01T00:00:00Z", status: "active", supportNeeded: "Staff to accompany to bank" },
        { id: "ms-a-2", domain: "housing_tenancy", description: "Visit supported accommodation", targetDate: "2026-07-01T00:00:00Z", status: "active", supportNeeded: "PA to arrange visit" },
        { id: "ms-a-3", domain: "education_employment", description: "Complete work experience week", targetDate: "2026-06-15T00:00:00Z", status: "active", supportNeeded: "Staff to liaise with employer" },
        { id: "ms-a-4", domain: "cooking_nutrition", description: "Plan and cook Sunday dinner", targetDate: "2026-04-01T00:00:00Z", achievedDate: "2026-03-28T00:00:00Z", status: "achieved", supportNeeded: "None" },
      ],
      activities: [
        { id: "a-a-1", domain: "cooking_nutrition", description: "Cooked curry from scratch for house", date: "2026-05-14T17:00:00Z", duration: 60, childEngaged: true, outcomeNotes: "Excellent - everyone enjoyed it", facilitatedBy: "staff-rm-01" },
        { id: "a-a-2", domain: "money_management", description: "Budgeting workshop with PA", date: "2026-05-08T14:00:00Z", duration: 45, childEngaged: true, outcomeNotes: "Engaged well, set savings goal", facilitatedBy: "Karen Hughes" },
        { id: "a-a-3", domain: "housing_tenancy", description: "Discussed types of accommodation", date: "2026-05-01T11:00:00Z", duration: 30, childEngaged: true, outcomeNotes: "Asked good questions about supported living", facilitatedBy: "Karen Hughes" },
      ],
      documents: [
        { type: "birth_certificate", obtained: true, obtainedDate: "2023-10-01T00:00:00Z" },
        { type: "passport", obtained: true, obtainedDate: "2024-01-15T00:00:00Z", expiryDate: "2034-01-15T00:00:00Z" },
        { type: "ni_number", obtained: true, obtainedDate: "2025-03-22T00:00:00Z" },
        { type: "bank_account", obtained: false },
        { type: "provisional_licence", obtained: false },
      ],
    },
    {
      childId: "child-003", childName: "Callum Thompson", homeId,
      dateOfBirth: "2011-11-03T00:00:00Z", placementStartDate: "2025-01-15T00:00:00Z",
      hasPathwayPlan: false, personalAdvisorAssigned: false,
      skillAssessments: [
        { domain: "daily_living", level: 2, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Make bed daily", "Tidy room weekly"], evidence: ["Needs prompting for all tasks"], childSelfRating: 3, nextReviewDate: "2026-07-01T00:00:00Z" },
        { domain: "cooking_nutrition", level: 1, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Make a sandwich", "Pour drinks safely"], evidence: ["Shows no interest currently"], childSelfRating: 2, nextReviewDate: "2026-07-01T00:00:00Z" },
        { domain: "health_self_care", level: 2, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Consistent hygiene routine"], evidence: ["Needs daily reminders for showering"], childSelfRating: 3, nextReviewDate: "2026-07-01T00:00:00Z" },
        { domain: "relationships_social", level: 3, assessedAt: "2026-04-01T10:00:00Z", assessedBy: "staff-sw-01", targets: ["Manage disagreements without aggression"], evidence: ["Has friends at school", "Can be kind"], childSelfRating: 4, nextReviewDate: "2026-07-01T00:00:00Z" },
      ],
      milestones: [
        { id: "ms-c-1", domain: "daily_living", description: "Make bed without prompting for a week", targetDate: "2026-06-01T00:00:00Z", status: "active", supportNeeded: "Visual reminder chart" },
      ],
      activities: [
        { id: "a-c-1", domain: "daily_living", description: "Room tidy session with support", date: "2026-05-11T10:00:00Z", duration: 20, childEngaged: false, outcomeNotes: "Reluctant, completed minimum", facilitatedBy: "staff-rw-01" },
      ],
      documents: [
        { type: "birth_certificate", obtained: true, obtainedDate: "2025-02-01T00:00:00Z" },
        { type: "passport", obtained: false },
        { type: "ni_number", obtained: false },
        { type: "bank_account", obtained: false },
      ],
    },
  ];
}
