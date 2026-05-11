"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NOTIFICATION CENTRE
// Dropdown panel from the Bell icon showing live alerts, overdue tasks,
// incidents needing oversight, medication alerts, and compliance warnings.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { cn, formatRelative } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useDashboard } from "@/hooks/use-dashboard";
import { usePatternAlerts } from "@/hooks/use-intelligence";
import {
  Bell, AlertTriangle, Pill, MapPin, Eye, Shield,
  CheckCircle2, GraduationCap, Clock, ChevronRight,
  Building2, UserX, Flame, X, CheckCheck, ArrowRightLeft,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  timestamp?: string;
  category: "safeguarding" | "medication" | "incidents" | "tasks" | "compliance" | "staffing" | "environment" | "intelligence";
}

// ── Category colours ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  safeguarding: "bg-red-50 border-red-200",
  medication:   "bg-teal-50 border-teal-200",
  incidents:    "bg-orange-50 border-orange-200",
  tasks:        "bg-blue-50 border-blue-200",
  compliance:   "bg-amber-50 border-amber-200",
  staffing:     "bg-[var(--cs-aria-gold-bg)] border-[var(--cs-aria-gold-soft)]",
  environment:  "bg-[var(--cs-surface)] border-[var(--cs-border)]",
  intelligence: "bg-indigo-50 border-indigo-200",
};

const TYPE_DOT: Record<string, string> = {
  critical: "bg-red-500",
  warning:  "bg-amber-500",
  info:     "bg-blue-400",
  success:  "bg-emerald-400",
};

// ── Component ────────────────────────────────────────────────────────────────

