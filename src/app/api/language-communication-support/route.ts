// ==============================================================================
// API: /api/language-communication-support
//
// Language, Communication & Support Intelligence
//
// GET  — Returns communication support assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateLanguageCommunicationSupportIntelligence,
  getCommunicationNeedLabel,
  getSupportTypeLabel,
  getSupportQualityLabel,
  getReviewStatusLabel,
  getRatingLabel,
} from "@/lib/language-communication-support";
import type {
  ChildCommunicationProfile,
  CommunicationSupportSession,
  CommunicationAudit,
  StaffCommunicationTraining,
} from "@/lib/language-communication-support";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_PROFILES: ChildCommunicationProfile[] = [
  // Alex — no communication needs
  {
    id: "cp-1",
    childId: "child-alex",
    childName: "Alex",
    communicationNeed: "none",
    communicationPlanExists: false,
    planReviewStatus: "not_applicable",
    preferredCommunicationMethod: "Verbal",
    interpreterRequired: false,
    interpreterAvailable: false,
    augmentativeDeviceNeeded: false,
    augmentativeDeviceProvided: false,
  },
  // Jordan — English as additional language, interpreter required and available, plan current
  {
    id: "cp-2",
    childId: "child-jordan",
    childName: "Jordan",
    communicationNeed: "english_additional_language",
    communicationPlanExists: true,
    planReviewStatus: "current",
    preferredCommunicationMethod: "Verbal with interpreter support",
    interpreterRequired: true,
    interpreterAvailable: true,
    augmentativeDeviceNeeded: false,
    augmentativeDeviceProvided: false,
  },
  // Morgan — Autism spectrum, augmentative device needed and provided, plan current
  {
    id: "cp-3",
    childId: "child-morgan",
    childName: "Morgan",
    communicationNeed: "autism_spectrum",
    communicationPlanExists: true,
    planReviewStatus: "current",
    preferredCommunicationMethod: "AAC device with visual supports",
    interpreterRequired: false,
    interpreterAvailable: false,
    augmentativeDeviceNeeded: true,
    augmentativeDeviceProvided: true,
  },
];

const DEMO_SESSIONS: CommunicationSupportSession[] = [
  {
    id: "cs-1",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-04-10",
    supportType: "interpreter",
    quality: "excellent",
    childEngaged: true,
    childProgressNoted: true,
    facilitatedBy: "Sarah Johnson",
    duration: 60,
  },
  {
    id: "cs-2",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-01",
    supportType: "easy_read",
    quality: "good",
    childEngaged: true,
    childProgressNoted: true,
    facilitatedBy: "Lisa Williams",
    duration: 45,
  },
  {
    id: "cs-3",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-04-15",
    supportType: "augmentative_device",
    quality: "good",
    childEngaged: true,
    childProgressNoted: true,
    facilitatedBy: "Tom Richards",
    duration: 45,
  },
  {
    id: "cs-4",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-05",
    supportType: "social_stories",
    quality: "excellent",
    childEngaged: true,
    childProgressNoted: false,
    facilitatedBy: "Sarah Johnson",
    duration: 30,
  },
];

const DEMO_AUDITS: CommunicationAudit[] = [
  {
    id: "ca-1",
    auditDate: "2026-03-15",
    auditedBy: "Darren Laville",
    easyReadMaterialsAvailable: true,
    visualAidsPresent: true,
    signageAccessible: true,
    staffCommunicationAwareness: true,
    childViewsSoughtAccessibly: true,
  },
  {
    id: "ca-2",
    auditDate: "2026-05-10",
    auditedBy: "Sarah Johnson",
    easyReadMaterialsAvailable: true,
    visualAidsPresent: true,
    signageAccessible: true,
    staffCommunicationAwareness: true,
    childViewsSoughtAccessibly: true,
  },
];

const DEMO_TRAINING: StaffCommunicationTraining[] = [
  {
    id: "ct-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    communicationNeedsAwareness: true,
    signLanguageBasics: true,
    augmentativeDeviceTrained: true,
    easyReadTrained: true,
    autismCommunication: true,
    interpreterWorkingTrained: true,
  },
  {
    id: "ct-2",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    communicationNeedsAwareness: true,
    signLanguageBasics: true,
    augmentativeDeviceTrained: true,
    easyReadTrained: true,
    autismCommunication: true,
    interpreterWorkingTrained: false,
  },
  {
    id: "ct-3",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    communicationNeedsAwareness: true,
    signLanguageBasics: false,
    augmentativeDeviceTrained: false,
    easyReadTrained: true,
    autismCommunication: true,
    interpreterWorkingTrained: true,
  },
  {
    id: "ct-4",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    communicationNeedsAwareness: true,
    signLanguageBasics: true,
    augmentativeDeviceTrained: true,
    easyReadTrained: true,
    autismCommunication: true,
    interpreterWorkingTrained: true,
  },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateLanguageCommunicationSupportIntelligence(
    DEMO_PROFILES,
    DEMO_SESSIONS,
    DEMO_AUDITS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        communicationNeedLabels: Object.fromEntries(
          (["speech_delay", "english_additional_language", "hearing_impairment", "autism_spectrum", "selective_mutism", "learning_disability", "visual_impairment", "none"] as const).map(
            (n) => [n, getCommunicationNeedLabel(n)],
          ),
        ),
        supportTypeLabels: Object.fromEntries(
          (["speech_therapy", "interpreter", "augmentative_device", "visual_aids", "sign_language", "easy_read", "social_stories", "communication_passport"] as const).map(
            (t) => [t, getSupportTypeLabel(t)],
          ),
        ),
        supportQualityLabels: Object.fromEntries(
          (["excellent", "good", "adequate", "poor"] as const).map(
            (q) => [q, getSupportQualityLabel(q)],
          ),
        ),
        reviewStatusLabels: Object.fromEntries(
          (["current", "overdue", "not_applicable"] as const).map(
            (s) => [s, getReviewStatusLabel(s)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { profiles, sessions, audits, training, homeId, periodStart, periodEnd } = body as {
    profiles?: ChildCommunicationProfile[];
    sessions?: CommunicationSupportSession[];
    audits?: CommunicationAudit[];
    training?: StaffCommunicationTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateLanguageCommunicationSupportIntelligence(
    profiles ?? [],
    sessions ?? [],
    audits ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
