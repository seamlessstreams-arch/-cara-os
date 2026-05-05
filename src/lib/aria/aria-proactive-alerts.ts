// ══════════════════════════════════════════════════════════════════════════════
// ARIA V2 — PROACTIVE ALERTS ENGINE
//
// Combines pattern detection, voice gap analysis, and compliance monitoring
// into a single alert stream. Generates structured alerts that surface on the
// dashboard, in the patterns page, and in ARIA suggestions.
//
// Alert sources:
//   - Pattern engine: behavioural and incident patterns
//   - Voice gap analysis: missing child voice
//   - Compliance monitoring: overdue reviews, expired documents, training gaps
//   - Regulatory triggers: Reg 44 overdue, Reg 45 quality of care review
//
// Every alert includes: what was detected, why it matters, what to do, and
// a reflective prompt for the manager.
// ══════════════════════════════════════════════════════════════════════════════

import type { PatternAlert } from "@/types/extended";
import {
  scanForPatterns,
  patternsToAlerts,
  type IncidentRecord,
  type PatternScanConfig,
} from "@/lib/aria/aria-pattern-engine";
import {
  scanVoiceGaps,
  summariseVoiceGaps,
  type ChildRecord,
  type IncidentSummary,
  type VoiceGap,
  type VoiceGapSummary,
  type VoiceGapScanConfig,
} from "@/lib/aria/aria-voice-gap-analysis";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AlertSource = "pattern_engine" | "voice_gap" | "compliance" | "regulatory";

export interface ProactiveAlert {
  id: string;
  source: AlertSource;
  category: string;
  title: string;
  description: string;
  severity: "urgent" | "high" | "medium" | "low";
  childId: string | null;
  recommendation: string;
  reflectivePrompt: string;
  evidenceSummary: string;
  detectedAt: string;
  actionRequired: boolean;
}

export interface ComplianceCheck {
  checkType: string;
  childId?: string;
  childName?: string;
  label: string;
  lastCompleted?: string;
  dueDate: string;
  overdueDays: number;
}

export interface AlertScanResult {
  alerts: ProactiveAlert[];
  patternAlerts: Omit<PatternAlert, "created_at">[];
  voiceGaps: VoiceGap[];
  voiceGapSummary: VoiceGapSummary;
  complianceGaps: ComplianceCheck[];
  totalAlerts: number;
  urgentCount: number;
  highCount: number;
}

// ── Main scan ─────────────────────────────────────────────────────────────────

