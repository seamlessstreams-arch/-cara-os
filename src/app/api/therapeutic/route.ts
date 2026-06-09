// ══════════════════════════════════════════════════════════════════════════════
// Therapeutic Support & Emotional Wellbeing — API Route
// CHR 2015 Reg 6 (Quality & Purpose), Reg 10 (Health & Wellbeing)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateTherapeuticCompliance,
  calculateHomeTherapeuticMetrics,
} from "@/lib/therapeutic";
import type {
  ChildTherapeuticProfile,
  HomeTherapeuticConfig,
} from "@/lib/therapeutic";

// ── Demo Data ─────────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

const DEMO_CONFIG: HomeTherapeuticConfig = {
  homeId: "home-oak",
  primaryTherapeuticModel: "pace",
  supportingModels: ["dyadic_developmental_psychotherapy", "theraplay", "sensory_integration"],
  therapeuticConsultant: "Dr Sarah Mitchell",
  consultationFrequency: "monthly",
  lastConsultation: "2026-05-05T10:00:00Z",
  nextConsultation: "2026-06-02T10:00:00Z",
  trainedStaffPercentage: 92,
  reflectivePracticeFrequency: "fortnightly",
  lastReflectivePractice: "2026-05-10T14:00:00Z",
  sdqFrequency: "quarterly",
  wellbeingReviewFrequency: "monthly",
  maxCrisisEventsBeforeEscalation: 3,
  minimumTherapeuticHoursPerWeek: 6,
};

