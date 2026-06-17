"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeHealthMonitoringIntelligence } from "@/hooks/use-home-health-monitoring-intelligence";
import type { HomeHealthMonitoringResult, HomeHealthMonitoringRating } from "@/lib/engines/home-health-monitoring-intelligence-engine";

const RATING_META: Record<HomeHealthMonitoringRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function HealthMonitoringIntelligencePage() {
  const { data, isLoading, error } = useHomeHealthMonitoringIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Health Monitoring" description="Analysing health monitoring data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Health Monitoring" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load health monitoring data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.health_monitoring_rating];
  const assess = d.assessment;
  const imm = d.immunisation;
  const dental = d.dental;
  const passport = d.passport;

  return (
    <PageShell
      title="Health Monitoring"
      description="Annual health assessments, immunisation records, dental registration, health passports — monitoring the statutory health framework for every child in the home (CHR 2015 Reg 10/15; SCCIF Health; NMS 2)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Activity className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Health monitoring score: {d.health_monitoring_score}/100 · {assess.children_assessed} children assessed · immunisation catch-up {Math.round(imm.catch_up_ratio)}% · dental registration {Math.round(dental.registered_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.health_monitoring_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(assess.completion_rate < 90 || dental.overdue_checkups > 0 || passport.currency_rate < 80) && (
          <div className="flex flex-col gap-2">
            {assess.completion_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Annual health assessment completion rate {Math.round(assess.completion_rate)}% — Ofsted expects every child to have an annual health assessment; this is a statutory requirement under Regulation 10
              </div>
            )}
            {dental.overdue_checkups > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {dental.overdue_checkups} overdue dental check-up{dental.overdue_checkups !== 1 ? "s" : ""} — dental neglect is a recognised safeguarding indicator; 6-monthly reviews are expected
              </div>
            )}
            {passport.currency_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Health passport currency rate {Math.round(passport.currency_rate)}% — outdated health passports risk missing current medications, allergies or conditions in an emergency
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Annual Health Assessments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className="text-xl font-bold text-blue-600">{assess.total_assessments}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className="text-xl font-bold">{assess.recent_365d}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Last 12m</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className="text-xl font-bold">{assess.children_assessed}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Children</p>
                </div>
              </div>
              <RateBar label="Completion rate" value={assess.completion_rate} warn={95} />
              <RateBar label="Immunisations up to date" value={assess.immunisations_up_to_date_rate} warn={95} />
              <RateBar label="Dental up to date" value={assess.dental_up_to_date_rate} warn={90} />
              <RateBar label="Optical up to date" value={assess.optical_up_to_date_rate} warn={85} />
              <RateBar label="LA sign-off rate" value={assess.la_sign_off_rate} warn={80} />
              <RateBar label="Report shared rate" value={assess.report_shared_rate} warn={80} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Immunisation & GP Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className={`text-xl font-bold ${imm.missed_total > 0 ? "text-red-600" : "text-emerald-600"}`}>{imm.missed_total}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Missed</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className="text-xl font-bold text-emerald-600">{imm.caught_up_total}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Caught up</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className="text-xl font-bold text-amber-600">{imm.upcoming_due_total}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Due soon</p>
                </div>
              </div>
              <RateBar label="GP registration rate" value={imm.gp_registered_rate} warn={100} />
              <RateBar label="Child consent rate" value={imm.child_consent_rate} warn={90} />
              <RateBar label="GP reviewed rate" value={imm.gp_reviewed_rate} warn={80} />
              <RateBar label="Catch-up ratio" value={imm.catch_up_ratio} warn={80} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dental Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className="text-xl font-bold text-blue-600">{dental.children_with_dental}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Children</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className={`text-xl font-bold ${dental.overdue_checkups > 0 ? "text-red-600" : "text-emerald-600"}`}>{dental.overdue_checkups}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Overdue</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className={`text-xl font-bold ${dental.anxiety_count > 0 ? "text-amber-600" : ""}`}>{dental.anxiety_count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Anxiety</p>
                </div>
              </div>
              <RateBar label="Dental registration rate" value={dental.registered_rate} warn={100} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Health Passports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className="text-xl font-bold text-blue-600">{passport.total_passports}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2 text-center">
                  <p className={`text-xl font-bold ${passport.avg_medications > 0 ? "text-amber-600" : ""}`}>{passport.avg_medications.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Avg meds</p>
                </div>
              </div>
              <RateBar label="Passport currency rate" value={passport.currency_rate} warn={85} />
              <RateBar label="Consent given rate" value={passport.consent_given_rate} warn={90} />
              <RateBar label="Immunisations up to date" value={passport.immunisations_up_to_date_rate} warn={95} />
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
          CHR 2015 Regulation 10 (Health care — registered provider must promote and protect children's health). Regulation 15 (Register of children — must include health information). SCCIF Health (health needs must be identified, met and evidenced). NMS 2 (Health — a positive health assessment is not enough; health needs must be actively met). Children in care are entitled to better health outcomes than they would have had without care — not equal outcomes, better ones.
        </p>
      </div>
    </PageShell>
  );
}
