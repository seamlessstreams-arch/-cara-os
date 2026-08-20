// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMPLOYEES DOMAIN LANDING PAGE
// Overview of the team: who's on shift, supervision status, training
// compliance, wellbeing check-ins. Staff are the foundation of good care
// — this view helps the RM keep the team healthy and supported.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useMemo } from "react";
import {
  Users,
  UserCheck,
  ClipboardList,
  GraduationCap,
  Heart,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { getStore } from "@/lib/db/store";
import { todayStr, formatRelative, initials } from "@/lib/utils";
import { CalmStatusBadge } from "@/components/ui/calm-status-badge";
import { CalmEmptyState } from "@/components/ui/empty-state-calm";
import { DomainCreateMenu } from "@/components/common/domain-create-menu";
import { ROLE_LABELS } from "@/config/design-tokens";

// ── Types ────────────────────────────────────────────────────────────────────

type SupervisionStatus = "overdue" | "due" | "current";

interface StaffCardData {
  id: string;
  fullName: string;
  role: string;
  roleLabel: string;
  roleColor: string;
  supervisionStatus: SupervisionStatus;
  supervisionDate: string | null;
  trainingCompliant: boolean;
  trainingExpiring: number;
  taskCount: number;
  isOnShift: boolean;
  isOnLeave: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSupervisionStatus(
  nextDue: string | null,
  today: string,
): SupervisionStatus {
  if (!nextDue) return "current";
  if (nextDue < today) return "overdue";
  // Due within 7 days
  const dueDate = new Date(nextDue);
  const todayDate = new Date(today);
  const diffDays = Math.ceil(
    (dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 7) return "due";
  return "current";
}

// ── Component ────────────────────────────────────────────────────────────────

export function EmployeesLanding() {
  const store = getStore();
  const today = todayStr();

  // ── Active staff ─────────────────────────────────────────────────────────
  const activeStaff = useMemo(
    () => store.staff.filter((s) => s.is_active),
    [store.staff],
  );

  // ── Staff on shift today ─────────────────────────────────────────────────
  const onShiftIds = useMemo(() => {
    return new Set(
      store.shifts
        .filter(
          (s) =>
            s.date === today &&
            (s.status === "in_progress" ||
              s.status === "scheduled" ||
              s.status === "confirmed"),
        )
        .map((s) => s.staff_id),
    );
  }, [store.shifts, today]);

  // ── Staff on leave ───────────────────────────────────────────────────────
  const onLeaveIds = useMemo(() => {
    return new Set(
      store.leaveRequests
        .filter(
          (l) =>
            l.status === "approved" && l.start_date <= today && l.end_date >= today,
        )
        .map((l) => l.staff_id),
    );
  }, [store.leaveRequests, today]);

  // ── Training status per staff ────────────────────────────────────────────
  const trainingByStaff = useMemo(() => {
    const map = new Map<
      string,
      { compliant: boolean; expiringCount: number }
    >();
    activeStaff.forEach((s) => {
      const records = store.trainingRecords.filter(
        (t) => t.staff_id === s.id,
      );
      const expired = records.filter((t) => t.status === "expired").length;
      const expiring = records.filter(
        (t) => t.status === "expiring_soon",
      ).length;
      map.set(s.id, {
        compliant: expired === 0,
        expiringCount: expiring,
      });
    });
    return map;
  }, [activeStaff, store.trainingRecords]);

  // ── Tasks per staff ──────────────────────────────────────────────────────
  const taskCountByStaff = useMemo(() => {
    const map = new Map<string, number>();
    store.tasks
      .filter(
        (t) =>
          t.assigned_to &&
          t.status !== "completed" &&
          t.status !== "cancelled",
      )
      .forEach((t) => {
        const current = map.get(t.assigned_to!) || 0;
        map.set(t.assigned_to!, current + 1);
      });
    return map;
  }, [store.tasks]);

  // ── Build staff card data ────────────────────────────────────────────────
  const staffCards: StaffCardData[] = useMemo(
    () =>
      activeStaff.map((s) => {
        const roleConfig = ROLE_LABELS[s.role] || {
          label: s.job_title,
          color: "bg-slate-100 text-slate-800",
        };
        const supervisionStatus = getSupervisionStatus(
          s.next_supervision_due,
          today,
        );
        const training = trainingByStaff.get(s.id) || {
          compliant: true,
          expiringCount: 0,
        };

        return {
          id: s.id,
          fullName: s.full_name,
          role: s.role,
          roleLabel: roleConfig.label,
          roleColor: roleConfig.color,
          supervisionStatus,
          supervisionDate: s.next_supervision_due,
          trainingCompliant: training.compliant,
          trainingExpiring: training.expiringCount,
          taskCount: taskCountByStaff.get(s.id) || 0,
          isOnShift: onShiftIds.has(s.id),
          isOnLeave: onLeaveIds.has(s.id),
        };
      }),
    [activeStaff, today, trainingByStaff, taskCountByStaff, onShiftIds, onLeaveIds],
  );

  // ── Supervision pulse ────────────────────────────────────────────────────
  const supervisionPulse = useMemo(() => {
    const overdue = staffCards.filter(
      (s) => s.supervisionStatus === "overdue",
    ).length;
    const due = staffCards.filter(
      (s) => s.supervisionStatus === "due",
    ).length;
    const current = staffCards.filter(
      (s) => s.supervisionStatus === "current",
    ).length;
    return { overdue, due, current };
  }, [staffCards]);

  // ── Training compliance ──────────────────────────────────────────────────
  const trainingCompliance = useMemo(() => {
    const compliant = staffCards.filter((s) => s.trainingCompliant).length;
    const total = staffCards.length;
    const percentage = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { compliant, total, percentage };
  }, [staffCards]);

  // ── Wellbeing (from supervisions) ────────────────────────────────────────
  const wellbeingData = useMemo(() => {
    const supervisions = (
      store.supervisions as Array<{
        staff_id: string;
        actual_date: string | null;
        status: string;
        wellbeing_score: number | null;
      }>
    )
      .filter((s) => s.status === "completed" && s.actual_date)
      .sort((a, b) => (b.actual_date || "").localeCompare(a.actual_date || ""));

    const lastByStaff = new Map<
      string,
      { date: string; score: number | null }
    >();
    supervisions.forEach((s) => {
      if (!lastByStaff.has(s.staff_id)) {
        lastByStaff.set(s.staff_id, {
          date: s.actual_date!,
          score: s.wellbeing_score,
        });
      }
    });
    return lastByStaff;
  }, [store.supervisions]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Users className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--cs-navy)]">
              Employees
            </h1>
            <p className="text-sm text-[var(--cs-text-muted)]">
              {store.home.name} team
            </p>
          </div>
        </div>
        <DomainCreateMenu domain="employee" />
      </div>

      {/* ── Staff Overview ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="h-4 w-4 text-[var(--cs-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Staff Overview
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4 text-center">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">
              {activeStaff.length}
            </p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
              Total Staff
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {onShiftIds.size}
            </p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
              On Shift
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {onLeaveIds.size}
            </p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
              On Leave
            </p>
          </div>
        </div>
      </section>

      {/* ── Staff Cards Grid ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-[var(--cs-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Team Members
          </h2>
        </div>

        {staffCards.length === 0 ? (
          <CalmEmptyState
            icon="Users"
            title="No staff members"
            description="No active staff members found for this home."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {staffCards.map((staff) => (
              <div
                key={staff.id}
                className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4 hover:shadow-[var(--cs-shadow-card)] transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm relative">
                    {initials(staff.fullName)}
                    {staff.isOnShift && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"
                        title="On shift"
                        aria-label="Currently on shift"
                      />
                    )}
                    {staff.isOnLeave && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-500 border-2 border-white"
                        title="On leave"
                        aria-label="Currently on leave"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--cs-navy)] truncate">
                      {staff.fullName}
                    </h3>
                    <span
                      className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${staff.roleColor}`}
                    >
                      {staff.roleLabel}
                    </span>
                  </div>
                </div>

                {/* Status row */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {/* Supervision */}
                  <CalmStatusBadge
                    status={
                      staff.supervisionStatus === "overdue"
                        ? "overdue"
                        : staff.supervisionStatus === "due"
                          ? "due"
                          : "complete"
                    }
                    label={
                      staff.supervisionStatus === "overdue"
                        ? "Supervision overdue"
                        : staff.supervisionStatus === "due"
                          ? "Supervision due"
                          : "Supervision current"
                    }
                    size="sm"
                  />

                  {/* Training */}
                  {!staff.trainingCompliant && (
                    <CalmStatusBadge
                      status="urgent"
                      label="Training expired"
                      size="sm"
                    />
                  )}
                  {staff.trainingCompliant && staff.trainingExpiring > 0 && (
                    <CalmStatusBadge
                      status="due"
                      label={`${staff.trainingExpiring} expiring`}
                      size="sm"
                    />
                  )}
                </div>

                {/* Task count */}
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--cs-text-muted)]">
                  <ClipboardList className="h-3 w-3" />
                  <span>
                    {staff.taskCount} active{" "}
                    {staff.taskCount === 1 ? "task" : "tasks"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Supervision Pulse ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-[var(--cs-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Supervision Pulse
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-lg font-bold text-emerald-700">
                  {supervisionPulse.current}
                </span>
              </div>
              <p className="text-[10px] font-medium text-[var(--cs-text-muted)]">
                Current
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold text-amber-700">
                  {supervisionPulse.due}
                </span>
              </div>
              <p className="text-[10px] font-medium text-[var(--cs-text-muted)]">
                Due Soon
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-lg font-bold text-red-700">
                  {supervisionPulse.overdue}
                </span>
              </div>
              <p className="text-[10px] font-medium text-[var(--cs-text-muted)]">
                Overdue
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Training Compliance ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-4 w-4 text-[var(--cs-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Training Compliance
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4">
          <div className="flex items-center gap-4">
            {/* Progress ring (simplified as bar) */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--cs-text-secondary)]">
                  Overall compliance
                </span>
                <span className="text-sm font-bold text-[var(--cs-navy)]">
                  {trainingCompliance.percentage}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-[var(--cs-border)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    trainingCompliance.percentage >= 90
                      ? "bg-emerald-500"
                      : trainingCompliance.percentage >= 70
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${trainingCompliance.percentage}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-[var(--cs-text-muted)] mt-1.5">
                {trainingCompliance.compliant} of {trainingCompliance.total}{" "}
                staff fully compliant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Wellbeing Check-ins ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-4 w-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Wellbeing Check-ins
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4">
          {activeStaff.length === 0 ? (
            <p className="text-xs text-[var(--cs-text-muted)]">
              No staff data available.
            </p>
          ) : (
            <div className="space-y-2">
              {activeStaff.map((s) => {
                const wb = wellbeingData.get(s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--cs-surface)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 text-[10px] font-semibold">
                        {initials(s.full_name)}
                      </div>
                      <span className="text-xs font-medium text-[var(--cs-navy)]">
                        {s.first_name} {s.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {wb ? (
                        <>
                          {wb.score !== null && (
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                wb.score >= 7
                                  ? "bg-emerald-400"
                                  : wb.score >= 4
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                              }`}
                              title={`Wellbeing: ${wb.score}/10`}
                            />
                          )}
                          <span className="text-[10px] text-[var(--cs-text-gentle)]">
                            {formatRelative(wb.date)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-[var(--cs-text-gentle)] italic">
                          No check-in recorded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
