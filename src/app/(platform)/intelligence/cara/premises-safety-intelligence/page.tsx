"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, CheckCircle, AlertTriangle, Clock, Star, Car } from "lucide-react";
import { useHomePremisesSafetyIntelligence } from "@/hooks/use-home-premises-safety-intelligence";
import type { PremisesRating } from "@/lib/engines/home-premises-safety-intelligence-engine";

const RATING_META: Record<PremisesRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function CertBadge({ label, current }: { label: string; current: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs ${current ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
      {current ? <CheckCircle className="h-3 w-3 flex-shrink-0" /> : <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
      {label}
    </div>
  );
}

function RateBar({ label, value, warn = 90 }: { label: string; value: number; warn?: number }) {
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 60 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PremisesSafetyIntelligencePage() {
  const { data, isLoading, error } = useHomePremisesSafetyIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Premises Safety Intelligence" description="Analysing premises safety data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Premises Safety Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load premises safety intelligence data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.premises_rating];
  const cert = d.certification_profile;
  const chk = d.check_profile;
  const veh = d.vehicle_profile;
  const maint = d.maintenance_profile;

  return (
    <PageShell
      title="Premises Safety Intelligence"
      description="Statutory certifications, routine safety checks, vehicle compliance and maintenance oversight (CHR 2015 Reg 13; Fire Safety Order 2005; Gas Safety Regs 1998; Health & Safety at Work Act 1974)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Home className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Premises score: {d.premises_score}/100 · {cert.buildings_count} building(s) · {chk.total_checks} safety checks · {maint.open_count} open maintenance items
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.premises_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(!cert.all_current || chk.overdue_count > 0 || maint.urgent_open_count > 0 || !veh.all_compliant) && (
          <div className="flex flex-col gap-2">
            {!cert.all_current && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {cert.expired_count} statutory certification(s) expired — immediate renewal required
              </div>
            )}
            {maint.urgent_open_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {maint.urgent_open_count} urgent maintenance item(s) unresolved — action immediately
              </div>
            )}
            {chk.overdue_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {chk.overdue_count} safety check(s) overdue
              </div>
            )}
            {!veh.all_compliant && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {veh.expired_count} vehicle certification(s) not current — review before use
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Certifications */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Statutory Certifications
                </CardTitle>
                <Badge variant={cert.all_current ? "outline" : "destructive"} className="text-xs">
                  {cert.all_current ? "All current" : `${cert.expired_count} expired`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <CertBadge label="Gas safety" current={cert.gas_current} />
                <CertBadge label="Electrical" current={cert.electrical_current} />
                <CertBadge label="Fire risk assessment" current={cert.fire_risk_current} />
              </div>
            </CardContent>
          </Card>

          {/* Safety checks */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  Routine Safety Checks
                </CardTitle>
                <Badge variant="outline" className="text-xs">{chk.total_checks} total</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{chk.completed_count}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className={`rounded border p-2 text-center ${chk.overdue_count > 0 ? "bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${chk.overdue_count > 0 ? "text-amber-700" : "text-foreground"}`}>{chk.overdue_count}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className={`rounded border p-2 text-center ${chk.fail_count > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${chk.fail_count > 0 ? "text-red-600" : "text-foreground"}`}>{chk.fail_count}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
              <RateBar label="Check pass rate" value={chk.pass_rate} warn={95} />
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  Vehicle Compliance
                </CardTitle>
                <Badge variant={veh.all_compliant ? "outline" : "destructive"} className="text-xs">
                  {veh.all_compliant ? "All compliant" : `${veh.expired_count} not current`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{veh.checks_pass_count}</p>
                  <p className="text-xs text-muted-foreground">Pass</p>
                </div>
                <div className="rounded border bg-amber-50 p-2 text-center">
                  <p className="text-lg font-bold text-amber-700">{veh.checks_advisory_count}</p>
                  <p className="text-xs text-muted-foreground">Advisory</p>
                </div>
                <div className={`rounded border p-2 text-center ${veh.checks_fail_count > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${veh.checks_fail_count > 0 ? "text-red-600" : "text-foreground"}`}>{veh.checks_fail_count}</p>
                  <p className="text-xs text-muted-foreground">Fail</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Maintenance
                </CardTitle>
                <Badge variant={maint.urgent_open_count > 0 ? "destructive" : "outline"} className="text-xs">
                  {maint.urgent_open_count} urgent open
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold">{maint.open_count}</p>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
                <div className={`rounded border p-2 text-center ${maint.overdue_count > 0 ? "bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${maint.overdue_count > 0 ? "text-amber-700" : "text-foreground"}`}>{maint.overdue_count}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className={`rounded border p-2 text-center ${maint.urgent_open_count > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${maint.urgent_open_count > 0 ? "text-red-600" : "text-foreground"}`}>{maint.urgent_open_count}</p>
                  <p className="text-xs text-muted-foreground">Urgent</p>
                </div>
              </div>
              <RateBar label="Maintenance completion rate" value={maint.completion_rate} />
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
          CHR 2015 Reg 13 (premises). Regulatory Reform (Fire Safety) Order 2005. Gas Safety (Installation and Use) Regulations 1998. Electrical safety standards for rented properties 2020. Health and Safety at Work Act 1974.
        </p>
      </div>
    </PageShell>
  );
}