export function NotificationCentre() {
  const [open, setOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const dashboard = useDashboard();
  const patterns  = usePatternAlerts({ status: "active" });
  const d = dashboard.data?.data;

  // ── Build notification list from live data ─────────────────────────────
  const notifications = useMemo<NotificationItem[]>(() => {
    if (!d) return [];
    const items: NotificationItem[] = [];

    // Missing from care — CRITICAL
    if (d.safeguarding.missing_active > 0) {
      items.push({
        id: "missing_active",
        type: "critical",
        icon: MapPin,
        title: `${d.safeguarding.missing_active} young ${d.safeguarding.missing_active === 1 ? "person" : "people"} missing from care`,
        description: "Active missing episode requires immediate action. Police and LA protocols apply.",
        href: "/missing-from-care",
        category: "safeguarding",
      });
    }

    // Critical incidents
    if (d.incidents.critical > 0) {
      items.push({
        id: "critical_incidents",
        type: "critical",
        icon: AlertTriangle,
        title: `${d.incidents.critical} critical incident${d.incidents.critical > 1 ? "s" : ""} open`,
        description: "Critical-severity incidents requiring immediate management response.",
        href: "/incidents",
        category: "incidents",
      });
    }

    // Incidents needing oversight
    if (d.incidents.awaiting_oversight > 0) {
      items.push({
        id: "oversight_needed",
        type: "warning",
        icon: Eye,
        title: `${d.incidents.awaiting_oversight} incident${d.incidents.awaiting_oversight > 1 ? "s" : ""} need oversight`,
        description: "Management oversight notes have not been added to these incidents.",
        href: "/incidents",
        category: "incidents",
      });
    }

    // Medication missed
    if (d.medication.missed_today > 0) {
      items.push({
        id: "medication_missed",
        type: "critical",
        icon: Pill,
        title: `${d.medication.missed_today} medication${d.medication.missed_today > 1 ? "s" : ""} missed today`,
        description: "Scheduled medication administration was not recorded.",
        href: "/medication",
        category: "medication",
      });
    }

    // Medication exceptions this week
    if (d.medication.exceptions_this_week > 0) {
      items.push({
        id: "medication_exceptions",
        type: "warning",
        icon: Pill,
        title: `${d.medication.exceptions_this_week} medication exception${d.medication.exceptions_this_week > 1 ? "s" : ""} this week`,
        description: "Medication exceptions have been logged and may need review.",
        href: "/medication",
        category: "medication",
      });
    }

    // Overdue tasks
    if (d.tasks.overdue > 0) {
      items.push({
        id: "tasks_overdue",
        type: "warning",
        icon: Flame,
        title: `${d.tasks.overdue} task${d.tasks.overdue > 1 ? "s" : ""} overdue`,
        description: "Assigned tasks have passed their due date without completion.",
        href: "/tasks",
        category: "tasks",
      });
    }

    // Tasks awaiting sign-off
    if (d.tasks.awaiting_sign_off > 0) {
      items.push({
        id: "tasks_signoff",
        type: "info",
        icon: CheckCheck,
        title: `${d.tasks.awaiting_sign_off} task${d.tasks.awaiting_sign_off > 1 ? "s" : ""} awaiting sign-off`,
        description: "Completed tasks need manager sign-off before they can be closed.",
        href: "/tasks",
        category: "tasks",
      });
    }

    // Open shifts
    if (d.staffing.open_shifts > 0) {
      items.push({
        id: "open_shifts",
        type: "warning",
        icon: UserX,
        title: `${d.staffing.open_shifts} open shift${d.staffing.open_shifts > 1 ? "s" : ""} to fill`,
        description: "Rota gaps with no staff assigned. Maintain safe staffing ratios.",
        href: "/rota",
        category: "staffing",
      });
    }

    // Supervisions overdue
    if (d.staffing.supervision_overdue > 0) {
      items.push({
        id: "supervision_overdue",
        type: "warning",
        icon: Clock,
        title: `${d.staffing.supervision_overdue} supervision${d.staffing.supervision_overdue > 1 ? "s" : ""} overdue`,
        description: "Staff supervisions have passed their scheduled date.",
        href: "/supervision",
        category: "compliance",
      });
    }

    // Training expired
    if (d.compliance.training_expired > 0) {
      items.push({
        id: "training_expired",
        type: "warning",
        icon: GraduationCap,
        title: `${d.compliance.training_expired} training record${d.compliance.training_expired > 1 ? "s" : ""} expired`,
        description: "Mandatory training certificates have expired and need renewal.",
        href: "/training",
        category: "compliance",
      });
    }

    // Building checks overdue
    if (d.environment.building_checks_overdue > 0) {
      items.push({
        id: "building_overdue",
        type: "info",
        icon: Building2,
        title: `${d.environment.building_checks_overdue} building check${d.environment.building_checks_overdue > 1 ? "s" : ""} overdue`,
        description: "Scheduled safety checks have not been completed on time.",
        href: "/buildings",
        category: "environment",
      });
    }

    // Vehicle defects
    if (d.environment.vehicle_defects > 0) {
      items.push({
        id: "vehicle_defects",
        type: "info",
        icon: Building2,
        title: `${d.environment.vehicle_defects} vehicle defect${d.environment.vehicle_defects > 1 ? "s" : ""}`,
        description: "Outstanding vehicle defects need resolution.",
        href: "/vehicles",
        category: "environment",
      });
    }

    // Handover pending sign-off
    if (d.handover?.pending_sign_off) {
      items.push({
        id: "handover_pending",
        type: "warning",
        icon: ArrowRightLeft,
        title: "Handover awaiting your acknowledgement",
        description: "A shift handover has been created for you. Review and sign off to confirm receipt.",
        href: "/handover",
        category: "tasks",
      });
    }

    // All clear
    if (items.length === 0) {
      items.push({
        id: "all_clear",
        type: "success",
        icon: CheckCircle2,
        title: "All clear",
        description: "No outstanding alerts. Oak House is running smoothly.",
        href: "/dashboard",
        category: "intelligence",
      });
    }

    return items;
  }, [d]);

  // Filter dismissed
  const visible = notifications.filter((n) => !dismissedIds.has(n.id));
  const criticalCount = visible.filter((n) => n.type === "critical").length;
  const totalCount = visible.filter((n) => n.type !== "success").length;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell trigger ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
          open
            ? "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]"
            : "text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)] hover:text-[var(--cs-text-secondary)]",
        )}
        title={`${totalCount} notification${totalCount !== 1 ? "s" : ""}`}
      >
        <Bell className="h-4 w-4" />
        {totalCount > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ring-2 ring-[var(--cs-surface-elevated)]",
            criticalCount > 0 ? "bg-[var(--cs-risk)]" : "bg-[var(--cs-warning)]",
          )}>
            {totalCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[70vh] overflow-hidden rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] shadow-[var(--cs-shadow-elevated)] z-50 flex flex-col animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border-subtle)] shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--cs-text-muted)]" />
              <span className="text-sm font-semibold text-[var(--cs-navy)]">Notifications</span>
              {totalCount > 0 && (
                <span className="text-[10px] font-medium text-[var(--cs-text-muted)] bg-[var(--cs-surface)] rounded-full px-2 py-0.5">
                  {totalCount}
                </span>
              )}
            </div>
            {dismissedIds.size > 0 && (
              <button
                onClick={() => setDismissedIds(new Set())}
                className="text-[10px] text-[var(--cs-info)] hover:text-[var(--cs-info)]/80 font-medium"
              >
                Show all
              </button>
            )}
          </div>

          {/* Items */}
          <div className="overflow-y-auto flex-1">
            {visible.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-700">All clear</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-1">No outstanding notifications</p>
              </div>
            ) : (
              <div className="py-1">
                {visible.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-[var(--cs-surface)] transition-colors group relative",
                        item.type === "critical" && "bg-red-50/50",
                      )}
                    >
                      {/* Type dot */}
                      <span className={cn("h-2 w-2 rounded-full shrink-0 mt-1.5", TYPE_DOT[item.type])} />

                      {/* Icon */}
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl shrink-0",
                        CATEGORY_COLORS[item.category],
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          item.type === "critical" ? "text-red-600" :
                          item.type === "warning" ? "text-amber-600" :
                          item.type === "success" ? "text-emerald-600" :
                          "text-blue-500",
                        )} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-[13px] font-semibold leading-tight",
                          item.type === "critical" ? "text-red-800" : "text-[var(--cs-navy)]",
                        )}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Dismiss + arrow */}
                      <div className="flex items-center gap-1 shrink-0 mt-1">
                        {item.type !== "success" && (
                          <button
                            onClick={(e) => handleDismiss(item.id, e)}
                            className="h-5 w-5 rounded-md flex items-center justify-center text-[var(--cs-text-gentle)] hover:text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)] opacity-0 group-hover:opacity-100 transition-all"
                            title="Dismiss"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-gentle)] group-hover:text-[var(--cs-text-muted)] transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--cs-border-subtle)] px-4 py-2.5 shrink-0">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-[var(--cs-info)] hover:text-[var(--cs-info)]/80 transition-colors"
            >
              View Command Centre
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
