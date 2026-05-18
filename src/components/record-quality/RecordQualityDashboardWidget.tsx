"use client";

import React, { useEffect, useState } from "react";
import type { RecordQualityResult, RecordType, StaffRecordProfile } from "@/lib/record-quality/record-quality-engine";
import { getRecordTypeLabel, getTimescaleHours } from "@/lib/record-quality/record-quality-engine";

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
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">{pct}%</span>
    </div>
  );
}

// ── Staff Profile Card ───────────────────────────────────────────────────────

function StaffProfileCard({ profile }: { profile: StaffRecordProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{profile.staffName}</h4>
        <span className="text-sm text-gray-500">{profile.totalRecords} records</span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Field Completion</span>
            <span>{profile.averageFieldCompletion}%</span>
          </div>
          <ProgressBar value={profile.averageFieldCompletion} max={100} color="bg-blue-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Sign-Off Rate</span>
            <span>{profile.signOffRate}%</span>
          </div>
          <ProgressBar value={profile.signOffRate} max={100} color="bg-green-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Cross-Referencing</span>
            <span>{profile.crossReferenceRate}%</span>
          </div>
          <ProgressBar value={profile.crossReferenceRate} max={100} color="bg-purple-500" />
        </div>
        <div className="flex justify-between text-xs text-gray-500 pt-1 border-t">
          <span>Avg Words: {profile.averageWordCount}</span>
          <span>Avg Timeliness: {profile.averageTimeliness}h</span>
        </div>
      </div>
    </div>
  );
}

// ── Type Breakdown Row ───────────────────────────────────────────────────────

function TypeRow({ recordType, count, detail }: { recordType: RecordType; count: number; detail: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{getRecordTypeLabel(recordType)}</span>
        <span className="text-xs text-gray-400">({count})</span>
      </div>
      <span className="text-xs text-gray-500">{detail}</span>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function RecordQualityDashboardWidget() {
  const [data, setData] = useState<RecordQualityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/record-quality")
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
        <h3 className="font-semibold text-red-800">Record Quality Intelligence</h3>
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
            📋 Record Quality & Timeliness
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 36 · Schedule 3
          </p>
        </div>
        <RatingBadge rating={data.rating} score={data.overallScore} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Completion Rate"
          value={data.completion.completionRate}
          suffix="%"
          color={data.completion.completionRate >= 95 ? "text-green-600" : data.completion.completionRate >= 80 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="On Time"
          value={data.timeliness.timelinessRate}
          suffix="%"
          color={data.timeliness.timelinessRate >= 90 ? "text-green-600" : data.timeliness.timelinessRate >= 70 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Sign-Off Rate"
          value={data.signOff.signOffRate}
          suffix="%"
          color={data.signOff.signOffRate >= 90 ? "text-green-600" : data.signOff.signOffRate >= 75 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Field Completion"
          value={data.quality.averageFieldCompletion}
          suffix="%"
          color={data.quality.averageFieldCompletion >= 95 ? "text-green-600" : data.quality.averageFieldCompletion >= 85 ? "text-amber-600" : "text-red-600"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Total Records" value={data.timeliness.totalRecords} />
        <MetricCard label="Expected" value={data.completion.totalExpected} />
        <MetricCard label="Avg Words" value={data.quality.averageWordCount} />
        <MetricCard
          label="Cross-Referenced"
          value={data.crossReferencing.crossReferenceRate}
          suffix="%"
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.signOff.pendingSignOff > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            ⏳ {data.signOff.pendingSignOff} PENDING SIGN-OFF
          </span>
        )}
        {data.signOff.queriedRecords > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            ❓ {data.signOff.queriedRecords} QUERIED
          </span>
        )}
        {data.quality.recordsBelowMinWords > 0 && (
          <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-medium border border-orange-200">
            ✏️ {data.quality.recordsBelowMinWords} BELOW MIN WORDS
          </span>
        )}
        {data.completion.missingByType.length > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            📑 {data.completion.missingByType.reduce((s, t) => s + t.missing, 0)} MISSING RECORDS
          </span>
        )}
        {data.crossReferencing.incidentsWithoutDailyLog > 0 && (
          <span className="rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium border border-purple-200">
            🔗 {data.crossReferencing.incidentsWithoutDailyLog} INCIDENTS UNLINKED
          </span>
        )}
        {data.timeliness.timelinessRate >= 95 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ⚡ EXCELLENT TIMELINESS
          </span>
        )}
        {data.signOff.signOffRate >= 90 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            ✅ STRONG OVERSIGHT
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
          Staff Record Profiles ({data.staffProfiles.length})
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.staffProfiles.map((profile) => (
              <StaffProfileCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* Quality Breakdown by Type */}
      <div className="mb-5">
        <button
          onClick={() => toggle("quality")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "quality" ? "rotate-90" : ""}`}>▶</span>
          Quality Breakdown by Record Type
        </button>
        {expandedSection === "quality" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            {data.quality.typeBreakdown.map((tb) => (
              <TypeRow
                key={tb.recordType}
                recordType={tb.recordType}
                count={tb.count}
                detail={`${tb.avgFieldCompletion}% fields · ${tb.avgWordCount} avg words · ${getTimescaleHours(tb.recordType)}h timescale`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sign-Off Breakdown */}
      <div className="mb-5">
        <button
          onClick={() => toggle("signoff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "signoff" ? "rotate-90" : ""}`}>▶</span>
          Sign-Off Breakdown
        </button>
        {expandedSection === "signoff" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            {data.signOff.typeBreakdown.map((tb) => (
              <TypeRow
                key={tb.recordType}
                recordType={tb.recordType}
                count={tb.total}
                detail={`${tb.signedOff}/${tb.total} signed off`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cross-Referencing */}
      <div className="mb-5">
        <button
          onClick={() => toggle("crossref")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "crossref" ? "rotate-90" : ""}`}>▶</span>
          Cross-Referencing Audit
        </button>
        {expandedSection === "crossref" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Records with cross-references</span>
              <span className="font-medium">{data.crossReferencing.withCrossReferences}/{data.crossReferencing.totalRecords} ({data.crossReferencing.crossReferenceRate}%)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Incidents without daily log link</span>
              <span className={`font-medium ${data.crossReferencing.incidentsWithoutDailyLog > 0 ? "text-amber-600" : "text-green-600"}`}>
                {data.crossReferencing.incidentsWithoutDailyLog}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Restraints without incident link</span>
              <span className={`font-medium ${data.crossReferencing.restraintsWithoutIncident > 0 ? "text-red-600" : "text-green-600"}`}>
                {data.crossReferencing.restraintsWithoutIncident}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Missing child without safeguarding link</span>
              <span className={`font-medium ${data.crossReferencing.missingWithoutSafeguarding > 0 ? "text-red-600" : "text-green-600"}`}>
                {data.crossReferencing.missingWithoutSafeguarding}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Late Records */}
      {data.timeliness.lateByType.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => toggle("late")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className={`transform transition-transform ${expandedSection === "late" ? "rotate-90" : ""}`}>▶</span>
            Late Records ({data.timeliness.lateByType.reduce((s, t) => s + t.count, 0)})
          </button>
          {expandedSection === "late" && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
              {data.timeliness.lateByType.map((lt) => (
                <TypeRow
                  key={lt.recordType}
                  recordType={lt.recordType}
                  count={lt.count}
                  detail={`avg ${lt.avgDelayHours}h delay (max ${getTimescaleHours(lt.recordType)}h)`}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
