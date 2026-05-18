"use client";

import { useEffect, useState } from "react";
import type { PremisesIntelligenceResult } from "@/lib/premises/premises-engine";

// ── Subcomponents ────────────────────────────────────────────────────────────

function RatingBadge({ rating }: { rating: string }) {
  const color =
    rating === "outstanding" ? "bg-green-100 text-green-800 border-green-300"
    : rating === "good" ? "bg-blue-100 text-blue-800 border-blue-300"
    : rating === "requires_improvement" ? "bg-amber-100 text-amber-800 border-amber-300"
    : "bg-red-100 text-red-800 border-red-300";
  const label = rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className={`rounded-lg border p-4 ${color ?? "bg-white"}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColor = color ?? (pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500");
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600">{pct}%</span>
    </div>
  );
}

function StatusBadge({ text, color }: { text: string; color: string }) {
  return <span className={`mr-2 mb-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${color}`}>{text}</span>;
}

// ── Main widget ──────────────────────────────────────────────────────────────

export function PremisesDashboardWidget() {
  const [data, setData] = useState<PremisesIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/premises")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 rounded-xl border p-6">
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-20 rounded bg-gray-100" />))}
        </div>
        <div className="h-32 rounded bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-800">Error loading premises data</h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { compliance, maintenance, fireDrills, environmentalRisks } = data;

  return (
    <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Premises & Physical Environment</h2>
          <p className="text-sm text-gray-500">Building safety, fire drills, maintenance, environmental risk</p>
        </div>
        <RatingBadge rating={data.rating} />
      </div>

      {/* ── Key metrics ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <MetricCard
          label="Overall Score"
          value={`${data.overallScore}/100`}
          color={data.overallScore >= 80 ? "bg-green-50" : data.overallScore >= 60 ? "bg-blue-50" : data.overallScore >= 40 ? "bg-amber-50" : "bg-red-50"}
        />
        <MetricCard
          label="Compliance Rate"
          value={`${compliance.complianceRate}%`}
          sub={`${compliance.passed + compliance.notDue}/${compliance.totalChecks} compliant`}
        />
        <MetricCard
          label="Maintenance Open"
          value={maintenance.open}
          sub={`${maintenance.criticalOpen} critical`}
          color={maintenance.criticalOpen > 0 ? "bg-red-50" : "bg-white"}
        />
        <MetricCard
          label="Fire Drills"
          value={fireDrills.drillsInPeriod}
          sub={fireDrills.drillFrequencyAdequate ? "Adequate frequency" : "Below expected"}
          color={fireDrills.drillFrequencyAdequate ? "bg-green-50" : "bg-amber-50"}
        />
        <MetricCard
          label="Open Risks"
          value={environmentalRisks.openRisks}
          sub={`${environmentalRisks.criticalOpen} critical`}
          color={environmentalRisks.criticalOpen > 0 ? "bg-red-50" : "bg-white"}
        />
      </div>

      {/* ── Status badges ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap">
        {compliance.overdue > 0 && <StatusBadge text={`${compliance.overdue} overdue check(s)`} color="bg-red-100 text-red-800" />}
        {compliance.failed > 0 && <StatusBadge text={`${compliance.failed} failed check(s)`} color="bg-red-100 text-red-800" />}
        {maintenance.criticalOpen > 0 && <StatusBadge text={`${maintenance.criticalOpen} critical maintenance`} color="bg-red-100 text-red-800" />}
        {environmentalRisks.criticalOpen > 0 && <StatusBadge text={`${environmentalRisks.criticalOpen} critical risk(s)`} color="bg-red-100 text-red-800" />}
        {environmentalRisks.overdueReviews.length > 0 && <StatusBadge text={`${environmentalRisks.overdueReviews.length} overdue risk review(s)`} color="bg-amber-100 text-amber-800" />}
        {compliance.dueSoon > 0 && <StatusBadge text={`${compliance.dueSoon} check(s) due soon`} color="bg-amber-100 text-amber-800" />}
        {fireDrills.nightDrillsConducted > 0 && <StatusBadge text="Night drill completed" color="bg-green-100 text-green-800" />}
        {compliance.overdue === 0 && compliance.failed === 0 && <StatusBadge text="All checks compliant" color="bg-green-100 text-green-800" />}
      </div>

      {/* ── Compliance Checks ───────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <button onClick={() => toggle("compliance")} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
          <span className="font-semibold text-gray-800">Compliance Checks</span>
          <span className="text-gray-400">{expandedSections.compliance ? "▼" : "▶"}</span>
        </button>
        {expandedSections.compliance && (
          <div className="space-y-3 border-t p-4">
            {compliance.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="w-48 truncate text-sm text-gray-700">{cat.label}</span>
                <ProgressBar value={cat.passed} max={cat.total} />
                <span className="text-xs text-gray-500">{cat.passed}/{cat.total}</span>
                {cat.failed > 0 && <span className="text-xs text-red-600 font-medium">FAILED</span>}
                {cat.overdue > 0 && <span className="text-xs text-amber-600 font-medium">OVERDUE</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Maintenance ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <button onClick={() => toggle("maintenance")} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
          <span className="font-semibold text-gray-800">Maintenance Requests</span>
          <span className="text-gray-400">{expandedSections.maintenance ? "▼" : "▶"}</span>
        </button>
        {expandedSections.maintenance && (
          <div className="space-y-3 border-t p-4">
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div><div className="text-lg font-bold">{maintenance.completed}</div><div className="text-gray-500">Completed</div></div>
              <div><div className="text-lg font-bold">{maintenance.open}</div><div className="text-gray-500">Open</div></div>
              <div><div className="text-lg font-bold">{maintenance.deferred}</div><div className="text-gray-500">Deferred</div></div>
              <div><div className="text-lg font-bold">{maintenance.avgResolutionDays}d</div><div className="text-gray-500">Avg Resolution</div></div>
            </div>
            {maintenance.openRequests.length > 0 && (
              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-semibold uppercase text-gray-500">Open Requests</h4>
                {maintenance.openRequests.map((req) => (
                  <div key={req.id} className={`flex items-center justify-between rounded p-2 text-sm ${req.urgency === "critical" ? "bg-red-50" : req.urgency === "high" ? "bg-amber-50" : "bg-gray-50"}`}>
                    <span className="text-gray-700">{req.description}</span>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${req.urgency === "critical" ? "bg-red-200 text-red-800" : req.urgency === "high" ? "bg-amber-200 text-amber-800" : "bg-gray-200 text-gray-700"}`}>
                        {req.urgency}
                      </span>
                      <span className="text-xs text-gray-500">{req.daysOpen}d open</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fire Drills ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <button onClick={() => toggle("drills")} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
          <span className="font-semibold text-gray-800">Fire Drills</span>
          <span className="text-gray-400">{expandedSections.drills ? "▼" : "▶"}</span>
        </button>
        {expandedSections.drills && (
          <div className="space-y-3 border-t p-4">
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div><div className="text-lg font-bold">{fireDrills.drillsInPeriod}</div><div className="text-gray-500">Drills Conducted</div></div>
              <div><div className="text-lg font-bold">{fireDrills.avgEvacuationTime}m</div><div className="text-gray-500">Avg Evacuation</div></div>
              <div><div className="text-lg font-bold">{fireDrills.allChildrenAccountedForRate}%</div><div className="text-gray-500">Children Accounted For</div></div>
              <div><div className="text-lg font-bold">{fireDrills.allStaffParticipatedRate}%</div><div className="text-gray-500">Full Staff Participation</div></div>
            </div>
            <div className="mt-3 space-y-2">
              <h4 className="text-xs font-semibold uppercase text-gray-500">Drills by Time of Day</h4>
              {fireDrills.drillsByTimeOfDay.map((d) => (
                <div key={d.timeOfDay} className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm">
                  <span className="capitalize text-gray-700">{d.timeOfDay}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">{d.count} drill{d.count !== 1 ? "s" : ""}</span>
                    {d.count > 0 && <span className="text-gray-500">avg {d.avgEvacTime}m</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Environmental Risks ─────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <button onClick={() => toggle("risks")} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
          <span className="font-semibold text-gray-800">Environmental Risks</span>
          <span className="text-gray-400">{expandedSections.risks ? "▼" : "▶"}</span>
        </button>
        {expandedSections.risks && (
          <div className="space-y-3 border-t p-4">
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div><div className="text-lg font-bold">{environmentalRisks.openRisks}</div><div className="text-gray-500">Open</div></div>
              <div><div className="text-lg font-bold">{environmentalRisks.mitigatedRisks}</div><div className="text-gray-500">Mitigated</div></div>
              <div><div className="text-lg font-bold">{environmentalRisks.closedRisks}</div><div className="text-gray-500">Closed</div></div>
              <div><div className="text-lg font-bold">{environmentalRisks.mitigationRate}%</div><div className="text-gray-500">Mitigation Rate</div></div>
            </div>
            {environmentalRisks.risksByLevel.length > 0 && (
              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-semibold uppercase text-gray-500">Risks by Level</h4>
                {environmentalRisks.risksByLevel.map((r) => (
                  <div key={r.level} className={`flex items-center justify-between rounded p-2 text-sm ${r.level === "critical" ? "bg-red-50" : r.level === "high" ? "bg-amber-50" : "bg-gray-50"}`}>
                    <span className="capitalize font-medium text-gray-700">{r.level}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span>{r.total} total</span>
                      <span className="text-red-600">{r.open} open</span>
                      <span className="text-green-600">{r.mitigated} mitigated</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {environmentalRisks.overdueReviews.length > 0 && (
              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-semibold uppercase text-gray-500">Overdue Reviews</h4>
                {environmentalRisks.overdueReviews.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded bg-amber-50 p-2 text-sm">
                    <span className="text-gray-700">{r.riskArea}</span>
                    <span className="text-xs text-amber-700">{r.daysPastDue} days overdue</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Strengths / Areas / Actions ─────────────────────────────────── */}
      <div className="rounded-lg border">
        <button onClick={() => toggle("analysis")} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
          <span className="font-semibold text-gray-800">Strengths, Areas for Improvement & Actions</span>
          <span className="text-gray-400">{expandedSections.analysis ? "▼" : "▶"}</span>
        </button>
        {expandedSections.analysis && (
          <div className="space-y-4 border-t p-4">
            {data.strengths.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-green-700">Strengths</h4>
                <ul className="mt-1 space-y-1">
                  {data.strengths.map((s, i) => <li key={i} className="text-sm text-gray-700">✓ {s}</li>)}
                </ul>
              </div>
            )}
            {data.areasForImprovement.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-amber-700">Areas for Improvement</h4>
                <ul className="mt-1 space-y-1">
                  {data.areasForImprovement.map((a, i) => <li key={i} className="text-sm text-gray-700">△ {a}</li>)}
                </ul>
              </div>
            )}
            {data.actions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-blue-700">Suggested Actions</h4>
                <ul className="mt-1 space-y-1">
                  {data.actions.map((a, i) => <li key={i} className="text-sm text-gray-700">→ {a}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Regulatory Framework ────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <button onClick={() => toggle("regulatory")} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
          <span className="font-semibold text-gray-800">Regulatory Framework</span>
          <span className="text-gray-400">{expandedSections.regulatory ? "▼" : "▶"}</span>
        </button>
        {expandedSections.regulatory && (
          <div className="border-t p-4">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((l, i) => <li key={i} className="text-xs text-gray-600">• {l}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
