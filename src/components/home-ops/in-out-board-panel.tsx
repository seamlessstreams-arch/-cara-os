"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD IN-OUT BOARD PANEL (Phase 5 · Home-Ops · Module 2)
//
// Surfaces the M1 whereabouts board where staff work. Read-only. `compact` shows
// the summary + only the children who are NOT simply in (for embedding on the
// Safe Staffing screen); full shows every child. The engine's honesty caveat
// (expected whereabouts, not a sign-out register) is rendered verbatim.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWhereabouts } from "@/hooks/use-whereabouts";
import type { InOutBoard } from "@/hooks/use-whereabouts";
import {
  Home, DoorOpen, Siren, Loader2, ArrowRight, Clock, MapPin, Info,
} from "lucide-react";

type Child = InOutBoard["children"][number];

function fmtClock(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function StateBadge({ c }: { c: Child }) {
  if (c.state === "missing") {
    return (
      <Badge variant="destructive" className="shrink-0 gap-1">
        <Siren className="h-3 w-3" /> Missing
      </Badge>
    );
  }
  if (c.state === "out") {
    return (
      <Badge variant="warning" className="shrink-0 gap-1">
        <DoorOpen className="h-3 w-3" /> Out{c.expected_back ? ` · back ${fmtClock(c.expected_back)}` : ""}
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="shrink-0 gap-1">
      <Home className="h-3 w-3" /> In
    </Badge>
  );
}

function ChildLine({ c }: { c: Child }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <Link href={`/young-people/${c.child_id}`} className="text-sm font-medium text-[var(--cs-text)] hover:underline">
          {c.name}
        </Link>
        <p className="text-xs text-[var(--cs-text-muted)]">
          {c.detail}
          {c.location ? (
            <span className="text-[var(--cs-text-secondary)]">
              {" "}· <MapPin className="inline h-3 w-3 align-[-2px]" /> {c.location}
            </span>
          ) : null}
          {c.state !== "in" && c.since ? (
            <span className="text-[var(--cs-text-secondary)]">
              {" "}· <Clock className="inline h-3 w-3 align-[-2px]" /> since {fmtClock(c.since)}
            </span>
          ) : null}
        </p>
      </div>
      <StateBadge c={c} />
    </div>
  );
}

export function InOutBoardPanel({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { data, isLoading } = useWhereabouts();
  const shell = cn("rounded-2xl border border-[var(--cs-border)] bg-white p-4", className);

  if (isLoading || !data) {
    return (
      <div className={shell}>
        <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking who's in and out…
        </div>
      </div>
    );
  }

  const board = data.data;
  const notIn = board.children.filter((c) => c.state !== "in");
  const shown = compact ? notIn : board.children;
  const anyMissing = board.summary.missing > 0;

  return (
    <div className={cn(shell, anyMissing && "border-l-4 border-l-[var(--cs-risk)]")}>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)]">
        <DoorOpen className="h-4 w-4" />
        In &amp; Out Board
      </p>

      {/* Summary chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={anyMissing ? "destructive" : "outline"} className="gap-1">
          <Siren className="h-3 w-3" /> {board.summary.missing} missing
        </Badge>
        <Badge variant={board.summary.out > 0 ? "warning" : "outline"} className="gap-1">
          <DoorOpen className="h-3 w-3" /> {board.summary.out} out
        </Badge>
        <Badge variant="success" className="gap-1">
          <Home className="h-3 w-3" /> {board.summary.in} in
        </Badge>
      </div>

      {/* Body */}
      {board.summary.total === 0 ? (
        <p className="mt-3 text-sm text-[var(--cs-text-muted)]">No current young people to board.</p>
      ) : compact && notIn.length === 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--cs-success)]">
          <Home className="h-4 w-4" /> Everyone is in — all {board.summary.total} young people at home.
        </p>
      ) : (
        <div className="mt-2 divide-y divide-[var(--cs-border)] border-t border-[var(--cs-border)]">
          {shown.map((c) => (
            <ChildLine key={c.child_id} c={c} />
          ))}
        </div>
      )}

      {/* Honesty caveat, verbatim from the engine */}
      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[var(--cs-text-gentle)]">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        {board.as_of_note}
      </p>

      {compact ? (
        <Link
          href="/in-out-board"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--cs-navy)] hover:underline"
        >
          View full board <ArrowRight className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}
