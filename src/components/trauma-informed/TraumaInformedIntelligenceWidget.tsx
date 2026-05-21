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

export function TraumaInformedIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trauma-informed")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading trauma-informed intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const staffCompetency = d.staffCompetency as Record<string, unknown>;
  const practiceQuality = d.practiceQuality as Record<string, unknown>;
  const environment = d.environment as Record<string, unknown>;
  const consultation = d.consultation as Record<string, unknown>;
  const traumaScreening = d.traumaScreening as Record<string, unknown>;
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as { regulation: string; description: string; relevance: string }[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Trauma-Informed Care Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Staff" value={staffCompetency.staffCount as number} />
        <Stat label="Interventions" value={practiceQuality.totalInterventions as number} />
        <Stat label="Consultations" value={consultation.totalConsultations as number} />
      </div>

      <Section title="Staff Competency" defaultOpen>
        <ScoreBar label="Staff Competency" value={staffCompetency.score as number} max={20} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Training Coverage" value={`${staffCompetency.trainingCoverageRate}%`} />
          <Stat label="Avg Level" value={String(staffCompetency.averageCompetencyLevel).replace(/_/g, " ")} />
          <Stat label="Specialists" value={staffCompetency.specialistCount as number} />
          <Stat label="Expired Training" value={staffCompetency.expiredTrainingCount as number} />
        </div>
      </Section>

      <Section title="Practice Quality">
        <ScoreBar label="Practice Quality" value={practiceQuality.score as number} max={30} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Principle Coverage" value={`${practiceQuality.principleCoverage}%`} />
          <Stat label="Indicator Coverage" value={`${practiceQuality.indicatorCoverage}%`} />
          <Stat label="Positive Response" value={`${practiceQuality.positiveResponseRate}%`} />
          <Stat label="Intervention Types" value={practiceQuality.interventionVariety as number} />
        </div>
      </Section>

      <Section title="Environment">
        <ScoreBar label="Environment" value={environment.score as number} max={15} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Adaptations" value={environment.totalAdaptations as number} />
          <Stat label="Active" value={environment.activeAdaptations as number} />
          <Stat label="Coverage" value={`${environment.adaptationCoverage}%`} />
          <Stat label="Review Currency" value={`${environment.reviewCurrency}%`} />
          <Stat label="Child-Specific" value={environment.childSpecificCount as number} />
          <Stat label="Overdue Reviews" value={environment.overdueReviews as number} />
        </div>
      </Section>

      <Section title="Clinical Consultation">
        <ScoreBar label="Consultation" value={consultation.score as number} max={15} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Frequency/Month" value={consultation.consultationFrequencyPerMonth as number} />
          <Stat label="Action Completion" value={`${consultation.actionCompletionRate}%`} />
          <Stat label="Children Coverage" value={`${consultation.childrenCoverage}%`} />
          <Stat label="Specialist Variety" value={consultation.specialistVariety as number} />
        </div>
      </Section>

      <Section title="Trauma Screening">
        <ScoreBar label="Screening" value={traumaScreening.score as number} max={20} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Screening Coverage" value={`${traumaScreening.screeningCoverage}%`} />
          <Stat label="Trigger Documentation" value={`${traumaScreening.triggerDocumentationRate}%`} />
          <Stat label="Coping Strategies" value={`${traumaScreening.copingStrategyRate}%`} />
          <Stat label="Needs Assessed" value={`${traumaScreening.therapeuticNeedsAssessedRate}%`} />
          <Stat label="Referral Rate" value={`${traumaScreening.referralRate}%`} />
          <Stat label="Overdue Reviews" value={traumaScreening.overdueReviews as number} />
        </div>
      </Section>

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links">
        <ul className="text-sm text-gray-600 space-y-1">
          {regs.map((r, i) => (
            <li key={i}><span className="font-medium">{r.regulation}</span> — {r.description}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
