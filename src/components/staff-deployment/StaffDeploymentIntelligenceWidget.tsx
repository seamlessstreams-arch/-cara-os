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

export function StaffDeploymentIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/staff-deployment")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading staff deployment intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const scores = d.componentScores as Record<string, number>;
  const adequacy = d.staffingAdequacy as Record<string, unknown>;
  const agency = d.agencyMinimisation as Record<string, unknown>;
  const consistency = d.consistencyOfCare as Record<string, unknown>;
  const rota = d.rotaCompliance as Record<string, unknown>;
  const incidents = d.incidentManagement as Record<string, unknown>;
  const profiles = (d.staffProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.recommendedActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Staff Deployment Intelligence</h2>
        {ratingBadge(d.overallRating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Fill Rate" value={`${adequacy.fillRate}%`} />
        <Stat label="Agency Usage" value={`${agency.agencyUsageRate}%`} />
        <Stat label="Total Incidents" value={incidents.totalIncidents as number} />
      </div>

      <Section title="Component Scores" defaultOpen>
        <ScoreBar label="Staffing Adequacy" value={scores.staffingAdequacy} />
        <ScoreBar label="Agency Minimisation" value={scores.agencyMinimisation} max={20} />
        <ScoreBar label="Consistency of Care" value={scores.consistencyOfCare} />
        <ScoreBar label="Rota Compliance" value={scores.rotaCompliance} max={15} />
        <ScoreBar label="Incident Management" value={scores.incidentManagement} max={15} />
      </Section>

      <Section title="Staffing Adequacy">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Fill Rate" value={`${adequacy.fillRate}%`} />
          <Stat label="Staff:Child Ratio" value={adequacy.averageStaffChildRatio as number} />
          <Stat label="Shifts Understaffed" value={adequacy.shiftsUnderstaffed as number} />
          <Stat label="Senior On Shift" value={`${adequacy.seniorOnShiftRate}%`} />
          <Stat label="Total Shifts" value={adequacy.shiftsTotal as number} />
          <Stat label="Shifts Filled" value={adequacy.shiftsFilled as number} />
        </div>
      </Section>

      <Section title="Agency Minimisation">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Agency Usage" value={`${agency.agencyUsageRate}%`} />
          <Stat label="Agency Shifts" value={agency.agencyShiftsCount as number} />
          <Stat label="Briefing Completed" value={`${agency.briefingCompletionRate}%`} />
          <Stat label="Children Known" value={`${agency.childrenKnownRate}%`} />
        </div>
      </Section>

      <Section title="Consistency of Care">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Avg Unique Staff/Child" value={consistency.averageUniqueStaffPerChild as number} />
          <Stat label="Key Worker Coverage" value={`${consistency.keyWorkerCoverage}%`} />
          <Stat label="Secondary KW Coverage" value={`${consistency.secondaryKeyWorkerCoverage}%`} />
          <Stat label="Avg Contacts/Child" value={consistency.averageContactsPerChild as number} />
        </div>
      </Section>

      <Section title="Rota Compliance">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Published On Time" value={`${rota.rotaPublishedOnTimeRate}%`} />
          <Stat label="Long Day Compliance" value={`${rota.longDayComplianceRate}%`} />
          <Stat label="Night Cover" value={`${rota.nightCoverRate}%`} />
        </div>
      </Section>

      <Section title="Incident Management">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Total Incidents" value={incidents.totalIncidents as number} />
          <Stat label="Lone Working" value={incidents.loneWorkingIncidents as number} />
          <Stat label="Understaffed" value={incidents.understaffedIncidents as number} />
          <Stat label="No Senior" value={incidents.noSeniorIncidents as number} />
          <Stat label="Unplanned Absence" value={incidents.unplannedAbsenceIncidents as number} />
          <Stat label="Resolution Rate" value={`${incidents.resolutionRate}%`} />
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Staff Profiles (${profiles.length})`}>
          {profiles.map((p) => (
            <div key={p.staffId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium">
                <span>{p.staffName as string}</span>
                <span className="text-xs text-gray-500">{(p.role as string).replace(/_/g, " ")}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{p.contractType as string} · {p.shiftsWorked as number} shifts · {p.keyChildrenCount as number} key children{(p.isAgency as boolean) ? " · Agency" : ""}{(p.isBank as boolean) ? " · Bank" : ""}</p>
              {((p.riskFlags ?? []) as string[]).length > 0 && <p className="text-xs text-red-600 mt-1">{((p.riskFlags ?? []) as string[]).join(" · ")}</p>}
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Recommended Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links">
        <ul className="text-sm text-gray-600 space-y-1">
          {regs.map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded ${(r.status as string) === "met" ? "bg-green-100 text-green-800" : (r.status as string) === "partially_met" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{(r.status as string).replace(/_/g, " ")}</span>
              {r.regulation as string} — {r.requirement as string}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
