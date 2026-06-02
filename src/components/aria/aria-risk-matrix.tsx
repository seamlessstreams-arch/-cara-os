// ══════════════════════════════════════════════════════════════════════════════
// AriaRiskMatrix — Visual risk assessment matrix for young people
//
// Shows ARIA-analysed risk levels across multiple domains (behaviour,
// safeguarding, health, placement stability, education, relationships).
// Combines data from incidents, risk assessments, daily logs, and care plans
// to produce an AI-powered risk overview.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, Shield, Heart, BookOpen,
  Home, Users, Brain, Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = "critical" | "high" | "medium" | "low" | "minimal";
type TrendDirection = "increasing" | "stable" | "decreasing";

type RiskDomain =
  | "behaviour"
  | "safeguarding"
  | "health"
  | "placement_stability"
  | "education"
  | "relationships";

interface RiskDomainEntry {
  domain: RiskDomain;
  level: RiskLevel;
  trend: TrendDirection;
  summary: string;
  lastAssessed: string;
  dataPoints: number;
}

interface ChildRiskProfile {
  childId: string;
  childName: string;
  overallRisk: RiskLevel;
  domains: RiskDomainEntry[];
  lastUpdated: string;
  ariaNotes?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; colour: string; bg: string; cell: string; order: number }> = {
  critical: { label: "Critical", colour: "text-red-700",     bg: "bg-red-100",     cell: "bg-red-500 text-white",          order: 0 },
  high:     { label: "High",     colour: "text-orange-700",  bg: "bg-orange-100",  cell: "bg-orange-400 text-white",       order: 1 },
  medium:   { label: "Medium",   colour: "text-amber-700",   bg: "bg-amber-100",   cell: "bg-amber-300 text-amber-900",    order: 2 },
  low:      { label: "Low",      colour: "text-blue-700",    bg: "bg-blue-50",     cell: "bg-blue-200 text-blue-800",      order: 3 },
  minimal:  { label: "Minimal",  colour: "text-emerald-700", bg: "bg-emerald-50",  cell: "bg-emerald-200 text-emerald-800", order: 4 },
};

const DOMAIN_CONFIG: Record<RiskDomain, { label: string; icon: React.ReactNode; shortLabel: string }> = {
  behaviour:           { label: "Behaviour",           icon: <Brain className="h-3.5 w-3.5" />,    shortLabel: "BEH" },
  safeguarding:        { label: "Safeguarding",        icon: <Shield className="h-3.5 w-3.5" />,   shortLabel: "SAF" },
  health:              { label: "Health & Wellbeing",   icon: <Heart className="h-3.5 w-3.5" />,    shortLabel: "HLT" },
  placement_stability: { label: "Placement Stability",  icon: <Home className="h-3.5 w-3.5" />,     shortLabel: "PLC" },
  education:           { label: "Education",            icon: <BookOpen className="h-3.5 w-3.5" />, shortLabel: "EDU" },
  relationships:       { label: "Relationships",        icon: <Users className="h-3.5 w-3.5" />,    shortLabel: "REL" },
};

