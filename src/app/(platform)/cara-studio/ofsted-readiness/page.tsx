"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — OFSTED READINESS DASHBOARD
//
// Surfaces the evidence position for every Quality Standard, highlights
// weak or missing evidence, overdue actions, and recording gaps — so the
// RM can see at a glance what needs attention before inspection.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import type {
  CaraStudioGap,
  CaraStudioEarlyWarning,
  CaraStudioContradiction,
} from "@/types/cara-studio";

// ── Regulation mapping ──────────────────────────────────────────────────────

interface RegulationArea {
  reg: string;
  title: string;
  description: string;
  evidenceTypes: string[];
}

const REGULATION_AREAS: RegulationArea[] = [
  { reg: "Reg 5", title: "Quality & Purpose of Care", description: "Statement of purpose, ethos, outcomes", evidenceTypes: ["care_plan", "placement_plan"] },
  { reg: "Reg 6", title: "The Children's Views, Wishes and Feelings", description: "Child voice, participation, advocacy", evidenceTypes: ["keywork", "direct_work"] },
  { reg: "Reg 7", title: "Protection of Children", description: "Safeguarding, risk assessment, missing", evidenceTypes: ["safeguarding", "risk_assessment", "missing_from_care"] },
  { reg: "Reg 8", title: "Promoting Contact", description: "Family contact, social worker liaison", evidenceTypes: ["daily_log"] },
  { reg: "Reg 9", title: "Positive Relationships", description: "Key working, relationships, behaviour support", evidenceTypes: ["keywork", "incident", "daily_log"] },
  { reg: "Reg 10", title: "Enjoyment & Achievement", description: "Education, leisure, hobbies, achievements", evidenceTypes: ["education", "daily_log"] },
  { reg: "Reg 11", title: "Duty of Care", description: "Health, well-being, daily care", evidenceTypes: ["health", "medication", "daily_log"] },
  { reg: "Reg 12", title: "The Independent Person", description: "RI visits, Reg 44 compliance", evidenceTypes: ["reg45"] },
  { reg: "Reg 13", title: "Leadership & Management", description: "Oversight, monitoring, quality assurance", evidenceTypes: ["management_oversight", "supervision", "team_meeting"] },
  { reg: "Reg 14", title: "Care Planning", description: "Placement plans, reviews, updates", evidenceTypes: ["care_plan", "placement_plan"] },
  { reg: "Reg 32", title: "Fitness of Workers", description: "Recruitment, training, supervision", evidenceTypes: ["staff_training", "supervision"] },
  { reg: "Reg 33", title: "Employment of Staff", description: "Staffing levels, rota, agency use", evidenceTypes: ["rota"] },
  { reg: "Reg 34", title: "Staff Support & Training", description: "Induction, training programme, CPD", evidenceTypes: ["staff_training"] },
  { reg: "Reg 35", title: "Behaviour Management", description: "Behaviour policy, restraint, sanctions", evidenceTypes: ["incident", "daily_log"] },
  { reg: "Reg 40", title: "Notification of Significant Events", description: "Notifications to Ofsted and LA", evidenceTypes: ["incident", "safeguarding"] },
  { reg: "Reg 44", title: "Independent Person — Visits", description: "Monthly independent visits", evidenceTypes: ["reg45"] },
  { reg: "Reg 45", title: "Review of Quality of Care", description: "Six-monthly quality review", evidenceTypes: ["reg45", "management_oversight"] },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function OfstedReadinessDashboard() {
  // TanStack Query (repo convention) instead of useEffect+fetch — shared cache,
  // retry and dedupe for free, no hand-rolled loading state.
  const readiness = useQuery({
    queryKey: ["cara-studio", "ofsted-readiness"],
    queryFn: async () => {
      const [gapRes, warnRes, contraRes] = await Promise.all([
        fetch("/api/cara-studio/gaps").then((r) => r.json()),
        fetch("/api/cara-studio/early-warnings").then((r) => r.json()),
        fetch("/api/cara-studio/contradictions").then((r) => r.json()),
      ]);
      return {
        gaps: (gapRes.data ?? []) as CaraStudioGap[],
        warnings: (warnRes.data ?? []) as CaraStudioEarlyWarning[],
        contradictions: (contraRes.data ?? []) as CaraStudioContradiction[],
      };
    },
  });
  const gaps = readiness.data?.gaps ?? [];
  const warnings = readiness.data?.warnings ?? [];
  const contradictions = readiness.data?.contradictions ?? [];
  const loading = readiness.isLoading;

  // Compute readiness score
  const complianceWarnings = warnings.filter((w) => w.warning_type === "compliance_risk");
  const recordingWarnings = warnings.filter((w) => w.warning_type === "recording_quality_risk");
  const highGaps = gaps.filter((g) => g.severity === "high");
  const totalIssues = gaps.length + complianceWarnings.length + contradictions.length;
  const readinessScore = Math.max(0, 100 - totalIssues * 5);
  const readinessLabel =
    readinessScore >= 80 ? "Strong" : readinessScore >= 60 ? "Developing" : readinessScore >= 40 ? "Requires Improvement" : "Inadequate";
  const readinessColor =
    readinessScore >= 80 ? "text-emerald-600" : readinessScore >= 60 ? "text-amber-600" : readinessScore >= 40 ? "text-orange-600" : "text-red-600";

  return (
    <PageShell title="Ofsted Readiness" subtitle="Cara Studio Compliance Intelligence">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: "var(--cs-cara-gold)" }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Readiness Score ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 rounded-xl border p-6" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--cs-text-secondary)" }}>
                Readiness Score
              </p>
              <div className="flex items-baseline gap-3">
                <span className={`text-4xl font-bold ${readinessColor}`}>{readinessScore}%</span>
                <span className={`text-sm font-medium ${readinessColor}`}>{readinessLabel}</span>
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--cs-text-secondary)" }}>
                Based on {gaps.length} evidence gaps, {complianceWarnings.length} compliance warnings, and {contradictions.length} contradictions.
              </p>
            </div>

            <div className="rounded-xl border p-6" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--cs-text-secondary)" }}>Evidence Gaps</p>
              <p className="text-3xl font-bold" style={{ color: gaps.length > 0 ? "var(--cs-text-primary)" : "var(--cs-text-secondary)" }}>{gaps.length}</p>
              <p className="text-xs mt-1" style={{ color: "var(--cs-text-secondary)" }}>{highGaps.length} high priority</p>
            </div>

            <div className="rounded-xl border p-6" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--cs-text-secondary)" }}>Contradictions</p>
              <p className="text-3xl font-bold" style={{ color: contradictions.length > 0 ? "var(--cs-text-primary)" : "var(--cs-text-secondary)" }}>{contradictions.length}</p>
              <p className="text-xs mt-1" style={{ color: "var(--cs-text-secondary)" }}>Conflicting records to review</p>
            </div>
          </div>

          {/* ── Regulation areas ──────────────────────────────────────── */}
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--cs-text-primary)" }}>
              Regulation Evidence Map
            </h3>
            <div className="space-y-2">
              {REGULATION_AREAS.map((area) => {
                const areaGaps = gaps.filter((g) => area.evidenceTypes.some((et) => g.gap_type.includes(et)));
                const hasGaps = areaGaps.length > 0;
                const hasComplianceWarning = complianceWarnings.some((w) => w.description?.toLowerCase().includes(area.reg.toLowerCase()));
                const status = hasGaps || hasComplianceWarning ? "gap" : "ok";

                return (
                  <div
                    key={area.reg}
                    className="flex items-center gap-4 p-3 rounded-lg"
                    style={{ backgroundColor: "var(--cs-surface-alt)" }}
                  >
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${status === "ok" ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--cs-text-primary)" }}>
                        <span style={{ color: "var(--cs-cara-gold)" }}>{area.reg}</span> — {area.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--cs-text-secondary)" }}>{area.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {status === "ok" ? "Evidence Present" : `${areaGaps.length} Gap(s)`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Recording Quality ─────────────────────────────────────── */}
          {recordingWarnings.length > 0 && (
            <div className="rounded-xl border-l-4 p-5" style={{ borderColor: "var(--cs-cara-gold)", backgroundColor: "var(--cs-surface)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cs-cara-gold)" }}>
                Recording Quality Concerns
              </h3>
              <div className="space-y-2">
                {recordingWarnings.map((w) => (
                  <div key={w.id} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm" style={{ color: "var(--cs-text-primary)" }}>{w.title}</p>
                      <p className="text-xs" style={{ color: "var(--cs-text-secondary)" }}>{w.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Contradictions ────────────────────────────────────────── */}
          {contradictions.length > 0 && (
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--cs-border)", backgroundColor: "var(--cs-surface)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cs-text-primary)" }}>
                Record Contradictions ({contradictions.length})
              </h3>
              <p className="text-xs mb-3" style={{ color: "var(--cs-text-secondary)" }}>
                Conflicting information across records that should be resolved before inspection.
              </p>
              <div className="space-y-2">
                {contradictions.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--cs-surface-alt)" }}>
                    <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${c.severity === "high" ? "bg-red-500" : "bg-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: "var(--cs-text-primary)" }}>{c.description}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--cs-text-secondary)" }}>
                        Type: {c.contradiction_type.replace(/_/g, " ")} | Severity: {c.severity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Cara disclaimer ───────────────────────────────────────── */}
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: "var(--cs-surface-alt)" }}>
            <p className="text-xs" style={{ color: "var(--cs-text-secondary)" }}>
              This readiness assessment is generated by Cara based on available evidence. It is a professional aid, not a prediction of inspection outcome.
              The Registered Manager must apply their own professional judgement.
            </p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
