"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeEducationEngagementIntelligence } from "@/hooks/use-home-education-engagement-intelligence";
import type { HomeEducationEngagementResult, EducationRating } from "@/lib/engines/home-education-engagement-intelligence-engine";

const RATING_META: Record<EducationRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 85 }: { label: string; value: number; warn?: number }) {
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 55 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 55 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function EducationEngagementIntelligencePage() {
  const { data, isLoading, error } = useHomeEducationEngagementIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Education Engagement" description="Analysing education engagement data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Education Engagement" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load education engagement data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.education_rating];
  const att = d.attendance;
  const pep = d.pep_compliance;
  const ehcp = d.ehcp;
  const eng = d.school_engagement;
  const tut = d.tutoring;
  const hw = d.homework;

  return (
    <PageShell
      title="Education Engagement"
      description="Attendance, PEP compliance, EHCP governance, school engagement, tutoring and homework support — the full picture of how children are being supported in their education (CHR 2015 Reg 8; Reg 29 — PEPs; Children Act 1989; Ofsted ILACS)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <BookOpen className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Education score: {d.education_score}/100 · attendance {Math.round(att.attendance_rate)}% · {pep.total_peps} PEPs · {eng.achievements_count} achievements (90d)
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.education_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(att.attendance_rate < 90 || pep.overdue_count > 0 || ehcp.overdue_reviews > 0) && (
          <div className="flex flex-col gap-2">
            {att.attendance_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Attendance at {Math.round(att.attendance_rate)}% — persistent absence threshold reached. An attendance improvement plan is required.
              </div>
            )}
            {pep.overdue_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {pep.overdue_count} overdue PEP{pep.overdue_count > 1 ? "s" : ""} — statutory requirement under CHR 2015 Reg 29
              </div>
            )}
            {ehcp.overdue_reviews > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {ehcp.overdue_reviews} overdue EHCP annual review{ehcp.overdue_reviews > 1 ? "s" : ""} — SEND statutory deadlines must be met
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attendance (30d)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs"><span className="text-muted-foreground">Sessions:</span> <span className="font-medium">{att.total_sessions_30d}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Present:</span> <span className="font-medium text-emerald-600">{att.present_count}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Absent:</span> <span className={`font-medium ${att.absent_count > 0 ? "text-amber-600" : ""}`}>{att.absent_count}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Unauthorised:</span> <span className={`font-medium ${att.unauthorised_absences > 0 ? "text-red-600" : ""}`}>{att.unauthorised_absences}</span></div>
              </div>
              <RateBar label="Attendance rate" value={att.attendance_rate} warn={90} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PEPs & EHCPs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs"><span className="text-muted-foreground">Total PEPs:</span> <span className="font-medium">{pep.total_peps}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Current:</span> <span className="font-medium text-emerald-600">{pep.current_count}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Overdue:</span> <span className={`font-medium ${pep.overdue_count > 0 ? "text-red-600" : ""}`}>{pep.overdue_count}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">EHCPs:</span> <span className="font-medium">{ehcp.total_ehcps}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">EHCP overdue:</span> <span className={`font-medium ${ehcp.overdue_reviews > 0 ? "text-amber-600" : ""}`}>{ehcp.overdue_reviews}</span></div>
              </div>
              <RateBar label="Child contribution to PEP" value={ehcp.child_contribution_rate} warn={80} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Engagement & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs"><span className="text-muted-foreground">School events (90d):</span> <span className="font-medium">{eng.total_events_90d}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Children engaged:</span> <span className="font-medium">{eng.unique_children_engaged}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">With tutor:</span> <span className="font-medium">{tut.children_with_tutor}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Homework sessions:</span> <span className="font-medium">{hw.total_sessions_30d}</span></div>
              </div>
              <RateBar label="SW attendance at events" value={eng.sw_attendance_rate} warn={80} />
              <RateBar label="Homework completion rate" value={hw.completion_rate} warn={75} />
            </CardContent>
          </Card>
        </div>

        {d.insights.length > 0 && (
          <div className="space-y-2">
            {d.insights.map((ins, i) => {
              const sev = ins.severity as string;
              const cls =
                sev === "critical" ? "bg-red-50 border-red-200 text-red-800" :
                sev === "warning"  ? "bg-amber-50 border-amber-200 text-amber-800" :
                "bg-emerald-50 border-emerald-200 text-emerald-800";
              return (
                <div key={i} className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${cls}`}>
                  {sev === "critical" ? <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   sev === "positive"  ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
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
                const urg = rec.urgency as string;
                const urgencyColor =
                  urg === "immediate" ? "bg-red-100 text-red-700 border-red-200" :
                  urg === "soon"      ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200";
                return (
                  <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{rec.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{rec.recommendation}</p>
                      {rec.regulatory_ref && <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>}
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{urg}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          CHR 2015 Regulation 8 (Education, employment and training). Regulation 29 (Personal Education Plans). Children Act 1989. Pupil Premium Plus funding. Ofsted ILACS — inspectors assess whether the home actively promotes children's education, attends parents' evenings, and advocates when children are excluded. PEPs are statutory; EHCPs have fixed review deadlines.
        </p>
      </div>
    </PageShell>
  );
}
