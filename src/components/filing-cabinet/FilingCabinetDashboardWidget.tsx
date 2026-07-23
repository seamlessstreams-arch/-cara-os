"use client";

import React, { useEffect, useState } from "react";
import { formatRate, meets } from "@/lib/metrics/rate";
import type {
  FilingStats,
  FiledDocument,
  FilingCategory,
  DocumentStatus,
  Sensitivity,
  RetentionBasis,
} from "@/lib/filing-cabinet";
import {
  getCategoryLabel,
  getSensitivityLabel,
  getRetentionBasisLabel,
} from "@/lib/filing-cabinet";

// ── Types for API Response ──────────────────────────────────────────────────

interface CategoryBreakdown {
  category: FilingCategory;
  label: string;
  count: number;
  retentionYears: number;
  basis: RetentionBasis;
}

interface FilingCabinetOverview {
  stats: FilingStats;
  approachingExpiry: FiledDocument[];
  expiredDocuments: FiledDocument[];
  recentDocuments: FiledDocument[];
  categoryBreakdown: CategoryBreakdown[];
  holdCount: number;
}

// ── Rating Badge ────────────────────────────────────────────────────────────

function RatingBadge({ label, score }: { label: string; score: number | null }) {
  const color =
    score === null
      ? "bg-gray-100 text-gray-700 border-gray-300"
      : score >= 95
        ? "bg-green-100 text-green-800 border-green-300"
        : score >= 80
          ? "bg-blue-100 text-blue-800 border-blue-300"
          : score >= 60
            ? "bg-amber-100 text-amber-800 border-amber-300"
            : "bg-red-100 text-red-800 border-red-300";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${color}`}
    >
      {label} — {formatRate(score)}
    </span>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}
        {suffix}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// ── Status Label ────────────────────────────────────────────────────────────

function getStatusLabel(status: DocumentStatus): string {
  const labels: Record<DocumentStatus, string> = {
    active: "Active",
    archived: "Archived",
    pending_destruction: "Pending Destruction",
    destruction_approved: "Destruction Approved",
    destroyed: "Destroyed",
    hold: "On Hold",
    transferred: "Transferred",
  };
  return labels[status] ?? status;
}

// ── Document Row ────────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  showDays,
}: {
  doc: FiledDocument;
  showDays?: boolean;
}) {
  const expiryDate = new Date(doc.retentionExpiresAt);
  const daysRemaining = Math.floor(
    (expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  const daysColor =
    daysRemaining <= 0
      ? "text-red-600"
      : daysRemaining <= 30
        ? "text-amber-600"
        : "text-gray-600";

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-700 truncate">
          {doc.title}
        </span>
        <span className="text-xs text-gray-400">
          {getCategoryLabel(doc.category)} · {getSensitivityLabel(doc.sensitivity)}
        </span>
      </div>
      {showDays && (
        <span className={`text-xs font-medium ml-2 whitespace-nowrap ${daysColor}`}>
          {daysRemaining <= 0
            ? `${Math.abs(daysRemaining)}d overdue`
            : `${daysRemaining}d remaining`}
        </span>
      )}
    </div>
  );
}

// ── Breakdown Row ───────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  count,
  detail,
}: {
  label: string;
  count: number;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">({count})</span>
      </div>
      {detail && (
        <span className="text-xs text-gray-500">{detail}</span>
      )}
    </div>
  );
}

// ── Main Widget ─────────────────────────────────────────────────────────────

export function FilingCabinetDashboardWidget() {
  const [data, setData] = useState<FilingCabinetOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/filing-cabinet")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Loading Skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-56 rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-40 rounded bg-gray-100" />
          <div className="h-4 w-64 rounded bg-gray-100" />
          <div className="h-4 w-48 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-800">Filing Cabinet</h3>
        <p className="mt-2 text-sm text-red-600">Failed to load: {error}</p>
      </div>
    );
  }

  const { stats, approachingExpiry, expiredDocuments, categoryBreakdown } = data;

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  const complianceLabel =
    stats.complianceRate === null
      ? "No documents filed"
      : stats.complianceRate >= 95
        ? "Compliant"
        : stats.complianceRate >= 80
          ? "Mostly Compliant"
          : stats.complianceRate >= 60
            ? "Needs Attention"
            : "Non-Compliant";

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Filing Cabinet & Retention
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            CHR 2015 Schedule 3 · DPA 2018 · UK-GDPR
          </p>
        </div>
        <RatingBadge label={complianceLabel} score={stats.complianceRate} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <MetricCard
          label="Total Documents"
          value={stats.totalDocuments}
        />
        <MetricCard
          label="Compliance Rate"
          value={formatRate(stats.complianceRate)}
          color={
            stats.complianceRate === null
              ? "text-gray-400"
              : stats.complianceRate >= 95
                ? "text-green-600"
                : stats.complianceRate >= 80
                  ? "text-amber-600"
                  : "text-red-600"
          }
        />
        <MetricCard
          label="Pending Destruction"
          value={stats.pendingDestruction}
          color={stats.pendingDestruction > 0 ? "text-amber-600" : "text-green-600"}
        />
        <MetricCard
          label="Approaching Expiry"
          value={stats.approachingExpiry}
          color={stats.approachingExpiry > 0 ? "text-amber-600" : "text-green-600"}
        />
        <MetricCard
          label="On Hold"
          value={stats.onHold}
          color={stats.onHold > 0 ? "text-blue-600" : "text-gray-600"}
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {stats.pendingDestruction > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {stats.pendingDestruction} PENDING DESTRUCTION
          </span>
        )}
        {stats.approachingExpiry > 0 && (
          <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-medium border border-orange-200">
            {stats.approachingExpiry} APPROACHING EXPIRY
          </span>
        )}
        {stats.onHold > 0 && (
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium border border-blue-200">
            {stats.onHold} ON HOLD
          </span>
        )}
        {meets(stats.complianceRate, 95) && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            FULLY COMPLIANT
          </span>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="mb-5">
        <button
          onClick={() => toggle("category")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "category" ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          Breakdown by Category ({categoryBreakdown.length})
        </button>
        {expandedSection === "category" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            {categoryBreakdown.map((cb) => (
              <BreakdownRow
                key={cb.category}
                label={cb.label}
                count={cb.count}
                detail={`${cb.retentionYears}yr · ${getRetentionBasisLabel(cb.basis)}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="mb-5">
        <button
          onClick={() => toggle("status")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "status" ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          Breakdown by Status
        </button>
        {expandedSection === "status" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            {(Object.entries(stats.byStatus) as [DocumentStatus, number][]).map(
              ([status, count]) => (
                <BreakdownRow
                  key={status}
                  label={getStatusLabel(status)}
                  count={count}
                />
              ),
            )}
          </div>
        )}
      </div>

      {/* Sensitivity Breakdown */}
      <div className="mb-5">
        <button
          onClick={() => toggle("sensitivity")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span
            className={`transform transition-transform ${expandedSection === "sensitivity" ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          Breakdown by Sensitivity
        </button>
        {expandedSection === "sensitivity" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            {(
              Object.entries(stats.bySensitivity) as [Sensitivity, number][]
            ).map(([sensitivity, count]) => (
              <BreakdownRow
                key={sensitivity}
                label={getSensitivityLabel(sensitivity)}
                count={count}
              />
            ))}
          </div>
        )}
      </div>

      {/* Documents Approaching Expiry */}
      {approachingExpiry.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => toggle("approaching")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span
              className={`transform transition-transform ${expandedSection === "approaching" ? "rotate-90" : ""}`}
            >
              &#9654;
            </span>
            Documents Approaching Expiry ({approachingExpiry.length})
          </button>
          {expandedSection === "approaching" && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              {approachingExpiry.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} showDays />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expired / Pending Destruction */}
      {expiredDocuments.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => toggle("expired")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span
              className={`transform transition-transform ${expandedSection === "expired" ? "rotate-90" : ""}`}
            >
              &#9654;
            </span>
            Expired Documents ({expiredDocuments.length})
          </button>
          {expandedSection === "expired" && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
              {expiredDocuments.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} showDays />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Regulatory Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Retention periods per Children&apos;s Homes (England) Regulations 2015,
          Schedule 3; DPA 2018 / UK-GDPR; Limitation Act 1980.
        </p>
      </div>
    </div>
  );
}
