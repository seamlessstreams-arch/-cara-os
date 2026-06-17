"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeStaffTrainingCpdComplianceIntelligence } from "@/hooks/use-home-staff-training-cpd-compliance-intelligence";
import type { TrainingComplianceRating } from "@/lib/engines/home-staff-training-cpd-compliance-intelligence-engine";

const RATING_META: Record<TrainingComplianceRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function StaffTrainingCpdIntelligencePage() {
  const { data, isLoading, error } = useHomeStaffTrainingCpdComplianceIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Staff Training & CPD Intelligence" description="Analysing staff training and CPD data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Staff Training & CPD Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load staff training and CPD data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.training_rating];

  return (
    <PageShell
      title="Staff Training & CPD Intelligence"
      description="Mandatory training compliance, CPD hours, qualifications, development plans and training effectiveness (CHR 2015 Reg 35; Social Work England CPD; Ofsted staff suitability)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <GraduationCap className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Training score: {d.training_score}/100 · {d.cpd_avg_hours_per_staff.toFixed(1)} CPD hrs/staff · {d.mandatory_training_compliance_rate}% mandatory compliance
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.training_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.mandatory_training_expired_count > 0 || d.mandatory_training_overdue_count > 0) && (
          <div className="flex flex-wrap gap-2">
            {d.mandatory_training_overdue_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {d.mandatory_training_overdue_count} mandatory training record(s) overdue — immediate action required
              </div>
            )}
            {d.mandatory_training_expired_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {d.mandatory_training_expired_count} mandatory training record(s) expired — rebook now
              </div>
            )}
          </div>
        )}

        {/* Key compliance rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  Mandatory Training
                </CardTitle>
                <Badge variant="outline" className="text-xs">{d.mandatory_training_total} total records</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{d.mandatory_training_valid_count}</p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
                <div className={`rounded border p-2 text-center ${d.mandatory_training_expired_count > 0 ? "bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${d.mandatory_training_expired_count > 0 ? "text-amber-700" : "text-foreground"}`}>{d.mandatory_training_expired_count}</p>
                  <p className="text-xs text-muted-foreground">Expired</p>
                </div>
                <div className={`rounded border p-2 text-center ${d.mandatory_training_overdue_count > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${d.mandatory_training_overdue_count > 0 ? "text-red-600" : "text-foreground"}`}>{d.mandatory_training_overdue_count}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
              <RateBar label="Mandatory compliance rate" value={d.mandatory_training_compliance_rate} warn={100} />
              <RateBar label="Training effectiveness" value={d.training_effectiveness_rate} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                CPD & Development
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-xs text-muted-foreground">Total CPD hours</span>
                <span className="text-sm font-medium">{d.cpd_total_hours}h</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-xs text-muted-foreground">Avg hours per staff</span>
                <span className={`text-sm font-medium ${d.cpd_avg_hours_per_staff < 10 ? "text-amber-600" : "text-foreground"}`}>
                  {d.cpd_avg_hours_per_staff.toFixed(1)}h
                </span>
              </div>
              <RateBar label="CPD completion rate" value={d.cpd_completion_rate} />
              <RateBar label="Training needs addressed" value={d.training_needs_coverage_rate} />
              <RateBar label="Development plan coverage" value={d.development_plan_coverage_rate} />
            </CardContent>
          </Card>
        </div>

        {/* Qualifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Qualifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded border bg-emerald-50 p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">{d.qualifications_achieved_count}</p>
                <p className="text-xs text-muted-foreground mt-1">Achieved</p>
              </div>
              <div className="rounded border bg-blue-50 p-3 text-center">
                <p className="text-xl font-bold text-blue-700">{d.qualifications_in_progress_count}</p>
                <p className="text-xs text-muted-foreground mt-1">In progress</p>
              </div>
              <div className={`rounded border p-3 text-center ${d.qualifications_expired_count > 0 ? "bg-amber-50" : "bg-muted/30"}`}>
                <p className={`text-xl font-bold ${d.qualifications_expired_count > 0 ? "text-amber-700" : "text-foreground"}`}>{d.qualifications_expired_count}</p>
                <p className="text-xs text-muted-foreground mt-1">Expired</p>
              </div>
              <div className="rounded border bg-muted/30 p-3 text-center">
                <p className="text-xl font-bold">{d.development_plans_active_count}</p>
                <p className="text-xs text-muted-foreground mt-1">Active dev plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
          CHR 2015 Reg 35 (staff training and development). Social Work England CPD requirements. Ofsted staff suitability and training compliance. Level 4+ diploma requirements for registered managers.
        </p>
      </div>
    </PageShell>
  );
}
