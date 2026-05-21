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

export function AdvocacyRepresentationIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/advocacy-representation")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading advocacy representation intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const access = d.accessToAdvocacy as Record<string, unknown>;
  const iv = d.independentVisitors as Record<string, unknown>;
  const awareness = d.awarenessAndUnderstanding as Record<string, unknown>;
  const policy = d.policyAndProvision as Record<string, unknown>;
  const profiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Advocacy & Representation Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Access to Advocacy" value={`${access.score}/30`} />
        <Stat label="Independent Visitors" value={`${iv.score}/25`} />
        <Stat label="Child Profiles" value={profiles.length} />
      </div>

      <Section title="Access to Advocacy" defaultOpen>
        <ScoreBar label="Access to Advocacy" value={access.score as number} max={30} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Referrals" value={access.totalReferrals as number} />
          <Stat label="Active Advocacy" value={access.activeAdvocacyCount as number} />
          <Stat label="Active Advocacy Rate" value={`${access.activeAdvocacyRate}%`} />
          <Stat label="Avg Response Days" value={access.averageResponseTimeDays as number} />
          <Stat label="Child Satisfaction" value={access.childSatisfactionAverage as number} />
          <Stat label="Complaint Support" value={`${access.complaintSupportRate}%`} />
        </div>
      </Section>

      <Section title="Independent Visitors">
        <ScoreBar label="Independent Visitors" value={iv.score as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Visitors" value={iv.totalVisitors as number} />
          <Stat label="Children with IV" value={`${iv.childrenWithIV}/${iv.totalChildren}`} />
          <Stat label="Visit Compliance" value={`${iv.visitComplianceRate}%`} />
          <Stat label="Avg Engagement" value={iv.averageEngagement as number} />
        </div>
      </Section>

      <Section title="Awareness & Understanding">
        <ScoreBar label="Awareness & Understanding" value={awareness.score as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Assessments" value={awareness.totalAssessments as number} />
          <Stat label="Understands Rights" value={`${awareness.understandsRightsRate}%`} />
          <Stat label="Informed of Advocacy" value={`${awareness.informedOfAdvocacyRate}%`} />
          <Stat label="Knows How to Access" value={`${awareness.knowsHowToAccessRate}%`} />
          <Stat label="Informed of Rights" value={`${awareness.childrenInformedOfRightsRate}%`} />
        </div>
      </Section>

      <Section title="Policy & Provision">
        <ScoreBar label="Policy & Provision" value={policy.score as number} max={20} />
        <ul className="text-sm space-y-1 mt-2">
          {([
            ["Policy Reviewed", policy.policyReviewed],
            ["Provider Named", policy.providerNamed],
            ["Contract in Place", policy.contractInPlace],
            ["Complaints Process", policy.complaintsProcess],
          ] as [string, unknown][]).map(([label, val]) => (
            <li key={label} className="flex items-center gap-2">
              <span className={val ? "text-green-600" : "text-red-500"}>{val ? "✓" : "✗"}</span>{label}
            </li>
          ))}
        </ul>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Child Profiles (${profiles.length})`}>
          {profiles.map((p) => (
            <div key={p.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{p.childName as string}</span><span>{p.overallScore as number}/100</span></div>
              <p className="text-xs text-gray-500 mt-1">Advocacy: {p.hasActiveAdvocacy ? "✓" : "✗"} · IV: {p.hasIndependentVisitor ? "✓" : "✗"} · Rights: {p.informedOfRights ? "✓" : "✗"} · Satisfaction: {p.satisfaction as number}</p>
              {(p.concerns as string[])?.length > 0 && <p className="text-xs text-orange-600 mt-1">{(p.concerns as string[]).join(", ")}</p>}
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
