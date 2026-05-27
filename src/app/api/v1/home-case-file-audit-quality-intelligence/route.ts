import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeCaseFileAuditQuality,
  type CaseFileAuditInput,
  type HandoverAuditInput,
  type PolicyReviewInput,
  type OfstedEngagementInput,
} from "@/lib/engines/home-case-file-audit-quality-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? store.youngPeople ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Case file audits
  const rawAudits = (store.caseFileAudits as any[] ?? []);
  const case_file_audits: CaseFileAuditInput[] = rawAudits.map((a: any) => ({
    id: a.id ?? "",
    child_id: a.child_id ?? "",
    date: (a.audit_date ?? today).toString().slice(0, 10),
    overall_rag: a.overall_rag_rating ?? "amber",
    overall_score: a.overall_score ?? 50,
    gaps_found: (a.gaps_identified ?? []).length,
    child_contributed: !!(a.child_contributed_to_audit),
  }));

  // Handover audits
  const rawHandoverAudits = (store.handoverAudits as any[] ?? []);
  const handover_audits: HandoverAuditInput[] = rawHandoverAudits.map((h: any) => ({
    id: h.id ?? "",
    date: (h.audit_date ?? today).toString().slice(0, 10),
    quality_score: h.overall_score ?? 50,
    actions_completed: (h.gaps_identified ?? []).length === 0,
    issues_found: (h.gaps_identified ?? []).length,
  }));

  // Policy reviews
  const rawPolicies = (store.policyReviewRecords as any[] ?? []);
  const policy_reviews: PolicyReviewInput[] = rawPolicies.map((p: any) => ({
    id: p.id ?? "",
    policy_name: p.title ?? "",
    last_reviewed: (p.last_review_date ?? "").toString().slice(0, 10),
    is_current: p.status === "current" || p.status === "approved",
    staff_aware: p.staff_total > 0 ? (p.staff_signed / p.staff_total) >= 0.8 : false,
  }));

  // Ofsted engagement records
  const rawOfsted = (store.ofstedEngagementRecords as any[] ?? []);
  const ofsted_engagement: OfstedEngagementInput[] = rawOfsted.map((o: any) => {
    const actions = (o.actions_agreed ?? []) as any[];
    const resolved = actions.filter((a: any) => a.status === "completed" || a.completed).length;
    return {
      id: o.id ?? "",
      date: (o.date ?? today).toString().slice(0, 10),
      type: o.engagement_type ?? "self_evaluation",
      completed: o.engagement_status === "completed" || o.engagement_status === "closed",
      actions_arising: actions.length,
      actions_resolved: resolved,
    };
  });

  const result = computeCaseFileAuditQuality({
    today,
    total_children: (children as any[]).length,
    case_file_audits,
    handover_audits,
    policy_reviews,
    ofsted_engagement,
  });

  return NextResponse.json({ data: result });
}
