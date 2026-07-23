"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>);
}
/** Rates are null when nothing was recorded — show the gap, never a fabricated number. */
function rateText(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value}%` : "—";
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>;
}
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>);
}
function ratingBadge(rating: string) {
  const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}
export function HomeMatchingImpactIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/home-matching-impact").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading home matching impact intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const scores = d.componentScores as Record<string, number>;
  const matching = d.matchingQuality as Record<string, number>;
  const impact = d.impactMonitoring as Record<string, number>;
  const consultation = d.residentConsultation as Record<string, number>;
  const outcomes = d.admissionOutcomes as Record<string, number>;
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Home Matching Impact Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Matching Quality" value={`${scores.matchingQuality}/25`} />
        <Stat label="Impact Monitoring" value={`${scores.impactMonitoring}/25`} />
        <Stat label="Consultation" value={`${scores.residentConsultation}/25`} />
      </div>
      <Section title="Matching Quality" defaultOpen>
        <ScoreBar label="Matching Quality" value={scores.matchingQuality} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Assessments" value={matching.totalAssessments} />
          <Stat label="Completion Rate" value={`${matching.assessmentCompletionRate}%`} />
          <Stat label="Children Consulted" value={`${matching.existingChildrenConsultedRate}%`} />
          <Stat label="Conditions Applied" value={rateText(matching.conditionsAppliedRate)} />
        </div>
      </Section>
      <Section title="Impact Monitoring">
        <ScoreBar label="Impact Monitoring" value={scores.impactMonitoring} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Records" value={impact.totalMonitoringRecords} />
          <Stat label="Positive Impact" value={`${impact.positiveImpactRate}%`} />
          <Stat label="Negative Impact" value={`${impact.negativeImpactRate}%`} />
          <Stat label="Resolution" value={rateText(impact.resolutionRate)} />
        </div>
      </Section>
      <Section title="Resident Consultation">
        <ScoreBar label="Consultation" value={scores.residentConsultation} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Consultations" value={consultation.totalConsultations} />
          <Stat label="Informed" value={`${consultation.informedRate}%`} />
          <Stat label="Views Sought" value={`${consultation.viewsSoughtRate}%`} />
          <Stat label="Views Acted Upon" value={`${consultation.viewsActedUponRate}%`} />
        </div>
      </Section>
      <Section title="Admission Outcomes">
        <ScoreBar label="Outcomes" value={scores.admissionOutcomes} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Outcomes" value={outcomes.totalOutcomes} />
          <Stat label="Placement Stability" value={`${outcomes.placementStabilityRate}%`} />
          <Stat label="Disruption Rate" value={`${outcomes.disruptionRate}%`} />
          <Stat label="Assessment Linked" value={`${outcomes.matchingAssessmentLinkedRate}%`} />
        </div>
      </Section>
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
