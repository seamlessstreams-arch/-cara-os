// ==============================================================================
// ChildrenFundManagementDashboardWidget -- Financial management overview card
// ==============================================================================

"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useEffect, useState } from "react";

// -- Local Interfaces (widget-only, no engine import in client) ---------------

interface AccountManagementResult {
  overallScore: number;
  totalAccounts: number;
  activeRate: number;
  reconciledRate: number;
  childAccessRate: number;
  signedAgreementRate: number;
  overdueCount: number;
  averageBalance: number;
  totalSavings: number;
}

interface TransactionIntegrityResult {
  overallScore: number;
  totalTransactions: number;
  receiptRate: number;
  consentRate: number;
  twoSignatureRate: number;
  averageTransaction: number;
  typeDistribution: Record<string, number>;
}

interface FinancialLiteracyResult {
  overallScore: number;
  totalSessions: number;
  engagementRate: number;
  practicalRate: number;
  ageAppropriateRate: number;
  topicCoverage: number;
  topicDistribution: Record<string, number>;
}

interface AuditComplianceResult {
  overallScore: number;
  totalAudits: number;
  allReconciledRate: number;
  receiptCompliantRate: number;
  twoSigCompliantRate: number;
  discrepancyRate: number;
  policyCompliantRate: number;
}

interface ChildFinancialProfile {
  childId: string;
  childName: string;
  accountStatus: string;
  balance: number;
  savingsBalance: number;
  transactionCount: number;
  literacySessions: number;
  consentRate: number;
  overallScore: number;
}

interface IntelligenceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  accountManagement: AccountManagementResult;
  transactionIntegrity: TransactionIntegrityResult;
  financialLiteracy: FinancialLiteracyResult;
  auditCompliance: AuditComplianceResult;
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

function getAccountStatusColour(status: string): string {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "overdue_reconciliation": return "bg-red-100 text-red-800";
    case "dormant": return "bg-slate-100 text-slate-800";
    case "closed": return "bg-slate-200 text-slate-600";
    default: return "bg-slate-100 text-slate-800";
  }
}

function getAccountStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Active",
    overdue_reconciliation: "Overdue",
    dormant: "Dormant",
    closed: "Closed",
  };
  return labels[status] ?? status;
}

function getTopicLabel(topic: string): string {
  const labels: Record<string, string> = {
    budgeting: "Budgeting",
    saving: "Saving",
    banking: "Banking",
    spending_decisions: "Spending",
    value_of_money: "Value of Money",
    online_safety_financial: "Online Safety",
    benefits_entitlements: "Benefits",
    debt_awareness: "Debt Awareness",
  };
  return labels[topic] ?? topic;
}

function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

// -- Component ----------------------------------------------------------------

