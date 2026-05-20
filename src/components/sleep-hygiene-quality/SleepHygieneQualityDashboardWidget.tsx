"use client";

// ══════════════════════════════════════════════════════════════════════════════
// SLEEP HYGIENE QUALITY DASHBOARD WIDGET
//
// Displays the 4-layer sleep hygiene quality intelligence:
// - Overall score with rating
// - Layer scores: sleep quality, compliance, policy, staff readiness
// - Child sleep profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface SleepQualityData {
  totalRecords: number;
  sleepQualityRate: number;
  routineRate: number;
  environmentRate: number;
  restfulRate: number;
  qualityBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface SleepComplianceData {
  totalRecords: number;
  documentedRate: number;
  staffMonitoredRate: number;
  feedbackRate: number;
  sleepTypeDiversityRatio: number;
  uniqueTypes: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface SleepPolicyData {
  bedtimeRoutineGuideline: boolean;
  sleepEnvironmentStandard: boolean;
  nightMonitoringProcedure: boolean;
  screenTimePolicy: boolean;
  sleepConcernProtocol: boolean;
  relaxationProgramme: boolean;
  regularReview: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffReadinessData {
  totalStaff: number;
  sleepHygieneKnowledgeRate: number;
  nightSupervisionRate: number;
  relaxationTechniquesRate: number;
  sleepDisorderAwarenessRate: number;
  traumaInformedSleepRate: number;
  environmentManagementRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  sleepQualityRate: number;
  routineRate: number;
  uniqueTypes: number;
  sleepScore: number;
}

interface SleepHygieneData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  sleepQuality: SleepQualityData;
  sleepCompliance: SleepComplianceData;
  sleepPolicy: SleepPolicyData;
  staffReadiness: StaffReadinessData;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: Record<string, unknown>;
}

// ── ScoreBar ──────────────────────────────────────────────────────────────

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const pctVal = Math.round((score / maxScore) * 100);
  const color =
    pctVal >= 80 ? "bg-green-500"
      : pctVal >= 60 ? "bg-blue-500"
        : pctVal >= 40 ? "bg-amber-500"
          : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}/{maxScore}</span>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Stat ──────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-gray-500 text-sm">{label}: </span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────

export default function SleepHygieneQualityDashboardWidget() {
  const [data, setData] = useState<SleepHygieneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/sleep-hygiene-quality");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Sleep Hygiene Quality</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) return null;

  const ratingColorClass =
    data.rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : data.rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : data.rating === "requires_improvement"
          ? "bg-amber-100 text-amber-800 border-amber-300"
          : "bg-red-100 text-red-800 border-red-300";

  const ratingLabel =
    data.rating === "outstanding" ? "Outstanding"
      : data.rating === "good" ? "Good"
        : data.rating === "requires_improvement" ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sleep Hygiene Quality</h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} | {data.sleepQuality.totalRecords} records | {data.staffReadiness.totalStaff} staff
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColorClass}`}>
            {ratingLabel}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.sleepQuality.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Sleep Records</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.sleepQuality.sleepQualityRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Good+ Quality</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.sleepQuality.routineRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Routine Followed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.sleepQuality.restfulRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Restful Sleep</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      {/* Layer Score Bars */}
      <div className="space-y-2">
        <ScoreBar score={data.sleepQuality.score} label="Sleep Quality" maxScore={25} />
        <ScoreBar score={data.sleepCompliance.score} label="Compliance" maxScore={25} />
        <ScoreBar score={data.sleepPolicy.score} label="Policy" maxScore={25} />
        <ScoreBar score={data.staffReadiness.score} label="Staff Readiness" maxScore={25} />
      </div>

      {/* Expandable Sections */}
      <div className="space-y-3">
        {/* Child Profiles */}
        {data.childProfiles.length > 0 && (
          <Section title="Child Sleep Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => {
                const scoreColor =
                  child.sleepScore >= 8 ? "bg-green-100 text-green-700"
                    : child.sleepScore >= 5 ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700";
                return (
                  <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{child.childName}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${scoreColor}`}>
                        {child.sleepScore}/10
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <Stat label="Records" value={child.totalRecords} />
                      <Stat label="Quality" value={child.sleepQualityRate + "%"} />
                      <Stat label="Routine" value={child.routineRate + "%"} />
                      <Stat label="Types" value={child.uniqueTypes + "/8"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Sleep Quality Detail */}
        <Section title="Sleep Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Records" value={data.sleepQuality.totalRecords} />
            <Stat label="Good+" value={data.sleepQuality.sleepQualityRate + "%"} />
            <Stat label="Routine" value={data.sleepQuality.routineRate + "%"} />
            <Stat label="Environment" value={data.sleepQuality.environmentRate + "%"} />
            <Stat label="Restful" value={data.sleepQuality.restfulRate + "%"} />
          </div>
        </Section>

        {/* Compliance Detail */}
        <Section title="Sleep Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Documented" value={data.sleepCompliance.documentedRate + "%"} />
            <Stat label="Monitored" value={data.sleepCompliance.staffMonitoredRate + "%"} />
            <Stat label="Feedback" value={data.sleepCompliance.feedbackRate + "%"} />
            <Stat label="Types Used" value={data.sleepCompliance.uniqueTypes + "/8"} />
          </div>
        </Section>

        {/* Policy Detail */}
        <Section title="Sleep Policy">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: "Bedtime Routine Guideline", value: data.sleepPolicy.bedtimeRoutineGuideline },
              { label: "Sleep Environment Standard", value: data.sleepPolicy.sleepEnvironmentStandard },
              { label: "Night Monitoring Procedure", value: data.sleepPolicy.nightMonitoringProcedure },
              { label: "Screen Time Policy", value: data.sleepPolicy.screenTimePolicy },
              { label: "Sleep Concern Protocol", value: data.sleepPolicy.sleepConcernProtocol },
              { label: "Relaxation Programme", value: data.sleepPolicy.relaxationProgramme },
              { label: "Regular Review", value: data.sleepPolicy.regularReview },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.value ? "bg-green-500" : "bg-red-400"}`} />
                <span className="text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Staff Readiness Detail */}
        <Section title="Staff Sleep Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Staff" value={data.staffReadiness.totalStaff} />
            <Stat label="Sleep Hygiene" value={data.staffReadiness.sleepHygieneKnowledgeRate + "%"} />
            <Stat label="Night Supervision" value={data.staffReadiness.nightSupervisionRate + "%"} />
            <Stat label="Relaxation" value={data.staffReadiness.relaxationTechniquesRate + "%"} />
            <Stat label="Sleep Disorders" value={data.staffReadiness.sleepDisorderAwarenessRate + "%"} />
            <Stat label="Trauma-Informed" value={data.staffReadiness.traumaInformedSleepRate + "%"} />
            <Stat label="Environment" value={data.staffReadiness.environmentManagementRate + "%"} />
          </div>
        </Section>

        {/* Strengths, Areas & Actions */}
        <Section title="Strengths, Areas & Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Actions</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.actions.map((a, i) => (
                  <li key={i} className={a.startsWith("URGENT") ? "text-red-700 font-medium" : ""}>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* Regulatory Framework */}
        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">&sect;</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
