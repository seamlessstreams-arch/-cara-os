"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomePeerDynamicsIntelligence } from "@/hooks/use-home-peer-dynamics-intelligence";
import type { HomePeerDynamicsResult, PeerDynamicsRating } from "@/lib/engines/home-peer-dynamics-intelligence-engine";

const RATING_META: Record<PeerDynamicsRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

export default function PeerDynamicsIntelligencePage() {
  const { data, isLoading, error } = useHomePeerDynamicsIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Peer Dynamics Intelligence" description="Analysing peer relationship and group dynamics data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Peer Dynamics Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load peer dynamics data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.peer_rating];
  const rel = d.relationships;
  const risk = d.risks;
  const grp = d.group_profile;
  const strat = d.strategy_profile;
  const entry = d.entry_profile;
  const rev = d.review_profile;

  const atmosphereColor =
    grp.latest_atmosphere === "volatile" ? "text-red-600 bg-red-50 border-red-200" :
    grp.latest_atmosphere === "tense"    ? "text-amber-600 bg-amber-50 border-amber-200" :
    grp.latest_atmosphere === "mixed"    ? "text-blue-600 bg-blue-50 border-blue-200" :
    "text-emerald-600 bg-emerald-50 border-emerald-200";

  return (
    <PageShell
      title="Peer Dynamics Intelligence"
      description="Peer relationship quality across all pairs, conflict and high-risk relationships, group atmosphere, strategy coverage, entry observations, and review currency — evidencing that the home actively manages peer dynamics as a therapeutic and safeguarding domain rather than treating conflict as inevitable (CHR 2015 Reg 5; matching and placement decisions; SCCIF peer relationships)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Users className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Peer score: {d.peer_score}/100 · {rel.total_pairs} pairs · positive {rel.positive_count} · conflicted {rel.conflicted_count} · high risk {risk.high_count} · group: {grp.latest_atmosphere || "unknown"} · strategies: {strat.pairs_needing_strategies} need one
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.peer_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(risk.high_count > 0 || rel.conflicted_count > 0 || strat.pairs_needing_strategies > 0 || grp.latest_atmosphere === "volatile") && (
          <div className="flex flex-col gap-2">
            {risk.high_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {risk.high_count} high-risk peer relationship{risk.high_count > 1 ? "s" : ""} — high-risk peer dynamics require immediate escalation to the placing authority and a formal review of whether the placement remains appropriate; peer-on-peer abuse is a safeguarding concern, not just a behavioural one
              </div>
            )}
            {grp.latest_atmosphere === "volatile" && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Latest group atmosphere assessment: volatile — a volatile group environment is a direct risk to children's safety and wellbeing; this requires immediate therapeutic intervention and a review of placement matching
              </div>
            )}
            {strat.pairs_needing_strategies > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {strat.pairs_needing_strategies} strained or conflicted pair{strat.pairs_needing_strategies > 1 ? "s" : ""} without a strategy — conflict without a management plan is unmanaged risk; every high-tension pair needs a recorded approach
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Relationship Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-600">{rel.positive_count}</p>
                  <p className="text-xs text-muted-foreground">Positive</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{rel.developing_count}</p>
                  <p className="text-xs text-muted-foreground">Developing</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{rel.neutral_count}</p>
                  <p className="text-xs text-muted-foreground">Neutral</p>
                </div>
                <div className={`rounded border p-2 text-center ${rel.strained_count > 0 ? "border-amber-200 bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${rel.strained_count > 0 ? "text-amber-600" : "text-foreground"}`}>{rel.strained_count}</p>
                  <p className="text-xs text-muted-foreground">Strained</p>
                </div>
                <div className={`rounded border p-2 text-center ${rel.conflicted_count > 0 ? "border-red-200 bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${rel.conflicted_count > 0 ? "text-red-600" : "text-foreground"}`}>{rel.conflicted_count}</p>
                  <p className="text-xs text-muted-foreground">Conflicted</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{rel.total_pairs}</p>
                  <p className="text-xs text-muted-foreground">Total pairs</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "None", value: risk.none_count, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                  { label: "Low", value: risk.low_count, color: "text-blue-600 bg-blue-50 border-blue-200" },
                  { label: "Medium", value: risk.medium_count, color: "text-amber-600 bg-amber-50 border-amber-200" },
                  { label: "High", value: risk.high_count, color: "text-red-600 bg-red-50 border-red-200" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded border p-1.5 text-center ${color}`}>
                    <p className="text-base font-bold">{value}</p>
                    <p className="text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Group & Strategies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grp.latest_atmosphere && (
                <div className={`flex items-center justify-between rounded border px-3 py-2 ${atmosphereColor}`}>
                  <span className="text-xs font-medium">Latest group atmosphere</span>
                  <span className="text-sm font-bold capitalize">{grp.latest_atmosphere}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-600">{grp.calm_count}</p>
                  <p className="text-xs text-muted-foreground">Calm assessments</p>
                </div>
                <div className={`rounded border p-2 text-center ${grp.volatile_count > 0 ? "border-red-200 bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${grp.volatile_count > 0 ? "text-red-600" : "text-foreground"}`}>{grp.volatile_count}</p>
                  <p className="text-xs text-muted-foreground">Volatile assessments</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{strat.total_strategies}</p>
                  <p className="text-xs text-muted-foreground">Total strategies</p>
                </div>
                <div className={`rounded border p-2 text-center ${strat.pairs_needing_strategies > 0 ? "border-amber-200 bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${strat.pairs_needing_strategies > 0 ? "text-amber-600" : "text-emerald-600"}`}>{strat.pairs_needing_strategies}</p>
                  <p className="text-xs text-muted-foreground">Need strategy</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{entry.total_entries}</p>
                  <p className="text-xs text-muted-foreground">Log entries</p>
                </div>
                <div className={`rounded border p-2 text-center ${rev.overdue_reviews > 0 ? "border-amber-200 bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${rev.overdue_reviews > 0 ? "text-amber-600" : "text-foreground"}`}>{rev.overdue_reviews}</p>
                  <p className="text-xs text-muted-foreground">Overdue reviews</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{rev.avg_days_since_review}</p>
                  <p className="text-xs text-muted-foreground">Avg days/review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
          CHR 2015 Regulation 5 (welfare) — the registered person must take into account how the placement of each child affects the welfare of all other children in the home; this is the formal basis for peer dynamics assessment as a safeguarding function, not merely a therapeutic one. SCCIF — inspectors assess whether "the home manages peer relationships proactively and therapeutically." Peer-on-peer abuse guidance (DfE, 2023) — residential homes must have policies and processes for identifying and responding to peer-on-peer abuse, including harmful sexual behaviour; a child who is harmed by a peer is not less harmed because the harm came from a peer rather than an adult. Placement matching decisions should be informed by peer dynamics data — placing a child into a volatile or high-risk peer group is a decision that requires careful risk assessment and justification. Homes with high rates of conflicted or high-risk peer pairs, no management strategies, and no regular group assessments are placing children at risk.
        </p>
      </div>
    </PageShell>
  );
}
