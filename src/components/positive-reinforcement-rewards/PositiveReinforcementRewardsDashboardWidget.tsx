"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChildReinforcementProfile {
  childId: string;
  childName: string;
  totalPraise: number;
  totalRewards: number;
  behaviourTrend: string;
  positiveResponseRate: number;
  overallScore: number;
}

interface ReinforcementData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  praiseRecognition: {
    overallScore: number;
    totalPraise: number;
    positiveResponseRate: number;
    specificRate: number;
    linkedToValuesRate: number;
    praiseTypeVariety: number;
  };
  rewardSystem: {
    overallScore: number;
    totalRewards: number;
    childChosenRate: number;
    fairConsistentRate: number;
    linkedToPlanRate: number;
    positiveResponseRate: number;
  };
  behaviouralImpact: {
    overallScore: number;
    totalAssessments: number;
    improvedTrendRate: number;
    deEscalationRate: number;
    lowRestraintRate: number;
    positiveChildFeelingRate: number;
  };
  staffReinforcementReadiness: {
    overallScore: number;
    totalStaff: number;
    positiveBehaviourRate: number;
    therapeuticCareRate: number;
    deEscalationRate: number;
    rewardDesignRate: number;
    traumaInformedRate: number;
    consistencyRate: number;
  };
  childProfiles: ChildReinforcementProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ratingColour(r: string) {
  if (r === "outstanding") return "text-green-700 bg-green-50 border-green-200";
  if (r === "good") return "text-blue-700 bg-blue-50 border-blue-200";
  if (r === "requires_improvement") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function ratingLabel(r: string) {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function trendColour(t: string) {
  if (t === "significantly_improved" || t === "improved") return "text-green-700 bg-green-50";
  if (t === "stable") return "text-blue-700 bg-blue-50";
  return "text-red-700 bg-red-50";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ScoreBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const fill =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
      >
        <span className="font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

export default function PositiveReinforcementRewardsDashboardWidget() {
  const [data, setData] = useState<ReinforcementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/positive-reinforcement-rewards")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-bold text-red-800 mb-2">Positive Reinforcement & Rewards</h2>
        <p className="text-red-600 text-sm">Failed to load data: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const rc = ratingColour(data.rating);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Positive Reinforcement & Rewards</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.periodStart} — {data.periodEnd}
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${rc}`}>
          <span className="text-xl font-bold">{data.overallScore}</span>
          <span>/100</span>
          <span className="ml-1">{ratingLabel(data.rating)}</span>
        </div>
      </div>

      {/* ---- Score bars ---- */}
      <div className="mb-6">
        <ScoreBar label="Praise & Recognition" score={data.praiseRecognition.overallScore} />
        <ScoreBar label="Reward System" score={data.rewardSystem.overallScore} />
        <ScoreBar label="Behavioural Impact" score={data.behaviouralImpact.overallScore} />
        <ScoreBar label="Staff Readiness" score={data.staffReinforcementReadiness.overallScore} />
      </div>

      {/* ---- Praise detail ---- */}
      <Section title="Praise & Recognition" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Praise" value={data.praiseRecognition.totalPraise} />
          <Stat label="Positive Response" value={`${data.praiseRecognition.positiveResponseRate}%`} />
          <Stat label="Specific & Descriptive" value={`${data.praiseRecognition.specificRate}%`} />
          <Stat label="Linked to Values" value={`${data.praiseRecognition.linkedToValuesRate}%`} />
          <Stat label="Praise Type Variety" value={data.praiseRecognition.praiseTypeVariety} />
        </div>
      </Section>

      {/* ---- Reward System detail ---- */}
      <Section title="Reward System">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Rewards" value={data.rewardSystem.totalRewards} />
          <Stat label="Child Chosen" value={`${data.rewardSystem.childChosenRate}%`} />
          <Stat label="Fair & Consistent" value={`${data.rewardSystem.fairConsistentRate}%`} />
          <Stat label="Linked to Plan" value={`${data.rewardSystem.linkedToPlanRate}%`} />
          <Stat label="Positive Response" value={`${data.rewardSystem.positiveResponseRate}%`} />
        </div>
      </Section>

      {/* ---- Behavioural Impact detail ---- */}
      <Section title="Behavioural Impact">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Assessments" value={data.behaviouralImpact.totalAssessments} />
          <Stat label="Improved Trend" value={`${data.behaviouralImpact.improvedTrendRate}%`} />
          <Stat label="De-escalation" value={`${data.behaviouralImpact.deEscalationRate}%`} />
          <Stat label="Low Restraint" value={`${data.behaviouralImpact.lowRestraintRate}%`} />
          <Stat label="Positive Feeling" value={`${data.behaviouralImpact.positiveChildFeelingRate}%`} />
        </div>
      </Section>

      {/* ---- Staff Readiness detail ---- */}
      <Section title="Staff Readiness">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Staff" value={data.staffReinforcementReadiness.totalStaff} />
          <Stat label="Positive Behaviour" value={`${data.staffReinforcementReadiness.positiveBehaviourRate}%`} />
          <Stat label="Therapeutic Care" value={`${data.staffReinforcementReadiness.therapeuticCareRate}%`} />
          <Stat label="De-escalation" value={`${data.staffReinforcementReadiness.deEscalationRate}%`} />
          <Stat label="Reward Design" value={`${data.staffReinforcementReadiness.rewardDesignRate}%`} />
          <Stat label="Trauma-Informed" value={`${data.staffReinforcementReadiness.traumaInformedRate}%`} />
          <Stat label="Consistency" value={`${data.staffReinforcementReadiness.consistencyRate}%`} />
        </div>
      </Section>

      {/* ---- Child Profiles ---- */}
      {data.childProfiles.length > 0 && (
        <Section title="Child Reinforcement Profiles">
          <div className="space-y-3">
            {data.childProfiles.map((cp) => (
              <div key={cp.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-gray-800">{cp.childName}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${trendColour(cp.behaviourTrend)}`}>
                      {ratingLabel(cp.behaviourTrend)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">{cp.overallScore}/10</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                  <span>Praise: {cp.totalPraise}</span>
                  <span>Rewards: {cp.totalRewards}</span>
                  <span>Positive Response: {cp.positiveResponseRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---- Strengths ---- */}
      {data.strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-800 flex gap-2">
                <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Areas for improvement ---- */}
      {data.areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement">
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-sm text-amber-800 flex gap-2">
                <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Actions ---- */}
      {data.actions.length > 0 && (
        <Section title="Actions" defaultOpen>
          <ul className="space-y-1">
            {data.actions.map((a, i) => (
              <li
                key={i}
                className={`text-sm flex gap-2 ${
                  a.startsWith("URGENT") ? "text-red-800 font-semibold" : "text-gray-700"
                }`}
              >
                <span
                  className={`shrink-0 mt-1 h-1.5 w-1.5 rounded-full ${
                    a.startsWith("URGENT") ? "bg-red-500" : "bg-gray-400"
                  }`}
                />
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Regulatory Links ---- */}
      <Section title="Regulatory Links">
        <ul className="space-y-1">
          {data.regulatoryLinks.map((l, i) => (
            <li key={i} className="text-sm text-gray-600 flex gap-2">
              <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
              {l}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
