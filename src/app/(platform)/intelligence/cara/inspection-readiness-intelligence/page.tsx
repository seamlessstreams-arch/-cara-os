"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, AlertTriangle, Clock, Star, TrendingUp, ShieldAlert } from "lucide-react";
import { useInspectionReadinessIntelligence } from "@/hooks/use-inspection-readiness-intelligence";
import type { ReadinessGrade } from "@/lib/engines/inspection-readiness-intelligence-engine";

import { formatRate } from "@/lib/metrics/rate";

const GRADE_META: Record<ReadinessGrade, { label: string; color: string; bg: string; border: string }> = {
  outstanding:          { label: "Outstanding",          color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:                 { label: "Good",                 color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  requires_improvement: { label: "Requires Improvement", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:           { label: "Inadequate",           color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
};

// A home with nothing recorded has no grade. It must not borrow one — least of
// all a reassuring one — so it gets its own neutral treatment.
const UNGRADED = { label: "Not yet measured", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };

const STRENGTH_META: Record<string, { label: string; color: string; bg: string }> = {
  strong:   { label: "Strong",   color: "text-emerald-700", bg: "bg-emerald-50" },
  adequate: { label: "Adequate", color: "text-blue-700",    bg: "bg-blue-50" },
  weak:     { label: "Weak",     color: "text-amber-700",   bg: "bg-amber-50" },
  missing:  { label: "Missing",  color: "text-red-700",     bg: "bg-red-50" },
};

const SEV_META: Record<string, string> = {
  critical:    "bg-red-50 border-red-200 text-red-800",
  significant: "bg-amber-50 border-amber-200 text-amber-800",
  high:        "bg-amber-50 border-amber-200 text-amber-800",
  medium:      "bg-blue-50 border-blue-200 text-blue-800",
  minor:       "bg-slate-50 border-slate-200 text-slate-700",
  low:         "bg-slate-50 border-slate-200 text-slate-700",
};

export default function InspectionReadinessIntelligencePage() {
  const { data, isLoading, error } = useInspectionReadinessIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Inspection Readiness Intelligence" description="Analysing Ofsted inspection readiness…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Inspection Readiness Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load inspection readiness intelligence data.</div>
      </PageShell>
    );
  }

  const grade = d.overall_grade === null ? UNGRADED : GRADE_META[d.overall_grade];
  const criticalGaps = d.regulatory_gaps.filter(g => g.severity === "critical");
  const criticalActions = d.action_priorities.filter(a => a.severity === "critical");

  return (
    <PageShell
      title="Inspection Readiness Intelligence"
      description="Overall readiness grade, judgment area profiles, regulatory gaps and evidence strength across Ofsted ILACS 2023 and SCCIF domains."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${grade.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${grade.bg} ${grade.border} border`}>
                <Search className={`h-5 w-5 ${grade.color}`} />
                <span className={`text-sm font-semibold ${grade.color}`}>{grade.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Readiness score: {d.overall_readiness_score}/100 · {criticalGaps.length} critical gaps · {d.key_risks.length} key risks
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.overall_readiness_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {criticalGaps.length > 0 && (
          <div className="flex flex-col gap-2">
            {criticalGaps.slice(0, 3).map((gap, i) => (
              <div key={i} className="flex items-start gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span><strong>{gap.regulation_label}:</strong> {gap.gap_description}</span>
              </div>
            ))}
            {criticalGaps.length > 3 && (
              <p className="text-xs text-red-600 pl-1">+{criticalGaps.length - 3} more critical gaps below</p>
            )}
          </div>
        )}

        {/* Judgment areas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {d.judgment_areas.map((ja) => {
            const g = ja.grade === null ? UNGRADED : (GRADE_META[ja.grade] ?? UNGRADED);
            return (
              <Card key={ja.area} className={`border ${g.border}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ja.area_label}</CardTitle>
                    <Badge className={`text-xs border ${g.border} ${g.bg} ${g.color} font-medium`} variant="outline">{g.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${ja.score === null ? "bg-transparent" : ja.score >= 80 ? "bg-emerald-500" : ja.score >= 60 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${ja.score ?? 0}%` }} />
                    </div>
                    <span className="text-sm font-bold">{ja.score ?? "—"}</span>
                  </div>
                  {ja.strengths.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-emerald-700 mb-1">Strengths</p>
                      <ul className="space-y-0.5">
                        {ja.strengths.slice(0, 2).map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1"><CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ja.gaps.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-amber-700 mb-1">Gaps</p>
                      <ul className="space-y-0.5">
                        {ja.gaps.slice(0, 2).map((g, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1"><AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Evidence strength */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Evidence Strength by Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {d.evidence_strength.map((es) => {
                const sm = STRENGTH_META[es.strength] ?? STRENGTH_META.weak;
                return (
                  <div key={es.category} className={`rounded border p-2 ${sm.bg}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{es.category_label}</p>
                      <Badge variant="outline" className={`text-xs border-current ${sm.color}`}>{sm.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{es.evidence_count} evidence items</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Regulatory gaps */}
        {d.regulatory_gaps.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  Regulatory Gaps
                </CardTitle>
                <Badge variant="outline" className="text-xs">{d.regulatory_gaps.length} gaps</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {d.regulatory_gaps.map((gap, i) => (
                <div key={i} className={`rounded border px-3 py-2 text-xs ${SEV_META[gap.severity] ?? SEV_META.minor}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{gap.regulation_label}</span>
                    <Badge variant="outline" className="text-xs capitalize border-current">{gap.severity}</Badge>
                  </div>
                  <p className="text-xs opacity-90">{gap.gap_description}</p>
                  <p className="text-xs opacity-70 mt-1 italic">Remediation: {gap.remediation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action priorities */}
        {d.action_priorities.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Action Priorities
                </CardTitle>
                {criticalActions.length > 0 && (
                  <Badge variant="destructive" className="text-xs">{criticalActions.length} critical</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {d.action_priorities.map((action) => (
                <div key={action.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{action.rank}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{action.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.regulation} · Deadline: {action.deadline_suggestion}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs capitalize border ${SEV_META[action.severity] ?? ""}`}>{action.severity}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Key risks */}
        {d.key_risks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Key Risks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {d.key_risks.map((risk, i) => (
                <div key={i} className={`rounded border px-3 py-2 text-xs ${SEV_META[risk.severity] ?? SEV_META.medium}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium">{risk.risk}</span>
                    <Badge variant="outline" className="text-xs capitalize border-current">{risk.severity}</Badge>
                  </div>
                  <p className="opacity-80">{risk.impact}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
          {d.compliance_matrix.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-muted-foreground" /> Compliance Matrix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {d.compliance_matrix.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.area}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${item.rate === null ? "text-muted-foreground" : item.rate >= 90 ? "text-emerald-600" : item.rate >= 70 ? "text-amber-600" : "text-red-500"}`}>{formatRate(item.rate)}</span>
                      {item.compliant ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <p className="text-xs text-muted-foreground border-t pt-3">
          Ofsted ILACS 2023 (Inspection of Local Authority Children's Services). SCCIF (Social Care Common Inspection Framework). Three judgment areas: overall experiences and progress, how well children are helped and protected, leadership and management.
        </p>
      </div>
    </PageShell>
  );
}
