"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays, Search, Plus, Filter, CheckCircle2, XCircle, Clock,
  AlertTriangle, ChevronRight, Users, Calendar,
  ClipboardCheck, Activity, Heart, Stethoscope,
  SunMedium, RotateCcw, Ban, Info, Loader2, ArrowUpDown,
} from "lucide-react";
import { getStaffName } from "@/lib/seed-data";
import { useLeave } from "@/hooks/use-leave";
import { useStaff } from "@/hooks/use-staff";
import { cn, todayStr, formatDate, daysFromNow } from "@/lib/utils";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import type { LeaveRequest } from "@/types";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";

type Tab = "overview" | "requests" | "calendar" | "sickness";
type StatusFilter = "all" | "pending" | "approved" | "declined";

const LEAVE_EXPORT_COLS: ExportColumn<LeaveRequest>[] = [
  { header: "Staff", accessor: (r) => getStaffName(r.staff_id) },
  { header: "Leave Type", accessor: (r) => LEAVE_TYPE_LABELS[r.leave_type as keyof typeof LEAVE_TYPE_LABELS] ?? r.leave_type },
  { header: "Start Date", accessor: (r) => r.start_date },
  { header: "End Date", accessor: (r) => r.end_date },
  { header: "Total Days", accessor: (r) => r.total_days },
  { header: "Status", accessor: (r) => r.status },
  { header: "RTW Required", accessor: (r) => r.return_to_work_required ? "Yes" : "No" },
  { header: "RTW Completed", accessor: (r) => r.return_to_work_completed ? "Yes" : "No" },
  { header: "Reason", accessor: (r) => r.reason },
];