export function ChildrenFundManagementDashboardWidget() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/children-fund-management?homeId=home-oak&mode=dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch fund management data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-56 bg-slate-200 rounded mb-4" />
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
          Error loading fund management data: {error}
        </p>
      </div>
    );
  }

  const { accountManagement, transactionIntegrity, financialLiteracy, auditCompliance, childProfiles } = data;
  const activeChild = selectedChild
    ? childProfiles.find((p) => p.childId === selectedChild) ?? null
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Children&apos;s Fund Management
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Pocket money, savings, financial literacy & audit compliance
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Accounts"
          value={`${accountManagement.overallScore}/25`}
          sub={`${accountManagement.totalAccounts} accounts`}
          score={(accountManagement.overallScore / 25) * 100}
        />
        <MetricCard
          label="Transactions"
          value={`${transactionIntegrity.overallScore}/25`}
          sub={`${transactionIntegrity.totalTransactions} recorded`}
          score={(transactionIntegrity.overallScore / 25) * 100}
        />
        <MetricCard
          label="Financial Literacy"
          value={`${financialLiteracy.overallScore}/25`}
          sub={`${financialLiteracy.totalSessions} sessions`}
          score={(financialLiteracy.overallScore / 25) * 100}
        />
        <MetricCard
          label="Audit Compliance"
          value={`${auditCompliance.overallScore}/25`}
          sub={`${auditCompliance.totalAudits} audits`}
          score={(auditCompliance.overallScore / 25) * 100}
        />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Receipt Rate"
          value={`${formatRate(transactionIntegrity.receiptRate)}`}
          sub="receipts retained"
          score={transactionIntegrity.receiptRate}
        />
        <MetricCard
          label="Two Signatures"
          value={`${formatRate(transactionIntegrity.twoSignatureRate)}`}
          sub="dual authorisation"
          score={transactionIntegrity.twoSignatureRate}
        />
        <MetricCard
          label="Child Consent"
          value={`${formatRate(transactionIntegrity.consentRate)}`}
          sub="informed consent"
          score={transactionIntegrity.consentRate}
        />
        <MetricCard
          label="Topic Coverage"
          value={`${financialLiteracy.topicCoverage}%`}
          sub="literacy topics"
          score={financialLiteracy.topicCoverage}
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500">Avg Balance</p>
          <p className="text-lg font-semibold text-slate-800">
            {formatCurrency(accountManagement.averageBalance)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500">Total Savings</p>
          <p className="text-lg font-semibold text-slate-800">
            {formatCurrency(accountManagement.totalSavings)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500">Avg Transaction</p>
          <p className="text-lg font-semibold text-slate-800">
            {formatCurrency(transactionIntegrity.averageTransaction)}
          </p>
        </div>
      </div>

      {/* Child Profiles */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Child Financial Profiles</h4>
        <div className="space-y-2">
          {childProfiles.map((child) => (
            <button
              key={child.childId}
              onClick={() =>
                setSelectedChild(
                  selectedChild === child.childId ? null : child.childId,
                )
              }
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedChild === child.childId
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getScoreBg(child.overallScore * 10)} ${getScoreColour(child.overallScore * 10)}`}
                >
                  {child.overallScore}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">
                    {child.childName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(child.balance)} balance &middot;{" "}
                    {formatCurrency(child.savingsBalance)} savings &middot;{" "}
                    {child.transactionCount} txns
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${getAccountStatusColour(child.accountStatus)}`}
                >
                  {getAccountStatusLabel(child.accountStatus)}
                </span>
                {child.literacySessions > 0 && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                    {child.literacySessions} sessions
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Child Detail */}
      {activeChild && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-800">
            {activeChild.childName} -- Financial Detail
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded p-2 border border-slate-100">
              <p className="text-xs text-slate-500">Balance</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatCurrency(activeChild.balance)}
              </p>
            </div>
            <div className="bg-white rounded p-2 border border-slate-100">
              <p className="text-xs text-slate-500">Savings</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatCurrency(activeChild.savingsBalance)}
              </p>
            </div>
            <div className="bg-white rounded p-2 border border-slate-100">
              <p className="text-xs text-slate-500">Consent Rate</p>
              <p className={`text-sm font-semibold ${getScoreColour(activeChild.consentRate)}`}>
                {formatRate(activeChild.consentRate)}
              </p>
            </div>
            <div className="bg-white rounded p-2 border border-slate-100">
              <p className="text-xs text-slate-500">Score</p>
              <p className={`text-sm font-semibold ${getScoreColour(activeChild.overallScore * 10)}`}>
                {activeChild.overallScore}/10
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Topic Coverage Distribution */}
      {financialLiteracy.totalSessions > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">
            Literacy Topic Coverage
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(financialLiteracy.topicDistribution).map(
              ([topic, count]) => (
                <span
                  key={topic}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    count > 0
                      ? "bg-green-50 text-green-800 border-green-100"
                      : "bg-slate-50 text-slate-400 border-slate-100"
                  }`}
                >
                  {getTopicLabel(topic)}
                  {count > 0 && ` (${count})`}
                </span>
              ),
            )}
          </div>
        </div>
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
          <MiniStat
            label="Overdue"
            value={String(accountManagement.overdueCount)}
          />
          <MiniStat
            label="Accounts"
            value={String(accountManagement.totalAccounts)}
          />
          <MiniStat
            label="Signed"
            value={`${formatRate(accountManagement.signedAgreementRate)}`}
          />
        </div>
        <span className="text-xs text-slate-400">
          Reg 21 &middot; Reg 39 &middot; NMS 10
        </span>
      </div>
    </div>
  );
}

// -- Sub-components -----------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
  score,
}: {
  label: string;
  value: string;
  sub: string;
  score: number;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${getScoreColour(score)}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
