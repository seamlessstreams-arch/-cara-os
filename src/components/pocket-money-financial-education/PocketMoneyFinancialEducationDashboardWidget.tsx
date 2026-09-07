// ==============================================================================
// PocketMoneyFinancialEducationDashboardWidget -- Financial education overview
// ==============================================================================

"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useEffect, useState } from "react";

// -- Local Interfaces (widget-only, no engine import in client) ---------------

interface TransactionQualityResult {
  overallScore: number;
  totalTransactions: number;
  childInvolvedRate: number;
  receiptKeptRate: number;
  documentedRate: number;
  childUnderstoodRate: number;
  savingsEncouragedRate: number;
}

interface FinancialEducationResult {
  overallScore: number;
  totalTransactions: number;
  uniqueTypeCount: number;
  typeRatio: number;
  supervisedRate: number;
  savingsEncouragedRate: number;
}

interface FinancialPolicyResult {
  overallScore: number;
  policyExists: boolean;
  pocketMoneyPolicy: boolean;
  savingsScheme: boolean;
  financialLiteracyProgramme: boolean;
  transactionRecording: boolean;
  budgetingGuidance: boolean;
  ageAppropriateAccess: boolean;
  regularReview: boolean;
}

interface StaffFinancialReadinessResult {
  overallScore: number;
  totalStaff: number;
  financialLiteracyRate: number;
  moneyManagementRate: number;
  safeguardingFinancesRate: number;
  budgetingSkillsRate: number;
  bankingAwarenessRate: number;
  fraudPreventionRate: number;
}

interface ChildFinancialProfile {
  childId: string;
  childName: string;
  transactionCount: number;
  involvementRate: number;
  understandingRate: number;
  uniqueTypes: number;
  overallScore: number;
}

interface IntelligenceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  transactionQuality: TransactionQualityResult;
  financialEducation: FinancialEducationResult;
  financialPolicy: FinancialPolicyResult;
  staffReadiness: StaffFinancialReadinessResult;
  childProfiles: ChildFinancialProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

function getScoreColour(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-50";
  if (score >= 50) return "bg-amber-50";
  return "bg-red-50";
}

function getRatingColour(rating: string): string {
  switch (rating) {
    case "outstanding": return "bg-green-100 text-green-800";
    case "good": return "bg-blue-100 text-blue-800";
    case "requires_improvement": return "bg-amber-100 text-amber-800";
    case "inadequate": return "bg-red-100 text-red-800";
    default: return "bg-slate-100 text-slate-800";
  }
}

function getRatingLabel(rating: string): string {
  const labels: Record<string, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] ?? rating;
}

// -- Component ----------------------------------------------------------------

