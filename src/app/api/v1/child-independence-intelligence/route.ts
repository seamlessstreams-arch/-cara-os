import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  computeChildIndependenceIntelligence,
  type ChildIndependenceInput,
  type IndependenceSkillsRecordInput,
  type SkillInput,
  type PathwayPlanInput,
} from "@/lib/engines/child-independence-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const child = store.youngPeople.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";
  const childAge = (child as any).age ?? 17;

  // ── Independence Skills Records ───────────────────────────────────────
  const independence_records: IndependenceSkillsRecordInput[] = (store.independenceSkillsRecords ?? [])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      review_date: (r.review_date ?? r.date ?? "").slice(0, 10),
      overall_readiness: r.overall_readiness ?? 0,
      skills: (r.skills ?? []).map((s: any): SkillInput => ({
        id: s.id,
        name: s.name ?? "Unknown",
        category: s.category ?? "other",
        proficiency: s.proficiency ?? "not_started",
        last_assessed: (s.last_assessed ?? "").slice(0, 10),
        next_step: s.next_step ?? "",
      })),
      strengths: r.strengths ?? [],
      areas_for_development: r.areas_for_development ?? [],
      child_view: r.child_view ?? r.child_voice ?? "",
      pathway_notes: r.pathway_notes ?? "",
    }));

  // ── Pathway Plan ──────────────────────────────────────────────────────
  const ppRecords = (store.pathwayPlans ?? []).filter((p: any) => p.child_id === childId);
  let pathway_plan: PathwayPlanInput | null = null;
  if (ppRecords.length > 0) {
    const sorted = [...ppRecords].sort(
      (a: any, b: any) =>
        new Date(b.last_review_date ?? b.date ?? "").getTime() -
        new Date(a.last_review_date ?? a.date ?? "").getTime(),
    );
    const p = sorted[0] as any;
    pathway_plan = {
      id: p.id,
      status: p.status ?? "active_16_18",
      plan_version: p.plan_version ?? "1.0",
      last_review_date: (p.last_review_date ?? p.date ?? "").slice(0, 10),
      next_review_date: (p.next_review_date ?? "").slice(0, 10),
      personal_advisor: p.personal_advisor ?? "",
      accommodation: p.accommodation ?? "",
      education_employment_training: p.education_employment_training ?? "",
      health_needs: p.health_needs ?? [],
      financial_support: p.financial_support ?? [],
      support_network: p.support_network ?? [],
      aspirations: p.aspirations ?? [],
      risks: p.risks ?? [],
      independent_living_skills: p.independent_living_skills ?? {},
    };
  }

  const engineInput: ChildIndependenceInput = {
    today,
    child_id: childId,
    child_name: childName,
    child_age: childAge,
    independence_records,
    pathway_plan,
  };

  const result = computeChildIndependenceIntelligence(engineInput);
  return NextResponse.json({ data: result });
}
