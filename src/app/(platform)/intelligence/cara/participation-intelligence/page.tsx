"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeParticipationIntelligence } from "@/hooks/use-home-participation-intelligence";
import type { HomeParticipationResult, ParticipationRating } from "@/lib/engines/home-participation-intelligence-engine";

const RATING_META: Record<ParticipationRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function ParticipationIntelligencePage() {
  const { data, isLoading, error } = useHomeParticipationIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Participation Intelligence" description="Analysing children's participation and voice data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Participation Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load participation data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.participation_rating];
  const mp = d.meeting_profile;
  const ep = d.engagement_profile;

  return (
    <PageShell
      title="Participation Intelligence"
      description="Children's participation meeting frequency, attendance, child-raised agenda items, feedback quality, action completion rates, and children never attending — evidencing that children have genuine influence over the decisions that affect their lives rather than passive participation in adult-led processes (CHR 2015 Reg 5; UN CRC Article 12; NMS 7)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <MessageSquare className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Participation score: {d.participation_score}/100 · voice score {ep.child_voice_score}/100 · {mp.total_meetings_90d} meetings (90d) · attendance {Math.round(mp.avg_attendance_rate)}% · child-raised {Math.round(mp.avg_child_raised_rate)}% · actions {Math.round(mp.action_completion_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.participation_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(mp.children_never_attended.length > 0 || mp.avg_child_raised_rate < 30 || mp.total_meetings_90d === 0) && (
          <div className="flex flex-col gap-2">
            {mp.total_meetings_90d === 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                No participation meetings recorded in the last 90 days — children's statutory right to be heard requires structured, regular opportunities; the absence of meetings means children have no formal mechanism to influence decisions about their home
              </div>
            )}
            {mp.children_never_attended.length > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {mp.children_never_attended.length} child{mp.children_never_attended.length > 1 ? "ren have" : " has"} never attended a participation meeting — non-attendance should never be treated as disengagement without first exploring why the child is not coming and whether the meetings are accessible and meaningful to them
              </div>
            )}
            {mp.avg_child_raised_rate < 30 && mp.total_meetings_90d > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Children raise only {Math.round(mp.avg_child_raised_rate)}% of agenda items — meetings where adults set the entire agenda are adult-led consultations, not genuine participation; authentic voice requires children to bring their own issues
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Meetings (90d)", value: mp.total_meetings_90d, color: "text-blue-600" },
            { label: "Child voice score", value: `${ep.child_voice_score}/100`, color: ep.child_voice_score >= 70 ? "text-emerald-600" : ep.child_voice_score >= 50 ? "text-amber-600" : "text-red-600" },
            { label: "Total actions raised", value: ep.total_new_actions, color: "text-foreground" },
            { label: "Never attended", value: mp.children_never_attended.length, color: mp.children_never_attended.length > 0 ? "text-amber-600" : "text-foreground" },
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
              <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> Meeting Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Average child attendance rate" value={mp.avg_attendance_rate} warn={85} />
              <RateBar label="Child-raised agenda item rate" value={mp.avg_child_raised_rate} warn={50} />
              <RateBar label="Action completion rate" value={mp.action_completion_rate} warn={90} />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{mp.meetings_per_month.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Meetings/month</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{mp.avg_duration}m</p>
                  <p className="text-xs text-muted-foreground">Avg duration</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> Engagement Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Agenda items", value: ep.total_agenda_items, color: "text-foreground" },
                  { label: "Child-raised", value: ep.total_child_raised, color: "text-blue-600" },
                  { label: "Total feedback", value: ep.total_feedback, color: "text-foreground" },
                  { label: "Actions created", value: ep.total_new_actions, color: "text-foreground" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded border bg-muted/30 p-2 text-center">
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className={`flex items-center justify-between rounded border px-3 py-2 ${ep.child_voice_score >= 70 ? "border-emerald-200 bg-emerald-50" : ep.child_voice_score >= 50 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                <span className="text-xs font-medium">Child voice composite score</span>
                <span className={`text-lg font-bold ${ep.child_voice_score >= 70 ? "text-emerald-600" : ep.child_voice_score >= 50 ? "text-amber-600" : "text-red-600"}`}>{ep.child_voice_score}/100</span>
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
          UN CRC Article 12 (the child's right to express views freely in all matters affecting the child, those views being given due weight in accordance with the child's age and maturity). CHR 2015 Regulation 5 — the registered person must ensure that children can influence decisions about their daily lives and the running of the home. NMS Standard 7 (Voice of the child — children are encouraged and supported to make their wishes and feelings known in relation to the service provided by the home; they participate in the running of the home and feel their views are listened to and acted on). The distinction between tokenistic and authentic participation is evidenced by whether children's voices actually change decisions. Homes where children attend meetings but adult-set agendas dominate, where actions are rarely completed, or where the same children never attend are providing the form of participation without the substance.
        </p>
      </div>
    </PageShell>
  );
}
