"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import {
  BarChart3, Download,
  Users, Shield, GraduationCap, Clock, Receipt, AlertTriangle,
  CheckCircle2, Activity, FileText, Target,
  ArrowUp, ArrowDown, Minus, Loader2,
} from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useIncidents } from "@/hooks/use-incidents";
import { useTraining } from "@/hooks/use-training";
import { useStaff } from "@/hooks/use-staff";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useLeave } from "@/hooks/use-leave";
import { cn, todayStr } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

type ReportView = "overview" | "workforce" | "compliance" | "incidents" | "finance";

// Sparkline component (simple CSS bars)
function Sparkline({ values, color = "bg-blue-500" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className={cn("flex-1 rounded-t-sm transition-all", color)}
          style={{ height: `${Math.round((v / max) * 100)}%`, minHeight: v > 0 ? "4px" : "1px", opacity: v === 0 ? 0.2 : 1 }}
        />
      ))}
    </div>
  );
}

// Trend indicator
function Trend({ value, good = "up" }: { value: number; good?: "up" | "down" }) {
  const isPositive = value > 0;
  const isGood = good === "up" ? isPositive : !isPositive;
  return (
    <div className={cn("flex items-center gap-0.5 text-xs font-medium", isGood ? "text-emerald-600" : "text-red-600")}>
      {value > 0 ? <ArrowUp className="h-3 w-3" /> : value < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {Math.abs(value)}%
    </div>
  );
}

export default function ReportsPage() {
  const [view, setView] = useState<ReportView>("overview");
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const today = todayStr();

  // Live data hooks
  const allTasksQuery = useTasks();
  const incidentsQuery = useIncidents();
  const trainingQuery = useTraining();
  const staffQuery = useStaff();
  const ypQuery = useYoungPeople();
  const leaveQuery = useLeave();

  const isLoading =
    allTasksQuery.isPending ||
    incidentsQuery.isPending ||
    trainingQuery.isPending ||
    staffQuery.isPending ||
    ypQuery.isPending ||
    leaveQuery.isPending;

  // Tasks derived stats
  const allTasks = allTasksQuery.data?.data ?? [];
  const activeTasks = useMemo(() => allTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled"), [allTasks]);
  const completedTasks = useMemo(() => allTasks.filter((t) => t.status === "completed"), [allTasks]);
  const overdueTasks = useMemo(() => activeTasks.filter((t) => t.due_date && t.due_date < today), [activeTasks, today]);
  const taskCompletionRate = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

  // Incidents derived stats
  const allIncidents = incidentsQuery.data?.data ?? [];
  const openIncidents = useMemo(() => allIncidents.filter((i) => i.status === "open"), [allIncidents]);
  const closedIncidents = useMemo(() => allIncidents.filter((i) => i.status === "closed"), [allIncidents]);
  const criticalIncidents = useMemo(() => allIncidents.filter((i) => i.severity === "critical"), [allIncidents]);

  // Training derived stats
  const trainingMeta = trainingQuery.data?.meta;
  const allTraining = trainingQuery.data?.data ?? [];
  const trainingCompliancePct = trainingMeta?.rate ?? 0;

  // Staff derived stats
  const allStaff = staffQuery.data?.data ?? [];
  const activeStaff = useMemo(() => allStaff.filter((s) => s.is_active && s.role !== "responsible_individual"), [allStaff]);

  // YP stats
  const allYP = ypQuery.data?.data ?? [];

  // Leave derived stats
  const leaveMeta = leaveQuery.data?.meta;
  const allLeave = leaveQuery.data?.data ?? [];

  const tabs: { id: ReportView; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "workforce", label: "Workforce", icon: Users },
    { id: "compliance", label: "Compliance", icon: Shield },
    { id: "incidents", label: "Incidents", icon: AlertTriangle },
    { id: "finance", label: "Finance", icon: Receipt },
  ];

  const kpiCards = [
    { label: "Task Completion Rate", value: isLoading ? "—" : `${taskCompletionRate}%`, trend: 5, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", good: "up" as const },
    { label: "Training Compliance", value: isLoading ? "—" : `${trainingCompliancePct}%`, trend: -3, icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-50", good: "up" as const },
    { label: "Open Incidents", value: isLoading ? "—" : openIncidents.length, trend: 12, icon: Shield, color: "text-red-600", bg: "bg-red-50", good: "down" as const },
    { label: "Staff on Leave", value: isLoading ? "—" : (leaveMeta?.on_leave_today ?? "—"), trend: 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", good: "down" as const },
    { label: "Overdue Tasks", value: isLoading ? "—" : overdueTasks.length, trend: -20, icon: Clock, color: "text-orange-600", bg: "bg-orange-50", good: "down" as const },
    { label: "Sick Absences (30d)", value: isLoading ? "—" : (leaveMeta?.sick_instances_last_30 ?? "—"), trend: 8, icon: Activity, color: "text-rose-600", bg: "bg-rose-50", good: "down" as const },
  ];

  return (
    <PageShell
      title="Reports & Analytics"
      subtitle="Workforce, compliance, incident, and finance reporting for managers, RI, and Ofsted"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      quickCreateContext={{ module: "reports", defaultTaskCategory: "admin" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Reports" subtitle="Oak House — Management Reports" targetId="reports-content" />
          <SmartUploadButton variant="inline" label="Upload Report" uploadContext="Reports — report or evidence upload" />
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(["week", "month", "quarter", "year"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                  period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
              >{p}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" disabled title="PDF export requires the reporting integration to be configured by your system administrator.">
            <Download className="h-3.5 w-3.5 mr-1" />Export PDF
          </Button>
        </div>
      }
    >
      <div id="reports-content" className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpiCards.map(({ label, value, trend, icon: Icon, color, bg, good }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={cn("rounded-xl p-2", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <Trend value={trend} good={good} />
              </div>
              <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
              <div className="text-[10px] font-medium text-slate-500 mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Nav tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setView(id)}
              className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                view === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Global loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {/* Overview */}
        {!isLoading && view === "overview" && (
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Task completion over time */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" />Task Completion — Last 8 Weeks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Sparkline values={[3, 5, 4, 7, 6, 8, 5, 9]} color="bg-blue-400" />
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xl font-bold text-slate-900">{allTasks.length}</div>
                        <div className="text-[10px] text-slate-400">Total tasks</div>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <div className="text-xl font-bold text-emerald-600">{completedTasks.length}</div>
                        <div className="text-[10px] text-slate-400">Completed</div>
                      </div>
                      <div className="rounded-xl bg-red-50 p-3">
                        <div className="text-xl font-bold text-red-600">{overdueTasks.length}</div>
                        <div className="text-[10px] text-slate-400">Overdue</div>
                      </div>
                    </div>
                    <Progress value={taskCompletionRate} color={taskCompletionRate > 70 ? "bg-emerald-500" : "bg-amber-500"} />
                    <div className="text-xs text-center text-slate-400">{taskCompletionRate}% overall completion rate</div>
                  </div>
                </CardContent>
              </Card>

              {/* Incident trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-red-500" />Incidents — Last 8 Weeks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Sparkline values={[2, 1, 3, 2, 4, 2, 3, 2]} color="bg-red-300" />
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-red-50 p-3">
                        <div className="text-xl font-bold text-red-600">{allIncidents.length}</div>
                        <div className="text-[10px] text-slate-400">Total</div>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3">
                        <div className="text-xl font-bold text-amber-600">{openIncidents.length}</div>
                        <div className="text-[10px] text-slate-400">Open</div>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <div className="text-xl font-bold text-emerald-600">{closedIncidents.length}</div>
                        <div className="text-[10px] text-slate-400">Closed</div>
                      </div>
                    </div>
                    {/* By type */}
                    <div className="space-y-1.5">
                      {["safeguarding_concern", "missing_from_care", "physical_intervention", "self_harm", "medication_error"].map((type) => {
                        const count = allIncidents.filter((i) => i.type === type).length;
                        return (
                          <div key={type} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-600 flex-1 capitalize">{type.replace(/_/g, " ")}</span>
                            <div className="h-2 flex-1 max-w-[120px] bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-400 rounded-full" style={{ width: allIncidents.length > 0 ? `${(count / allIncidents.length) * 100}%` : "0%" }} />
                            </div>
                            <span className="font-semibold text-slate-900 w-4 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reg 44 / RI Report summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-violet-500" />Reg 44 / RI Report — Evidence Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "YP Views Captured", value: `${allYP.length}/3`, status: "good" },
                    { label: "Reg 44 Visit Due", value: "28 April 2026", status: "warn" },
                    { label: "Supervision Compliance", value: "83%", status: "warn" },
                    { label: "Ofsted Grade", value: "Good", status: "good" },
                  ].map(({ label, value, status }) => (
                    <div key={label} className={cn("rounded-xl p-4 border", status === "good" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200")}>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                      <div className={cn("text-lg font-bold", status === "good" ? "text-emerald-700" : "text-amber-700")}>{value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Workforce */}
        {!isLoading && view === "workforce" && (
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Staff Headcount & Roles</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(["registered_manager", "deputy_manager", "team_leader", "residential_care_worker", "bank_staff"] as const).map((role) => {
                      const count = allStaff.filter((s) => s.role === role && s.is_active).length;
                      if (count === 0) return null;
                      const pct = activeStaff.length > 0 ? Math.round((count / activeStaff.length) * 100) : 0;
                      const labels: Record<string, string> = {
                        registered_manager: "Registered Manager",
                        deputy_manager: "Deputy Manager",
                        team_leader: "Team Leader",
                        residential_care_worker: "Care Worker",
                        bank_staff: "Bank Staff",
                      };
                      return (
                        <div key={role} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-700">{labels[role] || role}</span>
                            <span className="font-semibold text-slate-900">{count}</span>
                          </div>
                          <Progress value={pct} color="bg-blue-400" className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Attendance & Leave (30 days)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Annual Leave Days Taken", value: leaveMeta?.annual_days_last_30 ?? 0, color: "bg-blue-400" },
                      { label: "Sick Days", value: leaveMeta?.sick_last_30_days ?? 0, color: "bg-red-400" },
                      { label: "TOIL Days", value: leaveMeta?.toil_days_last_30 ?? 0, color: "bg-teal-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-sm", color)} />
                          <span className="text-xs text-slate-700">{label}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{value} days</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                      <Sparkline values={[2, 0, 1, 3, 2, 1, 0, 2, 1, 3, 4, 2]} color="bg-red-300" />
                      <div className="text-[10px] text-slate-400 mt-1 text-center">Daily sick absences (last 12 days)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Per-staff summary */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Individual Performance Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeStaff.map((staff) => {
                    const totalTasks = allTasks.filter((t) => t.assigned_to === staff.id).length;
                    const completedForStaff = allTasks.filter((t) => t.assigned_to === staff.id && t.status === "completed").length;
                    const completionRate = totalTasks > 0 ? Math.round((completedForStaff / totalTasks) * 100) : 100;

                    return (
                      <div key={staff.id} className="flex items-center gap-4 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors">
                        <Avatar name={staff.full_name} size="xs" />
                        <span className="text-sm font-medium text-slate-900 w-36 truncate">{staff.full_name}</span>
                        <div className="flex-1">
                          <Progress value={completionRate} color={completionRate > 70 ? "bg-emerald-400" : completionRate > 40 ? "bg-amber-400" : "bg-red-400"} className="h-1.5" />
                        </div>
                        <span className="text-xs text-slate-500 w-20">{completedForStaff}/{totalTasks} tasks</span>
                        {staff.training_expired_count > 0 ? (
                          <Badge className="text-[9px] rounded-full bg-red-100 text-red-700">{staff.training_expired_count} expired training</Badge>
                        ) : (
                          <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700">Training OK</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compliance */}
        {!isLoading && view === "compliance" && (
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Training Matrix — Compliance Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeStaff.map((staff) => {
                    const compliant = staff.training_total_count - staff.training_expired_count - staff.training_expiring_count;
                    const expired = staff.training_expired_count;
                    const expiring = staff.training_expiring_count;
                    const pct = staff.training_total_count > 0
                      ? Math.round((Math.max(0, compliant) / staff.training_total_count) * 100)
                      : 0;
                    return (
                      <div key={staff.id} className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={staff.full_name} size="xs" />
                          <span className="text-sm text-slate-900 flex-1">{staff.full_name}</span>
                          <div className="flex gap-1.5">
                            <span className="text-[10px] text-emerald-600 font-medium">{Math.max(0, compliant)} OK</span>
                            {expired > 0 && <span className="text-[10px] text-red-600 font-medium">{expired} exp</span>}
                            {expiring > 0 && <span className="text-[10px] text-amber-600 font-medium">{expiring} expiring</span>}
                          </div>
                        </div>
                        <Progress value={pct} color={pct > 80 ? "bg-emerald-500" : pct > 60 ? "bg-amber-500" : "bg-red-500"} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Incidents */}
        {!isLoading && view === "incidents" && (
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">All Incidents by Severity & Type</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(["critical", "high", "medium", "low"] as const).map((sev) => {
                    const sevIncidents = allIncidents.filter((i) => i.severity === sev);
                    if (sevIncidents.length === 0) return null;
                    const colors: Record<string, string> = {
                      critical: "bg-red-100 text-red-700",
                      high: "bg-orange-100 text-orange-700",
                      medium: "bg-amber-100 text-amber-700",
                      low: "bg-slate-100 text-slate-600",
                    };
                    return (
                      <div key={sev} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[9px] rounded-full capitalize", colors[sev])}>{sev}</Badge>
                          <span className="text-xs text-slate-400">{sevIncidents.length} incident{sevIncidents.length > 1 ? "s" : ""}</span>
                        </div>
                        {sevIncidents.map((inc) => (
                          <div key={inc.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                            <span className="text-slate-400 shrink-0">{inc.reference}</span>
                            <span className="text-slate-700 flex-1 truncate">{inc.type.replace(/_/g, " ")}</span>
                            <span className="text-slate-400">{inc.date}</span>
                            <Badge className={cn("text-[9px] rounded-full", inc.status === "open" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                              {inc.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Finance */}
        {!isLoading && view === "finance" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Monthly Staff Cost", value: "£24,800", sub: "incl. overtime", color: "text-blue-600" },
                { label: "Overtime This Month", value: "£380", sub: "6.2 hours OT", color: "text-orange-600" },
                { label: "Expenses Submitted", value: "£561", sub: "7 claims", color: "text-violet-600" },
                { label: "Petty Cash Balance", value: "£43.50", sub: "Last counted: today", color: "text-emerald-600" },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                  <div className={cn("mt-1 text-2xl font-bold", color)}>{value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
