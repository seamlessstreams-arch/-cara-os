import { NextResponse } from "next/server";
import {
  generateCreativeArtsExpressionIntelligence,
  getArtFormLabel,
  getExpressionLevelLabel,
  getRatingLabel,
} from "@/lib/creative-arts-expression";
import type {
  ArtsSession,
  CreativeArtsPolicy,
  StaffCreativeArtsTraining,
} from "@/lib/creative-arts-expression";

const DEMO_SESSIONS: ArtsSession[] = [
  { id: "as-1", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-01", artForm: "visual_art", expressionLevel: "highly_expressive", creativityDemonstrated: true, confidenceGrown: true, therapeuticBenefit: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "as-2", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-15", artForm: "music", expressionLevel: "expressive", creativityDemonstrated: true, confidenceGrown: true, therapeuticBenefit: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "as-3", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-10", artForm: "creative_writing", expressionLevel: "highly_expressive", creativityDemonstrated: true, confidenceGrown: true, therapeuticBenefit: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "as-4", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-05", artForm: "drama", expressionLevel: "highly_expressive", creativityDemonstrated: true, confidenceGrown: true, therapeuticBenefit: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "as-5", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-20", artForm: "dance", expressionLevel: "expressive", creativityDemonstrated: true, confidenceGrown: true, therapeuticBenefit: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "as-6", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-15", artForm: "photography", expressionLevel: "highly_expressive", creativityDemonstrated: true, confidenceGrown: true, therapeuticBenefit: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "as-7", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-03-12", artForm: "craft_design", expressionLevel: "expressive", creativityDemonstrated: true, confidenceGrown: true, therapeuticBenefit: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "as-8", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-20", artForm: "digital_media", expressionLevel: "highly_expressive", creativityDemonstrated: true, confidenceGrown: true, therapeuticBenefit: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
];

const DEMO_POLICY: CreativeArtsPolicy = {
  id: "cap-1", artsEducationStrategy: true, therapeuticArtsFramework: true, resourceProvisionPlan: true, externalPartnerships: true, exhibitionAndShowcasePolicy: true, inclusiveAccessGuidance: true, regularReview: true,
};

const DEMO_TRAINING: StaffCreativeArtsTraining[] = [
  { id: "cat-1", staffId: "staff-sarah", staffName: "Sarah Johnson", artsFacilitation: true, therapeuticArtsAwareness: true, creativeConfidenceBuilding: true, inclusivePractice: true, culturalArtsForms: true, safeguardingInArts: true },
  { id: "cat-2", staffId: "staff-tom", staffName: "Tom Richards", artsFacilitation: true, therapeuticArtsAwareness: true, creativeConfidenceBuilding: true, inclusivePractice: true, culturalArtsForms: true, safeguardingInArts: true },
  { id: "cat-3", staffId: "staff-lisa", staffName: "Lisa Williams", artsFacilitation: true, therapeuticArtsAwareness: true, creativeConfidenceBuilding: true, inclusivePractice: true, culturalArtsForms: true, safeguardingInArts: true },
  { id: "cat-4", staffId: "staff-darren", staffName: "Darren Laville", artsFacilitation: true, therapeuticArtsAwareness: true, creativeConfidenceBuilding: true, inclusivePractice: true, culturalArtsForms: true, safeguardingInArts: true },
];

export async function GET() {
  const result = generateCreativeArtsExpressionIntelligence(
    DEMO_SESSIONS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        artFormLabels: Object.fromEntries(
          (["visual_art", "music", "drama", "dance", "creative_writing", "photography", "craft_design", "digital_media"] as const).map((t) => [t, getArtFormLabel(t)]),
        ),
        expressionLevelLabels: Object.fromEntries(
          (["highly_expressive", "expressive", "moderate", "limited", "disengaged"] as const).map((e) => [e, getExpressionLevelLabel(e)]),
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

  const { sessions, policy, training, homeId, periodStart, periodEnd } = body as {
    sessions?: ArtsSession[]; policy?: CreativeArtsPolicy | null; training?: StaffCreativeArtsTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateCreativeArtsExpressionIntelligence(
    sessions ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
