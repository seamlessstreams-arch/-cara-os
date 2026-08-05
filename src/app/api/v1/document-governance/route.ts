// CARA — GET /api/v1/document-governance (Doc-Version-Workflow · Module 1)
//
// The cross-type document governance board: every governance document's review/
// expiry state in one place, projected read-only over the existing silos
// (home policies, policy review tracker, document expiry tracker, file
// documents), with honest per-source coverage (SoP/Children's Guide live only in
// the real database). Consolidation by projection — nothing is written.
import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { computeGovernanceBoard } from "@/lib/doc-governance/doc-governance-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const [documentsList, homePoliciesList, policyReviewRecordsList, trackedDocumentsList] = await Promise.all([dal.documents.findAll(), dal.homePolicies.findAll(), dal.policyReviewRecords.findAll(), dal.trackedDocuments.findAll()]);

  const board = computeGovernanceBoard({
    homePolicies: (homePoliciesList ?? []).map((p: any) => ({
      id: String(p.id),
      title: String(p.title ?? "Untitled policy"),
      version: p.version ?? null,
      owner_id: p.owner_id ?? null,
      next_review_date: p.next_review_date ?? null,
    })),
    policyReviews: (policyReviewRecordsList ?? []).map((r: any) => ({
      id: String(r.id),
      title: String(r.title ?? "Untitled review"),
      version: r.version ?? null,
      owner: r.owner ?? null,
      next_review_date: r.next_review_date ?? null,
    })),
    trackedDocuments: (trackedDocumentsList ?? []).map((t: any) => ({
      id: String(t.id),
      title: String(t.title ?? "Untitled document"),
      renewal_owner: t.renewal_owner ?? null,
      expiry_date: t.expiry_date ?? null,
      renewal_lead_time: typeof t.renewal_lead_time === "number" ? t.renewal_lead_time : null,
    })),
    fileDocuments: (documentsList ?? []).map((d: any) => ({
      id: String(d.id),
      title: String(d.title ?? d.file_name ?? "Untitled file"),
      version: typeof d.version === "number" ? d.version : null,
      expiry_date: d.expiry_date ?? null,
    })),
    nowIso: new Date().toISOString(),
  });

  return NextResponse.json({ data: board });
}
