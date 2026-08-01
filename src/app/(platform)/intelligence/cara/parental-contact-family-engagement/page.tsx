"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { FamilyEngagementRating, ParentalContactFamilyEngagementResult } from "@/lib/engines/home-parental-contact-family-engagement-intelligence-engine";

function useHomeParentalContactFamilyEngagementIntelligence() {
  return useQuery({
    queryKey: ["home-parental-contact-family-engagement-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-parental-contact-family-engagement-intelligence");
      if (!res.ok) throw new Error("Failed to fetch parental contact family engagement intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

const RATING_META: Record<FamilyEngagementRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 80 }: { label: string; value: number | null; warn?: number }) {
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
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ParentalContactFamilyEngagementPage() {
  const { data, isLoading, error } = useHomeParentalContactFamilyEngagementIntelligence();
  const d = data?.data as ParentalContactFamilyEngagementResult | undefined;

  if (isLoading) {
    return (
      <PageShell title="Parental Contact & Family Engagement" description="Analysing parental contact and family engagement…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Parental Contact & Family Engagement" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load parental contact data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.engagement_rating];

  return (
    <PageShell
      title="Parental Contact & Family Engagement Intelligence"
      description="Contact compliance, family visit quality, supervised contact adherence and parent participation (CHR 2015 Reg 5, 6, 8)."
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
                <p className="text-xs text-muted-foreground mt-0.5">Engagement score: {d.engagement_score}/100</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.engagement_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold">{d.total_scheduled_contacts}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Scheduled contacts</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold">{d.total_family_visits}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Family visits</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold">{d.total_supervised_sessions}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Supervised sessions</p>
          </div>
        </div>

        {/* Core rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contact Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Contact compliance" value={d.contact_compliance_rate} warn={90} />
              <RateBar label="Family visit quality" value={d.family_visit_quality_rate} />
              <RateBar label="Contact quality (avg)" value={d.contact_quality_avg} />
              <RateBar label="Visit risk assessment" value={d.visit_risk_assessment_rate} warn={90} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Parental Participation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Parental engagement (high/medium)" value={d.parental_engagement_rate} />
              <RateBar label="Parent invitation rate" value={d.parent_invitation_rate} />
              <RateBar label="Parent views incorporated" value={d.parent_views_incorporation_rate} />
              <RateBar label="Family support attendance" value={d.family_support_attendance_rate} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Supervised Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Supervision adherence" value={d.supervised_contact_adherence_rate} warn={95} />
              <RateBar label="Boundary adherence" value={d.supervised_boundary_adherence_rate} warn={95} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Child Voice & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Child voice in contact" value={d.child_voice_in_contact_rate} />
              <RateBar label="Family support coverage" value={d.family_support_coverage_rate} />
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
          CHR 2015 Reg 5 (consulting children), Reg 6 (quality of care), Reg 8 (contact). Children Act 1989 s.34. SCCIF: "Experiences and progress of children in care."
        </p>
      </div>
    </PageShell>
  );
}
