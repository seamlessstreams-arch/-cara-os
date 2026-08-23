// CARA — GET /api/v1/compliance-oversight
// The compliance oversight picture: every compliance document Cara has read,
// joined to the tasks created from its actions, rated and ranked — so nothing
// rots in a folder and the panel/inspection view shows how we're doing.
import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { analyseComplianceOversight, COMPLIANCE_CATEGORIES, type OversightDoc, type OversightTask } from "@/lib/compliance/compliance-oversight-engine";
import { DOCUMENT_CATEGORY_LABELS, type UploadedDocument } from "@/types/documents";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dateByLabel(doc: UploadedDocument, label: string): string | null {
  return doc.ai_result?.extracted_entities?.dates?.find((d) => d.label === label)?.value ?? null;
}

export async function GET() {
  const [uploadedDocumentsList, tasksList] = await Promise.all([
    dal.uploadedDocuments.findAll(),
    dal.tasks.findAll(),
  ]);
  const today = todayStr();

  const complianceDocs: UploadedDocument[] = (uploadedDocumentsList ?? []).filter(
    (d: UploadedDocument) => d.document_category && COMPLIANCE_CATEGORIES.has(d.document_category),
  );
  const docIds = new Set(complianceDocs.map((d) => d.id));

  const documents: OversightDoc[] = complianceDocs.map((d) => ({
    id: d.id,
    title: d.upload_context || d.original_file_name,
    category: d.document_category!,
    category_label: DOCUMENT_CATEGORY_LABELS[d.document_category!],
    review_due: dateByLabel(d, "Review due"),
    expiry: dateByLabel(d, "Expiry"),
    risk_level: d.ai_risk_level ?? "low",
    status: d.document_status,
    actions_suggested: d.ai_result?.suggested_tasks?.length ?? 0,
    uploaded_at: d.uploaded_at,
  }));

  const tasks: OversightTask[] = (tasksList ?? [])
    .filter((t) => t.linked_document_id && docIds.has(t.linked_document_id))
    .map((t) => ({ id: t.id, linked_document_id: t.linked_document_id, status: t.status, due_date: t.due_date ?? null }));

  const result = analyseComplianceOversight({ today, documents, tasks });
  return NextResponse.json({ data: result });
}
