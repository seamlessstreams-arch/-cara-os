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

export function SexualHealthRelationshipsEducationIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sexual-health-relationships-education")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading sexual health relationships education intelligence: {error}</div>;
  if (!data) return null;

  const overallScore = data.overallScore as number;
  const rating = data.rating as string;
  const rseDeliveryScore = data.rseDeliveryScore as number;
  const sexualHealthAccessScore = data.sexualHealthAccessScore as number;
  const rsePolicyQualityScore = data.rsePolicyQualityScore as number;
  const staffRSEReadinessScore = data.staffRSEReadinessScore as number;
  const childRSESummaries = (data.childRSESummaries ?? []) as Record<string, unknown>[];
  const strengths = (data.strengths ?? []) as string[];
  const areasForImprovement = (data.areasForImprovement ?? []) as string[];
  const actions = (data.actions ?? []) as string[];
  const regulatoryLinks = (data.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Sexual Health &amp; Relationships Education Intelligence</h2>
        {ratingBadge(rating)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Overall Score" value={`${overallScore}/100`} />
        <Stat label="RSE Delivery" value={`${rseDeliveryScore}/25`} />
        <Stat label="Health Access" value={`${sexualHealthAccessScore}/25`} />
        <Stat label="Staff Readiness" value={`${staffRSEReadinessScore}/25`} />
      </div>

      <Section title="Component Scores" defaultOpen>
        <ScoreBar label="RSE Delivery" value={rseDeliveryScore} max={25} />
        <ScoreBar label="Sexual Health Access" value={sexualHealthAccessScore} max={25} />
        <ScoreBar label="RSE Policy Quality" value={rsePolicyQualityScore} max={25} />
        <ScoreBar label="Staff RSE Readiness" value={staffRSEReadinessScore} max={25} />
      </Section>

      <Section title="Child RSE Summaries">
        {childRSESummaries.length === 0 ? (
          <p className="text-sm text-gray-500">No child RSE summaries available.</p>
        ) : (
          <div className="space-y-2">
            {childRSESummaries.map((cs) => (
              <div key={cs.childId as string} className="bg-gray-50 rounded p-2 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{cs.childName as string}</span>
                  <span className="text-xs text-gray-500">{cs.sessionsAttended as number} session(s)</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs mt-1">
                  <span>Topics: {(cs.topicsCovered as string[]).length}</span>
                  <span>Engagement: {cs.averageEngagement as number}</span>
                  <span>Referrals: {cs.referralsMade as number}</span>
                </div>
                <ScoreBar label="Score" value={cs.score as number} max={10} />
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

      <Section title="Areas for Improvement">
        {areasForImprovement.length === 0 ? <p className="text-sm text-gray-500">No areas for improvement identified.</p> : (
          <ul className="list-disc pl-5 text-sm space-y-1">{areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}</ul>
        )}
      </Section>

      <Section title="Actions">
        {actions.length === 0 ? <p className="text-sm text-gray-500">No actions required.</p> : (
          <ul className="list-disc pl-5 text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        )}
      </Section>

      <Section title="Regulatory Links">
        <ul className="list-disc pl-5 text-sm space-y-1">{regulatoryLinks.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </Section>
    </div>
  );
}
