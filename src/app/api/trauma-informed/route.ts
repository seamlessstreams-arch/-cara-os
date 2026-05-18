// ══════════════════════════════════════════════════════════════════════════════
// Trauma-Informed Care Intelligence — API Route
// CHR 2015 Reg 6 (Quality of Care), Reg 10 (Positive Relationships),
// Reg 12 (Protection of Children)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateTraumaInformedIntelligence,
} from "@/lib/trauma-informed";
import type {
  TraumaTrainingRecord,
  TherapeuticInterventionRecord,
  EnvironmentalAdaptation,
  ConsultationRecord,
  TraumaScreening,
} from "@/lib/trauma-informed";

// ── Demo Data ────────────────────────────────────────────────────────────────

const REF_DATE = "2026-05-18T12:00:00Z";
const PERIOD_START = "2026-01-01T00:00:00Z";
const PERIOD_END = "2026-05-18T00:00:00Z";
const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];

const DEMO_TRAINING: TraumaTrainingRecord[] = [
  {
    id: "tr-01",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    trainingType: "Advanced Trauma-Informed Practice",
    completedDate: "2025-09-15",
    expiryDate: "2026-09-15",
    level: "specialist",
    provider: "Trauma Recovery Institute",
  },
  {
    id: "tr-02",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    trainingType: "PACE Model Practitioner",
    completedDate: "2025-06-20",
    expiryDate: "2026-06-20",
    level: "specialist",
    provider: "DDP Network",
  },
  {
    id: "tr-03",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    trainingType: "Trauma-Informed Care Level 3",
    completedDate: "2025-11-10",
    expiryDate: "2026-11-10",
    level: "responsive",
    provider: "National Trauma Training",
  },
  {
    id: "tr-04",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    trainingType: "Therapeutic Crisis Intervention",
    completedDate: "2026-01-05",
    expiryDate: "2027-01-05",
    level: "responsive",
    provider: "Cornell University (UK Licence)",
  },
  {
    id: "tr-05",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    trainingType: "Trauma-Informed Care Level 3",
    completedDate: "2025-10-01",
    expiryDate: "2026-10-01",
    level: "responsive",
    provider: "National Trauma Training",
  },
  {
    id: "tr-06",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    trainingType: "Sensory Integration Awareness",
    completedDate: "2026-02-15",
    expiryDate: "2027-02-15",
    level: "informed",
    provider: "Sensory Integration Education",
  },
  {
    id: "tr-07",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    trainingType: "Trauma-Informed Care Level 2",
    completedDate: "2026-03-01",
    expiryDate: "2027-03-01",
    level: "informed",
    provider: "National Trauma Training",
  },
  {
    id: "tr-08",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    trainingType: "ACE-Aware Approaches",
    completedDate: "2026-01-20",
    expiryDate: "2027-01-20",
    level: "informed",
    provider: "ACEs Hub Wales (adapted)",
  },
];

