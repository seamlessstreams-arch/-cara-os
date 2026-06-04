"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ROLE-BASED DASHBOARD
// Renders a different dashboard layout per user role. Each view surfaces the
// information that role needs most, in calm, spacious cards. Uses existing
// store data via the useDashboard() hook and derives role-specific metrics.
// Calm Card aesthetic: rounded-xl, warm white bg, subtle shadow, generous
// spacing. Progressive disclosure for detail sections.
// CHR 2015 Reg 12, 13, 34, 35 — role-appropriate operational awareness.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Cog,
  FileText,
  Heart,
  Home,
  Loader2,
  Megaphone,
  PenLine,
  Shield,
  ShieldAlert,
  Star,
  TrendingUp,
  User,
  Users,
  UserCheck,
  Zap,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuthContext } from "@/contexts/auth-context";
import { CalmStatusBadge } from "@/components/ui/calm-status-badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { CalmEmptyState } from "@/components/ui/empty-state-calm";
import { cn, todayStr, isOverdue, pluralise } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface RoleBasedDashboardProps {
  role: string;
}

interface RoleDashboardData {
  // Shared
  childrenCount: number;
  staffCount: number;
  staffOnShift: number;
  openShifts: number;

  // Tasks
  totalActiveTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  urgentTasks: number;
  myTasks: number;
  awaitingSignOff: number;
  completedToday: number;
  topTasks: Array<{
    id: string;
    title: string;
    urgency: "urgent" | "today" | "upcoming";
    childName?: string;
    href: string;
  }>;

  // Incidents
  openIncidents: number;
  criticalIncidents: number;
  incidentsThisWeek: number;
  awaitingOversight: number;
  oversightQueue: Array<{
    id: string;
    reference: string;
    childName?: string;
    severity: string;
  }>;

  // Safeguarding
  missingActive: number;
  contextualRisk: number;
  highRiskChildren: Array<{ id: string; name: string; riskFlags: string[] }>;

  // Medication
  missedMedsToday: number;
  scheduledMedsToday: number;
  stockAlerts: number;

  // Compliance
  trainingExpired: number;
  trainingExpiring: number;
  supervisionOverdue: number;

  // Environment
  buildingChecksOverdue: number;
  buildingChecksDue: number;

  // Handover
  hasHandover: boolean;
  handoverPendingSignOff: boolean;
  handoverFlags: number;

  // Care events
  careEventsAwaitingReview: number;

  // Staff workload (tasks per staff member on shift)
  staffWorkload: Array<{ name: string; taskCount: number }>;

  // Shift info
  todayShifts: Array<{
    staffName: string;
    shiftType: string;
    startTime: string;
    endTime: string;
  }>;

  // Missing logs count
  missingLogsCount: number;

  // Children list
  children: Array<{ id: string; name: string; status: string }>;

  // Compliance score (calculated)
  complianceScore: number;

  // Pending leave
  pendingLeaveRequests: number;
}

// ── Data Hook ────────────────────────────────────────────────────────────────

