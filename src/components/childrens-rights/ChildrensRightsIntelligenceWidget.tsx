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

export function ChildrensRightsIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/childrens-rights")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading children&apos;s rights intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const guide = d.guideCompliance as Record<string, number>;
  const advocacy = d.advocacy as Record<string, number>;
  const rights = d.rightsAwareness as Record<string, number>;
  const participation = d.participation as Record<string, number>;
  const complaint = d.complaintAccess as Record<string, number>;
  const feedback = d.feedback as Record<string, number>;
  const childProfiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Children&apos;s Rights &amp; Advocacy Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Guide Compliance" value={`${guide.overallComplianceScore}/100`} />
        <Stat label="Advocacy" value={`${advocacy.overallScore}/100`} />
        <Stat label="Rights Awareness" value={`${rights.overallScore}/100`} />
        <Stat label="Participation" value={`${participation.overallScore}/100`} />
        <Stat label="Complaint Access" value={`${complaint.overallScore}/100`} />
      </div>

      <Section title="Guide Compliance" defaultOpen>
        <ScoreBar label="Guide Compliance Score" value={guide.overallComplianceScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Children" value={guide.totalChildren} />
          <Stat label="Guides Provided" value={guide.guidesProvided} />
          <Stat label="Age Appropriate" value={`${guide.ageAppropriateRate}%`} />
          <Stat label="Accessible Format" value={`${guide.accessibleFormatRate}%`} />
          <Stat label="Covers Complaints" value={`${guide.coversComplaintsRate}%`} />
          <Stat label="Covers Advocacy" value={`${guide.coversAdvocacyRate}%`} />
          <Stat label="Covers Rights" value={`${guide.coversRightsRate}%`} />
          <Stat label="Child Understanding" value={`${guide.childUnderstandingRate}%`} />
        </div>
      </Section>

      <Section title="Advocacy">
        <ScoreBar label="Advocacy Score" value={advocacy.overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Records" value={advocacy.totalRecords} />
          <Stat label="Active Advocacy" value={advocacy.activeAdvocacy} />
          <Stat label="Offered Rate" value={`${advocacy.advocacyOfferedRate}%`} />
          <Stat label="Engaged Rate" value={`${advocacy.advocacyEngagedRate}%`} />
          <Stat label="Satisfaction" value={`${advocacy.satisfactionRate}%`} />
        </div>
      </Section>

      <Section title="Rights Awareness">
        <ScoreBar label="Rights Awareness Score" value={rights.overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Assessments" value={rights.totalAssessments} />
          <Stat label="Children Assessed" value={rights.childrenAssessed} />
          <Stat label="Avg Rights Understood" value={rights.averageRightsUnderstood} />
          <Stat label="Total Categories" value={rights.totalRightsCategories} />
        </div>
      </Section>

      <Section title="Participation">
        <ScoreBar label="Participation Score" value={participation.overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Records" value={participation.totalRecords} />
          <Stat label="Views Recorded" value={`${participation.childViewRecordedRate}%`} />
          <Stat label="Views Influenced Outcome" value={`${participation.viewInfluencedOutcomeRate}%`} />
          <Stat label="Avg Participation Level" value={participation.averageParticipationLevel} />
        </div>
      </Section>

      <Section title="Complaint Access">
        <ScoreBar label="Complaint Access Score" value={complaint.overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Assessments" value={complaint.totalAssessments} />
          <Stat label="Knows How" value={`${complaint.knowsHowToComplainRate}%`} />
          <Stat label="Feels Able" value={`${complaint.feelsAbleToComplainRate}%`} />
          <Stat label="Forms Accessible" value={`${complaint.formsAccessibleRate}%`} />
          <Stat label="Advocacy Offered" value={`${complaint.advocacyOfferedRate}%`} />
        </div>
      </Section>

      <Section title="Feedback">
        <ScoreBar label="Feedback Score" value={feedback.overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Feedback" value={feedback.totalFeedback} />
          <Stat label="Acknowledged" value={`${feedback.acknowledgedRate}%`} />
          <Stat label="Action Taken" value={`${feedback.actionTakenRate}%`} />
          <Stat label="Outcome Shared" value={`${feedback.outcomeSharedRate}%`} />
          <Stat label="Satisfaction" value={`${feedback.satisfactionRate}%`} />
        </div>
      </Section>

      {childProfiles.length > 0 && (
        <Section title={`Child Profiles (${childProfiles.length})`}>
          {childProfiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>Rights: {c.overallRightsScore as number}/100</span></div>
              <p className="text-xs text-gray-500 mt-1">Guide: {String(c.guideStatus).replace(/_/g, " ")} · Awareness: {c.rightsAwarenessScore as number} · Participation: {String(c.participationLevel).replace(/_/g, " ")}</p>
              <p className="text-xs text-gray-500 mt-1">Advocacy: {String(c.advocacyStatus).replace(/_/g, " ")} · Complaint Access: {c.complaintAccessScore as number} · Feedback: {c.feedbackEngagement as number}</p>
              {(c.areasForDevelopment as string[]).length > 0 && <p className="text-xs text-orange-600 mt-1">Development: {(c.areasForDevelopment as string[]).join(", ")}</p>}
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
