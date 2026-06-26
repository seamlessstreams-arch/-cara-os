// ══════════════════════════════════════════════════════════════════════════════
// CARA — UNIFIED RULE CATALOG
//
// Cara's rules live in three places, each with a DIFFERENT (and appropriate)
// execution model:
//   1. automation/default-rules — config-editable trigger→action rules
//   2. compliance-rules — fixed regulatory pass/fail checks (Children's Homes
//      Regs 2015) that managers must resolve, never the model
//   3. cara/rules-engine — 78 deterministic command handlers feeding the AI
//      Gateway's rules-first ladder
//
// Forcing all three into ONE execution schema would be re-implementation, not
// consolidation — ~40% of the cara handlers are bespoke logic, and the
// compliance rules' regulatory clarity must be preserved. So this is the right
// consolidation: a single read-only CATALOG (governance view) that introspects
// all three into consistent metadata — "every rule Cara applies, from one place"
// — WITHOUT touching how any of them execute.
//
// Pure + deterministic. Read-only introspection; it never evaluates a rule.
// ══════════════════════════════════════════════════════════════════════════════

import { DEFAULT_RULES } from "@/lib/automation/default-rules";
import { getRuleHandledCommands } from "@/lib/cara/rules-engine";
import type { RuleCategory } from "@/lib/compliance-rules/compliance-rules-engine";

export type RuleSource = "automation" | "compliance" | "cara_rules";

export interface RuleCatalogEntry {
  /** Source-qualified id, unique across the whole catalog. */
  id: string;
  name: string;
  source: RuleSource;
  category: string;
  description?: string;
  /** The statutory/regulatory basis, where the rule enforces one. */
  statutoryBasis?: string;
  /** True when the rule is config-editable (automation); false when it is fixed
   *  in code (compliance pass/fail, cara handlers). */
  editable: boolean;
  enabled: boolean;
}

// The 7 compliance rules are computed dynamically by the compliance engine; this
// static descriptor lists them for the catalog with their regulatory basis.
const COMPLIANCE_RULES: { id: RuleCategory; name: string; statutoryBasis: string }[] = [
  { id: "mandatory-info", name: "Mandatory information outstanding", statutoryBasis: "Children's Homes Regs 2015 — record completeness" },
  { id: "approval-threshold", name: "High/critical record awaiting approval", statutoryBasis: "Reg 13 — leadership & management oversight" },
  { id: "safeguarding-notification", name: "Safeguarding notification outstanding", statutoryBasis: "Working Together 2026; Reg 40 notification" },
  { id: "physical-intervention-review", name: "Restraint debrief outstanding", statutoryBasis: "Reg 20 — restraint recording & review" },
  { id: "medication-error-followup", name: "Medication error candour outstanding", statutoryBasis: "Reg 23 — medicines; duty of candour" },
  { id: "training-expiry", name: "Mandatory training expired or expiring", statutoryBasis: "Reg 32 — staff fitness & training" },
  { id: "supervision-due", name: "Staff supervision overdue", statutoryBasis: "Reg 33 — staff support & supervision" },
];

function humanise(commandId: string): string {
  const s = commandId.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Coarse category for a cara rules-engine command, derived from its id prefix. */
export function categoriseCaraCommand(commandId: string): string {
  if (/^(improve_writing|professionalise_record|simplify_language|write_to_child|check_tone|convert_)/.test(commandId)) return "rewriting";
  if (/^(draft_|create_(?:agenda|meeting|document|management_action|onboarding)|prepare_|equality_)/.test(commandId)) return "drafting";
  if (/^(check_|review_|analyse_|responsible_individual_qa|monthly_quality|safer_recruitment_checklist)/.test(commandId)) return "quality_check";
  if (/^(extract_|identify_)/.test(commandId)) return "analysis";
  if (/^(create_(?:task|delegated|calendar)|suggest_|escalate_|trigger_|prioritise_)/.test(commandId)) return "task_automation";
  return "other";
}

/**
 * Build the unified rule catalog across all three rule systems. Deterministic —
 * reads the static automation/cara registries + the compliance descriptor; does
 * not include in-memory custom automation rules (those vary per instance).
 */
export function buildRuleCatalog(): RuleCatalogEntry[] {
  const entries: RuleCatalogEntry[] = [];

  for (const r of DEFAULT_RULES) {
    entries.push({
      id: `automation:${r.id}`,
      name: r.name,
      source: "automation",
      category: "trigger_automation",
      description: r.description,
      editable: true,
      enabled: r.enabled,
    });
  }

  for (const c of COMPLIANCE_RULES) {
    entries.push({
      id: `compliance:${c.id}`,
      name: c.name,
      source: "compliance",
      category: "regulatory_compliance",
      statutoryBasis: c.statutoryBasis,
      editable: false,
      enabled: true,
    });
  }

  for (const cmd of getRuleHandledCommands()) {
    entries.push({
      id: `cara:${cmd}`,
      name: humanise(cmd),
      source: "cara_rules",
      category: categoriseCaraCommand(cmd),
      editable: false,
      enabled: true,
    });
  }

  return entries;
}

export interface RuleCatalogSummary {
  total: number;
  by_source: Record<RuleSource, number>;
  by_category: { category: string; count: number }[];
  editable_count: number;
}

export function summariseRuleCatalog(catalog: RuleCatalogEntry[]): RuleCatalogSummary {
  const by_source: Record<RuleSource, number> = { automation: 0, compliance: 0, cara_rules: 0 };
  const catCounts = new Map<string, number>();
  let editable_count = 0;

  for (const e of catalog) {
    by_source[e.source] += 1;
    catCounts.set(e.category, (catCounts.get(e.category) ?? 0) + 1);
    if (e.editable) editable_count += 1;
  }

  const by_category = [...catCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return { total: catalog.length, by_source, by_category, editable_count };
}
