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

export function ProfessionalDevelopmentIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/professional-development")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading professional development intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const cpd = d.cpdQuality as Record<string, unknown>;
  const quals = d.qualificationProgress as Record<string, unknown>;
  const supervision = d.supervisionDevelopment as Record<string, unknown>;
  const culture = d.learningCulture as Record<string, unknown>;
  const profiles = (d.staffProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Professional Development Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="CPD Records" value={cpd.totalRecords as number} />
        <Stat label="Qualifications" value={quals.totalQualifications as number} />
        <Stat label="Avg CPD Hours" value={cpd.averageHoursPerStaff as number} />
      </div>

      <Section title="CPD Quality" defaultOpen>
        <ScoreBar label="CPD Quality" value={cpd.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Hours" value={cpd.totalHours as number} />
          <Stat label="Impact Assessed" value={`${cpd.impactAssessedRate}%`} />
          <Stat label="Positive Impact" value={`${cpd.positiveImpactRate}%`} />
          <Stat label="Shared With Team" value={`${cpd.sharedWithTeamRate}%`} />
          <Stat label="Relevant to Role" value={`${cpd.relevantToRoleRate}%`} />
          <Stat label="Certificates" value={`${cpd.certificateRate}%`} />
        </div>
      </Section>

      <Section title="Qualification Progress">
        <ScoreBar label="Qualifications" value={quals.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Completed" value={`${quals.completedRate}%`} />
          <Stat label="In Progress" value={`${quals.inProgressRate}%`} />
          <Stat label="Overdue" value={quals.overdueCount as number} />
          <Stat label="Funded" value={`${quals.fundedRate}%`} />
          <Stat label="Support Rate" value={`${quals.supportRate}%`} />
        </div>
      </Section>

      <Section title="Supervision Development">
        <ScoreBar label="Supervision Dev" value={supervision.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Goals Set" value={`${supervision.goalsSetRate}%`} />
          <Stat label="Progress Reviewed" value={`${supervision.progressReviewedRate}%`} />
          <Stat label="Training Needs" value={`${supervision.trainingNeedsRate}%`} />
          <Stat label="Action Plans" value={`${supervision.actionPlanRate}%`} />
          <Stat label="Actions Completed" value={`${supervision.actionsCompletedRate}%`} />
        </div>
      </Section>

      <Section title="Learning Culture">
        <ScoreBar label="Learning Culture" value={culture.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Team Meetings" value={`${culture.teamMeetingRate}%`} />
          <Stat label="Shared Learning" value={`${culture.sharedLearningRate}%`} />
          <Stat label="Reflective Practice" value={`${culture.reflectiveRate}%`} />
          <Stat label="Feedback Culture" value={`${culture.feedbackCultureRate}%`} />
          <Stat label="Innovation" value={`${culture.innovationRate}%`} />
          <Stat label="Budget Allocated" value={`${culture.budgetRate}%`} />
          <Stat label="Induction" value={`${culture.inductionRate}%`} />
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Staff Profiles (${profiles.length})`}>
          {profiles.map((p) => (
            <div key={p.staffId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{p.staffName as string}</span><span>{p.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">{p.totalCPDHours as number}h CPD · {p.qualificationsCompleted as number} completed · {p.qualificationsInProgress as number} in progress · Impact {p.impactAssessmentRate as number}%{(p.hasOverdueQualification as boolean) ? " · OVERDUE" : ""}</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
