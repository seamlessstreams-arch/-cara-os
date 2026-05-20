"use client";

import { useEffect, useState } from "react";

interface ChildEnvironmentalProfile { childId: string; childName: string; totalActivities: number; engagementRate: number; knowledgeRate: number; overallScore: number; }

interface ESAData {
  homeId: string; periodStart: string; periodEnd: string; overallScore: number; rating: string;
  ecoQuality: { overallScore: number; totalActivities: number; engagementRate: number; knowledgeRate: number; initiativeRate: number; habitsRate: number; };
  ecoCompliance: { overallScore: number; documentedRate: number; staffSupportedRate: number; feedbackRate: number; activityDiversityRatio: number; };
  environmentalPolicy: { overallScore: number; sustainabilityStrategy: boolean; recyclingProcedure: boolean; energyManagementPlan: boolean; gardenAndNaturePolicy: boolean; ecoEducationFramework: boolean; communityPartnership: boolean; regularReview: boolean; };
  staffEnvironmentalReadiness: { overallScore: number; totalStaff: number; sustainabilityAwarenessRate: number; ecoEducationRate: number; gardenManagementRate: number; energyConservationRate: number; wildlifeKnowledgeRate: number; communityEngagementRate: number; };
  childProfiles: ChildEnvironmentalProfile[]; strengths: string[]; areasForImprovement: string[]; actions: string[]; regulatoryLinks: string[];
}

function ratingColour(r: string) {
  if (r === "outstanding") return "text-green-700 bg-green-50 border-green-200";
  if (r === "good") return "text-blue-700 bg-blue-50 border-blue-200";
  if (r === "requires_improvement") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}
