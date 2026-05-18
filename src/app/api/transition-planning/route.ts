// ══════════════════════════════════════════════════════════════════════════════
// API: /api/transition-planning
//
// Transition & Pathway Planning Intelligence
//
// GET  — Returns transition planning assessment with realistic Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateTransitionPlanningIntelligence,
  getTransitionTypeLabel,
  getPlanStatusLabel,
  getSkillCategoryLabel,
  getConfidenceLevelLabel,
} from "@/lib/transition-planning";
import type {
  TransitionPlan,
  IndependenceSkillAssessment,
  PlacementStabilityRecord,
} from "@/lib/transition-planning";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_PLANS: TransitionPlan[] = [
  // Alex (14) — Independence skills building
  {
    id: "tp-alex-001",
    childId: "child-alex",
    childName: "Alex",
    transitionType: "independence",
    targetDate: "2027-03-15",
    planCreatedDate: "2026-01-15",
    lastReviewDate: "2026-04-10",
    nextReviewDate: "2026-07-10",
    status: "active",
    keyWorker: "Sarah Johnson",
    socialWorkerInvolved: true,
    childVoiceRecorded: true,
    familyInvolved: true,
    multiAgencyInvolved: true,
    goals: [
      { id: "g-a1", description: "Learn to prepare 3 different meals independently", category: "cooking", targetDate: "2026-09-01", status: "achieved", evidence: "Completed cooking sessions with staff — can make pasta, stir-fry and jacket potatoes" },
      { id: "g-a2", description: "Open and manage a savings account", category: "budgeting", targetDate: "2026-12-01", status: "in_progress" },
      { id: "g-a3", description: "Travel independently to school and back", category: "travel", targetDate: "2026-06-01", status: "achieved", evidence: "Now travels independently on bus route 42 daily" },
      { id: "g-a4", description: "Manage own laundry routine weekly", category: "laundry", targetDate: "2026-08-01", status: "in_progress" },
    ],
  },
  // Jordan (13) — Education transition (moving schools)
  {
    id: "tp-jordan-001",
    childId: "child-jordan",
    childName: "Jordan",
    transitionType: "education_transition",
    targetDate: "2026-09-01",
    planCreatedDate: "2026-02-01",
    lastReviewDate: "2026-04-15",
    nextReviewDate: "2026-07-15",
    status: "active",
    keyWorker: "Tom Richards",
    socialWorkerInvolved: true,
    childVoiceRecorded: true,
    familyInvolved: true,
    multiAgencyInvolved: true,
    goals: [
      { id: "g-j1", description: "Complete Year 8 mock exams before transfer", category: "communication", targetDate: "2026-06-15", status: "achieved", evidence: "All mocks completed — results above predicted grades" },
      { id: "g-j2", description: "Visit new school and meet form tutor", category: "social_skills", targetDate: "2026-07-01", status: "achieved", evidence: "Attended taster day on 14 March — very positive" },
      { id: "g-j3", description: "Build confidence using public transport to new school", category: "travel", targetDate: "2026-08-15", status: "in_progress" },
    ],
  },
  // Morgan (15) — Approaching leaving care at 16
  {
    id: "tp-morgan-001",
    childId: "child-morgan",
    childName: "Morgan",
    transitionType: "leaving_care",
    targetDate: "2026-12-01",
    planCreatedDate: "2026-01-10",
    lastReviewDate: "2026-03-20",
    nextReviewDate: "2026-06-20",
    status: "active",
    keyWorker: "Lisa Williams",
    socialWorkerInvolved: true,
    childVoiceRecorded: true,
    familyInvolved: false,
    multiAgencyInvolved: true,
    goals: [
      { id: "g-m1", description: "Understand tenancy agreements and tenant rights", category: "tenancy", targetDate: "2026-08-01", status: "in_progress" },
      { id: "g-m2", description: "Create and maintain a weekly budget", category: "budgeting", targetDate: "2026-07-01", status: "in_progress" },
      { id: "g-m3", description: "Attend 2-week work experience placement", category: "employment", targetDate: "2026-10-01", status: "not_started" },
      { id: "g-m4", description: "Register with GP and dentist independently", category: "appointments", targetDate: "2026-06-01", status: "achieved", evidence: "Registered with Oakfield Surgery and High Street Dental" },
      { id: "g-m5", description: "Manage personal hygiene routine independently", category: "hygiene", targetDate: "2026-04-01", status: "achieved", evidence: "Consistently managing own routine — no prompting needed" },
    ],
  },
];

