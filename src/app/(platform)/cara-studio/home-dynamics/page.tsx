"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — HOME DYNAMICS DASHBOARD
//
// Morning dashboard view for the Registered Manager showing the home's
// overall dynamics: emotional climate, incidents, staffing, compliance,
// safeguarding alerts, early warnings, and recommended focus areas.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import type {
  CaraStudioHomeDynamics,
  CaraStudioEarlyWarning,
  CaraStudioSafeguardingPattern,
  CaraStudioGap,
} from "@/types/cara-studio";

// ── Climate badge styling ───────────────────────────────────────────────────

const CLIMATE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  settled: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Settled" },
  mostly_settled: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Mostly Settled" },
  unsettled: { bg: "bg-amber-50", text: "text-amber-700", label: "Unsettled" },
  challenging: { bg: "bg-orange-50", text: "text-orange-700", label: "Challenging" },
  in_crisis: { bg: "bg-red-50", text: "text-red-700", label: "In Crisis" },
};

const RISK_STYLES: Record<string, { bg: string; text: string }> = {
  stable: { bg: "bg-emerald-50", text: "text-emerald-700" },
  moderate: { bg: "bg-amber-50", text: "text-amber-700" },
  elevated: { bg: "bg-orange-50", text: "text-orange-700" },
  high: { bg: "bg-red-50", text: "text-red-700" },
};

// ── Component ───────────────────────────────────────────────────────────────

