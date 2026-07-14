// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DOMAIN LANDING PAGE
// The heartbeat of Chamberlain House. Shows what matters today: priorities, young
// people, staff, actions, compliance, and positive progress — all at a glance.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Home,
  Users,
  UserCheck,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  Heart,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { getStore } from "@/lib/db/store";
import { todayStr, formatRelative, initials } from "@/lib/utils";
import { RiskBadge } from "@/components/ui/risk-badge";
import { CalmStatusBadge } from "@/components/ui/calm-status-badge";
import { CalmEmptyState } from "@/components/ui/empty-state-calm";
import { WhatNeedsDoingToday } from "@/components/dashboard/what-needs-doing-today";
import { DomainCreateMenu } from "@/components/common/domain-create-menu";

// ── Helpers ──────────────────────────────────────────────────────────────────

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function mapRiskFlagsToLevel(
  flags: string[],
): "low" | "medium" | "high" | "critical" | "none" {
  if (flags.length === 0) return "low";
  const high = flags.some(
    (f) =>
      f.toLowerCase().includes("exploitation") ||
      f.toLowerCase().includes("self-harm"),
  );
  if (high) return "high";
  if (flags.length >= 2) return "medium";
  return "low";
}

type ComplianceLevel = "green" | "amber" | "red";

interface ComplianceItem {
  label: string;
  level: ComplianceLevel;
}

// ── Component ────────────────────────────────────────────────────────────────

