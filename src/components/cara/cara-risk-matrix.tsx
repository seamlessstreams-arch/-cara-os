// ══════════════════════════════════════════════════════════════════════════════
// CaraRiskMatrix — Visual risk assessment matrix for young people
//
// Shows Cara-analysed risk levels across multiple domains (behaviour,
// safeguarding, health, placement stability, education, relationships).
// Combines data from incidents, risk assessments, daily logs, and care plans
// to produce an AI-powered risk overview.
//
// NB: this component previously rendered a hardcoded demo set of per-child risk
// profiles (fictional children) unconditionally — which surfaced on the live
// tenant as "children who are not living in the home". Fabricated records must
// never appear on a live care-record system, so the demo generator has been
// removed. The matrix renders ONLY the real profiles it is given and shows an
// honest empty state when there are none. It never invents data.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Heart,
  BookOpen,
  Home,
  Users,
  Brain,
  Activity,
  ShieldCheck,
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

export interface RiskDomainEntry {
  domain: RiskDomain;
  level: RiskLevel;
  trend: TrendDirection;
  summary: string;
  lastAssessed: string;
  dataPoints: number;
}

export interface ChildRiskProfile {
  childId: string;
  childName: string;
  overallRisk: RiskLevel;
  domains: RiskDomainEntry[];
  lastUpdated: string;
  caraNotes?: string;
}

export interface CaraRiskMatrixProps {
  /**
   * Per-child risk profiles to render. Defaults to an empty list, which shows
   * an honest empty state. This component NEVER fabricates profiles — it renders
   * only the real data it is given, so it is safe on the live tenant.
   */
  profiles?: ChildRiskProfile[];
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

// ── Component ────────────────────────────────────────────────────────────────

export function CaraRiskMatrix({ profiles = [] }: CaraRiskMatrixProps = {}) {
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const domains: RiskDomain[] = ["behaviour", "safeguarding", "health", "placement_stability", "education", "relationships"];

  // Sort by overall risk (most severe first)
  const sorted = [...profiles].sort(
    (a, b) => RISK_LEVEL_CONFIG[a.overallRisk].order - RISK_LEVEL_CONFIG[b.overallRisk].order,
  );

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[var(--cs-cara-gold-soft)] rounded-lg">
            <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Cara Risk Matrix</h3>
            <p className="text-[10px] text-[var(--cs-text-muted)]">
              {profiles.length > 0
                ? `Cross-domain risk analysis — ${profiles.length} young ${profiles.length === 1 ? "person" : "people"}`
                : "Cross-domain risk analysis"}
            </p>
          </div>
        </div>
      </div>

      {profiles.length === 0 ? (
        /* Honest empty state — never fabricate per-child risk */
        <div className="px-5 py-10 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ShieldCheck className="h-5 w-5 text-[var(--cs-text-muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--cs-text-secondary)]">No risk data yet</p>
          <p className="mt-1 text-[11px] text-[var(--cs-text-muted)]">
            Per-child risk appears here as records are logged — incidents, risk assessments, daily logs, and care plans.
          </p>
        </div>
      ) : (
        <>
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
                              {profile.caraNotes && (
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
                              {profile.caraNotes && (
                                <div className="rounded-xl bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] p-2.5">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />
                                    <span className="text-[10px] font-semibold text-[var(--cs-navy)]">Cara Note</span>
                                  </div>
                                  <p className="text-[11px] text-[var(--cs-text-secondary)]">{profile.caraNotes}</p>
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
        </>
      )}
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { RISK_LEVEL_CONFIG, DOMAIN_CONFIG };