function ratingLabel(r: string) { return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
function boolBadge(v: boolean) { return v ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"; }

function ScoreBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const fill = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-700">{label}</span><span className="text-gray-500">{score}/{max}</span></div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center">
        <span className="font-semibold text-gray-800">{title}</span><span className="text-gray-400 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (<div className="bg-gray-50 rounded-lg px-3 py-2 text-center"><div className="text-lg font-bold text-gray-800">{value}</div><div className="text-xs text-gray-500">{label}</div></div>);
}

export default function EnvironmentalSustainabilityAwarenessDashboardWidget() {
  const [data, setData] = useState<ESAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/environmental-sustainability-awareness")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (<div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-3/4 mb-4" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-3" /><div className="h-4 bg-gray-100 rounded w-2/3 mb-3" /><div className="h-4 bg-gray-100 rounded w-1/3" /></div>);
  if (error) return (<div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="text-lg font-bold text-red-800 mb-2">Environmental Sustainability Awareness</h2><p className="text-red-600 text-sm">Failed to load data: {error}</p></div>);
  if (!data) return null;

  const rc = ratingColour(data.rating);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">Environmental Sustainability Awareness</h2><p className="text-sm text-gray-500 mt-0.5">{data.periodStart} — {data.periodEnd}</p></div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${rc}`}><span className="text-xl font-bold">{data.overallScore}</span><span>/100</span><span className="ml-1">{ratingLabel(data.rating)}</span></div>
      </div>

      <div className="mb-6">
        <ScoreBar label="Eco Quality" score={data.ecoQuality.overallScore} />
        <ScoreBar label="Eco Compliance" score={data.ecoCompliance.overallScore} />
        <ScoreBar label="Policy & Governance" score={data.environmentalPolicy.overallScore} />
        <ScoreBar label="Staff Readiness" score={data.staffEnvironmentalReadiness.overallScore} />
      </div>

      <Section title="Eco Quality" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Activities" value={data.ecoQuality.totalActivities} />
          <Stat label="Engagement" value={`${data.ecoQuality.engagementRate}%`} />
          <Stat label="Knowledge" value={`${data.ecoQuality.knowledgeRate}%`} />
          <Stat label="Initiative" value={`${data.ecoQuality.initiativeRate}%`} />
          <Stat label="Habits Formed" value={`${data.ecoQuality.habitsRate}%`} />
        </div>
      </Section>

      <Section title="Eco Compliance">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Documented" value={`${data.ecoCompliance.documentedRate}%`} />
          <Stat label="Staff Supported" value={`${data.ecoCompliance.staffSupportedRate}%`} />
          <Stat label="Feedback" value={`${data.ecoCompliance.feedbackRate}%`} />
          <Stat label="Activity Diversity" value={`${data.ecoCompliance.activityDiversityRatio}%`} />
        </div>
      </Section>

      <Section title="Policy & Governance">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {([
            ["Sustainability Strategy", data.environmentalPolicy.sustainabilityStrategy],
            ["Recycling Procedure", data.environmentalPolicy.recyclingProcedure],
            ["Energy Management", data.environmentalPolicy.energyManagementPlan],
            ["Garden & Nature", data.environmentalPolicy.gardenAndNaturePolicy],
            ["Eco Education", data.environmentalPolicy.ecoEducationFramework],
            ["Community Partnership", data.environmentalPolicy.communityPartnership],
            ["Review Schedule", data.environmentalPolicy.regularReview],
          ] as [string, boolean][]).map(([label, val]) => (
            <div key={label} className={`rounded-lg px-3 py-2 text-center border ${boolBadge(val)}`}><div className="text-sm font-semibold">{val ? "Yes" : "No"}</div><div className="text-xs">{label}</div></div>
          ))}
        </div>
      </Section>

      <Section title="Staff Readiness">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Staff" value={data.staffEnvironmentalReadiness.totalStaff} />
          <Stat label="Sustainability" value={`${data.staffEnvironmentalReadiness.sustainabilityAwarenessRate}%`} />
          <Stat label="Eco Education" value={`${data.staffEnvironmentalReadiness.ecoEducationRate}%`} />
          <Stat label="Garden Mgmt" value={`${data.staffEnvironmentalReadiness.gardenManagementRate}%`} />
          <Stat label="Energy" value={`${data.staffEnvironmentalReadiness.energyConservationRate}%`} />
          <Stat label="Wildlife" value={`${data.staffEnvironmentalReadiness.wildlifeKnowledgeRate}%`} />
          <Stat label="Community" value={`${data.staffEnvironmentalReadiness.communityEngagementRate}%`} />
        </div>
      </Section>

      {data.childProfiles.length > 0 && (
        <Section title="Child Environmental Profiles">
          <div className="space-y-3">
            {data.childProfiles.map((cp) => (
              <div key={cp.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2"><span className="font-semibold text-gray-800">{cp.childName}</span><span className="text-sm font-semibold text-gray-600">{cp.overallScore}/10</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600"><span>Activities: {cp.totalActivities}</span><span>Engagement: {cp.engagementRate}%</span><span>Knowledge: {cp.knowledgeRate}%</span></div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.strengths.length > 0 && (<Section title="Strengths"><ul className="space-y-1">{data.strengths.map((s, i) => (<li key={i} className="text-sm text-green-800 flex gap-2"><span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />{s}</li>))}</ul></Section>)}
      {data.areasForImprovement.length > 0 && (<Section title="Areas for Improvement"><ul className="space-y-1">{data.areasForImprovement.map((a, i) => (<li key={i} className="text-sm text-amber-800 flex gap-2"><span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />{a}</li>))}</ul></Section>)}
      {data.actions.length > 0 && (<Section title="Actions" defaultOpen><ul className="space-y-1">{data.actions.map((a, i) => (<li key={i} className={`text-sm flex gap-2 ${a.startsWith("URGENT") ? "text-red-800 font-semibold" : "text-gray-700"}`}><span className={`shrink-0 mt-1 h-1.5 w-1.5 rounded-full ${a.startsWith("URGENT") ? "bg-red-500" : "bg-gray-400"}`} />{a}</li>))}</ul></Section>)}
      <Section title="Regulatory Links"><ul className="space-y-1">{data.regulatoryLinks.map((l, i) => (<li key={i} className="text-sm text-gray-600 flex gap-2"><span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />{l}</li>))}</ul></Section>
    </div>
  );
}
