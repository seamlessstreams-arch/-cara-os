import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { ensureUploadedDocument } from "../ensure";

// GET /api/v1/doc-intelligence/:docId
export async function GET(_req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const doc = await ensureUploadedDocument(docId);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const auditLog = db.documentAuditLog.findByDocument(docId);
  return NextResponse.json({ data: doc, audit_log: auditLog });
}

// PATCH /api/v1/doc-intelligence/:docId — update status, approvals, etc.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  // Document action: the actor is the authenticated caller; reject an
  // unresolved session rather than attribute the audit entry to a seed default.
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const { actor_id: _bodyActorId, ...updates } = body;
  const actor_id = identity.userId;

  // Rehydrate first so a patch works on a lambda that never saw the upload.
  if (!(await ensureUploadedDocument(docId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = db.uploadedDocuments.patch(docId, updates);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.documentAuditLog.append({
    id: generateId("dal"),
    document_id: docId,
    action: "document_updated",
    actor_id,
    timestamp: new Date().toISOString(),
    details: `Document updated: ${JSON.stringify(Object.keys(updates))}`,
    ai_confidence: null,
  });

  return NextResponse.json({ data: updated });
}
