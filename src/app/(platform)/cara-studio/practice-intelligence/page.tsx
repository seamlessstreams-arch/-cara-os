"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — HOME SCANNER DASHBOARD
//
// The daily/weekly practice intelligence scan: home dynamics, child summaries,
// risk patterns, practice drift alerts, training needs, oversight prompts,
// suggested sessions, repeated triggers, and therapeutic patterns.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Brain, Activity, AlertTriangle, Shield, Target,
  Sparkles, Users, BookOpen, ClipboardCheck, TrendingUp,
  RefreshCw, ChevronDown, ChevronRight, AlertOctagon,
  CheckCircle2, Clock, Zap, Eye,
} from "lucide-react";
import { demoSeedOne } from "@/lib/demo/demo-seed";

// ── Types ───────────────────────────────────────────────────────────────────

interface ChildScanSummary {
  child_id: string;
  child_name: string;
  overall_presentation: string;
  risk_level: string;
  recent_incidents: number;
  recent_positives: string[];
  concerns: string[];
  suggested_actions: string[];
}

interface RiskPattern {
  type: string;
  severity: string;
  description: string;
  suggested_response: string;
}

interface PracticeDriftAlert {
  area: string;
  description: string;
  severity: string;
  recommended_action: string;
}

interface OversightPrompt {
  oversight_type: string;
  child_id: string | null;
  reason: string;
  priority: string;
}

interface SuggestedSession {
  child_id: string | null;
  session_type: string;
  title: string;
  rationale: string;
  framework: string;
  priority: string;
}

interface TherapeuticPattern {
  pattern_type: string;
  description: string;
  clinical_hypothesis: string;
  suggested_approach: string;
}

interface ScanData {
  home_dynamics_summary: {
    emotional_climate: string;
    risk_level: string;
    risk_score: number;
    incident_count: number;
    missing_count: number;
    restraint_count: number;
    complaint_count: number;
    safeguarding_alerts: number;
    overdue_actions: number;
    key_themes: string[];
  };
  child_summaries: ChildScanSummary[];
  risk_patterns: RiskPattern[];
  practice_drift_alerts: PracticeDriftAlert[];
  training_need_alerts: { topic: string; reason: string; priority: string }[];
  oversight_prompts: OversightPrompt[];
  suggested_keywork: SuggestedSession[];
  suggested_reflective: SuggestedSession[];
  repeated_triggers: { child_id: string; trigger: string; frequency: number; suggested_response: string }[];
  therapeutic_patterns: TherapeuticPattern[];
}

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_SCAN: ScanData = {
  home_dynamics_summary: {
    emotional_climate: "mostly_settled",
    risk_level: "medium",
    risk_score: 7,
    incident_count: 3,
    missing_count: 1,
    restraint_count: 0,
    complaint_count: 0,
    safeguarding_alerts: 0,
    overdue_actions: 2,
    key_themes: ["Missing episodes", "Recording gaps"],
  },
  child_summaries: [
    { child_id: "child_1", child_name: "Jayden", overall_presentation: "mostly_settled", risk_level: "low", recent_incidents: 1, recent_positives: ["Good school attendance", "Positive key work session"], concerns: ["Slight withdrawal after cancelled family contact"], suggested_actions: ["Key work session focused on family feelings"] },
    { child_id: "child_2", child_name: "Amara", overall_presentation: "unsettled", risk_level: "medium", recent_incidents: 2, recent_positives: ["Engaged well in art session"], concerns: ["Self-isolating more", "Not eating with others"], suggested_actions: ["Review therapeutic profile", "Consider team formulation"] },
    { child_id: "child_3", child_name: "Reuben", overall_presentation: "mostly_settled", risk_level: "low", recent_incidents: 0, recent_positives: ["Helping younger children", "Good peer relationships", "Full education attendance"], concerns: [], suggested_actions: [] },
  ],
  risk_patterns: [
    { type: "missing_after_contact", severity: "medium", description: "Pattern of missing episodes following family contact for one young person.", suggested_response: "Review contact arrangements and add pre/post contact support plan." },
  ],
  practice_drift_alerts: [
    { area: "Child voice in recording", description: "65% of daily logs this week do not contain identifiable child voice.", severity: "medium", recommended_action: "Team briefing on capturing child voice. Add to next supervision." },
  ],
  training_need_alerts: [
    { topic: "Trauma-Informed Recording", reason: "Multiple daily logs use deficit-based language when describing behaviour.", priority: "medium" },
  ],
  oversight_prompts: [
    { oversight_type: "incident_oversight", child_id: "child_2", reason: "Incident involving Amara requires management oversight comment.", priority: "high" },
    { oversight_type: "missing_from_care_oversight", child_id: "child_1", reason: "Missing episode requires return home interview and management oversight.", priority: "high" },
  ],
  suggested_keywork: [
    { child_id: "child_1", session_type: "contact_debrief", title: "Family Contact Feelings — Jayden", rationale: "Cancelled contact visit last week. Jayden has been quieter since.", framework: "pace", priority: "medium" },
    { child_id: "child_2", session_type: "feelings_exploration", title: "Check-In — How Amara Is Feeling", rationale: "Increasing self-isolation. Gentle check-in recommended.", framework: "ddp", priority: "high" },
  ],
  suggested_reflective: [
    { child_id: null, session_type: "reflective_practice", title: "Team Reflective Practice — Supporting Children Through Contact", rationale: "Several children showing distress around family contact.", framework: "psychologically_informed", priority: "medium" },
  ],
  repeated_triggers: [
    { child_id: "child_1", trigger: "Family contact", frequency: 3, suggested_response: "Repeated trigger. Add structured pre/post contact support to care plan." },
  ],
  therapeutic_patterns: [
    { pattern_type: "withdrawal_increase", description: "Amara's self-isolation has increased over the past 2 weeks.", clinical_hypothesis: "This may indicate emotional overwhelm or a response to an unidentified stressor.", suggested_approach: "Gentle, non-intrusive check-ins using PACE. Ensure art materials are available." },
  ],
};

