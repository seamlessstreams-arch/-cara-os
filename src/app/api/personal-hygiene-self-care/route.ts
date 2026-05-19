import { NextResponse } from "next/server";
import {
  generatePersonalHygieneSelfCareIntelligence,
  getHygieneAreaLabel,
  getSupportLevelLabel,
  getRatingLabel,
} from "@/lib/personal-hygiene-self-care";
import type {
  HygieneRecord,
  HygienePolicy,
  StaffHygieneTraining,
} from "@/lib/personal-hygiene-self-care";

const DEMO_RECORDS: HygieneRecord[] = [
  { id: "hr-1", childId: "child-alex", childName: "Alex", recordDate: "2026-04-01", hygieneArea: "bathing_showering", supportLevel: "independent", dignityMaintained: true, childChoiceRespected: true, appropriateProducts: true, privacyEnsured: true, staffSupportSensitive: true, documentedInPlan: true },
  { id: "hr-2", childId: "child-alex", childName: "Alex", recordDate: "2026-04-02", hygieneArea: "dental_care", supportLevel: "prompted", dignityMaintained: true, childChoiceRespected: true, appropriateProducts: true, privacyEnsured: true, staffSupportSensitive: true, documentedInPlan: true },
  { id: "hr-3", childId: "child-alex", childName: "Alex", recordDate: "2026-04-03", hygieneArea: "hair_care", supportLevel: "independent", dignityMaintained: true, childChoiceRespected: true, appropriateProducts: true, privacyEnsured: true, staffSupportSensitive: true, documentedInPlan: true },
  { id: "hr-4", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-01", hygieneArea: "bathing_showering", supportLevel: "prompted", dignityMaintained: true, childChoiceRespected: true, appropriateProducts: true, privacyEnsured: true, staffSupportSensitive: true, documentedInPlan: true },
  { id: "hr-5", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-02", hygieneArea: "skincare", supportLevel: "independent", dignityMaintained: true, childChoiceRespected: true, appropriateProducts: true, privacyEnsured: true, staffSupportSensitive: true, documentedInPlan: true },
  { id: "hr-6", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-03", hygieneArea: "dental_care", supportLevel: "independent", dignityMaintained: true, childChoiceRespected: true, appropriateProducts: true, privacyEnsured: true, staffSupportSensitive: true, documentedInPlan: true },
  { id: "hr-7", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-01", hygieneArea: "bathing_showering", supportLevel: "independent", dignityMaintained: true, childChoiceRespected: true, appropriateProducts: true, privacyEnsured: true, staffSupportSensitive: true, documentedInPlan: true },
  { id: "hr-8", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-02", hygieneArea: "nail_care", supportLevel: "independent", dignityMaintained: true, childChoiceRespected: true, appropriateProducts: true, privacyEnsured: true, staffSupportSensitive: true, documentedInPlan: true },
];

const DEMO_POLICY: HygienePolicy = {
  id: "hp-1",
  personalCarePolicy: true,
  dignityPrivacyGuidance: true,
  ageAppropriateSupport: true,
  culturalSensitivity: true,
  menstrualHygieneProvision: true,
  productAvailability: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffHygieneTraining[] = [
  { id: "ht-1", staffId: "staff-sarah", staffName: "Sarah Johnson", personalCareSupport: true, dignityInPractice: true, culturalAwareness: true, menstrualHealthAwareness: true, infectionControl: true, sensitiveConversations: true },
  { id: "ht-2", staffId: "staff-tom", staffName: "Tom Richards", personalCareSupport: true, dignityInPractice: true, culturalAwareness: true, menstrualHealthAwareness: true, infectionControl: true, sensitiveConversations: true },
  { id: "ht-3", staffId: "staff-lisa", staffName: "Lisa Williams", personalCareSupport: true, dignityInPractice: true, culturalAwareness: true, menstrualHealthAwareness: true, infectionControl: true, sensitiveConversations: true },
  { id: "ht-4", staffId: "staff-darren", staffName: "Darren Laville", personalCareSupport: true, dignityInPractice: true, culturalAwareness: true, menstrualHealthAwareness: true, infectionControl: true, sensitiveConversations: true },
];

export async function GET() {
  const result = generatePersonalHygieneSelfCareIntelligence(
    DEMO_RECORDS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        hygieneAreaLabels: Object.fromEntries(
          (["bathing_showering", "dental_care", "hair_care", "skincare", "nail_care", "clothing_cleanliness", "menstrual_hygiene", "handwashing"] as const).map((h) => [h, getHygieneAreaLabel(h)]),
        ),
        supportLevelLabels: Object.fromEntries(
          (["independent", "prompted", "assisted", "fully_supported", "refused"] as const).map((s) => [s, getSupportLevelLabel(s)]),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => [r, getRatingLabel(r)]),
        ),
      },
    },
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { records, policy, training, homeId, periodStart, periodEnd } = body as {
    records?: HygieneRecord[]; policy?: HygienePolicy | null; training?: StaffHygieneTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generatePersonalHygieneSelfCareIntelligence(
    records ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
