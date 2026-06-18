"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeOnCallGovernanceIntelligence } from "@/hooks/use-home-on-call-governance-intelligence";
import type { HomeOnCallGovernanceResult, OnCallRating } from "@/lib/engines/home-on-call-governance-intelligence-engine";

const RATING_META: Record<OnCallRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function OnCallGovernanceIntelligencePage() {
  const { data, isLoading, error } = useHomeOnCallGovernanceIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="On-Call Governance Intelligence" description="Analysing on-call coverage and governance data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="On-Call Governance Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load on-call governance data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.on_call_rating];
  const cov = d.coverage;
  const resp = d.response;
  const qual = d.quality;
  const wl = d.workload;
  const roleEntries = Object.entries(cov.role_distribution).sort(([, a], [, b]) => b - a);

  return (
    <PageShell
      title="On-Call Governance Intelligence"
      description="On-call coverage frequency, backup designation, role distribution, response documentation, escalation appropriateness, and post-shift feedback — evidencing that the home has robust out-of-hours management support that protects children when the building manager is not present (CHR 2015 Reg 33(4)(b); SCCIF)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Phone className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  On-call score: {d.on_call_score}/100 · {cov.total_shifts} shifts · backup {cov.has_backup_rate}% · {cov.unique_on_call_staff} staff covering · {resp.total_calls} calls · {resp.critical_calls} critical
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.on_call_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(cov.shifts_last_14_days === 0 || cov.unique_on_call_staff === 1 || resp.critical_calls > 0) && (
          <div className="flex flex-col gap-2">
            {cov.shifts_last_14_days === 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                No on-call shifts recorded in the last 14 days — a home without out-of-hours management support is in breach of Regulation 33(4)(b); this is not a documentation gap, it is a potential abandonment of children
              </div>
            )}
            {cov.unique_on_call_staff === 1 && cov.total_shifts >= 3 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                All on-call duties fall on one person — if that person is ill, unavailable, or otherwise unable to respond, the home has no management support; this is a safeguarding risk
              </div>
            )}
            {wl.critical_incidents_total > 2 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {wl.critical_incidents_total} critical incidents handled via on-call — high out-of-hours demand may indicate that the home's care environment is not sufficiently stable and safe during evenings and nights
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total shifts", value: cov.total_shifts, color: "text-blue-600" },
            { label: "Shifts (last 14d)", value: cov.shifts_last_14_days, color: cov.shifts_last_14_days === 0 ? "text-red-600" : "text-foreground" },
            { label: "Staff covering", value: cov.unique_on_call_staff, color: cov.unique_on_call_staff === 1 ? "text-red-600" : "text-foreground" },
            { label: "Total calls", value: resp.total_calls, color: "text-foreground" },
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
              <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> Coverage Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Backup designation rate" value={cov.has_backup_rate} warn={90} />
              <RateBar label="Post-shift feedback rate" value={qual.feedback_rate} warn={80} />
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className={`rounded border p-2 text-center ${resp.critical_calls > 0 ? "border-amber-200 bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${resp.critical_calls > 0 ? "text-amber-600" : "text-foreground"}`}>{resp.critical_calls}</p>
                  <p className="text-xs text-muted-foreground">Critical calls</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{resp.escalated_calls}</p>
                  <p className="text-xs text-muted-foreground">Escalated</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{wl.quiet_shifts}</p>
                  <p className="text-xs text-muted-foreground">Quiet shifts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> Response Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{resp.routine_calls}</p>
                  <p className="text-xs text-muted-foreground">Routine calls</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{resp.advisory_calls}</p>
                  <p className="text-xs text-muted-foreground">Advisory calls</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{resp.avg_call_duration}m</p>
                  <p className="text-xs text-muted-foreground">Avg call duration</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{resp.calls_per_shift}</p>
                  <p className="text-xs text-muted-foreground">Calls/shift</p>
                </div>
              </div>
              {roleEntries.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Role distribution</p>
                  <div className="flex flex-wrap gap-1.5">
                    {roleEntries.map(([role, count]) => (
                      <div key={role} className="flex items-center gap-1 rounded border bg-muted/30 px-2 py-1">
                        <span className="text-xs font-medium capitalize">{role.replace(/_/g, " ")}</span>
                        <Badge variant="secondary" className="text-xs h-4 px-1">{count}</Badge>
                      </div>
                    ))}
                  </div>
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
          CHR 2015 Regulation 33(4)(b) — the registered person must ensure that there are systems for out-of-hours management support for the home. This is not a recommendation; it is a regulatory requirement. Inspectors will ask to see evidence that on-call arrangements are in place, that they are tested, that staff know how to access them, and that critical incidents are escalated appropriately. SCCIF — inspectors assess whether "the home has robust on-call and emergency arrangements" and whether these protect children effectively. On-call governance failures are one of the most common findings in inadequate inspections: a home where staff cannot access management support out of hours is a home where children are at risk during the periods of highest vulnerability. Good on-call governance requires coverage, backup, documentation, escalation protocols, and a feedback loop for continuous improvement.
        </p>
      </div>
    </PageShell>
  );
}
