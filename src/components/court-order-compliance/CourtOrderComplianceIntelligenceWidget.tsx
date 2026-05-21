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

export function CourtOrderComplianceIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/court-order-compliance")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading court order compliance intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const orderCompliance = d.orderCompliance as Record<string, unknown>;
  const reviewTimeliness = d.reviewTimeliness as Record<string, unknown>;
  const legalEngagement = d.legalEngagement as Record<string, unknown>;
  const staffKnowledge = d.staffLegalKnowledge as Record<string, unknown>;
  const childOrderProfiles = (d.childOrderProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Court Order Compliance Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Orders" value={orderCompliance.totalOrders as number} />
        <Stat label="Active Orders" value={orderCompliance.activeOrders as number} />
        <Stat label="Young People" value={childOrderProfiles.length} />
      </div>

      <Section title="Order Compliance" defaultOpen>
        <ScoreBar label="Compliance" value={orderCompliance.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Conditions" value={orderCompliance.totalConditions as number} />
          <Stat label="Fully Compliant" value={`${orderCompliance.fullyCompliantRate as number}%`} />
          <Stat label="Non-Compliant" value={orderCompliance.nonCompliantConditions as number} />
          <Stat label="Orders Reviewed" value={`${orderCompliance.activeOrdersReviewedRate as number}%`} />
          <Stat label="Conditions Evidenced" value={`${orderCompliance.conditionsEvidencedRate as number}%`} />
        </div>
      </Section>

      <Section title="Review Timeliness">
        <ScoreBar label="Timeliness" value={reviewTimeliness.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Reviews" value={reviewTimeliness.totalReviews as number} />
          <Stat label="On Time" value={`${reviewTimeliness.onTimeRate as number}%`} />
          <Stat label="All Met" value={`${reviewTimeliness.allMetRate as number}%`} />
          <Stat label="Concerns" value={`${reviewTimeliness.concernsRate as number}%`} />
          <Stat label="Coverage" value={`${reviewTimeliness.coverageRate as number}%`} />
        </div>
      </Section>

      <Section title="Legal Engagement">
        <ScoreBar label="Engagement" value={legalEngagement.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Meetings" value={legalEngagement.totalMeetings as number} />
          <Stat label="Home Attendance" value={`${legalEngagement.homeAttendanceRate as number}%`} />
          <Stat label="Child Participation" value={`${legalEngagement.childParticipationRate as number}%`} />
          <Stat label="Minutes Recorded" value={`${legalEngagement.minutesRecordedRate as number}%`} />
          <Stat label="Actions Agreed" value={legalEngagement.actionsAgreed as number} />
          <Stat label="Meeting Types" value={legalEngagement.meetingTypeCount as number} />
        </div>
      </Section>

      <Section title="Staff Legal Knowledge">
        <ScoreBar label="Staff Knowledge" value={staffKnowledge.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Court Order Awareness" value={`${staffKnowledge.courtOrderAwarenessRate as number}%`} />
          <Stat label="Children Act" value={`${staffKnowledge.childrenActKnowledgeRate as number}%`} />
          <Stat label="Human Rights" value={`${staffKnowledge.humanRightsTrainingRate as number}%`} />
          <Stat label="All Three" value={`${staffKnowledge.allThreeRate as number}%`} />
        </div>
      </Section>

      {childOrderProfiles.length > 0 && (
        <Section title={`Child Order Profiles (${childOrderProfiles.length})`}>
          {childOrderProfiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.activeOrderCount as number} active orders · {c.totalConditions as number} conditions · Compliance {c.complianceRate as number}% · {c.reviewsConducted as number} reviews · {c.meetingsAttended as number} meetings</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">{"✓"} {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">{"⚠"} {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
