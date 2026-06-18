"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeMedicationSafetyComplianceIntelligence } from "@/hooks/use-home-medication-safety-compliance-intelligence";
import type { MedicationSafetyComplianceResult, MedicationSafetyRating } from "@/lib/engines/home-medication-safety-compliance-intelligence-engine";

const RATING_META: Record<MedicationSafetyRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function MedicationSafetyComplianceIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeMedicationSafetyComplianceIntelligence();
  const d = (raw as { data?: MedicationSafetyComplianceResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Medication Safety Compliance" description="Analysing medication safety and compliance data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Medication Safety Compliance" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load medication safety compliance data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.safety_rating];

  return (
    <PageShell
      title="Medication Safety Compliance"
      description="Accuracy, error rates, audit compliance, storage standards, emergency protocols, witness coverage, controlled drug compliance, PRN documentation and staff competency — the safety governance layer above day-to-day administration, evidencing that medication risks are systematically controlled (CHR 2015 Reg 24; NMS 27; CQC Medication Safety guidance)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <ShieldCheck className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Safety score: {d.safety_score}/100 · {d.total_administrations} administrations · accuracy {Math.round(d.administration_accuracy_rate)}% · error rate {Math.round(d.error_rate)}% · CD compliance {Math.round(d.controlled_drug_compliance_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.safety_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.error_rate > 2 || d.controlled_drug_compliance_rate < 100 || d.storage_pass_rate < 90) && (
          <div className="flex flex-col gap-2">
            {d.error_rate > 2 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Medication error rate {Math.round(d.error_rate)}% — any medication error is a potential safeguarding and clinical risk; an error rate above 2% indicates a systemic problem requiring urgent root cause analysis, not individual blame
              </div>
            )}
            {d.controlled_drug_compliance_rate < 100 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Controlled drug compliance {Math.round(d.controlled_drug_compliance_rate)}% — controlled drugs must be subject to 100% double-witnessed administration and rigorous stock reconciliation; any gap is a potential diversion or regulatory offence under the Misuse of Drugs Act
              </div>
            )}
            {d.storage_pass_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Storage pass rate {Math.round(d.storage_pass_rate)}% — improperly stored medication may be ineffective, degraded or accessible to children or unauthorised persons; storage failures are among the most commonly cited CQC and Ofsted medication findings
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total administrations", value: d.total_administrations, color: "text-blue-600" },
            { label: "Accuracy rate", value: `${Math.round(d.administration_accuracy_rate)}%`, color: d.administration_accuracy_rate < 95 ? "text-red-600" : "text-emerald-600" },
            { label: "Error rate", value: `${Math.round(d.error_rate)}%`, color: d.error_rate > 2 ? "text-red-600" : d.error_rate > 0 ? "text-amber-600" : "text-emerald-600" },
            { label: "Staff competency", value: `${Math.round(d.staff_competency_rate)}%`, color: d.staff_competency_rate < 90 ? "text-amber-600" : "text-emerald-600" },
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
              <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" /> Safety Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <RateBar label="Administration accuracy rate" value={d.administration_accuracy_rate} warn={99} />
              <RateBar label="Witness coverage rate" value={d.witness_rate} warn={95} />
              <RateBar label="Controlled drug compliance" value={d.controlled_drug_compliance_rate} warn={100} />
              <RateBar label="PRN documentation rate" value={d.prn_documentation_rate} warn={100} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" /> Governance & Assurance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <RateBar label="Audit compliance rate" value={d.audit_compliance_rate} warn={95} />
              <RateBar label="Storage pass rate" value={d.storage_pass_rate} warn={100} />
              <RateBar label="Emergency protocol currency" value={d.emergency_protocol_currency_rate} warn={100} />
              <RateBar label="Staff competency rate" value={d.staff_competency_rate} warn={100} />
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
          CHR 2015 Regulation 24 (Health care — the registered person must ensure medication is stored, administered and disposed of safely and in accordance with the prescriber's instructions and relevant guidance). NMS Standard 27 (Medicines — the home must have systems for the safe management of medicines including storage, administration, recording and disposal; all controlled drugs must be subject to additional security and double-witnessed administration). Misuse of Drugs Regulations 2001 (Schedule 2 and 3 controlled drugs require a register, double-witnessing and full stock reconciliation; failure to comply is a criminal offence). NICE Medicines Optimisation (NG5, 2015). Medication errors and controlled drug discrepancies are among the most serious regulatory findings Ofsted makes — and the most likely to trigger an urgent emergency action or police referral.
        </p>
      </div>
    </PageShell>
  );
}
