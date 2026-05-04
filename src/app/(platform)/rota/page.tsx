"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, Users,
  Sun, AlertTriangle, UserX, CheckCircle2, Loader2, X,
  Search, BarChart3, Timer,
} from "lucide-react";
import { useRota, useCreateShift, useAssignShift } from "@/hooks/use-rota";
import { useStaff } from "@/hooks/use-staff";
import { cn, todayStr, formatDate } from "@/lib/utils";
import { SHIFT_TYPES, SHIFT_TYPE_LABELS } from "@/lib/constants";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton } from "@/components/common/export-button";
import type { ExportColumn } from "@/components/common/export-button";
import type { Shift } from "@/types";
import { getStaffName as seedGetStaffName } from "@/lib/seed-data";

const SHIFT_COLORS: Record<string, string> = {
  day: "bg-emerald-100 text-emerald-800 border-emerald-200",
  sleep_in: "bg-indigo-100 text-indigo-800 border-indigo-200",
  waking_night: "bg-violet-100 text-violet-800 border-violet-200",
  short: "bg-sky-100 text-sky-800 border-sky-200",
  handover: "bg-amber-100 text-amber-800 border-amber-200",
  on_call: "bg-slate-100 text-slate-700 border-slate-200",
  training_day: "bg-blue-100 text-blue-800 border-blue-200",
};

const SHIFT_EXPORT_COLS: ExportColumn<Shift>[] = [
  { header: "Staff", accessor: (r) => r.is_open_shift ? "OPEN SHIFT" : seedGetStaffName(r.staff_id) },
  { header: "Date", accessor: (r) => r.date },
  { header: "Shift Type", accessor: (r) => SHIFT_TYPE_LABELS[r.shift_type as keyof typeof SHIFT_TYPE_LABELS] || r.shift_type },
  { header: "Start Time", accessor: (r) => r.start_time },
  { header: "End Time", accessor: (r) => r.end_time },
  { header: "Break (mins)", accessor: (r) => r.break_minutes },
  { header: "Status", accessor: (r) => r.status.replace(/_/g, " ") },
  { header: "Actual Start", accessor: (r) => r.actual_start ?? "" },
  { header: "Actual End", accessor: (r) => r.actual_end ?? "" },
  { header: "Overtime (mins)", accessor: (r) => r.overtime_minutes },
  { header: "Open Shift", accessor: (r) => r.is_open_shift ? "Yes" : "No" },
  { header: "Notes", accessor: (r) => r.notes ?? "" },
];

function getMondayOfWeek(offset: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset * 7);
  return d.toISOString().slice(0, 10);
}

