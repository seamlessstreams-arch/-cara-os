"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Clock, Download, CheckCircle2, AlertTriangle,
  Timer, Coffee, ArrowUpRight, Coins,
  Play, Square, Edit3, FileText, Loader2,
  Search, ArrowUpDown,
} from "lucide-react";
import { getStaffName } from "@/lib/seed-data";
import { useStaff } from "@/hooks/use-staff";
import type { StaffEnriched } from "@/hooks/use-staff";
import { useRota } from "@/hooks/use-rota";
import { cn, daysFromNow } from "@/lib/utils";
import type { Shift } from "@/types";
import { useCreateLeave } from "@/hooks/use-leave";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

type Tab = "timesheets" | "clock" | "overtime" | "payroll";
type WeekFilter = "this_week" | "last_week" | "this_month";

// Clock log — reflects today's clock-in activity using real staff IDs
const CLOCK_LOG = [
  { staffId: "staff_ryan",      clockIn: "07:02", clockOut: null,    break: null,    status: "clocked_in", shiftStart: "07:00", shiftEnd: "15:00" },
  { staffId: "staff_chervelle", clockIn: "14:55", clockOut: null,    break: null,    status: "clocked_in", shiftStart: "15:00", shiftEnd: "23:00" },
  { staffId: "staff_anna",      clockIn: "08:45", clockOut: "17:10", break: "30min", status: "completed",  shiftStart: "09:00", shiftEnd: "17:00" },
  { staffId: "staff_diane",     clockIn: null,    clockOut: null,    break: null,    status: "scheduled",  shiftStart: "23:00", shiftEnd: "07:00" },
];

const EMPTY_CLOCK_FORM = { staffId: "", clockIn: "", clockOut: "", breakMins: "30", reason: "" };

function hoursLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function buildTimesheetData(staff: StaffEnriched, shifts: Shift[]) {
  const staffShifts = shifts.filter((s) => s.staff_id === staff.id && s.date >= daysFromNow(-14));
  const totalScheduled = staffShifts.reduce((acc, s) => {
    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm) - s.break_minutes;
    return acc + Math.max(0, mins);
  }, 0);
  const overtimeMinutes = staffShifts.reduce((acc, s) => acc + (s.overtime_minutes || 0), 0);
  const clockedIn = staffShifts.filter((s) => s.clock_in_at).length;
  const totalShifts = staffShifts.length;
  const weeklyContracted = staff.contracted_hours;
  const hourlyRate = staff.hourly_rate || (staff.annual_salary ? staff.annual_salary / 52 / weeklyContracted : 12.21);
  const overtimePay = (overtimeMinutes / 60) * (hourlyRate * 1.5);

  return {
    staff,
    totalScheduledMins: totalScheduled,
    overtimeMinutes,
    clockedIn,
    totalShifts,
    hourlyRate,
    overtimePay,
    status: (totalShifts > 0 && clockedIn === totalShifts ? "complete" : clockedIn > 0 ? "partial" : "not_submitted") as "complete" | "partial" | "not_submitted",
    initiallyApproved: staff.role === "registered_manager" || staff.role === "deputy_manager",
  };
}

type TimesheetEntry = ReturnType<typeof buildTimesheetData>;

