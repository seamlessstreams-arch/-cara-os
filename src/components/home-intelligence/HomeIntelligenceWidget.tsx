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

function domainColour(avg: number): string {
  if (avg >= 80) return "text-green-700";
  if (avg >= 60) return "text-yellow-700";
  if (avg >= 40) return "text-orange-700";
  return "text-red-700";
}

export function HomeIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/home-intelligence")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading home intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const domainQuality = d.domainQuality as Record<string, number>;
  const moduleCoverage = d.moduleCoverage as Record<string, number>;
  const ofstedAlignment = d.ofstedAlignment as Record<string, unknown>;
  const riskProfile = d.riskProfile as Record<string, unknown>;
  const domainSummaries = (d.domainSummaries ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Home Intelligence Summary</h2>
          <p className="text-xs text-gray-500">{d.homeName as string} · {d.periodStart as string} to {d.periodEnd as string}</p>
        </div>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Modules" value={d.totalModules as number} />
        <Stat label="High Perf %" value={`${moduleCoverage.highPerformanceModuleRate}%`} />
        <Stat label="Consistency" value={`${moduleCoverage.consistencyScore}%`} />
      </div>

      <Section title="Domain Quality" defaultOpen>
        <ScoreBar label="Domain Quality" value={domainQuality.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Child Experiences" value={`${domainQuality.childExperiencesAvg}/100`} />
          <Stat label="Safety & Protection" value={`${domainQuality.safetyProtectionAvg}/100`} />
          <Stat label="Leadership" value={`${domainQuality.leadershipManagementAvg}/100`} />
          <Stat label="Workforce" value={`${domainQuality.workforceOperationsAvg}/100`} />
        </div>
      </Section>

      <Section title="Ofsted Alignment">
        <ScoreBar label="Ofsted Alignment" value={ofstedAlignment.overallScore as number} />
        <ul className="text-sm space-y-1 mt-2">
          {([
            ["Child Experiences ≥ 60", ofstedAlignment.childExperiencesAboveThreshold],
            ["Safety & Protection ≥ 60", ofstedAlignment.safetyProtectionAboveThreshold],
            ["Leadership & Management ≥ 60", ofstedAlignment.leadershipAboveThreshold],
            ["Workforce & Operations ≥ 60", ofstedAlignment.workforceAboveThreshold],
            ["No Inadequate Domains", ofstedAlignment.noInadequateDomains],
            ["Cross-Domain Consistency", ofstedAlignment.crossDomainConsistency],
            ["All Modules ≥ 30", ofstedAlignment.allModulesAboveMinimum],
          ] as [string, unknown][]).map(([label, val]) => (
            <li key={label} className="flex items-center gap-2">
              <span className={val ? "text-green-600" : "text-red-500"}>{val ? "✓" : "✗"}</span>{label}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Module Coverage">
        <ScoreBar label="Module Coverage" value={moduleCoverage.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Coverage" value={`${moduleCoverage.moduleCoverageRate}%`} />
          <Stat label="Domain Coverage" value={`${moduleCoverage.domainCoverageRate}%`} />
        </div>
      </Section>

      <Section title="Risk Profile">
        <ScoreBar label="Risk Profile" value={riskProfile.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Inadequate Modules" value={riskProfile.inadequateModulesCount as number} />
          <Stat label="Requires Improvement" value={riskProfile.requiresImprovementModulesCount as number} />
          <Stat label="Domain Spread" value={`${Math.round(riskProfile.domainSpread as number)} pts`} />
          <Stat label="Weakest Domain" value={riskProfile.weakestDomain ? (riskProfile.weakestDomainAvg as number) + "/100" : "N/A"} />
        </div>
      </Section>

      {domainSummaries.length > 0 && (
        <Section title="Domain Breakdown">
          {domainSummaries.map((ds) => {
            const mods = (ds.modules ?? []) as Record<string, unknown>[];
            const avg = ds.averageScore as number;
            return (
              <div key={ds.domain as string} className="mb-3">
                <div className="flex justify-between items-center text-sm font-medium mb-1">
                  <span>{ds.domainLabel as string}</span>
                  <span className={domainColour(avg)}>{avg}/100 {ratingBadge(ds.rating as string)}</span>
                </div>
                {mods.length > 0 ? (
                  <div className="space-y-1 ml-2">
                    {mods.map((m) => (
                      <div key={m.moduleId as string} className="flex justify-between text-xs text-gray-600">
                        <span>{m.moduleName as string}</span>
                        <span className="font-medium">{m.score as number}/100 {ratingBadge(m.rating as string)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 ml-2">No modules in this domain</p>
                )}
              </div>
            );
          })}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
