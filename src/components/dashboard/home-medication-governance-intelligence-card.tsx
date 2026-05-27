"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEDICATION GOVERNANCE INTELLIGENCE CARD
// Medication audits, error investigations, near misses, stock checks,
// storage audits, and emergency medication protocols.
// CHR 2015 Reg 12: Medication management.
// NICE guidelines on safe medication practices in children's homes.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Pill,
  ShieldCheck, ClipboardCheck, Thermometer, Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeMedicationGovernanceIntelligence } from "@/hooks/use-home-medication-governance-intelligence";
import type { MedicationGovernanceRating } from "@/lib/engines/home-medication-governance-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<MedicationGovernanceRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeMedicationGovernanceIntelligenceCard() {
  const { data, isLoading } = useHomeMedicationGovernanceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const ratingStyle = RATING_STYLES[d.governance_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.governance_rating === "inadequate" || d.errors.major_harm_count > 0 || d.storage.fail_count > 0;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-rose-500")} />
            <span className="text-slate-900">Medication Governance</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.governance_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.governance_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.governance_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Audit Pass Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.audit.pass_rate >= 90 ? "text-green-600" :
                  d.audit.pass_rate >= 75 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.audit.total_audits > 0 ? `${d.audit.pass_rate}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Audit Pass</p>
            </div>

            {/* Storage Pass Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.storage.pass_rate >= 90 ? "text-green-600" :
                  d.storage.pass_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.storage.total_audits > 0 ? `${d.storage.pass_rate}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Storage</p>
            </div>

            {/* Stock Balanced Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.stock.balanced_rate >= 90 ? "text-green-600" :
                  d.stock.balanced_rate >= 75 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.stock.total_checks > 0 ? `${d.stock.balanced_rate}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Stock</p>
            </div>

            {/* Errors */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Siren className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.errors.total_errors === 0 ? "text-green-600" :
                  d.errors.major_harm_count === 0 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.errors.total_errors}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Errors</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.governance_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Audits & Errors</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Audits: <span className="font-medium text-slate-600">{d.audit.total_audits}</span> ({d.audit.pass_count} pass, {d.audit.fail_count} fail)</p>
                <p>Errors: <span className={cn("font-medium", d.errors.total_errors === 0 ? "text-green-600" : "text-red-600")}>{d.errors.total_errors}</span>
                  {d.errors.total_errors > 0 && <span> ({d.errors.open_investigations} open)</span>}
                </p>
                <p>Near misses: <span className="font-medium text-slate-600">{d.nearMisses.total_near_misses}</span>
                  {d.nearMisses.high_critical_count > 0 && <span className="text-red-600"> ({d.nearMisses.high_critical_count} high/crit)</span>}
                </p>
                <p>Debrief rate: <span className={cn("font-medium",
                  d.errors.debrief_rate >= 90 ? "text-green-600" : d.errors.debrief_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>{d.errors.total_errors > 0 ? `${d.errors.debrief_rate}%` : "—"}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Storage & Protocols</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Stock checks: <span className="font-medium text-slate-600">{d.stock.total_checks}</span> ({d.stock.balanced_count} balanced)</p>
                <p>Storage audits: <span className="font-medium text-slate-600">{d.storage.total_audits}</span>
                  {d.storage.fail_count > 0 && <span className="text-red-600"> ({d.storage.fail_count} fail)</span>}
                </p>
                <p>Emergency protocols: <span className="font-medium text-slate-600">{d.emergencyProtocols.total_protocols}</span>
                  {d.emergencyProtocols.overdue_reviews > 0 && <span className="text-red-600"> ({d.emergencyProtocols.overdue_reviews} overdue)</span>}
                </p>
                <p>CD governance: <span className={cn("font-medium",
                  d.storage.controlled_drugs_correct_rate >= 100 ? "text-green-600" :
                  d.storage.controlled_drugs_correct_rate >= 90 ? "text-amber-600" : "text-red-600"
                )}>{d.storage.total_audits > 0 ? `${d.storage.controlled_drugs_correct_rate}%` : "—"}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            {d.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            {d.concerns.slice(0, 3).map((c, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Recommendations ({d.recommendations.length})
            </p>
            {d.recommendations.slice(0, 3).map((rec) => (
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  {rec.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ARIA Medication Governance Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Medication Governance Intelligence
            </p>
            {d.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
