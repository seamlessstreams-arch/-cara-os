"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { SiblingContactRating, SiblingContactResult } from "@/lib/engines/home-sibling-contact-relationships-intelligence-engine";

// ── Rating helpers ─────────────────────────────────────────────────────────────

const RATING_META: Record<SiblingContactRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

// ── Rate bar ───────────────────────────────────────────────────────────────────

function RateBar({ label, value, total, warn = 80 }: { label: string; value: number | null; total?: number; warn?: number }) {
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
  const color = pct >= warn ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          {total !== undefined && <span className="text-muted-foreground/70">({total} records)</span>}
          <span className="font-medium text-foreground">{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SiblingContactIntelligencePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["home-sibling-contact-relationships-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-sibling-contact-relationships-intelligence");
      if (!res.ok) throw new Error("Failed to fetch sibling contact relationships intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
  const d = data?.data as SiblingContactResult | undefined;

  if (isLoading) {
    return (
      <PageShell title="Sibling Contact Intelligence" description="Analysing sibling contact and relationship data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Sibling Contact Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load sibling contact data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.sibling_rating];

  return (
    <PageShell
      title="Sibling Contact Intelligence"
      description="Sibling placement considerations, contact facilitation, relationship quality and child wishes (CHR 2015 Reg 5; Children Act 1989 s.23(7))."
    >
      <div className="space-y-6">

        {/* Rating banner */}
        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Heart className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sibling contact score: {d.sibling_score}/100</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{d.sibling_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview stats */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: "Placement records", value: d.total_placement_records },
            { label: "Contact records", value: d.total_contact_records },
            { label: "Assessments", value: d.total_assessment_records },
            { label: "Events", value: d.total_event_records },
            { label: "Wishes records", value: d.total_wishes_records },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-2 text-center">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Sibling metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Sibling Relationship Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Placement considered sibling needs" value={d.placement_consideration_rate} total={d.total_placement_records} />
            <RateBar label="Contact facilitated" value={d.contact_facilitation_rate} total={d.total_contact_records} />
            <RateBar label="Positive relationship quality" value={d.relationship_quality_rate} total={d.total_assessment_records} />
            <RateBar label="Sibling event participation" value={d.event_participation_rate} total={d.total_event_records} />
            <RateBar label="Child wishes recorded" value={d.child_wishes_rate} total={d.total_wishes_records} />
            <RateBar label="Child satisfaction" value={d.child_satisfaction_rate} />
          </CardContent>
        </Card>

        {/* Insights */}
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

        {/* Strengths + Concerns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {d.strengths.length > 0 && (
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-2">
                      <Star className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {d.concerns.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.concerns.map((c, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.recommendations.map((rec) => {
                const urgencyColor =
                  rec.urgency === "immediate" ? "bg-red-100 text-red-700 border-red-200" :
                  rec.urgency === "soon"       ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200";
                return (
                  <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {rec.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{rec.recommendation}</p>
                      {rec.regulatory_ref && (
                        <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>
                      {rec.urgency}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          Children Act 1989 s.23(7) — duty to promote contact with siblings. CHR 2015 Reg 5 (engaging children). SCCIF: &quot;Experiences and progress of children in care.&quot;
        </p>
      </div>
    </PageShell>
  );
}
