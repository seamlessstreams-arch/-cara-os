import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeAnnualHealthAssessment } from "@/lib/engines/home-annual-health-assessment-intelligence-engine";
import type { AnnualHealthAssessmentRecordInput } from "@/lib/engines/home-annual-health-assessment-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore();
    const raw = store.annualHealthAssessments as any[];
    const total_children = (store.youngPeople ?? []).length;

    const assessments: AnnualHealthAssessmentRecordInput[] = raw.map((a: any) => ({
      id: a.id,
      child_id: a.child_id,
      completed_within_deadline: !!a.completed_within_deadline,
      domain_count: Array.isArray(a.domains) ? a.domains.length : 0,
      immunisations_up_to_date: !!a.immunisations_up_to_date,
      dental_check_up_to_date: !!a.dental_check_up_to_date,
      optical_check_up_to_date: !!a.optical_check_up_to_date,
      has_child_contribution: !!(a.child_contribution && a.child_contribution.trim().length > 0),
      report_shared: !!a.report_shared,
      report_shared_with_count: Array.isArray(a.report_shared_with) ? a.report_shared_with.length : 0,
      recommendation_count: Array.isArray(a.recommendations) ? a.recommendations.length : 0,
      signed_off_by_la: !!a.signed_off_by_la,
      growth_on_track: !!a.growth_on_track,
    }));

    const result = computeAnnualHealthAssessment({ today: new Date().toISOString().slice(0, 10), total_children, assessments });
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
