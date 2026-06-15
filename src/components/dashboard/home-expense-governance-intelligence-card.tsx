"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME EXPENSE GOVERNANCE INTELLIGENCE CARD
// Financial stewardship: expense approval, receipt compliance, oversight.
// CHR 2015 Reg 36. SCCIF: "The arrangements for the financial management."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Banknote,
  TrendingUp, Receipt, Clock, PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeExpenseGovernanceIntelligence } from "@/hooks/use-home-expense-governance-intelligence";
import type { ExpenseGovernanceRating } from "@/lib/engines/home-expense-governance-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<ExpenseGovernanceRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeExpenseGovernanceIntelligenceCard() {
  const { data, isLoading } = useHomeExpenseGovernanceIntelligence();

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
  const __emptyState = d.expense_rating === "inadequate" && (d.expense_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      expense_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.expense_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.expense_rating === "inadequate" || d.compliance.receipt_rate < 50;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Banknote className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-emerald-500")} />
            <span className="text-slate-900">Expense Governance</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.expense_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.expense_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.expense_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.expense_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Receipt Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Receipt className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.compliance.receipt_rate >= 90 ? "text-green-600" :
                  d.compliance.receipt_rate >= 75 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.compliance.receipt_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Receipts</p>
            </div>

            {/* Approval Speed */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.approval.avg_approval_days <= 2 ? "text-green-600" :
                  d.approval.avg_approval_days <= 5 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.approval.avg_approval_days > 0 ? `${d.approval.avg_approval_days}d` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Approval</p>
            </div>

            {/* Pending */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.approval.pending_count === 0 ? "text-green-600" :
                  d.approval.pending_count <= 2 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.approval.pending_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>

            {/* Categories */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <PieChart className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.distribution.length >= 4 ? "text-green-600" :
                  d.distribution.length >= 2 ? "text-amber-600" : "text-slate-600"
                )}>
                  {d.distribution.length}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Categories</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.expense_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Volume</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total claims: <span className="font-medium text-slate-600">{d.volume.total_expenses}</span></p>
                <p>Total: <span className="font-medium text-slate-600">£{d.volume.total_amount.toFixed(2)}</span></p>
                <p>Average: <span className="font-medium text-slate-600">£{d.volume.avg_amount.toFixed(2)}</span></p>
                <p>Drafts: <span className={cn("font-medium",
                  d.volume.draft_count === 0 ? "text-green-600" : "text-amber-600"
                )}>{d.volume.draft_count}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Compliance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Child-linked: <span className={cn("font-medium",
                  d.compliance.child_linked_rate >= 40 ? "text-green-600" :
                  d.compliance.child_linked_rate >= 25 ? "text-amber-600" : "text-red-600"
                )}>{d.compliance.child_linked_rate}%</span></p>
                <p>Controlled pay: <span className={cn("font-medium",
                  (d.compliance.house_card_rate + d.compliance.petty_cash_rate) >= 50 ? "text-green-600" : "text-amber-600"
                )}>{d.compliance.house_card_rate + d.compliance.petty_cash_rate}%</span></p>
                <p>Approvers: <span className={cn("font-medium",
                  d.approval.unique_approvers >= 2 ? "text-green-600" : "text-amber-600"
                )}>{d.approval.unique_approvers}</span></p>
                <p>Pending £: <span className={cn("font-medium",
                  d.approval.pending_amount === 0 ? "text-green-600" : "text-amber-600"
                )}>£{d.approval.pending_amount.toFixed(2)}</span></p>
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

        {/* Cara Expense Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Expense Intelligence
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
