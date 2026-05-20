"use client";

import { useEffect, useState } from "react";

interface ChildAdmissionProfile { childId: string; childName: string; totalRecords: number; thoroughRate: number; childConsultedRate: number; categoriesCovered: string[]; overallScore: number; }

interface AdmissionsData {
  homeId: string; periodStart: string; periodEnd: string; overallScore: number; rating: string;
  admissionQuality: { overallScore: number; totalAdmissions: number; thoroughAssessmentRate: number; childConsultedRate: number; impactConsideredRate: number; transitionPlanRate: number; };
  admissionCompliance: { overallScore: number; documentationRate: number; timelyRate: number; impactAssessmentRate: number; categoryDiversityRatio: number; };
  admissionPolicy: { overallScore: number; admissionsPolicy: boolean; matchingCriteria: boolean; transitionProtocol: boolean; impactAssessmentFramework: boolean; childParticipationGuidance: boolean; emergencyAdmissionProcedure: boolean; reviewSchedule: boolean; };
  staffReadiness: { overallScore: number; totalStaff: number; assessmentSkillsRate: number; matchingExpertiseRate: number; transitionPlanningRate: number; childParticipationRate: number; riskAssessmentRate: number; familyEngagementRate: number; };
  childProfiles: ChildAdmissionProfile[]; strengths: string[]; areasForImprovement: string[]; actions: string[]; regulatoryLinks: string[];
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

export default function AdmissionsDashboardWidget() {
  const [data, setData] = useState<AdmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admissions")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (<div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-3/4 mb-4" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-3" /><div className="h-4 bg-gray-100 rounded w-2/3 mb-3" /><div className="h-4 bg-gray-100 rounded w-1/3" /></div>);
  if (error) return (<div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="text-lg font-bold text-red-800 mb-2">Admissions</h2><p className="text-red-600 text-sm">Failed to load data: {error}</p></div>);
  if (!data) return null;

  const rc = ratingColour(data.rating);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">Admissions</h2><p className="text-sm text-gray-500 mt-0.5">{data.periodStart} — {data.periodEnd}</p></div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${rc}`}><span className="text-xl font-bold">{data.overallScore}</span><span>/100</span><span className="ml-1">{ratingLabel(data.rating)}</span></div>
      </div>

      <div className="mb-6">
        <ScoreBar label="Admission Quality" score={data.admissionQuality.overallScore} />
        <ScoreBar label="Admission Compliance" score={data.admissionCompliance.overallScore} />
        <ScoreBar label="Policy & Governance" score={data.admissionPolicy.overallScore} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.overallScore} />
      </div>

      <Section title="Admission Quality" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Admissions" value={data.admissionQuality.totalAdmissions} />
          <Stat label="Thorough Assessment" value={`${data.admissionQuality.thoroughAssessmentRate}%`} />
          <Stat label="Child Consulted" value={`${data.admissionQuality.childConsultedRate}%`} />
          <Stat label="Impact Considered" value={`${data.admissionQuality.impactConsideredRate}%`} />
          <Stat label="Transition Plan" value={`${data.admissionQuality.transitionPlanRate}%`} />
        </div>
      </Section>

      <Section title="Admission Compliance">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Documentation" value={`${data.admissionCompliance.documentationRate}%`} />
          <Stat label="Timely Process" value={`${data.admissionCompliance.timelyRate}%`} />
          <Stat label="Impact Assessment" value={`${data.admissionCompliance.impactAssessmentRate}%`} />
          <Stat label="Category Coverage" value={`${data.admissionCompliance.categoryDiversityRatio}%`} />
        </div>
      </Section>

      <Section title="Policy & Governance">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {([
            ["Admissions Policy", data.admissionPolicy.admissionsPolicy],
            ["Matching Criteria", data.admissionPolicy.matchingCriteria],
            ["Transition Protocol", data.admissionPolicy.transitionProtocol],
            ["Impact Framework", data.admissionPolicy.impactAssessmentFramework],
            ["Child Participation", data.admissionPolicy.childParticipationGuidance],
            ["Emergency Procedure", data.admissionPolicy.emergencyAdmissionProcedure],
            ["Review Schedule", data.admissionPolicy.reviewSchedule],
          ] as [string, boolean][]).map(([label, val]) => (
            <div key={label} className={`rounded-lg px-3 py-2 text-center border ${boolBadge(val)}`}><div className="text-sm font-semibold">{val ? "Yes" : "No"}</div><div className="text-xs">{label}</div></div>
          ))}
        </div>
      </Section>

      <Section title="Staff Readiness">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Staff" value={data.staffReadiness.totalStaff} />
          <Stat label="Assessment Skills" value={`${data.staffReadiness.assessmentSkillsRate}%`} />
          <Stat label="Matching Expertise" value={`${data.staffReadiness.matchingExpertiseRate}%`} />
          <Stat label="Transition Planning" value={`${data.staffReadiness.transitionPlanningRate}%`} />
          <Stat label="Child Participation" value={`${data.staffReadiness.childParticipationRate}%`} />
          <Stat label="Risk Assessment" value={`${data.staffReadiness.riskAssessmentRate}%`} />
          <Stat label="Family Engagement" value={`${data.staffReadiness.familyEngagementRate}%`} />
        </div>
      </Section>

      {data.childProfiles.length > 0 && (
        <Section title="Child Admission Profiles">
          <div className="space-y-3">
            {data.childProfiles.map((cp) => (
              <div key={cp.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2"><span className="font-semibold text-gray-800">{cp.childName}</span><span className="text-sm font-semibold text-gray-600">{cp.overallScore}/10</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600"><span>Records: {cp.totalRecords}</span><span>Thorough: {cp.thoroughRate}%</span><span>Consulted: {cp.childConsultedRate}%</span></div>
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
