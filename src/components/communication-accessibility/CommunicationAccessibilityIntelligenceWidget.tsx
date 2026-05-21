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

export function CommunicationAccessibilityIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/communication-accessibility")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading communication accessibility intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const needs = d.needsAssessment as Record<string, number>;
  const support = d.supportProvision as Record<string, number>;
  const info = d.accessibleInformation as Record<string, number>;
  const staff = d.staffTraining as Record<string, number>;
  const childSummaries = (d.childSummaries ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Communication &amp; Accessibility Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Needs Assessment" value={`${needs.score}/25`} />
        <Stat label="Support Provision" value={`${support.score}/30`} />
        <Stat label="Children With Needs" value={needs.childrenWithNeeds} />
      </div>

      <Section title="Needs Assessment" defaultOpen>
        <ScoreBar label="Needs Assessment Score" value={needs.score} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Children" value={needs.totalChildren} />
          <Stat label="Children Assessed" value={needs.childrenAssessed} />
          <Stat label="Assessment Rate" value={`${needs.assessmentRate}%`} />
          <Stat label="Passport Rate" value={`${needs.passportRate}%`} />
        </div>
      </Section>

      <Section title="Support Provision">
        <ScoreBar label="Support Provision Score" value={support.score} max={30} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Recommendations" value={support.totalRecommendations} />
          <Stat label="In Place" value={support.totalInPlace} />
          <Stat label="Match Rate" value={`${support.supportMatchRate}%`} />
          <Stat label="Full Support" value={support.childrenWithFullSupport} />
          <Stat label="Partial Support" value={support.childrenWithPartialSupport} />
          <Stat label="SLT Access" value={`${support.speechTherapyAccessRate}%`} />
        </div>
      </Section>

      <Section title="Accessible Information">
        <ScoreBar label="Accessible Information Score" value={info.score} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Documents" value={info.totalDocuments} />
          <Stat label="Multiple Formats" value={`${info.multipleFormatRate}%`} />
          <Stat label="Key Doc Coverage" value={`${info.keyDocumentCoverageRate}%`} />
        </div>
      </Section>

      <Section title="Staff Training">
        <ScoreBar label="Staff Training Score" value={staff.score} max={20} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Staff" value={staff.totalStaff} />
          <Stat label="Relevant Training" value={staff.staffWithRelevantTraining} />
          <Stat label="Coverage Rate" value={`${staff.trainingCoverageRate}%`} />
          <Stat label="Expired" value={staff.expiredTraining} />
          <Stat label="Expiring (90d)" value={staff.expiringWithin90Days} />
          <Stat label="Needs Coverage" value={staff.staffChildNeedsCoverage} />
        </div>
      </Section>

      {childSummaries.length > 0 && (
        <Section title={`Child Summaries (${childSummaries.length})`}>
          {childSummaries.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/100</span></div>
              <p className="text-xs text-gray-500 mt-1">Needs: {(c.communicationNeeds as string[]).map((n) => n.replace(/_/g, " ")).join(", ") || "None"}</p>
              <div className="flex gap-2 mt-1 text-xs">
                <span>{(c.assessed as boolean) ? "✓" : "✗"} Assessed</span>
                <span>{(c.hasCommunicationPassport as boolean) ? "✓" : "✗"} Passport</span>
                <span>Match: {c.supportMatchRate as number}%</span>
              </div>
              {(c.concerns as string[]).length > 0 && <p className="text-xs text-red-600 mt-1">Concerns: {(c.concerns as string[]).join(", ")}</p>}
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
