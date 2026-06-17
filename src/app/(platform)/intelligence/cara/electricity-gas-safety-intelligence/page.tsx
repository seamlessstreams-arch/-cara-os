"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeElectricityGasSafetyIntelligence } from "@/hooks/use-home-electricity-gas-safety-intelligence";
import type { ElectricityGasSafetyResult, ElectricityGasSafetyRating } from "@/lib/engines/home-electricity-gas-safety-intelligence-engine";

const RATING_META: Record<ElectricityGasSafetyRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 100 }: { label: string; value: number; warn?: number }) {
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

export default function ElectricityGasSafetyIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeElectricityGasSafetyIntelligence();
  const d = (raw as { data?: ElectricityGasSafetyResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Electricity & Gas Safety" description="Analysing electrical and gas safety data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Electricity & Gas Safety" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load electricity and gas safety data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.electrical_rating];

  return (
    <PageShell
      title="Electricity & Gas Safety"
      description="PAT testing, gas safety certificates, electrical installation inspections, CO detector compliance, child electrical safety and staff training — protecting children and staff from preventable electrical and gas hazards (CHR 2015 Reg 25 — Premises and Safety; Gas Safety Regulations 1998; Electricity at Work Regulations 1989)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Zap className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Safety score: {d.electrical_score}/100 · {d.total_appliances_tested} appliances tested · gas cert {Math.round(d.gas_certificate_rate)}% · CO detectors {Math.round(d.co_detector_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.electrical_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.gas_certificate_rate < 100 || d.co_detector_rate < 100 || d.electrical_inspection_rate < 100) && (
          <div className="flex flex-col gap-2">
            {d.gas_certificate_rate < 100 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Gas safety certificate rate {Math.round(d.gas_certificate_rate)}% — gas certificates are a legal requirement under the Gas Safety Regulations 1998. Renew immediately.
              </div>
            )}
            {d.co_detector_rate < 100 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                CO detector coverage {Math.round(d.co_detector_rate)}% — every room with a gas appliance requires a working CO detector
              </div>
            )}
            {d.electrical_inspection_rate < 100 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Electrical inspection rate {Math.round(d.electrical_inspection_rate)}% — EICR inspections are legally required every 5 years
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                Certification & Inspection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="PAT testing rate" value={d.pat_testing_rate} warn={100} />
              <RateBar label="PAT pass rate" value={d.pat_pass_rate} warn={100} />
              <RateBar label="Gas certificate rate" value={d.gas_certificate_rate} warn={100} />
              <RateBar label="Gas satisfactory rate" value={d.gas_satisfactory_rate} warn={100} />
              <RateBar label="Electrical inspection rate" value={d.electrical_inspection_rate} warn={100} />
              <RateBar label="Electrical satisfactory rate" value={d.electrical_satisfactory_rate} warn={100} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                Detection, Safety & Training
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="CO detector rate" value={d.co_detector_rate} warn={100} />
              <RateBar label="CO functioning rate" value={d.co_functioning_rate} warn={100} />
              <RateBar label="Child electrical safety rate" value={d.child_safety_rate} warn={100} />
              <RateBar label="Staff safety training rate" value={d.staff_training_rate} warn={90} />
              <RateBar label="Defect resolution rate" value={d.defect_resolution_rate} warn={100} />
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
          CHR 2015 Regulation 25 (Premises and Safety). Gas Safety (Installation and Use) Regulations 1998 — annual gas safety certificate is a legal requirement. Electricity at Work Regulations 1989 — EICR every 5 years. Carbon Monoxide detectors are required in any room with a gas appliance. Expired certificates are a serious regulatory breach and Ofsted inspection finding.
        </p>
      </div>
    </PageShell>
  );
}
