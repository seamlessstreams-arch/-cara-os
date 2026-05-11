// ══════════════════════════════════════════════════════════════════════════════
// Care Event Pattern → Reg 45 Evidence Bridge  (Milestone 18)
//
// Promotes detected care-event patterns into Reg 45 evidence chips. Each chip
// is created as ai_draft (provisional) — a manager must accept, defer or
// reject before it influences the Reg 45 report wording.
//
// Idempotent: source_id is deterministic on (type, child|home, category|*,
// period_start), so re-promotion refreshes the existing chip in place rather
// than producing duplicates. A previously accepted/rejected/included chip
// keeps its manager decision; only the title/summary/severity/sentiment are
// refreshed.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import {
  scanCareEventPatterns,
  type CareEventPattern,
  type CareEventPatternType,
  type PatternScanOptions,
} from "@/lib/care-events/pattern-detection";
import type {
  AriaReg45EvidenceItem,
  AriaReg45EvidenceSentiment,
  AriaReg45Theme,
  AriaPatternSeverity,
} from "@/types/aria-studio";

const PATTERN_SOURCE_TABLE = "care_event_patterns";

const TYPE_TO_THEME: Record<CareEventPatternType, AriaReg45Theme> = {
  frequency_cluster:    "quality_of_care",
  safeguarding_spike:   "safeguarding",
  behaviour_escalation: "safeguarding",
  time_of_day_cluster:  "quality_of_care",
  cross_child_theme:    "leadership_management",
};

function defaultPeriod(lookbackDays: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - lookbackDays);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function deterministicSourceId(p: CareEventPattern): string {
  const child = p.child_id ?? "home";
  const cat = p.category ?? "_";
  return `${p.type}::${child}::${cat}::${p.period_start}`;
}

function severityForChip(p: CareEventPattern): AriaPatternSeverity {
  // CareEventPatternSeverity is low|medium|high; AriaPatternSeverity adds critical.
  // Map high→high (we don't escalate to critical without manager review).
  return p.severity === "high" ? "high" : p.severity === "medium" ? "medium" : "low";
}

function sentimentFor(p: CareEventPattern): AriaReg45EvidenceSentiment {
  // Patterns describe operational concerns or themes worth noting.
  return p.severity === "low" ? "neutral" : "concern";
}

function themeFor(p: CareEventPattern): AriaReg45Theme {
  // Allow category-driven overrides for finer-grained Reg 45 themes.
  if (p.category === "education") return "education";
  if (p.category === "health" || p.category === "medication") return "health";
  if (p.category === "family_contact") return "contact_with_family";
  if (p.category === "complaint") return "complaints_voice";
  return TYPE_TO_THEME[p.type];
}

export interface PromotionResult {
  home_id: string;
  period_start: string;
  period_end: string;
  scanned: number;
  created: number;
  refreshed: number;
  skipped_locked: number;
  items: AriaReg45EvidenceItem[];
}

export interface PromoteOptions extends PatternScanOptions {
  periodStart?: string;
  periodEnd?: string;
}

export function promoteCareEventPatternsToReg45(
  homeId: string,
  options: PromoteOptions = {},
): PromotionResult {
  const lookback = options.lookbackDays ?? 30;
  const def = defaultPeriod(lookback);
  const periodStart = options.periodStart ?? def.start;
  const periodEnd = options.periodEnd ?? def.end;

  // Override the scan window so the chip period_* matches what we promote.
  const patterns = scanCareEventPatterns(homeId, options).map((p) => ({
    ...p,
    period_start: periodStart,
    period_end: periodEnd,
  }));

  let created = 0;
  let refreshed = 0;
  let skippedLocked = 0;
  const items: AriaReg45EvidenceItem[] = [];

  for (const p of patterns) {
    const sourceId = deterministicSourceId(p);
    const existing = db.ariaReg45EvidenceItems.findBySource(homeId, PATTERN_SOURCE_TABLE, sourceId);
    const draftPayload = {
      title: p.title,
      summary: `${p.description} Reflective prompt: ${p.reflective_prompt}`,
      severity: severityForChip(p),
      sentiment: sentimentFor(p),
      theme: themeFor(p),
      occurred_at: periodEnd,
      period_start: periodStart,
      period_end: periodEnd,
    };

    if (existing) {
      // Locked into the report — do not silently overwrite the manager's decision.
      if (existing.status === "included_in_report") {
        skippedLocked += 1;
        items.push(existing);
        continue;
      }
      const patched = db.ariaReg45EvidenceItems.patch(existing.id, draftPayload);
      if (patched) {
        refreshed += 1;
        items.push(patched);
      } else {
        items.push(existing);
      }
      continue;
    }

    const created_item = db.ariaReg45EvidenceItems.create({
      home_id: homeId,
      child_id: p.child_id,
      theme: themeFor(p),
      title: p.title,
      summary: draftPayload.summary,
      severity: draftPayload.severity,
      sentiment: draftPayload.sentiment,
      source_type: "management_oversight",
      source_table: PATTERN_SOURCE_TABLE,
      source_id: sourceId,
      occurred_at: periodEnd,
      period_start: periodStart,
      period_end: periodEnd,
      status: "ai_draft",
      is_ai_draft: true,
      generated_at: new Date().toISOString(),
      decided_by: null,
      decided_at: null,
      decision_note: null,
      included_in_report_id: null,
    });
    created += 1;
    items.push(created_item);
  }

  return {
    home_id: homeId,
    period_start: periodStart,
    period_end: periodEnd,
    scanned: patterns.length,
    created,
    refreshed,
    skipped_locked: skippedLocked,
    items,
  };
}
