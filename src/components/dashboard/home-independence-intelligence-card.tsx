"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INDEPENDENCE & TRANSITION INTELLIGENCE CARD
// Home-level: independence readiness, life skills domains, pathway linkage,
// transition preparation quality, and domain gap analysis.
// CHR 2015 Reg 7, 8. SCCIF: "Outcomes", "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, GraduationCap,
  Target, CheckCheck, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeIndependenceIntelligence } from "@/hooks/use-home-independence-intelligence";
import type { IndependenceRating } from "@/lib/engines/home-independence-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<IndependenceRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeIndependenceIntelligenceCard() {
  const { data, isLoading } = useHomeIndependenceIntelligence();

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

  const ratingStyle = RATING_STYLES[d.independence_rating] ?? RATING_STYLES.insufficient_data;
  const hasMissing = d.independence_profile.children_without_assessments.length > 0;
  const hasOverdue = d.independence_profile.overdue_reviews > 0;
  const hasAttention = d.independence_profile.attention_needed_count > 0;
  const isAlert = hasMissing || hasOverdue || hasAttention || d.independence_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-teal-500")} />
            <span className="text-slate-900">Independence & Transition</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.independence_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.independence_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.independence_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.independence_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Assessments */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.independence_profile.children_without_assessments.length === 0 ? "text-green-600" : "text-red-600")}>
                  {d.independence_profile.total_assessments}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Assessments</p>
            </div>

            {/* Readiness */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Target className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.independence_profile.avg_readiness >= 60 ? "text-green-600" :
                  d.independence_profile.avg_readiness >= 40 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.independence_profile.avg_readiness}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Readiness</p>
            </div>

            {/* On Track */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.independence_profile.on_track_count === d.independence_profile.total_assessments ? "text-green-600" : "text-amber-600"
                )}>
                  {d.independence_profile.on_track_count}/{d.independence_profile.total_assessments}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">On Track</p>
            </div>

            {/* Domain Score */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.domain_analysis.avg_domain_score >= 6 ? "text-green-600" :
                  d.domain_analysis.avg_domain_score >= 4 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.domain_analysis.avg_domain_score}/10
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Domain Avg</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.independence_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Profile Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Pathways</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Linked to plan: <span className={cn("font-medium", d.independence_profile.pathway_plan_linkage_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.independence_profile.pathway_plan_linkage_rate}%</span></p>
                <p>Evidence quality: <span className={cn("font-medium", d.independence_profile.evidence_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.independence_profile.evidence_rate}%</span></p>
                {d.independence_profile.children_without_assessments.length > 0 && <p>No assessment: <span className="font-medium text-red-600">{d.independence_profile.children_without_assessments.length} children</span></p>}
                {d.independence_profile.overdue_reviews > 0 && <p>Overdue reviews: <span className="font-medium text-red-600">{d.independence_profile.overdue_reviews}</span></p>}
              </div>
            </div>

            {/* Domain Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Life Skills</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Score range: <span className="font-medium text-slate-600">{d.domain_analysis.lowest_pathway_avg}–{d.domain_analysis.highest_pathway_avg}/10</span></p>
                {d.domain_analysis.low_scoring_total > 0 && <p>Low domains: <span className="font-medium text-red-600">{d.domain_analysis.low_scoring_total}</span></p>}
                {d.domain_analysis.readiness_gap > 20 && <p>Readiness gap: <span className="font-medium text-amber-600">{d.domain_analysis.readiness_gap} pts</span></p>}
                {d.independence_profile.attention_needed_count > 0 && <p>Needs attention: <span className="font-medium text-amber-600">{d.independence_profile.attention_needed_count}</span></p>}
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

        {/* ARIA Independence Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Independence Intelligence
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
