"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  ChevronLeft, Clock, Timer, Coffee, CheckCircle2,
  Play, Square, AlertTriangle, Coins, Calendar,
  Sparkles, TrendingUp, ArrowRight,
} from "lucide-react";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import { useStaff } from "@/hooks/use-staff";
import { useRota } from "@/hooks/use-rota";
import { AriaPanel } from "@/components/aria/aria-panel";
import type { Shift } from "@/types";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoursLabel(mins: number) {
  if (mins <= 0) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function shiftDurationMins(shift: Shift): number {
  const [sh, sm] = shift.start_time.split(":").map(Number);
  const [eh, em] = shift.end_time.split(":").map(Number);
  const raw = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, raw - shift.break_minutes);
}

function shiftStatusConfig(s: Shift["status"]) {
  switch (s) {
    case "completed":   return { label: "Completed",   colour: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "in_progress": return { label: "In progress", colour: "bg-blue-100 text-blue-700 border-blue-200" };
    case "no_show":     return { label: "No show",     colour: "bg-red-100 text-red-700 border-red-200" };
    case "cancelled":   return { label: "Cancelled",   colour: "bg-slate-100 text-slate-500 border-slate-200" };
    case "confirmed":   return { label: "Confirmed",   colour: "bg-violet-100 text-violet-700 border-violet-200" };
    default:            return { label: "Scheduled",   colour: "bg-slate-100 text-slate-600 border-slate-200" };
  }
}

const SHIFT_TYPE_LABEL: Record<string, string> = {
  early: "Early", late: "Late", night: "Night", sleep_in: "Sleep-in",
  waking_night: "Waking night", day: "Day", on_call: "On call",
};

// ── Shift Row ─────────────────────────────────────────────────────────────────

function ShiftRow({ shift }: { shift: Shift }) {
  const dur = shiftDurationMins(shift);
  const sc = shiftStatusConfig(shift.status);
  const hasOvertime = shift.overtime_minutes > 0;

  return (
    <div className="flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors">
      {/* Date */}
      <div className="w-20 shrink-0">
        <div className="text-xs font-semibold text-slate-800">{formatDate(shift.date)}</div>
        <div className="text-[10px] text-slate-400 capitalize">
          {SHIFT_TYPE_LABEL[shift.shift_type] ?? shift.shift_type}
        </div>
      </div>

      {/* Scheduled time */}
      <div className="w-28 shrink-0">
        <div className="text-xs font-mono text-slate-700">
          {shift.start_time} – {shift.end_time}
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <Coffee className="h-2.5 w-2.5" />{shift.break_minutes}m break
        </div>
      </div>

      {/* Actual clock */}
      <div className="w-28 shrink-0">
        {shift.clock_in_at ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <Play className="h-2.5 w-2.5" />
              {shift.clock_in_at}
            </div>
            {shift.clock_out_at && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Square className="h-2.5 w-2.5" />
                {shift.clock_out_at}
              </div>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        )}
      </div>

      {/* Duration */}
      <div className="w-16 text-center shrink-0">
        <div className="text-sm font-semibold text-slate-900">{hoursLabel(dur)}</div>
        <div className="text-[10px] text-slate-400">worked</div>
      </div>

      {/* Overtime */}
      <div className="w-16 text-center shrink-0">
        {hasOvertime ? (
          <>
            <div className="text-sm font-semibold text-orange-600">{hoursLabel(shift.overtime_minutes)}</div>
            <div className="text-[10px] text-slate-400">OT</div>
          </>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </div>

      {/* Status */}
      <Badge className={cn("text-[10px] rounded-full border ml-auto shrink-0", sc.colour)}>
        {sc.label}
      </Badge>

      {/* Notes */}
      {shift.notes && (
        <span className="text-[10px] text-slate-400 max-w-32 truncate" title={shift.notes}>
          {shift.notes}
        </span>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TimesheetDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = use(params);
  const router = useRouter();
  const [showAria, setShowAria] = useState(false);

  const staffQuery = useStaff();
  const staff = useMemo(
    () => (staffQuery.data?.data ?? []).find((s) => s.id === staffId),
    [staffQuery.data, staffId]
  );

  // 3-week window matching timesheets list logic
  const rotaThisWeek = useRota(daysFromNow(0));
  const rotaLastWeek = useRota(daysFromNow(-7));
  const rotaPrevWeek = useRota(daysFromNow(-14));

  const allShifts = useMemo<Shift[]>(
    () => [
      ...(rotaThisWeek.data?.shifts ?? []),
      ...(rotaLastWeek.data?.shifts ?? []),
      ...(rotaPrevWeek.data?.shifts ?? []),
    ],
    [rotaThisWeek.data, rotaLastWeek.data, rotaPrevWeek.data]
  );

  const staffShifts = useMemo(
    () =>
      allShifts
        .filter((s) => s.staff_id === staffId && s.date >= daysFromNow(-14))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allShifts, staffId]
  );

  const isLoading = staffQuery.isPending || rotaThisWeek.isPending;

  // Computed totals
  const totals = useMemo(() => {
    const scheduledMins = staffShifts.reduce((acc, s) => acc + shiftDurationMins(s), 0);
    const overtimeMins = staffShifts.reduce((acc, s) => acc + (s.overtime_minutes ?? 0), 0);
    const completedShifts = staffShifts.filter((s) => s.status === "completed" || s.clock_in_at).length;
    const noShows = staffShifts.filter((s) => s.status === "no_show").length;
    const contractedWeeklyMins = (staff?.contracted_hours ?? 0) * 60;
    const hourlyRate = staff?.hourly_rate ?? (staff?.annual_salary ? (staff.annual_salary / 52 / (staff.contracted_hours || 37)) : 12.21);
    const otPay = (overtimeMins / 60) * (hourlyRate * 1.5);
    const regularPay = (scheduledMins / 60) * hourlyRate;
    const contractedMins2Wk = contractedWeeklyMins * 2;
    const variance = scheduledMins - contractedMins2Wk;
    return { scheduledMins, overtimeMins, completedShifts, noShows, hourlyRate, otPay, regularPay, variance, contractedMins2Wk };
  }, [staffShifts, staff]);

  const ariaContext = staff
    ? [
        `Staff member: ${staff.full_name}`,
        `Role: ${staff.job_title}`,
        `Contracted: ${staff.contracted_hours}h/wk`,
        `Hourly rate: £${totals.hourlyRate.toFixed(2)}`,
        `Period: last 14 days`,
        `Shifts scheduled: ${staffShifts.length}`,
        `Shifts completed: ${totals.completedShifts}`,
        `No shows: ${totals.noShows}`,
        `Total hours worked: ${hoursLabel(totals.scheduledMins)}`,
        `Contracted hours (2 weeks): ${hoursLabel(totals.contractedMins2Wk)}`,
        `Variance: ${totals.variance >= 0 ? "+" : ""}${hoursLabel(Math.abs(totals.variance))} ${totals.variance >= 0 ? "over" : "under"}`,
        `Overtime: ${hoursLabel(totals.overtimeMins)} (£${totals.otPay.toFixed(2)})`,
      ].join("\n")
    : "";

  if (isLoading) {
    return (
      <PageShell title="Timesheet">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (!staff) {
    return (
      <PageShell title="Not found">
        <p className="text-slate-500 text-sm">Staff member not found.</p>
        <Button variant="outline" className="mt-4 gap-1.5" onClick={() => router.push("/timesheets")}>
          <ChevronLeft className="h-4 w-4" />Back to timesheets
        </Button>
      </PageShell>
    );
  }

  const contractedHrsPerDay = staff.contracted_hours / 5;

  return (
    <PageShell
      title={`${staff.full_name} — Timesheet`}
      subtitle={`${staff.job_title} · ${staff.contracted_hours}h/wk contracted · Last 14 days`}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title={`${staff.full_name} — Timesheet`} subtitle="Oak House — Staff Timesheet" targetId="timesheet-detail-content" />
          <SmartUploadButton variant="icon" linkedStaffId={staff.id} uploadContext={`Timesheets — ${staff.full_name} timesheet or payroll document upload`} />
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => router.push("/timesheets")}>
            <ChevronLeft className="h-3.5 w-3.5" />All timesheets
          </Button>
        </div>
      }
    >
      <div id="timesheet-detail-content" className="space-y-0">
      {/* ARIA Panel */}
      {showAria && (
        <div className="mb-6 relative">
          <button
            onClick={() => setShowAria(false)}
            className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕ Close
          </button>
          <AriaPanel
            mode="oversee"
            pageContext={`Timesheet — ${staff.full_name}`}
            recordType="supervision"
            sourceContent={ariaContext}
          />
        </div>
      )}

      {/* Staff header */}
      <Card className="rounded-2xl shadow-sm mb-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={staff.full_name} size="lg" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{staff.full_name}</h2>
                <Badge className="text-[10px] rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {staff.job_title}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {staff.contracted_hours}h/wk · {contractedHrsPerDay.toFixed(1)}h/day avg
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  £{totals.hourlyRate.toFixed(2)}/hr
                </span>
                {staff.annual_salary && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    £{staff.annual_salary.toLocaleString()} p.a.
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setShowAria((v) => !v)}
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />ARIA Analysis
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => router.push(`/staff/${staff.id}`)}
              >
                Full profile <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          {
            label: "Hours worked",
            value: hoursLabel(totals.scheduledMins),
            sub: `vs ${hoursLabel(totals.contractedMins2Wk)} contracted`,
            icon: Clock,
            colour: "text-blue-600", bg: "bg-blue-50",
          },
          {
            label: "Variance",
            value: `${totals.variance >= 0 ? "+" : ""}${hoursLabel(Math.abs(totals.variance))}`,
            sub: totals.variance >= 0 ? "over contracted" : "under contracted",
            icon: TrendingUp,
            colour: totals.variance >= 0 ? "text-orange-600" : "text-slate-500",
            bg: totals.variance >= 0 ? "bg-orange-50" : "bg-slate-50",
          },
          {
            label: "Overtime",
            value: hoursLabel(totals.overtimeMins),
            sub: `£${totals.otPay.toFixed(2)} payable`,
            icon: Timer,
            colour: totals.overtimeMins > 0 ? "text-orange-600" : "text-slate-400",
            bg: totals.overtimeMins > 0 ? "bg-orange-50" : "bg-slate-50",
          },
          {
            label: "Shifts",
            value: String(staffShifts.length),
            sub: `${totals.completedShifts} completed`,
            icon: Calendar,
            colour: "text-violet-600", bg: "bg-violet-50",
          },
          {
            label: "No shows",
            value: String(totals.noShows),
            sub: totals.noShows > 0 ? "Needs review" : "All shifts covered",
            icon: AlertTriangle,
            colour: totals.noShows > 0 ? "text-red-600" : "text-emerald-600",
            bg: totals.noShows > 0 ? "bg-red-50" : "bg-emerald-50",
          },
          {
            label: "Est. gross pay",
            value: `£${(totals.regularPay + totals.otPay).toFixed(0)}`,
            sub: "inc. overtime",
            icon: Coins,
            colour: "text-emerald-600", bg: "bg-emerald-50",
          },
        ].map(({ label, value, sub, icon: Icon, colour, bg }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className={cn("rounded-xl p-2 inline-flex mb-2", bg)}>
              <Icon className={cn("h-4 w-4", colour)} />
            </div>
            <div className={cn("text-xl font-bold tabular-nums", colour)}>{value}</div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Shift breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shift list */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />Shift log — last 14 days
                <Badge className="text-[10px] rounded-full bg-slate-100 text-slate-600 ml-auto">
                  {staffShifts.length} shifts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staffShifts.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  No shifts found for this period.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* Column headers */}
                  <div className="flex items-center gap-4 px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="w-20">Date</div>
                    <div className="w-28">Scheduled</div>
                    <div className="w-28">Clock in/out</div>
                    <div className="w-16 text-center">Duration</div>
                    <div className="w-16 text-center">OT</div>
                    <div className="ml-auto">Status</div>
                  </div>
                  {staffShifts.map((shift) => (
                    <ShiftRow key={`${shift.staff_id}-${shift.date}-${shift.start_time}`} shift={shift} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Pay breakdown */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5" />Pay summary (est.)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { label: "Regular pay", amount: totals.regularPay, sub: `${hoursLabel(totals.scheduledMins)} × £${totals.hourlyRate.toFixed(2)}` },
                { label: "Overtime (1.5×)", amount: totals.otPay, sub: `${hoursLabel(totals.overtimeMins)} × £${(totals.hourlyRate * 1.5).toFixed(2)}` },
              ].map(({ label, amount, sub }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-slate-800">{label}</div>
                    <div className="text-[10px] text-slate-400">{sub}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">£{amount.toFixed(2)}</div>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Estimated total</span>
                <span className="text-base font-bold text-emerald-700">
                  £{(totals.regularPay + totals.otPay).toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Estimate only. Final pay subject to payroll processing.
              </p>
            </CardContent>
          </Card>

          {/* Shift type breakdown */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Shift types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(
                staffShifts.reduce<Record<string, number>>((acc, s) => {
                  const key = SHIFT_TYPE_LABEL[s.shift_type] ?? s.shift_type;
                  acc[key] = (acc[key] ?? 0) + 1;
                  return acc;
                }, {})
              ).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 capitalize">{type}</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-1.5 bg-blue-400 rounded-full"
                      style={{ width: `${Math.round((count / staffShifts.length) * 80)}px` }}
                    />
                    <span className="font-semibold text-slate-800 w-3">{count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Attendance summary */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Completed", count: staffShifts.filter((s) => s.status === "completed" || (s.clock_in_at && s.clock_out_at)).length, colour: "bg-emerald-500" },
                { label: "In progress", count: staffShifts.filter((s) => s.status === "in_progress" || (s.clock_in_at && !s.clock_out_at)).length, colour: "bg-blue-500" },
                { label: "Cancelled", count: staffShifts.filter((s) => s.status === "cancelled").length, colour: "bg-slate-300" },
                { label: "No show", count: totals.noShows, colour: "bg-red-500" },
              ].map(({ label, count, colour }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", colour)} />
                  <span className="text-xs text-slate-600 flex-1">{label}</span>
                  <span className="text-xs font-semibold text-slate-800">{count}</span>
                </div>
              ))}
              <div className="pt-1">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  {staffShifts.length > 0 && (
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.round(((staffShifts.filter((s) => s.status === "completed" || s.clock_in_at).length) / staffShifts.length) * 100)}%`
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between mt-0.5 text-[10px] text-slate-400">
                  <span>Attendance rate</span>
                  <span>
                    {staffShifts.length > 0
                      ? `${Math.round((staffShifts.filter((s) => s.status === "completed" || s.clock_in_at).length / staffShifts.length) * 100)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Related</p>
            {[
              { label: "Staff profile", href: `/staff/${staff.id}` },
              { label: "Rota", href: "/rota" },
              { label: "Leave requests", href: "/leave" },
              { label: "All timesheets", href: "/timesheets" },
            ].map(({ label, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="w-full text-left flex items-center justify-between rounded-lg hover:bg-white hover:shadow-sm px-3 py-2 text-xs text-slate-600 transition-all"
              >
                {label}
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>{/* close #timesheet-detail-content */}
    </PageShell>
  );
}
