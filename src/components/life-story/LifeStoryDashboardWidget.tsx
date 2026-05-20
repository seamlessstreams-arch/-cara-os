"use client";

import { useEffect, useState } from "react";

interface ChildLifeStoryProfile { childId: string; childName: string; totalSessions: number; completionRate: number; childLedRate: number; sessionTypesCovered: string[]; overallScore: number; }

interface LSData {
  homeId: string; periodStart: string; periodEnd: string; overallScore: number; rating: string;
  sessionQuality: { overallScore: number; totalSessions: number; completedSessions: number; completionRate: number; childLedRate: number; engagementRate: number; documentationRate: number; };
  identityCulture: { overallScore: number; identityAddressedRate: number; culturalActivityRate: number; familyExploredRate: number; photographRate: number; };
  lifeStoryPolicy: { overallScore: number; lifeStoryWorkPolicy: boolean; childFriendlyMaterials: boolean; regularReviewSchedule: boolean; memoryKeepingProtocol: boolean; identityAssessmentFramework: boolean; culturalCompetencyPlan: boolean; familyConnectionProtocol: boolean; };
  staffReadiness: { overallScore: number; totalStaff: number; lifeStoryWorkRate: number; identitySupportRate: number; culturalCompetencyRate: number; therapeuticApproachRate: number; memoryKeepingRate: number; familyWorkSkillsRate: number; };
  childProfiles: ChildLifeStoryProfile[]; strengths: string[]; areasForImprovement: string[]; actions: string[]; regulatoryLinks: string[];
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
  return (<div className="mb-3"><div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-700">{label}</span><span className="text-gray-500">{score}/{max}</span></div><div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} /></div></div>);
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (<div className="border border-gray-200 rounded-lg overflow-hidden mb-4"><button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"><span className="font-semibold text-gray-800">{title}</span><span className="text-gray-400 text-lg">{open ? "−" : "+"}</span></button>{open && <div className="px-4 py-3">{children}</div>}</div>);
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (<div className="bg-gray-50 rounded-lg px-3 py-2 text-center"><div className="text-lg font-bold text-gray-800">{value}</div><div className="text-xs text-gray-500">{label}</div></div>);
}

export default function LifeStoryDashboardWidget() {
  const [data, setData] = useState<LSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/life-story")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (<div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-3/4 mb-4" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-3" /><div className="h-4 bg-gray-100 rounded w-2/3 mb-3" /><div className="h-4 bg-gray-100 rounded w-1/3" /></div>);
  if (error) return (<div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="text-lg font-bold text-red-800 mb-2">Life Story &amp; Identity Work</h2><p className="text-red-600 text-sm">Failed to load data: {error}</p></div>);
  if (!data) return null;

  const rc = ratingColour(data.rating);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">Life Story &amp; Identity Work</h2><p className="text-sm text-gray-500 mt-0.5">{data.periodStart} — {data.periodEnd}</p></div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${rc}`}><span className="text-xl font-bold">{data.overallScore}</span><span>/100</span><span className="ml-1">{ratingLabel(data.rating)}</span></div>
      </div>

      <div className="mb-6">
        <ScoreBar label="Session Quality" score={data.sessionQuality.overallScore} />
        <ScoreBar label="Identity & Culture" score={data.identityCulture.overallScore} />
        <ScoreBar label="Policy & Governance" score={data.lifeStoryPolicy.overallScore} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.overallScore} />
      </div>

      <Section title="Session Quality" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Sessions" value={data.sessionQuality.totalSessions} />
          <Stat label="Completed" value={data.sessionQuality.completedSessions} />
          <Stat label="Completion" value={`${data.sessionQuality.completionRate}%`} />
          <Stat label="Child-Led" value={`${data.sessionQuality.childLedRate}%`} />
          <Stat label="Engagement" value={`${data.sessionQuality.engagementRate}%`} />
          <Stat label="Documentation" value={`${data.sessionQuality.documentationRate}%`} />
        </div>
      </Section>

      <Section title="Identity & Culture">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Identity Addressed" value={`${data.identityCulture.identityAddressedRate}%`} />
          <Stat label="Cultural Activity" value={`${data.identityCulture.culturalActivityRate}%`} />
          <Stat label="Family Explored" value={`${data.identityCulture.familyExploredRate}%`} />
          <Stat label="Photographs" value={`${data.identityCulture.photographRate}%`} />
        </div>
      </Section>

      <Section title="Policy & Governance">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {([
            ["Life Story Policy", data.lifeStoryPolicy.lifeStoryWorkPolicy],
            ["Child-Friendly Materials", data.lifeStoryPolicy.childFriendlyMaterials],
            ["Review Schedule", data.lifeStoryPolicy.regularReviewSchedule],
            ["Memory Keeping", data.lifeStoryPolicy.memoryKeepingProtocol],
            ["Identity Assessment", data.lifeStoryPolicy.identityAssessmentFramework],
            ["Cultural Competency", data.lifeStoryPolicy.culturalCompetencyPlan],
            ["Family Connection", data.lifeStoryPolicy.familyConnectionProtocol],
          ] as [string, boolean][]).map(([label, val]) => (
            <div key={label} className={`rounded-lg px-3 py-2 text-center border ${boolBadge(val)}`}><div className="text-sm font-semibold">{val ? "Yes" : "No"}</div><div className="text-xs">{label}</div></div>
          ))}
        </div>
      </Section>

      <Section title="Staff Readiness">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Staff" value={data.staffReadiness.totalStaff} />
          <Stat label="Life Story Work" value={`${data.staffReadiness.lifeStoryWorkRate}%`} />
          <Stat label="Identity Support" value={`${data.staffReadiness.identitySupportRate}%`} />
          <Stat label="Cultural Competency" value={`${data.staffReadiness.culturalCompetencyRate}%`} />
          <Stat label="Therapeutic Approach" value={`${data.staffReadiness.therapeuticApproachRate}%`} />
          <Stat label="Memory Keeping" value={`${data.staffReadiness.memoryKeepingRate}%`} />
          <Stat label="Family Work" value={`${data.staffReadiness.familyWorkSkillsRate}%`} />
        </div>
      </Section>

      {data.childProfiles.length > 0 && (
        <Section title="Child Life Story Profiles">
          <div className="space-y-3">
            {data.childProfiles.map((cp) => (
              <div key={cp.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2"><span className="font-semibold text-gray-800">{cp.childName}</span><span className="text-sm font-semibold text-gray-600">{cp.overallScore}/10</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600"><span>Sessions: {cp.totalSessions}</span><span>Completion: {cp.completionRate}%</span><span>Child-Led: {cp.childLedRate}%</span></div>
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
