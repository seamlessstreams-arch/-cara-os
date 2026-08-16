import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";
import { readJsonBody } from "@/lib/http/read-json";
import { rejectFutureDates } from "@/lib/http/retrospective-dates";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

function daysBetween(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date(todayStr());
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const staff = await dal.staff.findById(id);
  if (!staff) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const today = todayStr();
  const todayShifts = await dal.shifts.findToday();
  const onLeaveToday = await dal.leave.findOnLeaveToday();

  const todayShift = todayShifts.find((sh) => sh.staff_id === id) ?? null;
  const isOnLeaveToday = onLeaveToday.some((l) => l.staff_id === id);

  const training = (await dal.training.findByStaff(id))
    .sort((a, b) => (b.completed_date ?? "").localeCompare(a.completed_date ?? ""));

  // dal.supervisions has no dedicated findByStaff — its findAll(filters) ignores
  // filters in the in-memory fallback branch, so filtering client-side here
  // preserves exact current behavior instead of silently returning every
  // supervision for the home.
  const supervisions = (await dal.supervisions.findAll())
    .filter((s) => s.staff_id === id)
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));

  const allTasks = await dal.tasks.findAll();
  const tasks = allTasks
    .filter((t) => t.assigned_to === id)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

  const supervisionDaysUntilDue = daysBetween(staff.next_supervision_due);
  const supervisionOverdue = supervisionDaysUntilDue !== null && supervisionDaysUntilDue < 0;

  return NextResponse.json({
    data: {
      ...staff,
      is_on_shift_today: !!todayShift,
      today_shift_type: todayShift?.shift_type ?? null,
      today_shift_status: todayShift?.status ?? null,
      is_on_leave_today: isOnLeaveToday,
      supervision_overdue: supervisionOverdue,
      supervision_days_until_due: supervisionDaysUntilDue,
      training_total_count: training.length,
      training_expired_count: training.filter((t) => t.status === "expired").length,
      training_expiring_count: training.filter((t) => t.status === "expiring_soon").length,
      active_tasks: tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
      overdue_tasks: tasks.filter(
        (t) => t.status !== "completed" && t.status !== "cancelled" && t.due_date && t.due_date < today
      ).length,
    },
    related: {
      training,
      supervisions,
      tasks: tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled"),
    },
  });
}

/**
 * Record a pre-employment check against a staff member.
 *
 * Scope is deliberately narrow. This row also carries salary, role and
 * employment status; the screen that records a barred-list check has no
 * business reaching any of that, so the allowlist in queries.ts decides what
 * a caller may write and this route decides who may write it.
 *
 * A date and a name, not a boolean: "checked on 12 March by the RM" is the
 * evidence Schedule 2 asks for. Sending null CLEARS a check — recording one in
 * error has to be correctable, and a cleared check reads as not recorded,
 * which is the truth about it.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_STAFF);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;

  // A check cannot have been made tomorrow.
  const future = rejectFutureDates(parsed.data, [
    "right_to_work_checked_date",
    "barred_list_checked_date",
    "prohibition_checked_date",
  ]);
  if (future) return future;

  const existing = await dal.staff.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await dal.staff.updateSaferRecruitment(id, parsed.data);
  if (!updated) {
    return NextResponse.json(
      { error: "No recordable pre-employment field was supplied" },
      { status: 400 },
    );
  }
  return NextResponse.json({ data: updated });
}
