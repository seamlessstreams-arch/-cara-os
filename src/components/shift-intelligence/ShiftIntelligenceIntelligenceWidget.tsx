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

function complianceBadge(complianceRating: string) {
  const colours: Record<string, string> = {
    compliant: "bg-green-100 text-green-800",
    minor_concerns: "bg-yellow-100 text-yellow-800",
    significant_concerns: "bg-orange-100 text-orange-800",
    non_compliant: "bg-red-100 text-red-800",
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[complianceRating] ?? "bg-gray-100"}`}>{complianceRating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function ShiftIntelligenceIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/shift-intelligence")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading shift intelligence: {error}</div>;
  if (!data) return null;

  const overallScore = data.overallScore as number;
  const complianceRating = data.complianceRating as string;
  const coveragePercentage = data.coveragePercentage as number | null;
  const agencyUsagePercentage = data.agencyUsagePercentage as number | null;
  const seniorCoveragePercentage = data.seniorCoveragePercentage as number | null;
  const totalShiftsAnalysed = data.totalShiftsAnalysed as number;
  const coveredShifts = data.coveredShifts as number;
  const uncoveredShifts = data.uncoveredShifts as number;
  const averageStaffPerShift = data.averageStaffPerShift as number | null;
  const staffAtHighFatigueRisk = data.staffAtHighFatigueRisk as number;
  const keyWorkerComplianceRate = data.keyWorkerComplianceRate as number | null;
  const fatigueAssessments = (data.fatigueAssessments ?? []) as Record<string, unknown>[];
  const keyWorkerAvailability = (data.keyWorkerAvailability ?? []) as Record<string, unknown>[];
  const concerns = (data.concerns ?? []) as Record<string, unknown>[];
  const immediateActions = (data.immediateActions ?? []) as string[];
  const regulatoryLinks = (data.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Shift Intelligence</h2>
        {complianceBadge(complianceRating)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Overall Score" value={`${overallScore}/100`} />
        <Stat label="Coverage" value={formatRate(coveragePercentage)} />
        <Stat label="Agency Usage" value={formatRate(agencyUsagePercentage)} />
        <Stat label="Senior Coverage" value={formatRate(seniorCoveragePercentage)} />
      </div>

      <Section title="Coverage Summary" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <Stat label="Shifts Analysed" value={totalShiftsAnalysed} />
          <Stat label="Covered" value={coveredShifts} />
          <Stat label="Uncovered" value={uncoveredShifts} />
          <Stat label="Avg Staff/Shift" value={averageStaffPerShift ?? "—"} />
        </div>
        <div className="mt-3">
          <ScoreBar label="Coverage" value={coveragePercentage ?? 0} max={100} />
          <ScoreBar label="KW Compliance" value={keyWorkerComplianceRate ?? 0} max={100} />
        </div>
      </Section>

      <Section title="Fatigue Assessments">
        {fatigueAssessments.length === 0 ? (
          <p className="text-sm text-gray-500">No fatigue assessments available.</p>
        ) : (
          <div className="space-y-2">
            <Stat label="High Fatigue Risk Staff" value={staffAtHighFatigueRisk} />
            {fatigueAssessments.filter((fa) => fa.riskLevel === "high" || fa.riskLevel === "critical").map((fa) => (
              <div key={fa.staffId as string} className="bg-gray-50 rounded p-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{fa.staffName as string}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${(fa.riskLevel as string) === "critical" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}`}>
                    {(fa.riskLevel as string).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{fa.totalHoursThisWeek as number}hrs this week, {fa.consecutiveDaysWorked as number} consecutive days</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Key Worker Availability">
        {keyWorkerAvailability.length === 0 ? (
          <p className="text-sm text-gray-500">No key worker availability data.</p>
        ) : (
          <div className="space-y-2">
            {keyWorkerAvailability.map((kw) => (
              <div key={kw.childId as string} className="bg-gray-50 rounded p-2 text-sm flex justify-between items-center">
                <div>
                  <span className="font-medium">{kw.childName as string}</span>
                  <span className="text-xs text-gray-500 ml-2">KW: {kw.keyWorkerName as string}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${(kw.isCompliant as boolean) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {(kw.isCompliant as boolean) ? "Compliant" : `${kw.gapDays} day gap`}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Concerns">
        {concerns.length === 0 ? <p className="text-sm text-gray-500">No concerns identified.</p> : (
          <div className="space-y-1">
            {concerns.map((c, i) => (
              <div key={i} className="flex justify-between items-center text-sm bg-gray-50 rounded p-2">
                <span>{(c.concern as string).replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${(c.severity as string) === "high" ? "bg-red-100 text-red-800" : (c.severity as string) === "medium" ? "bg-orange-100 text-orange-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {(c.severity as string)} ({c.count as number})
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Immediate Actions">
        {immediateActions.length === 0 ? <p className="text-sm text-gray-500">No immediate actions required.</p> : (
          <ul className="list-disc pl-5 text-sm space-y-1">{immediateActions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        )}
      </Section>

      <Section title="Regulatory Links">
        <ul className="list-disc pl-5 text-sm space-y-1">{regulatoryLinks.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </Section>
    </div>
  );
}
