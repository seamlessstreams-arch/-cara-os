// ==============================================================================
// PocketMoneyFinancialLiteracyDashboardWidget -- Financial literacy overview
// ==============================================================================

"use client";

import { useEffect, useState } from "react";

// -- Local Interfaces (widget-only, no engine import in client) ---------------

interface PocketMoneyManagementResult {
  overallScore: number;
  totalRecords: number;
  receiptRecordingRate: number;
  childSignOffRate: number;
  savingsParticipationRate: number;
  consistentPayments: boolean;
}

interface SavingsEngagementResult {
  overallScore: number;
  totalAccounts: number;
  accountsPerChild: number;
  savingsGoalRate: number;
  monthlyDepositRegularity: number;
  balanceDiversity: boolean;
}

interface FinancialEducationResult {
  overallScore: number;
  totalSessions: number;
  topicVariety: number;
  engagementRate: number;
  resourcesProvidedRate: number;
  childrenReachedRate: number;
}

interface StaffFinancialReadinessResult {
  overallScore: number;
  totalStaff: number;
  policyTrainedRate: number;
  educationTrainedRate: number;
  budgetingSupportRate: number;
  safeguardingFinancialAbuseRate: number;
  recordKeepingRate: number;
}

interface ChildFinancialSummary {
  childId: string;
  childName: string;
  totalPocketMoney: number;
  totalSaved: number;
  savingsRate: number;
  receiptRate: number;
  signOffRate: number;
  hasSavingsAccount: boolean;
  overallScore: number;
}

interface IntelligenceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  pocketMoneyManagement: PocketMoneyManagementResult;
  savingsEngagement: SavingsEngagementResult;
  financialEducation: FinancialEducationResult;
  staffFinancialReadiness: StaffFinancialReadinessResult;
  childFinancialSummaries: ChildFinancialSummary[];
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

