"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FINANCIAL WELLBEING INTELLIGENCE CARD
// Home-level: pocket money management, savings culture, clothing provision,
// receipt compliance, equity across children.
// CHR 2015 Reg 7, Reg 8. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Wallet,
  PiggyBank, Receipt, ShirtIcon, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeFinancialWellbeingIntelligence } from "@/hooks/use-home-financial-wellbeing-intelligence";
import type { FinancialRating } from "@/lib/engines/home-financial-wellbeing-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<FinancialRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeFinancialWellbeingIntelligenceCard() {
  const { data, isLoading } = useHomeFinancialWellbeingIntelligence();

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

  const ratingStyle = RATING_STYLES[d.financial_rating] ?? RATING_STYLES.insufficient_data;
  const hasOverBudget = d.clothing_profile.over_pace_count > 1;
  const hasNoAllowances = d.allowance_profile.children_count === 0 && d.financial_rating !== "insufficient_data";
  const isAlert = hasOverBudget || hasNoAllowances || d.financial_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-teal-500")} />
            <span className="text-slate-900">Financial Wellbeing</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.financial_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.financial_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.financial_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.financial_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Children Receiving Allowances */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.allowance_profile.children_count >= 3 ? "text-green-600" :
                  d.allowance_profile.children_count >= 1 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.allowance_profile.children_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Receiving</p>
            </div>

            {/* Receipt Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Receipt className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.spending_profile.receipt_rate >= 80 ? "text-green-600" :
                  d.spending_profile.receipt_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.spending_profile.receipt_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Receipts</p>
            </div>

            {/* Savings Participation */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <PiggyBank className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.savings_profile.savings_participation_rate >= 60 ? "text-green-600" :
                  d.savings_profile.savings_participation_rate >= 30 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.savings_profile.savings_participation_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Saving</p>
            </div>

            {/* Clothing Budget Utilisation */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShirtIcon className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.clothing_profile.avg_budget_utilization >= 40 && d.clothing_profile.avg_budget_utilization <= 100 ? "text-green-600" :
                  d.clothing_profile.avg_budget_utilization >= 25 && d.clothing_profile.avg_budget_utilization <= 110 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.clothing_profile.children_tracked > 0 ? `${d.clothing_profile.avg_budget_utilization}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Clothing</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.financial_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Pocket Money</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total (90d): <span className="font-medium text-slate-600">£{d.allowance_profile.total_allowances_90d}</span></p>
                <p>Avg/week: <span className="font-medium text-slate-600">£{d.allowance_profile.avg_weekly_per_child}</span></p>
                <p>Regularity: <span className={cn("font-medium",
                  d.allowance_profile.regularity_rate >= 80 ? "text-green-600" :
                  d.allowance_profile.regularity_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>{d.allowance_profile.regularity_rate}%</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Spending</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total (90d): <span className="font-medium text-slate-600">£{d.spending_profile.total_spending_90d}</span></p>
                <p>Categories: <span className="font-medium text-slate-600">{d.spending_profile.category_count}</span></p>
                <p>Approved: <span className={cn("font-medium",
                  d.spending_profile.approval_rate >= 90 ? "text-green-600" :
                  d.spending_profile.approval_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>{d.spending_profile.approval_rate}%</span></p>
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

        {/* ARIA Financial Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Financial Intelligence
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
