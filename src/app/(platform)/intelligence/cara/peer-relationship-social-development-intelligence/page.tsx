"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomePeerRelationshipSocialDevelopmentIntelligence } from "@/hooks/use-home-peer-relationship-social-development-intelligence";
import type { PeerRelationshipSocialDevelopmentResult, PeerRelationshipRating } from "@/lib/engines/home-peer-relationship-social-development-intelligence-engine";

const RATING_META: Record<PeerRelationshipRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function PeerRelationshipSocialDevelopmentIntelligencePage() {
  const { data: raw, isLoading, error } = useHomePeerRelationshipSocialDevelopmentIntelligence();
  const d = (raw as { data?: PeerRelationshipSocialDevelopmentResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Peer Relationship & Social Development" description="Analysing peer relationship and social development data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Peer Relationship & Social Development" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load peer relationship social development data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.peer_rating];

  return (
    <PageShell
      title="Peer Relationship & Social Development"
      description="Social skills programme engagement, bullying resolution rates, friendship plan coverage, social activity participation, child voice in planning, relationship quality scores, social confidence, and goal achievement — evidencing structured, proactive social development provision for every child (CHR 2015 Reg 5; NMS 1, 2; social pedagogy framework)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <UserCheck className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Peer score: {d.peer_score}/100 · {d.total_assessments} assessments · {d.total_bullying_incidents} bullying incidents · resolution {Math.round(d.bullying_resolution_rate)}% · friendship plans {Math.round(d.friendship_plan_coverage_rate)}% · avg quality {d.average_relationship_quality.toFixed(1)}/5
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.peer_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.bullying_resolution_rate < 80 || d.child_voice_in_plans_rate < 60 || d.friendship_plan_coverage_rate < 50) && (
          <div className="flex flex-col gap-2">
            {d.bullying_resolution_rate < 80 && d.total_bullying_incidents > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Bullying resolution rate {Math.round(d.bullying_resolution_rate)}% — unresolved bullying incidents leave children experiencing ongoing harm; every unresolved case requires escalation and a documented management plan
              </div>
            )}
            {d.child_voice_in_plans_rate < 60 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Child voice in plans only {Math.round(d.child_voice_in_plans_rate)}% — social development plans created without the child's input are unlikely to address what the child actually needs or finds valuable in their social world
              </div>
            )}
            {d.friendship_plan_coverage_rate < 50 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Friendship plan coverage {Math.round(d.friendship_plan_coverage_rate)}% — friendship and social connection are protective factors against isolation, which is itself a safeguarding risk; low plan coverage indicates social development is not being actively supported
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Assessments", value: d.total_assessments, color: "text-blue-600" },
            { label: "Programmes", value: d.total_programmes, color: "text-foreground" },
            { label: "Bullying incidents", value: d.total_bullying_incidents, color: d.total_bullying_incidents > 0 ? "text-amber-600" : "text-foreground" },
            { label: "Friendship plans", value: d.total_friendship_plans, color: "text-foreground" },
            { label: "Social activities", value: d.total_social_activities, color: "text-emerald-600" },
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
              <CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-muted-foreground" /> Coverage & Safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Peer assessment coverage" value={d.peer_assessment_coverage_rate} warn={90} />
              <RateBar label="Friendship plan coverage" value={d.friendship_plan_coverage_rate} warn={80} />
              <RateBar label="Child voice in plans" value={d.child_voice_in_plans_rate} warn={80} />
              <RateBar label="Bullying resolution rate" value={d.bullying_resolution_rate} warn={100} />
              <RateBar label="Bullying investigation rate" value={d.bullying_investigation_rate} warn={100} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-muted-foreground" /> Development & Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Social skills programme engagement" value={d.social_skills_engagement_rate} warn={70} />
              <RateBar label="Social activity participation" value={d.social_activity_participation_rate} warn={80} />
              <RateBar label="Programme attendance rate" value={d.programme_attendance_rate} warn={80} />
              <RateBar label="Friendship goal achievement" value={d.friendship_goal_achievement_rate} warn={70} />
              <RateBar label="Activity enjoyment rate" value={d.activity_enjoyment_rate} warn={75} />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className={`text-lg font-bold ${d.average_relationship_quality >= 4 ? "text-emerald-600" : d.average_relationship_quality >= 3 ? "text-amber-600" : "text-red-600"}`}>{d.average_relationship_quality.toFixed(1)}/5</p>
                  <p className="text-xs text-muted-foreground">Avg relationship quality</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className={`text-lg font-bold ${d.average_social_confidence >= 4 ? "text-emerald-600" : d.average_social_confidence >= 3 ? "text-amber-600" : "text-red-600"}`}>{d.average_social_confidence.toFixed(1)}/5</p>
                  <p className="text-xs text-muted-foreground">Avg social confidence</p>
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
          CHR 2015 Regulation 5 (welfare — the registered person must promote each child's social development, including their ability to form appropriate relationships with peers) and NMS Standard 1 (Individual care — the care plan reflects what the child needs to develop socially and to build healthy peer relationships). NMS Standard 2 (The home provides activities and opportunities for children to develop their social skills and peer relationships). Social pedagogy framework — the concept of the "common third" (activities shared between adults and children) is a foundation of good social development practice in residential care; social skills programmes are most effective when they emerge from genuine relational activity rather than structured curriculum. Anti-bullying policy and response: KCSIE (2024) applies to residential children's homes as well as schools; a home that records bullying incidents without investigating or resolving them is failing the victim. The difference between recording and responding to bullying is the difference between evidence-gathering and safeguarding.
        </p>
      </div>
    </PageShell>
  );
}
