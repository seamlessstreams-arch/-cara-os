"use client";
import { useEffect, useState } from "react";

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded">
        <div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Rates arrive as number | null over JSON: null ("not yet measured", an empty
// population) renders as "—", never "null%" and never a fabricated figure.
function pct(value: unknown): string {
  return typeof value === "number" ? `${value}%` : "—";
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{String(value)}</p>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded mb-3">
      <button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>
        {title}<span>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}

function ratingBadge(rating: string) {
  const colours: Record<string, string> = {
    outstanding: "bg-green-100 text-green-800",
    good: "bg-yellow-100 text-yellow-800",
    requires_improvement: "bg-orange-100 text-orange-800",
    inadequate: "bg-red-100 text-red-800",
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function SafeguardingEffectivenessIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/safeguarding-effectiveness")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading safeguarding effectiveness intelligence: {error}</div>;
  if (!data) return null;

  const overallScore = data.overallScore as number;
  const rating = data.rating as string;
  const referralQuality = data.referralQuality as Record<string, unknown>;
  const trainingCompliance = data.trainingCompliance as Record<string, unknown>;
  const auditFindings = data.auditFindings as Record<string, unknown>;
  const supervision = data.supervision as Record<string, unknown>;
  const staffProfiles = (data.staffProfiles ?? []) as Record<string, unknown>[];
  const strengths = (data.strengths ?? []) as string[];
  const concerns = (data.concerns ?? []) as string[];
  const immediateActions = (data.immediateActions ?? []) as string[];
  const regulatoryLinks = (data.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Safeguarding Effectiveness Intelligence</h2>
        {ratingBadge(rating)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Overall Score" value={`${overallScore}/100`} />
        <Stat label="Referral Quality" value={`${referralQuality.score}/25`} />
        <Stat label="Training Compliance" value={`${trainingCompliance.score}/25`} />
        <Stat label="Audit Findings" value={`${auditFindings.score}/25`} />
      </div>

      <Section title="Component Scores" defaultOpen>
        <ScoreBar label="Referral Quality" value={referralQuality.score as number} max={25} />
        <ScoreBar label="Training Compliance" value={trainingCompliance.score as number} max={25} />
        <ScoreBar label="Audit Findings" value={auditFindings.score as number} max={25} />
        <ScoreBar label="Supervision" value={supervision.score as number} max={25} />
      </Section>

      <Section title="Referral Quality Details">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Total Referrals" value={referralQuality.totalReferrals as number} />
          <Stat label="Timeliness Rate" value={pct(referralQuality.timelinessRate)} />
          <Stat label="Threshold Appropriateness" value={pct(referralQuality.appropriateThresholdRate)} />
          <Stat label="Multi-Agency Engagement" value={pct(referralQuality.multiAgencyEngagementRate)} />
        </div>
      </Section>

      <Section title="Training Compliance Details">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Staff Coverage" value={pct(trainingCompliance.coverageRate)} />
          <Stat label="Currency Rate" value={pct(trainingCompliance.currencyRate)} />
          <Stat label="DSL Coverage" value={pct(trainingCompliance.dslCoverageRate)} />
          <Stat label="Scenario-Based Rate" value={pct(trainingCompliance.scenarioBasedRate)} />
        </div>
      </Section>

      <Section title="Staff Profiles">
        {staffProfiles.length === 0 ? (
          <p className="text-sm text-gray-500">No staff profiles available.</p>
        ) : (
          <div className="space-y-2">
            {staffProfiles.map((sp) => (
              <div key={sp.staffId as string} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                <span className="font-medium">{sp.staffName as string}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${(sp.overallCompliance as string) === "compliant" ? "bg-green-100 text-green-800" : (sp.overallCompliance as string) === "partially_compliant" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                  {(sp.overallCompliance as string).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Strengths">
        {strengths.length === 0 ? <p className="text-sm text-gray-500">No strengths identified.</p> : (
          <ul className="list-disc pl-5 text-sm space-y-1">{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        )}
      </Section>

      <Section title="Concerns">
        {concerns.length === 0 ? <p className="text-sm text-gray-500">No concerns identified.</p> : (
          <ul className="list-disc pl-5 text-sm space-y-1">{concerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
        )}
      </Section>

      <Section title="Immediate Actions">
        {immediateActions.length === 0 ? <p className="text-sm text-gray-500">No immediate actions required.</p> : (
          <ul className="list-disc pl-5 text-sm space-y-1">{immediateActions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        )}
      </Section>

      <Section title="Regulatory Links">
        <ul className="list-disc pl-5 text-sm space-y-1">{regulatoryLinks.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </Section>
    </div>
  );
}