function useRoleDashboardData(): {
  data: RoleDashboardData | null;
  isLoading: boolean;
} {
  const { data: dashboardResult, isLoading } = useDashboard();
  const { currentUser } = useAuthContext();

  const data = useMemo(() => {
    const d = dashboardResult?.data;
    if (!d) return null;

    const today = todayStr();
    const currentChildren = d.young_people?.current ?? [];
    const allTasks = d.tasks.priority_queue ?? [];
    const userId = currentUser?.id ?? "";

    // Top 5 tasks by urgency
    const overdueTasks = allTasks.filter(
      (t) =>
        isOverdue(t.due_date, t.status) &&
        t.status !== "completed" &&
        t.status !== "cancelled",
    );
    const todayTasks = allTasks.filter(
      (t) =>
        t.due_date === today &&
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        !overdueTasks.some((ot) => ot.id === t.id),
    );
    const otherActive = allTasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        !overdueTasks.some((ot) => ot.id === t.id) &&
        !todayTasks.some((tt) => tt.id === t.id),
    );

    const topTasks = [
      ...overdueTasks.map((t) => ({
        id: t.id,
        title: t.title,
        urgency: "urgent" as const,
        childName: currentChildren.find((c) => c.id === t.linked_child_id)
          ? `${currentChildren.find((c) => c.id === t.linked_child_id)!.first_name} ${currentChildren.find((c) => c.id === t.linked_child_id)!.last_name}`
          : undefined,
        href: `/tasks?id=${t.id}`,
      })),
      ...todayTasks.map((t) => ({
        id: t.id,
        title: t.title,
        urgency: "today" as const,
        childName: currentChildren.find((c) => c.id === t.linked_child_id)
          ? `${currentChildren.find((c) => c.id === t.linked_child_id)!.first_name} ${currentChildren.find((c) => c.id === t.linked_child_id)!.last_name}`
          : undefined,
        href: `/tasks?id=${t.id}`,
      })),
      ...otherActive.map((t) => ({
        id: t.id,
        title: t.title,
        urgency: "upcoming" as const,
        childName: currentChildren.find((c) => c.id === t.linked_child_id)
          ? `${currentChildren.find((c) => c.id === t.linked_child_id)!.first_name} ${currentChildren.find((c) => c.id === t.linked_child_id)!.last_name}`
          : undefined,
        href: `/tasks?id=${t.id}`,
      })),
    ].slice(0, 5);

    // Oversight queue
    const oversightQueue = (d.incidents.oversight_queue ?? []).map((inc) => {
      const yp = currentChildren.find((c) => c.id === inc.child_id);
      return {
        id: inc.id,
        reference: inc.reference,
        childName: yp ? `${yp.first_name} ${yp.last_name}` : undefined,
        severity: inc.severity,
      };
    });

    // High risk children
    const highRiskChildren = (d.safeguarding.high_risk_yp ?? []).map((yp) => ({
      id: yp.id,
      name: `${yp.first_name} ${yp.last_name}`,
      riskFlags: yp.risk_flags ?? [],
    }));

    // Missing logs count
    const missingLogsCount = currentChildren.filter((yp) => {
      const ypAny = yp as Record<string, unknown>;
      const lastLog = ypAny.last_log_date as string | null | undefined;
      return !lastLog || lastLog < today;
    }).length;

    // Staff workload
    const todayShiftsRaw = d.staffing.today_shifts ?? [];
    const staffWorkload = todayShiftsRaw.map((shift) => {
      const staffTasks = allTasks.filter(
        (t) =>
          t.assigned_to === shift.staff_id &&
          t.status !== "completed" &&
          t.status !== "cancelled",
      );
      return { name: shift.staff_id, taskCount: staffTasks.length };
    });

    const todayShifts = todayShiftsRaw.map((shift) => ({
      staffName: shift.staff_id,
      shiftType: shift.shift_type,
      startTime: shift.start_time,
      endTime: shift.end_time,
    }));

    // Compliance score (rough calc)
    const totalComplianceItems =
      (d.compliance.training_expired ?? 0) +
      (d.compliance.training_expiring ?? 0) +
      (d.staffing.supervision_overdue ?? 0) +
      10; // baseline denominator
    const complianceIssues =
      (d.compliance.training_expired ?? 0) +
      (d.staffing.supervision_overdue ?? 0);
    const complianceScore = Math.max(
      0,
      Math.round(
        ((totalComplianceItems - complianceIssues) / totalComplianceItems) * 100,
      ),
    );

    const children = currentChildren.map((yp) => ({
      id: yp.id,
      name: `${yp.first_name} ${yp.last_name}`,
      status: yp.status,
    }));

    return {
      childrenCount: currentChildren.length,
      staffCount: d.staffing.on_shift + d.staffing.on_leave + d.staffing.open_shifts,
      staffOnShift: d.staffing.on_shift,
      openShifts: d.staffing.open_shifts,
      totalActiveTasks: d.tasks.active,
      overdueTasks: d.tasks.overdue,
      dueTodayTasks: d.tasks.due_today,
      urgentTasks: d.tasks.urgent,
      myTasks: d.tasks.my_tasks,
      awaitingSignOff: d.tasks.awaiting_sign_off,
      completedToday: d.tasks.completed_today,
      topTasks,
      openIncidents: d.incidents.open,
      criticalIncidents: d.incidents.critical,
      incidentsThisWeek: d.incidents.this_week,
      awaitingOversight: d.incidents.awaiting_oversight,
      oversightQueue,
      missingActive: d.safeguarding.missing_active,
      contextualRisk: d.safeguarding.contextual_risk,
      highRiskChildren,
      missedMedsToday: d.medication.missed_today,
      scheduledMedsToday: d.medication.scheduled_today,
      stockAlerts: d.medication.stock_alerts,
      trainingExpired: d.compliance.training_expired,
      trainingExpiring: d.compliance.training_expiring,
      supervisionOverdue: d.staffing.supervision_overdue,
      buildingChecksOverdue: d.environment.building_checks_overdue,
      buildingChecksDue: d.environment.building_checks_due,
      hasHandover: !!d.handover?.latest,
      handoverPendingSignOff: d.handover?.pending_sign_off ?? false,
      handoverFlags: d.handover?.flags?.length ?? 0,
      careEventsAwaitingReview: d.care_events?.awaiting_manager_review ?? 0,
      staffWorkload,
      todayShifts,
      missingLogsCount,
      children,
      complianceScore,
      pendingLeaveRequests: d.staffing.pending_leave_requests,
    };
  }, [dashboardResult, currentUser]);

  return { data, isLoading };
}

// ── Shared Sub-Components ────────────────────────────────────────────────────

function CalmCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--cs-border)] bg-white",
        "shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)]",
        "p-5 transition-shadow hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05),0_2px_4px_-2px_rgb(0_0_0/0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CalmCardHeader({
  icon: Icon,
  title,
  badge,
  iconBg = "bg-[var(--cs-surface)]",
  iconColor = "text-[var(--cs-navy)]",
}: {
  icon: React.ElementType;
  title: string;
  badge?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            iconBg,
          )}
        >
          <Icon className={cn("h-4.5 w-4.5", iconColor)} />
        </div>
        <h3 className="text-[15px] font-semibold text-[var(--cs-navy)]">
          {title}
        </h3>
      </div>
      {badge}
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          accent ?? "bg-[var(--cs-surface)]",
        )}
      >
        <Icon className="h-5 w-5 text-[var(--cs-navy)]" />
      </div>
      <span className="text-xl font-bold text-[var(--cs-navy)] leading-none">
        {value}
      </span>
      <span className="text-[11px] text-[var(--cs-text-muted)] leading-tight">
        {label}
      </span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  status,
  href,
}: {
  label: string;
  value: string | number;
  status?: "good" | "adequate" | "overdue" | "urgent" | "info";
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center justify-between py-2.5 px-3 rounded-xl",
        "transition-colors",
        href && "hover:bg-[var(--cs-surface)] cursor-pointer",
      )}
    >
      <span className="text-sm text-[var(--cs-text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        {status ? (
          <CalmStatusBadge status={status} label={String(value)} size="sm" />
        ) : (
          <span className="text-sm font-semibold text-[var(--cs-navy)]">
            {value}
          </span>
        )}
        {href && (
          <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

function QuickActionButton({
  label,
  icon: Icon,
  href,
  variant = "default",
}: {
  label: string;
  icon: React.ElementType;
  href: string;
  variant?: "default" | "alert" | "primary";
}) {
  const variantStyles = {
    default:
      "border-[var(--cs-border)] bg-white text-[var(--cs-navy)] hover:bg-[var(--cs-surface)]",
    alert:
      "border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100/50",
    primary:
      "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white hover:bg-[var(--cs-navy)]/90",
  };

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        "rounded-2xl border p-4 min-h-[80px] min-w-[80px]",
        "transition-all hover:shadow-sm active:scale-[0.98]",
        "text-center",
        variantStyles[variant],
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  );
}

function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-left group"
      >
        <span className="text-sm font-semibold text-[var(--cs-navy)] group-hover:text-[var(--cs-navy)]/80 transition-colors">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {count !== undefined && count > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[var(--cs-surface)] text-[10px] font-semibold text-[var(--cs-navy)]">
              {count}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[var(--cs-text-gentle)] transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </button>
      {isOpen && (
        <div className="animate-[gentleFadeUp_0.15s_ease-out]">{children}</div>
      )}
    </div>
  );
}

