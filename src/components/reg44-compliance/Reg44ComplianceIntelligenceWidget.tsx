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
  const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function Reg44ComplianceIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reg44-compliance")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading Reg 44 compliance intelligence: {error}</div>;
  if (!data) return null;

  const overallScore = data.overallScore as number;
  const rating = data.rating as string;
  const visitCompliance = data.visitCompliance as Record<string, unknown>;
  const recommendations = data.recommendations as Record<string, unknown>;
  const childParticipation = data.childParticipation as Record<string, unknown>;
  const managementResponse = data.managementResponse as Record<string, unknown>;
  const strengths = (data.strengths ?? []) as string[];
  const areasForDevelopment = (data.areasForDevelopment ?? []) as string[];
  const immediateActions = (data.immediateActions ?? []) as string[];
  const regulatoryLinks = (data.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Reg 44 Compliance Intelligence</h2>
        {ratingBadge(rating)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Overall Score" value={`${overallScore}/100`} />
        <Stat label="Visits Completed" value={`${visitCompliance.totalVisitsCompleted}/${visitCompliance.totalVisitsExpected}`} />
        <Stat label="Rec. Completion" value={`${recommendations.completionRate}%`} />
        <Stat label="Child Coverage" value={`${childParticipation.childCoverage}%`} />
      </div>

      <Section title="Visit Compliance (max 30)" defaultOpen>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Completion Rate" value={`${visitCompliance.visitCompletionRate}%`} />
          <Stat label="Independent Visitor" value={`${visitCompliance.independentVisitorRate}%`} />
          <Stat label="Report On-Time" value={`${visitCompliance.reportOnTimeRate}%`} />
          <Stat label="Shared with Ofsted" value={`${visitCompliance.ofstedSharedRate}%`} />
          <Stat label="Longest Gap (Days)" value={visitCompliance.longestGapDays as number} />
          <Stat label="Missed Months" value={(visitCompliance.missedMonths as string[]).length} />
        </div>
      </Section>

      <Section title="Recommendations (max 25)">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Total" value={recommendations.totalRecommendations as number} />
          <Stat label="Completed" value={`${recommendations.completionRate}%`} />
          <Stat label="Overdue" value={recommendations.overdueCount as number} />
          <Stat label="Impact Assessed" value={`${recommendations.impactAssessedRate}%`} />
        </div>
      </Section>

      <Section title="Child Participation (max 25)">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Spoken To Rate" value={`${childParticipation.childrenSpokenToRate}%`} />
          <Stat label="Views Captured" value={`${childParticipation.viewsCapturedRate}%`} />
          <Stat label="Issues Actioned" value={`${childParticipation.issuesActionedRate}%`} />
          <Stat label="Unheard Children" value={(childParticipation.unheardChildren as unknown[]).length} />
        </div>
      </Section>

      <Section title="Management Response (max 20)">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="On-Time Rate" value={`${managementResponse.respondedOnTimeRate}%`} />
          <Stat label="Acceptance Rate" value={`${managementResponse.averageAcceptanceRate}%`} />
          <Stat label="Action Plans" value={`${managementResponse.actionPlanCreatedRate}%`} />
          <Stat label="Shared with RI" value={`${managementResponse.sharedWithRIRate}%`} />
        </div>
      </Section>

      {strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="text-sm space-y-1 list-disc list-inside">{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </Section>
      )}

      {areasForDevelopment.length > 0 && (
        <Section title="Areas for Development">
          <ul className="text-sm space-y-1 list-disc list-inside">{areasForDevelopment.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </Section>
      )}

      {immediateActions.length > 0 && (
        <Section title="Immediate Actions">
          <ul className="text-sm space-y-1 list-disc list-inside">{immediateActions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </Section>
      )}

      {regulatoryLinks.length > 0 && (
        <Section title="Regulatory Links">
          <ul className="text-sm space-y-1 list-disc list-inside">{regulatoryLinks.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}
