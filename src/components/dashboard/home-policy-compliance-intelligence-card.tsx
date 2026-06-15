"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME POLICY COMPLIANCE INTELLIGENCE CARD
// Home-level: policy currency, staff acknowledgement, regulatory coverage,
// and governance assessment.
// CHR 2015 Reg 35, Reg 16. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, FileCheck,
  Users, ShieldCheck, BookOpen, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomePolicyComplianceIntelligence } from "@/hooks/use-home-policy-compliance-intelligence";
import type { PolicyRating } from "@/lib/engines/home-policy-compliance-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<PolicyRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomePolicyComplianceIntelligenceCard() {
  const { data, isLoading } = useHomePolicyComplianceIntelligence();

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
  const __emptyState = d.policy_rating === "inadequate" && (d.policy_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      policy_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.policy_rating] ?? RATING_STYLES.insufficient_data;
  const hasOverdue = d.compliance_profile.overdue_count > 0;
  const hasMissingSafeguarding = !d.coverage_profile.has_safeguarding;
  const isAlert = hasOverdue || hasMissingSafeguarding || d.policy_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-sky-500")} />
            <span className="text-slate-900">Policy Compliance</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.policy_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.policy_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.policy_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.policy_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Active Policies */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.compliance_profile.active_count >= 10 ? "text-green-600" :
                  d.compliance_profile.active_count >= 6 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.compliance_profile.active_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>

            {/* Overdue */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.compliance_profile.overdue_count === 0 ? "text-green-600" :
                  d.compliance_profile.overdue_count <= 1 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.compliance_profile.overdue_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Overdue</p>
            </div>

            {/* Staff Acknowledgement */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.acknowledgement_profile.avg_acknowledgement_rate >= 90 ? "text-green-600" :
                  d.acknowledgement_profile.avg_acknowledgement_rate >= 75 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.acknowledgement_profile.avg_acknowledgement_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Ack Rate</p>
            </div>

            {/* Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.coverage_profile.unique_categories >= 8 ? "text-green-600" :
                  d.coverage_profile.unique_categories >= 5 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.coverage_profile.unique_categories}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Areas</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.policy_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Status</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Current: <span className="font-medium text-green-600">{d.compliance_profile.current_count}</span></p>
                {d.compliance_profile.overdue_count > 0 && (
                  <p>Overdue: <span className="font-medium text-red-600">{d.compliance_profile.overdue_count}</span></p>
                )}
                {d.compliance_profile.due_review_count > 0 && (
                  <p>Due review: <span className="font-medium text-amber-600">{d.compliance_profile.due_review_count}</span></p>
                )}
                {d.compliance_profile.draft_count > 0 && (
                  <p>Draft: <span className="font-medium text-slate-600">{d.compliance_profile.draft_count}</span></p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Governance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Statutory basis: <span className={cn("font-medium",
                  d.governance_profile.statutory_basis_rate >= 100 ? "text-green-600" :
                  d.governance_profile.statutory_basis_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>{d.governance_profile.statutory_basis_rate}%</span></p>
                <p>Key points: <span className={cn("font-medium",
                  d.governance_profile.key_points_rate >= 100 ? "text-green-600" :
                  d.governance_profile.key_points_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>{d.governance_profile.key_points_rate}%</span></p>
                <p>Fully read: <span className="font-medium text-slate-600">
                  {d.acknowledgement_profile.fully_acknowledged_count}/{d.compliance_profile.active_count}
                </span></p>
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

        {/* Cara Policy Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Policy Intelligence
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
