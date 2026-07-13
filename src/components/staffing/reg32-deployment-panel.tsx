"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 32 DEPLOYMENT-SUITABILITY PANEL (Phase 4 · Workforce · Module 2)
//
// Surfaces the M1 read-only board where managers actually work. It never changes
// the rota — it advises. `compact` shows only what needs a manager's eye (the
// flagged shifts) for embedding on Safe Staffing; full shows the whole board.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SHIFT_TYPE_LABELS } from "@/lib/constants";
import { useReg32Deployment } from "@/hooks/use-reg32-deployment";
import type { Reg32DeploymentBoard } from "@/hooks/use-reg32-deployment";
import { ShieldCheck, Ban, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

type ShiftRow = Reg32DeploymentBoard["shifts"][number];
type Suitability = ShiftRow["suitability"];

const SUIT: Record<Suitability, { variant: "destructive" | "warning" | "success"; label: string; Icon: typeof Ban }> = {
  unsuitable:            { variant: "destructive", label: "Unsuitable", Icon: Ban },
  deploy_with_attention: { variant: "warning",     label: "Attention",  Icon: AlertTriangle },
  suitable:              { variant: "success",      label: "Cleared",    Icon: CheckCircle2 },
};

function fmtDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function shiftLabel(t: string): string {
  return (SHIFT_TYPE_LABELS as Record<string, string>)[t] ?? t;
}

function ShiftLine({ s }: { s: ShiftRow }) {
  const cfg = SUIT[s.suitability];
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <Link href={`/staff/${s.staff_id}`} className="text-sm font-medium text-[var(--cs-text)] hover:underline">
          {s.staff_name}
        </Link>
        <p className="text-xs text-[var(--cs-text-muted)]">
          {fmtDate(s.date)} · {shiftLabel(s.shift_type)}
          {s.suitability !== "suitable" && s.reasons.length > 0 ? (
            <span className="text-[var(--cs-text-secondary)]"> — {s.reasons.join("; ")}</span>
          ) : null}
        </p>
      </div>
      <Badge variant={cfg.variant} className="shrink-0 gap-1">
        <cfg.Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    </div>
  );
}

export function Reg32DeploymentPanel({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { data, isLoading } = useReg32Deployment();

  const shell = cn("rounded-2xl border border-[var(--cs-border)] bg-white p-4", className);

  if (isLoading || !data) {
    return (
      <div className={shell}>
        <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking deployment suitability…
        </div>
      </div>
    );
  }

  const board = data.data;
  const flagged = board.shifts.filter((s) => s.suitability !== "suitable");
  const shown = compact ? flagged.slice(0, 5) : board.shifts;
  const overflow = compact ? flagged.length - shown.length : 0;

  return (
    <div className={shell}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)]">
            <ShieldCheck className="h-4 w-4" />
            Deployment Suitability · Reg 32
          </p>
          <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">
            Is everyone on the rota fit to be deployed? {board.assessed} shift{board.assessed === 1 ? "" : "s"} checked
            {board.unassigned > 0 ? ` · ${board.unassigned} open` : ""}. Advisory — never changes the rota.
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={board.summary.unsuitable > 0 ? "destructive" : "outline"} className="gap-1">
          <Ban className="h-3 w-3" /> {board.summary.unsuitable} unsuitable
        </Badge>
        <Badge variant={board.summary.deploy_with_attention > 0 ? "warning" : "outline"} className="gap-1">
          <AlertTriangle className="h-3 w-3" /> {board.summary.deploy_with_attention} attention
        </Badge>
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" /> {board.summary.suitable} cleared
        </Badge>
      </div>

      {/* Body */}
      {board.assessed === 0 ? (
        <p className="mt-3 text-sm text-[var(--cs-text-muted)]">No upcoming assigned shifts to check in this window.</p>
      ) : compact && flagged.length === 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--cs-success)]">
          <CheckCircle2 className="h-4 w-4" /> All {board.assessed} rostered staff are cleared to deploy.
        </p>
      ) : (
        <div className="mt-2 divide-y divide-[var(--cs-border)] border-t border-[var(--cs-border)]">
          {shown.map((s) => (
            <ShiftLine key={s.shift_id} s={s} />
          ))}
        </div>
      )}

      {/* Footer link */}
      {compact ? (
        overflow > 0 || board.assessed > 0 ? (
          <Link
            href="/intelligence/cara/reg32-deployment"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--cs-navy)] hover:underline"
          >
            {overflow > 0 ? `+${overflow} more · view full board` : "View full board"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ) : null
      ) : (
        <Link
          href="/staff-compliance"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--cs-navy)] hover:underline"
        >
          Open Staff Compliance <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
