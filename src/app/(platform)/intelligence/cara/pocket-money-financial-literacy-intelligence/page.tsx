"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomePocketMoneyFinancialLiteracyIntelligence } from "@/hooks/use-home-pocket-money-financial-literacy-intelligence";
import type { PocketMoneyFinancialLiteracyResult, FinancialLiteracyRating } from "@/lib/engines/home-pocket-money-financial-literacy-intelligence-engine";

const RATING_META: Record<FinancialLiteracyRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 80 }: { label: string; value: number; warn?: number }) {
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 50 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PocketMoneyFinancialLiteracyIntelligencePage() {
  const { data: raw, isLoading, error } = useHomePocketMoneyFinancialLiteracyIntelligence();
  const d = (raw as { data?: PocketMoneyFinancialLiteracyResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Pocket Money & Financial Literacy" description="Analysing financial literacy programme and money management data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Pocket Money & Financial Literacy" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load pocket money financial literacy data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.financial_rating];

  return (
    <PageShell
      title="Pocket Money & Financial Literacy"
      description="Pocket money compliance, savings programme engagement, financial education rates, budgeting coverage, money handling accuracy, and child autonomy in financial decisions — evidencing that the home actively builds financial literacy as a life-skills outcome rather than simply distributing allowances (CHR 2015 Reg 5; Preparing for Adulthood framework; care leavers financial capability research)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <BookOpen className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Financial score: {d.financial_score}/100 · {d.total_pocket_money_records} records · {d.total_savings_programmes} savings programmes · {d.total_financial_education_sessions} education sessions · {d.total_budgeting_records} budgeting · autonomy {Math.round(d.child_autonomy_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.financial_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.savings_engagement_rate < 50 || d.financial_education_rate < 50 || d.budgeting_coverage_rate < 50) && (
          <div className="flex flex-col gap-2">
            {d.financial_education_rate < 50 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Financial education rate {Math.round(d.financial_education_rate)}% — care leavers consistently identify financial management as one of the areas where they feel least prepared for independence; homes that do not provide financial education are failing to equip children for one of the most concrete challenges of adult life
              </div>
            )}
            {d.savings_engagement_rate < 50 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Savings programme engagement {Math.round(d.savings_engagement_rate)}% — savings habits developed in childhood and adolescence are protective in adult life; a home that does not support children to save is missing a significant opportunity to build long-term financial resilience
              </div>
            )}
            {d.budgeting_coverage_rate < 50 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Budgeting coverage {Math.round(d.budgeting_coverage_rate)}% — budgeting is not just a practical skill; it is a form of agency and self-determination; supporting children to manage a budget (however small) gives them control and responsibility in an environment where many things are outside their control
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Pocket money records", value: d.total_pocket_money_records, color: "text-blue-600" },
            { label: "Savings programmes", value: d.total_savings_programmes, color: "text-foreground" },
            { label: "Education sessions", value: d.total_financial_education_sessions, color: "text-emerald-600" },
            { label: "Budgeting records", value: d.total_budgeting_records, color: "text-foreground" },
            { label: "Money handling records", value: d.total_money_handling_records, color: "text-foreground" },
            { label: "Child autonomy rate", value: `${Math.round(d.child_autonomy_rate)}%`, color: d.child_autonomy_rate >= 70 ? "text-emerald-600" : d.child_autonomy_rate >= 50 ? "text-amber-600" : "text-red-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> Financial Literacy Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Pocket money compliance rate" value={d.pocket_money_compliance_rate} warn={95} />
            <RateBar label="Savings programme engagement" value={d.savings_engagement_rate} warn={60} />
            <RateBar label="Financial education rate" value={d.financial_education_rate} warn={70} />
            <RateBar label="Budgeting coverage rate" value={d.budgeting_coverage_rate} warn={60} />
            <RateBar label="Money handling accuracy rate" value={d.money_handling_accuracy_rate} warn={90} />
            <RateBar label="Child autonomy rate" value={d.child_autonomy_rate} warn={65} />
          </CardContent>
        </Card>

        {d.insights.length > 0 && (
          <div className="space-y-2">
            {d.insights.map((ins, i) => {
              const cls =
                ins.severity === "critical" ? "bg-red-50 border-red-200 text-red-800" :
                ins.severity === "warning"  ? "bg-amber-50 border-amber-200 text-amber-800" :
                "bg-emerald-50 border-emerald-200 text-emerald-800";
              return (
                <div key={i} className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${cls}`}>
                  {ins.severity === "critical" ? <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   ins.severity === "positive"  ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />}
                  {ins.text}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {d.strengths.length > 0 && (
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.strengths.map((s, i) => (
                    <li key={i} className="text-xs flex gap-2"><Star className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {d.concerns.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.concerns.map((c, i) => (
                    <li key={i} className="text-xs flex gap-2"><AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {d.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {d.recommendations.map((rec) => {
                const urgencyColor =
                  rec.urgency === "immediate" ? "bg-red-100 text-red-700 border-red-200" :
                  rec.urgency === "soon"      ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200";
                return (
                  <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{rec.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{rec.recommendation}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{rec.urgency}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          The Preparing for Adulthood Framework (DfE, 2018) identifies financial capability as a core domain for children in care preparing for independence, alongside housing, employment, relationships, and health. Research consistently shows that care leavers are disproportionately at risk of financial exploitation, debt, and poverty in early adulthood (APPG for Looked After Children, 2019); financial literacy skills developed during their time in residential care are a direct protective factor against these outcomes. CHR 2015 Regulation 5 — the registered person must promote each child's social, emotional, and educational development; financial literacy sits squarely within this remit. The Pathway Plan (under Leaving Care Act 2000 and Children Act 1989) requires that a child's preparation for independence includes financial management; the home's record of financial education, savings, and budgeting support directly evidences this preparation. Children who manage their own money (with appropriate support) develop agency, self-worth, and practical skills simultaneously — financial literacy is not a technical training exercise but a form of empowerment.
        </p>
      </div>
    </PageShell>
  );
}
