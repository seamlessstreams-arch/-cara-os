// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 VISIT TRACKER (a projection of the persisted report)
//
// GET   ?homeId=&status=            → { ok, visits: Reg44VisitRow[], persisted }
// POST  { visitDate, visitorName, announced? }   → creates the month's A–Q report
// PATCH { id, manager_response? | ri_response? } → records the home's response
//
// There used to be two Regulation 44 records for one visit: the A–Q report and
// a separate reg44_visits row this route wrote. Since the fold a visit IS its
// report — this route reads and writes reg44_reports through reg44ReportsDb
// and serves the tracker's row shape via projectReg44Visit. Consumers:
// quality/reg-44 (page), manager-control-centre and provider-oversight
// (visit_date only).
//
// IDENTITY. Activated mode: the home is the SESSION's home and the actor the
// session's staff id — ?homeId= and any actorUserId in the body are ignored.
// Demo keeps the query/body convention.
//
// RESPONSES. Only manager_response / ri_response are writable here (allow-
// listed, not spread). The report belongs to the visitor; the response is the
// home's and is recorded beside it — never as an edit, even on a signed
// report, and always with an audit entry.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { readJsonBody } from "@/lib/http/read-json";
import { storageFailure, type StorageQueryError } from "@/lib/http/storage-error";
import { reg44ReportsDb, isSupabaseEnabled } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { assembleReg44DraftForHome } from "@/lib/reg44-report-intelligence/assemble-for-home";
import { createReg44Report, recordReg44Response, type Reg44ResponseRole } from "@/lib/reg44-report-intelligence/report-lifecycle";
import { projectReg44Visit } from "@/lib/reg44-report-intelligence/visit-projection";
import { REG44_REPORT_INTEL_VERSION } from "@/lib/reg44-report-intelligence/types";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";

export const dynamic = "force-dynamic";

function scope(identity: { userId: string; homeId: string | null; role: string }, requested: string | null | undefined, bodyActor: string | null) {
  if (isSupabaseEnabled()) return { homeId: identity.homeId ?? "", actor: identity.userId, role: identity.role, live: true };
  return { homeId: requested ? String(requested) : "", actor: bodyActor || identity.userId || "staff_unknown", role: identity.role, live: false };
}

const noHome = () => NextResponse.json({ error: "Your staff record has no home assigned." }, { status: 403 });

export async function GET(request: NextRequest) {
  try {
    const identity = await getRequestIdentity(request);
    if (identity instanceof NextResponse) return identity;
    const { searchParams } = new URL(request.url);
    const { homeId, live } = scope(identity, searchParams.get("homeId"), null);
    if (live && !homeId) return noHome();
    const status = searchParams.get("status");

    const reports = await reg44ReportsDb.findAll(homeId || undefined);
    let visits = reports.map(projectReg44Visit);
    if (status) visits = visits.filter((v) => v.status === status);
    visits.sort((a, b) => b.visit_date.localeCompare(a.visit_date));
    return NextResponse.json({ ok: true, visits, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/reg44] GET error:", err);
    return storageFailure("Regulation 44 reports", err as StorageQueryError);
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await getRequestIdentity(request);
    if (identity instanceof NextResponse) return identity;
    const jb = await readJsonBody(request); if (!jb.ok) return jb.response;
    const body = jb.data as Record<string, unknown>;
    const { homeId, actor, role, live } = scope(identity, body.homeId ? String(body.homeId) : null, body.actorUserId ? String(body.actorUserId) : null);
    if (live && !homeId) return noHome();
    if (!homeId) return NextResponse.json({ error: "homeId is required" }, { status: 400 });

    const visitDate = typeof body.visitDate === "string" ? body.visitDate.slice(0, 10) : "";
    const visitorName = typeof body.visitorName === "string" ? body.visitorName.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate) || !visitorName) {
      return NextResponse.json({ error: "visitDate (YYYY-MM-DD) and visitorName are required" }, { status: 400 });
    }
    const announced = typeof body.announced === "boolean" ? body.announced : body.visitType === "announced" ? true : body.visitType === "unannounced" ? false : undefined;
    const month = visitDate.slice(0, 7);

    const existing = await reg44ReportsDb.findByHomeMonth(homeId, month);
    if (existing) {
      return NextResponse.json(
        { error: `A Regulation 44 report for ${month} already exists for this home. Open it rather than starting another.`, visit: projectReg44Visit(existing) },
        { status: 409 },
      );
    }

    const { draft, sections } = await assembleReg44DraftForHome(homeId, month);
    draft.meta = { ...draft.meta, visitDate, visitorName, visitorIndependent: true, ...(announced === undefined ? {} : { announced }) };
    const now = new Date().toISOString();
    const report = createReg44Report({ id: generateId("r44rep"), homeId, month, draft, sections, engineVersion: REG44_REPORT_INTEL_VERSION, createdBy: actor, at: now });
    await reg44ReportsDb.create(report);

    await writeIntelligenceAudit({ homeId, entityType: "reg44_report", entityId: report.id, action: "record_created", actorUserId: actor, actorRole: role });
    return NextResponse.json({ ok: true, visit: projectReg44Visit(report), persisted: true }, { status: 201 });
  } catch (err) {
    console.error("[api/intelligence/reg44] POST error:", err);
    return storageFailure("Regulation 44 reports", err as StorageQueryError);
  }
}

const RESPONSE_FIELDS: Array<{ field: "manager_response" | "ri_response"; role: Reg44ResponseRole }> = [
  { field: "manager_response", role: "manager" },
  { field: "ri_response", role: "ri" },
];

export async function PATCH(request: NextRequest) {
  try {
    const identity = await getRequestIdentity(request);
    if (identity instanceof NextResponse) return identity;
    const jb = await readJsonBody(request); if (!jb.ok) return jb.response;
    const body = jb.data as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const { homeId, actor, role, live } = scope(identity, null, body.actorUserId ? String(body.actorUserId) : null);
    if (live && !homeId) return noHome();

    const responses = RESPONSE_FIELDS
      .map((r) => ({ ...r, text: typeof body[r.field] === "string" ? (body[r.field] as string).trim() : "" }))
      .filter((r) => r.text.length > 0);
    if (!responses.length) {
      return NextResponse.json({ error: `Provide at least one of: ${RESPONSE_FIELDS.map((r) => r.field).join(", ")}` }, { status: 400 });
    }

    let report = await reg44ReportsDb.findById(id);
    if (!report || (live && report.homeId !== homeId)) return NextResponse.json({ error: "not found" }, { status: 404 });

    const now = new Date().toISOString();
    for (const r of responses) {
      const out = recordReg44Response(report, { role: r.role, text: r.text, by: actor, at: now });
      if (!out.ok || !out.report) return NextResponse.json({ error: out.refusedReason }, { status: 422 });
      report = out.report;
    }
    await reg44ReportsDb.update(id, report);

    await writeIntelligenceAudit({ homeId: report.homeId, entityType: "reg44_report", entityId: id, action: "record_updated", actorUserId: actor, actorRole: role });
    return NextResponse.json({ ok: true, visit: projectReg44Visit(report), persisted: true });
  } catch (err) {
    console.error("[api/intelligence/reg44] PATCH error:", err);
    return storageFailure("Regulation 44 reports", err as StorageQueryError);
  }
}