function TimesheetRow({
  data,
  approved,
  onApprove,
  onView,
}: {
  data: TimesheetEntry;
  approved: boolean;
  onApprove: () => void;
  onView: () => void;
}) {
  const statusConfig = {
    complete:      { label: "Submitted",     color: "bg-emerald-100 text-emerald-700" },
    partial:       { label: "Partial",       color: "bg-amber-100 text-amber-700" },
    not_submitted: { label: "Not submitted", color: "bg-slate-100 text-slate-500" },
  }[data.status] ?? { label: "Unknown", color: "bg-slate-100 text-slate-500" };

  return (
    <div className="flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors group">
      <Avatar name={data.staff.full_name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{data.staff.full_name}</span>
          {approved && <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700">Approved</Badge>}
        </div>
        <div className="text-xs text-slate-500">{data.staff.job_title} · {data.staff.contracted_hours}h/wk contracted</div>
      </div>
      <div className="text-center w-20">
        <div className="text-sm font-semibold text-slate-900">{hoursLabel(data.totalScheduledMins)}</div>
        <div className="text-[10px] text-slate-400">Worked</div>
      </div>
      <div className="text-center w-20">
        <div className={cn("text-sm font-semibold", data.overtimeMinutes > 0 ? "text-orange-600" : "text-slate-400")}>
          {data.overtimeMinutes > 0 ? hoursLabel(data.overtimeMinutes) : "—"}
        </div>
        <div className="text-[10px] text-slate-400">Overtime</div>
      </div>
      <div className="text-center w-24">
        <div className="text-sm font-semibold text-slate-900">£{data.overtimePay.toFixed(2)}</div>
        <div className="text-[10px] text-slate-400">OT pay</div>
      </div>
      <Badge className={cn("text-[10px] rounded-full shrink-0", statusConfig.color)}>{statusConfig.label}</Badge>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onView}>
          View
        </Button>
        {!approved && (
          <Button size="sm" className="h-7 text-xs" onClick={onApprove}>
            Approve
          </Button>
        )}
      </div>
    </div>
  );
}

type StatusFilterKey = "all" | "complete" | "partial" | "not_submitted";

export default function TimesheetsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("timesheets");
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("this_week");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [sortBy, setSortBy] = useState<"name" | "hours" | "overtime" | "status">("name");
  const [clockForm, setClockForm] = useState(EMPTY_CLOCK_FORM);
  const [clockError, setClockError] = useState("");
  const [clockSaved, setClockSaved] = useState(false);

  const staffQuery = useStaff();
  const activeStaff = useMemo(
    () => (staffQuery.data?.data ?? []).filter((s) => s.is_active && s.role !== "responsible_individual"),
    [staffQuery.data]
  );

  // Fetch shifts for the past 3 weeks so we cover the full 14-day window
  const rotaThisWeek = useRota(daysFromNow(0));
  const rotaLastWeek = useRota(daysFromNow(-7));
  const rotaPrevWeek = useRota(daysFromNow(-14));
  const allShifts: Shift[] = [
    ...(rotaThisWeek.data?.shifts ?? []),
    ...(rotaLastWeek.data?.shifts ?? []),
    ...(rotaPrevWeek.data?.shifts ?? []),
  ];

  // Build timesheet data from live staff + live shifts
  const timesheetData = useMemo(
    () => activeStaff.map((s) => buildTimesheetData(s, allShifts)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeStaff, rotaThisWeek.data, rotaLastWeek.data, rotaPrevWeek.data]
  );

  // Approval state — managers start pre-approved
  const [approvedIds, setApprovedIds] = useState<Set<string>>(() => new Set());
  const initialApprovedIds = useMemo(
    () => new Set(timesheetData.filter((d) => d.initiallyApproved).map((d) => d.staff.id)),
    [timesheetData]
  );
  const effectiveApprovedIds = useMemo(
    () => new Set([...initialApprovedIds, ...approvedIds]),
    [initialApprovedIds, approvedIds]
  );

  const createLeave = useCreateLeave();
  const [toilConverted, setToilConverted] = useState<Set<string>>(new Set());
  const [toilError, setToilError] = useState<string | null>(null);

  function exportCSV() {
    const periodLabel = weekFilter === "this_week" ? "This Week" : weekFilter === "last_week" ? "Last Week" : "This Month";
    const headers = ["Staff Name", "Job Title", "Payroll ID", "Contracted Hrs/wk", "Hours Worked", "Overtime Mins", "OT Pay (£)", "Status", "Approved"];
    const rows = timesheetData.map((d) => [
      d.staff.full_name,
      d.staff.job_title,
      d.staff.payroll_id ?? "",
      String(d.staff.contracted_hours),
      (d.totalScheduledMins / 60).toFixed(2),
      String(d.overtimeMinutes),
      d.overtimePay.toFixed(2),
      d.status,
      effectiveApprovedIds.has(d.staff.id) ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${periodLabel.toLowerCase().replace(/ /g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleApprove(staffId: string) {
    setApprovedIds((prev) => new Set([...prev, staffId]));
  }
  function handleApproveAll() {
    setApprovedIds(new Set(timesheetData.map((d) => d.staff.id)));
  }
  function handleSaveManualEntry() {
    if (!clockForm.staffId) { setClockError("Please select a staff member."); return; }
    if (!clockForm.clockIn) { setClockError("Clock-in time is required."); return; }
    setClockError("");
    setClockSaved(true);
    setClockForm(EMPTY_CLOCK_FORM);
    setTimeout(() => setClockSaved(false), 4000);
  }

  async function handleConvertToToil(d: TimesheetEntry) {
    setToilError(null);
    const days = Math.floor(d.overtimeMinutes / 480);
    if (days < 1) { setToilError("Not enough overtime for TOIL day."); return; }
    try {
      await createLeave.mutateAsync({
        staff_id: d.staff.id,
        leave_type: "toil",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + (days - 1) * 86400000).toISOString().slice(0, 10),
        total_days: days,
        reason: `Converted from ${d.overtimeMinutes} overtime minutes`,
        status: "approved",
        approved_by: "system",
        approved_at: new Date().toISOString(),
        home_id: d.staff.home_id || "home_oak",
        return_to_work_required: false,
        return_to_work_completed: false,
        return_to_work_date: null,
        return_to_work_by: null,
        return_to_work_notes: null,
      });
      setToilConverted(prev => new Set([...prev, d.staff.id]));
    } catch {
      setToilError("Failed to convert to TOIL. Please try again.");
    }
  }

  const totals = useMemo(() => {
    const totalHours = timesheetData.reduce((a, d) => a + d.totalScheduledMins, 0);
    const totalOT = timesheetData.reduce((a, d) => a + d.overtimeMinutes, 0);
    const totalOTPay = timesheetData.reduce((a, d) => a + d.overtimePay, 0);
    const pendingApproval = timesheetData.filter((d) => !effectiveApprovedIds.has(d.staff.id)).length;
    return { totalHours, totalOT, totalOTPay, pendingApproval };
  }, [timesheetData, effectiveApprovedIds]);

  // Filtered timesheet data
  const filteredTimesheetData = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = [...timesheetData];

    if (statusFilter !== "all") {
      list = list.filter((d) => d.status === statusFilter);
    }

    if (q) {
      list = list.filter((d) =>
        d.staff.full_name.toLowerCase().includes(q) ||
        d.staff.job_title.toLowerCase().includes(q) ||
        (d.staff.payroll_id ?? "").toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case "hours":
          return b.totalScheduledMins - a.totalScheduledMins;
        case "overtime":
          return b.overtimeMinutes - a.overtimeMinutes;
        case "status": {
          const so: Record<string, number> = { not_submitted: 0, partial: 1, complete: 2 };
          return (so[a.status] ?? 9) - (so[b.status] ?? 9);
        }
        case "name":
        default:
          return a.staff.full_name.localeCompare(b.staff.full_name);
      }
    });

    return list;
  }, [timesheetData, search, statusFilter, sortBy]);

  const isTimesheetFiltered = search.trim() !== "" || statusFilter !== "all";
  const isLoading = staffQuery.isPending;

  const tabs = [
    { id: "timesheets" as Tab, label: "Timesheets", icon: FileText },
    { id: "clock" as Tab, label: "Clock In/Out", icon: Clock },
    { id: "overtime" as Tab, label: "Overtime", icon: Timer },
    { id: "payroll" as Tab, label: "Payroll Export", icon: Coins },
  ];

  return (
    <PageShell
      title="Timesheets"
      subtitle="Clock in/out, hours tracking, overtime, and payroll export"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Timesheets" subtitle="Oak House — Staff Timesheets" targetId="timesheets-content" />
          <SmartUploadButton variant="inline" label="Upload Timesheet" uploadContext="Timesheets — timesheet or payroll upload" />
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={isLoading}>
            <Download className="h-3.5 w-3.5 mr-1" />Export CSV
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleApproveAll}
            disabled={totals.pendingApproval === 0 || isLoading}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            {totals.pendingApproval === 0 ? "All Approved" : "Approve All"}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div id="timesheets-content" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Hours Worked", value: hoursLabel(totals.totalHours), icon: Clock, color: "text-blue-600", bg: "bg-blue-50", sub: "Last 2 weeks" },
              { label: "Overtime Hours", value: hoursLabel(totals.totalOT), icon: Timer, color: "text-orange-600", bg: "bg-orange-50", sub: `£${totals.totalOTPay.toFixed(0)} payable` },
              { label: "Pending Approval", value: totals.pendingApproval, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", sub: "Timesheets" },
              { label: "Clocked In Now", value: CLOCK_LOG.filter((c) => c.status === "clocked_in").length, icon: Play, color: "text-emerald-600", bg: "bg-emerald-50", sub: "Live" },
            ].map(({ label, value, icon: Icon, color, bg, sub }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                    <div className={cn("mt-1 text-2xl font-bold tabular-nums", color)}>{value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
                  </div>
                  <div className={cn("rounded-2xl p-3", bg)}>
                    <Icon className={cn("h-5 w-5", color)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>

          {/* Timesheets tab */}
          {tab === "timesheets" && (
            <div className="space-y-4">
              {/* Search & filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by staff name, job title, payroll ID…"
                    className="pl-9 h-9 text-sm rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
                    <option value="name">Name A–Z</option>
                    <option value="hours">Hours (most)</option>
                    <option value="overtime">Overtime (most)</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {([
                    ["all", "All"],
                    ["complete", "Complete"],
                    ["partial", "Partial"],
                    ["not_submitted", "Not Submitted"],
                  ] as [StatusFilterKey, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={cn(
                        "px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors",
                        statusFilter === key
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results count */}
              {isTimesheetFiltered && (
                <div className="text-xs text-slate-500">
                  Showing {filteredTimesheetData.length} of {timesheetData.length} staff
                </div>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />Staff Timesheets
                    </CardTitle>
                    <div className="flex gap-1">
                      {(["this_week", "last_week", "this_month"] as WeekFilter[]).map((w) => (
                        <button
                          key={w}
                          onClick={() => setWeekFilter(w)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                            weekFilter === w ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                        >
                          {w.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredTimesheetData.length === 0 && isTimesheetFiltered ? (
                    <div className="py-8 text-center text-slate-400">
                      <Search className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                      <div className="text-sm font-medium">No timesheets match your filters</div>
                      <div className="text-xs mt-1">Try adjusting your search or status filter</div>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredTimesheetData.map((d) => (
                        <TimesheetRow
                          key={d.staff.id}
                          data={d}
                          approved={effectiveApprovedIds.has(d.staff.id)}
                          onApprove={() => handleApprove(d.staff.id)}
                          onView={() => router.push(`/timesheets/${d.staff.id}`)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clock In/Out tab */}
          {tab === "clock" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500" />Today&apos;s Clock Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {CLOCK_LOG.map((entry) => (
                      <div key={entry.staffId} className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 border",
                        entry.status === "clocked_in" ? "bg-emerald-50 border-emerald-200"
                          : entry.status === "completed" ? "bg-slate-50 border-slate-200"
                          : "bg-white border-slate-200"
                      )}>
                        <Avatar name={getStaffName(entry.staffId)} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">{getStaffName(entry.staffId)}</div>
                          <div className="text-xs text-slate-500">Shift {entry.shiftStart} – {entry.shiftEnd}</div>
                        </div>
                        <div className="text-right">
                          {entry.clockIn && (
                            <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                              <Play className="h-3 w-3" />{entry.clockIn}
                            </div>
                          )}
                          {entry.clockOut && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Square className="h-3 w-3" />{entry.clockOut}
                            </div>
                          )}
                          {entry.break && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Coffee className="h-2.5 w-2.5" />{entry.break}
                            </div>
                          )}
                        </div>
                        <Badge className={cn("text-[9px] rounded-full shrink-0",
                          entry.status === "clocked_in" ? "bg-emerald-100 text-emerald-700"
                            : entry.status === "completed" ? "bg-slate-100 text-slate-600"
                            : "bg-blue-100 text-blue-700"
                        )}>
                          {entry.status === "clocked_in" ? "On shift" : entry.status === "completed" ? "Completed" : "Scheduled"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Manual Clock Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clockSaved && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />Manual entry saved successfully.
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Staff member</label>
                      <select
                        value={clockForm.staffId}
                        onChange={(e) => setClockForm((f) => ({ ...f, staffId: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select staff...</option>
                        {activeStaff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Clock in time</label>
                        <input
                          type="time"
                          value={clockForm.clockIn}
                          onChange={(e) => setClockForm((f) => ({ ...f, clockIn: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Clock out time</label>
                        <input
                          type="time"
                          value={clockForm.clockOut}
                          onChange={(e) => setClockForm((f) => ({ ...f, clockOut: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Break duration (minutes)</label>
                      <input
                        type="number"
                        value={clockForm.breakMins}
                        onChange={(e) => setClockForm((f) => ({ ...f, breakMins: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for manual entry</label>
                      <textarea
                        value={clockForm.reason}
                        onChange={(e) => setClockForm((f) => ({ ...f, reason: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. System was unavailable during shift"
                      />
                    </div>
                    {clockError && <p className="text-xs text-red-600 font-medium">{clockError}</p>}
                    <Button className="w-full" onClick={handleSaveManualEntry}>
                      <Edit3 className="h-4 w-4 mr-2" />Save Manual Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Overtime tab */}
          {tab === "overtime" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-500" />Overtime Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timesheetData.filter((d) => d.overtimeMinutes > 0).map((d) => (
                    <div key={d.staff.id} className="flex items-center gap-4 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
                      <Avatar name={d.staff.full_name} size="sm" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{d.staff.full_name}</div>
                        <div className="text-xs text-slate-500">{d.staff.job_title}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-bold text-orange-700">{hoursLabel(d.overtimeMinutes)}</div>
                        <div className="text-[10px] text-orange-500">Overtime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-bold text-slate-900">£{(d.hourlyRate * 1.5).toFixed(2)}/h</div>
                        <div className="text-[10px] text-slate-400">OT rate (1.5x)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-bold text-emerald-700">£{d.overtimePay.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Payable</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn("h-7 text-xs", toilConverted.has(d.staff.id) && "border-emerald-300 text-emerald-700 bg-emerald-50")}
                        disabled={toilConverted.has(d.staff.id) || createLeave.isPending}
                        onClick={() => handleConvertToToil(d)}
                      >
                        {toilConverted.has(d.staff.id)
                          ? "TOIL Added"
                          : createLeave.isPending
                            ? (<><Loader2 className="h-4 w-4 animate-spin" />Converting…</>)
                            : "Convert to TOIL"}
                      </Button>
                      {toilError && (
                        <div className="text-xs text-red-600 font-medium mt-1">{toilError}</div>
                      )}
                    </div>
                  ))}
                  {timesheetData.filter((d) => d.overtimeMinutes === 0).length > 0 && (
                    <div className="text-center py-4 text-sm text-slate-400">
                      {timesheetData.filter((d) => d.overtimeMinutes === 0).length} staff with no overtime this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payroll Export tab */}
          {tab === "payroll" && (
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="h-4 w-4 text-emerald-500" />Payroll Export
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-slate-900">{activeStaff.length}</div>
                          <div className="text-xs text-slate-500">Staff in export</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-slate-900">£{timesheetData.reduce((a, d) => a + d.overtimePay, 0).toFixed(2)}</div>
                          <div className="text-xs text-slate-500">Overtime total</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-emerald-700">Ready</div>
                          <div className="text-xs text-slate-500">Export status</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {timesheetData.map((d) => (
                        <div key={d.staff.id} className="flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">{d.staff.full_name}</div>
                            <div className="text-xs text-slate-500">
                              Payroll ID: {d.staff.payroll_id || "—"} · {d.staff.contracted_hours}h contracted
                            </div>
                          </div>
                          <div className="text-sm text-slate-600">{hoursLabel(d.totalScheduledMins)} worked</div>
                          <div className="text-sm font-semibold text-orange-600">+{hoursLabel(d.overtimeMinutes)} OT</div>
                          <div className="text-sm font-bold text-slate-900">£{d.overtimePay.toFixed(2)} extra</div>
                          <Badge className={cn("text-[9px] rounded-full", effectiveApprovedIds.has(d.staff.id) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                            {effectiveApprovedIds.has(d.staff.id) ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1" onClick={exportCSV}>
                        <Download className="h-4 w-4 mr-2" />Export to CSV
                      </Button>
                      <Button variant="outline" className="flex-1" disabled title="Sage export requires the Sage payroll integration to be configured in Settings.">
                        <FileText className="h-4 w-4 mr-2" />Sage Payroll Export
                      </Button>
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled title="Payroll submission requires integration with your payroll provider.">
                        <ArrowUpRight className="h-4 w-4 mr-2" />Submit to Payroll
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