const DEMO_ASSESSMENTS: IndependenceSkillAssessment[] = [
  {
    id: "assess-alex-001",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-04-01",
    assessedBy: "Sarah Johnson",
    skills: [
      { category: "cooking", confidence: "developing", notes: "Can prepare simple meals with minimal support" },
      { category: "budgeting", confidence: "emerging", notes: "Beginning to understand value of money" },
      { category: "hygiene", confidence: "competent", notes: "Good daily routine established" },
      { category: "laundry", confidence: "developing", notes: "Can sort and load machine — needs reminder for fabric softener" },
      { category: "travel", confidence: "competent", notes: "Confident on familiar bus routes" },
      { category: "appointments", confidence: "emerging", notes: "Attends with reminders — not yet booking independently" },
      { category: "communication", confidence: "competent", notes: "Articulate and confident in familiar settings" },
      { category: "employment", confidence: "not_started", notes: "Age-appropriate — not yet relevant" },
      { category: "tenancy", confidence: "not_started", notes: "Age-appropriate — not yet relevant" },
      { category: "emotional_regulation", confidence: "developing", notes: "Using breathing techniques — occasional escalation" },
      { category: "social_skills", confidence: "competent", notes: "Good peer relationships — positive group member" },
      { category: "digital_literacy", confidence: "competent", notes: "Safe and confident online" },
    ],
  },
  {
    id: "assess-jordan-001",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2026-04-05",
    assessedBy: "Tom Richards",
    skills: [
      { category: "cooking", confidence: "emerging", notes: "Can make toast and cereal — learning to use hob" },
      { category: "budgeting", confidence: "not_started", notes: "Not yet introduced" },
      { category: "hygiene", confidence: "competent", notes: "Independent routine" },
      { category: "laundry", confidence: "emerging", notes: "Learning to sort clothes — needs supervision" },
      { category: "travel", confidence: "developing", notes: "Confident locally — building for new school route" },
      { category: "appointments", confidence: "developing", notes: "Understands importance — needs support to attend" },
      { category: "communication", confidence: "competent", notes: "Excellent verbal communication" },
      { category: "employment", confidence: "not_started", notes: "Age-appropriate" },
      { category: "tenancy", confidence: "not_started", notes: "Age-appropriate" },
      { category: "emotional_regulation", confidence: "developing", notes: "Progressing well with therapeutic support" },
      { category: "social_skills", confidence: "developing", notes: "Growing confidence — anxious in new groups" },
      { category: "digital_literacy", confidence: "competent", notes: "Good online safety awareness" },
    ],
  },
  {
    id: "assess-morgan-001",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2026-04-10",
    assessedBy: "Lisa Williams",
    skills: [
      { category: "cooking", confidence: "competent", notes: "Can plan and prepare meals for self and others" },
      { category: "budgeting", confidence: "emerging", notes: "Understands concepts — struggles with long-term planning" },
      { category: "hygiene", confidence: "independent", notes: "Fully independent — no support needed" },
      { category: "laundry", confidence: "developing", notes: "Manages own laundry with occasional reminders" },
      { category: "travel", confidence: "competent", notes: "Confident on public transport across the borough" },
      { category: "appointments", confidence: "developing", notes: "Can attend independently — learning to book" },
      { category: "communication", confidence: "competent", notes: "Confident communicator — can self-advocate" },
      { category: "employment", confidence: "not_started", notes: "Work experience placement being arranged" },
      { category: "tenancy", confidence: "not_started", notes: "Starting tenancy skills programme this month" },
      { category: "emotional_regulation", confidence: "developing", notes: "Generally good — anxious about leaving care" },
      { category: "social_skills", confidence: "competent", notes: "Good friendships — active in community groups" },
      { category: "digital_literacy", confidence: "independent", notes: "Very tech-savvy — helps peers with digital tasks" },
    ],
  },
];

const DEMO_STABILITY: PlacementStabilityRecord[] = [
  {
    childId: "child-alex",
    childName: "Alex",
    placementStartDate: "2025-10-01",
    previousPlacements: 1,
    disruptionRisks: ["peer conflict at previous home"],
    stabilityFactors: ["strong key worker relationship", "settled in school", "positive peer group at Oak House"],
  },
  {
    childId: "child-jordan",
    childName: "Jordan",
    placementStartDate: "2025-11-01",
    previousPlacements: 0,
    disruptionRisks: [],
    stabilityFactors: ["first placement", "good family contact", "engaged in education", "therapeutic support in place"],
  },
  {
    childId: "child-morgan",
    childName: "Morgan",
    placementStartDate: "2026-01-10",
    previousPlacements: 3,
    plannedEndDate: "2026-12-01",
    disruptionRisks: ["anxiety about leaving care", "limited family support network", "financial literacy concerns"],
    stabilityFactors: ["strong relationship with key worker Lisa Williams"],
  },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateTransitionPlanningIntelligence(
    DEMO_PLANS,
    DEMO_ASSESSMENTS,
    DEMO_STABILITY,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        transitionTypeLabels: Object.fromEntries(
          (["leaving_care", "placement_move", "step_down", "step_up", "independence", "education_transition", "family_reunification", "supported_living"] as const).map(
            (t) => [t, getTransitionTypeLabel(t)],
          ),
        ),
        planStatusLabels: Object.fromEntries(
          (["draft", "active", "reviewed", "completed", "overdue"] as const).map(
            (s) => [s, getPlanStatusLabel(s)],
          ),
        ),
        skillCategoryLabels: Object.fromEntries(
          (["cooking", "budgeting", "hygiene", "laundry", "travel", "appointments", "communication", "employment", "tenancy", "emotional_regulation", "social_skills", "digital_literacy"] as const).map(
            (c) => [c, getSkillCategoryLabel(c)],
          ),
        ),
        confidenceLevelLabels: Object.fromEntries(
          (["not_started", "emerging", "developing", "competent", "independent"] as const).map(
            (l) => [l, getConfidenceLevelLabel(l)],
          ),
        ),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { plans, assessments, stability, homeId, periodStart, periodEnd, referenceDate } = body as {
    plans?: TransitionPlan[];
    assessments?: IndependenceSkillAssessment[];
    stability?: PlacementStabilityRecord[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!plans || !Array.isArray(plans) || plans.length === 0) {
    return NextResponse.json({ error: "plans array is required and must not be empty" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateTransitionPlanningIntelligence(
    plans,
    assessments ?? [],
    stability ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate ?? new Date().toISOString().split("T")[0],
  );

  return NextResponse.json({ data: result });
}
