"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEDICATION MANAGEMENT INTELLIGENCE CARD
// Administration compliance, witnessing, stock, errors, PRN usage.
// CHR 2015 Reg 23: "Health needs — including medication."
// SCCIF: "Children's medication is managed safely."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Pill,
  ShieldCheck, Clock, Eye, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeMedicationManagementIntelligence } from "@/hooks/use-home-medication-management-intelligence";
import type { MedicationManagementRating } from "@/lib/engines/home-medication-management-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<MedicationManagementRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeMedicationManagementIntelligenceCard() {
  const { data, isLoading } = useHomeMedicationManagementIntelligence();

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

  const ratingStyle = RATING_STYLES[d.medication_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.medication_rating === "inadequate" || d.errors.total_errors_90d > 0 || d.administration.total_missed > 0;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-emerald-500")} />
            <span className="text-slate-900">Medication Management</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.medication_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.medication_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.medication_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Compliance Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.administration.compliance_rate >= 95 ? "text-green-600" :
                  d.administration.compliance_rate >= 85 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.administration.compliance_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Compliance</p>
            </div>

            {/* Witnessing Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.witnessing.witnessing_rate >= 95 ? "text-green-600" :
                  d.witnessing.witnessing_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.witnessing.witnessing_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Witnessed</p>
            </div>

            {/* On-Time Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.administration.on_time_rate >= 90 ? "text-green-600" :
                  d.administration.on_time_rate >= 75 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.administration.on_time_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">On Time</p>
            </div>

            {/* Errors */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Package className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.errors.total_errors_90d === 0 ? "text-green-600" :
                  d.errors.total_errors_90d <= 2 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.errors.total_errors_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Errors (90d)</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.medication_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Administration</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Given: <span className="font-medium text-slate-600">{d.administration.total_given}</span></p>
                <p>Late: <span className={cn("font-medium", d.administration.total_late === 0 ? "text-green-600" : "text-amber-600")}>{d.administration.total_late}</span></p>
                <p>Refused: <span className={cn("font-medium", d.administration.total_refused === 0 ? "text-green-600" : "text-amber-600")}>{d.administration.total_refused}</span></p>
                <p>Missed: <span className={cn("font-medium", d.administration.total_missed === 0 ? "text-green-600" : "text-red-600")}>{d.administration.total_missed}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Stock & Coverage</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Active meds: <span className="font-medium text-slate-600">{d.coverage.active_medications}</span></p>
                <p>Low stock: <span className={cn("font-medium", d.stock.low_stock_count === 0 ? "text-green-600" : "text-red-600")}>{d.stock.low_stock_count}</span></p>
                <p>Stock checks: <span className={cn("font-medium",
                  d.stock.stock_check_rate >= 90 ? "text-green-600" : "text-amber-600"
                )}>{d.stock.stock_check_rate}%</span></p>
                <p>Children on meds: <span className="font-medium text-slate-600">{d.coverage.children_on_medication}</span></p>
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

        {/* ARIA Medication Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Medication Intelligence
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
