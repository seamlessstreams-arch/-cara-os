"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD SAFEGUARDING INTELLIGENCE CARD
// Per-child safeguarding profile: risk domains, incidents, missing episodes,
// restraints, contextual safeguarding, child voice, and ARIA insights.
// CHR 2015 Reg 12, Reg 13, Reg 34, Reg 35.
// SCCIF: "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  AlertTriangle, Brain, Loader2, ShieldAlert, AlertCircle,
  Sparkles, Quote, MapPin, Eye, Siren, ArrowDown, ArrowUp,
  Minus, Clock, Target, UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildSafeguardingIntelligence } from "@/hooks/use-child-safeguarding-intelligence";
import type { SafeguardingStatus, RiskLevel, RiskTrend } from "@/lib/engines/child-safeguarding-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SafeguardingStatus, { bg: string; text: string; border: string; label: string }> = {
  safe_and_well:     { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "SAFE & WELL" },
  managed:           { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "MANAGED" },
  elevated:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ELEVATED" },
  serious_concern:   { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "SERIOUS CONCERN" },
  critical:          { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "CRITICAL" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-300",  label: "NO DATA" },
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "bg-green-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  very_high: "bg-red-500",
};

const RISK_TEXT: Record<RiskLevel, string> = {
  low: "text-green-700",
  medium: "text-amber-700",
  high: "text-orange-700",
  very_high: "text-red-700",
};

const RISK_BG: Record<RiskLevel, string> = {
  low: "bg-green-50",
  medium: "bg-amber-50",
  high: "bg-orange-50",
  very_high: "bg-red-50",
};

const TREND_ICON: Record<RiskTrend, typeof ArrowDown> = {
  decreasing: ArrowDown,
  stable: Minus,
  increasing: ArrowUp,
};

