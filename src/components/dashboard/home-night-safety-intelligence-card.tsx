"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NIGHT SAFETY INTELLIGENCE CARD
// Home-level: overnight welfare check compliance, night disturbances,
// incidents, per-child night profiles, ARIA insights.
// CHR 2015 Reg 12, 34. SCCIF: "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, Moon, Shield, User, Eye,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeNightSafetyIntelligence } from "@/hooks/use-home-night-safety-intelligence";
import type { NightSafetyRating } from "@/lib/engines/home-night-safety-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<NightSafetyRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-300",  label: "NO DATA" },
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

function scoreColor(score: number): string {
  if (score >= 65) return "text-green-600";
  if (score >= 45) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number): string {
  if (score >= 65) return "bg-green-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}

// ── Component ───────────────────────────────────────────────────────────────

export function HomeNightSafetyIntelligenceCard() {
  const { data, isLoading } = useHomeNightSafetyIntelligence();

  if (isLoading) {
    return (
      <Card className="col-span-full overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const ratingStyle = RATING_STYLES[d.night_safety_rating] ?? RATING_STYLES.insufficient_data;

  return (
    <Card className="col-span-full overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            <span className="text-slate-900">Night Safety</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.night_safety_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.night_safety_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", d.check_compliance.compliance_rate >= 80 ? "bg-green-50" : d.check_compliance.compliance_rate >= 50 ? "bg-amber-50" : "bg-red-50")}>
            <div className="flex items-center justify-center gap-1">
              <Eye className={cn("h-4 w-4", d.check_compliance.compliance_rate >= 80 ? "text-green-500" : d.check_compliance.compliance_rate >= 50 ? "text-amber-500" : "text-red-500")} />
              <p className={cn("text-lg font-bold tabular-nums", d.check_compliance.compliance_rate >= 80 ? "text-green-600" : d.check_compliance.compliance_rate >= 50 ? "text-amber-600" : "text-red-600")}>
                {d.check_compliance.compliance_rate}%
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Check Compliance</p>
            <p className="text-[10px] text-slate-500">{d.check_compliance.nights_with_checks_30d}/{d.check_compliance.total_nights_30d} nights</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <Shield className={cn("h-4 w-4", d.check_compliance.all_children_checked_rate >= 80 ? "text-green-500" : "text-amber-500")} />
              <p className={cn("text-lg font-bold tabular-nums", d.check_compliance.all_children_checked_rate >= 80 ? "text-green-600" : "text-amber-600")}>
                {d.check_compliance.all_children_checked_rate}%
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">All Checked</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", d.night_incidents.total_incidents_30d === 0 ? "text-green-600" : d.night_incidents.total_incidents_30d <= 2 ? "text-amber-600" : "text-red-600")}>
              {d.night_incidents.total_incidents_30d}
            </p>
            <p className="text-[10px] text-muted-foreground">Incidents (30d)</p>
            {d.night_incidents.escalated_count_30d > 0 && (
              <p className="text-[10px] text-red-600">{d.night_incidents.escalated_count_30d} escalated</p>
            )}
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", d.disturbances.total_disturbances_30d === 0 ? "text-green-600" : d.disturbances.total_disturbances_30d <= 3 ? "text-amber-600" : "text-red-600")}>
              {d.disturbances.total_disturbances_30d}
            </p>
            <p className="text-[10px] text-muted-foreground">Disturbances (30d)</p>
            {d.disturbances.children_with_disturbances.length > 0 && (
              <p className="text-[10px] text-amber-600">{d.disturbances.children_with_disturbances.length} child{d.disturbances.children_with_disturbances.length !== 1 ? "ren" : ""}</p>
            )}
          </div>
        </div>

        {/* Incident Type Breakdown */}
        {d.night_incidents.incident_types.length > 0 && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs">
            <p className="font-medium text-red-700 flex items-center gap-1 mb-1">
              <AlertOctagon className="h-3 w-3" />
              Night Incident Types
            </p>
            <div className="flex flex-wrap gap-1">
              {d.night_incidents.incident_types.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white/60 rounded px-1.5 py-0.5 text-[10px] text-red-800 border border-red-200 capitalize">
                  {t.type.replace(/_/g, " ")} <span className="font-bold">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Per-Child Night Profiles */}
        {d.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <User className="h-3 w-3" />
              Child Night Profiles
            </p>
            <div className="grid gap-1.5">
              {d.child_profiles.map((cp) => (
                <div key={cp.child_id} className="rounded border border-slate-200 bg-slate-50 p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{cp.child_name}</span>
                      <span className={cn("font-bold tabular-nums", scoreColor(cp.night_safety_score))}>{cp.night_safety_score}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{cp.checks_received_30d} checks</span>
                      {cp.nights_unsettled_30d > 0 && (
                        <span className="text-amber-600">{cp.nights_unsettled_30d} unsettled</span>
                      )}
                      {cp.incidents_30d > 0 && (
                        <span className="text-red-600">{cp.incidents_30d} incident{cp.incidents_30d !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className={cn("h-1.5 rounded-full", scoreBg(cp.night_safety_score))} style={{ width: `${Math.min(cp.night_safety_score, 100)}%` }} />
                  </div>
                  {(cp.flags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(cp.flags ?? []).map((f, i) => (
                        <span key={i} className="inline-flex text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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

        {/* ARIA Night Safety Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Night Safety Intelligence
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
