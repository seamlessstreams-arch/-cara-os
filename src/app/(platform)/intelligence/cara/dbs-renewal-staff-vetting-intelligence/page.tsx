"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeDbsRenewalStaffVettingIntelligence } from "@/hooks/use-home-dbs-renewal-staff-vetting-intelligence";
import type { DbsVettingResult, DbsVettingRating } from "@/lib/engines/home-dbs-renewal-staff-vetting-intelligence-engine";

const RATING_META: Record<DbsVettingRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 95 }: { label: string; value: number; warn?: number }) {
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

export default function DbsRenewalStaffVettingIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeDbsRenewalStaffVettingIntelligence();
  const d = (raw as { data?: DbsVettingResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="DBS & Staff Vetting" description="Analysing DBS checks and staff vetting data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="DBS & Staff Vetting" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load DBS and staff vetting data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.vetting_rating];

  return (
    <PageShell
      title="DBS & Staff Vetting"
      description="DBS currency, enhanced checks with barred list, overseas checks, reference verification and safer recruitment compliance — protecting children through rigorous staff vetting (CHR 2015 Reg 32 — Fit and Proper Persons; Reg 33 — Suitability; Keeping Children Safe in Education)."
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
                  Vetting score: {d.vetting_score}/100 · {d.dbs_total_records} DBS records · {d.staff_fully_vetted_count} staff fully vetted
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.vetting_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {d.dbs_expired_count > 0 && (
          <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            {d.dbs_expired_count} expired DBS {d.dbs_expired_count === 1 ? "check" : "checks"} — staff with expired DBS may not be suitable for unsupervised contact with children
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">DBS Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs"><span className="text-muted-foreground">Total records:</span> <span className="font-medium">{d.dbs_total_records}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Valid:</span> <span className="font-medium text-emerald-600">{d.dbs_valid_count}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Expired:</span> <span className={`font-medium ${d.dbs_expired_count > 0 ? "text-red-600" : ""}`}>{d.dbs_expired_count}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Pending:</span> <span className="font-medium">{d.dbs_pending_count}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Update service:</span> <span className="font-medium">{d.dbs_on_update_service_count}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">With disclosures:</span> <span className={`font-medium ${d.dbs_with_disclosures_count > 0 ? "text-amber-600" : ""}`}>{d.dbs_with_disclosures_count}</span></div>
              </div>
              <RateBar label="DBS currency rate" value={d.dbs_currency_rate} warn={100} />
              <RateBar label="Enhanced DBS rate" value={d.enhanced_dbs_rate} warn={100} />
              <RateBar label="Renewal timeliness rate" value={d.renewal_timeliness_rate} warn={95} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Safer Recruitment Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs"><span className="text-muted-foreground">Overseas checks:</span> <span className="font-medium">{d.overseas_checks_total}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Cleared:</span> <span className="font-medium">{d.overseas_checks_clear}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Barred list checks:</span> <span className="font-medium">{d.barred_list_total}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">References:</span> <span className="font-medium">{d.references_total}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Ref. concerns:</span> <span className={`font-medium ${d.references_with_concerns > 0 ? "text-amber-600" : ""}`}>{d.references_with_concerns}</span></div>
                <div className="text-xs"><span className="text-muted-foreground">Fully vetted:</span> <span className="font-medium text-emerald-600">{d.staff_fully_vetted_count}</span></div>
              </div>
              <RateBar label="Overseas check rate" value={d.overseas_check_rate} warn={100} />
              <RateBar label="Barred list check rate" value={d.barred_list_rate} warn={100} />
              <RateBar label="Reference verification rate" value={d.reference_verification_rate} warn={100} />
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
          Children's Homes Regulations 2015 Regulation 32 (Fit and Proper Persons) and Regulation 33 (Suitability of Staff). Keeping Children Safe in Education 2024 (safer recruitment guidance). DBS Update Service allows continuous monitoring between renewals. Enhanced DBS with barred list check is mandatory for regulated activity with children.
        </p>
      </div>
    </PageShell>
  );
}
