"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertTriangle, Clock, Star, ShieldAlert } from "lucide-react";
import { useHomePolicyComplianceIntelligence } from "@/hooks/use-home-policy-compliance-intelligence";
import type { HomePolicyResult, PolicyRating } from "@/lib/engines/home-policy-compliance-intelligence-engine";

const RATING_META: Record<PolicyRating, { label: string; color: string; bg: string; border: string }> = {
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

const MANDATORY_CATEGORIES: { key: keyof Pick<HomePolicyResult["coverage_profile"], "has_safeguarding" | "has_behaviour" | "has_medication" | "has_health_safety" | "has_complaints" | "has_missing_persons" | "has_fire_safety">; label: string; ref: string }[] = [
  { key: "has_safeguarding",   label: "Safeguarding",    ref: "CHR 2015 Reg 34" },
  { key: "has_behaviour",      label: "Behaviour",       ref: "CHR 2015 Reg 35" },
  { key: "has_medication",     label: "Medication",      ref: "CHR 2015 Reg 19" },
  { key: "has_health_safety",  label: "Health & Safety", ref: "HSWA 1974" },
  { key: "has_complaints",     label: "Complaints",      ref: "CHR 2015 Reg 36" },
  { key: "has_missing_persons", label: "Missing Persons", ref: "CHR 2015 Reg 40" },
  { key: "has_fire_safety",    label: "Fire Safety",     ref: "Regulatory Reform Order 2005" },
];

export default function PolicyComplianceIntelligencePage() {
  const { data, isLoading, error } = useHomePolicyComplianceIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Policy Compliance Intelligence" description="Analysing policy currency, staff acknowledgement, regulatory coverage, and governance data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Policy Compliance Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load policy compliance data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.policy_rating];
  const cp = d.compliance_profile;
  const ap = d.acknowledgement_profile;
  const cov = d.coverage_profile;
  const gp = d.governance_profile;

  const missingMandatory = MANDATORY_CATEGORIES.filter(c => !cov[c.key]);

  return (
    <PageShell
      title="Policy Compliance Intelligence"
      description="Policy currency rates, staff acknowledgement coverage, regulatory category gaps, and governance quality — evidencing that the home maintains a current, comprehensive, and actively used policy framework that staff understand and have signed off on (CHR 2015 Reg 35, Reg 16; SCCIF: Well-led and managed)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <FileText className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Policy score: {d.policy_score}/100 · {cp.total_policies} policies · {cp.current_count} current · {cp.overdue_count} overdue · acknowledgement {Math.round(ap.avg_acknowledgement_rate)}% · {cov.unique_categories} categories
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.policy_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(cp.overdue_count > 0 || !cov.has_safeguarding || ap.below_threshold_count > 0) && (
          <div className="flex flex-col gap-2">
            {cp.overdue_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
                {cp.overdue_count} {cp.overdue_count === 1 ? "policy is" : "policies are"} overdue for review — overdue policies are not just a compliance failure; they may contain outdated guidance on safeguarding, behaviour support, or medication that actively puts children and staff at risk; an inspector finding overdue policies will take this very seriously
              </div>
            )}
            {!cov.has_safeguarding && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
                No current safeguarding policy — a residential home operating without a current safeguarding policy is in serious breach of CHR 2015 Reg 34; this is one of the most fundamental requirements of any home's policy framework and would be a major concern in any inspection
              </div>
            )}
            {ap.below_threshold_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {ap.below_threshold_count} {ap.below_threshold_count === 1 ? "policy has" : "policies have"} staff acknowledgement below 80% — a policy that staff have not read and signed does not protect the home, the children, or the staff themselves; acknowledgement rates are a proxy for whether the home's written standards have actually reached its workforce
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total policies", value: cp.total_policies, color: "text-foreground" },
            { label: "Current", value: cp.current_count, color: "text-emerald-600" },
            { label: "Overdue", value: cp.overdue_count, color: cp.overdue_count > 0 ? "text-red-600" : "text-emerald-600" },
            { label: "Due for review", value: cp.due_review_count, color: cp.due_review_count > 0 ? "text-amber-600" : "text-emerald-600" },
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
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> Compliance & Governance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Currency rate" value={cp.currency_rate} warn={90} />
              <RateBar label="Staff acknowledgement rate" value={ap.avg_acknowledgement_rate} warn={80} />
              <RateBar label="Statutory basis rate" value={gp.statutory_basis_rate} warn={85} />
              <RateBar label="Key points documented rate" value={gp.key_points_rate} warn={85} />
              <div className="text-xs text-muted-foreground pt-1">
                Average days since review: <span className={`font-medium ${gp.avg_days_since_review > 365 ? "text-red-600" : gp.avg_days_since_review > 180 ? "text-amber-600" : "text-emerald-600"}`}>{Math.round(gp.avg_days_since_review)} days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-muted-foreground" /> Mandatory Category Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {MANDATORY_CATEGORIES.map(c => (
                  <div key={c.key} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      {cov[c.key]
                        ? <CheckCircle className="h-3 w-3 text-emerald-500" />
                        : <AlertTriangle className="h-3 w-3 text-red-500" />}
                      {c.label}
                    </span>
                    <span className={`text-muted-foreground ${!cov[c.key] ? "text-red-600 font-medium" : ""}`}>{c.ref}</span>
                  </div>
                ))}
              </div>
              {missingMandatory.length > 0 && (
                <p className="text-xs text-red-600 mt-2 border-t pt-2">
                  {missingMandatory.length} mandatory {missingMandatory.length === 1 ? "category" : "categories"} missing: {missingMandatory.map(c => c.label).join(", ")}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">{cov.unique_categories} unique categories in total</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Fully acknowledged policies", value: ap.fully_acknowledged_count, color: "text-emerald-600" },
            { label: "Below 80% acknowledgement", value: ap.below_threshold_count, color: ap.below_threshold_count > 0 ? "text-amber-600" : "text-emerald-600" },
            { label: "Draft policies", value: cp.draft_count, color: cp.draft_count > 0 ? "text-blue-600" : "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
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
          CHR 2015 Regulation 35 — the registered person must have a written behaviour management policy and procedures; Regulation 16 — the registered person must ensure that each member of staff receives the information, instruction, training, and supervision necessary to enable them to carry out their duties. Policy compliance intelligence evidences both. The SCCIF "Well-led and managed" domain specifically asks inspectors to evaluate whether the home has robust policies that are reviewed regularly and are understood by staff; a high acknowledgement rate with documented statutory bases and key points summaries is direct evidence of well-led policy governance. Policy currency is not merely an administrative matter: an outdated safeguarding policy may reference procedures, thresholds, or contacts that no longer exist; an outdated medication policy may conflict with current CQC or NICE guidance. Homes should treat policy review as a live quality and safety process rather than a periodic compliance exercise. Staff who have not read and signed key policies cannot rely on those policies as a defence if something goes wrong; acknowledgement records are both a quality signal and a liability management tool.
        </p>
      </div>
    </PageShell>
  );
}
