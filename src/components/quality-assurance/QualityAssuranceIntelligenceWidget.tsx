"use client";

import { useEffect, useState } from "react";

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div>
      <div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>;
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded mb-3">
      <button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>
      {open && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}

function ratingBadge(rating: string) {
  const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function QualityAssuranceIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/quality-assurance")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading quality assurance intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const audit = d.auditCycle as Record<string, unknown>;
  const action = d.actionTracking as Record<string, unknown>;
  const improvement = d.improvement as Record<string, number>;
  const selfEval = d.selfEvaluation as Record<string, unknown>;
  const monitoring = d.monitoring as Record<string, unknown>;
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Quality Assurance Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Audits" value={audit.totalAudits as number} />
        <Stat label="Actions" value={action.totalActions as number} />
        <Stat label="Initiatives" value={improvement.totalInitiatives} />
      </div>

      <Section title="Audit Cycle" defaultOpen>
        <ScoreBar label="Audit Cycle" value={audit.overallAuditScore as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Areas Audited" value={`${audit.areasAudited as number}/${audit.totalAuditAreas as number}`} />
          <Stat label="Coverage" value={`${audit.coverageRate as number}%`} />
          <Stat label="Avg Findings" value={audit.averageFindings as number} />
          <Stat label="Critical Findings" value={audit.criticalFindingsTotal as number} />
        </div>
        {(audit.improvingAreas as string[]).length > 0 && <p className="text-xs text-green-700 mt-2">Improving: {(audit.improvingAreas as string[]).join(", ")}</p>}
        {(audit.decliningAreas as string[]).length > 0 && <p className="text-xs text-red-700 mt-1">Declining: {(audit.decliningAreas as string[]).join(", ")}</p>}
      </Section>

      <Section title="Action Tracking">
        <ScoreBar label="Action Tracking" value={action.overallActionScore as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Completed" value={action.completedActions as number} />
          <Stat label="Overdue" value={action.overdueActions as number} />
          <Stat label="Completion Rate" value={`${action.completionRate as number}%`} />
          <Stat label="Overdue Rate" value={`${action.overdueRate as number}%`} />
          <Stat label="Avg Days" value={action.averageCompletionDays as number} />
          <Stat label="Impact Assessed" value={`${action.impactAssessedRate as number}%`} />
        </div>
      </Section>

      <Section title="Improvement Initiatives">
        <ScoreBar label="Improvement" value={improvement.overallImprovementScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Active" value={improvement.activeInitiatives} />
          <Stat label="Completed" value={improvement.completedInitiatives} />
          <Stat label="Completion Rate" value={`${improvement.completionRate}%`} />
          <Stat label="Child Involvement" value={`${improvement.childInvolvementRate}%`} />
          <Stat label="Staff Involvement" value={`${improvement.staffInvolvementRate}%`} />
          <Stat label="Measurable" value={`${improvement.measurableOutcomeRate}%`} />
        </div>
      </Section>

      <Section title="Self-Evaluation">
        <ScoreBar label="Self-Evaluation" value={selfEval.overallSelfEvalScore as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Evaluations" value={selfEval.totalEvaluations as number} />
          <Stat label="Domains" value={`${selfEval.domainsCovered as number}/${selfEval.totalDomains as number}`} />
          <Stat label="Avg Rating" value={selfEval.averageRating as number} />
          <Stat label="Child Voice" value={`${selfEval.childVoiceRate as number}%`} />
          <Stat label="Staff Voice" value={`${selfEval.staffVoiceRate as number}%`} />
          <Stat label="External Feedback" value={`${selfEval.externalFeedbackRate as number}%`} />
        </div>
      </Section>

      <Section title="Quality Monitoring">
        <ScoreBar label="Monitoring" value={monitoring.overallMonitoringScore as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Activities" value={monitoring.totalMonitoring as number} />
          <Stat label="Avg Compliance" value={`${monitoring.averageComplianceRate as number}%`} />
          <Stat label="Follow-Up Required" value={`${monitoring.followUpRequiredRate as number}%`} />
          <Stat label="Follow-Up Completed" value={`${monitoring.followUpCompletedRate as number}%`} />
        </div>
      </Section>

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