function TrafficLight({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const status =
    score >= 90
      ? "good"
      : score >= 70
        ? "adequate"
        : "inadequate";
  const statusLabel =
    score >= 90
      ? "Good"
      : score >= 70
        ? "Adequate"
        : "Needs Attention";

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[var(--cs-text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[var(--cs-navy)]">
          {score}%
        </span>
        <CalmStatusBadge
          status={status as "good" | "adequate" | "inadequate"}
          label={statusLabel}
          size="sm"
        />
      </div>
    </div>
  );
}

// ── Support Worker View ──────────────────────────────────────────────────────

function SupportWorkerDashboard({ data }: { data: RoleDashboardData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Today's Shift */}
      <CalmCard className="md:col-span-2 lg:col-span-1">
        <CalmCardHeader
          icon={Clock}
          title="Today's Shift"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        {data.todayShifts.length > 0 ? (
          <div className="space-y-3">
            {data.todayShifts.slice(0, 2).map((shift, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-[var(--cs-surface)] px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--cs-navy)]">
                    {shift.shiftType.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-[var(--cs-text-muted)]">
                    {shift.startTime} - {shift.endTime}
                  </p>
                </div>
                <CalmStatusBadge status="info" label="On Shift" size="sm" />
              </div>
            ))}
            <div className="pt-2 border-t border-[var(--cs-border-subtle)]">
              <div className="flex items-center gap-2 text-sm text-[var(--cs-text-secondary)]">
                <Users className="h-4 w-4 text-[var(--cs-text-muted)]" />
                <span>
                  {data.childrenCount}{" "}
                  {pluralise(data.childrenCount, "child", "children")} on shift
                </span>
              </div>
            </div>
          </div>
        ) : (
          <CalmEmptyState
            icon="Calendar"
            title="No shift today"
            description="You don't have a scheduled shift today."
            className="py-8 border-0"
          />
        )}
      </CalmCard>

      {/* My Tasks */}
      <CalmCard>
        <CalmCardHeader
          icon={ClipboardList}
          title="My Tasks"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          badge={
            data.overdueTasks > 0 ? (
              <CalmStatusBadge
                status="overdue"
                label={`${data.overdueTasks} overdue`}
                size="sm"
              />
            ) : undefined
          }
        />
        {data.topTasks.length > 0 ? (
          <div className="space-y-2">
            {data.topTasks.map((task) => (
              <Link
                key={task.id}
                href={task.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                  "hover:bg-[var(--cs-surface)]",
                  task.urgency === "urgent" && "bg-red-50/30",
                  task.urgency === "today" && "bg-amber-50/30",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    task.urgency === "urgent" && "bg-red-500",
                    task.urgency === "today" && "bg-amber-500",
                    task.urgency === "upcoming" && "bg-blue-400",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--cs-navy)] truncate">
                    {task.title}
                  </p>
                  {task.childName && (
                    <p className="text-[11px] text-[var(--cs-text-muted)] truncate">
                      {task.childName}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-gentle)] shrink-0" />
              </Link>
            ))}
            <Link
              href="/tasks?filter=mine"
              className="flex items-center justify-center gap-1.5 pt-2 text-xs font-medium text-[var(--cs-navy)] hover:underline"
            >
              View all tasks
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <CalmEmptyState
            icon="CheckCircle2"
            title="All done"
            description="No outstanding tasks right now."
            className="py-6 border-0"
          />
        )}
      </CalmCard>

      {/* Quick Actions */}
      <CalmCard>
        <CalmCardHeader
          icon={Zap}
          title="Quick Actions"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickActionButton
            label="Daily Log"
            icon={PenLine}
            href="/daily-log?action=new"
          />
          <QuickActionButton
            label="Direct Work"
            icon={Heart}
            href="/direct-work?action=new"
          />
          <QuickActionButton
            label="Incident"
            icon={ShieldAlert}
            href="/incidents?action=new"
            variant="alert"
          />
        </div>
      </CalmCard>

      {/* Handover Notes */}
      <CalmCard className="md:col-span-2 lg:col-span-2">
        <CalmCardHeader
          icon={BookOpen}
          title="Handover Notes"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          badge={
            data.handoverPendingSignOff ? (
              <CalmStatusBadge
                status="due"
                label="Needs sign-off"
                size="sm"
              />
            ) : undefined
          }
        />
        {data.hasHandover ? (
          <div className="space-y-3">
            {data.handoverFlags > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50/50 border border-amber-200 px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-700">
                  {data.handoverFlags}{" "}
                  {pluralise(data.handoverFlags, "flag")} raised in handover
                </span>
              </div>
            )}
            <Link
              href="/handover"
              className="flex items-center justify-between rounded-xl bg-[var(--cs-surface)] px-3 py-3 hover:bg-[var(--cs-surface)]/80 transition-colors"
            >
              <span className="text-sm font-medium text-[var(--cs-navy)]">
                Read latest handover
              </span>
              <ArrowRight className="h-4 w-4 text-[var(--cs-text-gentle)]" />
            </Link>
          </div>
        ) : (
          <CalmEmptyState
            icon="BookOpen"
            title="No handover yet"
            description="Handover notes will appear here once submitted."
            className="py-8 border-0"
          />
        )}
      </CalmCard>

      {/* Alerts */}
      <CalmCard>
        <CalmCardHeader
          icon={AlertTriangle}
          title="Alerts"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <div className="space-y-2">
          {data.missedMedsToday > 0 && (
            <MetricRow
              label="Medications missed"
              value={data.missedMedsToday}
              status="urgent"
              href="/medication?filter=missed"
            />
          )}
          {data.missingActive > 0 && (
            <MetricRow
              label="Missing from care"
              value={data.missingActive}
              status="urgent"
              href="/safeguarding/missing"
            />
          )}
          {data.buildingChecksOverdue > 0 && (
            <MetricRow
              label="Building checks overdue"
              value={data.buildingChecksOverdue}
              status="overdue"
              href="/buildings?filter=overdue"
            />
          )}
          {data.missedMedsToday === 0 &&
            data.missingActive === 0 &&
            data.buildingChecksOverdue === 0 && (
              <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-700">
                  No active alerts
                </span>
              </div>
            )}
        </div>
      </CalmCard>
    </div>
  );
}

