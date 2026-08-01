"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD RISK PROFILE INTELLIGENCE CARD
// Per-child: risk assessments across domains, risk trajectory,
// mitigation effectiveness, review compliance.
// CHR 2015 Reg 12, 34, 5. SCCIF: "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, Shield, TrendingUp, TrendingDown, Minus,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { ChildRiskProfileResult, RiskManagementRating, DomainRiskProfile } from "@/lib/engines/child-risk-profile-intelligence-engine";

interface ChildRiskProfileResponse {
  data: ChildRiskProfileResult;
}

function useChildRiskProfileIntelligence(childId: string) {
  return useQuery<ChildRiskProfileResponse>({
    queryKey: ["child-risk-profile-intelligence", childId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/child-risk-profile-intelligence?childId=${childId}`);
      if (!res.ok) throw new Error("Failed to fetch child risk profile intelligence");
      return res.json();
    },
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<RiskManagementRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:      { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:             { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:         { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:       { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  no_assessments:   { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO ASSESSMENTS" },
};

const LEVEL_STYLES: Record<string, string> = {
  very_high: "text-red-700 bg-red-50 border-red-200",
  high: "text-red-600 bg-red-50 border-red-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  low: "text-green-600 bg-green-50 border-green-200",
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

// ── Risk Domain Row ─────────────────────────────────────────────────────────

function RiskDomainRow({ profile }: { profile: DomainRiskProfile }) {
  const TrendIcon = profile.trend === "increasing" ? TrendingUp :
    profile.trend === "decreasing" ? TrendingDown : Minus;
  const trendColor = profile.trend === "increasing" ? "text-red-500" :
    profile.trend === "decreasing" ? "text-green-500" : "text-slate-400";

  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-1.5">
        <TrendIcon className={cn("h-3 w-3", trendColor)} />
        <span className="text-[10px] font-medium text-slate-700">{profile.domain_label}</span>
        {profile.review_overdue && (
          <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1 rounded">OVERDUE</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize", LEVEL_STYLES[profile.current_level] ?? LEVEL_STYLES.medium)}>
          {profile.current_level.replace(/_/g, " ")}
        </span>
        {profile.has_child_views && <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />}
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function ChildRiskProfileIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildRiskProfileIntelligence(childId);

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

  const ratingStyle = RATING_STYLES[d.management_rating] ?? RATING_STYLES.no_assessments;
  const hasEscalating = d.overview.escalating_count > 0;
  const hasVeryHigh = d.domain_profiles.some((dp) => dp.current_level === "very_high");

  return (
    <Card className={cn("overflow-hidden", hasEscalating || hasVeryHigh ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", hasEscalating ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className={cn("h-4 w-4", hasEscalating ? "text-red-600" : "text-orange-500")} />
            <span className="text-slate-900">Risk Profile</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.management_rating !== "no_assessments" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.management_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Escalation Alert */}
        {hasEscalating && (
          <div className="rounded border-2 border-red-400 bg-red-100 p-3 text-xs text-red-900 font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {d.overview.escalating_count} RISK{d.overview.escalating_count !== 1 ? "S" : ""} ESCALATING — Immediate review required
          </div>
        )}

        {/* KPI Row */}
        {d.overview.total_domains_assessed > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.overview.high_or_very_high_count > 0 ? "text-red-600" : "text-green-600")}>
                {d.overview.high_or_very_high_count}
              </p>
              <p className="text-[10px] text-muted-foreground">High/V.High</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className={cn("h-3.5 w-3.5", d.overview.improving_count > 0 ? "text-green-500" : "text-slate-400")} />
                <p className={cn("text-lg font-bold tabular-nums", d.overview.improving_count > 0 ? "text-green-600" : "text-slate-500")}>
                  {d.overview.improving_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Reducing</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", (d.mitigation_profile.effectiveness_rate ?? 0) >= 80 ? "text-green-600" : (d.mitigation_profile.effectiveness_rate ?? 0) >= 60 ? "text-amber-600" : "text-red-600")}>
                {d.mitigation_profile.effectiveness_rate}%
              </p>
              <p className="text-[10px] text-muted-foreground">Mitigations</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.review_compliance.child_views_rate === 100 ? "text-green-600" : "text-amber-600")}>
                {d.review_compliance.child_views_rate}%
              </p>
              <p className="text-[10px] text-muted-foreground">Child Views</p>
            </div>
          </div>
        )}

        {/* Domain Risk Map */}
        {d.domain_profiles.length > 0 && (
          <div className="rounded border p-2.5">
            <p className="text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              <Shield className="h-3 w-3 text-orange-500" />
              Risk Domains ({d.domain_profiles.length})
            </p>
            {d.domain_profiles.map((dp) => (
              <RiskDomainRow key={dp.domain} profile={dp} />
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

        {/* Cara Risk Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Risk Intelligence
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
