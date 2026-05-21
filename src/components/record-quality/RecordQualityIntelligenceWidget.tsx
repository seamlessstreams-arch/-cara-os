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

export function RecordQualityIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/record-quality")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading record quality intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const completion = d.completion as Record<string, unknown>;
  const timeliness = d.timeliness as Record<string, unknown>;
  const quality = d.quality as Record<string, number>;
  const signOff = d.signOff as Record<string, number>;
  const crossRef = d.crossReferencing as Record<string, number>;
  const staffProfiles = (d.staffProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForDevelopment ?? []) as string[];
  const immediateActions = (d.immediateActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Record Quality Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Expected" value={completion.totalExpected as number} />
        <Stat label="Completion" value={`${completion.completionRate as number}%`} />
        <Stat label="Timeliness" value={`${timeliness.timelinessRate as number}%`} />
      </div>

      <Section title="Completion" defaultOpen>
        <ScoreBar label="Completion" value={completion.completionRate as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Expected" value={completion.totalExpected as number} />
          <Stat label="Fulfilled" value={completion.totalFulfilled as number} />
          <Stat label="Completion Rate" value={`${completion.completionRate as number}%`} />
        </div>
        {(completion.missingByType as Record<string, unknown>[])?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-700 mb-1">Missing Records:</p>
            {(completion.missingByType as Record<string, unknown>[]).map((m, i) => (
              <p key={i} className="text-xs text-red-600">{String(m.recordType).replace(/_/g, " ")}: {m.missing as number} missing of {m.expected as number} expected</p>
            ))}
          </div>
        )}
      </Section>

      <Section title="Timeliness">
        <ScoreBar label="Timeliness" value={timeliness.timelinessRate as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Records" value={timeliness.totalRecords as number} />
          <Stat label="Within Timescale" value={timeliness.withinTimescale as number} />
          <Stat label="Timeliness Rate" value={`${timeliness.timelinessRate as number}%`} />
          <Stat label="Avg Delay (hrs)" value={timeliness.averageDelayHours as number} />
        </div>
      </Section>

      <Section title="Quality">
        <ScoreBar label="Field Completion" value={quality.averageFieldCompletion} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Avg Field Completion" value={`${quality.averageFieldCompletion}%`} />
          <Stat label="Avg Word Count" value={quality.averageWordCount} />
          <Stat label="Below Min Words" value={quality.recordsBelowMinWords} />
        </div>
      </Section>

      <Section title="Sign-Off">
        <ScoreBar label="Sign-Off Rate" value={signOff.signOffRate} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Signed Off" value={signOff.signedOff} />
          <Stat label="Sign-Off Rate" value={`${signOff.signOffRate}%`} />
          <Stat label="Pending" value={signOff.pendingSignOff} />
          <Stat label="Queried" value={signOff.queriedRecords} />
        </div>
      </Section>

      <Section title="Cross-Referencing">
        <ScoreBar label="Cross-Reference Rate" value={crossRef.crossReferenceRate} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="With Cross-Refs" value={crossRef.withCrossReferences} />
          <Stat label="Cross-Ref Rate" value={`${crossRef.crossReferenceRate}%`} />
          <Stat label="Incidents w/o Log" value={crossRef.incidentsWithoutDailyLog} />
          <Stat label="Restraints w/o Incident" value={crossRef.restraintsWithoutIncident} />
        </div>
      </Section>

      {staffProfiles.length > 0 && (
        <Section title={`Staff Profiles (${staffProfiles.length})`}>
          {staffProfiles.map((s) => (
            <div key={s.staffId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{s.staffName as string}</span><span>{s.totalRecords as number} records</span></div>
              <p className="text-xs text-gray-500 mt-1">Avg {s.averageTimeliness as number}h · Fields {s.averageFieldCompletion as number}% · Sign-off {s.signOffRate as number}% · Cross-ref {s.crossReferenceRate as number}% · Avg {s.averageWordCount as number} words</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Development"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {immediateActions.length > 0 && <Section title="Immediate Actions"><ul className="text-sm space-y-1">{immediateActions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
