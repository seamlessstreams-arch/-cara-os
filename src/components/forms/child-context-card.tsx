"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD CONTEXT CARD
// Compact read-only card shown at the top of any child-related form.
// Pulls data from RecordOnce context so nothing needs re-entering.
// CHR 2015 Reg 12 — Evidence that care is informed by the child's plan.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Shield,
  Target,
  User,
  Users,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { useRecordOnce } from "@/contexts/record-once-context";

// ── Risk level badge styling ─────────────────────────────────────────────────

const RISK_BADGE: Record<string, { variant: "destructive" | "warning" | "success" | "info" | "secondary"; label: string }> = {
  very_high: { variant: "destructive", label: "Very High Risk" },
  high: { variant: "destructive", label: "High Risk" },
  medium: { variant: "warning", label: "Medium Risk" },
  low: { variant: "success", label: "Low Risk" },
  unknown: { variant: "secondary", label: "Not Assessed" },
};

// ── Goal status styling ──────────────────────────────────────────────────────

const GOAL_STATUS_STYLE: Record<string, string> = {
  on_track: "text-emerald-700 bg-emerald-50",
  in_progress: "text-blue-700 bg-blue-50",
  attention_needed: "text-amber-700 bg-amber-50",
  not_started: "text-slate-500 bg-slate-50",
};

// ── Component ────────────────────────────────────────────────────────────────

interface ChildContextCardProps {
  defaultExpanded?: boolean;
  className?: string;
}

export function ChildContextCard({
  defaultExpanded = true,
  className,
}: ChildContextCardProps) {
  const { child, isLoading } = useRecordOnce();
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading child context...
        </div>
      </div>
    );
  }

  if (!child) return null;

  const risk = RISK_BADGE[child.currentRiskLevel] ?? RISK_BADGE.unknown;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)]",
        "shadow-[var(--cs-shadow-soft)] transition-all duration-200",
        className,
      )}
    >
      {/* ── Header (always visible) ──────────────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--cs-surface)] rounded-2xl transition-colors"
      >
        {/* Photo placeholder */}
        <div className="shrink-0 h-10 w-10 rounded-full bg-[var(--cs-surface)] border border-[var(--cs-border)] flex items-center justify-center overflow-hidden">
          {child.photoUrl ? (
            <Image
              src={child.photoUrl}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-[var(--cs-text-gentle)]" />
          )}
        </div>

        {/* Name + age */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--cs-navy)] truncate">
              {child.childName}
            </h3>
            <span className="text-xs text-[var(--cs-text-muted)] shrink-0">
              Age {child.age}
            </span>
          </div>
          <p className="text-xs text-[var(--cs-text-muted)] truncate">
            {child.homeName} &middot; {child.placementType}
          </p>
        </div>

        {/* Risk badge */}
        <Badge variant={risk.variant} className="shrink-0">
          {risk.label}
        </Badge>

        {/* Chevron */}
        <div className="shrink-0 text-[var(--cs-text-muted)]">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* ── Expanded content ─────────────────────────────────────────── */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 animate-[gentleFadeUp_0.2s_ease-out]">
          <div className="border-t border-[var(--cs-border-subtle)] pt-3 space-y-3">
            {/* Key professionals */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-[var(--cs-text-muted)] flex items-center gap-1">
                  <Users className="h-3 w-3" /> Key Worker
                </span>
                <p className="font-medium text-[var(--cs-navy)] mt-0.5">
                  {child.keyWorkerName ?? "Not assigned"}
                </p>
              </div>
              <div>
                <span className="text-[var(--cs-text-muted)] flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Social Worker
                </span>
                <p className="font-medium text-[var(--cs-navy)] mt-0.5">
                  {child.socialWorkerName}
                </p>
              </div>
            </div>

            {/* Active care plan goals */}
            {child.activeGoals.length > 0 && (
              <div>
                <p className="text-xs text-[var(--cs-text-muted)] flex items-center gap-1 mb-1.5">
                  <Target className="h-3 w-3" />
                  Active Care Plan Goals ({child.activeGoals.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {child.activeGoals.slice(0, 5).map((goal) => (
                    <span
                      key={goal.id}
                      className={cn(
                        "inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium",
                        GOAL_STATUS_STYLE[goal.status] ?? GOAL_STATUS_STYLE.not_started,
                      )}
                    >
                      {goal.title}
                    </span>
                  ))}
                  {child.activeGoals.length > 5 && (
                    <span className="text-[11px] text-[var(--cs-text-muted)] self-center">
                      +{child.activeGoals.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Known triggers */}
            {child.knownTriggers.length > 0 && (
              <div>
                <p className="text-xs text-[var(--cs-text-muted)] flex items-center gap-1 mb-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Known Triggers
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {child.knownTriggers.map((trigger, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                    >
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Next review + link */}
            <div className="flex items-center justify-between pt-1">
              {child.nextReviewDate && (
                <p className="text-xs text-[var(--cs-text-muted)] flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Next review: {formatRelative(child.nextReviewDate)} ({formatDate(child.nextReviewDate)})
                </p>
              )}
              <Link
                href={`/young-people/${child.childId}`}
                className="text-xs text-[var(--cs-info)] hover:underline flex items-center gap-1 ml-auto"
              >
                Full profile <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
