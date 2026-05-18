"use client";

import React, { useEffect, useState } from "react";
import type { StaffTrainingResult, StaffTrainingProfile, TrainingCategory } from "@/lib/staff-training/staff-training-engine";
import { getCategoryLabel, getRoleLabel } from "@/lib/staff-training/staff-training-engine";

// ── Rating Badge ─────────────────────────────────────────────────────────────

function RatingBadge({ rating, score }: { rating: string; score: number }) {
  const colorMap: Record<string, string> = {
    outstanding: "bg-green-100 text-green-800 border-green-300",
    good: "bg-blue-100 text-blue-800 border-blue-300",
    requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
    inadequate: "bg-red-100 text-red-800 border-red-300",
  };
  const labelMap: Record<string, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${colorMap[rating] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}>
      {labelMap[rating] ?? rating} — {score}/100
    </span>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, suffix, color }: { label: string; value: number | string; suffix?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}{suffix}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">{pctVal}%</span>
    </div>
  );
}

// ── Readiness Badge ──────────────────────────────────────────────────────────

function ReadinessBadge({ readiness }: { readiness: string }) {
  const map: Record<string, string> = {
    excellent: "bg-green-100 text-green-700 border-green-200",
    good: "bg-blue-100 text-blue-700 border-blue-200",
    attention_needed: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-red-100 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    excellent: "EXCELLENT",
    good: "GOOD",
    attention_needed: "NEEDS ATTENTION",
    critical: "CRITICAL",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[readiness] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[readiness] ?? readiness}
    </span>
  );
}

// ── Staff Profile Card ───────────────────────────────────────────────────────