export default function RotaPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = todayStr();

  // Add shift modal state
  const [addShift, setAddShift] = useState<{ staffId: string; staffName: string; date: string } | null>(null);
  const [shiftType, setShiftType] = useState<string>("day");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [shiftNotes, setShiftNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fill shift modal state
  const [fillShift, setFillShift] = useState<{ date: string; start: string; end: string; type: string } | null>(null);
  const [fillStaffId, setFillStaffId] = useState("");
  const [fillError, setFillError] = useState<string | null>(null);

  const weekStart = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart + "T00:00:00");
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekStart]);

  const weekLabel = useMemo(() => {
    const s = new Date(weekDates[0] + "T00:00:00");
    const e = new Date(weekDates[6] + "T00:00:00");
    return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }, [weekDates]);

  const rotaQuery = useRota(weekStart);
  const staffQuery = useStaff();
  const createShift = useCreateShift(weekStart);
  const assignShift = useAssignShift(weekStart);

  const [staffSearch, setStaffSearch] = useState("");

  const shifts = rotaQuery.data?.shifts ?? [];
  const leave = rotaQuery.data?.leave ?? [];
  const meta = rotaQuery.data?.meta;
  const activeStaff = (staffQuery.data?.data ?? []).filter((s) => s.role !== "responsible_individual");

  const todayShifts = shifts.filter((s) => s.date === today && !s.is_open_shift);
  const isLoading = rotaQuery.isPending || staffQuery.isPending;

  // Filter staff by search
  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return activeStaff;
    const q = staffSearch.toLowerCase().trim();
    return activeStaff.filter((s) =>
      s.full_name.toLowerCase().includes(q) || s.job_title.toLowerCase().includes(q),
    );
  }, [activeStaff, staffSearch]);

  // Shift type distribution for the week
  const shiftTypeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of shifts) {
      if (!s.is_open_shift) {
        counts[s.shift_type] = (counts[s.shift_type] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count, label: SHIFT_TYPE_LABELS[type as keyof typeof SHIFT_TYPE_LABELS] || type }));
  }, [shifts]);

  // Weekly hours per staff
  const staffWeeklyHours = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of shifts) {
      if (s.is_open_shift) continue;
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60; // overnight
      mins -= s.break_minutes;
      map[s.staff_id] = (map[s.staff_id] || 0) + mins;
    }
    return map;
  }, [shifts]);

  const totalWeeklyHours = useMemo(() => {
    return Math.round(Object.values(staffWeeklyHours).reduce((sum, m) => sum + m, 0) / 60);
  }, [staffWeeklyHours]);

  function openAddShift(staffId: string, staffName: string, date: string) {
    setAddShift({ staffId, staffName, date });
    setShiftType("day");
    setStartTime("09:00");
    setEndTime("17:00");
    setShiftNotes("");
    setSaveError(null);
  }

  function openFillShift(s: { date: string; start: string; end: string; type: string }) {
    setFillShift(s);
    setFillStaffId("");
    setFillError(null);
  }

  async function handleFillShift() {
    if (!fillShift || !fillStaffId) { setFillError("Please select a staff member."); return; }
    setFillError(null);
    try {
      await assignShift.mutateAsync({ shift_date: fillShift.date, start_time: fillShift.start, staff_id: fillStaffId });
      setFillShift(null);
    } catch {
      setFillError("Failed to assign shift. Please try again.");
    }
  }

  async function handleSaveShift() {
    if (!addShift) return;
    setSaveError(null);
    try {
      await createShift.mutateAsync({
        staff_id: addShift.staffId,
        date: addShift.date,
        shift_type: shiftType,
        start_time: startTime,
        end_time: endTime,
        notes: shiftNotes || undefined,
      });
      setAddShift(null);
    } catch {
      setSaveError("Failed to save shift. Please try again.");
    }
  }

  return (
    <>
    <PageShell
      title="Rota"
      subtitle={weekLabel}
      quickCreateContext={{ module: "rota", defaultTaskCategory: "staffing" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={shifts} columns={SHIFT_EXPORT_COLS} filename={`rota-${weekStart}`} />
          <PrintButton title="Rota" subtitle="Oak House — Staff Rota & Scheduling" targetId="rota-content" />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Rota — rota or schedule upload" />
          <Button variant="outline" size="sm" disabled title="Shifts are added through your scheduling system.">
            <Plus className="h-3.5 w-3.5" /> Add Shift
          </Button>
          <Button size="sm" disabled title="Rota publication requires all open shifts to be filled.">
            Publish Rota
          </Button>
        </div>
      }
    >
      <div id="rota-content" className="space-y-6 animate-fade-in">

        {/* Today's Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "On Shift Today",    value: meta?.on_shift_today    ?? "—", color: "text-emerald-600" },
            { label: "Sleep-ins Tonight", value: meta?.sleep_ins_tonight ?? "—", color: "text-indigo-600" },
            { label: "Open Shifts",       value: meta?.open_shifts       ?? "—", color: meta?.open_shifts ? "text-amber-600" : "text-slate-900", ring: (meta?.open_shifts ?? 0) > 0 },
            { label: "On Leave",          value: meta?.on_leave_today    ?? "—", color: "text-blue-600" },
            { label: "Late Arrivals",     value: meta?.late_arrivals     ?? "—", color: meta?.late_arrivals ? "text-red-600" : "text-emerald-600" },
          ].map(({ label, value, color, ring }) => (
            <div key={label} className={cn("rounded-2xl border bg-white p-4 text-center", ring && "ring-1 ring-amber-200")}>
              <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Open Shift Alerts */}
        {(meta?.open_shift_dates?.length ?? 0) > 0 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Open Shifts Need Covering</span>
            </div>
            <div className="space-y-1.5">
              {meta!.open_shift_dates.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-amber-100">
                  <div className="text-xs">
                    <span className="font-medium text-slate-900">{formatDate(s.date)}</span>
                    <span className="text-slate-500 ml-2">{s.start} – {s.end}</span>
                    <span className="text-slate-400 ml-2">({SHIFT_TYPE_LABELS[s.type as keyof typeof SHIFT_TYPE_LABELS] || s.type})</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="text-xs h-7" disabled>Offer to Bank</Button>
                    <Button size="sm" className="text-xs h-7 bg-amber-600 hover:bg-amber-700" onClick={() => openFillShift(s)}>Fill Shift</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shift type breakdown + total hours */}
        {shiftTypeBreakdown.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600">Week Shift Distribution</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Timer className="h-3.5 w-3.5" />
                <span className="font-medium tabular-nums">{totalWeeklyHours}h</span> total
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {shiftTypeBreakdown.map(({ type, count, label }) => (
                <div key={type} className={cn("rounded-lg border px-2.5 py-1.5 text-[11px] font-medium", SHIFT_COLORS[type] || "bg-slate-100 text-slate-700")}>
                  {label} <span className="opacity-75 tabular-nums">×{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week Navigation + Search */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex items-center gap-3 flex-1 justify-center">
            <span className="text-sm font-semibold text-slate-900">{weekLabel}</span>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
            )}
          </div>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter staff..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none transition-all"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Rota Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 w-[180px] sticky left-0 bg-slate-50 z-10">Staff</th>
                    {weekDates.map((date) => {
                      const d = new Date(date + "T00:00:00");
                      const isToday = date === today;
                      return (
                        <th key={date} className={cn("py-3 px-2 text-center text-xs font-medium min-w-[120px]", isToday ? "bg-blue-50 text-blue-700" : "text-slate-600")}>
                          <div>{d.toLocaleDateString("en-GB", { weekday: "short" })}</div>
                          <div className={cn("text-lg font-bold mt-0.5", isToday && "text-blue-700")}>{d.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => {
                    const staffLeave = leave.filter((l) => l.staff_id === staff.id);
                    const weekMins = staffWeeklyHours[staff.id] || 0;
                    const weekHrs = Math.round(weekMins / 60 * 10) / 10;
                    const overContracted = staff.contracted_hours > 0 && weekHrs > staff.contracted_hours;
                    return (
                      <tr key={staff.id} className="border-b hover:bg-slate-50/50">
                        <td className="py-2 px-4 sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <Avatar name={staff.full_name} size="sm" />
                            <div>
                              <div className="text-xs font-medium text-slate-900">{staff.full_name}</div>
                              <div className={cn("text-[10px]", overContracted ? "text-red-500 font-medium" : "text-slate-400")}>
                                {weekHrs > 0 ? `${weekHrs}h` : "—"} / {staff.contracted_hours}h
                              </div>
                            </div>
                          </div>
                        </td>
                        {weekDates.map((date) => {
                          const shift = shifts.find((s) => s.staff_id === staff.id && s.date === date);
                          const isOnLeave = staffLeave.some((l) => l.start_date <= date && l.end_date >= date);
                          const isToday = date === today;

                          return (
                            <td key={date} className={cn("py-2 px-2 text-center", isToday && "bg-blue-50/50")}>
                              {shift ? (
                                <div className={cn("rounded-lg border px-2 py-1.5 text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity", SHIFT_COLORS[shift.shift_type] || "bg-slate-100 text-slate-700")}>
                                  <div>{SHIFT_TYPE_LABELS[shift.shift_type] || shift.shift_type}</div>
                                  <div className="text-[9px] opacity-75">{shift.start_time}–{shift.end_time}</div>
                                  {shift.status === "in_progress" && (
                                    <div className="h-1 w-1 rounded-full bg-current mx-auto mt-0.5 animate-pulse-dot" />
                                  )}
                                </div>
                              ) : isOnLeave ? (
                                <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[10px] font-medium text-amber-700">
                                  Leave
                                </div>
                              ) : (
                                <div
                                  className="rounded-lg border border-dashed border-slate-200 px-2 py-1.5 text-[10px] text-slate-300 cursor-pointer hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 transition-colors"
                                  onClick={() => openAddShift(staff.id, staff.full_name, date)}
                                  title={`Add shift for ${staff.full_name}`}
                                >
                                  +
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Today's Coverage Detail */}
        {todayShifts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />Today&apos;s Coverage Detail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayShifts.map((shift) => {
                  const staff = activeStaff.find((s) => s.id === shift.staff_id);
                  if (!staff) return null;
                  return (
                    <div key={shift.id} className={cn("rounded-xl border p-3", shift.status === "in_progress" ? "border-emerald-200 bg-emerald-50/50" : "")}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar name={staff.full_name} size="md" />
                          {shift.status === "in_progress" && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900">{staff.full_name}</div>
                          <div className="text-xs text-slate-500">{staff.job_title}</div>
                        </div>
                        <Badge className={cn("rounded-full text-[10px] border shrink-0", SHIFT_COLORS[shift.shift_type])}>
                          {SHIFT_TYPE_LABELS[shift.shift_type] || shift.shift_type}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                        <div className="text-slate-500"><Clock className="h-3 w-3 inline mr-0.5" />{shift.start_time} – {shift.end_time}</div>
                        {shift.clock_in_at && (
                          <div className="text-emerald-600"><CheckCircle2 className="h-3 w-3 inline mr-0.5" />Clocked in</div>
                        )}
                        {shift.notes && <div className="col-span-2 text-amber-600 font-medium">{shift.notes}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Empty state for filtered search */}
        {!isLoading && filteredStaff.length === 0 && staffSearch && (
          <div className="text-center py-8 text-slate-400">
            <Search className="h-6 w-6 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No staff matching &ldquo;{staffSearch}&rdquo;</p>
            <button onClick={() => setStaffSearch("")} className="text-xs text-indigo-600 hover:underline mt-1">Clear search</button>
          </div>
        )}

        {/* Regulatory note */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulation 22 (Staffing) — </span>
          The registered person must ensure there are sufficient numbers of suitably qualified, competent, skilled and
          experienced staff deployed at all times to meet the care needs of each child. Rotas must demonstrate adequate
          waking and sleeping cover, with contingency for absences. Open shifts should be filled promptly to maintain
          safe staffing ratios.
        </div>
      </div>
    </PageShell>

    {/* Add Shift Modal */}
    {addShift && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={() => setAddShift(null)}
      >
        <div
          className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <div className="text-sm font-bold text-slate-900">Add Shift</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {addShift.staffName} · {new Date(addShift.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>
            <button onClick={() => setAddShift(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Type</label>
              <select
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {SHIFT_TYPES.map((type) => (
                  <option key={type} value={type}>{SHIFT_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder="e.g. Cover for Anna"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            {saveError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {saveError}
              </div>
            )}
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAddShift(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              onClick={handleSaveShift}
              disabled={createShift.isPending}
            >
              {createShift.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
              ) : (
                <>Save Shift</>
              )}
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Fill Shift Modal */}
    {fillShift && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold text-slate-900">Fill Open Shift</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {formatDate(fillShift.date)} · {fillShift.start}–{fillShift.end} · {SHIFT_TYPE_LABELS[fillShift.type as keyof typeof SHIFT_TYPE_LABELS] || fillShift.type}
              </div>
            </div>
            <button onClick={() => setFillShift(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Assign to staff member</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={fillStaffId}
              onChange={(e) => setFillStaffId(e.target.value)}
            >
              <option value="">Select staff member…</option>
              {activeStaff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} — {s.job_title}</option>
              ))}
            </select>
          </div>

          {fillError && <p className="text-xs text-red-600">{fillError}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setFillShift(null)}>Cancel</Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={handleFillShift}
              disabled={assignShift.isPending}
            >
              {assignShift.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
              ) : (
                <>Assign Shift</>
              )}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
