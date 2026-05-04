"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AriaPanel } from "@/components/aria/aria-panel";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import { cn, formatRelative, isOverdue } from "@/lib/utils";
import type { Task, Shift, YoungPerson } from "@/types";
import type { BuildingCheck, Vehicle, HandoverEntry } from "@/types/extended";
import {
  CheckCircle2, Clock, AlertTriangle, BookOpen, Pill, Car, Building2,
  Bell, ChevronRight, Circle, CalendarDays, Users, ArrowRightLeft,
  Sparkles, Target, Heart, Home, Zap, CheckCheck, User, Shield,
  AlarmClock, Clipboard, FileText, BadgeAlert, Info,
} from "lucide-react";
import { PrintButton } from "@/components/common/print-button";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StaffDashData {
  staff: {
    id: string; full_name: string; job_title: string; role: string;
    next_supervision_due: string | null;
  };
  shift: {
    today: Shift | null;
    co_workers: { shift: Shift; staff: { full_name: string; job_title: string } | null }[];
    open_shifts: Shift[];
    on_shift_count: number;
  };
  tasks: {
    my_tasks: Task[]; overdue: Task[]; due_today: Task[];
    urgent: Task[]; total_active: number;
  };
  handover: {
    latest: { id: string; date: string; shift_type: string; written_by: string; general_notes: string; linked_incidents: string[] } | null;
    child_updates: { child_id: string; mood_score: number | null; key_notes: string; alerts: string[] }[];
    flags: { type: string; text: string }[];
  };
  recordings_due: {
    daily_logs_needed: YoungPerson[];
    medication_schedule: { id: string; child_id: string; medication_id: string; scheduled_time: string; status: string }[];
    total_outstanding: number;
  };
  home_checks: {
    due: BuildingCheck[]; overdue: BuildingCheck[];
    buildings: { id: string; name: string }[];
    total_due: number;
  };
  vehicles: {
    all: Vehicle[];
    needing_daily_check: Vehicle[];
    defects: { id: string; vehicle_id: string; overall_result: string; check_date: string }[];
  };
  incidents: {
    open: { id: string; reference: string; title: string; severity: string; child_id: string }[];
    my_incidents: { id: string; reference: string; title: string }[];
    awaiting_oversight: { id: string; reference: string; title: string }[];
  };
  appointments: Task[];
  notifications: { id: string; title: string; body: string; priority: string; created_at: string }[];
  young_people: { current: YoungPerson[]; my_yp: YoungPerson[] };
  summary: { action_count: number; urgent_count: number; notifications_unread: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function shiftProgress(shift: Shift): number {
  if (!shift.start_time || !shift.end_time) return 0;
  const [sh, sm] = shift.start_time.split(":").map(Number);
  const [eh, em] = shift.end_time.split(":").map(Number);
  const now = new Date();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em + (eh < sh ? 24 * 60 : 0);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const pct = ((nowMins - startMins) / (endMins - startMins)) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

function ShiftTypePill({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    day: { label: "Day Shift", color: "bg-blue-100 text-blue-700" },
    late: { label: "Late Shift", color: "bg-amber-100 text-amber-700" },
    night: { label: "Night Shift", color: "bg-indigo-100 text-indigo-700" },
    sleep_in: { label: "Sleep In", color: "bg-purple-100 text-purple-700" },
    waking_night: { label: "Waking Night", color: "bg-slate-100 text-slate-700" },
  };
  const cfg = map[type] ?? { label: type, color: "bg-slate-100 text-slate-600" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
      {cfg.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    urgent: "bg-red-500", high: "bg-orange-400", medium: "bg-amber-400", low: "bg-slate-300",
  };
  return <span className={cn("h-2 w-2 rounded-full shrink-0", colors[priority] ?? "bg-slate-300")} />;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({
  icon: Icon, label, href, color, badge,
}: {
  icon: React.ElementType; label: string; href: string;
  color: string; badge?: number;
}) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-white", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-medium text-slate-700 text-center leading-tight">{label}</span>
        {badge && badge > 0 ? (
          <span className="rounded-full bg-red-100 px-1.5 text-[10px] font-semibold text-red-700">{badge} due</span>
        ) : null}
      </div>
    </Link>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count, countColor }: {
  icon: React.ElementType; title: string; count?: number; countColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-slate-500" />
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold",
          countColor ?? "bg-slate-100 text-slate-600"
        )}>
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-slate-200 px-4 py-3.5">
      <Icon className="h-4 w-4 text-slate-300" />
      <span className="text-sm text-slate-400">{text}</span>
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────

function NotificationsList({ notifications }: {
  notifications: StaffDashData["notifications"];
}) {
  if (!notifications.length) {
    return <EmptyState icon={Bell} text="No new notifications" />;
  }
  const priorityColor: Record<string, string> = {
    urgent: "border-l-red-500 bg-red-50",
    high: "border-l-orange-400 bg-orange-50",
    normal: "border-l-slate-300 bg-white",
    low: "border-l-slate-200 bg-white",
  };
  return (
    <div className="space-y-2">
      {notifications.slice(0, 4).map((n) => (
        <div key={n.id} className={cn(
          "rounded-xl border-l-[3px] px-3 py-2.5 border border-slate-100",
          priorityColor[n.priority] ?? priorityColor.normal
        )}>
          <div className="text-xs font-semibold text-slate-800">{n.title}</div>
          <div className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{n.body}</div>
          <div className="mt-1 text-[10px] text-slate-400">{formatRelative(n.created_at)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Handover Items ───────────────────────────────────────────────────────────

function HandoverSection({ handover, yp }: {
  handover: StaffDashData["handover"];
  yp: YoungPerson[];
}) {
  if (!handover.latest) {
    return <EmptyState icon={ArrowRightLeft} text="No handover recorded yet for this period" />;
  }

  const ypName = (id: string) => yp.find((y) => y.id === id)?.preferred_name ?? "Unknown";
  const staffName = (id: string) => id.replace("staff_", "").replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <ArrowRightLeft className="h-4 w-4 text-slate-400" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-700">
            {handover.latest.shift_type.replace("_", " ")} handover — {handover.latest.date}
          </div>
          <div className="text-[11px] text-slate-400">
            Written by {staffName(handover.latest.written_by)}
          </div>
        </div>
        <Link href="/handover" className="text-[11px] font-medium text-blue-600 hover:underline shrink-0">
          Read full
        </Link>
      </div>

      {/* General notes */}
      {handover.latest.general_notes && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">{handover.latest.general_notes}</p>
          </div>
        </div>
      )}

      {/* Child updates */}
      {handover.child_updates.length > 0 && (
        <div className="space-y-2">
          {handover.child_updates.map((upd, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                <span className="text-xs font-semibold text-slate-700">{ypName(upd.child_id)}</span>
                {upd.mood_score !== null && (
                  <span className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    upd.mood_score >= 7 ? "bg-emerald-100 text-emerald-700"
                      : upd.mood_score >= 5 ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  )}>
                    Mood {upd.mood_score}/10
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{upd.key_notes}</p>
              {upd.alerts.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {upd.alerts.map((a, ai) => (
                    <span key={ai} className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] text-amber-700">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Flags */}
      {handover.flags.length > 0 && (
        <div className="space-y-1.5">
          {handover.flags.slice(0, 5).map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
              <span className="text-xs text-amber-800 leading-snug capitalize">
                {f.text.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const overdue = task.due_date && isOverdue(task.due_date, task.status);
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 hover:border-slate-300 transition-colors group">
      <button
        onClick={() => onComplete(task.id)}
        className="mt-0.5 h-4 w-4 rounded border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 transition-colors shrink-0 group-hover:border-emerald-400"
        title="Mark complete"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityDot priority={task.priority} />
          <span className={cn(
            "text-sm font-medium leading-snug",
            overdue ? "text-red-700" : "text-slate-800"
          )}>
            {task.title}
          </span>
        </div>
        {task.description && (
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{task.description}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {task.due_date && (
            <span className={cn(
              "text-[11px] font-medium",
              overdue ? "text-red-600" : "text-slate-400"
            )}>
              {overdue ? "OVERDUE — " : "Due "}{task.due_date}
            </span>
          )}
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 capitalize">
            {task.category.replace(/_/g, " ")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffDashboardPage() {
  const qc = useQueryClient();
  const [showAria, setShowAria] = useState(false);
  const { currentUser } = useAuthContext();
  const staffId = currentUser?.id ?? "staff_darren";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-staff", staffId],
    queryFn: () => api.get<{ data: StaffDashData }>(`/dashboard/staff?staff_id=${staffId}`),
    enabled: !!staffId,
    refetchInterval: 60_000,
  });

  const completeTask = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}`, { action: "complete", completed_by: staffId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-staff", staffId] }),
  });

  const d = data?.data;

  if (isLoading || !d) {
    return (
      <PageShell title="My Dashboard" subtitle="Loading your shift...">
        <div className="space-y-6">
          <Skeleton className="h-28 w-full" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </PageShell>
    );
  }

  const progress = d.shift.today ? shiftProgress(d.shift.today) : 0;
  const ypName = (id: string) => d.young_people.current.find((y) => y.id === id)?.preferred_name ?? id;

  return (
    <PageShell
      title="My Dashboard"
      subtitle={`${getGreeting()}, ${d.staff.full_name.split(" ")[0]} — ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`}
      actions={
        <div className="flex items-center gap-2">
          {d.summary.notifications_unread > 0 && (
            <div className="relative">
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {d.summary.notifications_unread}
                  </span>
                </Button>
              </Link>
            </div>
          )}
          <PrintButton title="My Dashboard" subtitle={`${d.staff.full_name} — Shift Overview`} targetId="staff-dashboard-content" />
          <Button
            variant={showAria ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAria(!showAria)}
            className={cn(showAria && "bg-slate-900 text-white")}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Aria
          </Button>
        </div>
      }
    >
      <div id="staff-dashboard-content" className="space-y-6">

        {/* ── Shift Banner ──────────────────────────────────────────────────── */}
        {d.shift.today ? (
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShiftTypePill type={d.shift.today.shift_type} />
                  <span className="text-slate-300 text-sm">
                    {d.shift.today.start_time} — {d.shift.today.end_time}
                  </span>
                </div>
                <h2 className="text-lg font-bold">You&apos;re on shift at Oak House</h2>
                <p className="mt-0.5 text-sm text-slate-300">
                  {d.shift.on_shift_count} staff on shift today
                  {d.shift.co_workers.length > 0
                    ? ` — with ${d.shift.co_workers.slice(0, 2).map((c) => c.staff?.full_name.split(" ")[0]).join(", ")}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums">
                  {Math.round(progress)}%
                </div>
                <div className="text-xs text-slate-400">Shift complete</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/70 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Co-workers strip */}
            {d.shift.co_workers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {d.shift.co_workers.map((cw, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                    <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                      {cw.staff?.full_name.charAt(0) ?? "?"}
                    </div>
                    <span className="text-xs text-slate-200">{cw.staff?.full_name.split(" ")[0] ?? "Staff"}</span>
                    <span className="text-[10px] text-slate-400">{cw.shift.start_time}–{cw.shift.end_time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <Clock className="h-6 w-6 text-slate-300 mx-auto mb-1" />
            <p className="text-sm text-slate-500">No shift scheduled for you today</p>
            {d.shift.open_shifts.length > 0 && (
              <Link href="/rota" className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline">
                {d.shift.open_shifts.length} open shift(s) available
              </Link>
            )}
          </div>
        )}

        {/* ── Summary Counters ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Tasks Due",
              value: d.tasks.due_today.length + d.tasks.overdue.length,
              icon: CheckCircle2,
              color: d.tasks.overdue.length > 0 ? "text-red-600" : "text-slate-700",
              bg: d.tasks.overdue.length > 0 ? "bg-red-50" : "bg-slate-50",
              sub: d.tasks.overdue.length > 0 ? `${d.tasks.overdue.length} overdue` : "All on track",
            },
            {
              label: "Recordings Due",
              value: d.recordings_due.total_outstanding,
              icon: BookOpen,
              color: d.recordings_due.total_outstanding > 0 ? "text-amber-600" : "text-slate-700",
              bg: d.recordings_due.total_outstanding > 0 ? "bg-amber-50" : "bg-slate-50",
              sub: `${d.recordings_due.daily_logs_needed.length} logs · ${d.recordings_due.medication_schedule.length} meds`,
            },
            {
              label: "Checks Due",
              value: d.home_checks.total_due + d.vehicles.needing_daily_check.length,
              icon: Clipboard,
              color: d.home_checks.overdue.length > 0 ? "text-orange-600" : "text-slate-700",
              bg: d.home_checks.overdue.length > 0 ? "bg-orange-50" : "bg-slate-50",
              sub: `${d.home_checks.total_due} home · ${d.vehicles.needing_daily_check.length} vehicles`,
            },
            {
              label: "Notifications",
              value: d.notifications.length,
              icon: Bell,
              color: d.notifications.filter((n) => n.priority === "urgent").length > 0 ? "text-red-600" : "text-slate-700",
              bg: d.notifications.filter((n) => n.priority === "urgent").length > 0 ? "bg-red-50" : "bg-slate-50",
              sub: d.notifications.filter((n) => n.priority === "urgent").length > 0
                ? `${d.notifications.filter((n) => n.priority === "urgent").length} urgent`
                : "No urgent alerts",
            },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-2xl border border-slate-200 p-4", s.bg)}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={cn("h-4 w-4", s.color)} />
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
              <div className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ─────────────────────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            <QuickAction icon={BookOpen} label="New Daily Log" href="/daily-log" color="bg-blue-600" />
            <QuickAction icon={Pill} label="Record Meds" href="/medication" color="bg-purple-600"
              badge={d.recordings_due.medication_schedule.length} />
            <QuickAction icon={AlertTriangle} label="New Incident" href="/incidents" color="bg-red-600" />
            <QuickAction icon={CheckCircle2} label="New Task" href="/tasks" color="bg-emerald-600" />
            <QuickAction icon={ArrowRightLeft} label="Handover" href="/handover" color="bg-amber-600" />
            <QuickAction icon={Building2} label="Home Check" href="/buildings" color="bg-slate-700"
              badge={d.home_checks.total_due} />
            <QuickAction icon={Car} label="Vehicle Check" href="/vehicles" color="bg-slate-600"
              badge={d.vehicles.needing_daily_check.length} />
            <QuickAction icon={Shield} label="Safeguarding" href="/safeguarding" color="bg-rose-600" />
          </div>
        </div>

        {/* ── Main Grid ─────────────────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* My Tasks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    <SectionHeader icon={CheckCircle2} title="My Tasks"
                      count={d.tasks.total_active}
                      countColor={d.tasks.overdue.length > 0 ? "bg-red-100 text-red-700" : undefined}
                    />
                  </CardTitle>
                  <Link href="/tasks" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {d.tasks.my_tasks.length === 0 ? (
                  <EmptyState icon={CheckCheck} text="All tasks complete — great work!" />
                ) : (
                  <div className="space-y-2">
                    {/* Overdue first */}
                    {d.tasks.overdue.length > 0 && (
                      <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-1.5 mb-2">
                        <span className="text-[11px] font-semibold text-red-700">
                          {d.tasks.overdue.length} OVERDUE TASK{d.tasks.overdue.length > 1 ? "S" : ""}
                        </span>
                      </div>
                    )}
                    {[...d.tasks.overdue, ...d.tasks.due_today].slice(0, 6).map((task) => (
                      <TaskRow key={task.id} task={task} onComplete={(id) => completeTask.mutate(id)} />
                    ))}
                    {d.tasks.my_tasks.length > 6 && (
                      <Link href="/tasks" className="block text-center text-xs text-slate-400 hover:text-slate-600 py-2">
                        +{d.tasks.my_tasks.length - 6} more tasks
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Handover */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    <SectionHeader icon={ArrowRightLeft} title="Handover Notes"
                      count={d.handover.flags.length}
                    />
                  </CardTitle>
                  <Link href="/handover" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    Full handover <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <HandoverSection handover={d.handover} yp={d.young_people.current} />
              </CardContent>
            </Card>

            {/* Due Recordings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  <SectionHeader icon={FileText} title="Recordings Due Today"
                    count={d.recordings_due.total_outstanding}
                    countColor={d.recordings_due.total_outstanding > 0 ? "bg-amber-100 text-amber-700" : undefined}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Daily Logs */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Daily Log
                  </div>
                  {d.recordings_due.daily_logs_needed.length === 0 ? (
                    <EmptyState icon={CheckCheck} text="All daily logs complete" />
                  ) : (
                    <div className="space-y-1.5">
                      {d.recordings_due.daily_logs_needed.map((yp) => (
                        <Link
                          key={yp.id}
                          href="/daily-log"
                          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 hover:bg-amber-100 transition-colors"
                        >
                          <AlarmClock className="h-4 w-4 text-amber-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-amber-800">
                              Log needed — {yp.preferred_name}
                            </div>
                            <div className="text-[11px] text-amber-600">{yp.placement_type}</div>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medication schedule */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Medication Rounds
                  </div>
                  {d.recordings_due.medication_schedule.length === 0 ? (
                    <EmptyState icon={CheckCheck} text="No medication rounds due now" />
                  ) : (
                    <div className="space-y-1.5">
                      {d.recordings_due.medication_schedule.map((med) => (
                        <Link
                          key={med.id}
                          href="/medication"
                          className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2.5 hover:bg-purple-100 transition-colors"
                        >
                          <Pill className="h-4 w-4 text-purple-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-purple-800">
                              {ypName(med.child_id)} — {med.scheduled_time.split("T")[1]?.slice(0, 5)}
                            </div>
                            <div className="text-[11px] text-purple-600 capitalize">{med.status}</div>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            {d.appointments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    <SectionHeader icon={CalendarDays} title="Upcoming Appointments" count={d.appointments.length} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {d.appointments.map((apt) => (
                      <div key={apt.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                        <CalendarDays className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-800">{apt.title}</div>
                          {apt.due_date && (
                            <div className="mt-0.5 text-[11px] text-slate-400">{apt.due_date}</div>
                          )}
                        </div>
                        {apt.linked_child_id && (
                          <span className="text-[11px] text-slate-500 shrink-0">{ypName(apt.linked_child_id)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  <SectionHeader icon={Bell} title="Notifications"
                    count={d.notifications.length}
                    countColor={d.notifications.filter((n) => n.priority === "urgent").length > 0
                      ? "bg-red-100 text-red-700" : undefined}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NotificationsList notifications={d.notifications} />
              </CardContent>
            </Card>

            {/* Home Checks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    <SectionHeader icon={Building2} title="Home Checks"
                      count={d.home_checks.total_due}
                      countColor={d.home_checks.overdue.length > 0 ? "bg-orange-100 text-orange-700" : undefined}
                    />
                  </CardTitle>
                  <Link href="/buildings" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    View <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {d.home_checks.due.length === 0 ? (
                  <EmptyState icon={CheckCheck} text="All building checks up to date" />
                ) : (
                  <div className="space-y-2">
                    {d.home_checks.due.slice(0, 4).map((check) => {
                      const building = d.home_checks.buildings.find((b) => b.id === check.building_id);
                      return (
                        <div key={check.id} className={cn(
                          "flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
                          check.status === "overdue"
                            ? "border-orange-200 bg-orange-50"
                            : "border-slate-200 bg-white"
                        )}>
                          <Building2 className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            check.status === "overdue" ? "text-orange-500" : "text-slate-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-800 capitalize">
                              {check.check_type.replace(/_/g, " ")}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {building?.name ?? "Building"} — Due {check.due_date}
                            </div>
                          </div>
                          <Badge variant={check.status === "overdue" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                            {check.status}
                          </Badge>
                        </div>
                      );
                    })}
                    {d.home_checks.due.length > 4 && (
                      <Link href="/buildings" className="block text-center text-xs text-slate-400 hover:text-slate-600 py-1">
                        +{d.home_checks.due.length - 4} more
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Checks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    <SectionHeader icon={Car} title="Vehicle Checks"
                      count={d.vehicles.needing_daily_check.length}
                      countColor={d.vehicles.needing_daily_check.length > 0 ? "bg-amber-100 text-amber-700" : undefined}
                    />
                  </CardTitle>
                  <Link href="/vehicles" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    View <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {d.vehicles.all.length === 0 ? (
                  <EmptyState icon={Car} text="No vehicles registered" />
                ) : (
                  <div className="space-y-2">
                    {d.vehicles.all.map((v) => {
                      const needsCheck = d.vehicles.needing_daily_check.some((nv) => nv.id === v.id);
                      const hasDefect = d.vehicles.defects.some((df) => df.vehicle_id === v.id);
                      return (
                        <div key={v.id} className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                          hasDefect
                            ? "border-red-200 bg-red-50"
                            : needsCheck
                              ? "border-amber-200 bg-amber-50"
                              : "border-slate-200 bg-white"
                        )}>
                          <Car className={cn(
                            "h-4 w-4 shrink-0",
                            hasDefect ? "text-red-500" : needsCheck ? "text-amber-500" : "text-slate-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-800">
                              {v.make} {v.model}
                            </div>
                            <div className="text-[11px] text-slate-400">{v.registration}</div>
                          </div>
                          {hasDefect ? (
                            <Badge variant="destructive" className="text-[10px]">Defect</Badge>
                          ) : needsCheck ? (
                            <Link href="/vehicles">
                              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer">
                                Check needed
                              </Badge>
                            </Link>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">Checked</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Young People in my care */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    <SectionHeader icon={Heart} title="My Young People" count={d.young_people.my_yp.length} />
                  </CardTitle>
                  <Link href="/young-people" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    All <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {d.young_people.my_yp.length === 0 ? (
                  <EmptyState icon={Users} text="No young people assigned as key worker" />
                ) : (
                  <div className="space-y-2">
                    {d.young_people.my_yp.map((yp) => (
                      <Link
                        key={yp.id}
                        href="/young-people"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-slate-300 transition-colors"
                      >
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                          {(yp.preferred_name ?? yp.first_name).charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-800">{yp.preferred_name}</div>
                          <div className="text-[11px] text-slate-400">{yp.legal_status}</div>
                        </div>
                        {yp.risk_flags.length > 0 && (
                          <div title={yp.risk_flags.join(", ")}>
                            <BadgeAlert className="h-4 w-4 text-amber-400 shrink-0" />
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Open Incidents */}
            {d.incidents.open.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      <SectionHeader icon={AlertTriangle} title="Open Incidents"
                        count={d.incidents.open.length}
                        countColor="bg-red-100 text-red-700"
                      />
                    </CardTitle>
                    <Link href="/incidents" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {d.incidents.open.slice(0, 3).map((inc) => (
                      <div key={inc.id} className={cn(
                        "flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
                        inc.severity === "critical" || inc.severity === "serious"
                          ? "border-red-200 bg-red-50"
                          : "border-slate-200 bg-white"
                      )}>
                        <AlertTriangle className={cn(
                          "h-3.5 w-3.5 mt-0.5 shrink-0",
                          inc.severity === "critical" ? "text-red-600" : "text-amber-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-800 line-clamp-1">{inc.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {inc.reference} · {ypName(inc.child_id)}
                          </div>
                        </div>
                        <Badge
                          variant={inc.severity === "critical" ? "destructive" : "secondary"}
                          className="text-[10px] capitalize shrink-0"
                        >
                          {inc.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Aria Panel ────────────────────────────────────────────────────── */}
        {showAria && (
          <AriaPanel
            pageContext="staff_dashboard"
            sourceContent={`Staff dashboard for ${d.staff.full_name} — ${d.tasks.total_active} active tasks, ${d.recordings_due.total_outstanding} recordings outstanding`}
            userRole={d.staff.role}
          />
        )}
      </div>
    </PageShell>
  );
}