const DEMO_INTERVENTIONS: TherapeuticInterventionRecord[] = [
  {
    id: "int-01",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-01",
    interventionType: "therapeutic_parenting_session",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["safety", "trustworthiness", "empowerment"],
    practiceIndicators: ["therapeutic_parenting", "emotional_regulation_support", "strengths_based_language"],
    childResponse: "positive",
    durationMinutes: 45,
  },
  {
    id: "int-02",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-03",
    interventionType: "co_regulation_activity",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["safety", "collaboration"],
    practiceIndicators: ["co_regulation", "sensory_awareness"],
    childResponse: "positive",
    durationMinutes: 30,
  },
  {
    id: "int-03",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-06",
    interventionType: "life_story_work",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["trustworthiness", "empowerment", "cultural_sensitivity"],
    practiceIndicators: ["life_story_work", "safe_spaces"],
    childResponse: "neutral",
    durationMinutes: 60,
  },
  {
    id: "int-04",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-10",
    interventionType: "psychoeducation_session",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["empowerment", "choice"],
    practiceIndicators: ["psychoeducation", "strengths_based_language"],
    childResponse: "positive",
    durationMinutes: 40,
  },
  {
    id: "int-05",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-01",
    interventionType: "sensory_regulation",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["safety", "choice"],
    practiceIndicators: ["sensory_awareness", "safe_spaces", "emotional_regulation_support"],
    childResponse: "positive",
    durationMinutes: 25,
  },
  {
    id: "int-06",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-04",
    interventionType: "relationship_repair",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["trustworthiness", "collaboration", "empowerment"],
    practiceIndicators: ["relationship_repair", "co_regulation"],
    childResponse: "positive",
    durationMinutes: 35,
  },
  {
    id: "int-07",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-07",
    interventionType: "therapeutic_parenting_session",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["safety", "trustworthiness"],
    practiceIndicators: ["therapeutic_parenting", "predictable_routines"],
    childResponse: "neutral",
    durationMinutes: 45,
  },
  {
    id: "int-08",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-12",
    interventionType: "co_regulation_activity",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["collaboration", "safety"],
    practiceIndicators: ["co_regulation", "emotional_regulation_support"],
    childResponse: "positive",
    durationMinutes: 30,
  },
  {
    id: "int-09",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-02",
    interventionType: "therapeutic_parenting_session",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["safety", "empowerment", "cultural_sensitivity"],
    practiceIndicators: ["therapeutic_parenting", "strengths_based_language"],
    childResponse: "positive",
    durationMinutes: 50,
  },
  {
    id: "int-10",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-05",
    interventionType: "psychoeducation_session",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["empowerment", "choice", "trustworthiness"],
    practiceIndicators: ["psychoeducation", "emotional_regulation_support"],
    childResponse: "positive",
    durationMinutes: 40,
  },
  {
    id: "int-11",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-08",
    interventionType: "life_story_work",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["trustworthiness", "cultural_sensitivity"],
    practiceIndicators: ["life_story_work", "safe_spaces"],
    childResponse: "neutral",
    durationMinutes: 55,
  },
  {
    id: "int-12",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-11",
    interventionType: "sensory_regulation",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["safety", "choice"],
    practiceIndicators: ["sensory_awareness", "predictable_routines"],
    childResponse: "positive",
    durationMinutes: 25,
  },
  {
    id: "int-13",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-14",
    interventionType: "relationship_repair",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["collaboration", "trustworthiness"],
    practiceIndicators: ["relationship_repair", "co_regulation"],
    childResponse: "distressed",
    durationMinutes: 30,
    notes: "Morgan became distressed recalling peer conflict; session ended early with co-regulation support",
  },
  {
    id: "int-14",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-15",
    interventionType: "sensory_regulation",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["safety", "choice"],
    practiceIndicators: ["sensory_awareness", "predictable_routines"],
    childResponse: "positive",
    durationMinutes: 20,
  },
  {
    id: "int-15",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-16",
    interventionType: "life_story_work",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["trustworthiness", "cultural_sensitivity", "empowerment"],
    practiceIndicators: ["life_story_work", "strengths_based_language"],
    childResponse: "positive",
    durationMinutes: 50,
  },
  {
    id: "int-16",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-17",
    interventionType: "relationship_repair",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["collaboration", "trustworthiness", "empowerment"],
    practiceIndicators: ["relationship_repair", "strengths_based_language"],
    childResponse: "refused",
    notes: "Alex declined to engage; revisit next session with alternative approach",
    durationMinutes: 10,
  },
];

const DEMO_ADAPTATIONS: EnvironmentalAdaptation[] = [
  {
    id: "env-01",
    area: "Sensory Room",
    adaptation: "Dedicated calming space with weighted blankets, low lighting, and fidget tools",
    traumaPrinciple: "safety",
    implementedDate: "2025-09-01",
    reviewDate: "2026-09-01",
    status: "active",
  },
  {
    id: "env-02",
    area: "Communal Areas",
    adaptation: "Visual routine boards and consistent daily schedule displays",
    traumaPrinciple: "trustworthiness",
    implementedDate: "2025-10-15",
    reviewDate: "2026-04-15",
    status: "needs_review",
  },
  {
    id: "env-03",
    area: "Bedrooms",
    adaptation: "Personalised safe space boxes with self-selected comfort items",
    traumaPrinciple: "choice",
    implementedDate: "2026-01-10",
    reviewDate: "2026-07-10",
    status: "active",
    childSpecific: "child-alex",
  },
  {
    id: "env-04",
    area: "Garden",
    adaptation: "Outdoor therapeutic space with seating areas for 1:1 conversations",
    traumaPrinciple: "collaboration",
    implementedDate: "2026-02-01",
    reviewDate: "2026-08-01",
    status: "active",
  },
  {
    id: "env-05",
    area: "Kitchen",
    adaptation: "Cooking together programme supporting empowerment and life skills",
    traumaPrinciple: "empowerment",
    implementedDate: "2026-03-01",
    reviewDate: "2026-09-01",
    status: "active",
    childSpecific: "child-morgan",
  },
  {
    id: "env-06",
    area: "Quiet Room",
    adaptation: "Cultural identity display and resources reflecting diverse heritage",
    traumaPrinciple: "cultural_sensitivity",
    implementedDate: "2026-04-01",
    reviewDate: "2026-10-01",
    status: "active",
    childSpecific: "child-jordan",
  },
];

