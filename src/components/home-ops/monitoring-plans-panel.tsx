"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — INDIVIDUAL MONITORING PLANS PANEL (Phase 5 · Home-Ops · Module 4)
//
// Surfaces the M3 board where staff work. Read-only — plans are created/ended
// through the write API (flag-gated + validator-gated), never from this panel.
// `compact` shows only the RESTRICTIVE plans (what incoming shift staff must
// know); full shows every active plan + the children-without-plan count.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMonitoringBoard } from "@/hooks/use-monitoring-plans";
import type { MonitoringBoard } from "@/hooks/use-monitoring-plans";
import { Eye, Loader2, ArrowRight, CalendarClock, AlertTriangle, Users, Moon, Info } from "lucide-react";

type Row = MonitoringBoard["rows"][number];

function fmtDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function LevelBadge({ r }: { r: Row }) {
  const label =
    r.observation_level === "intermittent" && r.check_frequency_minutes
      ? `${r.level_label} · ${r.check_frequency_minutes} min`
      : r.level_label;
  return (
    <Badge variant={r.is_restrictive ? "warning" : "secondary"} className="shrink-0 gap-1">
      <Eye className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function PlanLine({ r }: { r: Row }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <Link href={`/young-people/${r.child_id}`} className="text-sm font-medium text-[var(--cs-text)] hover:underline">
          {r.child_name}
        </Link>
        <p className="text-xs text-[var(--cs-text-muted)]">{r.rationale || "No rationale recorded"}</p>
        <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">
          <CalendarClock className="mr-1 inline h-3 w-3 align-[-2px]" />
          Review {fmtDate(r.review_date)}
          {r.review_overdue ? (
            <span className="ml-1 font-medium text-[var(--cs-risk)]">overdue</span>
          ) : null}
          {" · "}agreed by {r.agreed_by}
          {r.night_provision_note ? (
            <span className="text-[var(--cs-text-gentle)]">
              {" "}· <Moon className="inline h-3 w-3 align-[-2px]" /> {r.night_provision_note}
            </span>
          ) : null}
        </p>
      </div>
      <LevelBadge r={r} />
    </div>
  );
}

export function MonitoringPlansPanel({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { data, isLoading } = useMonitoringBoard();
  const shell = cn("rounded-2xl border border-[var(--cs-border)] bg-white p-4", className);

  if (isLoading || !data) {
    return (
      <div className={shell}>
        <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading monitoring plans…
        </div>
      </div>
    );
  }

  const board = data.data;
  const restrictive = board.rows.filter((r) => r.is_restrictive);
  const shown = compact ? restrictive : board.rows;

  return (
    <div className={cn(shell, board.reviews_overdue > 0 && "border-l-4 border-l-[var(--cs-risk)]")}>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)]">
        <Eye className="h-4 w-4" />
        Monitoring Plans
      </p>
      <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">
        Standing observation levels — a human decision, recorded with the child's views. Nights follow the night-check plan.
      </p>

      {/* Summary chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={restrictive.length > 0 ? "warning" : "outline"} className="gap-1">
          <Eye className="h-3 w-3" /> {restrictive.length} restrictive
        </Badge>
        <Badge variant={board.reviews_overdue > 0 ? "destructive" : "outline"} className="gap-1">
          <AlertTriangle className="h-3 w-3" /> {board.reviews_overdue} review{board.reviews_overdue === 1 ? "" : "s"} overdue
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" /> {board.children_without_plan} without a plan
        </Badge>
      </div>

      {/* Body */}
      {board.active_plans === 0 ? (
        <p className="mt-3 text-sm text-[var(--cs-text-muted)]">
          No active monitoring plans. Children without a plan follow the normal home routine — no level is assumed.
        </p>
      ) : compact && restrictive.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--cs-text-muted)]">
          No restrictive observation levels in place right now.
        </p>
      ) : (
        <div className="mt-2 divide-y divide-[var(--cs-border)] border-t border-[var(--cs-border)]">
          {shown.map((r) => (
            <PlanLine key={r.plan_id} r={r} />
          ))}
        </div>
      )}

      {compact ? (
        <Link
          href="/monitoring-plans"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--cs-navy)] hover:underline"
        >
          View all plans <ArrowRight className="h-3 w-3" />
        </Link>
      ) : (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[var(--cs-text-gentle)]">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Plans are created and ended through the governed write path (restriction acknowledged, rationale, the
          child's views, review within 28 days) — Cara never sets a level itself.
        </p>
      )}
    </div>
  );
}
