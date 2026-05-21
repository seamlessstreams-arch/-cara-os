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

export function FamilyContactIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/family-contact")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading family contact intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const compliance = d.compliance as Record<string, number>;
  const quality = d.quality as Record<string, number>;
  const impact = d.impact as Record<string, unknown>;
  const childSummaries = (d.childSummaries ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForDevelopment ?? []) as string[];
  const actions = (d.immediateActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  const highRiskImpacts = ((impact.highRiskImpacts ?? []) as Record<string, unknown>[]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Family Contact Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Arrangements" value={compliance.totalArrangements} />
        <Stat label="Sessions" value={compliance.sessionsScheduled} />
        <Stat label="Reviews Overdue" value={d.reviewsOverdue as number} />
      </div>

      <Section title="Contact Compliance" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Completion Rate" value={`${compliance.completionRate}%`} />
          <Stat label="Court Order Compliance" value={`${compliance.courtOrderedComplianceRate}%`} />
          <Stat label="Cancelled (Home)" value={compliance.cancellationsByHome} />
          <Stat label="Child Refusals" value={compliance.childRefusals} />
          <Stat label="No Shows" value={compliance.noShows} />
          <Stat label="Cancelled (Family)" value={compliance.cancellationsByFamily} />
        </div>
      </Section>

      <Section title="Contact Quality">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Sessions" value={quality.totalSessions} />
          <Stat label="Positive Rate" value={`${quality.positiveRate}%`} />
          <Stat label="Child Prepared" value={`${quality.childPreparedRate}%`} />
          <Stat label="Child Voice Recorded" value={`${quality.childVoiceRecordedRate}%`} />
          <Stat label="PA Informed" value={`${quality.placingAuthorityInformedRate}%`} />
          <Stat label="Avg Duration" value={`${quality.averageDurationMinutes} min`} />
        </div>
      </Section>

      <Section title="Contact Impact">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Sessions with Impact Data" value={impact.sessionsWithImpactData as number} />
          <Stat label="Settled After" value={`${impact.settledAfterRate}%`} />
          <Stat label="Dysregulated After" value={`${impact.dysregulatedAfterRate}%`} />
        </div>
        {highRiskImpacts.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">High Risk Impacts</p>
            <ul className="text-sm space-y-1">
              {highRiskImpacts.map((h, i) => (
                <li key={i} className="text-red-700">{String(h.indicator).replace(/_/g, " ")}: {h.count as number}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {childSummaries.length > 0 && (
        <Section title={`Child Summaries (${childSummaries.length})`}>
          {childSummaries.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.completionRate as number}% completion</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.arrangementsCount as number} arrangements · {c.sessionsCount as number} sessions · {c.positiveRate as number}% positive</p>
              {c.primaryConcern && <p className="text-xs text-red-600 mt-1">{c.primaryConcern as string}</p>}
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Development"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Immediate Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
