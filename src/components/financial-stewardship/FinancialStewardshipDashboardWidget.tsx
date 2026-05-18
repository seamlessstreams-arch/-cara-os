"use client";

import { useState, useEffect } from "react";
import type { FinancialStewardshipIntelligence } from "@/lib/financial-stewardship";

const ratingColors: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const ratingLabels: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

const literacyLabels: Record<string, string> = {
  not_started: "Not Started",
  emerging: "Emerging",
  developing: "Developing",
  competent: "Competent",
  independent: "Independent",
};

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}</span>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export function FinancialStewardshipDashboardWidget() {
  const [data, setData] = useState<FinancialStewardshipIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/financial-stewardship")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Financial Stewardship</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Financial Stewardship</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.allowanceManagement.regularPocketMoneyRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Pocket Money Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.savingsInvestment.savingsAccountRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Savings Accounts</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.financialLiteracy.assessmentRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Literacy Assessed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.auditCompliance.compliantStatus ? "text-green-600" : "text-amber-600"}`}>
            {data.auditCompliance.compliantStatus ? "Yes" : "No"}
          </div>
          <div className="text-xs text-gray-500 mt-1">Audit Compliant</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.allowanceManagement.overallScore} label="Allowance Management" maxScore={25} />
        <ScoreBar score={data.savingsInvestment.overallScore} label="Savings & Investment" maxScore={25} />
        <ScoreBar score={data.financialLiteracy.overallScore} label="Financial Literacy" maxScore={25} />
        <ScoreBar score={data.auditCompliance.overallScore} label="Audit Compliance" maxScore={25} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {data.childSummaries.length > 0 && (
          <Section title="Child Financial Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childSummaries.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.weeklyPocketMoney}/week</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <StatusBadge ok={child.savingsAccountInPlace} label="Savings Account" />
                    <StatusBadge ok={child.budgetPlanInPlace} label="Budget Plan" />
                    <StatusBadge ok={child.consentRate >= 90} label={`Consent ${child.consentRate}%`} />
                    <StatusBadge ok={child.currentBalance > 0} label={`Balance: ${child.currentBalance.toFixed(2)}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Literacy: <span className="font-medium capitalize">{literacyLabels[child.financialLiteracyLevel] || child.financialLiteracyLevel}</span></div>
                    <div>Account: <span className="font-medium capitalize">{child.accountType.replace(/_/g, " ")}</span></div>
                    <div>Saved: <span className="font-medium">{child.totalSaved.toFixed(2)}</span></div>
                    <div>Spent: <span className="font-medium">{child.totalSpent.toFixed(2)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Allowance Management">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Regular Pocket Money:</span> <span className="font-medium">{data.allowanceManagement.regularPocketMoneyRate}%</span></div>
            <div><span className="text-gray-500">Age Appropriate:</span> <span className="font-medium">{data.allowanceManagement.ageAppropriateRate}%</span></div>
            <div><span className="text-gray-500">Child Consent:</span> <span className="font-medium">{data.allowanceManagement.childConsentRate}%</span></div>
            <div><span className="text-gray-500">Receipts:</span> <span className="font-medium">{data.allowanceManagement.receiptRate}%</span></div>
            <div><span className="text-gray-500">Authorised:</span> <span className="font-medium">{data.allowanceManagement.authorisationRate}%</span></div>
            <div><span className="text-gray-500">Savings Encouraged:</span> <span className="font-medium">{data.allowanceManagement.savingsEncouraged ? "Yes" : "No"}</span></div>
          </div>
        </Section>

        <Section title="Savings & Investment">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Savings Accounts:</span> <span className="font-medium">{data.savingsInvestment.savingsAccountRate}%</span></div>
            <div><span className="text-gray-500">Positive Balance:</span> <span className="font-medium">{data.savingsInvestment.positiveBalanceRate}%</span></div>
            <div><span className="text-gray-500">Budget Plans:</span> <span className="font-medium">{data.savingsInvestment.budgetPlanRate}%</span></div>
            <div><span className="text-gray-500">Savings Growth:</span> <span className="font-medium">{data.savingsInvestment.savingsGrowthDetected ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Appropriate Accounts:</span> <span className="font-medium">{data.savingsInvestment.ageAppropriateAccountRate}%</span></div>
          </div>
        </Section>

        <Section title="Financial Literacy">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Assessed:</span> <span className="font-medium">{data.financialLiteracy.assessmentRate}%</span></div>
            <div><span className="text-gray-500">Competent+:</span> <span className="font-medium">{data.financialLiteracy.competentOrIndependentRate}%</span></div>
            <div><span className="text-gray-500">Developing+:</span> <span className="font-medium">{data.financialLiteracy.developingPlusRate}%</span></div>
            <div><span className="text-gray-500">Budget Plans:</span> <span className="font-medium">{data.financialLiteracy.budgetPlanRate}%</span></div>
            <div><span className="text-gray-500">Improvement Trend:</span> <span className="font-medium">{data.financialLiteracy.improvementTrendDetected ? "Yes" : "No"}</span></div>
          </div>
        </Section>

        <Section title="Audit Compliance">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Recent Audit:</span> <span className="font-medium">{data.auditCompliance.auditCompletedRecently ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Compliant:</span> <span className="font-medium">{data.auditCompliance.compliantStatus ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Discrepancies Resolved:</span> <span className="font-medium">{data.auditCompliance.discrepancyResolutionRate}%</span></div>
            <div><span className="text-gray-500">Actions Completed:</span> <span className="font-medium">{data.auditCompliance.recommendationsActionedRate}%</span></div>
            <div><span className="text-gray-500">Policy Current:</span> <span className="font-medium">{data.auditCompliance.policyCurrent ? "Yes" : "No"}</span></div>
            <div><span className="text-gray-500">Records Accurate:</span> <span className="font-medium">{data.auditCompliance.recordsAccurate ? "Yes" : "No"}</span></div>
          </div>
        </Section>

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

        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">§</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
