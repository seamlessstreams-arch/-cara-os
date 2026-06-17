"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersRound, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeFriendshipSocialNetworkIntelligence } from "@/hooks/use-home-friendship-social-network-intelligence";
import type { FriendshipSocialResult, FriendshipSocialRating } from "@/lib/engines/home-friendship-social-network-intelligence-engine";

const RATING_META: Record<FriendshipSocialRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 75 }: { label: string; value: number; warn?: number }) {
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 45 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 45 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function FriendshipSocialNetworkIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeFriendshipSocialNetworkIntelligence();
  const d = (raw as { data?: FriendshipSocialResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Friendship & Social Network" description="Analysing friendship and social network data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Friendship & Social Network" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load friendship and social network data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.friendship_rating];

  return (
    <PageShell
      title="Friendship & Social Network"
      description="Friendship mapping, social network quality, peer support, isolation prevention, child confidence and loneliness indicators — understanding and nurturing each child's social world as a fundamental protective factor (CHR 2015 Reg 9; NMS 3; UN CRC Articles 15, 29, 31)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <UsersRound className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Friendship score: {d.friendship_score}/100 · {d.total_mappings} mappings · isolation high risk {d.isolation_high_risk_count} · avg friends {d.avg_friends_per_child.toFixed(1)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.friendship_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.isolation_high_risk_count > 0 || d.loneliness_rate > 30 || d.isolation_prevention_rate < 60) && (
          <div className="flex flex-col gap-2">
            {d.isolation_high_risk_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {d.isolation_high_risk_count} child{d.isolation_high_risk_count > 1 ? "ren" : ""} at high risk of isolation — active social support planning required
              </div>
            )}
            {d.loneliness_rate > 30 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Loneliness rate {Math.round(d.loneliness_rate)}% — loneliness is a significant wellbeing and safeguarding risk for looked-after children
              </div>
            )}
            {d.isolation_prevention_rate < 60 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Isolation prevention rate only {Math.round(d.isolation_prevention_rate)}% — review planned social activities and peer integration support
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total mappings", value: d.total_mappings, color: "text-blue-600" },
            { label: "Avg friends per child", value: d.avg_friends_per_child.toFixed(1), color: d.avg_friends_per_child >= 3 ? "text-emerald-600" : d.avg_friends_per_child >= 1 ? "text-amber-600" : "text-red-600" },
            { label: "Avg friendship quality", value: `${d.avg_friendship_quality.toFixed(1)}/10`, color: d.avg_friendship_quality >= 7 ? "text-emerald-600" : d.avg_friendship_quality >= 5 ? "text-amber-600" : "text-red-600" },
            { label: "Isolation high risk", value: d.isolation_high_risk_count, color: d.isolation_high_risk_count > 0 ? "text-red-600" : "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-muted-foreground" />
              Social Network Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Friendship mapping rate" value={d.friendship_mapping_rate} warn={80} />
            <RateBar label="Social network rate" value={d.social_network_rate} warn={75} />
            <RateBar label="Peer support rate" value={d.peer_support_rate} warn={70} />
            <RateBar label="Isolation prevention rate" value={d.isolation_prevention_rate} warn={75} />
            <RateBar label="Child satisfaction rate" value={d.child_satisfaction_rate} warn={70} />
            <RateBar label="Child confidence rate" value={d.child_confidence_rate} warn={70} />
            <RateBar label="Network positivity rate" value={d.network_positivity_rate} warn={70} />
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
          CHR 2015 Regulation 9 (Promoting healthy development — social relationships). NMS 3 (Quality of Care — social development). UN CRC Articles 15 (freedom of association), 29 (social development), 31 (leisure and play). Children who have experienced trauma are at disproportionate risk of social isolation — friendship is not a luxury, it is a therapeutic necessity and a protective factor against exploitation.
        </p>
      </div>
    </PageShell>
  );
}
