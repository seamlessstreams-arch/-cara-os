"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, CheckCircle, AlertTriangle, Clock, Star, ShieldAlert } from "lucide-react";
import { useHomeMedicationGovernanceIntelligence } from "@/hooks/use-home-medication-governance-intelligence";
import type { MedicationGovernanceRating } from "@/lib/engines/home-medication-governance-intelligence-engine";

const RATING_META: Record<MedicationGovernanceRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

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

export default function MedicationGovernanceIntelligencePage() {
  const { data, isLoading, error } = useHomeMedicationGovernanceIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Medication Governance Intelligence" description="Analysing medication governance data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Medication Governance Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load medication governance data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.governance_rating];
  const audit = d.audit;
  const errors = d.errors;
  const nm = d.nearMisses;
  const stock = d.stock;
  const storage = d.storage;
  const ep = d.emergencyProtocols;

  return (
    <PageShell
      title="Medication Governance Intelligence"
      description="Medication audit compliance, error and near-miss analysis, stock control, storage standards and emergency protocol oversight (CHR 2015 Reg 10; NICE NG67; NMC Standards; MHRA guidance)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Pill className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Governance score: {d.governance_score}/100 · {audit.total_audits} audits · {errors.total_errors} errors · {nm.total_near_misses} near misses
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.governance_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(errors.major_harm_count > 0 || errors.ofsted_notifiable_count > 0 || storage.total_expired_items > 0 || stock.discrepancy_count > 0) && (
          <div className="flex flex-col gap-2">
            {errors.major_harm_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
                {errors.major_harm_count} medication error(s) resulting in major harm — safeguarding review required
              </div>
            )}
            {errors.ofsted_notifiable_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {errors.ofsted_notifiable_count} Ofsted notifiable medication error(s) — confirm notification submitted
              </div>
            )}
            {storage.total_expired_items > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {storage.total_expired_items} expired medication item(s) in storage — dispose of immediately
              </div>
            )}
            {stock.discrepancy_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {stock.discrepancy_count} stock discrepancy(ies) identified — investigate and resolve
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Audit compliance */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Audit Compliance
                </CardTitle>
                <Badge variant="outline" className="text-xs">{audit.total_audits} audits</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{audit.pass_count}</p>
                  <p className="text-xs text-muted-foreground">Pass</p>
                </div>
                <div className={`rounded border p-2 text-center ${audit.fail_count > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${audit.fail_count > 0 ? "text-red-600" : "text-foreground"}`}>{audit.fail_count}</p>
                  <p className="text-xs text-muted-foreground">Fail</p>
                </div>
                <div className={`rounded border p-2 text-center ${audit.discrepancy_count > 0 ? "bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${audit.discrepancy_count > 0 ? "text-amber-700" : "text-foreground"}`}>{audit.discrepancy_count}</p>
                  <p className="text-xs text-muted-foreground">Discrepancies</p>
                </div>
              </div>
              <RateBar label="Audit pass rate" value={audit.pass_rate} />
              <RateBar label="Storage correct" value={audit.storage_correct_rate} />
              <RateBar label="Temperature compliance" value={audit.temperature_ok_rate} />
            </CardContent>
          </Card>

          {/* Errors */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  Medication Errors
                </CardTitle>
                <Badge variant={errors.total_errors > 0 ? "destructive" : "outline"} className="text-xs">
                  {errors.total_errors} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold">{errors.no_harm_count}</p>
                  <p className="text-xs text-muted-foreground">No harm</p>
                </div>
                <div className={`rounded border p-2 text-center ${errors.major_harm_count > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${errors.major_harm_count > 0 ? "text-red-600" : "text-foreground"}`}>{errors.major_harm_count}</p>
                  <p className="text-xs text-muted-foreground">Major harm</p>
                </div>
              </div>
              <RateBar label="Debrief completion" value={errors.debrief_rate} warn={100} />
              <RateBar label="Root cause analysis" value={errors.root_cause_rate} warn={100} />
              {errors.open_investigations > 0 && (
                <p className="text-xs text-amber-600 pt-1">{errors.open_investigations} open investigation(s)</p>
              )}
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  Storage Standards
                </CardTitle>
                <Badge variant={storage.overdue_audits > 0 ? "destructive" : "outline"} className="text-xs">
                  {storage.overdue_audits} overdue audits
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <RateBar label="Storage pass rate" value={storage.pass_rate} warn={95} />
              <RateBar label="Controlled drugs correct" value={storage.controlled_drugs_correct_rate} warn={100} />
              <RateBar label="Security pass rate" value={storage.security_pass_rate} warn={100} />
              <RateBar label="Keys accounted for" value={storage.keys_accounted_rate} warn={100} />
            </CardContent>
          </Card>

          {/* Emergency protocols */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Emergency Protocols
                </CardTitle>
                <Badge variant={ep.overdue_reviews > 0 ? "destructive" : "outline"} className="text-xs">
                  {ep.overdue_reviews} overdue reviews
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold">{ep.total_protocols}</p>
                  <p className="text-xs text-muted-foreground">Total protocols</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold">{ep.unique_children}</p>
                  <p className="text-xs text-muted-foreground">Children covered</p>
                </div>
              </div>
              <RateBar label="GP sign-off rate" value={ep.gp_signed_off_rate} warn={100} />
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>Avg staff trained per protocol</span>
                <span className={`font-medium ${ep.avg_staff_trained < 2 ? "text-amber-600" : "text-emerald-600"}`}>{ep.avg_staff_trained.toFixed(1)}</span>
              </div>
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
          CHR 2015 Reg 10 (children's health). NICE NG67 — managing medicines in care homes. NMC Standards for Medicines Management. MHRA guidance on controlled drugs. Medication errors are notifiable under CHR Reg 40.
        </p>
      </div>
    </PageShell>
  );
}
