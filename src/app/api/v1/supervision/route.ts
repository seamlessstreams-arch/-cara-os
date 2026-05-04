import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { todayStr } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_SUPERVISION);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const staffId      = searchParams.get("staff_id");
  const supervisorId = searchParams.get("supervisor_id");
  const status       = searchParams.get("status");
  const overdue      = searchParams.get("overdue") === "true";

  let results = db.supervisions.findAll();
  if (staffId)      results = results.filter((s) => s.staff_id === staffId);
  if (supervisorId) results = results.filter((s) => s.supervisor_id === supervisorId);
  if (status)       results = results.filter((s) => s.status === status);
  if (overdue)      results = db.supervisions.findOverdue();

  const today = todayStr();
  const sorted = [...results].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  const overdueCount   = db.supervisions.findOverdue().length;
  const dueSoonCount   = db.supervisions.findDueSoon(7).length;
  const scheduledCount = db.supervisions.findScheduled().length;
  const completedCount = db.supervisions.findCompleted().length;

  return NextResponse.json({
    data: sorted,
    meta: {
      total:     sorted.length,
      overdue:   overdueCount,
      due_soon:  dueSoonCount,
      scheduled: scheduledCount,
      completed: completedCount,
      today,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.MANAGE_SUPERVISION);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const supervision = db.supervisions.create({
    ...body,
    home_id: "home_oak",
    created_by: auth.userId,
    updated_by: auth.userId,
  });

  return NextResponse.json({ data: supervision }, { status: 201 });
}
