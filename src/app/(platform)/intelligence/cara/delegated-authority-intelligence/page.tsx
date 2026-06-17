"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyRound, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeDelegatedAuthorityIntelligence } from "@/hooks/use-home-delegated-authority-intelligence";
import type {
  DelegatedAuthorityRating,
  HomeDelegatedAuthorityResult,
} from "@/lib/engines/home-delegated-authority-intelligence-engine";

const RATING_META: Record<DelegatedAuthorityRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function DelegatedAuthorityIntelligencePage() {
  const { data, isLoading, error } = useHomeDelegatedAuthorityIntelligence();
  const d: HomeDelegatedAuthorityResult | undefined = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Delegated Authority Intelligence" description="Analysing delegated authority data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Delegated Authority Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load delegated authority data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.authority_rating];
  const sp = d.status_profile;
  const cc = d.category_coverage;
  const chc = d.child_coverage;
  const rp = d.review_profile;

  return (
    <PageShell
      title="Delegated Authority Intelligence"
      description="Delegated authority coverage, category gaps, child coverage, review timeliness and consent recording (CHR 2015 Reg 5; The Care Planning, Placement and Case Review Regulations 2010 Reg 4; IRO handbook)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <KeyRound className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Score: {d.authority_score}/100 · {sp.total_items} authorities · {sp.granted_rate}% granted · {chc.coverage_rate}% children covered
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.authority_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(rp.reviews_overdue > 0 || chc.children_without_authority > 0) && (
          <div className="flex flex-col gap-2">
            {rp.reviews_overdue > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {rp.reviews_overdue} delegated authorit{rp.reviews_overdue !== 1 ? "ies" : "y"} overdue for review
              </div>
            )}
            {chc.children_without_authority > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {chc.children_without_authority} child{chc.children_without_authority !== 1 ? "ren" : ""} without any delegated authority recorded
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Authority Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{sp.granted}</p>
                  <p className="text-xs text-muted-foreground">Granted</p>
                </div>
                <div className="rounded border bg-red-50 p-2 text-center">
                  <p className="text-lg font-bold text-red-700">{sp.not_granted}</p>
                  <p className="text-xs text-muted-foreground">Not granted</p>
                </div>
                <div className="rounded border bg-amber-50 p-2 text-center">
                  <p className="text-lg font-bold text-amber-700">{sp.partial}</p>
                  <p className="text-xs text-muted-foreground">Partial</p>
                </div>
                <div className="rounded border bg-blue-50 p-2 text-center">
                  <p className="text-lg font-bold text-blue-700">{sp.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
              <RateBar label="Granted rate" value={sp.granted_rate} warn={70} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Review Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded border p-2 text-center ${rp.reviews_overdue > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${rp.reviews_overdue > 0 ? "text-red-700" : "text-foreground"}`}>{rp.reviews_overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className={`rounded border p-2 text-center ${rp.reviews_due_soon > 0 ? "bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${rp.reviews_due_soon > 0 ? "text-amber-700" : "text-foreground"}`}>{rp.reviews_due_soon}</p>
                  <p className="text-xs text-muted-foreground">Due soon</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Avg days since review</span>
                <span className={`font-medium ${rp.avg_days_since_review <= 90 ? "text-emerald-600" : "text-amber-600"}`}>{Math.round(rp.avg_days_since_review)}d</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Category coverage</span>
                <span className={`font-medium ${cc.coverage_rate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{cc.coverage_rate}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {cc.gaps.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-800 mb-2">Category gaps</p>
            <div className="flex flex-wrap gap-1.5">
              {cc.gaps.map((gap) => (
                <Badge key={gap} variant="outline" className="text-xs border-amber-300 text-amber-800 bg-white">{gap}</Badge>
              ))}
            </div>
          </div>
        )}

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
                  rec.urgency === "soon"       ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200";
                return (
                  <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{rec.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{rec.recommendation}</p>
                      {rec.regulatory_ref && <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>}
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{rec.urgency}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          CHR 2015 Reg 5 (fitness). Care Planning Regulations 2010 Reg 4. IRO handbook. Delegated authority: a guide (DfE 2017). Narey Review recommendations on corporate parenting.
        </p>
      </div>
    </PageShell>
  );
}