function getBarColour(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getRatingColour(rating: string): string {
  switch (rating) {
    case "outstanding":
      return "bg-green-100 text-green-800";
    case "good":
      return "bg-blue-100 text-blue-800";
    case "requires_improvement":
      return "bg-amber-100 text-amber-800";
    case "inadequate":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
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

function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

// -- Sub-components -----------------------------------------------------------

function ScoreBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const pctVal = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600">{label}</span>
        <span className={`text-xs font-semibold ${getScoreColour(pctVal)}`}>
          {score}/{max}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${getBarColour(pctVal)}`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-100 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors rounded-lg"
      >
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <span className="text-xs text-slate-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
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

// -- Main Component -----------------------------------------------------------

export default function PocketMoneyFinancialLiteracyDashboardWidget() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPocketMoney, setShowPocketMoney] = useState(false);
  const [showSavings, setShowSavings] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [showStrengths, setShowStrengths] = useState(false);
  const [showAreas, setShowAreas] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showRegulatory, setShowRegulatory] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pocket-money-financial-literacy")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch pocket money data");
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-64 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
          <div className="h-4 w-1/2 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm">
          Error loading pocket money data: {error}
        </p>
      </div>
    );
  }

  const {
    pocketMoneyManagement,
    savingsEngagement,
    financialEducation,
    staffFinancialReadiness,
    childFinancialSummaries,
  } = data;

  const activeChild = selectedChild
    ? childFinancialSummaries.find((c) => c.childId === selectedChild) ?? null
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header with score + rating badge */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Pocket Money &amp; Financial Literacy
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Savings, education, budgeting support &amp; staff readiness
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-bold ${getScoreColour(data.overallScore)}`}
          >
            {data.overallScore}
          </p>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRatingColour(data.rating)}`}
          >
            {getRatingLabel(data.rating)}
          </span>
        </div>
      </div>

      {/* 4 Score Bars */}
      <div className="space-y-3">
        <ScoreBar
          label="Pocket Money Management"
          score={pocketMoneyManagement.overallScore}
          max={25}
        />
        <ScoreBar
          label="Savings Engagement"
          score={savingsEngagement.overallScore}
          max={25}
        />
        <ScoreBar
          label="Financial Education"
          score={financialEducation.overallScore}
          max={25}
        />
        <ScoreBar
          label="Staff Financial Readiness"
          score={staffFinancialReadiness.overallScore}
          max={25}
        />
      </div>

      {/* Expandable Detail Sections */}
      <div className="space-y-2">
        {/* Pocket Money Management Detail */}
        <Section
          title={`Pocket Money Management (${pocketMoneyManagement.overallScore}/25)`}
          open={showPocketMoney}
          onToggle={() => setShowPocketMoney(!showPocketMoney)}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Records</p>
              <p className="text-sm font-semibold text-slate-800">
                {pocketMoneyManagement.totalRecords}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Receipts</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(pocketMoneyManagement.receiptRecordingRate)}`}
              >
                {pocketMoneyManagement.receiptRecordingRate}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Sign-Off</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(pocketMoneyManagement.childSignOffRate)}`}
              >
                {pocketMoneyManagement.childSignOffRate}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Savings</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(pocketMoneyManagement.savingsParticipationRate)}`}
              >
                {pocketMoneyManagement.savingsParticipationRate}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">Consistent Payments:</span>
            <span
              className={`text-xs font-semibold ${pocketMoneyManagement.consistentPayments ? "text-green-600" : "text-red-600"}`}
            >
              {pocketMoneyManagement.consistentPayments ? "Yes" : "No"}
            </span>
          </div>
        </Section>

        {/* Savings Engagement Detail */}
        <Section
          title={`Savings Engagement (${savingsEngagement.overallScore}/25)`}
          open={showSavings}
          onToggle={() => setShowSavings(!showSavings)}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Accounts</p>
              <p className="text-sm font-semibold text-slate-800">
                {savingsEngagement.totalAccounts}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Per Child</p>
              <p className="text-sm font-semibold text-slate-800">
                {savingsEngagement.accountsPerChild}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Goals Set</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(savingsEngagement.savingsGoalRate)}`}
              >
                {savingsEngagement.savingsGoalRate}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Monthly Deposits</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(savingsEngagement.monthlyDepositRegularity)}`}
              >
                {savingsEngagement.monthlyDepositRegularity}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">Balance Diversity:</span>
            <span
              className={`text-xs font-semibold ${savingsEngagement.balanceDiversity ? "text-green-600" : "text-red-600"}`}
            >
              {savingsEngagement.balanceDiversity ? "Yes" : "No"}
            </span>
          </div>
        </Section>

        {/* Financial Education Detail */}
        <Section
          title={`Financial Education (${financialEducation.overallScore}/25)`}
          open={showEducation}
          onToggle={() => setShowEducation(!showEducation)}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Sessions</p>
              <p className="text-sm font-semibold text-slate-800">
                {financialEducation.totalSessions}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Topic Variety</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(financialEducation.topicVariety)}`}
              >
                {financialEducation.topicVariety}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Engagement</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(financialEducation.engagementRate)}`}
              >
                {financialEducation.engagementRate}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Resources</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(financialEducation.resourcesProvidedRate)}`}
              >
                {financialEducation.resourcesProvidedRate}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">Children Reached:</span>
            <span
              className={`text-xs font-semibold ${getScoreColour(financialEducation.childrenReachedRate)}`}
            >
              {financialEducation.childrenReachedRate}%
            </span>
          </div>
        </Section>

        {/* Staff Financial Readiness Detail */}
        <Section
          title={`Staff Readiness (${staffFinancialReadiness.overallScore}/25)`}
          open={showStaff}
          onToggle={() => setShowStaff(!showStaff)}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Policy Trained</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(staffFinancialReadiness.policyTrainedRate)}`}
              >
                {staffFinancialReadiness.policyTrainedRate}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Education Trained</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(staffFinancialReadiness.educationTrainedRate)}`}
              >
                {staffFinancialReadiness.educationTrainedRate}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Budgeting Support</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(staffFinancialReadiness.budgetingSupportRate)}`}
              >
                {staffFinancialReadiness.budgetingSupportRate}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Safeguarding</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(staffFinancialReadiness.safeguardingFinancialAbuseRate)}`}
              >
                {staffFinancialReadiness.safeguardingFinancialAbuseRate}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Record Keeping</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(staffFinancialReadiness.recordKeepingRate)}`}
              >
                {staffFinancialReadiness.recordKeepingRate}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">Total Staff</p>
              <p className="text-sm font-semibold text-slate-800">
                {staffFinancialReadiness.totalStaff}
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* Child Profiles */}
      {childFinancialSummaries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            Child Financial Profiles
          </h4>
          <div className="space-y-2">
            {childFinancialSummaries.map((child) => (
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
                      {formatCurrency(child.totalPocketMoney)} received &middot;{" "}
                      {formatCurrency(child.totalSaved)} saved &middot;{" "}
                      {child.savingsRate}% saved
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {child.hasSavingsAccount && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                      Savings A/C
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${getScoreColour(child.receiptRate) === "text-green-600" ? "bg-green-50 text-green-700" : getScoreColour(child.receiptRate) === "text-amber-600" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}
                  >
                    {child.receiptRate}% receipts
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Child Detail */}
      {activeChild && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-800">
            {activeChild.childName} -- Financial Detail
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded p-2 border border-slate-100">
              <p className="text-xs text-slate-500">Total Received</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatCurrency(activeChild.totalPocketMoney)}
              </p>
            </div>
            <div className="bg-white rounded p-2 border border-slate-100">
              <p className="text-xs text-slate-500">Total Saved</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatCurrency(activeChild.totalSaved)}
              </p>
            </div>
            <div className="bg-white rounded p-2 border border-slate-100">
              <p className="text-xs text-slate-500">Savings Rate</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(activeChild.savingsRate)}`}
              >
                {activeChild.savingsRate}%
              </p>
            </div>
            <div className="bg-white rounded p-2 border border-slate-100">
              <p className="text-xs text-slate-500">Sign-Off Rate</p>
              <p
                className={`text-sm font-semibold ${getScoreColour(activeChild.signOffRate)}`}
              >
                {activeChild.signOffRate}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MiniStat label="Score" value={`${activeChild.overallScore}/10`} />
            <MiniStat
              label="Receipts"
              value={`${activeChild.receiptRate}%`}
            />
            <MiniStat
              label="Savings Account"
              value={activeChild.hasSavingsAccount ? "Yes" : "No"}
            />
          </div>
        </div>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <Section
          title={`Strengths (${data.strengths.length})`}
          open={showStrengths}
          onToggle={() => setShowStrengths(!showStrengths)}
        >
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
        </Section>
      )}

      {/* Areas for Improvement */}
      {data.areasForImprovement.length > 0 && (
        <Section
          title={`Areas for Improvement (${data.areasForImprovement.length})`}
          open={showAreas}
          onToggle={() => setShowAreas(!showAreas)}
        >
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
        </Section>
      )}

      {/* Actions */}
      {data.actions.length > 0 && (
        <Section
          title={`Required Actions (${data.actions.length})`}
          open={showActions}
          onToggle={() => setShowActions(!showActions)}
        >
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
        </Section>
      )}

      {/* Regulatory Links */}
      <Section
        title={`Regulatory Links (${data.regulatoryLinks.length})`}
        open={showRegulatory}
        onToggle={() => setShowRegulatory(!showRegulatory)}
      >
        <ul className="space-y-1">
          {data.regulatoryLinks.map((r, i) => (
            <li
              key={i}
              className="text-xs text-slate-600 flex items-start gap-1.5"
            >
              <span className="mt-0.5 shrink-0">&sect;</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <MiniStat
            label="Records"
            value={String(pocketMoneyManagement.totalRecords)}
          />
          <MiniStat
            label="Accounts"
            value={String(savingsEngagement.totalAccounts)}
          />
          <MiniStat
            label="Sessions"
            value={String(financialEducation.totalSessions)}
          />
        </div>
        <span className="text-xs text-slate-400">
          Reg 10 &middot; Reg 14 &middot; NMS 3
        </span>
      </div>
    </div>
  );
}
