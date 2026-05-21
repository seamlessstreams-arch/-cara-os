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

export function AdmissionsMatchingIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admissions-matching")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading admissions matching intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const scores = d.componentScores as Record<string, number>;
  const referral = d.referralProcessing as Record<string, unknown>;
  const matching = d.matchingQuality as Record<string, unknown>;
  const intro = d.introductionPlanning as Record<string, unknown>;
  const outcomes = d.admissionOutcomes as Record<string, unknown>;
  const timelines = (d.referralTimelines ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Admissions Matching Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Referral Processing" value={`${scores.referralProcessing}/25`} />
        <Stat label="Matching Quality" value={`${scores.matchingQuality}/25`} />
        <Stat label="Introduction Planning" value={`${scores.introductionPlanning}/25`} />
      </div>

      <Section title="Referral Processing" defaultOpen>
        <ScoreBar label="Referral Processing" value={scores.referralProcessing} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Referrals" value={referral.totalReferrals as number} />
          <Stat label="Accepted" value={referral.acceptedCount as number} />
          <Stat label="Acceptance Rate" value={`${referral.acceptanceRate}%`} />
          <Stat label="Avg Processing Days" value={referral.averageProcessingDays as number} />
          <Stat label="Screening Timeliness" value={`${referral.screeningTimelinessRate}%`} />
          <Stat label="Declined" value={referral.declinedCount as number} />
        </div>
      </Section>

      <Section title="Matching Quality">
        <ScoreBar label="Matching Quality" value={scores.matchingQuality} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Assessments" value={matching.totalAssessments as number} />
          <Stat label="Avg Overall Score" value={matching.averageOverallScore as number} />
          <Stat label="Full Criteria Rate" value={`${matching.fullCriteriaAssessedRate}%`} />
          <Stat label="Group Dynamics" value={`${matching.groupDynamicsConsiderationRate}%`} />
        </div>
      </Section>

      <Section title="Introduction Planning">
        <ScoreBar label="Introduction Planning" value={scores.introductionPlanning} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Plans" value={intro.totalPlans as number} />
          <Stat label="Welcome Pack" value={`${intro.welcomePackRate}%`} />
          <Stat label="Children Consulted" value={`${intro.childrenConsultedRate}%`} />
          <Stat label="Child Voice" value={`${intro.childVoiceRate}%`} />
          <Stat label="Phase Completion" value={`${intro.phaseCompletionRate}%`} />
          <Stat label="Key Worker Assigned" value={`${intro.keyWorkerAssignedRate}%`} />
        </div>
      </Section>

      <Section title="Admission Outcomes">
        <ScoreBar label="Admission Outcomes" value={scores.admissionOutcomes} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Outcomes" value={outcomes.totalOutcomes as number} />
          <Stat label="Settling-In Review" value={`${outcomes.settlingInReviewRate}%`} />
          <Stat label="Initial Careplan" value={`${outcomes.initialCareplanRate}%`} />
          <Stat label="Placement Plan Signed" value={`${outcomes.placementPlanSignedRate}%`} />
          <Stat label="Existing Children Feedback" value={`${outcomes.existingChildrenFeedbackRate}%`} />
        </div>
      </Section>

      {timelines.length > 0 && (
        <Section title={`Referral Timelines (${timelines.length})`}>
          {timelines.map((t) => (
            <div key={t.referralId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{t.childName as string}</span><span>{t.totalDurationDays as number} days</span></div>
              <p className="text-xs text-gray-500 mt-1">Status: {(t.currentStatus as string).replace(/_/g, " ")} · Assessment: {t.hasAssessment ? "✓" : "✗"} · Intro Plan: {t.hasIntroductionPlan ? "✓" : "✗"} · Outcome: {t.hasAdmissionOutcome ? "✓" : "✗"}</p>
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
