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

export function EducationAchievementIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/education-achievement")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading education achievement intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const attendance = d.attendance as Record<string, number>;
  const pep = d.pepQuality as Record<string, unknown>;
  const academic = d.academicProgress as Record<string, unknown>;
  const stability = d.schoolStability as Record<string, number>;
  const profiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Education Achievement Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Attendance" value={`${attendance.overallScore}/25`} />
        <Stat label="PEP Quality" value={`${pep.overallScore}/25`} />
        <Stat label="Child Profiles" value={profiles.length} />
      </div>

      <Section title="Attendance" defaultOpen>
        <ScoreBar label="Attendance" value={attendance.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Records" value={attendance.totalRecords} />
          <Stat label="Attendance Rate" value={`${attendance.attendanceRate}%`} />
          <Stat label="Unauthorised Absence" value={`${attendance.unauthorisedAbsenceRate}%`} />
          <Stat label="Persistent Absence" value={attendance.persistentAbsenceChildren} />
          <Stat label="Late Rate" value={`${attendance.lateRate}%`} />
          <Stat label="Exclusion Days" value={attendance.exclusionDays} />
        </div>
      </Section>

      <Section title="PEP Quality">
        <ScoreBar label="PEP Quality" value={pep.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total PEPs" value={pep.totalPEPs as number} />
          <Stat label="Current Rate" value={`${pep.currentRate}%`} />
          <Stat label="Child Views" value={`${pep.childViewsRate}%`} />
          <Stat label="SMART Targets" value={`${pep.smartTargetsRate}%`} />
          <Stat label="Virtual School" value={`${pep.virtualSchoolInvolvedRate}%`} />
          <Stat label="PP Funding Used" value={`${pep.ppFundingUsedRate}%`} />
        </div>
      </Section>

      <Section title="Academic Progress">
        <ScoreBar label="Academic Progress" value={academic.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Outcomes" value={academic.totalOutcomes as number} />
          <Stat label="Exceeding/Expected" value={`${academic.exceedingExpectedRate}%`} />
          <Stat label="Below Expected" value={`${academic.belowExpectedRate}%`} />
          <Stat label="Subject Coverage" value={academic.subjectCoverage as number} />
        </div>
      </Section>

      <Section title="School Stability">
        <ScoreBar label="School Stability" value={stability.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Children" value={stability.totalChildren} />
          <Stat label="Avg Days Out" value={stability.averageDaysOutOfEducation} />
          <Stat label="School Changes" value={stability.totalSchoolChanges} />
          <Stat label="Multiple Changes" value={stability.childrenWithMultipleChanges} />
          <Stat label="Not in Education" value={stability.notInEducationCount} />
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Child Profiles (${profiles.length})`}>
          {profiles.map((p) => (
            <div key={p.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{p.childName as string}</span><span>{p.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">Attendance: {p.attendanceRate as number}% · PEP: {(p.pepStatus as string).replace(/_/g, " ")} · Progress: {(p.academicProgress as string).replace(/_/g, " ")} · Exclusions: {p.exclusionCount as number}</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
