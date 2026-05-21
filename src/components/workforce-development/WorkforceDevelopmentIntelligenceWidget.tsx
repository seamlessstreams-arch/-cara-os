"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) { const pct = Math.min(100, Math.round((value / max) * 100)); const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"; return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>; }
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) { const [open, setOpen] = useState(defaultOpen); return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>); }
function ratingBadge(rating: string) { const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }

export function WorkforceDevelopmentIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/workforce-development").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading workforce development intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const qualifications = d.qualifications as Record<string, unknown>;
  const cpd = d.cpd as Record<string, unknown>;
  const competency = d.competency as Record<string, unknown>;
  const devPlanning = d.developmentPlanning as Record<string, unknown>;
  const practiceQuality = d.practiceQuality as Record<string, unknown>;
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForDevelopment ?? []) as string[];
  const immediateActions = (d.immediateActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  const compDist = competency.competencyDistribution as Record<string, number> ?? {};
  const assessCurrency = competency.assessmentCurrency as Record<string, unknown> ?? {};
  const ratingDist = practiceQuality.ratingDistribution as Record<string, number> ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Workforce Development Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Staff" value={qualifications.totalStaff as number} /><Stat label="Qualifications" value={qualifications.totalQualifications as number} /><Stat label="CPD Records" value={cpd.totalRecords as number} /></div>
      <Section title="Qualifications" defaultOpen><ScoreBar label="Qualifications" value={qualifications.mandatoryComplianceRate as number} max={100} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Mandatory Compliance" value={`${qualifications.mandatoryComplianceRate}%`} /><Stat label="Mandatory Achieved" value={`${qualifications.mandatoryAchieved}/${qualifications.mandatoryTotal}`} /><Stat label="In Progress" value={qualifications.inProgressCount as number} /><Stat label="Overdue" value={qualifications.overdueCount as number} /><Stat label="Level 3+" value={`${qualifications.level3PlusRate}%`} /><Stat label="Evidence Recorded" value={`${qualifications.evidenceRecordedRate}%`} /></div></Section>
      <Section title="CPD"><ScoreBar label="CPD Hours Target Met" value={cpd.hoursTargetMetRate as number} max={100} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Total Hours" value={cpd.totalHours as number} /><Stat label="Avg Hours/Staff" value={cpd.averageHoursPerStaff as number} /><Stat label="Reflection Rate" value={`${cpd.overallReflectionRate}%`} /><Stat label="Sign-Off Rate" value={`${cpd.overallSignOffRate}%`} /><Stat label="Impact Documented" value={`${cpd.overallImpactDocumentedRate}%`} /><Stat label="Meeting Target" value={`${cpd.staffMeetingHoursTarget}/${qualifications.totalStaff}`} /></div></Section>
      <Section title="Competency"><ScoreBar label="Assessment Currency" value={assessCurrency.currencyRate as number} max={100} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Total Assessments" value={competency.totalAssessments as number} /><Stat label="Progression Rate" value={`${competency.progressionRate}%`} /><Stat label="Developing" value={compDist.developing ?? 0} /><Stat label="Competent" value={compDist.competent ?? 0} /><Stat label="Proficient" value={compDist.proficient ?? 0} /><Stat label="Expert" value={compDist.expert ?? 0} /></div></Section>
      <Section title="Development Planning"><ScoreBar label="Plan Coverage" value={devPlanning.planCoverageRate as number} max={100} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Staff with Plans" value={`${devPlanning.staffWithPlans}/${devPlanning.totalStaff}`} /><Stat label="Goals Achieved" value={`${devPlanning.goalsAchieved}/${devPlanning.totalGoals}`} /><Stat label="Goals In Progress" value={devPlanning.goalsInProgress as number} /><Stat label="Goals Overdue" value={devPlanning.goalsOverdue as number} /><Stat label="Plan Currency" value={`${devPlanning.planCurrencyRate}%`} /><Stat label="Home Needs Aligned" value={`${devPlanning.homeNeedsAlignmentRate}%`} /><Stat label="Regulatory Aligned" value={`${devPlanning.regulatoryAlignmentRate}%`} /><Stat label="Staff Input" value={`${devPlanning.staffInputRate}%`} /></div></Section>
      <Section title="Practice Quality"><ScoreBar label="Good or Better" value={practiceQuality.goodOrBetterRate as number} max={100} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Total Observations" value={practiceQuality.totalObservations as number} /><Stat label="Outstanding" value={ratingDist.outstanding ?? 0} /><Stat label="Good" value={ratingDist.good ?? 0} /><Stat label="Requires Improvement" value={ratingDist.requires_improvement ?? 0} /><Stat label="Inadequate" value={ratingDist.inadequate ?? 0} /><Stat label="Follow-Up Completed" value={`${practiceQuality.followUpCompleted}/${practiceQuality.followUpRequired}`} /><Stat label="Trajectory" value={(practiceQuality.improvementTrajectory as string ?? "N/A").replace(/_/g, " ")} /><Stat label="Action Plan Rate" value={`${practiceQuality.actionPlanRate}%`} /></div></Section>
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Development"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {immediateActions.length > 0 && <Section title="Immediate Actions"><ul className="text-sm space-y-1">{immediateActions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
