// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 PERSISTED REPORT API
// GET  ?home_id=&month=YYYY-MM                → the persisted A–Q report (or null)
// POST { action: "create" | "sign" | "addendum" | "edit", … }
//   create   → start a report from Cara's assembled evidence draft (persisted)
//   sign     → run the gate + LOCK on approval (named override required if blocked)
//   addendum → append a dated, named correction to a signed report
//   edit     → edit an unsigned draft (refused once locked)
//
//   edit_sections → edit the narrative of named A–Q sections (refused once locked)
//
// Reuses the assembly pipeline + the slice-2 gate + the lifecycle state machine.
//
// PERSISTENCE. Reports go through reg44ReportsDb — Supabase (reg44_reports +
// append-only reg44_report_audit) in activated mode, the in-memory store in
// demo. Before this the route wrote to the store in both modes; on a live
// tenant that store is emptied at start-up and the container restarts on every
// deploy, so a signed, locked report lasted until the next merge to main.
//
// IDENTITY. In activated mode the home comes from the SESSION (staff_members.
// home_id), never from ?home_id=, and the actor is the session's staff id, never
// the x-user-id header — a client cannot read or write another home's report
// by changing a parameter. Demo keeps the header/param convention.
//
// EVIDENCE. The draft is assembled by assembleReg44DraftForHome (shared with
// the visit tracker's "Add Visit"); see the caveat there about live evidence.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { readJsonBody } from "@/lib/http/read-json";
import { reg44ReportsDb, isSupabaseEnabled } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { assembleReg44DraftForHome, reg44MonthWindow } from "@/lib/reg44-report-intelligence/assemble-for-home";
import { createReg44Report, signReg44Report, addReg44Addendum, editReg44Report, editReg44Sections } from "@/lib/reg44-report-intelligence/report-lifecycle";
import { REG44_REPORT_INTEL_VERSION } from "@/lib/reg44-report-intelligence/types";

export const dynamic = "force-dynamic";

/**
 * The home and actor this request may act for. Activated mode: from the
 * validated session, full stop. Demo: the query/body/header convention.
 */
function scope(identity: { userId: string; homeId: string | null }, requested: string | null | undefined, headerActor: string | null) {
  if (isSupabaseEnabled()) {
    return { homeId: identity.homeId ?? "", actor: identity.userId, live: true };
  }
  return { homeId: String(requested || "home_oak"), actor: headerActor || identity.userId || "staff_unknown", live: false };
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const { searchParams } = new URL(req.url);
    const { homeId, live } = scope(identity, searchParams.get("home_id"), null);
    if (live && !homeId) return NextResponse.json({ error: "Your staff record has no home assigned." }, { status: 403 });
    const month = reg44MonthWindow(searchParams.get("month") || "").month;
    return NextResponse.json({ data: await reg44ReportsDb.findByHomeMonth(homeId, month) });
  } catch (error: unknown) {
    console.error("[api] reg44-report GET error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const jb = await readJsonBody(req);
    if (!jb.ok) return jb.response;
    const body = jb.data as Record<string, unknown>;
    const action = String(body.action ?? "");
    const { homeId, actor, live } = scope(identity, body.home_id ? String(body.home_id) : null, req.headers.get("x-user-id") ?? (body.actor ? String(body.actor) : null));
    if (live && !homeId) return NextResponse.json({ error: "Your staff record has no home assigned." }, { status: 403 });
    const now = new Date().toISOString();

    if (action === "create") {
      const { draft, sections, month } = await assembleReg44DraftForHome(homeId, String(body.month ?? ""));
      const existing = await reg44ReportsDb.findByHomeMonth(homeId, month);
      if (existing) return NextResponse.json({ data: existing });
      const report = createReg44Report({ id: generateId("r44rep"), homeId, month, draft, sections, engineVersion: REG44_REPORT_INTEL_VERSION, createdBy: actor, at: now });
      await reg44ReportsDb.create(report);
      return NextResponse.json({ data: report }, { status: 201 });
    }

    const id = String(body.id ?? "");
    const report = await reg44ReportsDb.findById(id);
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    // A report belongs to one home; the session may only touch its own.
    if (live && report.homeId !== homeId) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    if (action === "sign") {
      const out = signReg44Report(report, { decision: body.decision as never, decidedBy: String(body.decided_by ?? actor), overrideReason: body.override_reason ? String(body.override_reason) : undefined, at: now });
      if (out.report) await reg44ReportsDb.update(id, out.report);
      if (!out.ok) return NextResponse.json({ data: { report: out.report ?? report, refusedReason: out.refusedReason } }, { status: 422 });
      return NextResponse.json({ data: { report: out.report } });
    }
    if (action === "addendum") {
      const out = addReg44Addendum(report, { id: generateId("r44add"), text: String(body.text ?? ""), author: String(body.author ?? actor), at: now });
      if (!out.ok) return NextResponse.json({ error: out.refusedReason }, { status: 422 });
      await reg44ReportsDb.update(id, out.report!);
      return NextResponse.json({ data: { report: out.report } });
    }
    if (action === "edit") {
      const out = editReg44Report(report, (body.patch ?? {}) as never, { by: actor, at: now });
      if (out.report) await reg44ReportsDb.update(id, out.report);
      if (!out.ok) return NextResponse.json({ data: { report: out.report }, error: out.refusedReason }, { status: 422 });
      return NextResponse.json({ data: { report: out.report } });
    }
    if (action === "edit_sections") {
      const raw = Array.isArray(body.sections) ? (body.sections as Array<Record<string, unknown>>) : [];
      const patch = raw
        .filter((x) => typeof x?.key === "string" && typeof x?.content === "string")
        .map((x) => ({ key: String(x.key), content: String(x.content) }));
      if (!patch.length) return NextResponse.json({ error: "sections: [{ key, content }] is required" }, { status: 400 });
      const out = editReg44Sections(report, patch, { by: actor, at: now });
      if (out.report) await reg44ReportsDb.update(id, out.report);
      if (!out.ok) return NextResponse.json({ data: { report: out.report }, error: out.refusedReason }, { status: 422 });
      return NextResponse.json({ data: { report: out.report } });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("[api] reg44-report POST error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
