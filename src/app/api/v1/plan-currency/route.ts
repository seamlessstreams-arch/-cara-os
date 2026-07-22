// ══════════════════════════════════════════════════════════════════════════════
// CARA — PLAN CURRENCY REGISTER API ROUTE
// GET /api/v1/plan-currency
//
// Scans the review date of every statutory child plan/assessment across every
// current child and classifies each Overdue / Due-soon / Current. CHR 2015 Reg 6
// + Quality Standards — plans reviewed and kept up to date. "Which child has an
// out-of-date plan?" on one screen.
//
// REGISTRY is verified against the seed: each entry's review-date field is the
// FORWARD-looking next-review field (NOT a completion/assessment-due field), to
// avoid falsely flagging completed plans as overdue.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { computePlanCurrency, type PlanRecordInput } from "@/lib/engines/plan-currency-engine";

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

const REGISTRY: { key: string; label: string; typeKey: string; reviewField: string; childField: string }[] = [
  { key: "lacReviews", label: "LAC Review", typeKey: "lac_review", reviewField: "next_review_date", childField: "child_id" },
  { key: "pathwayPlans", label: "Pathway Plan", typeKey: "pathway_plan", reviewField: "next_review_date", childField: "child_id" },
  { key: "pepRecords", label: "PEP", typeKey: "pep", reviewField: "next_review_date", childField: "child_id" },
  { key: "selfHarmSafetyPlanRecords", label: "Self-Harm Safety Plan", typeKey: "self_harm_safety_plan", reviewField: "next_review_date", childField: "child_id" },
  { key: "riskManagementPlanRecords", label: "Risk Management Plan", typeKey: "risk_management_plan", reviewField: "review_date", childField: "child_id" },
  { key: "attachmentProfiles", label: "Attachment Profile", typeKey: "attachment_profile", reviewField: "review_date", childField: "child_id" },
  { key: "behaviourSupportPlans", label: "Behaviour Support Plan", typeKey: "behaviour_support_plan", reviewField: "review_date", childField: "child_id" },
  { key: "multiDisciplinaryFormulations", label: "MDT Formulation", typeKey: "mdt_formulation", reviewField: "next_review_date", childField: "child_id" },
  { key: "exploitationScreenings", label: "Exploitation Screening", typeKey: "exploitation_screening", reviewField: "next_review_date", childField: "child_id" },
  { key: "dietaryPlans", label: "Dietary Plan", typeKey: "dietary_plan", reviewField: "next_review_date", childField: "child_id" },
  { key: "annualHealthAssessments", label: "Annual Health Assessment", typeKey: "annual_health_assessment", reviewField: "next_assessment_date", childField: "child_id" },
  { key: "culturalIdentityPlans", label: "Cultural Identity Plan", typeKey: "cultural_identity_plan", reviewField: "next_review", childField: "child_id" },
];

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const yp = ((await safeList(dal.youngPeople.findAll())) as any[]).filter((c) => c.status === "current");
  const children = yp.map((c) => ({
    id: String(c.id),
    name: c.preferred_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || String(c.id),
  }));
  const childName = new Map(children.map((c) => [c.id, c.name]));
  const childIds = new Set(children.map((c) => c.id));

  const plans: PlanRecordInput[] = [];
  for (const reg of REGISTRY) {
    const recs = (store as any)[reg.key];
    if (!Array.isArray(recs)) continue;
    for (const r of recs) {
      const child = r?.[reg.childField];
      if (!child || !childIds.has(String(child))) continue; // only plans for current children
      const raw = r?.[reg.reviewField];
      const review_date = raw && String(raw).trim() ? String(raw).slice(0, 10) : null;
      plans.push({
        id: `${reg.typeKey}-${r.id ?? plans.length}`,
        plan_type: reg.label,
        plan_type_key: reg.typeKey,
        child_id: String(child),
        child_name: childName.get(String(child)),
        review_date,
      });
    }
  }

  const plan_types = REGISTRY.map((r) => ({ key: r.typeKey, label: r.label }));
  const result = computePlanCurrency({ today, plans, children, plan_types });
  return NextResponse.json({ data: result });
}
