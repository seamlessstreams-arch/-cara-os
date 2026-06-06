"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PREMISES SAFETY INTELLIGENCE CARD
// Home-level: building certifications, premises checks, vehicle compliance,
// and maintenance responsiveness.
// CHR 2015 Reg 25. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Building2,
  ShieldCheck, Car, Wrench, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomePremisesSafetyIntelligence } from "@/hooks/use-home-premises-safety-intelligence";
import type { PremisesRating } from "@/lib/engines/home-premises-safety-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<PremisesRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomePremisesSafetyIntelligenceCard() {
  const { data, isLoading } = useHomePremisesSafetyIntelligence();

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

  const ratingStyle = RATING_STYLES[d.premises_rating] ?? RATING_STYLES.insufficient_data;
  const hasExpiredCerts = d.certification_profile.expired_count > 0;
  const hasExpiredVehicles = d.vehicle_profile.expired_count > 0;
  const isAlert = hasExpiredCerts || hasExpiredVehicles || d.premises_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-orange-500")} />
            <span className="text-slate-900">Premises Safety</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.premises_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.premises_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.premises_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.premises_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Certifications */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.certification_profile.all_current ? "text-green-600" :
                  d.certification_profile.expired_count <= 1 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.certification_profile.expired_count === 0 ? "✓" : d.certification_profile.expired_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">{d.certification_profile.expired_count === 0 ? "Certs OK" : "Expired"}</p>
            </div>

            {/* Check Overdue */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.check_profile.overdue_count === 0 ? "text-green-600" :
                  d.check_profile.overdue_count <= 1 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.check_profile.overdue_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Overdue</p>
            </div>

            {/* Vehicles */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Car className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.vehicle_profile.all_compliant ? "text-green-600" :
                  d.vehicle_profile.expired_count <= 1 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.vehicle_profile.all_compliant ? "✓" : d.vehicle_profile.expired_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">{d.vehicle_profile.all_compliant ? "Fleet OK" : "Expired"}</p>
            </div>

            {/* Maintenance */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Wrench className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.maintenance_profile.overdue_count === 0 && d.maintenance_profile.urgent_open_count === 0 ? "text-green-600" :
                  d.maintenance_profile.overdue_count <= 1 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.maintenance_profile.urgent_open_count > 0 ? d.maintenance_profile.urgent_open_count : d.maintenance_profile.overdue_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">{d.maintenance_profile.urgent_open_count > 0 ? "Urgent" : "Overdue"}</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.premises_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Building</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Gas cert: <span className={cn("font-medium", d.certification_profile.gas_current ? "text-green-600" : "text-red-600")}>{d.certification_profile.gas_current ? "Current" : "Expired"}</span></p>
                <p>Electrical: <span className={cn("font-medium", d.certification_profile.electrical_current ? "text-green-600" : "text-red-600")}>{d.certification_profile.electrical_current ? "Current" : "Expired"}</span></p>
                <p>Fire risk: <span className={cn("font-medium", d.certification_profile.fire_risk_current ? "text-green-600" : "text-red-600")}>{d.certification_profile.fire_risk_current ? "Current" : "Overdue"}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Maintenance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Open items: <span className="font-medium text-slate-600">{d.maintenance_profile.open_count}</span></p>
                {d.maintenance_profile.overdue_count > 0 && (
                  <p>Overdue: <span className="font-medium text-red-600">{d.maintenance_profile.overdue_count}</span></p>
                )}
                <p>Completion: <span className={cn("font-medium",
                  d.maintenance_profile.completion_rate >= 80 ? "text-green-600" :
                  d.maintenance_profile.completion_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>{d.maintenance_profile.completion_rate}%</span></p>
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

        {/* ARIA Premises Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Premises Intelligence
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
