"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target, Clock, CheckCircle2, Circle, ArrowRight, Calendar,
  AlertTriangle, Users, GraduationCap, MessageSquare, Flame,
  ChevronRight, Star, Sun, Loader2, Brain,
} from "lucide-react";
import Link from "next/link";
import { useTasks, useCompleteTask } from "@/hooks/use-tasks";
import { useIncidents } from "@/hooks/use-incidents";
import { useStaff } from "@/hooks/use-staff";
import { useLeave } from "@/hooks/use-leave";
import { useRota } from "@/hooks/use-rota";
import { usePatternAlerts, useActionOutcomes } from "@/hooks/use-intelligence";
import type { PatternAlert } from "@/types/extended";
import { cn, todayStr, daysFromNow, formatDate, isOverdue, isDueToday } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";

function getMondayOfThisWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function MyDayPage() {
  const today = todayStr();
  const router = useRouter();
  const completeTask = useCompleteTask();
  const [signedOffIds, setSignedOffIds] = useState<Set<string>>(new Set());
  const { currentUser } = useAuthContext();
  const ME = currentUser?.id ?? "staff_darren";

  const weekStart = getMondayOfThisWeek();

  const tasksQuery = useTasks({ assigned_to: ME });
  const incidentsQuery = useIncidents();
  const staffQuery = useStaff();
  const leaveQuery = useLeave({ staff_id: ME });
  const rotaQuery = useRota(weekStart);
  const patternsQuery = usePatternAlerts({ status: 'active' });
  const overdueActionsQuery = useActionOutcomes({ status: 'overdue' });

  const isLoading = tasksQuery.isPending || incidentsQuery.isPending || staffQuery.isPending || leaveQuery.isPending || rotaQuery.isPending;

  const allTasks = tasksQuery.data?.data ?? [];
  const allStaff = staffQuery.data?.data ?? [];
  const allIncidents = incidentsQuery.data?.data ?? [];
  const allLeave = leaveQuery.data?.data ?? [];
  const allShifts = rotaQuery.data?.shifts ?? [];

  const staff = allStaff.find((s) => s.id === ME);

  const myTasks = useMemo(() => {
    return allTasks
      .filter((t) => t.status !== "completed" && t.status !== "cancelled")
      .sort((a, b) => {
        const w: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aO = isOverdue(a.due_date, a.status) ? -10 : isDueToday(a.due_date) ? -5 : 0;
        const bO = isOverdue(b.due_date, b.status) ? -10 : isDueToday(b.due_date) ? -5 : 0;
        return (aO + (w[a.priority] ?? 2)) - (bO + (w[b.priority] ?? 2));
      });
  }, [allTasks]);

  const awaitingSignOff = useMemo(() =>
    allTasks.filter((t) => t.requires_sign_off && !t.signed_off_by && t.status === "completed" && !signedOffIds.has(t.id)),
    [allTasks, signedOffIds]
  );

  const todayShift = allShifts.find((s) => s.staff_id === ME && s.date === today && !s.is_open_shift);

  const upcomingLeave = useMemo(() =>
    allLeave.filter((l) => l.status === "approved" && l.start_date > today && l.start_date <= daysFromNow(7)),
    [allLeave, today]
  );

  const openIncidents = useMemo(() =>
    allIncidents.filter((i) => i.status === "open" || i.requires_oversight),
    [allIncidents]
  );

  const nextSupervision = staff?.next_supervision_due;
  const nextAppraisal = staff?.next_appraisal_due;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = staff?.first_name ?? "Darren";

  function handleSignOff(taskId: string) {
    completeTask.mutate(
      { id: taskId, by: ME },
      { onSuccess: () => setSignedOffIds((prev) => new Set([...prev, taskId])) }
    );
  }

  if (isLoading) {
    return (
      <PageShell title="My Day" subtitle="Loading your day…">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="My Day"
      subtitle={`${greeting}, ${displayName} — here's what needs your attention today`}
      actions={
        <PrintButton title="My Day" subtitle={`${displayName} — ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`} targetId="my-day-content" />
      }
    >
      <div id="my-day-content" className="space-y-6">
        {/* Day summary banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sun className="h-6 w-6 text-yellow-300" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-300 mb-1">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
              <div className="text-xl font-bold">{greeting}, {displayName}</div>
              <div className="text-sm text-slate-300 mt-1">
                {myTasks.length > 0
                  ? `${myTasks.filter((t) => isDueToday(t.due_date)).length} tasks due today · ${myTasks.filter((t) => isOverdue(t.due_date, t.status)).length} overdue`
                  : "You have no tasks due today"}
                {awaitingSignOff.length > 0 && ` · ${awaitingSignOff.length} awaiting your sign-off`}
              </div>
            </div>
            {todayShift && (
              <div className="text-right">
                <div className="text-sm font-semibold">{todayShift.start_time} – {todayShift.end_time}</div>
                <div className="text-xs text-slate-300">Your shift today</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Intelligence Alert Strip ──────────────────────────────── */}
        {((patternsQuery.data?.data?.length ?? 0) > 0 || (overdueActionsQuery.data?.data?.length ?? 0) > 0) && (
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                <Brain className="h-3.5 w-3.5" />
                ARIA Intelligence
              </div>
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {(overdueActionsQuery.data?.data?.length ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" />
                    {overdueActionsQuery.data!.data.length} overdue action{overdueActionsQuery.data!.data.length > 1 ? "s" : ""}
                  </span>
                )}
                {patternsQuery.data?.data
                  ?.filter((p: PatternAlert) => p.severity === "critical" || p.severity === "high")
                  .slice(0, 2)
                  .map((p: PatternAlert) => (
                    <span key={p.id} className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                      p.severity === "critical" ? "bg-red-100 border-red-200 text-red-700" : "bg-orange-100 border-orange-200 text-orange-700"
                    )}>
                      <AlertTriangle className="h-3 w-3" />
                      {p.title}
                    </span>
                  ))
                }
                {(patternsQuery.data?.data?.length ?? 0) > 0 && (
                  <span className="text-xs text-violet-600">
                    {patternsQuery.data!.data.length} active pattern{patternsQuery.data!.data.length > 1 ? "s" : ""} detected
                  </span>
                )}
              </div>
              <Link
                href="/intelligence"
                className="ml-auto flex items-center gap-1 rounded-full bg-violet-100 border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-200 transition-colors"
              >
                Intelligence Hub <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            {/* Priority tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" />My Priority Tasks ({myTasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {myTasks.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                    <div className="text-sm font-medium text-slate-700">All caught up!</div>
                    <div className="text-xs text-slate-400">No outstanding tasks assigned to you</div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {myTasks.map((task) => {
                      const overdue = isOverdue(task.due_date, task.status);
                      const dueToday = isDueToday(task.due_date);
                      const prioColors: Record<string, string> = { urgent: "text-red-600", high: "text-orange-600", medium: "text-blue-600", low: "text-slate-400" };
                      return (
                        <div key={task.id} className="flex items-center gap-3 py-2.5">
                          {task.status === "in_progress" ? (
                            <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={cn("text-sm font-medium truncate", overdue ? "text-red-700" : "text-slate-900")}>{task.title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {task.due_date && (
                                <span className={cn(overdue ? "text-red-600 font-semibold" : dueToday ? "text-orange-600" : "text-slate-400")}>
                                  {overdue ? "OVERDUE" : dueToday ? "Due today" : `Due ${formatDate(task.due_date)}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className={cn("text-[9px] rounded-full capitalize", prioColors[task.priority])}>{task.priority}</Badge>
                          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => router.push("/tasks")}>
                            <ArrowRight className="h-3 w-3" />View
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Awaiting sign-off */}
            {awaitingSignOff.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 text-amber-500" />Awaiting Your Sign-off</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {awaitingSignOff.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="text-sm text-slate-900 flex-1 truncate">{task.title}</span>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                          disabled={completeTask.isPending}
                          onClick={() => handleSignOff(task.id)}
                        >
                          Sign off
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Open incidents needing action */}
            {openIncidents.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-red-500" />Incidents Needing Attention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {openIncidents.slice(0, 4).map((inc) => (
                      <div key={inc.id} className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
                        inc.severity === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                      )}>
                        <AlertTriangle className={cn("h-4 w-4 shrink-0", inc.severity === "critical" ? "text-red-500" : "text-amber-500")} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{inc.reference} — {inc.type.replace(/_/g, " ")}</div>
                          <div className="text-xs text-slate-500">{inc.date}</div>
                        </div>
                        <Badge className={cn("text-[9px] rounded-full", inc.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{inc.severity}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* My Schedule */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" />Schedule</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayShift ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                      <div className="text-xs font-semibold text-emerald-800 mb-0.5">Today&apos;s Shift</div>
                      <div className="text-sm font-bold text-slate-900">{todayShift.start_time} – {todayShift.end_time}</div>
                      <div className="text-xs text-slate-500 capitalize">{todayShift.shift_type.replace(/_/g, " ")}</div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 text-center">No shift today</div>
                  )}
                  {nextSupervision && (
                    <div className="flex items-center gap-2 text-xs rounded-xl bg-blue-50 p-3">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-blue-900">Next supervision</div>
                        <div className="text-blue-700">{formatDate(nextSupervision)}</div>
                      </div>
                    </div>
                  )}
                  {nextAppraisal && (
                    <div className="flex items-center gap-2 text-xs rounded-xl bg-violet-50 p-3">
                      <Target className="h-4 w-4 text-violet-500" />
                      <div>
                        <div className="font-medium text-violet-900">Next appraisal</div>
                        <div className="text-violet-700">{formatDate(nextAppraisal)}</div>
                      </div>
                    </div>
                  )}
                  {upcomingLeave.map((l) => (
                    <div key={l.id} className="flex items-center gap-2 text-xs rounded-xl bg-amber-50 p-3">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <div>
                        <div className="font-medium text-amber-900">Annual leave</div>
                        <div className="text-amber-700">{formatDate(l.start_date)} – {formatDate(l.end_date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {[
                    { label: "Create a task", href: "/tasks", icon: Target },
                    { label: "Request leave", href: "/leave", icon: Calendar },
                    { label: "Log incident", href: "/incidents", icon: AlertTriangle },
                    { label: "View rota", href: "/rota", icon: Users },
                    { label: "Check training", href: "/training", icon: GraduationCap },
                    { label: "Daily handover", href: "/handover", icon: MessageSquare },
                  ].map(({ label, href, icon: Icon }) => (
                    <a key={href} href={href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors text-sm text-slate-700 group"
                    >
                      <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      {label}
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto opacity-0 group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