// ── Senior Support Worker View ───────────────────────────────────────────────

function SeniorSupportWorkerDashboard({
  data,
}: {
  data: RoleDashboardData;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Shift Overview */}
      <CalmCard className="md:col-span-2 lg:col-span-2">
        <CalmCardHeader
          icon={Users}
          title="Shift Overview"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          badge={
            data.missingLogsCount > 0 ? (
              <CalmStatusBadge
                status="due"
                label={`${data.missingLogsCount} missing ${pluralise(data.missingLogsCount, "log")}`}
                size="sm"
              />
            ) : undefined
          }
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <HeroStat
            label="Staff on shift"
            value={data.staffOnShift}
            icon={UserCheck}
            accent="bg-blue-50"
          />
          <HeroStat
            label="Children"
            value={data.childrenCount}
            icon={Heart}
            accent="bg-emerald-50"
          />
          <HeroStat
            label="Missing logs"
            value={data.missingLogsCount}
            icon={FileText}
            accent={data.missingLogsCount > 0 ? "bg-amber-50" : "bg-[var(--cs-surface)]"}
          />
          <HeroStat
            label="Open shifts"
            value={data.openShifts}
            icon={Calendar}
            accent={data.openShifts > 0 ? "bg-red-50" : "bg-[var(--cs-surface)]"}
          />
        </div>
      </CalmCard>

      {/* Approvals */}
      <CalmCard>
        <CalmCardHeader
          icon={ClipboardCheck}
          title="Approvals"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <div className="space-y-1">
          <MetricRow
            label="Tasks awaiting sign-off"
            value={data.awaitingSignOff}
            status={data.awaitingSignOff > 0 ? "due" : "complete"}
            href="/tasks?filter=awaiting_signoff"
          />
          <MetricRow
            label="Care events to review"
            value={data.careEventsAwaitingReview}
            status={data.careEventsAwaitingReview > 0 ? "due" : "complete"}
            href="/care-events?filter=awaiting_review"
          />
          <MetricRow
            label="Leave requests"
            value={data.pendingLeaveRequests}
            status={data.pendingLeaveRequests > 0 ? "info" : "complete"}
            href="/staff?tab=leave&filter=pending"
          />
        </div>
      </CalmCard>

      {/* Needs Attention */}
      <CalmCard className="md:col-span-2 lg:col-span-2">
        <CalmCardHeader
          icon={AlertTriangle}
          title="Needs Attention"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <div className="space-y-2">
          {data.oversightQueue.length > 0 && (
            <CollapsibleSection
              title="Incidents needing review"
              count={data.oversightQueue.length}
              defaultOpen
            >
              <div className="space-y-2 mt-2">
                {data.oversightQueue.map((inc) => (
                  <Link
                    key={inc.id}
                    href={`/incidents/${inc.id}`}
                    className="flex items-center gap-3 rounded-xl bg-red-50/30 border border-red-100 px-3 py-2.5 hover:bg-red-50/50 transition-colors"
                  >
                    <Shield className="h-4 w-4 text-red-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--cs-navy)] truncate">
                        {inc.reference}
                      </p>
                      {inc.childName && (
                        <p className="text-[11px] text-[var(--cs-text-muted)]">
                          {inc.childName}
                        </p>
                      )}
                    </div>
                    <RiskBadge
                      level={
                        inc.severity === "critical"
                          ? "critical"
                          : inc.severity === "high"
                            ? "high"
                            : inc.severity === "medium"
                              ? "medium"
                              : "low"
                      }
                      size="sm"
                    />
                  </Link>
                ))}
              </div>
            </CollapsibleSection>
          )}
          <MetricRow
            label="Overdue tasks"
            value={data.overdueTasks}
            status={data.overdueTasks > 0 ? "overdue" : "complete"}
            href="/tasks?filter=overdue"
          />
          {data.highRiskChildren.length > 0 && (
            <CollapsibleSection
              title="Risk changes"
              count={data.highRiskChildren.length}
            >
              <div className="space-y-2 mt-2">
                {data.highRiskChildren.map((child) => (
                  <Link
                    key={child.id}
                    href={`/young-people/${child.id}?tab=risk`}
                    className="flex items-center gap-3 rounded-xl bg-amber-50/30 px-3 py-2.5 hover:bg-amber-50/50 transition-colors"
                  >
                    <User className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-sm text-[var(--cs-navy)] flex-1 truncate">
                      {child.name}
                    </span>
                    <RiskBadge level="high" size="sm" />
                  </Link>
                ))}
              </div>
            </CollapsibleSection>
          )}
          {data.oversightQueue.length === 0 &&
            data.overdueTasks === 0 &&
            data.highRiskChildren.length === 0 && (
              <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-700">
                  Everything looks good
                </span>
              </div>
            )}
        </div>
      </CalmCard>

      {/* Staff Tasks Overview */}
      <CalmCard>
        <CalmCardHeader
          icon={ClipboardList}
          title="Staff Tasks"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <div className="space-y-1">
          <MetricRow label="Active tasks" value={data.totalActiveTasks} />
          <MetricRow
            label="Due today"
            value={data.dueTodayTasks}
            status={data.dueTodayTasks > 0 ? "due" : "complete"}
          />
          <MetricRow
            label="Completed today"
            value={data.completedToday}
            status="complete"
          />
        </div>
      </CalmCard>

      {/* Handover Quality */}
      <CalmCard className="lg:col-span-3">
        <CalmCardHeader
          icon={BookOpen}
          title="Handover Quality"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            {data.hasHandover ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-[var(--cs-navy)] font-medium">
                  Handover submitted
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-700 font-medium">
                  No handover yet
                </span>
              </>
            )}
          </div>
          {data.handoverPendingSignOff && (
            <CalmStatusBadge status="due" label="Pending sign-off" size="sm" />
          )}
          {data.handoverFlags > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-700">
                {data.handoverFlags} {pluralise(data.handoverFlags, "flag")}
              </span>
            </div>
          )}
          <Link
            href="/handover"
            className="ml-auto text-xs font-medium text-[var(--cs-navy)] hover:underline flex items-center gap-1"
          >
            View handover <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CalmCard>
    </div>
  );
}