const DEMO_CONSULTATIONS: ConsultationRecord[] = [
  {
    id: "cons-01",
    date: "2026-02-15",
    consultantName: "Dr Emma Clarke",
    consultationType: "clinical_psychologist",
    childrenDiscussed: ["child-alex", "child-jordan"],
    recommendations: [
      "Increase co-regulation opportunities for Alex",
      "Introduce life story work for Jordan at pace they set",
    ],
    actionsAgreed: [
      "Sarah to lead co-regulation sessions with Alex 3x per week",
      "Begin life story work with Jordan once rapport established",
    ],
    actionsCompleted: true,
  },
  {
    id: "cons-02",
    date: "2026-03-20",
    consultantName: "Dr Emma Clarke",
    consultationType: "clinical_psychologist",
    childrenDiscussed: ["child-morgan", "child-alex"],
    recommendations: [
      "Morgan showing progress with PACE-based approaches",
      "Consider sensory assessment for Alex",
    ],
    actionsAgreed: [
      "Continue PACE approaches with Morgan",
      "Refer Alex for occupational therapy sensory assessment",
    ],
    actionsCompleted: true,
  },
  {
    id: "cons-03",
    date: "2026-04-25",
    consultantName: "Dr Aisha Patel",
    consultationType: "CAMHS",
    childrenDiscussed: ["child-jordan", "child-morgan"],
    recommendations: [
      "Jordan may benefit from EMDR referral",
      "Maintain current therapeutic approaches for Morgan",
    ],
    actionsAgreed: [
      "Discuss EMDR referral with Jordan's social worker",
      "Continue current plan for Morgan with 6-week review",
    ],
    actionsCompleted: false,
  },
];

const DEMO_SCREENINGS: TraumaScreening[] = [
  {
    id: "scr-01",
    childId: "child-alex",
    childName: "Alex",
    screeningDate: "2026-01-15",
    screenedBy: "Sarah Johnson",
    traumaHistoryDocumented: true,
    triggersIdentified: ["loud noises", "unexpected changes to routine", "physical proximity from unfamiliar adults"],
    copingStrategiesIdentified: ["sensory room access", "drawing", "listening to music"],
    therapeuticNeedsAssessed: true,
    referralMade: true,
    nextReviewDate: "2026-07-15",
  },
  {
    id: "scr-02",
    childId: "child-jordan",
    childName: "Jordan",
    screeningDate: "2026-02-01",
    screenedBy: "Sarah Johnson",
    traumaHistoryDocumented: true,
    triggersIdentified: ["arguments between peers", "feeling excluded"],
    copingStrategiesIdentified: ["talking to key worker", "physical activity", "journaling"],
    therapeuticNeedsAssessed: true,
    referralMade: true,
    nextReviewDate: "2026-08-01",
  },
  {
    id: "scr-03",
    childId: "child-morgan",
    childName: "Morgan",
    screeningDate: "2026-02-15",
    screenedBy: "Lisa Williams",
    traumaHistoryDocumented: true,
    triggersIdentified: ["discussions about family", "feeling controlled", "mealtimes"],
    copingStrategiesIdentified: ["cooking", "time alone in room", "walking in garden"],
    therapeuticNeedsAssessed: true,
    referralMade: false,
    nextReviewDate: "2026-08-15",
  },
];

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const intelligence = generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      DEMO_INTERVENTIONS,
      DEMO_ADAPTATIONS,
      DEMO_CONSULTATIONS,
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );

    return NextResponse.json(intelligence);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate trauma-informed intelligence" },
      { status: 500 }
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      training,
      interventions,
      adaptations,
      consultations,
      screenings,
      childIds,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    // Validation
    if (!homeId || typeof homeId !== "string") {
      return NextResponse.json(
        { error: "homeId is required and must be a string" },
        { status: 400 }
      );
    }
    if (!periodStart || typeof periodStart !== "string") {
      return NextResponse.json(
        { error: "periodStart is required and must be a date string" },
        { status: 400 }
      );
    }
    if (!periodEnd || typeof periodEnd !== "string") {
      return NextResponse.json(
        { error: "periodEnd is required and must be a date string" },
        { status: 400 }
      );
    }
    if (!referenceDate || typeof referenceDate !== "string") {
      return NextResponse.json(
        { error: "referenceDate is required and must be a date string" },
        { status: 400 }
      );
    }
    if (!Array.isArray(childIds)) {
      return NextResponse.json(
        { error: "childIds must be an array of strings" },
        { status: 400 }
      );
    }
    if (!Array.isArray(training)) {
      return NextResponse.json(
        { error: "training must be an array" },
        { status: 400 }
      );
    }
    if (!Array.isArray(interventions)) {
      return NextResponse.json(
        { error: "interventions must be an array" },
        { status: 400 }
      );
    }
    if (!Array.isArray(adaptations)) {
      return NextResponse.json(
        { error: "adaptations must be an array" },
        { status: 400 }
      );
    }
    if (!Array.isArray(consultations)) {
      return NextResponse.json(
        { error: "consultations must be an array" },
        { status: 400 }
      );
    }
    if (!Array.isArray(screenings)) {
      return NextResponse.json(
        { error: "screenings must be an array" },
        { status: 400 }
      );
    }

    const intelligence = generateTraumaInformedIntelligence(
      training,
      interventions,
      adaptations,
      consultations,
      screenings,
      childIds,
      homeId,
      periodStart,
      periodEnd,
      referenceDate
    );

    return NextResponse.json(intelligence);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