export default function PocketMoneyFinancialEducationDashboardWidget() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pocket-money-financial-education")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch pocket money data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-64 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm">
          Error loading pocket money data: {error}
        </p>
      </div>
    );
  }

  const { transactionQuality, financialEducation, financialPolicy, staffReadiness, childProfiles } = data;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Pocket Money &amp; Financial Education
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Financial literacy, money management &amp; transaction quality
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getScoreColour(data.overallScore)}`}>
            {data.overallScore}
          </p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRatingColour(data.rating)}`}>
            {getRatingLabel(data.rating)}
          </span>
        </div>
      </div>

      {/* Four-Pillar Scores */}
      <Section title="Pillar Scores">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreBar
            label="Transaction Quality"
            score={transactionQuality.overallScore}
            max={25}
            sub={`${transactionQuality.totalTransactions} transactions`}
          />
          <ScoreBar
            label="Financial Education"
            score={financialEducation.overallScore}
            max={25}
            sub={`${financialEducation.uniqueTypeCount} types used`}
          />
          <ScoreBar
            label="Financial Policy"
            score={financialPolicy.overallScore}
            max={25}
            sub={financialPolicy.policyExists ? "Policy in place" : "No policy"}
          />
          <ScoreBar
            label="Staff Readiness"
            score={staffReadiness.overallScore}
            max={25}
            sub={`${staffReadiness.totalStaff} staff trained`}
          />
        </div>
      </Section>

      {/* Key Metrics */}
      <Section title="Key Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Child Involved" value={`${formatRate(transactionQuality.childInvolvedRate)}`} score={transactionQuality.childInvolvedRate} />
          <Stat label="Receipts Kept" value={`${transactionQuality.receiptKeptRate}%`} score={transactionQuality.receiptKeptRate} />
          <Stat label="Documented" value={`${formatRate(transactionQuality.documentedRate)}`} score={transactionQuality.documentedRate} />
          <Stat label="Supervised" value={`${formatRate(financialEducation.supervisedRate)}`} score={financialEducation.supervisedRate} />
        </div>
      </Section>

      {/* Understanding & Savings Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Child Understood" value={`${transactionQuality.childUnderstoodRate}%`} score={transactionQuality.childUnderstoodRate} />
        <Stat label="Savings Encouraged" value={`${transactionQuality.savingsEncouragedRate}%`} score={transactionQuality.savingsEncouragedRate} />
        <Stat label="Type Diversity" value={`${financialEducation.typeRatio}%`} score={financialEducation.typeRatio} />
      </div>

      {/* Child Profiles */}
      {childProfiles.length > 0 && (
        <Section title="Child Financial Profiles">
          <div className="space-y-2">
            {childProfiles.map((child) => (
              <div
                key={child.childId}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getScoreBg(child.overallScore * 10)} ${getScoreColour(child.overallScore * 10)}`}
                  >
                    {child.overallScore}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {child.childName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {child.transactionCount} txns &middot;{" "}
                      {child.uniqueTypes} types &middot;{" "}
                      {child.involvementRate}% involved
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                    {formatRate(child.understandingRate)} understood
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Policy Status */}
      {financialPolicy.policyExists && (
        <Section title="Policy Coverage">
          <div className="flex flex-wrap gap-2">
            <PolicyPill label="Pocket Money" active={financialPolicy.pocketMoneyPolicy} />
            <PolicyPill label="Savings Scheme" active={financialPolicy.savingsScheme} />
            <PolicyPill label="Financial Literacy" active={financialPolicy.financialLiteracyProgramme} />
            <PolicyPill label="Transaction Recording" active={financialPolicy.transactionRecording} />
            <PolicyPill label="Budgeting Guidance" active={financialPolicy.budgetingGuidance} />
            <PolicyPill label="Age-Appropriate Access" active={financialPolicy.ageAppropriateAccess} />
            <PolicyPill label="Regular Review" active={financialPolicy.regularReview} />
          </div>
        </Section>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">
            Strengths ({data.strengths.length})
          </h4>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li
                key={i}
                className="text-xs text-green-700 flex items-start gap-1.5"
              >
                <span className="mt-0.5 shrink-0">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas for Improvement */}
      {data.areasForImprovement.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">
            Areas for Improvement ({data.areasForImprovement.length})
          </h4>
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li
                key={i}
                className="text-xs text-amber-700 flex items-start gap-1.5"
              >
                <span className="mt-0.5 shrink-0">-</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {data.actions.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Required Actions ({data.actions.length})
          </h4>
          <ul className="space-y-1">
            {data.actions.map((a, i) => (
              <li
                key={i}
                className="text-xs text-red-700 flex items-start gap-1.5"
              >
                <span className="mt-0.5 shrink-0">!</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <Stat label="Transactions" value={String(transactionQuality.totalTransactions)} score={100} compact />
          <Stat label="Staff" value={String(staffReadiness.totalStaff)} score={100} compact />
          <Stat label="Types" value={String(financialEducation.uniqueTypeCount)} score={100} compact />
        </div>
        <span className="text-xs text-slate-400">
          Reg 10 &middot; NMS 11 &middot; ILACS
        </span>
      </div>
    </div>
  );
}

// -- Sub-components -----------------------------------------------------------

function ScoreBar({
  label,
  score,
  max,
  sub,
}: {
  label: string;
  score: number;
  max: number;
  sub: string;
}) {
  const pctScore = (score / max) * 100;
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${getScoreColour(pctScore)}`}>
        {score}/{max}
      </p>
      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
        <div
          className={`h-1.5 rounded-full ${
            pctScore >= 75
              ? "bg-green-500"
              : pctScore >= 50
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
          style={{ width: `${Math.min(pctScore, 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700 mb-3">{title}</h4>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  score,
  compact,
}: {
  label: string;
  value: string;
  score: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">{label}:</span>
        <span className="text-xs font-semibold text-slate-700">{value}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${getScoreColour(score)}`}>
        {value}
      </p>
    </div>
  );
}

function PolicyPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full border ${
        active
          ? "bg-green-50 text-green-800 border-green-100"
          : "bg-red-50 text-red-500 border-red-100"
      }`}
    >
      {label}
    </span>
  );
}
