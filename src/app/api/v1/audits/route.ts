// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — AUDITS BULK ENDPOINT (enriched meta)
//
// Returns all audits with computed meta matching AuditsResponse:
// total, completed, scheduled, in_progress, overdue counts.
// Replaces catch-all which only returned meta: { total }.
//
// GET /api/v1/audits?status=...&category=...
// POST /api/v1/audits (create new audit)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const today = todayStr();
  const { searchParams } = new URL(req.url);
  const filterStatus = searchParams.get("status");
  const filterCategory = searchParams.get("category");

  let list = db.audits.findAll();

  if (filterStatus) {
    list = list.filter((a) => (a as Record<string, unknown>).status === filterStatus);
  }
  if (filterCategory) {
    list = list.filter((a) => (a as Record<string, unknown>).category === filterCategory);
  }

  // Sort: scheduled first (upcoming), then completed by date desc
  list.sort((a, b) => {
    const ar = a as Record<string, unknown>;
    const br = b as Record<string, unknown>;
    if (ar.status === "scheduled" && br.status !== "scheduled") return -1;
    if (ar.status !== "scheduled" && br.status === "scheduled") return 1;
    return ((br.date as string) ?? "").localeCompare((ar.date as string) ?? "");
  });

  // ── Compute meta over ALL audits ────────────────────────────────────────
  const all = db.audits.findAll();

  const completed = all.filter((a) => (a as Record<string, unknown>).status === "completed").length;
  const scheduled = all.filter((a) => {
    const r = a as Record<string, unknown>;
    return r.status === "scheduled" && (r.date as string) >= today;
  }).length;
  const inProgress = all.filter((a) => (a as Record<string, unknown>).status === "in_progress").length;
  const overdue = all.filter((a) => {
    const r = a as Record<string, unknown>;
    return r.status === "scheduled" && (r.date as string) < today;
  }).length;

  return NextResponse.json({
    data: list,
    meta: {
      total: list.length,
      completed,
      scheduled,
      in_progress: inProgress,
      overdue,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const audit = db.audits.create(body);
  return NextResponse.json({ data: audit }, { status: 201 });
}
