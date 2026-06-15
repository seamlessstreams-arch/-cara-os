"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DIGITAL SAFETY INTELLIGENCE CARD
// Online safety incidents, agreements, photo & media consents.
// KCSIE 2024: "Online safety — appropriate systems."
// CHR 2015 Reg 12/13: "Protection of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, ShieldCheck,
  FileCheck, Smartphone, MonitorSmartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeDigitalSafetyIntelligence } from "@/hooks/use-home-digital-safety-intelligence";
import type { DigitalSafetyRating } from "@/lib/engines/home-digital-safety-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<DigitalSafetyRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeDigitalSafetyIntelligenceCard() {
  const { data, isLoading } = useHomeDigitalSafetyIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  let d = data?.data;
  if (!d) return null;
  // Calm reframe: an empty-with-children engine result (inadequate + score<=15) is
  // 'not yet recorded', not a failing home — render it as honest, neutral insufficient_data.
  const __emptyState = d.digital_safety_rating === "inadequate" && (d.digital_safety_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      digital_safety_rating: "insufficient_data",
      concerns: [],
      recommendations: [],
      insights: [],
      headline:
        String(d.headline || "")
          .split(/ despite | — | -- /)[0]
          .replace(/[\u2014,\-]\s*$/, "")
          .trim() + " — not yet recorded; capturing entries will enable this analysis.",
    };
  }

  const ratingStyle = RATING_STYLES[d.digital_safety_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.digital_safety_rating === "inadequate" || d.incidents.high_severity_count >= 3;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MonitorSmartphone className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-violet-500")} />
            <span className="text-slate-900">Digital Safety</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.digital_safety_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.digital_safety_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.digital_safety_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.digital_safety_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Agreement Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.agreements.agreement_coverage_rate >= 100 ? "text-green-600" :
                  d.agreements.agreement_coverage_rate >= 75 ? "text-blue-600" : "text-red-600"
                )}>
                  {d.agreements.agreement_coverage_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Agreements</p>
            </div>

            {/* Photo Consent */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <FileCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.consents.photo_consent_coverage_rate >= 100 ? "text-green-600" :
                  d.consents.photo_consent_coverage_rate >= 75 ? "text-blue-600" : "text-red-600"
                )}>
                  {d.consents.photo_consent_coverage_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Photo Consent</p>
            </div>

            {/* Incidents (90d) */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.incidents.total_incidents_90d === 0 ? "text-green-600" :
                  d.incidents.total_incidents_90d <= 3 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.incidents.total_incidents_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Incidents (90d)</p>
            </div>

            {/* Overdue */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  (d.agreements.overdue_reviews + d.consents.overdue_photo_reviews) === 0 ? "text-green-600" :
                  (d.agreements.overdue_reviews + d.consents.overdue_photo_reviews) <= 2 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.agreements.overdue_reviews + d.consents.overdue_photo_reviews}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Overdue</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.digital_safety_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Agreements</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Signed: <span className={cn("font-medium",
                  d.agreements.signed_rate >= 100 ? "text-green-600" : "text-amber-600"
                )}>{d.agreements.signed_rate}%</span></p>
                <p>Controls: <span className="font-medium text-slate-600">{d.agreements.with_parental_controls}</span></p>
                <p>Avg devices: <span className="font-medium text-slate-600">{d.agreements.avg_devices_per_child}</span></p>
                <p>Overdue: <span className={cn("font-medium",
                  d.agreements.overdue_reviews === 0 ? "text-green-600" : "text-red-600"
                )}>{d.agreements.overdue_reviews}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Incidents</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Open: <span className={cn("font-medium",
                  d.incidents.open_incidents === 0 ? "text-green-600" :
                  d.incidents.open_incidents <= 2 ? "text-amber-600" : "text-red-600"
                )}>{d.incidents.open_incidents}</span></p>
                <p>High/Crit: <span className={cn("font-medium",
                  d.incidents.high_severity_count === 0 ? "text-green-600" : "text-red-600"
                )}>{d.incidents.high_severity_count}</span></p>
                <p>Resolved: <span className="font-medium text-slate-600">{d.incidents.resolution_rate}%</span></p>
                <p>Parents told: <span className="font-medium text-slate-600">{d.incidents.parent_notification_rate}%</span></p>
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

        {/* Cara Digital Safety Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Digital Safety Intelligence
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