const CLIMATE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  settled: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Settled" },
  mostly_settled: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Mostly Settled" },
  unsettled: { bg: "bg-amber-50", text: "text-amber-700", label: "Unsettled" },
  challenging: { bg: "bg-red-50", text: "text-red-700", label: "Challenging" },
  in_crisis: { bg: "bg-red-100", text: "text-red-800", label: "In Crisis" },
};

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
  critical: "bg-red-100 text-red-800 border-red-300",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-blue-50 text-blue-600 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
  urgent: "bg-red-100 text-red-800 border-red-300",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function PracticeIntelligencePage() {
  const [scan] = useState<ScanData | null>(demoSeedOne(DEMO_SCAN));
  const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set<string>(["child_2"]));

  const toggleChild = (id: string) => {
    setExpandedChildren((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Live tenant: no demo scan to show. A real home's scanner is driven by its
  // own records, not this fixture, so it shows an empty state rather than fiction.
  if (!scan) {
    return (
      <PageShell title="Practice Intelligence" subtitle="AI-powered home dynamics scanner">
        <p className="text-sm text-[var(--cs-text-muted)]">
          No scan yet. Cara builds this from your home&rsquo;s own incidents, logs and key work as they&rsquo;re recorded.
        </p>
      </PageShell>
    );
  }

  const hd = scan.home_dynamics_summary;
  const climate = CLIMATE_STYLES[hd.emotional_climate] ?? CLIMATE_STYLES.unsettled;

  return (
    <PageShell title="Practice Intelligence" subtitle="AI-powered home dynamics scanner">
      <div className="space-y-6 pb-12">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Brain className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Practice Intelligence Scanner</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Cara scans incidents, daily logs, risk assessments, key work, and staffing data to surface patterns, practice drift, training needs, and suggested actions.
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--cs-navy)] hover:bg-[var(--cs-surface)] transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              Run Scan
            </button>
          </div>
        </div>

        {/* ── Home Dynamics Summary ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className={cn("rounded-xl border p-4", climate.bg, `border-${climate.text.replace("text-", "")}/20`)}>
            <p className={cn("text-2xl font-bold", climate.text)}>{climate.label}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Emotional Climate</p>
          </div>
          <div className={cn("rounded-xl border p-4", RISK_STYLES[hd.risk_level])}>
            <p className="text-2xl font-bold">{hd.risk_level}</p>
            <p className="text-[10px] uppercase tracking-wide mt-1">Risk Level</p>
          </div>
          <div className={cn("rounded-xl border p-4", hd.incident_count > 2 ? "border-amber-200 bg-amber-50" : "border-[var(--cs-border)] bg-white")}>
            <p className={cn("text-2xl font-bold", hd.incident_count > 2 ? "text-amber-700" : "text-[var(--cs-navy)]")}>{hd.incident_count}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Incidents</p>
          </div>
          <div className={cn("rounded-xl border p-4", hd.missing_count > 0 ? "border-red-200 bg-red-50" : "border-[var(--cs-border)] bg-white")}>
            <p className={cn("text-2xl font-bold", hd.missing_count > 0 ? "text-red-700" : "text-[var(--cs-navy)]")}>{hd.missing_count}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Missing</p>
          </div>
          <div className={cn("rounded-xl border p-4", hd.overdue_actions > 0 ? "border-amber-200 bg-amber-50" : "border-[var(--cs-border)] bg-white")}>
            <p className={cn("text-2xl font-bold", hd.overdue_actions > 0 ? "text-amber-700" : "text-[var(--cs-navy)]")}>{hd.overdue_actions}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Overdue Actions</p>
          </div>
        </div>

        {/* ── Key themes ─────────────────────────────────────────────────── */}
        {(hd.key_themes?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide self-center mr-1">Key Themes:</span>
            {(hd.key_themes ?? []).map((t, i) => (
              <Badge key={i} className="text-[10px] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border border-[var(--cs-cara-gold-soft)]">{t}</Badge>
            ))}
          </div>
        )}

        {/* ── Child Summaries ────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Children
          </h3>
          {scan.child_summaries.map((child) => {
            const isExpanded = expandedChildren.has(child.child_id);
            return (
              <div key={child.child_id} className={cn("rounded-xl border bg-white overflow-hidden", child.risk_level === "medium" ? "border-amber-200" : "border-[var(--cs-border)]")}>
                <button onClick={() => toggleChild(child.child_id)} className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-[var(--cs-surface)] transition-colors">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--cs-text-muted)]" />}
                  <span className="text-sm font-semibold text-[var(--cs-navy)]">{child.child_name}</span>
                  <Badge className={cn("text-[9px] border", RISK_STYLES[child.risk_level])}>{child.risk_level} risk</Badge>
                  <span className="text-[10px] text-[var(--cs-text-muted)] ml-auto">{child.recent_incidents} incident{child.recent_incidents !== 1 ? "s" : ""}</span>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-4 space-y-3 border-t border-[var(--cs-border)]">
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {child.recent_positives.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Positives
                          </p>
                          {child.recent_positives.map((p, i) => (
                            <div key={i} className="flex items-start gap-1.5 mb-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span className="text-xs text-[var(--cs-text-secondary)]">{p}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(child.concerns?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Concerns
                          </p>
                          {(child.concerns ?? []).map((c, i) => (
                            <div key={i} className="flex items-start gap-1.5 mb-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              <span className="text-xs text-[var(--cs-text-secondary)]">{c}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {(child.suggested_actions?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <Target className="h-3 w-3" /> Suggested Actions
                        </p>
                        {(child.suggested_actions ?? []).map((a, i) => (
                          <div key={i} className="flex items-start gap-1.5 mb-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--cs-cara-gold)] mt-1.5 shrink-0" />
                            <span className="text-xs text-[var(--cs-text-secondary)]">{a}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Risk Patterns ──────────────────────────────────────────────── */}
        {scan.risk_patterns.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-500" /> Risk Patterns
            </h3>
            {scan.risk_patterns.map((rp, i) => (
              <div key={i} className="rounded-xl border border-red-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--cs-navy)]">{rp.type.replace(/_/g, " ")}</span>
                  <Badge className={cn("text-[9px] border", RISK_STYLES[rp.severity])}>{rp.severity}</Badge>
                </div>
                <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{rp.description}</p>
                <p className="text-xs text-[var(--cs-navy)] font-medium mt-1">{rp.suggested_response}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Practice Drift Alerts ──────────────────────────────────────── */}
        {scan.practice_drift_alerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" /> Practice Drift Alerts
            </h3>
            {scan.practice_drift_alerts.map((pd, i) => (
              <div key={i} className="rounded-xl border border-amber-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--cs-navy)]">{pd.area}</span>
                  <Badge className={cn("text-[9px] border", RISK_STYLES[pd.severity])}>{pd.severity}</Badge>
                </div>
                <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{pd.description}</p>
                <p className="text-xs text-[var(--cs-navy)] font-medium">{pd.recommended_action}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Oversight Prompts & Suggested Sessions side by side ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scan.oversight_prompts.length > 0 && (
            <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
              <div className="px-4 py-2.5 bg-[var(--cs-surface)] border-b border-[var(--cs-border)] flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[var(--cs-navy)]" />
                <span className="text-xs font-semibold text-[var(--cs-navy)]">Oversight Prompts</span>
                <Badge className="text-[9px] ml-auto bg-red-50 text-red-700 border-red-200">{scan.oversight_prompts.length}</Badge>
              </div>
              <div className="p-4 space-y-2">
                {scan.oversight_prompts.map((op, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge className={cn("text-[9px] border shrink-0 mt-0.5", PRIORITY_STYLES[op.priority])}>{op.priority}</Badge>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{op.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(scan.suggested_keywork.length > 0 || scan.suggested_reflective.length > 0) && (
            <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
              <div className="px-4 py-2.5 bg-[var(--cs-surface)] border-b border-[var(--cs-border)] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
                <span className="text-xs font-semibold text-[var(--cs-navy)]">Suggested Sessions</span>
                <Badge className="text-[9px] ml-auto bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]">{scan.suggested_keywork.length + scan.suggested_reflective.length}</Badge>
              </div>
              <div className="p-4 space-y-2">
                {[...scan.suggested_keywork, ...scan.suggested_reflective].map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge className={cn("text-[9px] border shrink-0 mt-0.5", PRIORITY_STYLES[s.priority])}>{s.priority}</Badge>
                    <div>
                      <p className="text-xs font-medium text-[var(--cs-navy)]">{s.title}</p>
                      <p className="text-[10px] text-[var(--cs-text-muted)]">{s.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Therapeutic Patterns ────────────────────────────────────────── */}
        {scan.therapeutic_patterns.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" /> Therapeutic Patterns
            </h3>
            {scan.therapeutic_patterns.map((tp, i) => (
              <div key={i} className="rounded-xl border border-purple-200 bg-white p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="text-[9px] bg-purple-50 text-purple-700 border-purple-200">{tp.pattern_type.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{tp.description}</p>
                <div className="rounded-lg bg-purple-50 p-3">
                  <p className="text-[10px] font-semibold text-purple-800 uppercase tracking-wide mb-1">Clinical Hypothesis</p>
                  <p className="text-xs text-purple-700 leading-relaxed">{tp.clinical_hypothesis}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide mb-1">Suggested Approach</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">{tp.suggested_approach}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Repeated Triggers ──────────────────────────────────────────── */}
        {scan.repeated_triggers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" /> Repeated Triggers
            </h3>
            {scan.repeated_triggers.map((rt, i) => (
              <div key={i} className="rounded-xl border border-amber-200 bg-white p-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{rt.frequency}x</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--cs-navy)]">{rt.trigger}</p>
                  <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">{rt.suggested_response}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Training Needs ─────────────────────────────────────────────── */}
        {scan.training_need_alerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" /> Training Need Alerts
            </h3>
            {scan.training_need_alerts.map((tn, i) => (
              <div key={i} className="rounded-xl border border-blue-200 bg-white p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--cs-navy)]">{tn.topic}</span>
                  <Badge className={cn("text-[9px] border", PRIORITY_STYLES[tn.priority])}>{tn.priority}</Badge>
                </div>
                <p className="text-xs text-[var(--cs-text-secondary)]">{tn.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
