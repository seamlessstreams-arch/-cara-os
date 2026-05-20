import { NextResponse } from "next/server";
import {
  generateLocationAssessmentIntelligence,
  getCategoryLabel,
  getOutcomeLabel,
  getRatingLabel,
} from "@/lib/location-assessment";
import type {
  LocationAssessmentRecord,
  LocationPolicy,
  StaffLocationTraining,
} from "@/lib/location-assessment";

const DEMO_RECORDS: LocationAssessmentRecord[] = [
  { id: "la-1", childId: "child-alex", childName: "Alex", assessmentDate: "2026-03-01", category: "transport_links", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: true },
  { id: "la-2", childId: "child-alex", childName: "Alex", assessmentDate: "2026-03-15", category: "education_access", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: true },
  { id: "la-3", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", category: "health_services", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: false, mitigationsDocumented: false, documentationComplete: true, regulatoryAligned: true },
  { id: "la-4", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-15", category: "community_safety", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: true },
  { id: "la-5", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-03-05", category: "recreational_facilities", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: true },
  { id: "la-6", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-03-20", category: "cultural_diversity", thoroughAssessment: true, childViewIncorporated: false, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: true },
  { id: "la-7", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-10", category: "environmental_quality", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: true },
  { id: "la-8", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-20", category: "emergency_services", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: false, mitigationsDocumented: false, documentationComplete: true, regulatoryAligned: true },
  { id: "la-9", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-03-10", category: "transport_links", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: true },
  { id: "la-10", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-03-25", category: "health_services", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: false },
  { id: "la-11", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-05", category: "community_safety", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: true },
  { id: "la-12", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-18", category: "education_access", thoroughAssessment: false, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: false, regulatoryAligned: true },
];

const DEMO_POLICY: LocationPolicy = {
  id: "lp-1", locationAssessmentPolicy: true, communityRiskFramework: true, transportAccessPlan: true, serviceProximityGuidelines: true, environmentalSafetyProtocol: true, annualReviewSchedule: true, stakeholderConsultation: true,
};

const DEMO_STAFF: StaffLocationTraining[] = [
  { id: "lt-1", staffId: "staff-sarah", staffName: "Sarah Johnson", riskAssessmentSkills: true, communityMapping: true, safeguardingAwareness: true, regulatoryKnowledge: true, childConsultation: true, reportWriting: true },
  { id: "lt-2", staffId: "staff-tom", staffName: "Tom Richards", riskAssessmentSkills: true, communityMapping: true, safeguardingAwareness: true, regulatoryKnowledge: false, childConsultation: false, reportWriting: true },
  { id: "lt-3", staffId: "staff-lisa", staffName: "Lisa Williams", riskAssessmentSkills: true, communityMapping: false, safeguardingAwareness: true, regulatoryKnowledge: true, childConsultation: true, reportWriting: false },
  { id: "lt-4", staffId: "staff-darren", staffName: "Darren Laville", riskAssessmentSkills: true, communityMapping: true, safeguardingAwareness: true, regulatoryKnowledge: true, childConsultation: true, reportWriting: true },
];

export async function GET() {
  const result = generateLocationAssessmentIntelligence(
    DEMO_RECORDS, DEMO_POLICY, DEMO_STAFF, "oak-house", "2026-01-01", "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "location-assessment",
        version: "2.0.0",
      },
    },
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { records, policy, staff, homeId, periodStart, periodEnd } = body as {
    records?: LocationAssessmentRecord[]; policy?: LocationPolicy | null; staff?: StaffLocationTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateLocationAssessmentIntelligence(
    records ?? [], policy ?? null, staff ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
