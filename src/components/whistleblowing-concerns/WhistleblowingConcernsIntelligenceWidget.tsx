"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) { const pct = Math.min(100, Math.round((value / max) * 100)); const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"; return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>; }
const pctStr = (v: unknown) => (typeof v === "number" ? `${v}%` : "—");
const numStr = (v: unknown) => (typeof v === "number" ? String(v) : "—");
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) { const [open, setOpen] = useState(defaultOpen); return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>); }
function ratingBadge(rating: string) { const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }

export function WhistleblowingConcernsIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/whistleblowing-concerns").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading whistleblowing concerns intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const reportingCulture = d.reportingCulture as Record<string, unknown>;
  const responseQuality = d.responseQuality as Record<string, unknown>;
  const staffProtection = d.staffProtection as Record<string, unknown>;
  const outcomesLearning = d.outcomesLearning as Record<string, unknown>;
  const strengths = (d.strengths ?? []) as string[];
  const concerns = (d.concerns ?? []) as string[];
  const immediateActions = (d.immediateActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Whistleblowing Concerns Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Concerns Raised" value={responseQuality.totalConcerns as number} /><Stat label="Ack Within 48hrs" value={pctStr(responseQuality.acknowledgedWithin48HrsRate)} /><Stat label="Resolved in 30d" value={pctStr(responseQuality.resolvedWithin30DaysRate)} /></div>
      <Section title="Reporting Culture" defaultOpen><ScoreBar label="Reporting Culture" value={reportingCulture.score as number} max={25} /><ul className="text-sm space-y-1 mt-2">{([["Policy Reviewed (12m)", reportingCulture.policyReviewedWithin12Months], ["Staff Aware", reportingCulture.staffAware], ["Named Contact", reportingCulture.namedContact], ["External Contacts Listed", reportingCulture.externalContactsListed], ["Child-Friendly Version", reportingCulture.childFriendlyVersion], ["Staff Confidence > 7", reportingCulture.staffConfidenceAbove7], ["Staff Trust > 7", reportingCulture.staffTrustAbove7]] as [string, unknown][]).map(([label, val]) => (<li key={label} className="flex items-center gap-2"><span className={val ? "text-green-600" : "text-red-500"}>{val ? "✓" : "✗"}</span>{label}</li>))}</ul></Section>
      <Section title="Response Quality"><ScoreBar label="Response Quality" value={responseQuality.score as number} max={30} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Total Concerns" value={responseQuality.totalConcerns as number} /><Stat label="Ack Within 48hrs" value={pctStr(responseQuality.acknowledgedWithin48HrsRate)} /><Stat label="Investigation Started" value={pctStr(responseQuality.investigationStartedRate)} /><Stat label="Resolved in 30d" value={pctStr(responseQuality.resolvedWithin30DaysRate)} /><Stat label="Lessons Identified" value={pctStr(responseQuality.lessonsIdentifiedRate)} /><Stat label="External Referral (Crit/High)" value={pctStr(responseQuality.externalReferralForCriticalHighRate)} /><Stat label="Avg Actions Taken" value={numStr(responseQuality.averageActionsTaken)} /></div></Section>
      <Section title="Staff Protection"><ScoreBar label="Staff Protection" value={staffProtection.score as number} max={25} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Total Protections" value={staffProtection.totalProtections as number} /><Stat label="Fully Protected" value={pctStr(staffProtection.fullyProtectedRate)} /><Stat label="Confidentiality" value={pctStr(staffProtection.confidentialityMaintainedRate)} /><Stat label="Support Offered" value={pctStr(staffProtection.supportOfferedRate)} /><Stat label="No Retaliation" value={(staffProtection.noRetaliationReported as boolean) ? "Yes" : "No"} /><Stat label="All Investigated" value={(staffProtection.allRetaliationInvestigated as boolean) ? "Yes" : "No"} /></div></Section>
      <Section title="Outcomes & Learning"><ScoreBar label="Outcomes & Learning" value={outcomesLearning.score as number} max={20} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Resolution Documented" value={pctStr(outcomesLearning.resolutionDocumentedRate)} /><Stat label="Substantiation Rate" value={pctStr(outcomesLearning.substantiationRate)} /><Stat label="Lessons Identified" value={pctStr(outcomesLearning.lessonsIdentifiedRate)} /><Stat label="Avg Actions/Concern" value={numStr(outcomesLearning.averageActionsPerConcern)} /><Stat label="Escalation Appropriate" value={(outcomesLearning.escalationAppropriate as boolean) ? "Yes" : "No"} /></div></Section>
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {concerns.length > 0 && <Section title="Concerns"><ul className="text-sm space-y-1">{concerns.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {immediateActions.length > 0 && <Section title="Immediate Actions"><ul className="text-sm space-y-1">{immediateActions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