export default function HomeDynamicsDashboard() {
  const [generating, setGenerating] = useState(false);

  // TanStack Query (repo convention) instead of useEffect+fetch — shared cache,
  // retry and dedupe for free, no hand-rolled loading state.
  const dynamics = useQuery({
    queryKey: ["cara-studio", "home-dynamics"],
    queryFn: async () => {
      const [snapRes, warnRes, patternRes, gapRes] = await Promise.all([
        fetch("/api/cara-studio/home-dynamics").then((r) => r.json()),
        fetch("/api/cara-studio/early-warnings").then((r) => r.json()),
        fetch("/api/cara-studio/safeguarding-patterns").then((r) => r.json()),
        fetch("/api/cara-studio/gaps").then((r) => r.json()),
      ]);
      return {
        snapshot: (snapRes.data ?? null) as CaraStudioHomeDynamics | null,
        warnings: (warnRes.data ?? []) as CaraStudioEarlyWarning[],
        patterns: (patternRes.data ?? []) as CaraStudioSafeguardingPattern[],
        gaps: (gapRes.data ?? []) as CaraStudioGap[],
      };
    },
  });
  const snapshot = dynamics.data?.snapshot ?? null;
  const warnings = dynamics.data?.warnings ?? [];
  const patterns = dynamics.data?.patterns ?? [];
  const gaps = dynamics.data?.gaps ?? [];
  const loading = dynamics.isLoading;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/cara-studio/home-dynamics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await res.json();
      // Server state changed — refetch the query so the fresh snapshot lands
      // in the shared cache (not a locally-diverged copy).
      await dynamics.refetch();
    } catch (err) {
      console.error("[home-dynamics] Generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const climate = CLIMATE_STYLES[snapshot?.emotional_climate ?? "settled"] ?? CLIMATE_STYLES.settled;
  const risk = RISK_STYLES[snapshot?.risk_level ?? "stable"] ?? RISK_STYLES.stable;

  return (
    <PageShell title="Home Dynamics" subtitle="Cara Studio Intelligence Dashboard">
      {/* ── Header actions ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--cs-text-secondary)" }}>
          {snapshot?.snapshot_date
            ? `Snapshot: ${new Date(snapshot.snapshot_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
            : "No snapshot available"}
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{
            backgroundColor: generating ? "var(--cs-surface-alt)" : "var(--cs-cara-gold)",
            color: generating ? "var(--cs-text-secondary)" : "var(--cs-navy)",
          }}
        >
          {generating ? "Generating…" : "Generate Fresh Snapshot"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: "var(--cs-cara-gold)" }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Top summary cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Emotional Climate */}
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--cs-text-secondary)" }}>Emotional Climate</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${climate.bg} ${climate.text}`}>
                {climate.label}
              </span>
            </div>

            {/* Risk Level */}
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--cs-text-secondary)" }}>Overall Risk Level</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${risk.bg} ${risk.text}`}>
                {(snapshot?.risk_level ?? "stable").charAt(0).toUpperCase() + (snapshot?.risk_level ?? "stable").slice(1)}
              </span>
            </div>

            {/* Summary */}
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--cs-text-secondary)" }}>Summary</p>
              <p className="text-sm" style={{ color: "var(--cs-text-primary)" }}>{snapshot?.summary ?? "No data available"}</p>
            </div>
          </div>

          {/* ── Metrics grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Incidents", value: snapshot?.incident_count ?? 0, warn: 3 },
              { label: "Missing Episodes", value: snapshot?.missing_episode_count ?? 0, warn: 1 },
              { label: "Restraints", value: snapshot?.restraint_count ?? 0, warn: 1 },
              { label: "Complaints", value: snapshot?.complaint_count ?? 0, warn: 1 },
              { label: "Overdue Actions", value: snapshot?.overdue_actions_count ?? 0, warn: 1 },
              { label: "Safeguarding Alerts", value: snapshot?.safeguarding_alerts_count ?? 0, warn: 1 },
              { label: "Staff Absences", value: snapshot?.staff_absence_count ?? 0, warn: 2 },
              { label: "Agency Staff", value: snapshot?.agency_staff_count ?? 0, warn: 3 },
              { label: "Education Concerns", value: snapshot?.education_concerns_count ?? 0, warn: 1 },
            ].map(({ label, value, warn }) => (
              <div
                key={label}
                className="rounded-lg border p-4 text-center"
                style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}
              >
                <p className={`text-2xl font-bold ${value >= warn ? "text-red-600" : ""}`}
                  style={value < warn ? { color: "var(--cs-text-primary)" } : undefined}
                >
                  {value}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--cs-text-secondary)" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* ── Manager Focus ─────────────────────────────────────────── */}
          {snapshot?.recommended_manager_focus && (
            <div className="rounded-xl border-l-4 p-5" style={{ borderColor: "var(--cs-cara-gold)", backgroundColor: "var(--cs-surface)" }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--cs-cara-gold)" }}>
                Recommended Manager Focus
              </h3>
              <ul className="space-y-1">
                {snapshot.recommended_manager_focus.split(". ").filter(Boolean).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--cs-text-primary)" }}>
                    <span style={{ color: "var(--cs-cara-gold)" }}>•</span>
                    {item.replace(/\.$/, "")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Early Warnings ────────────────────────────────────────── */}
          {warnings.length > 0 && (
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cs-text-primary)" }}>
                Early Warning Indicators ({warnings.length})
              </h3>
              <div className="space-y-3">
                {warnings.map((w) => (
                  <div key={w.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--cs-surface-alt)" }}>
                    <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${w.risk_level === "high" ? "bg-red-500" : w.risk_level === "medium" ? "bg-amber-500" : "bg-blue-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--cs-text-primary)" }}>{w.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--cs-text-secondary)" }}>{w.description}</p>
                      {w.recommended_action && (
                        <p className="text-xs mt-1 italic" style={{ color: "var(--cs-cara-gold)" }}>{w.recommended_action}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Safeguarding Patterns ─────────────────────────────────── */}
          {patterns.length > 0 && (
            <div className="rounded-xl border p-5 border-red-200" style={{ backgroundColor: "var(--cs-surface)" }}>
              <h3 className="text-sm font-semibold mb-3 text-red-700">
                Safeguarding Pattern Alerts ({patterns.length})
              </h3>
              <div className="space-y-3">
                {patterns.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50">
                    <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${p.risk_level === "critical" || p.risk_level === "high" ? "bg-red-600" : "bg-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800">{p.title}</p>
                      <p className="text-xs mt-0.5 text-red-600">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Evidence Gaps ─────────────────────────────────────────── */}
          {gaps.length > 0 && (
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cs-text-primary)" }}>
                Evidence Gaps ({gaps.length})
              </h3>
              <div className="space-y-2">
                {gaps.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--cs-surface-alt)" }}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${g.severity === "high" ? "bg-red-500" : g.severity === "medium" ? "bg-amber-500" : "bg-blue-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: "var(--cs-text-primary)" }}>{g.title}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--cs-surface)", color: "var(--cs-text-secondary)" }}>
                      {g.gap_type.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