const LEAVE_TYPE_ICONS: Record<string, React.ElementType> = {
  annual_leave: CalendarDays,
  sick: Stethoscope,
  compassionate: Heart,
  parental: Users,
  unpaid: Ban,
  toil: RotateCcw,
  training: ClipboardCheck,
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual_leave: "bg-blue-100 text-blue-700",
  sick: "bg-red-100 text-red-700",
  compassionate: "bg-violet-100 text-violet-700",
  parental: "bg-pink-100 text-pink-700",
  unpaid: "bg-slate-100 text-slate-600",
  toil: "bg-teal-100 text-teal-700",
  training: "bg-amber-100 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

// Leave entitlement per person (mock — would come from HR integration)
const ENTITLEMENTS: Record<string, { total: number; taken: number; pending: number; remaining: number }> = {
  staff_darren:    { total: 33, taken: 8,  pending: 0, remaining: 25 },
  staff_ryan:      { total: 28, taken: 5,  pending: 5, remaining: 18 },
  staff_anna:      { total: 28, taken: 15, pending: 0, remaining: 13 },
  staff_chervelle: { total: 25, taken: 6,  pending: 1, remaining: 18 },
  staff_edward:    { total: 25, taken: 12, pending: 0, remaining: 13 },
  staff_diane:     { total: 25, taken: 3,  pending: 0, remaining: 22 },
  staff_lackson:   { total: 25, taken: 7,  pending: 2, remaining: 16 },
  staff_mirela:    { total: 25, taken: 4,  pending: 0, remaining: 21 },
};

// Sickness / Bradford Factor (mock — would come from HR integration)
const SICKNESS_STATS: Record<string, { episodes: number; days: number; bradford: number; lastSick: string | null }> = {
  staff_darren:    { episodes: 0, days: 0, bradford: 0,  lastSick: null },
  staff_ryan:      { episodes: 1, days: 2, bradford: 2,  lastSick: daysFromNow(-40) },
  staff_anna:      { episodes: 2, days: 5, bradford: 20, lastSick: daysFromNow(-3) },
  staff_chervelle: { episodes: 1, days: 1, bradford: 1,  lastSick: daysFromNow(-60) },
  staff_edward:    { episodes: 0, days: 0, bradford: 0,  lastSick: null },
  staff_diane:     { episodes: 3, days: 7, bradford: 63, lastSick: daysFromNow(-15) },
  staff_lackson:   { episodes: 1, days: 3, bradford: 3,  lastSick: daysFromNow(-20) },
  staff_mirela:    { episodes: 0, days: 0, bradford: 0,  lastSick: null },
};

function BradfordBadge({ score }: { score: number }) {
  if (score === 0) return <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700">No issues</Badge>;
  if (score < 10) return <Badge className="text-[9px] rounded-full bg-blue-100 text-blue-700">Low ({score})</Badge>;
  if (score < 50) return <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700">Medium ({score})</Badge>;
  return <Badge className="text-[9px] rounded-full bg-red-100 text-red-700">High ({score})</Badge>;
}

function LeaveRow({ req, onClick }: { req: LeaveRequest; onClick: () => void }) {
  const Icon = LEAVE_TYPE_ICONS[req.leave_type] || CalendarDays;
  const today = todayStr();
  const isOnLeave = req.status === "approved" && req.start_date <= today && req.end_date >= today;
  const needsRTW = req.return_to_work_required && !req.return_to_work_completed && req.status === "approved" && req.end_date < today;

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors text-left group">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", LEAVE_TYPE_COLORS[req.leave_type] || "bg-slate-100")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{getStaffName(req.staff_id)}</span>
          {isOnLeave && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">On leave now</span>}
          {needsRTW && <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5 font-medium flex items-center gap-0.5"><AlertTriangle className="h-2.5 w-2.5" />RTW needed</span>}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {LEAVE_TYPE_LABELS[req.leave_type as keyof typeof LEAVE_TYPE_LABELS] || req.leave_type} · {formatDate(req.start_date)}
          {req.start_date !== req.end_date && ` – ${formatDate(req.end_date)}`} · {req.total_days} day{req.total_days !== 1 ? "s" : ""}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className={cn("text-[10px] rounded-full", STATUS_COLORS[req.status] || "bg-slate-100 text-slate-500")}>{req.status}</Badge>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100" />
      </div>
    </button>
  );
}

function RTWPanel({ req, onClose }: { req: LeaveRequest; onClose: () => void }) {
  const [notes, setNotes] = useState("");
  const [signed, setSigned] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Return to Work Interview</h2>
            <p className="text-sm text-slate-500">{getStaffName(req.staff_id)} · {formatDate(req.start_date)} – {formatDate(req.end_date)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <strong>Absence summary:</strong> {req.total_days} day{req.total_days !== 1 ? "s" : ""} absence · {LEAVE_TYPE_LABELS[req.leave_type as keyof typeof LEAVE_TYPE_LABELS]}
            {req.reason && <div className="mt-1 text-amber-700">Reason given: {req.reason}</div>}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Interview notes</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Record the return to work interview discussion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="rtw-sign" checked={signed} onChange={(e) => setSigned(e.target.checked)} className="rounded" />
            <label htmlFor="rtw-sign" className="text-sm text-slate-700">I confirm this return to work interview has been completed</label>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button disabled={!signed || !notes} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="h-4 w-4 mr-1" />Complete RTW
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LeavePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "staff" | "type">("date");
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [showRTW, setShowRTW] = useState(false);
  // Local status overrides — applied on top of API data for approve/decline actions
  const [statusOverrides, setStatusOverrides] = useState<Record<string, "approved" | "declined">>({});
  const today = todayStr();

  const leaveQuery = useLeave();
  const staffQuery = useStaff();

  const isLoading = leaveQuery.isPending || staffQuery.isPending;
  const apiLeave = leaveQuery.data?.data ?? [];
  const activeStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active && s.role !== "responsible_individual");

  // Apply local overrides on top of API data
  const leaveRequests = useMemo<LeaveRequest[]>(() => {
    return apiLeave.map((r) =>
      statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id] as LeaveRequest["status"] } : r
    );
  }, [apiLeave, statusOverrides]);

  function handleApprove(id: string) {
    setStatusOverrides((prev) => ({ ...prev, [id]: "approved" }));
  }
  function handleDecline(id: string) {
    setStatusOverrides((prev) => ({ ...prev, [id]: "declined" }));
  }

  const filteredRequests = useMemo(() => {
    let list = leaveRequests;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => getStaffName(r.staff_id).toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      switch (sortBy) {
        case "staff": return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        case "type": return a.leave_type.localeCompare(b.leave_type);
        default: return b.start_date.localeCompare(a.start_date);
      }
    });
  }, [leaveRequests, statusFilter, search, sortBy]);

  const stats = useMemo(() => {
    const pending = leaveRequests.filter((r) => r.status === "pending");
    const onLeaveNow = leaveRequests.filter((r) => r.status === "approved" && r.start_date <= today && r.end_date >= today);
    const needsRTW = leaveRequests.filter((r) => r.return_to_work_required && !r.return_to_work_completed && r.status === "approved" && r.end_date < today);
    const sickThisMonth = leaveRequests.filter((r) => r.leave_type === "sick" && r.start_date >= daysFromNow(-30));
    return { pending: pending.length, onLeave: onLeaveNow.length, needsRTW: needsRTW.length, sickMonth: sickThisMonth.length, onLeaveNow };
  }, [leaveRequests, today]);

  const rtwPending = useMemo(() =>
    leaveRequests.filter((r) => r.return_to_work_required && !r.return_to_work_completed && r.status === "approved" && r.end_date < today),
    [leaveRequests, today]
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "requests", label: "Leave Requests", icon: CalendarDays },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "sickness", label: "Sickness & RTW", icon: Stethoscope },
  ];

  return (
    <PageShell
      title="Leave & Absence"
      subtitle="Manage annual leave, sickness, lateness, and return-to-work workflows"
      quickCreateContext={{ module: "leave", defaultTaskCategory: "staffing" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Leave Management" subtitle="Oak House — Staff Leave Records" targetId="leave-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Leave — supporting document upload" />
          <ExportButton<LeaveRequest> filename="leave-export" data={filteredRequests} columns={LEAVE_EXPORT_COLS} label="Export" />
          <Button size="sm" disabled title="Leave requests are submitted directly by staff. Approve requests from the Leave Requests tab.">
            <Plus className="h-3.5 w-3.5 mr-1" />Request Leave
          </Button>
        </div>
      }
    >
      {/* RTW dialog */}
      {showRTW && selectedReq && (
        <RTWPanel req={selectedReq} onClose={() => { setShowRTW(false); setSelectedReq(null); }} />
      )}

      <div id="leave-content" className="space-y-6">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Alert: RTW needed */}
            {rtwPending.length > 0 && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-red-800">{rtwPending.length} return-to-work interview{rtwPending.length > 1 ? "s" : ""} outstanding</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {rtwPending.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { setSelectedReq(r); setShowRTW(true); }}
                        className="text-xs bg-white border border-red-200 text-red-700 rounded-full px-3 py-1 hover:bg-red-50 transition-colors"
                      >
                        {getStaffName(r.staff_id)} — Complete RTW
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Pending Approval", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "On Leave Now", value: stats.onLeave, icon: SunMedium, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "RTW Outstanding", value: stats.needsRTW, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
                { label: "Sick This Month", value: stats.sickMonth, icon: Stethoscope, color: "text-rose-600", bg: "bg-rose-50" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                      <div className={cn("mt-1 text-3xl font-bold tabular-nums", color)}>{value}</div>
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
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {tab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-5">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" />Leave Entitlements — {new Date().getFullYear()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {activeStaff.map((staff) => {
                          const ent = ENTITLEMENTS[staff.id] || { total: 25, taken: 0, pending: 0, remaining: 25 };
                          const pct = ent.total > 0 ? Math.round((ent.taken / ent.total) * 100) : 0;
                          return (
                            <div key={staff.id} className="space-y-1.5">
                              <div className="flex items-center gap-3">
                                <Avatar name={staff.full_name} size="xs" />
                                <span className="text-sm font-medium text-slate-900 flex-1">{staff.full_name}</span>
                                <div className="text-xs text-slate-500 text-right">
                                  <span className="font-semibold text-slate-900">{ent.taken}</span>/{ent.total} taken
                                  {ent.pending > 0 && <span className="text-amber-600 ml-1">+{ent.pending} pending</span>}
                                </div>
                              </div>
                              <Progress value={pct} color={pct > 80 ? "bg-amber-500" : "bg-blue-500"} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-5">
                  {/* On leave now */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2"><SunMedium className="h-4 w-4 text-emerald-500" />On Leave Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.onLeaveNow.length === 0 ? (
                        <div className="py-4 text-center text-sm text-slate-400">No staff on leave today</div>
                      ) : (
                        <div className="space-y-2">
                          {stats.onLeaveNow.map((r) => {
                            const Icon = LEAVE_TYPE_ICONS[r.leave_type] || CalendarDays;
                            return (
                              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                                <Avatar name={getStaffName(r.staff_id)} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-slate-900 truncate">{getStaffName(r.staff_id)}</div>
                                  <div className="text-[10px] text-slate-500">Back {formatDate(r.end_date)}</div>
                                </div>
                                <Badge className={cn("text-[9px] rounded-full", LEAVE_TYPE_COLORS[r.leave_type])}>
                                  <Icon className="h-2.5 w-2.5 mr-0.5" />
                                  {LEAVE_TYPE_LABELS[r.leave_type as keyof typeof LEAVE_TYPE_LABELS]}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pending requests */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" />Awaiting Approval</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {leaveRequests.filter((r) => r.status === "pending").length === 0 ? (
                        <div className="py-4 text-center text-sm text-slate-400">No pending requests</div>
                      ) : (
                        <div className="space-y-2">
                          {leaveRequests.filter((r) => r.status === "pending").map((r) => (
                            <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-slate-900">{getStaffName(r.staff_id)}</div>
                                <span className="text-xs text-amber-700">{r.total_days}d</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">{formatDate(r.start_date)} – {formatDate(r.end_date)}</div>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => handleApprove(r.id)}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleDecline(r.id)}>
                                  <XCircle className="h-3 w-3 mr-1" />Decline
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {tab === "requests" && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                    </div>
                    <div className="flex gap-1">
                      {(["all", "pending", "approved", "declined"] as StatusFilter[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                            statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "date" | "staff" | "type")}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="date">Date</option>
                        <option value="staff">Staff A–Z</option>
                        <option value="type">Leave type</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-slate-100">
                    {filteredRequests.length === 0 ? (
                      <div className="py-12 text-center text-sm text-slate-400">No leave requests match your filter</div>
                    ) : (
                      filteredRequests.map((req) => (
                        <LeaveRow key={req.id} req={req} onClick={() => setSelectedReq(req)} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendar Tab */}
            {tab === "calendar" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Team Leave Calendar — {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      <div className="grid grid-cols-[140px_1fr] gap-0">
                        <div className="text-xs font-semibold text-slate-500 pb-2">Staff</div>
                        <div className="grid grid-cols-30 gap-0 pb-2">
                          {Array.from({ length: 30 }, (_, i) => (
                            <div key={i} className="text-[9px] text-center text-slate-400">{i + 1}</div>
                          ))}
                        </div>
                        {activeStaff.map((staff) => {
                          const staffLeave = leaveRequests.filter((r) => r.staff_id === staff.id && r.status === "approved");
                          return (
                            <React.Fragment key={staff.id}>
                              <div className="flex items-center gap-2 py-1.5 border-t border-slate-100">
                                <Avatar name={staff.full_name} size="xs" />
                                <span className="text-xs text-slate-700 truncate">{staff.first_name}</span>
                              </div>
                              <div className="relative border-t border-slate-100 py-1.5">
                                <div className="flex gap-0 h-6">
                                  {Array.from({ length: 30 }, (_, i) => {
                                    const d = new Date();
                                    d.setDate(i + 1);
                                    const dateStr = d.toISOString().slice(0, 10);
                                    const onLeave = staffLeave.some((l) => l.start_date <= dateStr && l.end_date >= dateStr);
                                    const leave = staffLeave.find((l) => l.start_date <= dateStr && l.end_date >= dateStr);
                                    return (
                                      <div
                                        key={i}
                                        className={cn(
                                          "flex-1 rounded-sm mx-0.5 transition-colors",
                                          onLeave
                                            ? (leave?.leave_type === "sick" ? "bg-red-300" : leave?.leave_type === "annual_leave" ? "bg-blue-300" : "bg-teal-300")
                                            : "bg-slate-100"
                                        )}
                                        title={onLeave ? `${LEAVE_TYPE_LABELS[leave?.leave_type as keyof typeof LEAVE_TYPE_LABELS] || "Leave"}` : undefined}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100">
                        {[
                          { color: "bg-blue-300", label: "Annual Leave" },
                          { color: "bg-red-300", label: "Sickness" },
                          { color: "bg-teal-300", label: "TOIL / Other" },
                          { color: "bg-slate-100", label: "Working" },
                        ].map(({ color, label }) => (
                          <div key={label} className="flex items-center gap-1.5">
                            <div className={cn("h-3 w-6 rounded-sm", color)} />
                            <span className="text-xs text-slate-500">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sickness Tab */}
            {tab === "sickness" && (
              <div className="space-y-5">
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <strong>Bradford Factor</strong> = (number of episodes)² × total days absent. Score over 50 triggers a management review. Score over 200 may lead to formal action.
                  </div>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {activeStaff.map((staff) => {
                        const sick = SICKNESS_STATS[staff.id] || { episodes: 0, days: 0, bradford: 0, lastSick: null };
                        return (
                          <div key={staff.id} className="flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors">
                            <Avatar name={staff.full_name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900">{staff.full_name}</div>
                              <div className="text-xs text-slate-500">{staff.job_title}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-semibold text-slate-900">{sick.episodes}</div>
                              <div className="text-[10px] text-slate-400">Episodes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-semibold text-slate-900">{sick.days}</div>
                              <div className="text-[10px] text-slate-400">Days</div>
                            </div>
                            <div className="text-center min-w-24">
                              <BradfordBadge score={sick.bradford} />
                              <div className="text-[10px] text-slate-400 mt-0.5">Bradford</div>
                            </div>
                            {sick.lastSick ? (
                              <div className="text-right text-xs text-slate-400">Last: {formatDate(sick.lastSick)}</div>
                            ) : (
                              <div className="text-right text-xs text-emerald-600 font-medium">No absences</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