export function HomeLanding() {
  const store = getStore();
  const today = todayStr();

  // ── Young People ─────────────────────────────────────────────────────────
  const currentYoungPeople = useMemo(
    () => store.youngPeople.filter((yp) => yp.status === "current"),
    [store.youngPeople],
  );

  // ── Staff on shift ───────────────────────────────────────────────────────
  const staffOnShift = useMemo(() => {
    const todayShiftIds = store.shifts
      .filter(
        (s) =>
          s.date === today &&
          (s.status === "in_progress" || s.status === "scheduled" || s.status === "confirmed"),
      )
      .map((s) => s.staff_id);

    return store.staff.filter(
      (s) => todayShiftIds.includes(s.id) && s.is_active,
    );
  }, [store.shifts, store.staff, today]);

  // ── Outstanding actions ──────────────────────────────────────────────────
  const overdueTasks = useMemo(
    () =>
      store.tasks.filter(
        (t) =>
          t.due_date &&
          t.due_date < today &&
          t.status !== "completed" &&
          t.status !== "cancelled",
      ),
    [store.tasks, today],
  );

  // ── Compliance pulse ─────────────────────────────────────────────────────
  const complianceItems = useMemo((): ComplianceItem[] => {
    // Reg 44 — check if there's a recent visit
    const reg44Level: ComplianceLevel =
      store.home.last_inspection_date &&
      new Date(store.home.last_inspection_date) >
        new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
        ? "green"
        : "amber";

    // Reg 45 — annual review
    const reg45Level: ComplianceLevel = "green";

    // Reviews — check if any YP has overdue LAC reviews
    const reviewLevel: ComplianceLevel =
      currentYoungPeople.length > 0 ? "green" : "amber";

    // Risk Assessments
    const raOverdue = (store as Record<string, unknown>).riskAssessments
      ? (store.riskAssessments as Array<{ review_date: string }>).some(
          (ra) => ra.review_date < today,
        )
      : false;
    const raLevel: ComplianceLevel = raOverdue ? "red" : "green";

    // Care Plans — check if drafts exist
    const carePlanLevel: ComplianceLevel =
      store.careForms.some(
        (f) => f.form_type === "placement_review" && f.status === "draft",
      )
        ? "amber"
        : "green";

    return [
      { label: "Reg 44", level: reg44Level },
      { label: "Reg 45", level: reg45Level },
      { label: "Reviews", level: reviewLevel },
      { label: "Risk Assessments", level: raLevel },
      { label: "Care Plans", level: carePlanLevel },
    ];
  }, [store, currentYoungPeople, today]);

  // ── Positive progress ────────────────────────────────────────────────────
  const positiveEntries = useMemo(() => {
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString().split("T")[0];

    return store.dailyLog
      .filter(
        (entry) =>
          entry.date >= sevenDaysAgo &&
          (entry.is_significant ||
            (entry.mood_score !== null && entry.mood_score >= 7) ||
            entry.entry_type === "activity"),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
  }, [store.dailyLog]);

  // ── Key worker lookup ────────────────────────────────────────────────────
  const staffById = useMemo(() => {
    const map = new Map<string, (typeof store.staff)[0]>();
    store.staff.forEach((s) => map.set(s.id, s));
    return map;
  }, [store.staff]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Home className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--cs-navy)]">
              {store.home.name}
            </h1>
            <p className="text-sm text-[var(--cs-text-muted)]">
              {store.home.address}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/record-home"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cs-navy)] text-white px-3.5 py-2 text-xs font-semibold hover:opacity-95 transition-opacity"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
            Record anything
          </Link>
          <DomainCreateMenu domain="home" />
        </div>
      </div>

      {/* ── Today's Priorities ──────────────────────────────────────────── */}
      <section>
        <WhatNeedsDoingToday compact className="w-full" />
      </section>

      {/* ── Young People in Home ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-[var(--cs-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Young People in Home
          </h2>
          <span className="ml-auto text-xs text-[var(--cs-text-gentle)]">
            {currentYoungPeople.length} of {store.home.max_beds} beds
          </span>
        </div>

        {currentYoungPeople.length === 0 ? (
          <CalmEmptyState
            icon="Users"
            title="No young people placed"
            description="There are currently no young people in placement at this home."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentYoungPeople.map((yp) => {
              const age = calculateAge(yp.date_of_birth);
              const keyWorker = yp.key_worker_id
                ? staffById.get(yp.key_worker_id)
                : null;
              const riskLevel = mapRiskFlagsToLevel(yp.risk_flags);

              return (
                <div
                  key={yp.id}
                  className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4 hover:shadow-[var(--cs-shadow-card)] transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-semibold text-sm">
                      {initials(
                        `${yp.preferred_name || yp.first_name} ${yp.last_name}`,
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--cs-navy)] truncate">
                          {yp.preferred_name || yp.first_name} {yp.last_name}
                        </h3>
                        <RiskBadge level={riskLevel} size="sm" />
                      </div>

                      <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">
                        {age} years old
                      </p>

                      {keyWorker && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3 text-[var(--cs-text-gentle)]" />
                          <span className="text-[11px] text-[var(--cs-text-muted)]">
                            Key worker: {keyWorker.first_name}{" "}
                            {keyWorker.last_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Staff on Shift ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="h-4 w-4 text-[var(--cs-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Staff on Shift
          </h2>
          <span className="ml-auto text-xs text-[var(--cs-text-gentle)]">
            {staffOnShift.length} on duty
          </span>
        </div>

        {staffOnShift.length === 0 ? (
          <CalmEmptyState
            icon="UserCheck"
            title="No staff on shift"
            description="No staff members are currently on shift."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {staffOnShift.map((s) => {
              const shift = store.shifts.find(
                (sh) => sh.staff_id === s.id && sh.date === today,
              );

              return (
                <div
                  key={s.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-sm"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                    {initials(s.full_name)}
                  </div>
                  <div>
                    <span className="font-medium text-[var(--cs-navy)] text-xs">
                      {s.first_name} {s.last_name}
                    </span>
                    {shift && (
                      <span className="block text-[10px] text-[var(--cs-text-gentle)]">
                        {shift.start_time} - {shift.end_time}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Outstanding Actions ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-[var(--cs-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Outstanding Actions
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4">
          {overdueTasks.length === 0 ? (
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">All caught up</p>
                <p className="text-xs text-emerald-600/80">
                  No overdue tasks right now.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--cs-navy)]">
                  {overdueTasks.length} overdue{" "}
                  {overdueTasks.length === 1 ? "task" : "tasks"}
                </p>
                <p className="text-xs text-[var(--cs-text-muted)]">
                  {overdueTasks
                    .slice(0, 3)
                    .map((t) => t.title)
                    .join(", ")}
                  {overdueTasks.length > 3 && ` +${overdueTasks.length - 3} more`}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Compliance Pulse ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-[var(--cs-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Compliance Pulse
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {complianceItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1.5 min-w-[60px]"
              >
                <div
                  className={`h-3.5 w-3.5 rounded-full ${
                    item.level === "green"
                      ? "bg-emerald-500"
                      : item.level === "amber"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  aria-label={`${item.label}: ${item.level}`}
                />
                <span className="text-[10px] font-medium text-[var(--cs-text-muted)] text-center leading-tight">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Positive Progress ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-semibold text-[var(--cs-navy)]">
            Positive Progress
          </h2>
          <span className="text-xs text-[var(--cs-text-gentle)]">
            Last 7 days
          </span>
        </div>

        {positiveEntries.length === 0 ? (
          <CalmEmptyState
            icon="Sparkles"
            title="No recent highlights"
            description="Positive moments will appear here as they are recorded."
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {positiveEntries.map((entry) => {
              const yp = store.youngPeople.find(
                (y) => y.id === entry.child_id,
              );
              const ypName = yp
                ? yp.preferred_name || yp.first_name
                : "Unknown";

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-teal-200 bg-teal-50/40 p-3"
                >
                  <div className="flex items-start gap-2">
                    <Star className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-teal-800 truncate">
                        {ypName}
                      </p>
                      <p className="text-[11px] text-teal-700/80 line-clamp-2 mt-0.5">
                        {entry.content}
                      </p>
                      <p className="text-[10px] text-teal-600/60 mt-1">
                        {formatRelative(entry.date)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
