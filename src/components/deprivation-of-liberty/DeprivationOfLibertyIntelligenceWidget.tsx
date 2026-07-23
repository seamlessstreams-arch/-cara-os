"use client";

import { useEffect, useState } from "react";
import { formatRate } from "@/lib/metrics/rate";

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

export function DeprivationOfLibertyIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/deprivation-of-liberty")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading deprivation of liberty intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const auth = d.authorisationCompliance as Record<string, number>;
  const prop = d.proportionality as Record<string, unknown>;
  const review = d.reviewSafeguards as Record<string, unknown>;
  const rights = d.rightsProtection as Record<string, number>;
  const children = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Deprivation of Liberty Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Authorisation" value={`${auth.overallScore}/30`} />
        <Stat label="Proportionality" value={`${prop.overallScore}/25`} />
        <Stat label="Children" value={children.length} />
      </div>

      <Section title="Authorisation Compliance" defaultOpen>
        <ScoreBar label="Authorisation" value={auth.overallScore} max={30} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Restrictions" value={auth.totalRestrictions} />
          <Stat label="Active" value={auth.activeRestrictions} />
          <Stat label="Authorised" value={formatRate(auth.authorisedRate)} />
          <Stat label="Pending" value={auth.pendingApplications} />
          <Stat label="Expired" value={auth.expiredAuthorisations} />
          <Stat label="Best Interests" value={formatRate(auth.bestInterestsRate)} />
          <Stat label="Least Restrictive" value={formatRate(auth.leastRestrictiveRate)} />
          <Stat label="Risk Linked" value={formatRate(auth.riskAssessmentRate)} />
        </div>
      </Section>

      <Section title="Proportionality">
        <ScoreBar label="Proportionality" value={prop.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Proportionate" value={formatRate(prop.proportionateRate as number | null)} />
          <Stat label="Disproportionate" value={prop.disproportionateCount as number} />
          <Stat label="Not Assessed" value={prop.notAssessedCount as number} />
          <Stat label="Avg Duration (days)" value={(prop.averageActiveDurationDays as number | null) ?? "—"} />
        </div>
      </Section>

      <Section title="Review Safeguards">
        <ScoreBar label="Reviews" value={review.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Reviews" value={review.totalReviews as number} />
          <Stat label="On Time" value={review.reviewsOnTime as number} />
          <Stat label="Overdue" value={review.overdueReviews as number} />
          <Stat label="Child Views" value={formatRate(review.childViewsRate as number | null)} />
          <Stat label="Family Consulted" value={formatRate(review.familyConsultedRate as number | null)} />
          <Stat label="Independent" value={formatRate(review.independentInvolvementRate as number | null)} />
          <Stat label="Proportionality Reassessed" value={formatRate(review.proportionalityReassessedRate as number | null)} />
          <Stat label="Less Restrictive" value={formatRate(review.lessRestrictiveConsideredRate as number | null)} />
        </div>
      </Section>

      <Section title="Rights Protection">
        <ScoreBar label="Rights" value={rights.overallScore} max={20} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Safeguard Coverage" value={formatRate(rights.safeguardCoverage)} />
          <Stat label="Advocacy" value={formatRate(rights.advocacyRate)} />
          <Stat label="Legal Rep" value={formatRate(rights.legalRepresentationRate)} />
          <Stat label="Rights Info" value={formatRate(rights.rightsInformationRate)} />
          <Stat label="Family Notified" value={formatRate(rights.familyNotificationRate)} />
          <Stat label="Ofsted Notified" value={formatRate(rights.ofstedNotificationRate)} />
        </div>
      </Section>

      {children.length > 0 && (
        <Section title={`Child Profiles (${children.length})`}>
          {children.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.activeRestrictions as number} active · Authorised: {c.allAuthorised ? "Yes" : "No"} · Reviews: {c.reviewsUpToDate ? "Up to date" : "Overdue"} · Safeguards {c.safeguardsInPlace as number}/{c.safeguardsRequired as number}</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
