"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraShiftSafety
//
// Dashboard widget showing real-time shift safety status.
// Consumes /api/cara/shift-safety and displays signals prioritised by severity.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Loader2, ShieldCheck, ShieldAlert, ShieldX,
  ChevronDown, ChevronUp, RefreshCw, Sparkles, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface SafetySignal {
  id: string;
  severity: "critical" | "high" | "medium" | "advisory";
  category: string;
  title: string;
  description: string;
  regulation?: string;
  action: string;
  affectsChildren?: string[];
}

interface ShiftSafetyData {
  shiftType: string;
  checkedAt: string;
  overallRisk: "safe" | "concerns" | "unsafe";
  signals: SafetySignal[];
  staffChildRatio: string;
  compliance: { met: number; total: number };
  summary: string;
}

// ── Severity config ─────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { dot: string; text: string; bg: string }> = {
  critical: { dot: "bg-red-600", text: "text-red-700", bg: "bg-red-50" },
  high: { dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
  medium: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  advisory: { dot: "bg-blue-400", text: "text-blue-600", bg: "bg-blue-50" },
};

const RISK_CONFIG: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  safe: { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Safe", bg: "bg-emerald-50", text: "text-emerald-700" },
  concerns: { icon: <ShieldAlert className="h-3.5 w-3.5" />, label: "Concerns", bg: "bg-amber-50", text: "text-amber-700" },
  unsafe: { icon: <ShieldX className="h-3.5 w-3.5" />, label: "Unsafe", bg: "bg-red-50", text: "text-red-700" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function CaraShiftSafety({ homeId = "home_oak" }: { homeId?: string }) {
  const [data, setData] = useState<ShiftSafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  async function fetchSafety() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cara/shift-safety?homeId=${homeId}`);
      const json = await res.json();
      if (json.ok && json.data) setData(json.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSafety();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cs-cara-gold)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">Checking shift safety...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const riskCfg = RISK_CONFIG[data.overallRisk];
  const criticalSignals = data.signals.filter((s) => s.severity === "critical");
  const highSignals = data.signals.filter((s) => s.severity === "high");
  const otherSignals = data.signals.filter((s) => s.severity !== "critical" && s.severity !== "high");

  const urgentSignals = [...criticalSignals, ...highSignals];
  const displaySignals = expanded ? data.signals : urgentSignals.slice(0, 4);

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-[var(--cs-navy)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Shift Safety</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">
                {data.shiftType.replace("_", " ")} shift — ratio {data.staffChildRatio}
              </p>
            </div>
          </div>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", riskCfg.bg, riskCfg.text)}>
            {riskCfg.icon}
            {riskCfg.label}
          </div>
        </div>
      </div>

      {/* Compliance bar */}
      <div className="px-5 py-2.5 border-b border-[var(--cs-border)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", data.overallRisk === "safe" ? "bg-emerald-500" : data.overallRisk === "concerns" ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${(data.compliance.met / data.compliance.total) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-[var(--cs-text-secondary)] tabular-nums">
            {data.compliance.met}/{data.compliance.total}
          </span>
        </div>
        <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">{data.summary}</p>
      </div>

      {/* Signals */}
      {displaySignals.length > 0 && (
        <div className="divide-y divide-[var(--cs-border)]">
          {displaySignals.map((signal) => {
            const cfg = SEVERITY_CONFIG[signal.severity] ?? SEVERITY_CONFIG.advisory;
            return (
              <div key={signal.id} className="px-5 py-2.5">
                <div className="flex items-start gap-2">
                  <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1", cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--cs-navy)]">{signal.title}</span>
                      {signal.regulation && (
                        <span className="text-[9px] text-[var(--cs-text-gentle)] shrink-0">{signal.regulation}</span>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5 mt-1">
                      <Sparkles className="h-2.5 w-2.5 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
                      <span className="text-[10px] text-[var(--cs-text-secondary)]">{signal.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No signals */}
      {data.signals.length === 0 && (
        <div className="px-5 py-4 text-center">
          <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-xs text-emerald-700 font-medium">All clear</p>
          <p className="text-[10px] text-[var(--cs-text-muted)]">No safety concerns for this shift</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-2 border-t border-[var(--cs-border)] flex items-center justify-between">
        {otherSignals.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-[10px] gap-1 h-7">
            {expanded ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>+{otherSignals.length} more <ChevronDown className="h-3 w-3" /></>}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={fetchSafety} className="text-[10px] gap-1 h-7 ml-auto">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>
    </div>
  );
}
