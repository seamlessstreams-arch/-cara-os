"use client";

// ══════════════════════════════════════════════════════════════════════════════
// SAFEGUARDING EFFECTIVENESS DASHBOARD WIDGET
//
// Displays the 4-layer safeguarding effectiveness intelligence:
// - Overall score with Ofsted-aligned rating
// - Layer scores: referral quality, training, audits, supervision
// - Staff compliance profiles
// - Strengths, concerns, and immediate actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface ReferralQuality {
  totalReferrals: number;
  timelinessRate: number;
  appropriateThresholdRate: number;
  multiAgencyEngagementRate: number;
  childInformedRate: number;
  progressedRate: number;
  nfaRate: number;
  lessonsLearnedRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface TrainingCompliance {
  totalStaff: number;
  coverageRate: number;
  currencyRate: number;
  dslCount: number;
  dslRequired: number;
  dslCoverageRate: number;
  scenarioBasedRate: number;
  assessmentPassRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface AuditFindings {
  totalAudits: number;
  averageRating: number;
  improvementTrajectory: string;
  criticalFindingsCount: number;
  actionCompletionRate: number;
  ratingDistribution: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface Supervision {
  totalStaff: number;
  coverageRate: number;
  safeguardingDiscussionRate: number;
  reflectivePracticeRate: number;
  decisionsRecordedRate: number;
  actionCompletionRate: number;
  totalSessions: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffProfile {
  staffId: string;
  staffName: string;
  highestTrainingLevel: string | null;
  trainingCurrent: boolean;
  trainingExpiryDate: string | null;
  supervisionCount: number;
  lastSupervisionDate: string | null;
  safeguardingDiscussionRate: number;
  actionCompletionRate: number;
  overallCompliance: string;
}

interface SafeguardingData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  referralQuality: ReferralQuality;
  trainingCompliance: TrainingCompliance;
  auditFindings: AuditFindings;
  supervision: Supervision;
  staffProfiles: StaffProfile[];
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
  meta?: {
    referralSummary: { id: string; date: string; type: string; childName: string; outcome: string }[];
    ratingLabel: string;
  };
}

// ── Rating Badge ───────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const label =
    rating === "outstanding" ? "Outstanding"
      : rating === "good" ? "Good"
        : rating === "requires_improvement" ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Layer Score Card ───────────────────────────────────────────────────────

function LayerScoreCard({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  const color =
    pct >= 80 ? "text-green-700 bg-green-50 border-green-200"
      : pct >= 60 ? "text-blue-700 bg-blue-50 border-blue-200"
        : pct >= 40 ? "text-orange-700 bg-orange-50 border-orange-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{score}<span className="text-sm font-normal">/{max}</span></div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Compliance Gauge ───────────────────────────────────────────────────────

function ComplianceGauge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? "text-green-700 bg-green-100"
      : value >= 70 ? "text-yellow-700 bg-yellow-100"
        : "text-red-700 bg-red-100";

  return (
    <div className={`rounded-lg p-2.5 text-center ${color}`}>
      <div className="text-xl font-bold">{value}%</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Staff Compliance Row ───────────────────────────────────────────────────

function StaffComplianceRow({ profile }: { profile: StaffProfile }) {
  const complianceColors: Record<string, string> = {
    compliant: "bg-green-100 text-green-700",
    partially_compliant: "bg-yellow-100 text-yellow-700",
    non_compliant: "bg-red-100 text-red-700",
  };
  const complianceLabels: Record<string, string> = {
    compliant: "Compliant",
    partially_compliant: "Partial",
    non_compliant: "Non-compliant",
  };

  const trainingLevelLabels: Record<string, string> = {
    basic_awareness: "Basic",
    level_1: "L1",
    level_2: "L2",
    level_3_dsl: "DSL",
    specialist: "Specialist",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{profile.staffName}</span>
          {profile.highestTrainingLevel && (
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {trainingLevelLabels[profile.highestTrainingLevel] ?? profile.highestTrainingLevel}
            </span>
          )}
        </div>
        <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
          <span>Training: {profile.trainingCurrent ? "Current" : "Expired"}</span>
          <span>Supervisions: {profile.supervisionCount}</span>
          {profile.lastSupervisionDate && (
            <span>Last: {profile.lastSupervisionDate}</span>
          )}
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${complianceColors[profile.overallCompliance] ?? "bg-gray-100 text-gray-600"}`}>
        {complianceLabels[profile.overallCompliance] ?? profile.overallCompliance}
      </span>
    </div>
  );
}

// ── Trajectory Badge ───────────────────────────────────────────────────────

function TrajectoryBadge({ trajectory }: { trajectory: string }) {
  const config: Record<string, { color: string; label: string }> = {
    improving: { color: "bg-green-100 text-green-700", label: "Improving" },
    stable: { color: "bg-blue-100 text-blue-700", label: "Stable" },
    declining: { color: "bg-red-100 text-red-700", label: "Declining" },
    insufficient_data: { color: "bg-gray-100 text-gray-600", label: "Insufficient Data" },
  };
  const { color, label } = config[trajectory] ?? config.insufficient_data;

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>{label}</span>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function SafeguardingEffectivenessDashboardWidget() {
  const [data, setData] = useState<SafeguardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"referrals" | "training" | "audits" | "supervision" | "staff">("referrals");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/safeguarding-effectiveness");
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

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Safeguarding Effectiveness</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Safeguarding Effectiveness
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.referralQuality.totalReferrals} referrals | {data.trainingCompliance.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Layer Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <LayerScoreCard label="Referral Quality" score={data.referralQuality.score} max={25} />
        <LayerScoreCard label="Training" score={data.trainingCompliance.score} max={25} />
        <LayerScoreCard label="Audit Findings" score={data.auditFindings.score} max={25} />
        <LayerScoreCard label="Supervision" score={data.supervision.score} max={25} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <ComplianceGauge label="Referral Timeliness" value={data.referralQuality.timelinessRate} />
        <ComplianceGauge label="Threshold Accuracy" value={data.referralQuality.appropriateThresholdRate} />
        <ComplianceGauge label="Training Coverage" value={data.trainingCompliance.coverageRate} />
        <ComplianceGauge label="Audit Actions" value={data.auditFindings.actionCompletionRate} />
        <ComplianceGauge label="SG Discussion" value={data.supervision.safeguardingDiscussionRate} />
        <ComplianceGauge label="Reflective Practice" value={data.supervision.reflectivePracticeRate} />
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Urgent Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.slice(0, 4).map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("IMMEDIATE") ? "●" : action.startsWith("URGENT") ? "○" : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable Detail Tabs */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed breakdown"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-gray-200">
            {([
              ["referrals", "Referrals"],
              ["training", "Training"],
              ["audits", "Audits"],
              ["supervision", "Supervision"],
              ["staff", "Staff Profiles"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === key
                    ? "bg-white border border-b-white border-gray-200 text-gray-900 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Referrals Tab */}
          {activeTab === "referrals" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Timeliness" value={data.referralQuality.timelinessRate} />
                <ComplianceGauge label="Threshold" value={data.referralQuality.appropriateThresholdRate} />
                <ComplianceGauge label="Multi-Agency" value={data.referralQuality.multiAgencyEngagementRate} />
                <ComplianceGauge label="Child Informed" value={data.referralQuality.childInformedRate} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.referralQuality.totalReferrals}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-700">{data.referralQuality.progressedRate}%</div>
                  <div className="text-[10px] text-gray-500 uppercase">Progressed</div>
                </div>
                <div className="p-2 bg-yellow-50 rounded">
                  <div className="text-lg font-bold text-yellow-700">{data.referralQuality.nfaRate}%</div>
                  <div className="text-[10px] text-gray-500 uppercase">NFA Rate</div>
                </div>
              </div>
              {data.meta?.referralSummary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  {data.meta.referralSummary.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{r.type}</span>
                        <span className="text-xs text-gray-400">({r.childName})</span>
                        <span className="text-xs text-gray-400">{r.date}</span>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">{r.outcome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Training Tab */}
          {activeTab === "training" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Coverage" value={data.trainingCompliance.coverageRate} />
                <ComplianceGauge label="Currency" value={data.trainingCompliance.currencyRate} />
                <ComplianceGauge label="Scenario-Based" value={data.trainingCompliance.scenarioBasedRate} />
                <ComplianceGauge label="Assessment Pass" value={data.trainingCompliance.assessmentPassRate} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">
                    {data.trainingCompliance.dslCount}/{data.trainingCompliance.dslRequired}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">DSL Trained</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.trainingCompliance.totalStaff}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total Staff</div>
                </div>
              </div>
            </div>
          )}

          {/* Audits Tab */}
          {activeTab === "audits" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{data.auditFindings.averageRating}</div>
                    <div className="text-[10px] text-gray-500">Avg Rating /4.0</div>
                  </div>
                  <TrajectoryBadge trajectory={data.auditFindings.improvementTrajectory} />
                </div>
                <ComplianceGauge label="Action Completion" value={data.auditFindings.actionCompletionRate} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {(["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => {
                  const colors: Record<string, string> = {
                    outstanding: "bg-green-50 text-green-700",
                    good: "bg-blue-50 text-blue-700",
                    requires_improvement: "bg-orange-50 text-orange-700",
                    inadequate: "bg-red-50 text-red-700",
                  };
                  const labels: Record<string, string> = {
                    outstanding: "Outstanding",
                    good: "Good",
                    requires_improvement: "RI",
                    inadequate: "Inadequate",
                  };
                  return (
                    <div key={r} className={`p-2 rounded ${colors[r]}`}>
                      <div className="text-lg font-bold">{data.auditFindings.ratingDistribution[r] ?? 0}</div>
                      <div className="text-[10px] uppercase">{labels[r]}</div>
                    </div>
                  );
                })}
              </div>
              {data.auditFindings.criticalFindingsCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <span className="text-xs text-red-700 font-medium">
                    {data.auditFindings.criticalFindingsCount} critical finding(s) requiring urgent attention
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Supervision Tab */}
          {activeTab === "supervision" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Coverage" value={data.supervision.coverageRate} />
                <ComplianceGauge label="SG Discussed" value={data.supervision.safeguardingDiscussionRate} />
                <ComplianceGauge label="Reflective" value={data.supervision.reflectivePracticeRate} />
                <ComplianceGauge label="Actions Done" value={data.supervision.actionCompletionRate} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.supervision.totalSessions}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Sessions</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.supervision.decisionsRecordedRate}%</div>
                  <div className="text-[10px] text-gray-500 uppercase">Decisions Recorded</div>
                </div>
              </div>
            </div>
          )}

          {/* Staff Profiles Tab */}
          {activeTab === "staff" && (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.staffProfiles.map((profile) => (
                <StaffComplianceRow key={profile.staffId} profile={profile} />
              ))}
            </div>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">+ {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {data.concerns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas of Concern</h4>
              <ul className="space-y-1">
                {data.concerns.map((c, i) => (
                  <li key={i} className="text-xs text-orange-700">- {c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory References</h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
