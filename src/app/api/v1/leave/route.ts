import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr, daysFromNow } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const status = searchParams.get("status");
  const leaveType = searchParams.get("leave_type");
  const since = searchParams.get("since"); // YYYY-MM-DD — filter start_date >= since
  const today = todayStr();

  let records = db.leave.findAll();

  if (staffId) records = records.filter((l) => l.staff_id === staffId);
  if (status) records = records.filter((l) => l.status === status);
  if (leaveType) records = records.filter((l) => l.leave_type === leaveType);
  if (since) records = records.filter((l) => l.start_date >= since);

  // Sort: pending first, then by start_date desc
  records = [...records].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return b.start_date.localeCompare(a.start_date);
  });

  // Meta stats
  const all = db.leave.findAll();
  const approved = all.filter((l) => l.status === "approved");
  const pending = all.filter((l) => l.status === "pending");
  const onLeaveToday = approved.filter((l) => l.start_date <= today && l.end_date >= today);
  const thirtyDaysAgo = daysFromNow(-30);
  const sickLast30 = all.filter((l) => l.leave_type === "sick" && l.start_date >= thirtyDaysAgo);
  const annualLast30 = all.filter((l) => l.leave_type === "annual_leave" && l.start_date >= thirtyDaysAgo);
  const toilLast30 = all.filter((l) => l.leave_type === "toil" && l.start_date >= thirtyDaysAgo);

  return NextResponse.json({
    data: records,
    meta: {
      total: all.length,
      approved: approved.length,
      pending: pending.length,
      on_leave_today: onLeaveToday.length,
      sick_last_30_days: sickLast30.reduce((sum, l) => sum + l.total_days, 0),
      sick_instances_last_30: sickLast30.length,
      annual_days_last_30: annualLast30.reduce((sum, l) => sum + l.total_days, 0),
      toil_days_last_30: toilLast30.reduce((sum, l) => sum + l.total_days, 0),
    },
  });
}
