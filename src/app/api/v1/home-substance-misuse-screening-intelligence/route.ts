import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeSubstanceMisuseScreening } from "@/lib/engines/home-substance-misuse-screening-intelligence-engine";
import type { SubstanceScreeningRecordInput } from "@/lib/engines/home-substance-misuse-screening-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore();
    const raw = store.substanceScreenings as any[];
    const total_children = (store.youngPeople ?? []).length;

    const screenings: SubstanceScreeningRecordInput[] = raw.map((s: any) => ({
      id: s.id,
      child_id: s.child_id,
      screening_tool: s.screening_tool ?? "conversation_based",
      risk_level: s.risk_level ?? "no_identified_risk",
      substances_identified_count: Array.isArray(s.substances_identified) ? s.substances_identified.length : 0,
      has_harm_reduction: Array.isArray(s.harm_reduction_approach) && s.harm_reduction_approach.length > 0,
      professional_support_count: Array.isArray(s.professional_support_in_place) ? s.professional_support_in_place.length : 0,
      has_child_insight: !!(s.child_insight && s.child_insight.trim().length > 0),
      has_child_motivation: !!(s.child_motivation && s.child_motivation.trim().length > 0),
      warning_signs_count: Array.isArray(s.warning_signs_to_watch) ? s.warning_signs_to_watch.length : 0,
      shared_with_social_worker: !!s.shared_with_social_worker,
      shared_with_camhs: !!s.shared_with_camhs,
      child_authored: !!s.child_authored,
    }));

    const result = computeSubstanceMisuseScreening({ today: new Date().toISOString().slice(0, 10), total_children, screenings });
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
