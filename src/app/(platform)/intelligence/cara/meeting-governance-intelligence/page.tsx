"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeMeetingGovernanceIntelligence } from "@/hooks/use-home-meeting-governance-intelligence";
import type { HomeMeetingGovernanceResult, MeetingRating } from "@/lib/engines/home-meeting-governance-intelligence-engine";

const RATING_META: Record<MeetingRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function MeetingGovernanceIntelligencePage() {
  const { data, isLoading, error } = useHomeMeetingGovernanceIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Meeting Governance Intelligence" description="Analysing team meeting governance data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Meeting Governance Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load meeting governance data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.meeting_rating];
  const reg = d.regularity_profile;
  const att = d.attendance_profile;
  const act = d.action_profile;
  const eng = d.engagement_profile;

  return (
    <PageShell
      title="Meeting Governance Intelligence"
      description="Meeting regularity, attendance (staff and children), action completion, child-raised agenda items and meeting engagement — evidencing that team meetings are a functional governance mechanism and that children have a genuine voice in how the home is run (CHR 2015 Reg 5; NMS 12; UNCRC Article 12)."
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
                  Meeting score: {d.meeting_score}/100 · {reg.total_meetings} meetings · child attendance {Math.round(att.avg_child_attendance_rate)}% · action completion {Math.round(act.completion_rate)}% · child-raised agenda {Math.round(eng.child_raised_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.meeting_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(reg.max_gap_days > 42 || act.completion_rate < 80 || eng.child_raised_rate < 30) && (
          <div className="flex flex-col gap-2">
            {reg.max_gap_days > 42 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Maximum gap between meetings {reg.max_gap_days} days — a home that does not meet regularly cannot maintain a consistent shared understanding of children's needs or a coherent team approach; regular meetings are the heartbeat of a safe, well-run home
              </div>
            )}
            {act.completion_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Action completion rate {Math.round(act.completion_rate)}% — meetings that generate actions no one completes are not governance mechanisms, they are theatre; Ofsted will ask what meetings are for if agreed actions routinely go undone
              </div>
            )}
            {eng.child_raised_rate < 30 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Child-raised agenda items {Math.round(eng.child_raised_rate)}% — if children are not raising items in their own home's meetings, either the forum is not accessible to them or they do not believe their voice will be heard; this is a UNCRC Article 12 concern
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total meetings", value: reg.total_meetings, color: reg.total_meetings === 0 ? "text-red-600" : "text-blue-600" },
            { label: "Meetings/month", value: reg.meetings_per_month.toFixed(1), color: reg.meetings_per_month < 2 ? "text-amber-600" : "text-foreground" },
            { label: "Max gap (days)", value: reg.max_gap_days, color: reg.max_gap_days > 42 ? "text-red-600" : reg.max_gap_days > 28 ? "text-amber-600" : "text-emerald-600" },
            { label: "Avg duration (min)", value: Math.round(eng.avg_duration), color: eng.avg_duration < 30 ? "text-amber-600" : "text-foreground" },
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
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Attendance & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Child attendance rate" value={att.avg_child_attendance_rate} warn={80} />
              <RateBar label="Action completion rate" value={act.completion_rate} warn={85} />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{act.total_previous_actions}</p>
                  <p className="text-xs text-muted-foreground">Previous actions</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{act.total_new_actions}</p>
                  <p className="text-xs text-muted-foreground">New actions</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{att.full_attendance_count}</p>
                  <p className="text-xs text-muted-foreground">Full attendance</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{reg.extraordinary_count}</p>
                  <p className="text-xs text-muted-foreground">Extraordinary</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Child Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Child-raised agenda items rate" value={eng.child_raised_rate} warn={40} />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{eng.avg_agenda_items.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Avg agenda items</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{eng.avg_feedback_count.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Avg feedback items</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{eng.meetings_with_feedback}</p>
                  <p className="text-xs text-muted-foreground">Meetings with feedback</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{att.avg_staff_present.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Avg staff present</p>
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
          CHR 2015 Regulation 5 (the registered person must ensure that the home operates in a way that promotes the welfare of children; team meetings are a key mechanism for this). NMS Standard 12 (children are consulted and involved in decisions about their daily life in the home; regular house meetings with meaningful child participation are the primary forum for this). UNCRC Article 12 (children have the right to express their views on matters affecting them; a children's home meeting where children cannot raise their own items is not meeting this obligation). Ofsted's ILACS framework assesses whether homes have a coherent approach to involving children in day-to-day decisions — meeting governance is primary evidence for this.
        </p>
      </div>
    </PageShell>
  );
}
