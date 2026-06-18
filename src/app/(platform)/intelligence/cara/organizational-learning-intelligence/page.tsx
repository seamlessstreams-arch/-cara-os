"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeOrganizationalLearningIntelligence } from "@/hooks/use-home-organizational-learning-intelligence";
import type { HomeOrganizationalLearningResult, OrgLearningRating } from "@/lib/engines/home-organizational-learning-intelligence-engine";

const RATING_META: Record<OrgLearningRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function OrganizationalLearningIntelligencePage() {
  const { data, isLoading, error } = useHomeOrganizationalLearningIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Organisational Learning Intelligence" description="Analysing serious incident reviews, debriefs and service improvements…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Organisational Learning Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load organisational learning data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.org_learning_rating];
  const sir = d.sir;
  const deb = d.debriefs;
  const imp = d.improvements;
  const sourceEntries = Object.entries(imp.by_source).sort(([, a], [, b]) => b - a);

  return (
    <PageShell
      title="Organisational Learning Intelligence"
      description="Serious incident review completion and action follow-through, critical incident debrief culture, service improvement tracking across multiple sources — evidencing that the home is a learning organisation that converts difficult events into embedded practice change rather than paperwork (CHR 2015 Reg 45; Reg 34; SCCIF continuous improvement)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <BookOpen className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Learning score: {d.org_learning_score}/100 · {sir.total_reviews} SIRs · SIR action completion {sir.action_completion_rate}% · {sir.actions_overdue} overdue · {imp.implemented_count + imp.embedded_count} improvements delivered
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.org_learning_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(sir.actions_overdue > 0 || imp.red_rag_count > 0 || imp.overdue_count > 0) && (
          <div className="flex flex-col gap-2">
            {sir.actions_overdue > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {sir.actions_overdue} overdue action{sir.actions_overdue > 1 ? "s" : ""} from serious incident reviews — overdue SIR actions mean that lessons identified from serious harm are not being implemented; the risk event remains unaddressed until every action is closed
              </div>
            )}
            {imp.red_rag_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {imp.red_rag_count} service improvement{imp.red_rag_count > 1 ? "s" : ""} at RED RAG — high-risk improvement initiatives that are stalling represent a governance failure and need escalation to the responsible individual or provider
              </div>
            )}
            {imp.overdue_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {imp.overdue_count} service improvement{imp.overdue_count > 1 ? "s" : ""} overdue — improvement culture requires follow-through; overdue initiatives signal that change is being planned but not executed
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total SIRs", value: sir.total_reviews, color: "text-blue-600" },
            { label: "SIR actions overdue", value: sir.actions_overdue, color: sir.actions_overdue > 0 ? "text-red-600" : "text-emerald-600" },
            { label: "Lessons learned", value: sir.total_lessons_learned, color: "text-foreground" },
            { label: "Practice changes", value: sir.practice_changes_total, color: "text-foreground" },
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
              <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> Serious Incident Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="SIR action completion rate" value={sir.action_completion_rate} warn={90} />
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{sir.completed_reviews}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className={`rounded border p-2 text-center ${sir.open_reviews >= 3 ? "border-amber-200 bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${sir.open_reviews >= 3 ? "text-amber-600" : "text-foreground"}`}>{sir.open_reviews}</p>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
                <div className={`rounded border p-2 text-center ${sir.actions_overdue > 0 ? "border-red-200 bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${sir.actions_overdue > 0 ? "text-red-600" : "text-emerald-600"}`}>{sir.actions_overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue actions</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{sir.total_actions}</p>
                  <p className="text-xs text-muted-foreground">Total actions</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-600">{sir.actions_completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> Debriefs & Improvements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Debrief completion rate (90d)" value={deb.completed_rate} warn={90} />
              <RateBar label="Debrief action completion" value={deb.action_completion_rate} warn={80} />
              <RateBar label="Improvement milestone achievement" value={imp.milestone_achievement_rate} warn={70} />
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{deb.total_debriefs_90d}</p>
                  <p className="text-xs text-muted-foreground">Debriefs (90d)</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{imp.active_improvements}</p>
                  <p className="text-xs text-muted-foreground">Active improvements</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-600">{imp.implemented_count + imp.embedded_count}</p>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </div>
                <div className={`rounded border p-2 text-center ${imp.red_rag_count > 0 ? "border-red-200 bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${imp.red_rag_count > 0 ? "text-red-600" : "text-foreground"}`}>{imp.red_rag_count}</p>
                  <p className="text-xs text-muted-foreground">RED RAG</p>
                </div>
              </div>
              {sourceEntries.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Improvement sources</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sourceEntries.map(([src, count]) => (
                      <div key={src} className="flex items-center gap-1 rounded border bg-muted/30 px-2 py-1">
                        <span className="text-xs font-medium capitalize">{src.replace(/_/g, " ")}</span>
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
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{rec.urgency}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          CHR 2015 Regulation 45 (annual review of quality of care — the registered person must undertake a review at least annually, considering the welfare, health, safety and development of the children, the effectiveness of the home's policies, the quality and appropriateness of care, and whether improvements are needed; the review must inform a written report submitted to Ofsted). CHR 2015 Regulation 34 (independent review of decisions and restraint) — serious incidents involving restraint require review and learning integration. SCCIF — inspectors assess whether "the home demonstrates continuous improvement" through evidence of lessons learned from audits, incidents, complaints, and external reviews, and whether improvements are embedded in practice rather than noted in documents. A learning organisation captures learning from every serious event, acts on it systematically, measures whether practice has changed, and uses the whole ecosystem of evidence (Reg 44/45 feedback, children's voice, audits, sector guidance) to continuously improve. The absence of a service improvement board, or the presence of large numbers of overdue SIR actions, is one of the strongest indicators of an organisation that is not learning.
        </p>
      </div>
    </PageShell>
  );
}
