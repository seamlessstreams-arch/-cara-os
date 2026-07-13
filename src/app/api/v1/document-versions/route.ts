// CARA — /api/v1/document-versions (Doc-Version-Workflow · Module 2)
//
// The generic versioning spine's API. Ships DARK — no doc type consumes it yet.
//   GET  ?doc_type=&doc_id=  → { current, history } (read-only, always on)
//   POST                     → record a version (append-only + supersession),
//     triple-gated: flag doc_versioning_write (opt-in, default OFF → no-op) →
//     MANAGE_DOCUMENTS → planNewVersion (422 with named errors). The route
//     applies the PURE plan: supersede exactly the computed ids, create the row.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import {
  planNewVersion,
  getHistory,
  currentOf,
  type NewVersionInput,
} from "@/lib/doc-versioning/doc-versioning-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const docType = req.nextUrl.searchParams.get("doc_type");
  const docId = req.nextUrl.searchParams.get("doc_id");
  if (!docType || !docId) {
    return NextResponse.json({ error: "doc_type and doc_id are required" }, { status: 400 });
  }
  const all = db.documentVersions.findAll();
  return NextResponse.json({
    data: {
      doc_type: docType,
      doc_id: docId,
      current: currentOf(all, docType, docId),
      history: getHistory(all, docType, docId),
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled("doc_versioning_write")) {
    return NextResponse.json({
      data: { enabled: false, recorded: false, reason: "doc_versioning_write is disabled" },
    });
  }
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_DOCUMENTS);
  if (auth instanceof NextResponse) return auth;

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = (parsed.data ?? {}) as Partial<NewVersionInput>;

  const plan = planNewVersion(db.documentVersions.findByDoc(String(body.doc_type ?? ""), String(body.doc_id ?? "")), {
    doc_type: String(body.doc_type ?? ""),
    doc_id: String(body.doc_id ?? ""),
    version_label: body.version_label ?? null,
    content_snapshot: body.content_snapshot ?? null,
    change_summary: String(body.change_summary ?? ""),
    changed_by: auth.userId,
    nowIso: new Date().toISOString(),
  });
  if (!plan.ok) {
    return NextResponse.json({ error: "Version refused", blockers: plan.errors }, { status: 422 });
  }

  db.documentVersions.supersede(plan.supersede_ids);
  const version = db.documentVersions.create(plan.record);
  return NextResponse.json(
    { data: { enabled: true, recorded: true, version, superseded: plan.supersede_ids } },
    { status: 201 },
  );
}
