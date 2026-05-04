import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

function daysBetween(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date(todayStr());
  const target = new Date(dateStr);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diff;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role");
  const employmentTypeFilter = searchParams.get("employment_type");
  const statusFilter = searchParams.get("status") ?? "active";

  let allStaff = db.staff.findAll();

  // Apply filters
  if (statusFilter === "active") {
    allStaff = allStaff.filter((s) => s.is_active && s.employment_status === "active");
  } else if (statusFilter === "inactive") {
    allStaff = allStaff.filter((s) => !s.is_active || s.employment_status === "left");
  }
  if (roleFilter) {
    allStaff = allStaff.filter((s) => s.role === roleFilter);
  }
  if (employmentTypeFilter) {
    allStaff = allStaff.filter((s) => s.employment_type === employmentTypeFilter);
  }

  const today = todayStr();
  const todayShifts = db.shifts.findToday();
  const onLeaveToday = db.leave.findOnLeaveToday();

  const allTasks = db.tasks.findAll();

  const data = allStaff.map((s) => {
    const todayShift = todayShifts.find((shift) => shift.staff_id === s.id) ?? null;
    const isOnShiftToday = todayShift !== null;
    const isOnLeaveToday = onLeaveToday.some((l) => l.staff_id === s.id);

    const supervisionDaysUntilDue = daysBetween(s.next_supervision_due);
    const supervisionOverdue = supervisionDaysUntilDue !== null && supervisionDaysUntilDue < 0;

    const staffTraining = db.training.findByStaff(s.id);
    const trainingExpiredCount = staffTraining.filter((t) => t.status === "expired").length;
    const trainingExpiringCount = staffTraining.filter((t) => t.status === "expiring_soon").length;

    const staffTasks = allTasks.filter((t) => t.assigned_to === s.id && t.status !== "completed" && t.status !== "cancelled");
    const overdueTasksCount = staffTasks.filter((t) => t.due_date && t.due_date < today).length;

    const notifications = db.notifications.findForUser(s.id);
    const notificationsUnread = notifications.length;

    return {
      ...s,
      is_on_shift_today: isOnShiftToday,
      today_shift_type: todayShift?.shift_type ?? null,
      today_shift_status: todayShift?.status ?? null,
      supervision_overdue: supervisionOverdue,
      supervision_days_until_due: supervisionDaysUntilDue,
      training_total_count: staffTraining.length,
      training_expired_count: trainingExpiredCount,
      training_expiring_count: trainingExpiringCount,
      active_tasks: staffTasks.length,
      overdue_tasks: overdueTasksCount,
      is_on_leave_today: isOnLeaveToday,
      notifications_unread: notificationsUnread,
    };
  });

  const allActiveStaff = db.staff.findAll().filter((s) => s.employment_status === "active" && s.is_active);
  const bankCount = allActiveStaff.filter((s) => s.employment_type === "bank").length;
  const onShiftCount = todayShifts.filter((sh) => sh.staff_id && !sh.is_open_shift).length;
  const onLeaveCount = onLeaveToday.length;

  const supervisionOverdueCount = allActiveStaff.filter((s) => {
    if (!s.next_supervision_due) return false;
    return s.next_supervision_due < today;
  }).length;

  return NextResponse.json({
    data,
    meta: {
      total: allActiveStaff.length,
      active: allActiveStaff.filter((s) => s.employment_type === "permanent").length,
      bank: bankCount,
      on_shift: onShiftCount,
      on_leave: onLeaveCount,
      supervision_overdue: supervisionOverdueCount,
    },
  });
}
