import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeReg4445Evidence,
  type Reg44PackInput, type Reg44VisitReportInput, type Reg44ActionRecordInput,
  type Reg45EvidenceInput, type Reg46ReviewInput, type AnnexAEvidenceInput,
} from "@/lib/engines/home-reg4445-evidence-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const reg44_packs: Reg44PackInput[] = (store.reg44Packs as any[]).map((p: any) => ({
    id: p.id, month: p.month ?? "", visit_completed: !!(p.visit_completed),
    report_submitted: !!(p.report_submitted), children_spoken_to: p.children_spoken_to ?? 0,
    areas_covered: p.areas_covered ?? p.areas?.length ?? 0, actions_raised: p.actions_raised ?? 0,
  }));

  const reg44_visit_reports: Reg44VisitReportInput[] = (store.reg44VisitReports as any[]).map((r: any) => ({
    id: r.id, visit_date: (r.visit_date ?? "").toString().slice(0, 10),
    children_interviewed: r.children_interviewed ?? 0, staff_interviewed: r.staff_interviewed ?? 0,
    areas_inspected: r.areas_inspected ?? [], positive_findings: r.positive_findings ?? 0,
    concerns_raised: r.concerns_raised ?? 0, child_voice_included: !!(r.child_voice_included),
  }));

  const reg44_actions: Reg44ActionRecordInput[] = (store.reg44ActionRecords as any[]).map((a: any) => ({
    id: a.id, raised_date: (a.raised_date ?? "").toString().slice(0, 10),
    due_date: (a.due_date ?? "").toString().slice(0, 10),
    completed_date: (a.completed_date ?? "").toString().slice(0, 10),
    status: a.status ?? "open", priority: a.priority ?? "medium",
  }));

  const reg45_evidence: Reg45EvidenceInput[] = (store.reg45EvidenceQueue as any[]).map((e: any) => ({
    id: e.id, quality_area: e.quality_area ?? "", evidence_date: (e.evidence_date ?? "").toString().slice(0, 10),
    evidence_type: e.evidence_type ?? "", strength_of_evidence: e.strength_of_evidence ?? "adequate",
    child_voice_present: !!(e.child_voice_present), review_date: (e.review_date ?? "").toString().slice(0, 10),
  }));

  const reg46_reviews: Reg46ReviewInput[] = (store.reg46Reviews as any[]).map((r: any) => ({
    id: r.id, review_date: (r.review_date ?? "").toString().slice(0, 10),
    areas_reviewed: r.areas_reviewed ?? [], actions_raised: r.actions_raised ?? 0,
    actions_completed: r.actions_completed ?? 0, next_review_date: (r.next_review_date ?? "").toString().slice(0, 10),
  }));

  const annex_a_evidence: AnnexAEvidenceInput[] = (store.annexAEvidenceQueue as any[]).map((a: any) => ({
    id: a.id, standard_ref: a.standard_ref ?? "", evidence_present: !!(a.evidence_present),
    evidence_current: !!(a.evidence_current), last_updated: (a.last_updated ?? "").toString().slice(0, 10),
    gap_identified: !!(a.gap_identified),
  }));

  const result = computeHomeReg4445Evidence({
    today, reg44_packs, reg44_visit_reports, reg44_actions,
    reg45_evidence, reg46_reviews, annex_a_evidence,
    total_children: (store.youngPeople ?? []).filter((c: any) => c.status === "current").length,
  });

  return NextResponse.json({ data: result });
}
