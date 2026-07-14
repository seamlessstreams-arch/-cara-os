// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 PERSISTED REPORT API
// GET  ?home_id=&month=YYYY-MM                → the persisted A–Q report (or null)
// POST { action: "create" | "sign" | "addendum" | "edit", … }
//   create   → start a report from Cara's assembled evidence draft (persisted)
//   sign     → run the gate + LOCK on approval (named override required if blocked)
//   addendum → append a dated, named correction to a signed report
//   edit     → edit an unsigned draft (refused once locked)
//
// Reuses the assembly pipeline + the slice-2 gate + the lifecycle state machine.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { readJsonBody } from "@/lib/http/read-json";
import { getStore, db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { generateReg44Pack } from "@/lib/care-events/reg44-pack";
import { assessReg44QualityStandards } from "@/lib/reg44-report-intelligence/qs-assessment-engine";
import { assembleReg44ReportDraft } from "@/lib/reg44-report-intelligence/report-assembly";
import { buildReg44BuildingSafety } from "@/lib/reg44-report-intelligence/building-safety";
import { createReg44Report, signReg44Report, addReg44Addendum, editReg44Report } from "@/lib/reg44-report-intelligence/report-lifecycle";
import type { Reg44AssessmentInput } from "@/lib/reg44-report-intelligence/types";

export const dynamic = "force-dynamic";

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");
function monthWindow(month: string): { start: string; end: string; month: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(month || "");
  const ym = m ? `${m[1]}-${m[2]}` : new Date().toISOString().slice(0, 7);
  return { start: `${ym}-01`, end: `${ym}-31`, month: ym };
}

/** Build the assembled draft (draftForGate) for a home + month from live evidence. */
function buildDraftForGate(homeId: string, month: string) {
  const store = getStore();
  const asOf = new Date().toISOString().slice(0, 10);
  const win = monthWindow(month);
  const pack = generateReg44Pack(homeId, { window: { start: win.start, end: win.end } });
  const inMonth = (d: string) => d >= win.start && d <= win.end;

  const input: Reg44AssessmentInput = {
    homeId, month: win.month, asOf,
    headline: pack.headline,
    restraints: (pack.restraints ?? []).map((r) => ({ id: String(r.id), childDebriefed: !!r.child_debriefed, hasDebriefRecord: false, date: day(r.date ?? r.created_at) })),
    missingEpisodes: (pack.missing_episodes ?? []).map((m) => ({ id: String(m.id), hasReturnInterview: !!m.return_interview_completed, date: day(m.date_missing) })),
    keywork: (pack.keywork_sessions ?? []).map((k) => ({ id: String(k.id), childVoice: String(k.child_voice ?? ""), date: day(k.date) })),
    childVoice: (store.ypFeedback ?? []).filter((f) => inMonth(day(f.date))).map((f) => ({ id: String(f.id), category: String(f.category ?? ""), sentiment: String(f.sentiment ?? ""), date: day(f.date) })),
    complaints: (pack.complaints ?? []).map((c) => ({ id: String(c.id), resolved: !!c.date_resolved, date: day(c.complaint_date) })),
    educationRecords: 0, healthRecords: 0, achievementRecords: 0, carePlanRecords: 0,
    childrenSpokenTo: 0,
  };
  const assessment = assessReg44QualityStandards(input);
  const buildingChecks = ((store.buildingChecks ?? []) as Array<Record<string, unknown>>).filter((c) => c.home_id === homeId || !c.home_id).map((c) => ({ id: String(c.id), check_type: String(c.check_type ?? ""), check_date: day(c.check_date), due_date: day(c.due_date), status: String(c.status ?? ""), result: (c.result ?? null) as string | null, risk_level: (c.risk_level ?? null) as string | null }));
  const bs = buildReg44BuildingSafety(buildingChecks, asOf);
  const assembly = assembleReg44ReportDraft({
    homeId, homeName: "Oak House", month: win.month, asOf, qs: assessment, headline: pack.headline,
    childVoiceEntries: [], previousRecommendations: [], reg45EvidenceCount: pack.headline.verified_reg45_evidence ?? 0,
    buildingSafety: { sectionContent: bs.sectionContent, summary: bs.summary },
  });
  return { draft: assembly.draftForGate, month: win.month };
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const { searchParams } = new URL(req.url);
    const homeId = searchParams.get("home_id") || "home_oak";
    const month = monthWindow(searchParams.get("month") || "").month;
    return NextResponse.json({ data: db.reg44Reports.findByHomeMonth(homeId, month) });
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
    const actor = String(req.headers.get("x-user-id") ?? body.actor ?? "staff_unknown");
    const now = new Date().toISOString();

    if (action === "create") {
      const homeId = String(body.home_id ?? "home_oak");
      const { draft, month } = buildDraftForGate(homeId, String(body.month ?? ""));
      const existing = db.reg44Reports.findByHomeMonth(homeId, month);
      if (existing) return NextResponse.json({ data: existing });
      const report = createReg44Report({ id: generateId("r44rep"), homeId, month, draft, createdBy: actor, at: now });
      db.reg44Reports.create(report);
      return NextResponse.json({ data: report }, { status: 201 });
    }

    const id = String(body.id ?? "");
    const report = db.reg44Reports.findById(id);
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    if (action === "sign") {
      const out = signReg44Report(report, { decision: body.decision as never, decidedBy: String(body.decided_by ?? actor), overrideReason: body.override_reason ? String(body.override_reason) : undefined, at: now });
      if (out.report) db.reg44Reports.update(id, out.report);
      if (!out.ok) return NextResponse.json({ data: { report: out.report ?? report, refusedReason: out.refusedReason } }, { status: 422 });
      return NextResponse.json({ data: { report: out.report } });
    }
    if (action === "addendum") {
      const out = addReg44Addendum(report, { id: generateId("r44add"), text: String(body.text ?? ""), author: String(body.author ?? actor), at: now });
      if (!out.ok) return NextResponse.json({ error: out.refusedReason }, { status: 422 });
      db.reg44Reports.update(id, out.report!);
      return NextResponse.json({ data: { report: out.report } });
    }
    if (action === "edit") {
      const out = editReg44Report(report, (body.patch ?? {}) as never, { by: actor, at: now });
      if (out.report) db.reg44Reports.update(id, out.report);
      if (!out.ok) return NextResponse.json({ data: { report: out.report }, error: out.refusedReason }, { status: 422 });
      return NextResponse.json({ data: { report: out.report } });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("[api] reg44-report POST error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
