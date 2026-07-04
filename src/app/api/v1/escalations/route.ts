// ══════════════════════════════════════════════════════════════════════════════
// CARA — Escalations API (the tracker's record log)
//
// GET  → list escalation records (the manual ops log the Escalation Tracker
//        page renders).
// POST → record an escalation.
//
// NOTE: this endpoint was referenced by use-escalations.ts (and the tracker
// page) but never existed — the tracker fetched into a 404. This implements
// the missing contract over the existing store collection. The 4-level
// suggest→confirm→log DECISION workflow lives at /api/v1/escalations/decisions.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;

  const data = [...db.escalations.findAll()].sort((a, b) => (a.date < b.date ? 1 : -1));
  return NextResponse.json({ data, meta: { total: data.length } });
}

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;

  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 422 });
  }
  const record = db.escalations.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
