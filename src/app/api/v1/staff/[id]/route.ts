import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";

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
  const todayShifts = db.shifts.findToday();
  const onLeaveToday = db.leave.findOnLeaveToday();

  const todayShift = todayShifts.find((sh) => sh.staff_id === id) ?? null;
  const isOnLeaveToday = onLeaveToday.some((l) => l.staff_id === id);

  const training = db.training
    .findByStaff(id)
    .sort((a, b) => (b.completed_date ?? "").localeCompare(a.completed_date ?? ""));

  const supervisions = db.supervisions
    .findByStaff(id)
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
