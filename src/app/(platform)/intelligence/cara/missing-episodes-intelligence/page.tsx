"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Star, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useHomeMissingEpisodesIntelligence } from "@/hooks/use-home-missing-episodes-intelligence";
import type { HomeMissingEpisodesResult, MissingEpisodesRating } from "@/lib/engines/home-missing-episodes-intelligence-engine";

const RATING_META: Record<MissingEpisodesRating, { label: string; color: string; bg: string; border: string }> = {
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

const TREND_META = {
  improving:        { label: "Improving",          icon: TrendingDown, color: "text-emerald-600" },
  stable:           { label: "Stable",             icon: Minus,        color: "text-blue-600" },
  worsening:        { label: "Worsening",          icon: TrendingUp,   color: "text-red-600" },
  insufficient_data:{ label: "Insufficient Data",  icon: Minus,        color: "text-slate-500" },
} as const;

export default function MissingEpisodesIntelligencePage() {
  const { data, isLoading, error } = useHomeMissingEpisodesIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Missing Episodes Intelligence" description="Analysing missing from care episode data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Missing Episodes Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load missing episodes data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.missing_episodes_rating];
  const ep = d.episodes;
  const pat = d.pattern;
  const TrendIcon = TREND_META[pat.trend].icon;

  return (
    <PageShell
      title="Missing Episodes Intelligence"
      description="Episode volume (90d/180d), high-risk classifications, duration, open episodes, police and LA reporting rates, return interview completion, contextual safeguarding triggers and pattern analysis — the systemic view of missing from care that sits above any individual episode and reveals whether the home is responding to a pattern or just managing events (CHR 2015 Reg 5, 34; Working Together 2023; Runaway and Missing from Home or Care Statutory Guidance 2014)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <AlertTriangle className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Score: {d.missing_episodes_score}/100 · {ep.total_90d} episodes (90d) · {ep.high_risk_count} high-risk · {ep.open_episodes} open · return interview {Math.round(ep.return_interview_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.missing_episodes_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(ep.open_episodes > 0 || ep.high_risk_count > 0 || ep.return_interview_rate < 80 || pat.escalating) && (
          <div className="flex flex-col gap-2">
            {ep.open_episodes > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {ep.open_episodes} open missing episode{ep.open_episodes > 1 ? "s" : ""} — every open episode is an active safeguarding concern; a child who is currently missing may be at risk of exploitation, harm or serious injury
              </div>
            )}
            {ep.high_risk_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {ep.high_risk_count} high-risk episode{ep.high_risk_count > 1 ? "s" : ""} — high-risk classifications require immediate police notification, LA notification within 1 hour, and a strategy discussion; any failure in these timescales is a serious safeguarding failure
              </div>
            )}
            {ep.return_interview_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Return interview rate {Math.round(ep.return_interview_rate)}% — return interviews (ideally by an independent person) are the primary mechanism for understanding what happened when a child was missing; without them the home cannot identify exploitation, abuse or patterns of risk
              </div>
            )}
            {pat.escalating && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                Escalating pattern — episodes are increasing in frequency or duration; this is a strong signal that something is driving missing behaviour that has not yet been adequately understood or addressed
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Episodes (90 days)", value: ep.total_90d, color: ep.total_90d > 5 ? "text-red-600" : ep.total_90d > 0 ? "text-amber-600" : "text-emerald-600" },
            { label: "Episodes (180 days)", value: ep.total_180d, color: ep.total_180d > 10 ? "text-red-600" : "text-foreground" },
            { label: "High-risk episodes", value: ep.high_risk_count, color: ep.high_risk_count > 0 ? "text-red-600" : "text-emerald-600" },
            { label: "Open episodes", value: ep.open_episodes, color: ep.open_episodes > 0 ? "text-red-600" : "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-muted-foreground" /> Response Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Police reported rate (high risk)" value={ep.police_reported_rate} warn={100} />
              <RateBar label="LA reported rate" value={ep.la_reported_rate} warn={100} />
              <RateBar label="Return interview completion rate" value={ep.return_interview_rate} warn={90} />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{ep.avg_duration_hours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">Avg duration</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className={`text-lg font-bold ${ep.longest_duration_hours > 24 ? "text-red-600" : "text-foreground"}`}>{ep.longest_duration_hours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">Longest episode</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className={`text-lg font-bold ${ep.contextual_safeguarding_count > 0 ? "text-amber-600" : "text-foreground"}`}>{ep.contextual_safeguarding_count}</p>
                  <p className="text-xs text-muted-foreground">Contextual SG triggers</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className={`text-lg font-bold ${ep.repeat_children.length > 0 ? "text-amber-600" : "text-foreground"}`}>{ep.repeat_children.length}</p>
                  <p className="text-xs text-muted-foreground">Repeat missing children</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendIcon className={`h-4 w-4 ${TREND_META[pat.trend].color}`} />
                Pattern Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <span className="text-sm">Trend</span>
                <div className={`flex items-center gap-1.5 font-medium text-sm ${TREND_META[pat.trend].color}`}>
                  <TrendIcon className="h-4 w-4" />
                  {TREND_META[pat.trend].label}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <span className="text-sm">Escalating pattern</span>
                <Badge variant="outline" className={pat.escalating ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>
                  {pat.escalating ? "Yes" : "No"}
                </Badge>
              </div>
              {pat.concentrated_child && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-800 font-medium">Concentrated pattern detected</p>
                  <p className="text-xs text-amber-700 mt-1">{pat.concentrated_count} episodes concentrated around one child — this child may need urgent pathway planning, specialist missing from care assessment, or a placement review</p>
                </div>
              )}
              {ep.children_with_episodes.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground font-medium">{ep.children_with_episodes.length} child{ep.children_with_episodes.length > 1 ? "ren" : ""} with recorded episodes</p>
                </div>
              )}
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
          CHR 2015 Regulation 34 (missing from care — the registered person must notify the local authority when a child is missing from the home; there are strict timeframe requirements depending on risk level). Regulation 5 (welfare — missing episodes are a major welfare and safeguarding risk; the home's response, not just the fact of the episode, is what Ofsted will scrutinise). Statutory Guidance on Children who Run Away or Go Missing from Home or Care (DfE 2014) — all missing episodes require a return home interview, ideally by an independent person, and a reflective discussion with the staff team. Working Together to Safeguard Children (2023) — missing from care is identified as a key indicator of contextual safeguarding and exploitation risk. Concentrated patterns around specific children, escalating trends, and low return interview rates are the three most frequently cited concerns by Ofsted inspectors and LADO reviewers in serious case reviews involving missing children.
        </p>
      </div>
    </PageShell>
  );
}
