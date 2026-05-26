"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD MEDICATION INTELLIGENCE CARD
// Per-child: medication safety — adherence, witnessing, timeliness,
// PRN patterns, stock, errors.
// CHR 2015 Reg 23, 12. SCCIF: "Health."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, Pill, ShieldCheck, Clock,
  TrendingUp, TrendingDown, Minus, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildMedicationIntelligence } from "@/hooks/use-child-medication-intelligence";
import type { MedicationSafetyRating } from "@/lib/engines/child-medication-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<MedicationSafetyRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:     { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:            { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:        { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:      { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  no_medications:  { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO MEDS" },
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

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

const TREND_COLOR: Record<string, string> = {
  improving: "text-green-600",
  stable: "text-slate-500",
  declining: "text-red-600",
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildMedicationIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildMedicationIntelligence(childId);

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

  const ratingStyle = RATING_STYLES[d.medication_safety_rating] ?? RATING_STYLES.no_medications;
  const TrendIcon = TREND_ICON[d.adherence.adherence_trend];
  const hasErrors = d.errors.errors_30d > 0 || d.errors.open_errors > 0;
  const hasMissed = d.adherence.missed_count_30d > 0;

  return (
    <Card className={cn("overflow-hidden", hasErrors || hasMissed ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", hasErrors ? "bg-red-50" : hasMissed ? "bg-amber-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className={cn("h-4 w-4", hasErrors ? "text-red-600" : "text-violet-500")} />
            <span className="text-slate-900">Medication Safety</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.medication_safety_rating !== "no_medications" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.medication_safety_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.active_medication_count > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.adherence.adherence_rate_30d >= 95 ? "text-green-600" : d.adherence.adherence_rate_30d >= 80 ? "text-amber-600" : "text-red-600")}>
                  {d.adherence.adherence_rate_30d}%
                </p>
                {d.adherence.adherence_trend !== "insufficient_data" && (
                  <TrendIcon className={cn("h-3 w-3", TREND_COLOR[d.adherence.adherence_trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Adherence</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.witnessing.witnessing_rate_30d >= 95 ? "text-green-600" : d.witnessing.witnessing_rate_30d >= 80 ? "text-amber-600" : "text-red-600")}>
                  {d.witnessing.witnessing_rate_30d}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Witnessed</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.timeliness.on_time_rate_30d >= 90 ? "text-green-600" : d.timeliness.on_time_rate_30d >= 70 ? "text-amber-600" : "text-red-600")}>
                  {d.timeliness.on_time_rate_30d}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">On Time</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.adherence.refusal_count_30d === 0 ? "text-green-600" : d.adherence.refusal_count_30d <= 2 ? "text-amber-600" : "text-red-600")}>
                {d.adherence.refusal_count_30d}
              </p>
              <p className="text-[10px] text-muted-foreground">Refusals (30d)</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.active_medication_count > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Adherence</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>30d: <span className={cn("font-medium", d.adherence.adherence_rate_30d >= 90 ? "text-green-600" : "text-amber-600")}>{d.adherence.adherence_rate_30d}%</span></p>
                <p>7d: <span className="font-medium text-slate-600">{d.adherence.adherence_rate_7d}%</span></p>
                <p>Total admins: <span className="font-medium text-slate-600">{d.adherence.total_administrations_30d}</span></p>
                {d.adherence.missed_count_30d > 0 && (
                  <p className="text-red-600 font-medium">{d.adherence.missed_count_30d} missed dose(s)</p>
                )}
                {d.adherence.late_count_30d > 0 && (
                  <p className="text-amber-600 font-medium">{d.adherence.late_count_30d} late</p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Safety</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Witnessing: <span className={d.witnessing.witnessing_rate_30d >= 95 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.witnessing.witnessing_rate_30d}%</span></p>
                {d.has_controlled_drugs && (
                  <p>Controlled: <span className={d.witnessing.controlled_drug_witnessing_rate === 100 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{d.witnessing.controlled_drug_witnessing_rate}%</span></p>
                )}
                <p>Errors (90d): <span className={cn("font-medium", d.errors.total_errors_90d === 0 ? "text-green-600" : "text-red-600")}>{d.errors.total_errors_90d}</span></p>
                {d.errors.open_errors > 0 && (
                  <p className="text-red-600 font-medium">{d.errors.open_errors} open error(s)</p>
                )}
                {d.stock.stock_low_count > 0 && (
                  <p className="text-amber-600 font-medium">{d.stock.stock_low_count} low stock</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Medication Details */}
        {d.medication_details.length > 0 && d.medication_details.length <= 6 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Medications</p>
            {d.medication_details.map((med) => (
              <div key={med.medication_id} className="flex items-center justify-between text-xs rounded border p-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    med.adherence_rate >= 95 ? "bg-green-500" : med.adherence_rate >= 70 ? "bg-amber-500" : "bg-red-500",
                  )} />
                  <span className="font-medium text-slate-700">{med.name}</span>
                  <span className="text-[10px] text-muted-foreground">{med.dosage} · {med.type}</span>
                </div>
                <span className={cn("text-[10px] font-bold tabular-nums", med.adherence_rate >= 95 ? "text-green-600" : med.adherence_rate >= 70 ? "text-amber-600" : "text-red-600")}>
                  {med.administrations_30d > 0 ? `${med.adherence_rate}%` : "—"}
                </span>
              </div>
            ))}
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
