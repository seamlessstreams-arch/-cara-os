"use client";

import { useEffect, useState } from "react";

interface ChildHouseMeetingProfile { childId: string; childName: string; totalRecords: number; childAgendaContributionRate: number; childAttendanceRate: number; categoriesCovered: string[]; overallScore: number; }

interface HouseMeetingsData {
  homeId: string; periodStart: string; periodEnd: string; overallScore: number; rating: string;
  houseMeetingQuality: { overallScore: number; totalMeetings: number; childAgendaContributionRate: number; minutesRecordedRate: number; childAttendanceRate: number; actionsReviewedRate: number; };
  houseMeetingCompliance: { overallScore: number; documentationRate: number; timelyRecordingRate: number; childAttendanceRate: number; categoryDiversityRatio: number; };
  houseMeetingPolicy: { overallScore: number; houseMeetingPolicy: boolean; meetingFrequencyGuidance: boolean; childParticipationFramework: boolean; minutesAccessibilityPolicy: boolean; actionTrackingProcedure: boolean; suggestionBoxPolicy: boolean; councilGovernanceFramework: boolean; };
  staffReadiness: { overallScore: number; totalStaff: number; meetingFacilitationRate: number; childParticipationRate: number; minutesTakingRate: number; actionTrackingRate: number; conflictResolutionRate: number; inclusivePracticeRate: number; };
  childProfiles: ChildHouseMeetingProfile[]; strengths: string[]; areasForImprovement: string[]; actions: string[]; regulatoryLinks: string[];
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

export default function HouseMeetingsDashboardWidget() {
  const [data, setData] = useState<HouseMeetingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/house-meetings")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (<div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-3/4 mb-4" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-3" /><div className="h-4 bg-gray-100 rounded w-2/3 mb-3" /><div className="h-4 bg-gray-100 rounded w-1/3" /></div>);
  if (error) return (<div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="text-lg font-bold text-red-800 mb-2">House Meetings</h2><p className="text-red-600 text-sm">Failed to load data: {error}</p></div>);
  if (!data) return null;

  const rc = ratingColour(data.rating);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">House Meetings</h2><p className="text-sm text-gray-500 mt-0.5">{data.periodStart} — {data.periodEnd}</p></div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${rc}`}><span className="text-xl font-bold">{data.overallScore}</span><span>/100</span><span className="ml-1">{ratingLabel(data.rating)}</span></div>
      </div>

      <div className="mb-6">
        <ScoreBar label="Meeting Quality" score={data.houseMeetingQuality.overallScore} />
        <ScoreBar label="Meeting Compliance" score={data.houseMeetingCompliance.overallScore} />
        <ScoreBar label="Policy & Governance" score={data.houseMeetingPolicy.overallScore} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.overallScore} />
      </div>

      <Section title="Meeting Quality" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Meetings" value={data.houseMeetingQuality.totalMeetings} />
          <Stat label="Child Agenda" value={`${data.houseMeetingQuality.childAgendaContributionRate}%`} />
          <Stat label="Minutes Recorded" value={`${data.houseMeetingQuality.minutesRecordedRate}%`} />
          <Stat label="Child Attendance" value={`${data.houseMeetingQuality.childAttendanceRate}%`} />
          <Stat label="Actions Reviewed" value={`${data.houseMeetingQuality.actionsReviewedRate}%`} />
        </div>
      </Section>

      <Section title="Meeting Compliance">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Documentation" value={`${data.houseMeetingCompliance.documentationRate}%`} />
          <Stat label="Timely Recording" value={`${data.houseMeetingCompliance.timelyRecordingRate}%`} />
          <Stat label="Child Attendance" value={`${data.houseMeetingCompliance.childAttendanceRate}%`} />
          <Stat label="Category Coverage" value={`${data.houseMeetingCompliance.categoryDiversityRatio}%`} />
        </div>
      </Section>

      <Section title="Policy & Governance">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {([
            ["Meeting Policy", data.houseMeetingPolicy.houseMeetingPolicy],
            ["Frequency Guidance", data.houseMeetingPolicy.meetingFrequencyGuidance],
            ["Child Participation", data.houseMeetingPolicy.childParticipationFramework],
            ["Minutes Accessibility", data.houseMeetingPolicy.minutesAccessibilityPolicy],
            ["Action Tracking", data.houseMeetingPolicy.actionTrackingProcedure],
            ["Suggestion Box", data.houseMeetingPolicy.suggestionBoxPolicy],
            ["Council Governance", data.houseMeetingPolicy.councilGovernanceFramework],
          ] as [string, boolean][]).map(([label, val]) => (
            <div key={label} className={`rounded-lg px-3 py-2 text-center border ${boolBadge(val)}`}><div className="text-sm font-semibold">{val ? "Yes" : "No"}</div><div className="text-xs">{label}</div></div>
          ))}
        </div>
      </Section>

      <Section title="Staff Readiness">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Staff" value={data.staffReadiness.totalStaff} />
          <Stat label="Facilitation" value={`${data.staffReadiness.meetingFacilitationRate}%`} />
          <Stat label="Child Participation" value={`${data.staffReadiness.childParticipationRate}%`} />
          <Stat label="Minutes Taking" value={`${data.staffReadiness.minutesTakingRate}%`} />
          <Stat label="Action Tracking" value={`${data.staffReadiness.actionTrackingRate}%`} />
          <Stat label="Conflict Resolution" value={`${data.staffReadiness.conflictResolutionRate}%`} />
          <Stat label="Inclusive Practice" value={`${data.staffReadiness.inclusivePracticeRate}%`} />
        </div>
      </Section>

      {data.childProfiles.length > 0 && (
        <Section title="Child Meeting Profiles">
          <div className="space-y-3">
            {data.childProfiles.map((cp) => (
              <div key={cp.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2"><span className="font-semibold text-gray-800">{cp.childName}</span><span className="text-sm font-semibold text-gray-600">{cp.overallScore}/10</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600"><span>Records: {cp.totalRecords}</span><span>Agenda: {cp.childAgendaContributionRate}%</span><span>Attendance: {cp.childAttendanceRate}%</span></div>
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
