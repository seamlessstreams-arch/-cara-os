"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — WHAT NEEDS DOING TODAY PANEL
// Aggregates overdue tasks, missing logs, reviews, care plans, risk assessments,
// and children needing follow-up into urgency-grouped action items.
// Tap an item to open the relevant form with context pre-filled.
// CHR 2015 Reg 12, 13, 34, 35 — Proactive care delivery and oversight.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  FileText,
  Loader2,
  PartyPopper,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelative, isOverdue, isDueToday, todayStr } from "@/lib/utils";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuthContext } from "@/contexts/auth-context";

// ── Types ────────────────────────────────────────────────────────────────────

interface ActionItem {
  id: string;
  urgency: "urgent" | "due_today" | "coming_up";
  icon: React.ReactNode;
  description: string;
  childName?: string;
  /** Link to open the relevant form/page */
  href: string;
  /** Action button text */
  actionLabel: string;
  category: string;
}

// ── Urgency config ───────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  urgent: {
    label: "Urgent",
    badgeVariant: "destructive" as const,
    borderColor: "border-red-200",
    bgColor: "bg-red-50/50",
    dotColor: "bg-red-500",
  },
  due_today: {
    label: "Due Today",
    badgeVariant: "warning" as const,
    borderColor: "border-amber-200",
    bgColor: "bg-amber-50/50",
    dotColor: "bg-amber-500",
  },
  coming_up: {
    label: "Coming Up",
    badgeVariant: "info" as const,
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50/50",
    dotColor: "bg-blue-500",
  },
};

// ── Build action items from dashboard data ───────────────────────────────────

