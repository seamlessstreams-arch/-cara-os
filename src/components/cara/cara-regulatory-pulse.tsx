"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraRegulatoryPulse
//
// Dashboard widget showing real-time regulatory compliance status.
// Maps home performance to specific CHR 2015 regulations and SCCIF areas.
// Gives the RM an at-a-glance "am I inspection-ready?" view.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Sparkles, Shield, AlertTriangle, CheckCircle2, Clock,
  Loader2, ChevronDown, ChevronUp, Scale, Calendar,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type ComplianceStatus = "green" | "amber" | "red";

interface RegulationCheck {
  regulation: string;
  description: string;
  status: ComplianceStatus;
  score: number;
  detail: string;
  actionRequired?: string;
  sccifArea?: string;
}

interface RegulatoryPulse {
  date: string;
  homeId: string;
  overallScore: number;
  overallStatus: ComplianceStatus;
  checks: RegulationCheck[];
  strengths: string[];
  areasForImprovement: string[];
  nextDeadlines: { deadline: string; description: string; daysUntil: number }[];
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; bg: string; text: string; bar: string }> = {
  green: { label: "Compliant", bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  amber: { label: "Attention", bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  red:   { label: "Action Needed", bg: "bg-red-50", text: "text-red-700", bar: "bg-red-500" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function CaraRegulatoryPulse({ homeId = "home_oak" }: { homeId?: string }) {
  const [pulse, setPulse] = useState<RegulatoryPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  async function fetchPulse() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cara/regulatory-pulse?homeId=${homeId}`);
      const json = await res.json();
      if (json.ok && json.data) setPulse(json.data);
    } catch {
      // Silent fail — widget is optional
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cs-cara-gold)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">Loading regulatory pulse...</span>
        </div>
      </div>
    );
  }

  if (!pulse) return null;

  const cfg = STATUS_CONFIG[pulse.overallStatus];
  const amberRedChecks = pulse.checks.filter((c) => c.status !== "green");
  const greenChecks = pulse.checks.filter((c) => c.status === "green");

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Scale className="h-4 w-4 text-[var(--cs-navy)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Regulatory Pulse</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">CHR 2015 compliance this week</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", cfg.bg, cfg.text)}>
              {pulse.overallStatus === "green" ? <CheckCircle2 className="h-3.5 w-3.5" /> : pulse.overallStatus === "amber" ? <Clock className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {pulse.overallScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Overall bar */}
      <div className="px-5 py-3 border-b border-[var(--cs-border)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", cfg.bar)}
              style={{ width: `${pulse.overallScore}%` }}
            />
          </div>
          <span className="text-xs font-medium text-[var(--cs-text-secondary)] tabular-nums w-10 text-right">
            {pulse.overallScore}%
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-[var(--cs-text-gentle)]">
            {pulse.checks.filter((c) => c.status === "green").length}/{pulse.checks.length} regulations green
          </span>
          {amberRedChecks.length > 0 && (
            <span className="text-[10px] text-amber-600 font-medium">
              {amberRedChecks.length} need{amberRedChecks.length === 1 ? "s" : ""} attention
            </span>
          )}
        </div>
      </div>

      {/* Amber/Red items (always visible) */}
      {amberRedChecks.length > 0 && (
        <div className="divide-y divide-[var(--cs-border)]">
          {amberRedChecks.map((check, i) => {
            const sCfg = STATUS_CONFIG[check.status];
            return (
              <div key={i} className="px-5 py-2.5">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", sCfg.bar)} />
                  <span className="text-xs font-medium text-[var(--cs-navy)]">{check.regulation}</span>
                  <span className={cn("text-[10px] font-medium tabular-nums", sCfg.text)}>{check.score}%</span>
                </div>
                {check.actionRequired && (
                  <div className="mt-1 ml-4 flex items-start gap-1.5">
                    <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
                    <span className="text-[10px] text-[var(--cs-text-secondary)]">{check.actionRequired}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Expand to see all */}
      {expanded && (
        <div className="border-t border-[var(--cs-border)] divide-y divide-[var(--cs-border)]">
          {greenChecks.map((check, i) => (
            <div key={i} className="px-5 py-2 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="text-[11px] text-[var(--cs-text-secondary)]">{check.regulation}</span>
              <span className="text-[10px] text-emerald-600 font-medium tabular-nums ml-auto">{check.score}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Deadlines */}
      {pulse.nextDeadlines.length > 0 && (
        <div className="px-5 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
          <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase mb-1">Upcoming</div>
          <div className="space-y-1">
            {pulse.nextDeadlines.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <Calendar className="h-3 w-3 text-[var(--cs-text-gentle)]" />
                <span className="text-[var(--cs-text-secondary)]">{d.description}</span>
                <span className={cn("ml-auto font-medium tabular-nums", d.daysUntil <= 3 ? "text-red-600" : d.daysUntil <= 7 ? "text-amber-600" : "text-[var(--cs-text-muted)]")}>
                  {d.daysUntil}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-2 border-t border-[var(--cs-border)] flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-[10px] gap-1 h-7">
          {expanded ? <>Hide green <ChevronUp className="h-3 w-3" /></> : <>Show all {pulse.checks.length} <ChevronDown className="h-3 w-3" /></>}
        </Button>
        <Button variant="ghost" size="sm" onClick={fetchPulse} className="text-[10px] gap-1 h-7">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>
    </div>
  );
}
