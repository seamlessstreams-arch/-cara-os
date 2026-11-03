"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraReg45Evidence
//
// Regulation 45 requires Registered Managers to produce a monthly report
// covering safeguarding, complaints, significant events, medication errors,
// staffing, education, and quality of care. This widget links to Cara's
// automatic Reg 45 evidence collection.
//
// NB: this component previously rendered a hardcoded demo Reg 45 summary
// (fictional children and fabricated gaps) unconditionally — which surfaced on
// the live tenant as evidence about children who are not resident. Fabricated
// records must never appear on a live care-record system, so the demo generator
// has been removed. The widget
// takes no Reg 45 data source of its own, so it renders an honest empty state
// and points to the full Reg 45 report where real evidence is built.
//
// Usage:
//   <CaraReg45Evidence homeId="demo-home" />
// ══════════════════════════════════════════════════════════════════════════════

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Scale, ChevronRight, Sparkles } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type EvidenceStatus = "complete" | "partial" | "missing" | "not_applicable";

// ── Config ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EvidenceStatus, { label: string; colour: string; bg: string; dot: string }> = {
  complete:       { label: "Complete",       colour: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  partial:        { label: "Partial",        colour: "text-amber-700",   bg: "bg-amber-50",   dot: "bg-amber-500" },
  missing:        { label: "Missing",        colour: "text-red-700",     bg: "bg-red-50",     dot: "bg-red-500" },
  not_applicable: { label: "N/A",            colour: "text-slate-500",   bg: "bg-slate-50",   dot: "bg-slate-400" },
};

// ── Component ──────────────────────────────────────────────────────────────

interface CaraReg45EvidenceProps {
  homeId?: string;
  className?: string;
}

export function CaraReg45Evidence({
  className,
}: CaraReg45EvidenceProps) {
  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden", className)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-bold text-[var(--cs-navy)]">
            Reg 45 Evidence
          </h3>
        </div>
        <Link
          href="/cara/reg45"
          className="text-[10px] font-medium text-[var(--cs-cara-gold)] hover:text-[var(--cs-navy)] transition-colors flex items-center gap-0.5"
        >
          Full report <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Honest empty state — no fabricated evidence is ever shown here */}
      <div className="px-5 pb-5">
        <div className="rounded-lg border border-dashed border-[var(--cs-border)] bg-slate-50 p-6 text-center">
          <Scale className="h-5 w-5 text-[var(--cs-text-muted)] mx-auto mb-2" />
          <p className="text-sm font-medium text-[var(--cs-text-secondary)]">
            No Reg 45 evidence recorded yet
          </p>
          <p className="text-[11px] text-[var(--cs-text-muted)] mt-1">
            As records are logged across the home, Cara collects Regulation 45
            evidence here. Open the full report to review and build this
            month&apos;s evidence.
          </p>
        </div>
      </div>

      {/* Cara note */}
      <div className="px-5 py-2 bg-[var(--cs-cara-gold-bg)] text-[9px] text-[var(--cs-text-muted)] flex items-center gap-1">
        <Sparkles className="h-2.5 w-2.5 text-[var(--cs-cara-gold)]" />
        Cara automatically collects evidence from daily operations as records are logged.
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────
// Config-only — no demo/sample data is exported.

export const _testing = { STATUS_CONFIG };
