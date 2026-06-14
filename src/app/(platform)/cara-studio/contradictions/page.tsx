"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — CONTRADICTIONS
//
// Cross-record conflict detection. Surfaces cases where different evidence
// sources disagree — different risk levels, conflicting descriptions, etc.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertOctagon, Search, CheckCircle2, AlertTriangle,
  Sparkles, Eye, Clock, XCircle,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface Contradiction {
  id: string;
  type: string;
  title: string;
  description: string;
  sourceA: string;
  sourceB: string;
  severity: "high" | "medium" | "low";
  status: "unresolved" | "resolved" | "acknowledged";
  detectedAt: string;
  resolvedAt: string | null;
  childName: string | null;
}

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_CONTRADICTIONS: Contradiction[] = [
  {
    id: "con-1", type: "risk_level_mismatch", title: "Risk Level Discrepancy — Amara",
    description: "The most recent daily log describes Amara as 'settled and calm' but the risk assessment from the same week rates self-harm risk as 'high'. These may both be accurate at different moments, but the discrepancy needs professional review.",
    sourceA: "Daily Log — 10 May", sourceB: "Risk Assessment — 8 May",
    severity: "high", status: "unresolved", detectedAt: "2026-05-11T08:00:00Z", resolvedAt: null, childName: "Amara",
  },
  {
    id: "con-2", type: "behaviour_description_conflict", title: "Behavioural Description Conflict — Reuben",
    description: "Staff member A recorded 'unprovoked aggression' while staff member B recorded the same event as 'defensive response after being startled'. The framing significantly impacts the understanding of the behaviour.",
    sourceA: "Incident Report — Staff A", sourceB: "Incident Report — Staff B",
    severity: "medium", status: "unresolved", detectedAt: "2026-05-10T14:00:00Z", resolvedAt: null, childName: "Reuben",
  },
  {
    id: "con-3", type: "risk_level_mismatch", title: "Contact Risk Assessment vs Observation — Jayden",
    description: "Contact risk assessment states supervised contact only, but the contact log records an unsupervised phone call. This may be an admin error or a recent change not yet reflected in the assessment.",
    sourceA: "Contact Risk Assessment", sourceB: "Contact Log — 4 May",
    severity: "medium", status: "acknowledged", detectedAt: "2026-05-05T10:00:00Z", resolvedAt: null, childName: "Jayden",
  },
  {
    id: "con-4", type: "behaviour_description_conflict", title: "Sleep Pattern Report — Jayden",
    description: "Night staff report 'slept through the night' but the young person told key worker 'I couldn't sleep at all'. Both perspectives may have validity but the discrepancy should be explored.",
    sourceA: "Night Log — 9 May", sourceB: "Key Work Session — 10 May",
    severity: "low", status: "resolved", detectedAt: "2026-05-10T11:00:00Z", resolvedAt: "2026-05-11T09:00:00Z", childName: "Jayden",
  },
];

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-600 border-blue-200",
};

const STATUS_STYLES: Record<string, string> = {
  unresolved: "bg-red-50 text-red-700 border-red-200",
  acknowledged: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function ContradictionsPage() {
  const [items] = useState<Contradiction[]>(DEMO_CONTRADICTIONS);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = items.filter((c) => !statusFilter || c.status === statusFilter);
  const unresolved = items.filter((c) => c.status === "unresolved").length;
  const high = items.filter((c) => c.severity === "high" && c.status !== "resolved").length;

  return (
    <PageShell title="Contradictions" subtitle="Cross-record conflict detection">
      <div className="space-y-6 pb-12">

        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <AlertOctagon className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Contradictions</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Cara detects where evidence sources disagree — different risk levels, conflicting behavioural descriptions, or mismatched observations.
              </p>
            </div>
            {unresolved > 0 && <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200">{unresolved} unresolved</Badge>}
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <div className={cn("rounded-xl border p-4", unresolved > 0 ? "border-red-200 bg-red-50" : "border-[var(--cs-border)] bg-white")}>
            <p className={cn("text-2xl font-bold", unresolved > 0 ? "text-red-700" : "text-[var(--cs-navy)]")}>{unresolved}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Unresolved</p>
          </div>
          <div className={cn("rounded-xl border p-4", high > 0 ? "border-red-200 bg-red-50" : "border-[var(--cs-border)] bg-white")}>
            <p className={cn("text-2xl font-bold", high > 0 ? "text-red-700" : "text-[var(--cs-navy)]")}>{high}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">High Severity</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-2xl font-bold text-emerald-700">{items.filter((c) => c.status === "resolved").length}</p>
            <p className="text-[10px] text-emerald-600 uppercase tracking-wide mt-1">Resolved</p>
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {["unresolved", "acknowledged", "resolved"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === s ? "ring-1 ring-[var(--cs-cara-gold-soft)]" : "", STATUS_STYLES[s])}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({items.filter((c) => c.status === s).length})
            </button>
          ))}
        </div>

        {/* ── Contradiction list ───────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((con) => (
            <div key={con.id} className={cn("rounded-xl border bg-white p-5 space-y-3", con.status === "unresolved" && con.severity === "high" ? "border-red-200" : "border-[var(--cs-border)]")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--cs-navy)]">{con.title}</span>
                    <Badge className={cn("text-[9px] border", SEVERITY_STYLES[con.severity])}>{con.severity}</Badge>
                    <Badge className={cn("text-[9px] border", STATUS_STYLES[con.status])}>{con.status}</Badge>
                  </div>
                  {con.childName && <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{con.childName}</p>}
                </div>
                <span className="text-[10px] text-[var(--cs-text-muted)] shrink-0">{new Date(con.detectedAt).toLocaleDateString("en-GB")}</span>
              </div>
              <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{con.description}</p>
              <div className="flex items-center gap-4 text-[10px] text-[var(--cs-text-muted)]">
                <span>Source A: {con.sourceA}</span>
                <span>Source B: {con.sourceB}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
