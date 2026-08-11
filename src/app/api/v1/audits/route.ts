// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUDITS BULK ENDPOINT (enriched meta)
//
// Returns all audits with computed meta matching AuditsResponse:
// total, completed, scheduled, in_progress, overdue counts.
// Replaces catch-all which only returned meta: { total }.
//
// GET /api/v1/audits?status=...&category=...
// POST /api/v1/audits (create new audit)
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { requireNonEmptyBody } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  const today = todayStr();
  const { searchParams } = new URL(req.url);
  const filterStatus = searchParams.get("status");
  const filterCategory = searchParams.get("category");

  let list = await dal.qaAudits.findAll();

  if (filterStatus) {
    list = list.filter((a) => a.status === filterStatus);
  }
  if (filterCategory) {
    list = list.filter((a) => a.category === filterCategory);
  }

  // Sort: scheduled first (upcoming), then completed by date desc
  list.sort((a, b) => {
    if (a.status === "scheduled" && b.status !== "scheduled") return -1;
    if (a.status !== "scheduled" && b.status === "scheduled") return 1;
    return (b.date ?? "").localeCompare(a.date ?? "");
  });

  // ── Compute meta over ALL audits ────────────────────────────────────────
  const all = await dal.qaAudits.findAll();

  const completed = all.filter((a) => a.status === "completed").length;
  const scheduled = all.filter((a) => a.status === "scheduled" && a.date >= today).length;
  const inProgress = all.filter((a) => a.status === "in_progress").length;
  const overdue = all.filter((a) => a.status === "scheduled" && a.date < today).length;

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
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const __missing = requireNonEmptyBody(body);
  if (__missing) return __missing;
  const audit = await dal.qaAudits.create(body);
  return NextResponse.json({ data: audit }, { status: 201 });
}