const TREND_COLOR: Record<RiskTrend, string> = {
  decreasing: "text-green-500",
  stable: "text-slate-400",
  increasing: "text-red-500",
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

export function ChildSafeguardingIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildSafeguardingIntelligence(childId);

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

  const statusStyle = STATUS_STYLES[d.safeguarding_status] ?? STATUS_STYLES.insufficient_data;
  const ip = d.incident_profile;
  const mp = d.missing_profile;
  const rp = d.restraint_profile;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span className="text-slate-900">Safeguarding Profile</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusStyle.bg, statusStyle.text, statusStyle.border)}>
              {statusStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.safeguarding_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.safeguarding_status === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* Risk Domain Bars */}
        {d.risk_domains.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">Active Risk Domains</p>
            {d.risk_domains.map((rd, i) => {
              const TrendIcon = TREND_ICON[rd.trend];
              const barWidth = rd.current_level === "very_high" ? 100 : rd.current_level === "high" ? 75 : rd.current_level === "medium" ? 50 : 25;
              return (
                <div key={i} className={cn("rounded border p-2 text-xs", RISK_BG[rd.current_level])}>
                  <div className="flex items-center gap-2">
                    <span className="w-24 font-medium text-slate-800 capitalize truncate">{rd.domain.replace(/_/g, " ")}</span>
                    <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", RISK_COLORS[rd.current_level])} style={{ width: `${barWidth}%` }} />
                    </div>
                    <span className={cn("w-16 text-[10px] capitalize font-medium", RISK_TEXT[rd.current_level])}>
                      {rd.current_level.replace(/_/g, " ")}
                    </span>
                    <TrendIcon className={cn("h-3 w-3", TREND_COLOR[rd.trend])} />
                    {rd.is_overdue && (
                      <span className="text-[10px] text-red-600 font-medium flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> Overdue
                      </span>
                    )}
                  </div>
                  {(rd.triggers?.length ?? 0) > 0 && (
                    <p className="text-[10px] text-slate-600 mt-1 truncate">
                      Triggers: {(rd.triggers ?? []).join(", ")}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {rd.effective_mitigations}/{rd.total_mitigations} mitigations effective
                    {rd.days_until_review > 0 && <span> · Review in {rd.days_until_review}d</span>}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Incident / Missing / Restraint KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("text-center rounded-lg p-2", ip.total_90d > 0 ? (ip.critical_count > 0 ? "bg-red-50" : "bg-amber-50") : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ip.total_90d > 0 ? (ip.critical_count > 0 ? "text-red-600" : "text-amber-600") : "text-green-600")}>{ip.total_90d}</p>
            <p className="text-[10px] text-muted-foreground">Incidents (90d)</p>
            {ip.critical_count > 0 && <p className="text-[10px] text-red-600 font-medium">{ip.critical_count} critical</p>}
          </div>
          <div className={cn("text-center rounded-lg p-2", mp.total_90d > 0 ? (mp.high_risk_count > 0 ? "bg-red-50" : "bg-amber-50") : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", mp.total_90d > 0 ? (mp.high_risk_count > 0 ? "text-red-600" : "text-amber-600") : "text-green-600")}>{mp.total_90d}</p>
            <p className="text-[10px] text-muted-foreground">Missing (90d)</p>
            {mp.high_risk_count > 0 && <p className="text-[10px] text-red-600 font-medium">{mp.high_risk_count} high risk</p>}
          </div>
          <div className={cn("text-center rounded-lg p-2", rp.total_90d > 0 ? (rp.injuries_count > 0 ? "bg-red-50" : "bg-amber-50") : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", rp.total_90d > 0 ? (rp.injuries_count > 0 ? "text-red-600" : "text-amber-600") : "text-green-600")}>{rp.total_90d}</p>
            <p className="text-[10px] text-muted-foreground">Restraints (90d)</p>
            {rp.injuries_count > 0 && <p className="text-[10px] text-red-600 font-medium">{rp.injuries_count} injuries</p>}
          </div>
        </div>

        {/* Missing Episode Details */}
        {mp.total_90d > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <MapPin className={cn("h-3.5 w-3.5 shrink-0", mp.return_interview_rate === 100 ? "text-green-500" : "text-amber-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Return Interviews</p>
                <p className="text-[10px] text-muted-foreground">
                  <span className={mp.return_interview_rate === 100 ? "text-green-600" : "text-amber-600"}>
                    {mp.return_interview_rate}% completed
                  </span>
                </p>
              </div>
            </div>
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <Eye className={cn("h-3.5 w-3.5 shrink-0", mp.contextual_risk_count > 0 ? "text-red-500" : "text-green-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Contextual Risk</p>
                <p className="text-[10px] text-muted-foreground">
                  {mp.contextual_risk_count > 0 ? (
                    <span className="text-red-600">{mp.contextual_risk_count} flagged</span>
                  ) : (
                    <span className="text-green-600">None identified</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Restraint Compliance Details */}
        {rp.total_90d > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <UserX className={cn("h-3.5 w-3.5 shrink-0", rp.debrief_rate === 100 ? "text-green-500" : "text-amber-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Child Debriefs</p>
                <p className="text-[10px] text-muted-foreground">
                  <span className={rp.debrief_rate === 100 ? "text-green-600" : "text-amber-600"}>
                    {rp.debrief_rate}% completed
                  </span>
                </p>
              </div>
            </div>
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <Target className={cn("h-3.5 w-3.5 shrink-0", rp.review_rate === 100 ? "text-green-500" : "text-amber-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Reviews Completed</p>
                <p className="text-[10px] text-muted-foreground">
                  <span className={rp.review_rate === 100 ? "text-green-600" : "text-amber-600"}>
                    {rp.review_rate}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contextual Safeguarding Alerts */}
        {d.contextual_risks_active > 0 && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs">
            <p className="font-medium text-red-700 flex items-center gap-1">
              <Siren className="h-3 w-3" />
              {d.contextual_risks_active} Active Contextual Safeguarding Risk{d.contextual_risks_active !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Child Voice */}
        {d.child_voice && (
          <div className="rounded border border-blue-200 bg-blue-50 p-2.5 text-xs text-blue-800 leading-relaxed">
            <p className="flex items-center gap-1 font-medium text-blue-700 mb-1">
              <Quote className="h-3 w-3" />
              {d.child_name}&apos;s Voice
            </p>
            <p className="italic text-[11px]">&ldquo;{d.child_voice}&rdquo;</p>
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

        {/* ARIA Safeguarding Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Safeguarding Intelligence
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
