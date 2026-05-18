"use client";

import { useState, useEffect } from "react";
import type { DataProtectionIntelligence } from "@/lib/data-protection";

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

export function DataProtectionDashboardWidget() {
  const [data, setData] = useState<DataProtectionIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/data-protection")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((json) => setData(json.data))
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
        <h3 className="text-lg font-semibold text-red-800">Data Protection &amp; GDPR</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Data Protection &amp; GDPR</h3>
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
          <div className={`text-2xl font-bold ${data.breachManagement.totalBreaches === 0 ? "text-green-600" : "text-amber-600"}`}>
            {data.breachManagement.totalBreaches}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Breaches</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.consentCompliance.consentObtainedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Consent Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.sarCompliance.overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>
            {data.sarCompliance.completedWithin30DaysRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">SAR Compliance</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.governancePractice.staffTrainingCompliance}%</div>
          <div className="text-xs text-gray-500 mt-1">Staff Training %</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.breachManagement.overallScore} label="Breach Management" maxScore={25} />
        <ScoreBar score={data.consentCompliance.overallScore} label="Consent Compliance" maxScore={25} />
        <ScoreBar score={data.sarCompliance.overallScore} label="SAR Compliance" maxScore={25} />
        <ScoreBar score={data.governancePractice.overallScore} label="Governance Practice" maxScore={25} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Breach Management" defaultOpen>
          {data.breachManagement.totalBreaches === 0 ? (
            <p className="text-sm text-green-700">No data breaches recorded during this period.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.breachManagement.totalBreaches}</span></div>
                <div><span className="text-gray-500">Critical:</span> <span className={`font-medium ${data.breachManagement.criticalBreaches > 0 ? "text-red-600" : "text-gray-900"}`}>{data.breachManagement.criticalBreaches}</span></div>
                <div><span className="text-gray-500">High:</span> <span className={`font-medium ${data.breachManagement.highBreaches > 0 ? "text-amber-600" : "text-gray-900"}`}>{data.breachManagement.highBreaches}</span></div>
                <div><span className="text-gray-500">Medium/Low:</span> <span className="font-medium">{data.breachManagement.mediumBreaches + data.breachManagement.lowBreaches}</span></div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge ok={data.breachManagement.icoNotificationWithin72HoursRate === 100} label={`ICO 72h ${data.breachManagement.icoNotificationWithin72HoursRate}%`} />
                <StatusBadge ok={data.breachManagement.containmentRate === 100} label={`Contained ${data.breachManagement.containmentRate}%`} />
                <StatusBadge ok={data.breachManagement.rootCauseRate === 100} label={`Root Cause ${data.breachManagement.rootCauseRate}%`} />
                <StatusBadge ok={data.breachManagement.resolutionRate === 100} label={`Resolved ${data.breachManagement.resolutionRate}%`} />
              </div>
              <div className="text-sm text-gray-600">
                <span className="text-gray-500">Affected:</span> {data.breachManagement.childrenAffectedTotal} children, {data.breachManagement.staffAffectedTotal} staff
              </div>
            </div>
          )}
        </Section>

        <Section title="Consent Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Records:</span> <span className="font-medium">{data.consentCompliance.totalRecords}</span></div>
            <div><span className="text-gray-500">Children:</span> <span className="font-medium">{data.consentCompliance.uniqueChildren}</span></div>
            <div><span className="text-gray-500">Obtained:</span> <span className="font-medium">{data.consentCompliance.consentObtainedRate}%</span></div>
            <div><span className="text-gray-500">Age Explained:</span> <span className="font-medium">{data.consentCompliance.ageAppropriateExplainedRate}%</span></div>
            <div><span className="text-gray-500">Review Current:</span> <span className="font-medium">{data.consentCompliance.reviewDateCurrentRate}%</span></div>
            <div><span className="text-gray-500">Avg Types/Child:</span> <span className="font-medium">{data.consentCompliance.averageTypesPerChild}</span></div>
            <div><span className="text-gray-500">Expired:</span> <span className={`font-medium ${data.consentCompliance.expiredConsentCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.consentCompliance.expiredConsentCount}</span></div>
          </div>
          {Object.keys(data.consentCompliance.consentByType).length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.consentCompliance.consentByType).map(([type, counts]) => (
                  <span key={type} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                    {type.replace(/_/g, " ")}: {counts.given}G / {counts.refused}R
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="SAR Handling">
          {data.sarCompliance.totalRequests === 0 ? (
            <p className="text-sm text-gray-600">No subject access requests during this period.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.sarCompliance.totalRequests}</span></div>
                <div><span className="text-gray-500">Ack {"<"}5 days:</span> <span className="font-medium">{data.sarCompliance.acknowledgedWithin5DaysRate}%</span></div>
                <div><span className="text-gray-500">Done {"<"}30 days:</span> <span className="font-medium">{data.sarCompliance.completedWithin30DaysRate}%</span></div>
                <div><span className="text-gray-500">Overdue:</span> <span className={`font-medium ${data.sarCompliance.overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.sarCompliance.overdueCount}</span></div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge ok={data.sarCompliance.redactionCompletedRate === 100} label={`Redacted ${data.sarCompliance.redactionCompletedRate}%`} />
                <StatusBadge ok={data.sarCompliance.qualityCheckedRate === 100} label={`QA Checked ${data.sarCompliance.qualityCheckedRate}%`} />
              </div>
            </div>
          )}
        </Section>

        <Section title="Governance Practice">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <StatusBadge ok={data.governancePractice.dpoAppointed} label="DPO Appointed" />
            <StatusBadge ok={data.governancePractice.dpiaCompleted} label="DPIA Completed" />
            <StatusBadge ok={data.governancePractice.retentionScheduleInPlace} label="Retention Schedule" />
            <StatusBadge ok={data.governancePractice.privacyNoticesUpToDate} label="Privacy Notices" />
            <StatusBadge ok={data.governancePractice.auditWithin12Months} label="Audit Current" />
            <StatusBadge ok={data.governancePractice.dataProcessingRegisterMaintained} label="Processing Register" />
            <StatusBadge ok={data.governancePractice.thirdPartyAgreementsReviewed} label="3rd Party Agreements" />
          </div>
          <div className="text-sm text-gray-600">
            <span className="text-gray-500">Staff Training:</span>{" "}
            <span className={`font-medium ${data.governancePractice.staffTrainingCompliance >= 90 ? "text-green-600" : "text-amber-600"}`}>
              {data.governancePractice.staffTrainingCompliance}%
            </span>
          </div>
        </Section>

        <Section title="Strengths, Areas &amp; Actions">
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