const TREND_ICONS: Record<TrendDirection, React.ReactNode> = {
  increasing: <TrendingUp className="h-3 w-3 text-red-500" />,
  stable:     <Minus className="h-3 w-3 text-blue-400" />,
  decreasing: <TrendingDown className="h-3 w-3 text-emerald-500" />,
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoRiskMatrix(): ChildRiskProfile[] {
  return [
    {
      childId: "yp_001",
      childName: "Alex W",
      overallRisk: "high",
      lastUpdated: "2026-05-12",
      ariaNotes: "Escalating behaviour pattern detected — 3 incidents in 14 days. Risk assessment review recommended.",
      domains: [
        { domain: "behaviour",           level: "high",     trend: "increasing", summary: "3 incidents in 14 days, escalating severity", lastAssessed: "2026-05-12", dataPoints: 12 },
        { domain: "safeguarding",        level: "medium",   trend: "stable",     summary: "Active concern — monitoring in place",        lastAssessed: "2026-05-10", dataPoints: 5 },
        { domain: "health",              level: "low",      trend: "stable",     summary: "No current health concerns",                  lastAssessed: "2026-05-08", dataPoints: 8 },
        { domain: "placement_stability", level: "medium",   trend: "increasing", summary: "Behaviour pattern may affect stability",      lastAssessed: "2026-05-12", dataPoints: 6 },
        { domain: "education",           level: "medium",   trend: "stable",     summary: "Reduced attendance this month — 72%",         lastAssessed: "2026-05-11", dataPoints: 15 },
        { domain: "relationships",       level: "low",      trend: "decreasing", summary: "Positive peer relationships, improving",      lastAssessed: "2026-05-09", dataPoints: 7 },
      ],
    },
    {
      childId: "yp_002",
      childName: "Casey T",
      overallRisk: "medium",
      lastUpdated: "2026-05-11",
      domains: [
        { domain: "behaviour",           level: "low",      trend: "decreasing", summary: "Significant improvement over 21 days",        lastAssessed: "2026-05-11", dataPoints: 18 },
        { domain: "safeguarding",        level: "medium",   trend: "stable",     summary: "Historical concern — review due June",        lastAssessed: "2026-05-05", dataPoints: 4 },
        { domain: "health",              level: "low",      trend: "stable",     summary: "Medication managed, no concerns",             lastAssessed: "2026-05-10", dataPoints: 10 },
        { domain: "placement_stability", level: "minimal",  trend: "stable",     summary: "Well settled, 8 months in placement",         lastAssessed: "2026-05-01", dataPoints: 3 },
        { domain: "education",           level: "minimal",  trend: "decreasing", summary: "95% attendance, strong engagement",           lastAssessed: "2026-05-11", dataPoints: 20 },
        { domain: "relationships",       level: "medium",   trend: "stable",     summary: "Family contact inconsistent",                 lastAssessed: "2026-05-08", dataPoints: 6 },
      ],
    },
    {
      childId: "yp_003",
      childName: "Jordan M",
      overallRisk: "low",
      lastUpdated: "2026-05-12",
      domains: [
        { domain: "behaviour",           level: "minimal",  trend: "stable",     summary: "No concerns",                                 lastAssessed: "2026-05-12", dataPoints: 14 },
        { domain: "safeguarding",        level: "low",      trend: "stable",     summary: "No active concerns",                          lastAssessed: "2026-05-06", dataPoints: 2 },
        { domain: "health",              level: "low",      trend: "stable",     summary: "Asthma managed — inhaler in date",            lastAssessed: "2026-05-10", dataPoints: 8 },
        { domain: "placement_stability", level: "minimal",  trend: "stable",     summary: "Stable placement, 14 months",                 lastAssessed: "2026-05-01", dataPoints: 2 },
        { domain: "education",           level: "low",      trend: "stable",     summary: "Good engagement, 88% attendance",             lastAssessed: "2026-05-11", dataPoints: 16 },
        { domain: "relationships",       level: "low",      trend: "decreasing", summary: "Strong family contact, good peer bonds",      lastAssessed: "2026-05-09", dataPoints: 9 },
      ],
    },
    {
      childId: "yp_004",
      childName: "Riley P",
      overallRisk: "medium",
      lastUpdated: "2026-05-12",
      ariaNotes: "Missing voice-of-child evidence — no key work session recorded in 28 days.",
      domains: [
        { domain: "behaviour",           level: "medium",   trend: "stable",     summary: "Occasional low-level disruption",             lastAssessed: "2026-05-12", dataPoints: 10 },
        { domain: "safeguarding",        level: "low",      trend: "stable",     summary: "No active concerns",                          lastAssessed: "2026-05-04", dataPoints: 3 },
        { domain: "health",              level: "medium",   trend: "increasing", summary: "Anxiety reported — CAMHS referral pending",   lastAssessed: "2026-05-11", dataPoints: 7 },
        { domain: "placement_stability", level: "low",      trend: "stable",     summary: "Settled, 5 months in placement",              lastAssessed: "2026-05-01", dataPoints: 4 },
        { domain: "education",           level: "medium",   trend: "increasing", summary: "Attendance dropped to 78% this month",        lastAssessed: "2026-05-11", dataPoints: 14 },
        { domain: "relationships",       level: "low",      trend: "stable",     summary: "Good with staff, reserved with peers",        lastAssessed: "2026-05-08", dataPoints: 5 },
      ],
    },
  ];
}

// ── Component ────────────────────────────────────────────────────────────────

export function AriaRiskMatrix() {
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const profiles = getDemoRiskMatrix();
  const domains: RiskDomain[] = ["behaviour", "safeguarding", "health", "placement_stability", "education", "relationships"];

  // Sort by overall risk
  const sorted = [...profiles].sort(
    (a, b) => RISK_LEVEL_CONFIG[a.overallRisk].order - RISK_LEVEL_CONFIG[b.overallRisk].order,
  );

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[var(--cs-aria-gold-soft)] rounded-lg">
            <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--cs-navy)]">ARIA Risk Matrix</h3>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Cross-domain risk analysis — {profiles.length} young people</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-[var(--cs-border)] flex items-center gap-3 flex-wrap">
        {(["critical", "high", "medium", "low", "minimal"] as RiskLevel[]).map((level) => {
          const cfg = RISK_LEVEL_CONFIG[level];
          return (
            <div key={level} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${cfg.cell}`} />
              <span className="text-[10px] text-[var(--cs-text-muted)]">{cfg.label}</span>
            </div>
          );
        })}
        <div className="ml-auto flex items-center gap-2 text-[10px] text-[var(--cs-text-muted)]">
          <span className="flex items-center gap-0.5">{TREND_ICONS.increasing} Rising</span>
          <span className="flex items-center gap-0.5">{TREND_ICONS.stable} Stable</span>
          <span className="flex items-center gap-0.5">{TREND_ICONS.decreasing} Falling</span>
        </div>
      </div>

      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--cs-border)]">
              <th className="text-left px-4 py-2 font-medium text-[var(--cs-text-muted)] w-[140px]">Young Person</th>
              {domains.map((d) => (
                <th key={d} className="text-center px-2 py-2 font-medium text-[var(--cs-text-muted)]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[var(--cs-text-secondary)]">{DOMAIN_CONFIG[d].icon}</span>
                    <span className="text-[9px]">{DOMAIN_CONFIG[d].shortLabel}</span>
                  </div>
                </th>
              ))}
              <th className="text-center px-3 py-2 font-medium text-[var(--cs-text-muted)]">Overall</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((profile) => {
              const overallCfg = RISK_LEVEL_CONFIG[profile.overallRisk];
              const isExpanded = expandedChild === profile.childId;

              return (
                <React.Fragment key={profile.childId}>
                  <tr
                    className="border-b border-[var(--cs-border)] hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => setExpandedChild(isExpanded ? null : profile.childId)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${overallCfg.cell.split(" ")[0]}`} />
                        <div>
                          <span className="font-medium text-[var(--cs-navy)]">{profile.childName}</span>
                          {profile.ariaNotes && (
                            <AlertTriangle className="h-3 w-3 text-amber-500 inline ml-1.5" />
                          )}
                        </div>
                      </div>
                    </td>
                    {domains.map((d) => {
                      const entry = profile.domains.find((de) => de.domain === d);
                      if (!entry) return <td key={d} className="text-center px-2 py-2.5">—</td>;
                      const cfg = RISK_LEVEL_CONFIG[entry.level];
                      return (
                        <td key={d} className="text-center px-2 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${cfg.cell}`}>
                              {cfg.label.slice(0, 3).toUpperCase()}
                            </span>
                            {TREND_ICONS[entry.trend]}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-2.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${overallCfg.bg} ${overallCfg.colour}`}>
                        {overallCfg.label}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <tr className="border-b border-[var(--cs-border)]">
                      <td colSpan={domains.length + 2} className="px-4 py-3 bg-slate-50/50 animate-fade-in">
                        <div className="space-y-2">
                          {profile.ariaNotes && (
                            <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Sparkles className="h-3 w-3 text-[var(--cs-aria-gold)]" />
                                <span className="text-[10px] font-semibold text-[var(--cs-navy)]">ARIA Note</span>
                              </div>
                              <p className="text-[11px] text-[var(--cs-text-secondary)]">{profile.ariaNotes}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {(profile.domains ?? []).map((entry) => {
                              const dcfg = DOMAIN_CONFIG[entry.domain];
                              const lcfg = RISK_LEVEL_CONFIG[entry.level];
                              return (
                                <div key={entry.domain} className="rounded-lg border border-[var(--cs-border)] p-2.5 bg-white">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[var(--cs-text-secondary)]">{dcfg.icon}</span>
                                    <span className="text-[10px] font-semibold text-[var(--cs-navy)]">{dcfg.label}</span>
                                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-medium ${lcfg.cell}`}>
                                      {lcfg.label}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[var(--cs-text-muted)]">{entry.summary}</p>
                                  <div className="flex items-center gap-2 mt-1 text-[9px] text-[var(--cs-text-gentle)]">
                                    <span className="flex items-center gap-0.5">{TREND_ICONS[entry.trend]} {entry.trend}</span>
                                    <span><Activity className="h-2.5 w-2.5 inline" /> {entry.dataPoints} data points</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Risk levels are AI-analysed from incidents, daily logs, assessments, and care plans. Always verify with professional judgement.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { RISK_LEVEL_CONFIG, DOMAIN_CONFIG, getDemoRiskMatrix };