// ── Registered Manager View ──────────────────────────────────────────────────

function RegisteredManagerDashboard({
  data,
}: {
  data: RoleDashboardData;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Home at a Glance — Hero Card */}
      <CalmCard className="md:col-span-2 lg:col-span-3">
        <CalmCardHeader
          icon={Home}
          title="Home at a Glance"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6 pt-2">
          <HeroStat
            label="Children"
            value={data.childrenCount}
            icon={Heart}
            accent="bg-emerald-50"
          />
          <HeroStat
            label="Staff on shift"
            value={data.staffOnShift}
            icon={Users}
            accent="bg-blue-50"
          />
          <HeroStat
            label="Compliance"
            value={`${data.complianceScore}%`}
            icon={ClipboardCheck}
            accent={
              data.complianceScore >= 90
                ? "bg-emerald-50"
                : data.complianceScore >= 70
                  ? "bg-amber-50"
                  : "bg-red-50"
            }
          />
          <HeroStat
            label="Open incidents"
            value={data.openIncidents}
            icon={ShieldAlert}
            accent={data.openIncidents > 0 ? "bg-red-50" : "bg-[var(--cs-surface)]"}
          />
          <HeroStat
            label="Active tasks"
            value={data.totalActiveTasks}
            icon={ClipboardList}
            accent="bg-amber-50"
          />
        </div>
      </CalmCard>

      {/* Safeguarding Pulse */}
      <CalmCard>
        <CalmCardHeader
          icon={Shield}
          title="Safeguarding Pulse"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <div className="space-y-1">
          <MetricRow
            label="Active concerns"
            value={data.missingActive + data.contextualRisk}
            status={
              data.missingActive + data.contextualRisk > 0
                ? "urgent"
                : "complete"
            }
            href="/safeguarding"
          />
          <MetricRow
            label="Missing from care"
            value={data.missingActive}
            status={data.missingActive > 0 ? "urgent" : "complete"}
            href="/safeguarding/missing"
          />
          <MetricRow
            label="High-risk children"
            value={data.highRiskChildren.length}
            status={data.highRiskChildren.length > 0 ? "overdue" : "good"}
            href="/safeguarding/risk"
          />
        </div>
        {data.highRiskChildren.length > 0 && (
          <CollapsibleSection title="High-risk detail" count={data.highRiskChildren.length}>
            <div className="space-y-2 mt-2">
              {data.highRiskChildren.map((child) => (
                <Link
                  key={child.id}
                  href={`/young-people/${child.id}?tab=risk`}
                  className="flex items-center gap-3 rounded-xl bg-red-50/20 px-3 py-2.5 hover:bg-red-50/40 transition-colors"
                >
                  <User className="h-4 w-4 text-red-600 shrink-0" />
                  <span className="text-sm text-[var(--cs-navy)] flex-1 truncate">
                    {child.name}
                  </span>
                  <RiskBadge level="high" size="sm" />
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </CalmCard>

      {/* Compliance Status */}
      <CalmCard>
        <CalmCardHeader
          icon={ClipboardCheck}
          title="Compliance Status"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <div className="space-y-1">
          <MetricRow
            label="Training expired"
            value={data.trainingExpired}
            status={data.trainingExpired > 0 ? "overdue" : "complete"}
            href="/staff?tab=training&filter=expired"
          />
          <MetricRow
            label="Training expiring"
            value={data.trainingExpiring}
            status={data.trainingExpiring > 0 ? "due" : "good"}
            href="/staff?tab=training&filter=expiring"
          />
          <MetricRow
            label="Supervision overdue"
            value={data.supervisionOverdue}
            status={data.supervisionOverdue > 0 ? "overdue" : "complete"}
            href="/staff?filter=supervision_overdue"
          />
          <MetricRow
            label="Building checks overdue"
            value={data.buildingChecksOverdue}
            status={data.buildingChecksOverdue > 0 ? "overdue" : "complete"}
            href="/buildings?filter=overdue"
          />
        </div>
      </CalmCard>

      {/* This Week */}
      <CalmCard>
        <CalmCardHeader
          icon={Calendar}
          title="This Week"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <div className="space-y-1">
          <MetricRow
            label="Incidents"
            value={data.incidentsThisWeek}
            status={data.incidentsThisWeek > 2 ? "urgent" : "info"}
            href="/incidents"
          />
          <MetricRow
            label="Missing daily logs"
            value={data.missingLogsCount}
            status={data.missingLogsCount > 0 ? "due" : "complete"}
            href="/daily-log"
          />
          <MetricRow
            label="Direct work completed"
            value={data.completedToday}
            status="complete"
            href="/direct-work"
          />
          <MetricRow
            label="Medications missed"
            value={data.missedMedsToday}
            status={data.missedMedsToday > 0 ? "urgent" : "complete"}
            href="/medication?filter=missed"
          />
        </div>
      </CalmCard>

      {/* Staff Workload */}
      <CalmCard className="md:col-span-2 lg:col-span-2">
        <CalmCardHeader
          icon={BarChart3}
          title="Staff Workload"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        {data.staffWorkload.length > 0 ? (
          <div className="space-y-2">
            {data.staffWorkload.map((sw, i) => {
              const load =
                sw.taskCount >= 8
                  ? "overdue"
                  : sw.taskCount >= 5
                    ? "due"
                    : "good";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-[var(--cs-surface)] px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
                    <span className="text-sm text-[var(--cs-navy)] truncate">
                      {sw.name}
                    </span>
                  </div>
                  <CalmStatusBadge
                    status={load as "good" | "due" | "overdue"}
                    label={`${sw.taskCount} ${pluralise(sw.taskCount, "task")}`}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <CalmEmptyState
            icon="Users"
            title="No shift data"
            description="Staff workload will appear when shifts are assigned."
            className="py-8 border-0"
          />
        )}
      </CalmCard>

      {/* Reports & Evidence */}
      <CalmCard>
        <CalmCardHeader
          icon={FileText}
          title="Reports & Evidence"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <div className="space-y-2">
          <Link
            href="/ri/reg44"
            className="flex items-center gap-3 rounded-xl bg-[var(--cs-surface)] px-3 py-3 hover:bg-[var(--cs-surface)]/80 transition-colors"
          >
            <FileText className="h-4 w-4 text-[var(--cs-text-muted)]" />
            <span className="text-sm text-[var(--cs-navy)] flex-1">
              Reg 44 Reports
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
          </Link>
          <Link
            href="/ri/reg45"
            className="flex items-center gap-3 rounded-xl bg-[var(--cs-surface)] px-3 py-3 hover:bg-[var(--cs-surface)]/80 transition-colors"
          >
            <FileText className="h-4 w-4 text-[var(--cs-text-muted)]" />
            <span className="text-sm text-[var(--cs-navy)] flex-1">
              Reg 45 Reports
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
          </Link>
          <Link
            href="/quality/ofsted-evidence-room"
            className="flex items-center gap-3 rounded-xl bg-[var(--cs-surface)] px-3 py-3 hover:bg-[var(--cs-surface)]/80 transition-colors"
          >
            <ClipboardCheck className="h-4 w-4 text-[var(--cs-text-muted)]" />
            <span className="text-sm text-[var(--cs-navy)] flex-1">
              Evidence Packs
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
          </Link>
        </div>
      </CalmCard>
    </div>
  );
}

// ── Responsible Individual View ──────────────────────────────────────────────

function ResponsibleIndividualDashboard({
  data,
}: {
  data: RoleDashboardData;
}) {
  // RI sees a portfolio level — for now, 1 home, but structure supports many
  const homeComplianceScore = data.complianceScore;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Portfolio Overview — Hero */}
      <CalmCard className="md:col-span-2 lg:col-span-3">
        <CalmCardHeader
          icon={Building2}
          title="Portfolio Overview"
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6 pt-2">
          <HeroStat
            label="Homes managed"
            value={1}
            icon={Home}
            accent="bg-amber-50"
          />
          <HeroStat
            label="Total children"
            value={data.childrenCount}
            icon={Heart}
            accent="bg-emerald-50"
          />
          <HeroStat
            label="Overall compliance"
            value={`${homeComplianceScore}%`}
            icon={ClipboardCheck}
            accent={
              homeComplianceScore >= 90
                ? "bg-emerald-50"
                : homeComplianceScore >= 70
                  ? "bg-amber-50"
                  : "bg-red-50"
            }
          />
          <HeroStat
            label="Open incidents"
            value={data.openIncidents}
            icon={ShieldAlert}
            accent={data.openIncidents > 0 ? "bg-red-50" : "bg-[var(--cs-surface)]"}
          />
          <HeroStat
            label="Staff on shift"
            value={data.staffOnShift}
            icon={Users}
            accent="bg-blue-50"
          />
        </div>
      </CalmCard>

      {/* Risk Trends */}
      <CalmCard>
        <CalmCardHeader
          icon={TrendingUp}
          title="Risk Trends"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        {data.highRiskChildren.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-amber-50/50 border border-amber-200 px-3 py-2.5 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-sm text-amber-700">
                {data.highRiskChildren.length}{" "}
                {pluralise(data.highRiskChildren.length, "child", "children")}{" "}
                with elevated risk
              </span>
            </div>
            {data.highRiskChildren.map((child) => (
              <Link
                key={child.id}
                href={`/young-people/${child.id}?tab=risk`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--cs-surface)] transition-colors"
              >
                <User className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
                <span className="text-sm text-[var(--cs-navy)] flex-1 truncate">
                  {child.name}
                </span>
                <RiskBadge level="high" size="sm" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-sm text-emerald-700">
              No escalating risk trends
            </span>
          </div>
        )}
      </CalmCard>

      {/* Safeguarding Themes */}
      <CalmCard>
        <CalmCardHeader
          icon={Shield}
          title="Safeguarding Themes"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <div className="space-y-1">
          <MetricRow
            label="Missing from care"
            value={data.missingActive}
            status={data.missingActive > 0 ? "urgent" : "complete"}
            href="/safeguarding/missing"
          />
          <MetricRow
            label="Contextual risk"
            value={data.contextualRisk}
            status={data.contextualRisk > 0 ? "overdue" : "good"}
            href="/safeguarding/contextual"
          />
          <MetricRow
            label="Incidents this week"
            value={data.incidentsThisWeek}
            status={data.incidentsThisWeek > 2 ? "urgent" : "info"}
            href="/incidents"
          />
          <MetricRow
            label="Critical incidents"
            value={data.criticalIncidents}
            status={data.criticalIncidents > 0 ? "urgent" : "complete"}
            href="/incidents?filter=critical"
          />
        </div>
      </CalmCard>

      {/* Compliance Scores per Home */}
      <CalmCard>
        <CalmCardHeader
          icon={ClipboardCheck}
          title="Compliance Scores"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <div className="space-y-2">
          <TrafficLight label="Home 1" score={homeComplianceScore} />
          <div className="border-t border-[var(--cs-border-subtle)] pt-2 mt-2">
            <MetricRow
              label="Training expired"
              value={data.trainingExpired}
              status={data.trainingExpired > 0 ? "overdue" : "complete"}
            />
            <MetricRow
              label="Supervision overdue"
              value={data.supervisionOverdue}
              status={data.supervisionOverdue > 0 ? "overdue" : "complete"}
            />
          </div>
        </div>
      </CalmCard>

      {/* Manager Oversight Evidence */}
      <CalmCard className="md:col-span-2 lg:col-span-2">
        <CalmCardHeader
          icon={FileText}
          title="Manager Oversight Evidence"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <div className="space-y-2">
          <MetricRow
            label="Incidents awaiting oversight"
            value={data.awaitingOversight}
            status={data.awaitingOversight > 0 ? "due" : "complete"}
            href="/incidents?filter=awaiting_oversight"
          />
          <MetricRow
            label="Care events pending review"
            value={data.careEventsAwaitingReview}
            status={data.careEventsAwaitingReview > 0 ? "due" : "complete"}
            href="/care-events?filter=awaiting_review"
          />
          <MetricRow
            label="Handover submitted"
            value={data.hasHandover ? "Yes" : "No"}
            status={data.hasHandover ? "complete" : "overdue"}
            href="/handover"
          />
          <Link
            href="/management-oversight"
            className="flex items-center justify-center gap-1.5 pt-3 text-xs font-medium text-[var(--cs-navy)] hover:underline"
          >
            View oversight reports
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CalmCard>

      {/* Inspection Readiness */}
      <CalmCard>
        <CalmCardHeader
          icon={Star}
          title="Inspection Readiness"
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
        />
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl",
              homeComplianceScore >= 80
                ? "bg-emerald-50"
                : homeComplianceScore >= 60
                  ? "bg-amber-50"
                  : "bg-red-50",
            )}
          >
            <span
              className={cn(
                "text-2xl font-bold",
                homeComplianceScore >= 80
                  ? "text-emerald-700"
                  : homeComplianceScore >= 60
                    ? "text-amber-700"
                    : "text-red-700",
              )}
            >
              {homeComplianceScore}
            </span>
          </div>
          <CalmStatusBadge
            status={
              homeComplianceScore >= 90
                ? "outstanding"
                : homeComplianceScore >= 80
                  ? "good"
                  : homeComplianceScore >= 60
                    ? "adequate"
                    : "inadequate"
            }
          />
          <p className="text-xs text-[var(--cs-text-muted)] max-w-[200px]">
            Based on compliance scores, training currency, and oversight evidence
          </p>
        </div>
      </CalmCard>

      {/* Escalations */}
      <CalmCard className="lg:col-span-3">
        <CalmCardHeader
          icon={Megaphone}
          title="Escalations Requiring RI Attention"
          iconBg="bg-red-50"
          iconColor="text-red-700"
        />
        {data.criticalIncidents > 0 ||
        data.missingActive > 0 ||
        data.missedMedsToday > 0 ? (
          <div className="space-y-2">
            {data.criticalIncidents > 0 && (
              <MetricRow
                label="Critical incidents"
                value={data.criticalIncidents}
                status="urgent"
                href="/incidents?filter=critical"
              />
            )}
            {data.missingActive > 0 && (
              <MetricRow
                label="Children missing from care"
                value={data.missingActive}
                status="urgent"
                href="/safeguarding/missing"
              />
            )}
            {data.missedMedsToday > 0 && (
              <MetricRow
                label="Medications missed today"
                value={data.missedMedsToday}
                status="urgent"
                href="/medication?filter=missed"
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-sm text-emerald-700">
              No escalations requiring attention
            </span>
          </div>
        )}
      </CalmCard>
    </div>
  );
}

// ── Admin View ───────────────────────────────────────────────────────────────

function AdminDashboard({ data }: { data: RoleDashboardData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* System Status */}
      <CalmCard className="md:col-span-2 lg:col-span-1">
        <CalmCardHeader
          icon={Cog}
          title="System Status"
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <div className="space-y-1">
          <MetricRow label="Total staff" value={data.staffCount} />
          <MetricRow label="Children in care" value={data.childrenCount} />
          <MetricRow label="Active tasks" value={data.totalActiveTasks} />
          <MetricRow label="Open incidents" value={data.openIncidents} />
        </div>
      </CalmCard>

      {/* Recent Activity */}
      <CalmCard className="md:col-span-2 lg:col-span-2">
        <CalmCardHeader
          icon={Clock}
          title="Recent Activity"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <div className="space-y-2">
          {data.completedToday > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-[var(--cs-surface)] px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-[var(--cs-navy)]">
                {data.completedToday}{" "}
                {pluralise(data.completedToday, "task")} completed today
              </span>
            </div>
          )}
          {data.incidentsThisWeek > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-[var(--cs-surface)] px-3 py-2.5">
              <Shield className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm text-[var(--cs-navy)]">
                {data.incidentsThisWeek}{" "}
                {pluralise(data.incidentsThisWeek, "incident")} this week
              </span>
            </div>
          )}
          {data.pendingLeaveRequests > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-[var(--cs-surface)] px-3 py-2.5">
              <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm text-[var(--cs-navy)]">
                {data.pendingLeaveRequests} pending leave{" "}
                {pluralise(data.pendingLeaveRequests, "request")}
              </span>
            </div>
          )}
          {data.completedToday === 0 &&
            data.incidentsThisWeek === 0 &&
            data.pendingLeaveRequests === 0 && (
              <CalmEmptyState
                icon="Activity"
                title="No recent activity"
                description="Activity feed will show updates as they happen."
                className="py-6 border-0"
              />
            )}
        </div>
      </CalmCard>

      {/* Configuration Links */}
      <CalmCard className="md:col-span-2 lg:col-span-3">
        <CalmCardHeader
          icon={Cog}
          title="Configuration"
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/staff"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-white p-4 hover:bg-[var(--cs-surface)] transition-colors text-center"
          >
            <Users className="h-5 w-5 text-[var(--cs-navy)]" />
            <span className="text-xs font-medium text-[var(--cs-navy)]">
              Users
            </span>
          </Link>
          <Link
            href="/staff"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-white p-4 hover:bg-[var(--cs-surface)] transition-colors text-center"
          >
            <Shield className="h-5 w-5 text-[var(--cs-navy)]" />
            <span className="text-xs font-medium text-[var(--cs-navy)]">
              Roles
            </span>
          </Link>
          <Link
            href="/forms"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-white p-4 hover:bg-[var(--cs-surface)] transition-colors text-center"
          >
            <FileText className="h-5 w-5 text-[var(--cs-navy)]" />
            <span className="text-xs font-medium text-[var(--cs-navy)]">
              Forms
            </span>
          </Link>
          <Link
            href="/workflow-orchestration"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-white p-4 hover:bg-[var(--cs-surface)] transition-colors text-center"
          >
            <Zap className="h-5 w-5 text-[var(--cs-navy)]" />
            <span className="text-xs font-medium text-[var(--cs-navy)]">
              Automation
            </span>
          </Link>
          <Link
            href="/settings"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-white p-4 hover:bg-[var(--cs-surface)] transition-colors text-center"
          >
            <Cog className="h-5 w-5 text-[var(--cs-navy)]" />
            <span className="text-xs font-medium text-[var(--cs-navy)]">
              Settings
            </span>
          </Link>
        </div>
      </CalmCard>
    </div>
  );
}

// ── Role Mapping ─────────────────────────────────────────────────────────────

const ROLE_TO_VIEW: Record<
  string,
  | "support_worker"
  | "senior_support_worker"
  | "registered_manager"
  | "responsible_individual"
  | "admin"
> = {
  // Direct matches
  support_worker: "support_worker",
  senior_support_worker: "senior_support_worker",
  registered_manager: "registered_manager",
  responsible_individual: "responsible_individual",
  admin: "admin",
  super_admin: "admin",
  // AppRole mappings
  residential_care_worker: "support_worker",
  bank_staff: "support_worker",
  team_leader: "senior_support_worker",
  deputy_manager: "senior_support_worker",
  therapist: "support_worker",
  hr_recruitment: "admin",
  finance_operations: "admin",
  external_partner: "support_worker",
  auditor: "registered_manager",
};

function resolveView(role: string) {
  return ROLE_TO_VIEW[role] ?? "support_worker";
}

const ROLE_GREETING: Record<string, { title: string; subtitle: string }> = {
  support_worker: {
    title: "Your Day",
    subtitle: "Everything you need for your shift",
  },
  senior_support_worker: {
    title: "Team Overview",
    subtitle: "Your shift, your team, what needs attention",
  },
  registered_manager: {
    title: "Home Management",
    subtitle: "Oversight, compliance, and care quality at a glance",
  },
  responsible_individual: {
    title: "Portfolio Governance",
    subtitle: "Multi-home oversight, risk trends, and inspection readiness",
  },
  admin: {
    title: "Administration",
    subtitle: "System configuration and user management",
  },
};

// ── Main Component ───────────────────────────────────────────────────────────

export function RoleBasedDashboard({ role }: RoleBasedDashboardProps) {
  const { data, isLoading } = useRoleDashboardData();
  const view = resolveView(role);
  const greeting = ROLE_GREETING[view];

  // Loading
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
          <p className="text-sm text-[var(--cs-text-muted)]">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[var(--cs-navy)] tracking-tight">
          {greeting.title}
        </h2>
        <p className="text-sm text-[var(--cs-text-muted)]">
          {greeting.subtitle}
        </p>
      </div>

      {/* View switcher */}
      {view === "support_worker" && <SupportWorkerDashboard data={data} />}
      {view === "senior_support_worker" && (
        <SeniorSupportWorkerDashboard data={data} />
      )}
      {view === "registered_manager" && (
        <RegisteredManagerDashboard data={data} />
      )}
      {view === "responsible_individual" && (
        <ResponsibleIndividualDashboard data={data} />
      )}
      {view === "admin" && <AdminDashboard data={data} />}

      {/* Footer — live update indicator */}
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-[var(--cs-text-muted)] pt-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live — refreshes every 30s
      </div>
    </div>
  );
}
