// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Reg 45 Report Builder
// GET   → list reports for a home (latest first)
// POST  → build a new draft report (RBAC: cara.generate_drafts)
// PATCH → edit text OR transition status (draft → in_review → approved → locked)
//   - text edits: cara.rewrite
//   - status transitions: cara.approve_outputs (safeguarding-sensitive on
//     approved/locked)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import {
  buildReg45Report,
  loadReg45Reports,
  editReg45Report,
  setReg45ReportStatus,
} from "@/lib/cara/cara-reg45-report";
import type { CaraReg45Report } from "@/types/cara-studio";
import { readJsonBody } from "@/lib/http/read-json";

const DEFAULT_HOME_ID = "home_oak";

const ALLOWED_STATUSES: Array<CaraReg45Report["status"]> = [
  "draft",
  "in_review",
  "approved",
  "locked",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  return NextResponse.json({ data: loadReg45Reports(homeId) });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    const __parsed2 = await readJsonBody(req);
    if (!__parsed2.ok) return __parsed2.response;
    body = __parsed2.data as Record<string, unknown>;
  } catch {
    body = {};
  }

  const homeId = typeof body.home_id === "string" ? body.home_id : DEFAULT_HOME_ID;
  const periodStart = typeof body.period_start === "string" ? body.period_start : undefined;
  const periodEnd = typeof body.period_end === "string" ? body.period_end : undefined;
  const title = typeof body.title === "string" ? body.title : undefined;

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.generate_drafts",
    homeId,
    intent: "build reg45_report_draft",
  });
  if (!guard.ok) return guard.response;

  const report = buildReg45Report(homeId, {
    periodStart,
    periodEnd,
    generatedBy: guard.actor.userId,
    title,
  });
  return NextResponse.json({ data: report }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = db.caraReg45Reports.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "locked") {
    return NextResponse.json({ error: "Report is locked" }, { status: 409 });
  }

  // Status transition path
  if (typeof body.status === "string") {
    if (!ALLOWED_STATUSES.includes(body.status as CaraReg45Report["status"])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const sensitive = body.status === "approved" || body.status === "locked";
    const guard = requireCaraStudioPermission(req, body, {
      permission: sensitive ? "cara.approve_outputs" : "cara.rewrite",
      homeId: existing.home_id,
      intent: `set reg45_report status ${body.status}`,
      isSafeguardingSensitive: sensitive,
    });
    if (!guard.ok) return guard.response;
    const note = typeof body.note === "string" ? body.note : null;
    const next = setReg45ReportStatus(
      id,
      body.status as CaraReg45Report["status"],
      guard.actor.userId,
      note,
    );
    return NextResponse.json({ data: next });
  }

  // Text edit path
  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.rewrite",
    homeId: existing.home_id,
    intent: "edit reg45_report",
  });
  if (!guard.ok) return guard.response;

  const sectionNarratives =
    body.section_narratives && typeof body.section_narratives === "object"
      ? (body.section_narratives as Record<string, string>)
      : undefined;

  const updated = editReg45Report(id, {
    title: typeof body.title === "string" ? body.title : undefined,
    executive_summary:
      typeof body.executive_summary === "string" ? body.executive_summary : undefined,
    section_narratives: sectionNarratives as Record<string, string> | undefined,
  });
  return NextResponse.json({ data: updated });
}
