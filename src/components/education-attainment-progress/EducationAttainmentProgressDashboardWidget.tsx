"use client";

import { useEffect, useState } from "react";

interface ChildProfile { childId: string; childName: string; totalRecords: number; progressRate: number; pepUpdatedRate: number; uniqueAreas: number; overallScore: number; }

interface EducationData {
  homeId: string; periodStart: string; periodEnd: string; overallScore: number; rating: string;
  educationQuality: { totalRecords: number; progressRate: number; pepUpdatedRate: number; attendanceRate: number; childViewsRate: number; score: number; };
  educationCompliance: { totalRecords: number; staffAdvocacyRate: number; documentedRate: number; virtualSchoolRate: number; areaDiversity: number; score: number; };
  educationPolicy: { educationChampionRole: boolean; pepReviewSchedule: boolean; attendanceMonitoring: boolean; homeworkSupportPlan: boolean; senCoordination: boolean; virtualSchoolPartnership: boolean; regularReview: boolean; score: number; };
  staffEducationReadiness: { totalStaff: number; educationSupportRate: number; pepProcessRate: number; attendanceImportanceRate: number; senAwarenessRate: number; homeworkStrategiesRate: number; virtualSchoolProtocolRate: number; score: number; };
  childProfiles: ChildProfile[]; strengths: string[]; areasForImprovement: string[]; actions: string[]; regulatoryLinks: string[];
  meta?: { recordSummary: { id: string; childName: string; date: string; area: string; progress: string }[]; ratingLabel: string; };
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

export default function EducationAttainmentProgressDashboardWidget() {
  const [data, setData] = useState<EducationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/education-attainment-progress")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (<div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-3/4 mb-4" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-3" /><div className="h-4 bg-gray-100 rounded w-2/3 mb-3" /><div className="h-4 bg-gray-100 rounded w-1/3" /></div>);
  if (error) return (<div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="text-lg font-bold text-red-800 mb-2">Education Attainment & Progress</h2><p className="text-red-600 text-sm">Failed to load data: {error}</p></div>);
  if (!data) return null;

  const rc = ratingColour(data.rating);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">Education Attainment & Progress</h2><p className="text-sm text-gray-500 mt-0.5">{data.periodStart} — {data.periodEnd}</p></div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${rc}`}><span className="text-xl font-bold">{data.overallScore}</span><span>/100</span><span className="ml-1">{ratingLabel(data.rating)}</span></div>
      </div>

      <div className="mb-6">
        <ScoreBar label="Education Quality" score={data.educationQuality.score} />
        <ScoreBar label="Education Compliance" score={data.educationCompliance.score} />
        <ScoreBar label="Policy & Governance" score={data.educationPolicy.score} />
        <ScoreBar label="Staff Readiness" score={data.staffEducationReadiness.score} />
      </div>

      <Section title="Education Quality" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Records" value={data.educationQuality.totalRecords} />
          <Stat label="Progress Rate" value={`${data.educationQuality.progressRate}%`} />
          <Stat label="PEP Updated" value={`${data.educationQuality.pepUpdatedRate}%`} />
          <Stat label="Attendance" value={`${data.educationQuality.attendanceRate}%`} />
          <Stat label="Child Views" value={`${data.educationQuality.childViewsRate}%`} />
        </div>
      </Section>

      <Section title="Education Compliance">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Staff Advocacy" value={`${data.educationCompliance.staffAdvocacyRate}%`} />
          <Stat label="Documented" value={`${data.educationCompliance.documentedRate}%`} />
          <Stat label="Virtual School" value={`${data.educationCompliance.virtualSchoolRate}%`} />
          <Stat label="Area Diversity" value={`${Math.round(data.educationCompliance.areaDiversity * 100)}%`} />
        </div>
      </Section>

      <Section title="Policy & Governance">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {([
            ["Education Champion", data.educationPolicy.educationChampionRole],
            ["PEP Review Schedule", data.educationPolicy.pepReviewSchedule],
            ["Attendance Monitoring", data.educationPolicy.attendanceMonitoring],
            ["Homework Support", data.educationPolicy.homeworkSupportPlan],
            ["SEN Coordination", data.educationPolicy.senCoordination],
            ["Virtual School", data.educationPolicy.virtualSchoolPartnership],
            ["Regular Review", data.educationPolicy.regularReview],
          ] as [string, boolean][]).map(([label, val]) => (
            <div key={label} className={`rounded-lg px-3 py-2 text-center border ${boolBadge(val)}`}><div className="text-sm font-semibold">{val ? "Yes" : "No"}</div><div className="text-xs">{label}</div></div>
          ))}
        </div>
      </Section>

      <Section title="Staff Readiness">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Staff" value={data.staffEducationReadiness.totalStaff} />
          <Stat label="Education Support" value={`${data.staffEducationReadiness.educationSupportRate}%`} />
          <Stat label="PEP Process" value={`${data.staffEducationReadiness.pepProcessRate}%`} />
          <Stat label="Attendance" value={`${data.staffEducationReadiness.attendanceImportanceRate}%`} />
          <Stat label="SEN Awareness" value={`${data.staffEducationReadiness.senAwarenessRate}%`} />
          <Stat label="Homework" value={`${data.staffEducationReadiness.homeworkStrategiesRate}%`} />
          <Stat label="Virtual School" value={`${data.staffEducationReadiness.virtualSchoolProtocolRate}%`} />
        </div>
      </Section>

      {data.childProfiles.length > 0 && (
        <Section title="Child Education Profiles">
          <div className="space-y-3">
            {data.childProfiles.map((cp) => (
              <div key={cp.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2"><span className="font-semibold text-gray-800">{cp.childName}</span><span className="text-sm font-semibold text-gray-600">{cp.overallScore}/10</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600"><span>Records: {cp.totalRecords}</span><span>Progress: {cp.progressRate}%</span><span>PEP: {cp.pepUpdatedRate}%</span><span>Areas: {cp.uniqueAreas}</span></div>
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