export function runProactiveAlertScan(input: {
  incidents: IncidentRecord[];
  childRecords: ChildRecord[];
  incidentSummaries: IncidentSummary[];
  children: { id: string; name: string }[];
  complianceChecks: ComplianceCheck[];
  homeId: string;
  patternConfig?: PatternScanConfig;
  voiceConfig?: VoiceGapScanConfig;
}): AlertScanResult {
  const now = new Date().toISOString();
  const alerts: ProactiveAlert[] = [];

  // ── 1. Pattern detection ──────────────────────────────────────────────
  const patterns = scanForPatterns(input.incidents, {
    homeId: input.homeId,
    ...input.patternConfig,
  });
  const patternAlerts = patternsToAlerts(patterns, input.homeId);

  for (const p of patterns) {
    alerts.push({
      id: `pa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source: "pattern_engine",
      category: p.type,
      title: p.title,
      description: p.description,
      severity: p.severity as ProactiveAlert["severity"],
      childId: p.childId ?? null,
      recommendation: p.reflectivePrompt,
      reflectivePrompt: p.reflectivePrompt,
      evidenceSummary: p.evidenceRefs.map((e) => e.excerpt).join("; "),
      detectedAt: now,
      actionRequired: p.severity === "critical" || p.severity === "high",
    });
  }

  // ── 2. Voice gap analysis ─────────────────────────────────────────────
  const voiceGaps = scanVoiceGaps(
    input.childRecords,
    input.incidentSummaries,
    input.children,
    input.voiceConfig,
  );
  const voiceGapSummary = summariseVoiceGaps(voiceGaps, input.children.length);

  for (const g of voiceGaps) {
    alerts.push({
      id: `va_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source: "voice_gap",
      category: g.gapType,
      title: g.title,
      description: g.description,
      severity: g.severity,
      childId: g.childId,
      recommendation: g.recommendation,
      reflectivePrompt: `Consider: is the child's voice visible enough in the records? Would an inspector reading this child's file feel confident that the child has been listened to?`,
      evidenceSummary: g.evidenceSummary,
      detectedAt: now,
      actionRequired: g.severity === "urgent" || g.severity === "high",
    });
  }

  // ── 3. Compliance gaps ────────────────────────────────────────────────
  const complianceGaps = input.complianceChecks.filter((c) => c.overdueDays > 0);

  for (const c of complianceGaps) {
    const isUrgent = c.overdueDays > 30;
    const isHigh = c.overdueDays > 14;
    alerts.push({
      id: `ca_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source: "compliance",
      category: c.checkType,
      title: `${c.label} overdue by ${c.overdueDays} days${c.childName ? ` — ${c.childName}` : ""}`,
      description: `${c.label} was due on ${c.dueDate} and is now ${c.overdueDays} days overdue.${c.lastCompleted ? ` Last completed: ${c.lastCompleted}.` : ""} Overdue compliance items are flagged at inspection and may indicate drift in care planning.`,
      severity: isUrgent ? "urgent" : isHigh ? "high" : "medium",
      childId: c.childId ?? null,
      recommendation: `Schedule and complete this review as soon as possible. If there are barriers to completion, record the reason and escalate to the line manager.`,
      reflectivePrompt: `Why is this overdue? Is there a systemic issue causing compliance drift, or is this an isolated delay?`,
      evidenceSummary: `Due: ${c.dueDate}. Overdue by ${c.overdueDays} days.${c.lastCompleted ? ` Last completed: ${c.lastCompleted}.` : ""}`,
      detectedAt: now,
      actionRequired: true,
    });
  }

  // ── 4. Regulatory triggers ────────────────────────────────────────────
  // These are generated from compliance checks with specific regulatory types
  const regulatoryChecks = complianceGaps.filter(
    (c) => c.checkType === "reg44" || c.checkType === "reg45" || c.checkType === "annual_review" || c.checkType === "statement_of_purpose",
  );

  for (const r of regulatoryChecks) {
    alerts.push({
      id: `ra_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source: "regulatory",
      category: r.checkType,
      title: `Regulatory requirement overdue: ${r.label}`,
      description: `${r.label} is a regulatory requirement and is ${r.overdueDays} days overdue. This will be identified at inspection and may affect the home's judgement.`,
      severity: r.overdueDays > 30 ? "urgent" : "high",
      childId: null,
      recommendation: `Complete immediately. If the Reg 44 visitor cannot visit this month, record the reason and arrange as soon as possible. For Reg 45, ensure the RI schedules the quality of care review.`,
      reflectivePrompt: `Is there a systemic issue preventing regulatory compliance? Does the home need additional support or capacity?`,
      evidenceSummary: `${r.label} due ${r.dueDate}, overdue by ${r.overdueDays} days.`,
      detectedAt: now,
      actionRequired: true,
    });
  }

  // ── Sort by severity ──────────────────────────────────────────────────
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => (priorityOrder[a.severity] ?? 3) - (priorityOrder[b.severity] ?? 3));

  return {
    alerts,
    patternAlerts,
    voiceGaps,
    voiceGapSummary,
    complianceGaps,
    totalAlerts: alerts.length,
    urgentCount: alerts.filter((a) => a.severity === "urgent").length,
    highCount: alerts.filter((a) => a.severity === "high").length,
  };
}

// ── Dashboard summary ─────────────────────────────────────────────────────────

export interface AlertDashboardSummary {
  totalAlerts: number;
  urgentCount: number;
  highCount: number;
  mediumCount: number;
  bySource: Record<AlertSource, number>;
  childrenAffected: number;
  topAlerts: ProactiveAlert[];
  voiceGapSummary: VoiceGapSummary;
}

export function buildAlertDashboardSummary(result: AlertScanResult): AlertDashboardSummary {
  const bySource: Record<AlertSource, number> = {
    pattern_engine: 0,
    voice_gap: 0,
    compliance: 0,
    regulatory: 0,
  };
  for (const a of result.alerts) {
    bySource[a.source]++;
  }

  return {
    totalAlerts: result.totalAlerts,
    urgentCount: result.urgentCount,
    highCount: result.highCount,
    mediumCount: result.alerts.filter((a) => a.severity === "medium").length,
    bySource,
    childrenAffected: new Set(result.alerts.filter((a) => a.childId).map((a) => a.childId)).size,
    topAlerts: result.alerts.slice(0, 5),
    voiceGapSummary: result.voiceGapSummary,
  };
}