function buildActionItems(
  dashboardData: ReturnType<typeof useDashboard>["data"],
  userId: string,
): ActionItem[] {
  const items: ActionItem[] = [];
  const d = dashboardData?.data;
  if (!d) return items;

  const today = todayStr();

  // Overdue tasks
  const overdueTasks = (d.tasks.priority_queue ?? []).filter(
    (t) => isOverdue(t.due_date, t.status) && t.status !== "completed" && t.status !== "cancelled",
  );
  for (const task of overdueTasks) {
    const yp = d.young_people?.current?.find((c) => c.id === task.linked_child_id);
    items.push({
      id: `task-${task.id}`,
      urgency: "urgent",
      icon: <ClipboardList className="h-4 w-4 text-red-600" />,
      description: task.title,
      childName: yp ? `${yp.first_name} ${yp.last_name}` : undefined,
      href: `/tasks?id=${task.id}`,
      actionLabel: "Complete",
      category: "Overdue Task",
    });
  }

  // Tasks due today
  const todayTasks = (d.tasks.priority_queue ?? []).filter(
    (t) => isDueToday(t.due_date) && t.status !== "completed" && t.status !== "cancelled",
  );
  for (const task of todayTasks) {
    if (overdueTasks.some((ot) => ot.id === task.id)) continue;
    const yp = d.young_people?.current?.find((c) => c.id === task.linked_child_id);
    items.push({
      id: `task-today-${task.id}`,
      urgency: "due_today",
      icon: <ClipboardList className="h-4 w-4 text-amber-600" />,
      description: task.title,
      childName: yp ? `${yp.first_name} ${yp.last_name}` : undefined,
      href: `/tasks?id=${task.id}`,
      actionLabel: "Do Now",
      category: "Task Due Today",
    });
  }

  // Incidents awaiting oversight
  const oversightQueue = d.incidents.oversight_queue ?? [];
  for (const inc of oversightQueue) {
    const yp = d.young_people?.current?.find((c) => c.id === inc.child_id);
    items.push({
      id: `oversight-${inc.id}`,
      urgency: "urgent",
      icon: <Shield className="h-4 w-4 text-red-600" />,
      description: `Incident oversight needed: ${inc.reference}`,
      childName: yp ? `${yp.first_name} ${yp.last_name}` : undefined,
      href: `/incidents/${inc.id}`,
      actionLabel: "Review",
      category: "Oversight Needed",
    });
  }

  // Missing daily logs (children without a log today)
  const currentChildren = d.young_people?.current ?? [];
  for (const yp of currentChildren) {
    // Check if last_log_date is not today
    const ypAny = yp as Record<string, unknown>;
    const lastLog = ypAny.last_log_date as string | null | undefined;
    if (!lastLog || lastLog < today) {
      items.push({
        id: `missing-log-${yp.id}`,
        urgency: "due_today",
        icon: <FileText className="h-4 w-4 text-amber-600" />,
        description: "Daily log not yet recorded",
        childName: `${yp.first_name} ${yp.last_name}`,
        href: `/young-people/${yp.id}?tab=daily-log&action=new`,
        actionLabel: "Record Now",
        category: "Missing Daily Log",
      });
    }
  }

  // Supervision overdue
  if (d.staffing.supervision_overdue > 0) {
    items.push({
      id: "supervision-overdue",
      urgency: "urgent",
      icon: <Users className="h-4 w-4 text-red-600" />,
      description: `${d.staffing.supervision_overdue} staff supervision${d.staffing.supervision_overdue === 1 ? "" : "s"} overdue`,
      href: "/staff?filter=supervision_overdue",
      actionLabel: "View",
      category: "Supervision Overdue",
    });
  }

  // Training expired
  if (d.compliance.training_expired > 0) {
    items.push({
      id: "training-expired",
      urgency: "urgent",
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      description: `${d.compliance.training_expired} training record${d.compliance.training_expired === 1 ? "" : "s"} expired`,
      href: "/staff?tab=training&filter=expired",
      actionLabel: "View",
      category: "Training Expired",
    });
  }

  // Training expiring soon
  if (d.compliance.training_expiring > 0) {
    items.push({
      id: "training-expiring",
      urgency: "coming_up",
      icon: <Calendar className="h-4 w-4 text-blue-600" />,
      description: `${d.compliance.training_expiring} training record${d.compliance.training_expiring === 1 ? "" : "s"} expiring soon`,
      href: "/staff?tab=training&filter=expiring",
      actionLabel: "Plan",
      category: "Training Expiring",
    });
  }

  // Medication issues
  if (d.medication.missed_today > 0) {
    items.push({
      id: "medication-missed",
      urgency: "urgent",
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      description: `${d.medication.missed_today} medication${d.medication.missed_today === 1 ? "" : "s"} missed today`,
      href: "/medication?filter=missed",
      actionLabel: "Review",
      category: "Medication Missed",
    });
  }

  // Building checks overdue
  if (d.environment.building_checks_overdue > 0) {
    items.push({
      id: "building-checks-overdue",
      urgency: "urgent",
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      description: `${d.environment.building_checks_overdue} building check${d.environment.building_checks_overdue === 1 ? "" : "s"} overdue`,
      href: "/building?filter=overdue",
      actionLabel: "Complete",
      category: "Building Check Overdue",
    });
  }

  // Building checks due today
  if (d.environment.building_checks_due > 0) {
    items.push({
      id: "building-checks-due",
      urgency: "due_today",
      icon: <Calendar className="h-4 w-4 text-amber-600" />,
      description: `${d.environment.building_checks_due} building check${d.environment.building_checks_due === 1 ? "" : "s"} due today`,
      href: "/building?filter=due_today",
      actionLabel: "Start",
      category: "Building Check Due",
    });
  }

  // Care events awaiting review
  if (d.care_events?.awaiting_manager_review && d.care_events.awaiting_manager_review > 0) {
    items.push({
      id: "care-events-review",
      urgency: "due_today",
      icon: <FileText className="h-4 w-4 text-amber-600" />,
      description: `${d.care_events.awaiting_manager_review} care event${d.care_events.awaiting_manager_review === 1 ? "" : "s"} awaiting review`,
      href: "/care-events?filter=awaiting_review",
      actionLabel: "Review",
      category: "Care Event Review",
    });
  }

  // Active missing episodes
  if (d.safeguarding.missing_active > 0) {
    for (const ep of d.safeguarding.missing_episodes ?? []) {
      const epAny = ep as Record<string, unknown>;
      if (epAny.status === "active") {
        const yp = currentChildren.find((c) => c.id === epAny.child_id);
        items.push({
          id: `missing-${epAny.id}`,
          urgency: "urgent",
          icon: <Shield className="h-4 w-4 text-red-600" />,
          description: "Young person currently missing from care",
          childName: yp ? `${yp.first_name} ${yp.last_name}` : undefined,
          href: `/safeguarding/missing/${epAny.id}`,
          actionLabel: "Respond",
          category: "Missing from Care",
        });
      }
    }
  }

  // Pending leave requests
  if (d.staffing.pending_leave_requests > 0) {
    items.push({
      id: "leave-requests",
      urgency: "coming_up",
      icon: <Calendar className="h-4 w-4 text-blue-600" />,
      description: `${d.staffing.pending_leave_requests} leave request${d.staffing.pending_leave_requests === 1 ? "" : "s"} pending approval`,
      href: "/staff?tab=leave&filter=pending",
      actionLabel: "Review",
      category: "Leave Requests",
    });
  }

  return items;
}

