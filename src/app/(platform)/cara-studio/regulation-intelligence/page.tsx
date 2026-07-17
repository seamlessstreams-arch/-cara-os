"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — REGULATION & QUALITY STANDARDS INTELLIGENCE
//
// Maps evidence to Children's Homes Regulations 2015, Quality Standards, and
// SCCIF themes. Shows regulation coverage, evidence gaps, and Ofsted readiness.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Scale, CheckCircle2, AlertTriangle, Shield, Eye,
  BookOpen, TrendingUp, BarChart3, FileText,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Types ───────────────────────────────────────────────────────────────────

interface RegulationCoverage {
  regulation: string;
  title: string;
  evidenceCount: number;
  coverage: "strong" | "adequate" | "weak" | "none";
  sccifThemes: string[];
}

interface SCCIFReadiness {
  theme: string;
  label: string;
  totalEvidence: number;
  strongAreas: string[];
  weakAreas: string[];
  readinessLevel: "strong" | "adequate" | "needs_work" | "insufficient";
}

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_COVERAGE: RegulationCoverage[] = [
  { regulation: "Regulation 5", title: "Statement of Purpose", evidenceCount: 3, coverage: "adequate", sccifThemes: ["Effectiveness of Leaders & Managers"] },
  { regulation: "Regulation 6", title: "Quality of Care", evidenceCount: 12, coverage: "strong", sccifThemes: ["Overall Experiences & Progress"] },
  { regulation: "Regulation 7", title: "Children's Plans", evidenceCount: 8, coverage: "strong", sccifThemes: ["Overall Experiences & Progress"] },
  { regulation: "Regulation 8", title: "Enjoyment & Achievement", evidenceCount: 5, coverage: "strong", sccifThemes: ["Overall Experiences & Progress"] },
  { regulation: "Regulation 9", title: "Health & Wellbeing", evidenceCount: 4, coverage: "adequate", sccifThemes: ["Overall Experiences & Progress"] },
  { regulation: "Regulation 10", title: "Contact", evidenceCount: 6, coverage: "strong", sccifThemes: ["Overall Experiences & Progress"] },
  { regulation: "Regulation 11", title: "Consultation", evidenceCount: 3, coverage: "adequate", sccifThemes: ["Overall Experiences & Progress"] },
  { regulation: "Regulation 12", title: "Protection of Children", evidenceCount: 15, coverage: "strong", sccifThemes: ["How Well Children Helped & Protected"] },
  { regulation: "Regulation 13", title: "Leadership & Management", evidenceCount: 10, coverage: "strong", sccifThemes: ["Effectiveness of Leaders & Managers"] },
  { regulation: "Regulation 14", title: "Behaviour Management", evidenceCount: 7, coverage: "strong", sccifThemes: ["How Well Children Helped & Protected"] },
  { regulation: "Regulation 15", title: "Privacy and Dignity", evidenceCount: 3, coverage: "adequate", sccifThemes: ["Overall Experiences & Progress"] },
  { regulation: "Regulation 16", title: "Complaints", evidenceCount: 1, coverage: "weak", sccifThemes: ["Effectiveness of Leaders & Managers"] },
  { regulation: "Regulation 32", title: "Notification of Serious Events", evidenceCount: 2, coverage: "adequate", sccifThemes: ["How Well Children Helped & Protected"] },
  { regulation: "Regulation 33", title: "Workforce", evidenceCount: 6, coverage: "strong", sccifThemes: ["Effectiveness of Leaders & Managers"] },
  { regulation: "Regulation 34", title: "Fitness of Workers", evidenceCount: 2, coverage: "adequate", sccifThemes: ["Effectiveness of Leaders & Managers"] },
  { regulation: "Regulation 35", title: "Monitoring & Review", evidenceCount: 4, coverage: "adequate", sccifThemes: ["Effectiveness of Leaders & Managers"] },
  { regulation: "Regulation 44", title: "Independent Person: Visits", evidenceCount: 1, coverage: "weak", sccifThemes: ["Effectiveness of Leaders & Managers"] },
  { regulation: "Regulation 45", title: "Review of Quality of Care", evidenceCount: 4, coverage: "adequate", sccifThemes: ["Effectiveness of Leaders & Managers"] },
];

const DEMO_SCCIF: SCCIFReadiness[] = [
  {
    theme: "overall_experiences_progress", label: "Overall Experiences & Progress of Children",
    totalEvidence: 41, readinessLevel: "strong",
    strongAreas: ["Reg 6: Quality of Care", "Reg 7: Children's Plans", "Reg 8: Enjoyment & Achievement", "Reg 10: Contact"],
    weakAreas: ["Reg 11: Consultation could use more evidence"],
  },
  {
    theme: "how_well_children_helped_protected", label: "How Well Children Are Helped & Protected",
    totalEvidence: 24, readinessLevel: "strong",
    strongAreas: ["Reg 12: Protection of Children", "Reg 14: Behaviour Management"],
    weakAreas: ["Reg 32: Notification compliance could be strengthened"],
  },
  {
    theme: "effectiveness_leaders_managers", label: "Effectiveness of Leaders & Managers",
    totalEvidence: 31, readinessLevel: "adequate",
    strongAreas: ["Reg 13: Leadership & Management", "Reg 33: Workforce"],
    weakAreas: ["Reg 16: Complaints evidence is limited", "Reg 44: Independent visits evidence is limited"],
  },
];

