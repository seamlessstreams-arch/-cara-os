"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { FamilySocialConnectivityRating, FamilySocialConnectivityResult } from "@/lib/engines/home-family-social-connectivity-intelligence-engine";

function useHomeFamilySocialConnectivityIntelligence() {
  return useQuery({
    queryKey: ["home-family-social-connectivity-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-family-social-connectivity-intelligence");
      if (!res.ok) throw new Error("Failed to fetch family social connectivity intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

const RATING_META: Record<FamilySocialConnectivityRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 75, inverse = false }: { label: string; value: number | null; warn?: number; inverse?: boolean }) {
  if (value === null) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="font-medium">—</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden" />
      </div>
    );
  }
  const pct = Math.round(value);
  const color = inverse
    ? (pct === 0 ? "bg-emerald-500" : pct <= 10 ? "bg-amber-400" : "bg-red-400")
    : (pct >= warn ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400");
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${inverse && pct > 10 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function FamilySocialConnectivityPage() {
  const { data, isLoading, error } = useHomeFamilySocialConnectivityIntelligence();
  const d = data?.data as FamilySocialConnectivityResult | undefined;

  if (isLoading) {
    return (
      <PageShell title="Family Social Connectivity" description="Analysing family social connectivity…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Family Social Connectivity" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load family social connectivity data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.connectivity_rating];

  return (
    <PageShell
      title="Family Social Connectivity Intelligence"
      description="Contact plan coverage, parental engagement, social worker contact, sibling compliance and child voice (CHR 2015 Reg 5, 8)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Network className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Connectivity score: {d.connectivity_score}/100</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.connectivity_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold">{d.total_sessions}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total sessions</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold">{(d.sessions_per_child ?? 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sessions per child</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className={`text-2xl font-bold ${(d.session_quality_avg ?? 0) >= 7 ? "text-emerald-600" : (d.session_quality_avg ?? 0) >= 5 ? "text-amber-600" : "text-red-500"}`}>
              {(d.session_quality_avg ?? 0).toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg session quality</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Connectivity Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Contact plan coverage" value={d.contact_plan_coverage} warn={90} />
            <RateBar label="Parental engagement (high/medium)" value={d.parent_engagement_rate} />
            <RateBar label="Social worker contact (recent)" value={d.social_worker_contact_rate} warn={90} />
            <RateBar label="Sibling contact compliance" value={d.sibling_contact_compliance} />
            <RateBar label="Child voice captured" value={d.child_voice_capture_rate} />
            <RateBar label="Post-contact distress rate" value={d.post_contact_distress_rate} inverse />
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
          CHR 2015 Reg 5 (consulting children), Reg 8 (contact). Children Act 1989 s.34. SCCIF: &quot;Experiences and progress of children in care.&quot;
        </p>
      </div>
    </PageShell>
  );
}