// ── Component ────────────────────────────────────────────────────────────────

interface WhatNeedsDoingTodayProps {
  /** Compact mode for sidebar, expanded for main dashboard */
  compact?: boolean;
  className?: string;
}

export function WhatNeedsDoingToday({
  compact = false,
  className,
}: WhatNeedsDoingTodayProps) {
  const { data, isLoading } = useDashboard();
  const { currentUser } = useAuthContext();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    urgent: true,
    due_today: true,
    coming_up: !compact,
  });

  const userId = currentUser?.id ?? "";

  const actionItems = useMemo(
    () => buildActionItems(data, userId),
    [data, userId],
  );

  const grouped = useMemo(() => {
    const groups: Record<string, ActionItem[]> = {
      urgent: [],
      due_today: [],
      coming_up: [],
    };
    for (const item of actionItems) {
      groups[item.urgency].push(item);
    }
    return groups;
  }, [actionItems]);

  const totalItems = actionItems.length;

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden border-[var(--cs-border)]", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
        </CardContent>
      </Card>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────
  if (totalItems === 0) {
    return (
      <Card className={cn("overflow-hidden border-emerald-200", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <PartyPopper className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="text-base font-semibold text-[var(--cs-navy)] mb-1">
            Everything's up to date!
          </h3>
          <p className="text-sm text-[var(--cs-text-muted)]">
            No outstanding tasks, logs, or reviews right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <Card className={cn("overflow-hidden border-[var(--cs-border)]", className)}>
      <CardHeader className="pb-3 bg-[var(--cs-surface)]/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            <span className="text-[var(--cs-navy)]">What Needs Doing Today</span>
          </CardTitle>
          <Badge variant="secondary">
            {totalItems} item{totalItems === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-3", compact ? "px-3 pb-3" : "")}>
        {(["urgent", "due_today", "coming_up"] as const).map((urgency) => {
          const items = grouped[urgency];
          if (items.length === 0) return null;
          const config = URGENCY_CONFIG[urgency];
          const isOpen = expandedGroups[urgency] ?? true;

          return (
            <div key={urgency}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(urgency)}
                className="w-full flex items-center gap-2 py-1.5 text-left"
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", config.dotColor)} />
                <span className="text-xs font-semibold text-[var(--cs-navy)] flex-1">
                  {config.label}
                </span>
                <Badge variant={config.badgeVariant} className="text-[10px]">
                  {items.length}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 text-[var(--cs-text-muted)]" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-[var(--cs-text-muted)]" />
                )}
              </button>

              {/* Items */}
              {isOpen && (
                <div className="space-y-1.5 mt-1 animate-[gentleFadeUp_0.15s_ease-out]">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm",
                        config.borderColor,
                        config.bgColor,
                        "hover:bg-opacity-80",
                      )}
                    >
                      <div className="shrink-0">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm text-[var(--cs-navy)] truncate",
                          compact ? "text-xs" : "",
                        )}>
                          {item.description}
                        </p>
                        {item.childName && (
                          <p className="text-[11px] text-[var(--cs-text-muted)] truncate">
                            {item.childName}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {!compact && (
                          <span className="text-[10px] text-[var(--cs-text-muted)]">
                            {item.category}
                          </span>
                        )}
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
                          urgency === "urgent"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : urgency === "due_today"
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200",
                        )}>
                          {item.actionLabel}
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Summary footer */}
        {!compact && (
          <div className="pt-2 border-t border-[var(--cs-border-subtle)] flex items-center justify-between">
            <p className="text-[11px] text-[var(--cs-text-muted)]">
              {grouped.urgent.length > 0
                ? `${grouped.urgent.length} urgent item${grouped.urgent.length === 1 ? "" : "s"} need attention`
                : "No urgent items"}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-[var(--cs-text-muted)]">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Updated live
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