function StaffCard({ profile }: { profile: StaffTrainingProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{profile.staffName}</h4>
          <span className="text-xs text-gray-500">{getRoleLabel(profile.role)}</span>
        </div>
        <ReadinessBadge readiness={profile.overallReadiness} />
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Mandatory Training</span>
            <span>{profile.mandatoryComplianceRate}%</span>
          </div>
          <ProgressBar value={profile.mandatoryComplianceRate} max={100} color="bg-blue-500" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.totalCourses}</span>
            <p className="text-xs text-gray-500">Courses</p>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.totalHours}</span>
            <p className="text-xs text-gray-500">CPD Hours</p>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{profile.specialistTrainingCount}</span>
            <p className="text-xs text-gray-500">Specialist</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-2">
          {profile.certificationsExpired > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium border border-red-200">
              {profile.certificationsExpired} EXPIRED
            </span>
          )}
          {profile.certificationsExpiringSoon > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium border border-amber-200">
              {profile.certificationsExpiringSoon} EXPIRING SOON
            </span>
          )}
          {profile.certificationsExpired === 0 && profile.certificationsExpiringSoon === 0 && profile.certificationsValid > 0 && (
            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium border border-green-200">
              ALL CERTS VALID
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mandatory Compliance Grid ────────────────────────────────────────────────

function MandatoryGrid({ compliance }: { compliance: StaffTrainingResult["mandatoryCompliance"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-2 text-gray-600">Staff</th>
            {compliance.mandatoryCategories.map((cat) => (
              <th key={cat} className="py-2 px-1 text-center text-gray-600 whitespace-nowrap">
                {getCategoryLabel(cat).split(" ")[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {compliance.staffCompliance.map((sc) => (
            <tr key={sc.staffId} className="border-b border-gray-100">
              <td className="py-2 pr-2 font-medium text-gray-700">{sc.staffName.split(" ")[0]}</td>
              {compliance.mandatoryCategories.map((cat) => (
                <td key={cat} className="py-2 px-1 text-center">
                  {sc.completedCategories.includes(cat) ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function StaffTrainingDashboardWidget() {
  const [data, setData] = useState<StaffTrainingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/staff-training")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-48 rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-800">Staff Training Intelligence</h3>
        <p className="mt-2 text-sm text-red-600">Failed to load: {error}</p>
      </div>
    );
  }

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            🎓 Staff Training & CPD Compliance
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 32/33
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Mandatory Compliance"
          value={data.mandatoryCompliance.overallComplianceRate}
          suffix="%"
          color={data.mandatoryCompliance.overallComplianceRate >= 95 ? "text-green-600" : data.mandatoryCompliance.overallComplianceRate >= 80 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Certifications Valid"
          value={data.certifications.validityRate}
          suffix="%"
          color={data.certifications.validityRate >= 100 ? "text-green-600" : data.certifications.validityRate >= 80 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="CPD Target Met"
          value={data.cpd.targetMetRate}
          suffix="%"
          color={data.cpd.targetMetRate >= 80 ? "text-green-600" : data.cpd.targetMetRate >= 60 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Qualifications Met"
          value={data.qualifications.qualificationComplianceRate}
          suffix="%"
          color={data.qualifications.qualificationComplianceRate >= 100 ? "text-green-600" : "text-amber-600"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Active Staff" value={data.mandatoryCompliance.totalStaff} />
        <MetricCard label="Avg CPD Hours" value={data.cpd.averageHours} suffix="h" />
        <MetricCard
          label="Needs Covered"
          value={data.specialistTraining.coverageRate}
          suffix="%"
          color={data.specialistTraining.coverageRate >= 80 ? "text-green-600" : data.specialistTraining.coverageRate >= 60 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard label="Certifications" value={data.certifications.totalCertifications} />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.certifications.expired > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            ⚠️ {data.certifications.expired} EXPIRED CERT{data.certifications.expired !== 1 ? "S" : ""}
          </span>
        )}
        {data.certifications.expiringSoon > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            ⏳ {data.certifications.expiringSoon} EXPIRING SOON
          </span>
        )}
        {data.specialistTraining.uncoveredNeeds > 0 && (
          <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-medium border border-orange-200">
            📋 {data.specialistTraining.uncoveredNeeds} UNCOVERED NEED{data.specialistTraining.uncoveredNeeds !== 1 ? "S" : ""}
          </span>
        )}
        {data.mandatoryCompliance.overallComplianceRate >= 95 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ✅ STRONG MANDATORY COMPLIANCE
          </span>
        )}
        {data.certifications.expired === 0 && data.certifications.totalCertifications > 0 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            📜 ALL CERTS CURRENT
          </span>
        )}
      </div>

      {/* Staff Profiles */}
      <div className="mb-5">
        <button
          onClick={() => toggle("staff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "staff" ? "rotate-90" : ""}`}>▶</span>
          Staff Training Profiles ({data.staffProfiles.length})
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.staffProfiles.map((profile) => (
              <StaffCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* Mandatory Compliance Matrix */}
      <div className="mb-5">
        <button
          onClick={() => toggle("mandatory")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "mandatory" ? "rotate-90" : ""}`}>▶</span>
          Mandatory Training Matrix
        </button>
        {expandedSection === "mandatory" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <MandatoryGrid compliance={data.mandatoryCompliance} />
          </div>
        )}
      </div>

      {/* Certification Expiry */}
      {(data.certifications.expiringDetails.length > 0 || data.certifications.expiredDetails.length > 0) && (
        <div className="mb-5">
          <button
            onClick={() => toggle("certs")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className={`transform transition-transform ${expandedSection === "certs" ? "rotate-90" : ""}`}>▶</span>
            Certification Alerts
          </button>
          {expandedSection === "certs" && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              {data.certifications.expiredDetails.map((e, i) => (
                <div key={`exp-${i}`} className="flex justify-between items-center py-1 border-b border-gray-100">
                  <div>
                    <span className="text-sm font-medium text-red-700">{e.staffName}</span>
                    <span className="text-xs text-gray-500 ml-2">{getCategoryLabel(e.category)}</span>
                  </div>
                  <span className="text-xs text-red-600 font-medium">
                    Expired {e.daysSinceExpiry}d ago
                  </span>
                </div>
              ))}
              {data.certifications.expiringDetails.map((e, i) => (
                <div key={`expiring-${i}`} className="flex justify-between items-center py-1 border-b border-gray-100">
                  <div>
                    <span className="text-sm font-medium text-amber-700">{e.staffName}</span>
                    <span className="text-xs text-gray-500 ml-2">{getCategoryLabel(e.category)}</span>
                  </div>
                  <span className="text-xs text-amber-600 font-medium">
                    Expires in {e.daysUntilExpiry}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Specialist Training / Child Needs Coverage */}
      <div className="mb-5">
        <button
          onClick={() => toggle("specialist")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "specialist" ? "rotate-90" : ""}`}>▶</span>
          Specialist Training — Child Needs Coverage
        </button>
        {expandedSection === "specialist" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-2">
            {data.specialistTraining.needsCoverage.map((nc, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${nc.isCovered ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm text-gray-700">{nc.childName} — {nc.need.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{getCategoryLabel(nc.requiredTraining)}</span>
                  <span className={`text-xs font-medium ${nc.isCovered ? "text-green-600" : "text-red-600"}`}>
                    {nc.trainedStaffCount} staff
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CPD Overview */}
      <div className="mb-5">
        <button
          onClick={() => toggle("cpd")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "cpd" ? "rotate-90" : ""}`}>▶</span>
          CPD Hours by Staff
        </button>
        {expandedSection === "cpd" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            {data.cpd.staffCpd.map((sc) => (
              <div key={sc.staffId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{sc.staffName}</span>
                  <span className={`text-xs font-medium ${sc.targetMet ? "text-green-600" : "text-amber-600"}`}>
                    {sc.hoursCompleted}/{data.cpd.targetHoursPerYear}h · {sc.coursesCompleted} courses
                  </span>
                </div>
                <ProgressBar value={sc.hoursCompleted} max={data.cpd.targetHoursPerYear} color={sc.targetMet ? "bg-green-500" : "bg-amber-500"} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strengths / Areas / Actions */}
      <div className="space-y-4 mb-5">
        {data.immediateActions.length > 0 && !data.immediateActions[0].includes("No immediate") && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ Immediate Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.map((action, i) => (
                <li key={i} className="text-sm text-red-700">• {action}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">💪 Strengths</h4>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-700">• {s}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">📈 Areas for Development</h4>
          <ul className="space-y-1">
            {data.areasForDevelopment.map((a, i) => (
              <li key={i} className="text-sm text-amber-700">• {a}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Regulatory Links */}
      <div>
        <button
          onClick={() => toggle("regulatory")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "regulatory" ? "rotate-90" : ""}`}>▶</span>
          Regulatory Framework
        </button>
        {expandedSection === "regulatory" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">📜 {link}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