const COVERAGE_STYLES: Record<string, { bg: string; text: string; bar: string }> = {
  strong: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  adequate: { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" },
  weak: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  none: { bg: "bg-red-50", text: "text-red-700", bar: "bg-red-500" },
};

const READINESS_STYLES: Record<string, string> = {
  strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  adequate: "bg-blue-50 text-blue-600 border-blue-200",
  needs_work: "bg-amber-50 text-amber-700 border-amber-200",
  insufficient: "bg-red-50 text-red-700 border-red-200",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function RegulationIntelligencePage() {
  const [coverage] = useState(demoSeed(DEMO_COVERAGE));
  const [sccif] = useState(demoSeed(DEMO_SCCIF));
  const [view, setView] = useState<"sccif" | "regulations">("sccif");

  const strongCount = coverage.filter((r) => r.coverage === "strong").length;
  const weakCount = coverage.filter((r) => r.coverage === "weak" || r.coverage === "none").length;
  const totalEvidence = coverage.reduce((sum, r) => sum + r.evidenceCount, 0);

  return (
    <PageShell title="Regulation Intelligence" subtitle="Evidence mapping to regulations & standards">
      <div className="space-y-6 pb-12">

        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Scale className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Regulation & Quality Standards Intelligence</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Maps practice evidence to Children&apos;s Homes Regulations 2015, Quality Standards, and SCCIF themes. Supports Ofsted readiness and Reg 45 evidence building.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{totalEvidence}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Evidence Items</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-2xl font-bold text-emerald-700">{strongCount}</p>
            <p className="text-[10px] text-emerald-600 uppercase tracking-wide mt-1">Strong Coverage</p>
          </div>
          <div className={cn("rounded-xl border p-4", weakCount > 0 ? "border-amber-200 bg-amber-50" : "border-[var(--cs-border)] bg-white")}>
            <p className={cn("text-2xl font-bold", weakCount > 0 ? "text-amber-700" : "text-[var(--cs-navy)]")}>{weakCount}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Weak / None</p>
          </div>
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{coverage.length}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Regulations Tracked</p>
          </div>
        </div>

        {/* ── View toggle ────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <button onClick={() => setView("sccif")} className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all", view === "sccif" ? "bg-[var(--cs-navy)] text-white" : "bg-white border border-[var(--cs-border)] text-[var(--cs-navy)]")}>
            SCCIF Readiness
          </button>
          <button onClick={() => setView("regulations")} className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all", view === "regulations" ? "bg-[var(--cs-navy)] text-white" : "bg-white border border-[var(--cs-border)] text-[var(--cs-navy)]")}>
            Regulation Coverage
          </button>
        </div>

        {view === "sccif" ? (
          /* ── SCCIF Readiness ──────────────────────────────────────────── */
          <div className="space-y-4">
            {sccif.map((theme) => (
              <div key={theme.theme} className="rounded-xl border border-[var(--cs-border)] bg-white p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--cs-navy)]">{theme.label}</span>
                  <Badge className={cn("text-[9px] border", READINESS_STYLES[theme.readinessLevel])}>
                    {theme.readinessLevel.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-[10px] text-[var(--cs-text-muted)] ml-auto">{theme.totalEvidence} evidence items</span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={cn("h-2 rounded-full transition-all", theme.readinessLevel === "strong" ? "bg-emerald-500" : theme.readinessLevel === "adequate" ? "bg-blue-500" : "bg-amber-500")}
                    style={{ width: `${Math.min(100, theme.totalEvidence * 2.5)}%` }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Strong Areas
                    </p>
                    {theme.strongAreas.map((a, i) => (
                      <div key={i} className="flex items-start gap-1.5 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="text-xs text-[var(--cs-text-secondary)]">{a}</span>
                      </div>
                    ))}
                  </div>
                  {theme.weakAreas.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Areas for Improvement
                      </p>
                      {theme.weakAreas.map((a, i) => (
                        <div key={i} className="flex items-start gap-1.5 mb-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span className="text-xs text-[var(--cs-text-secondary)]">{a}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Regulation Coverage ──────────────────────────────────────── */
          <div className="space-y-2">
            {coverage.map((reg) => {
              const style = COVERAGE_STYLES[reg.coverage];
              const maxEvidence = Math.max(...coverage.map((r) => r.evidenceCount));
              const barWidth = maxEvidence > 0 ? (reg.evidenceCount / maxEvidence) * 100 : 0;

              return (
                <div key={reg.regulation} className="rounded-lg border border-[var(--cs-border)] bg-white px-4 py-3 flex items-center gap-4">
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-semibold text-[var(--cs-navy)]">{reg.regulation}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--cs-text-secondary)] truncate">{reg.title}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div className={cn("h-1.5 rounded-full transition-all", style.bar)} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[var(--cs-navy)]">{reg.evidenceCount}</p>
                    <Badge className={cn("text-[8px] border", style.bg, style.text)}>{reg.coverage}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
