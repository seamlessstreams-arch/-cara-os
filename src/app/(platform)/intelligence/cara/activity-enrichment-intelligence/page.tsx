"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeActivityEnrichmentIntelligence } from "@/hooks/use-home-activity-enrichment-intelligence";
import type { EnrichmentRating } from "@/lib/engines/home-activity-enrichment-intelligence-engine";

const RATING_META: Record<EnrichmentRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 70 }: { label: string; value: number; warn?: number }) {
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 40 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ActivityEnrichmentIntelligencePage() {
  const { data, isLoading, error } = useHomeActivityEnrichmentIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Activity & Enrichment Intelligence" description="Analysing activity and enrichment data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Activity & Enrichment Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load activity enrichment data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.enrichment_rating];
  const prov = d.provision;

  return (
    <PageShell
      title="Activity & Enrichment Intelligence"
      description="Activity provision, new experiences, child-led choices and category diversity (CHR 2015 Reg 9; UN CRC Article 31 — right to play; SCCIF — day-to-day life; Ofsted ILACS)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Sparkles className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enrichment score: {d.enrichment_score}/100 · {prov.total_activities_30d} activities (30d) · {prov.avg_per_child_30d.toFixed(1)} per child · {prov.unique_categories_30d} categories
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.enrichment_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {d.children_without_activities.length > 0 && (
          <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            {d.children_without_activities.length} child(ren) with no recorded activities in 30 days — consider individual enrichment plan
          </div>
        )}

        {/* Provision summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold">{prov.total_activities_7d}</p>
            <p className="text-xs text-muted-foreground mt-1">Activities (7d)</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{prov.new_experiences_30d}</p>
            <p className="text-xs text-muted-foreground mt-1">New experiences</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{prov.yp_suggested_30d}</p>
            <p className="text-xs text-muted-foreground mt-1">YP-suggested</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold">{prov.unique_staff_leading}</p>
            <p className="text-xs text-muted-foreground mt-1">Staff leading</p>
          </div>
        </div>

        {/* Category breakdown */}
        {d.category_breakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Activity Categories (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {d.category_breakdown.sort((a, b) => b.count - a.count).map((cat) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 flex-shrink-0 capitalize">{cat.category.replace(/_/g, " ")}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${cat.percentage}%` }} />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{cat.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Child profiles */}
        {d.child_profiles.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  Child Participation Profiles
                </CardTitle>
                <Badge variant="outline" className="text-xs">{d.child_profiles.length} children</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {d.child_profiles.map((cp) => (
                  <div key={cp.child_id} className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{cp.child_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{cp.activities_30d} activities</Badge>
                        <Badge variant="outline" className={`text-xs ${cp.activity_score >= 7 ? "border-emerald-200 text-emerald-700" : cp.activity_score >= 4 ? "border-amber-200 text-amber-700" : "border-red-200 text-red-700"}`}>
                          {cp.activity_score.toFixed(0)}/10
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{cp.new_experiences_30d} new experiences</span>
                      <span>{cp.categories_accessed.length} categories</span>
                      <span className={cp.enthusiasm_rate >= 70 ? "text-emerald-600" : "text-amber-600"}>{Math.round(cp.enthusiasm_rate)}% enthusiasm</span>
                    </div>
                    {cp.flags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cp.flags.map((f, i) => (
                          <span key={i} className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
          CHR 2015 Reg 9 (children's leisure activities). UN CRC Article 31 (right to play and leisure). SCCIF — day-to-day life standard. Ofsted ILACS: quality of care and enrichment.
        </p>
      </div>
    </PageShell>
  );
}