const DEMO_PROFILES: ChildTherapeuticProfile[] = [
  {
    childId: "child-alex",
    childName: "Alex",
    primaryModel: "pace",
    secondaryModels: ["theraplay", "sensory_integration"],
    emotionalRegulationLevel: "developing",
    mentalHealthStatus: "improving",
    wellbeingScores: [
      { domain: "emotional_regulation", score: 72, trend: "improving", lastAssessed: "2026-05-10", targetScore: 80 },
      { domain: "attachment_security", score: 65, trend: "improving", lastAssessed: "2026-05-10", targetScore: 75 },
      { domain: "self_esteem", score: 68, trend: "stable", lastAssessed: "2026-05-10", targetScore: 75 },
      { domain: "peer_relationships", score: 70, trend: "improving", lastAssessed: "2026-05-10", targetScore: 80 },
      { domain: "trauma_recovery", score: 60, trend: "improving", lastAssessed: "2026-05-10", targetScore: 70 },
      { domain: "anxiety_management", score: 62, trend: "stable", lastAssessed: "2026-05-10", targetScore: 75 },
      { domain: "resilience", score: 75, trend: "improving", lastAssessed: "2026-05-10", targetScore: 80 },
      { domain: "identity", score: 70, trend: "stable", lastAssessed: "2026-05-10", targetScore: 80 },
    ],
    interventions: [
      {
        id: "int-alex-01",
        type: "individual_therapy",
        provider: "Dr Sarah Mitchell",
        startDate: "2026-01-15",
        frequency: "weekly",
        sessionsAttended: 18,
        sessionsMissed: 2,
        effectiveness: 78,
        childFeedback: 72,
        active: true,
      },
      {
        id: "int-alex-02",
        type: "sensory_regulation",
        provider: "Chamberlain House Staff",
        startDate: "2026-02-01",
        frequency: "daily",
        sessionsAttended: 70,
        sessionsMissed: 5,
        effectiveness: 82,
        active: true,
      },
    ],
    camhsReferral: {
      status: "active_treatment",
      referralDate: "2025-11-01",
      acceptedDate: "2025-12-15",
      firstAppointment: "2026-01-10",
      lastAppointment: "2026-05-08",
      nextAppointment: "2026-06-05",
      tier: 3,
      clinician: "Dr Emily Carter",
      diagnosis: ["Complex PTSD", "Attachment disorder"],
    },
    crisisEvents: [
      {
        id: "crisis-alex-01",
        date: "2026-05-14T20:30:00Z",
        trigger: "Phone contact with birth mum ended unexpectedly",
        severity: "moderate",
        interventionUsed: "PACE approach — co-regulation with key worker",
        deEscalationTime: 25,
        outcome: "Settled after 1:1 time. Requested hot chocolate and quiet time in room.",
        followUpCompleted: true,
      },
      {
        id: "crisis-alex-02",
        date: "2026-04-20T19:00:00Z",
        trigger: "Peer conflict at school",
        severity: "low",
        interventionUsed: "Emotional coaching — naming feelings",
        deEscalationTime: 15,
        outcome: "Talked through feelings, identified trigger, chose coping strategy",
        followUpCompleted: true,
      },
    ],
    sdqScore: 18,
    sdqDate: "2026-04-01",
    safetyPlanInPlace: true,
    safetyPlanReviewDate: "2026-06-01",
    therapeuticGoals: [
      "Develop co-regulation strategies for contact days",
      "Build secure attachment with key worker",
      "Process early trauma through life story work",
      "Increase tolerance of positive feedback",
    ],
    protectiveFactors: ["Strong key-worker relationship", "Engaged with CAMHS", "Enjoys football", "Good peer in home"],
    riskFactors: ["Early trauma history", "Attachment disruption", "Birth family contact triggers"],
    keyRelationships: ["Key worker: Sarah", "CAMHS: Dr Carter", "Football coach: Dave", "Best friend: Jordan"],
    lastTherapeuticReview: "2026-05-01",
    nextTherapeuticReview: "2026-06-01",
  },
  {
    childId: "child-jordan",
    childName: "Jordan",
    primaryModel: "pace",
    secondaryModels: ["art_therapy"],
    emotionalRegulationLevel: "established",
    mentalHealthStatus: "stable",
    wellbeingScores: [
      { domain: "emotional_regulation", score: 80, trend: "stable", lastAssessed: "2026-05-10", targetScore: 85 },
      { domain: "attachment_security", score: 78, trend: "improving", lastAssessed: "2026-05-10", targetScore: 85 },
      { domain: "self_esteem", score: 75, trend: "improving", lastAssessed: "2026-05-10", targetScore: 80 },
      { domain: "peer_relationships", score: 82, trend: "stable", lastAssessed: "2026-05-10", targetScore: 85 },
      { domain: "trauma_recovery", score: 72, trend: "improving", lastAssessed: "2026-05-10", targetScore: 80 },
      { domain: "anxiety_management", score: 76, trend: "stable", lastAssessed: "2026-05-10", targetScore: 80 },
      { domain: "resilience", score: 84, trend: "stable", lastAssessed: "2026-05-10", targetScore: 85 },
      { domain: "identity", score: 78, trend: "improving", lastAssessed: "2026-05-10", targetScore: 85 },
    ],
    interventions: [
      {
        id: "int-jordan-01",
        type: "creative_therapy",
        provider: "Maria Chen (Art Therapist)",
        startDate: "2025-09-01",
        frequency: "weekly",
        sessionsAttended: 32,
        sessionsMissed: 3,
        effectiveness: 85,
        childFeedback: 90,
        active: true,
      },
      {
        id: "int-jordan-02",
        type: "emotional_coaching",
        provider: "Chamberlain House Staff",
        startDate: "2025-06-01",
        frequency: "weekly",
        sessionsAttended: 40,
        sessionsMissed: 2,
        effectiveness: 80,
        active: true,
      },
    ],
    camhsReferral: {
      status: "discharged",
      referralDate: "2024-09-01",
      acceptedDate: "2024-10-15",
      firstAppointment: "2024-11-01",
      lastAppointment: "2026-03-15",
      tier: 2,
      clinician: "Dr James Wright",
    },
    crisisEvents: [],
    sdqScore: 12,
    sdqDate: "2026-04-15",
    safetyPlanInPlace: false,
    therapeuticGoals: [
      "Continue art therapy for emotional expression",
      "Strengthen identity work around heritage",
      "Build independence in emotional regulation",
    ],
    protectiveFactors: ["Strong sense of identity", "Good school attendance", "Boxing achievement", "Multiple positive relationships"],
    riskFactors: ["Previous placement breakdown", "Low confidence in academic ability"],
    keyRelationships: ["Key worker: Marcus", "Art therapist: Maria", "Boxing coach: Trevor"],
    lastTherapeuticReview: "2026-05-05",
    nextTherapeuticReview: "2026-06-05",
  },
  {
    childId: "child-morgan",
    childName: "Morgan",
    primaryModel: "pace",
    secondaryModels: ["dyadic_developmental_psychotherapy", "narrative_therapy"],
    emotionalRegulationLevel: "developing",
    mentalHealthStatus: "monitoring",
    wellbeingScores: [
      { domain: "emotional_regulation", score: 62, trend: "stable", lastAssessed: "2026-05-10", targetScore: 75 },
      { domain: "attachment_security", score: 55, trend: "improving", lastAssessed: "2026-05-10", targetScore: 70 },
      { domain: "self_esteem", score: 58, trend: "stable", lastAssessed: "2026-05-10", targetScore: 70 },
      { domain: "peer_relationships", score: 65, trend: "improving", lastAssessed: "2026-05-10", targetScore: 75 },
      { domain: "trauma_recovery", score: 50, trend: "stable", lastAssessed: "2026-05-10", targetScore: 65 },
      { domain: "anxiety_management", score: 55, trend: "improving", lastAssessed: "2026-05-10", targetScore: 70 },
      { domain: "resilience", score: 60, trend: "stable", lastAssessed: "2026-05-10", targetScore: 75 },
      { domain: "identity", score: 72, trend: "improving", lastAssessed: "2026-05-10", targetScore: 80 },
    ],
    interventions: [
      {
        id: "int-morgan-01",
        type: "individual_therapy",
        provider: "Dr Sarah Mitchell",
        startDate: "2026-02-01",
        frequency: "weekly",
        sessionsAttended: 14,
        sessionsMissed: 1,
        effectiveness: 72,
        childFeedback: 65,
        active: true,
      },
      {
        id: "int-morgan-02",
        type: "life_story_work",
        provider: "Key Worker (Lisa)",
        startDate: "2026-03-01",
        frequency: "fortnightly",
        sessionsAttended: 5,
        sessionsMissed: 0,
        effectiveness: 76,
        childFeedback: 70,
        active: true,
      },
    ],
    camhsReferral: {
      status: "active_treatment",
      referralDate: "2025-12-01",
      acceptedDate: "2026-01-15",
      firstAppointment: "2026-02-01",
      lastAppointment: "2026-05-10",
      nextAppointment: "2026-05-24",
      tier: 3,
      clinician: "Dr Emily Carter",
      diagnosis: ["Anxiety disorder", "Reactive attachment"],
    },
    crisisEvents: [
      {
        id: "crisis-morgan-01",
        date: "2026-05-08T22:00:00Z",
        trigger: "Nightmare — flashback to previous placement",
        severity: "moderate",
        interventionUsed: "DDP — empathic containment, grounding techniques",
        deEscalationTime: 35,
        outcome: "Settled with weighted blanket and audiobook. Discussed in therapy next session.",
        followUpCompleted: true,
      },
    ],
    sdqScore: 22,
    sdqDate: "2026-04-01",
    safetyPlanInPlace: true,
    safetyPlanReviewDate: "2026-06-15",
    therapeuticGoals: [
      "Process trauma from previous placement through narrative therapy",
      "Develop night-time anxiety coping strategies",
      "Build sense of belonging at Chamberlain House",
      "Strengthen cultural identity connection",
    ],
    protectiveFactors: ["Engaged with therapy", "Growing trust in key worker", "Cultural activities", "Creative writing"],
    riskFactors: ["Complex trauma history", "Night-time anxiety", "Previous placement abuse", "Low baseline attachment security"],
    keyRelationships: ["Key worker: Lisa", "CAMHS: Dr Carter", "Therapist: Dr Mitchell", "Cultural mentor: Aunty Grace"],
    lastTherapeuticReview: "2026-05-01",
    nextTherapeuticReview: "2026-06-01",
  },
  {
    childId: "child-sam",
    childName: "Sam",
    primaryModel: "pace",
    secondaryModels: ["dialectical_behaviour_therapy", "sensory_integration"],
    emotionalRegulationLevel: "emerging",
    mentalHealthStatus: "improving",
    wellbeingScores: [
      { domain: "emotional_regulation", score: 55, trend: "improving", lastAssessed: "2026-05-10", targetScore: 70 },
      { domain: "attachment_security", score: 50, trend: "improving", lastAssessed: "2026-05-10", targetScore: 65 },
      { domain: "self_esteem", score: 52, trend: "stable", lastAssessed: "2026-05-10", targetScore: 65 },
      { domain: "peer_relationships", score: 48, trend: "improving", lastAssessed: "2026-05-10", targetScore: 65 },
      { domain: "trauma_recovery", score: 45, trend: "improving", lastAssessed: "2026-05-10", targetScore: 60 },
      { domain: "anxiety_management", score: 50, trend: "stable", lastAssessed: "2026-05-10", targetScore: 65 },
      { domain: "resilience", score: 55, trend: "improving", lastAssessed: "2026-05-10", targetScore: 70 },
      { domain: "identity", score: 58, trend: "stable", lastAssessed: "2026-05-10", targetScore: 70 },
    ],
    interventions: [
      {
        id: "int-sam-01",
        type: "individual_therapy",
        provider: "Dr Sarah Mitchell",
        startDate: "2025-10-01",
        frequency: "twice_weekly",
        sessionsAttended: 55,
        sessionsMissed: 8,
        effectiveness: 70,
        childFeedback: 60,
        active: true,
      },
      {
        id: "int-sam-02",
        type: "sensory_regulation",
        provider: "Chamberlain House Staff",
        startDate: "2025-11-01",
        frequency: "daily",
        sessionsAttended: 140,
        sessionsMissed: 15,
        effectiveness: 75,
        active: true,
      },
      {
        id: "int-sam-03",
        type: "outdoor_therapy",
        provider: "Wilderness Works CIC",
        startDate: "2026-03-01",
        frequency: "weekly",
        sessionsAttended: 10,
        sessionsMissed: 1,
        effectiveness: 82,
        childFeedback: 85,
        active: true,
      },
    ],
    camhsReferral: {
      status: "active_treatment",
      referralDate: "2025-08-01",
      acceptedDate: "2025-09-15",
      firstAppointment: "2025-10-01",
      lastAppointment: "2026-05-14",
      nextAppointment: "2026-05-28",
      tier: 3,
      clinician: "Dr Emily Carter",
      diagnosis: ["Complex PTSD", "ADHD", "Attachment disorder"],
    },
    crisisEvents: [
      {
        id: "crisis-sam-01",
        date: "2026-05-15T19:30:00Z",
        trigger: "Overwhelm after difficult school day and missed snack routine",
        severity: "moderate",
        interventionUsed: "Sensory regulation — weighted blanket, reduced stimulation, PACE approach",
        deEscalationTime: 40,
        outcome: "Used sensory room, calmed with key worker present. Identified need for transition routine from school.",
        followUpCompleted: true,
      },
      {
        id: "crisis-sam-02",
        date: "2026-05-10T20:00:00Z",
        trigger: "Refused bedtime — escalated when boundary set",
        severity: "low",
        interventionUsed: "DBT distress tolerance — TIPP technique",
        deEscalationTime: 20,
        outcome: "Used cold water on face (TIPP), regulated within 20 mins. Chose to go to bed with audiobook.",
        followUpCompleted: true,
      },
      {
        id: "crisis-sam-03",
        date: "2026-04-28T17:00:00Z",
        trigger: "Peer conflict with Alex over game console",
        severity: "moderate",
        interventionUsed: "Separation, individual PACE conversation, repair work",
        deEscalationTime: 30,
        outcome: "Both children regulated separately, then facilitated repair conversation next day.",
        followUpCompleted: true,
      },
    ],
    sdqScore: 26,
    sdqDate: "2026-04-01",
    safetyPlanInPlace: true,
    safetyPlanReviewDate: "2026-05-28",
    therapeuticGoals: [
      "Develop self-regulation strategies using DBT skills",
      "Build tolerance for unexpected change",
      "Strengthen secure base with key worker",
      "Use outdoor therapy for confidence and achievement",
      "Process trauma at child-led pace",
    ],
    protectiveFactors: ["Responds well to outdoor therapy", "Key worker relationship growing", "Good sense of humour", "Creative problem solver"],
    riskFactors: ["Complex trauma", "ADHD impacts regulation", "Multiple previous placements", "School transition difficulties"],
    keyRelationships: ["Key worker: Tom", "CAMHS: Dr Carter", "Therapist: Dr Mitchell", "Wilderness Works: Jake"],
    lastTherapeuticReview: "2026-05-01",
    nextTherapeuticReview: "2026-06-01",
  },
];

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "dashboard";

  if (mode === "dashboard") {
    const compliance = evaluateTherapeuticCompliance(DEMO_PROFILES, DEMO_CONFIG, NOW);
    const metrics = calculateHomeTherapeuticMetrics(DEMO_PROFILES, DEMO_CONFIG, NOW);
    return NextResponse.json({ compliance, metrics, profiles: DEMO_PROFILES, config: DEMO_CONFIG });
  }

  if (mode === "metrics") {
    const metrics = calculateHomeTherapeuticMetrics(DEMO_PROFILES, DEMO_CONFIG, NOW);
    return NextResponse.json(metrics);
  }

  if (mode === "child") {
    const childId = searchParams.get("childId");
    if (childId) {
      const profile = DEMO_PROFILES.find((p) => p.childId === childId);
      if (profile) return NextResponse.json(profile);
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    return NextResponse.json(DEMO_PROFILES);
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "evaluate") {
    const profiles = body.profiles as ChildTherapeuticProfile[];
    const config = body.config as HomeTherapeuticConfig;
    if (!profiles || !config) {
      return NextResponse.json({ error: "Missing profiles or config" }, { status: 400 });
    }
    const result = evaluateTherapeuticCompliance(profiles, config, body.now ?? NOW);
    return NextResponse.json(result);
  }

  if (action === "metrics") {
    const profiles = body.profiles as ChildTherapeuticProfile[];
    const config = body.config as HomeTherapeuticConfig;
    if (!profiles || !config) {
      return NextResponse.json({ error: "Missing profiles or config" }, { status: 400 });
    }
    const result = calculateHomeTherapeuticMetrics(profiles, config, body.now ?? NOW);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
