// ══════════════════════════════════════════════════════════════════════════════
// CARA — SUPERVISION BULK ENDPOINT (enriched meta)
//
// Returns all supervisions with computed meta matching SupervisionListResponse:
// overdue, due_soon, scheduled, completed counts.
// Replaces catch-all which only returned meta: { total }.
//
// GET /api/v1/supervision?staff_id=...&status=...
// POST /api/v1/supervision (create new supervision)
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const today = todayStr();
  const { searchParams } = new URL(req.url);
  const filterStaff = searchParams.get("staff_id");
  const filterStatus = searchParams.get("status");

  let list = db.supervisions.findAll();

  if (filterStaff) {
    list = list.filter((s) => s.staff_id === filterStaff);
  }
  if (filterStatus) {
    list = list.filter((s) => s.status === filterStatus);
  }

  // Sort: upcoming first, then completed by date desc
  list.sort((a, b) => {
    if (a.status === "scheduled" && b.status !== "scheduled") return -1;
    if (a.status !== "scheduled" && b.status === "scheduled") return 1;
    return (b.scheduled_date ?? "").localeCompare(a.scheduled_date ?? "");
  });

  // ── Compute meta ────────────────────────────────────────────────────────
  const allSupervisions = db.supervisions.findAll();
  const overdue = allSupervisions.filter(
    (s) => s.status === "scheduled" && s.scheduled_date < today
  ).length;

  const sevenDays = new Date(today + "T00:00:00Z");
  sevenDays.setUTCDate(sevenDays.getUTCDate() + 7);
  const sevenDaysStr = sevenDays.toISOString().slice(0, 10);

  const dueSoon = allSupervisions.filter(
    (s) => s.status === "scheduled" && s.scheduled_date >= today && s.scheduled_date <= sevenDaysStr
  ).length;

  const scheduled = allSupervisions.filter((s) => s.status === "scheduled" && s.scheduled_date >= today).length;
  const completed = allSupervisions.filter((s) => s.status === "completed").length;

  return NextResponse.json({
    data: list,
    meta: {
      total: list.length,
      overdue,
      due_soon: dueSoon,
      scheduled,
      completed,
      today,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_SUPERVISION);
  if (auth instanceof NextResponse) return auth;

  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const supervision = db.supervisions.create(body);
  return NextResponse.json({ data: supervision }, { status: 201 });
}
