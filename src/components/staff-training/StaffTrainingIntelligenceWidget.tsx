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

export function StaffTrainingIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/staff-training")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading staff training intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const mandatory = d.mandatoryCompliance as Record<string, unknown>;
  const certs = d.certifications as Record<string, unknown>;
  const cpd = d.cpd as Record<string, unknown>;
  const quals = d.qualifications as Record<string, unknown>;
  const specialist = d.specialistTraining as Record<string, unknown>;
  const profiles = (d.staffProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForDevelopment ?? []) as string[];
  const actions = (d.immediateActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Staff Training Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Staff" value={mandatory.totalStaff as number} />
        <Stat label="Certifications" value={certs.totalCertifications as number} />
        <Stat label="CPD Avg Hours" value={cpd.averageHours as number} />
      </div>

      <Section title="Mandatory Compliance" defaultOpen>
        <ScoreBar label="Mandatory Compliance" value={mandatory.overallComplianceRate as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Staff" value={mandatory.totalStaff as number} />
          <Stat label="Compliance Rate" value={`${mandatory.overallComplianceRate}%`} />
        </div>
        {((mandatory.staffCompliance ?? []) as Record<string, unknown>[]).length > 0 && (
          <div className="mt-2 space-y-1">
            {((mandatory.staffCompliance ?? []) as Record<string, unknown>[]).map((s) => (
              <div key={s.staffId as string} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                <span>{s.staffName as string}</span>
                <span className="font-medium">{s.complianceRate as number}%</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Certifications">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Valid" value={certs.valid as number} />
          <Stat label="Expiring Soon" value={certs.expiringSoon as number} />
          <Stat label="Expired" value={certs.expired as number} />
          <Stat label="Validity Rate" value={`${certs.validityRate}%`} />
        </div>
        {((certs.expiredDetails ?? []) as Record<string, unknown>[]).length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-red-600 mb-1">Expired Certifications</p>
            {((certs.expiredDetails ?? []) as Record<string, unknown>[]).map((e, i) => (
              <div key={i} className="text-sm bg-red-50 p-2 rounded mb-1">
                {e.staffName as string} — {(e.category as string).replace(/_/g, " ")} ({e.daysSinceExpiry as number} days overdue)
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="CPD Hours">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Target Hours/Year" value={cpd.targetHoursPerYear as number} />
          <Stat label="Average Hours" value={cpd.averageHours as number} />
          <Stat label="Meeting Target" value={cpd.staffMeetingTarget as number} />
          <Stat label="Target Met Rate" value={`${cpd.targetMetRate}%`} />
        </div>
      </Section>

      <Section title="Qualifications">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Total Staff" value={quals.totalStaff as number} />
          <Stat label="Compliance Rate" value={`${quals.qualificationComplianceRate}%`} />
        </div>
      </Section>

      <Section title="Specialist Training">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Total Needs" value={specialist.totalChildNeeds as number} />
          <Stat label="Covered" value={specialist.coveredNeeds as number} />
          <Stat label="Uncovered" value={specialist.uncoveredNeeds as number} />
          <Stat label="Coverage Rate" value={`${specialist.coverageRate}%`} />
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Staff Profiles (${profiles.length})`}>
          {profiles.map((p) => (
            <div key={p.staffId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium">
                <span>{p.staffName as string}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${(p.overallReadiness as string) === "excellent" ? "bg-green-100 text-green-800" : (p.overallReadiness as string) === "good" ? "bg-yellow-100 text-yellow-800" : (p.overallReadiness as string) === "attention_needed" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}`}>{(p.overallReadiness as string).replace(/_/g, " ")}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{p.totalCourses as number} courses · {p.totalHours as number}h · Mandatory {p.mandatoryComplianceRate as number}% · {p.certificationsExpired as number} expired certs</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Development"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Immediate Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
