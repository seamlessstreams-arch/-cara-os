// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECURRING-CHECK MATERIALISER (the side-effecting half of M2)
//
// Runs on the Phase-1 cron endpoint. For every active template whose current
// period has no task yet, creates ONE task carrying the idempotency marker —
// re-runs create nothing. Flag-gated (recurring_checks, opt-in default OFF):
// off = no tasks are ever created, the engine stays read-only.
// ══════════════════════════════════════════════════════════════════════════════

import { db, getStore } from "@/lib/db/store";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import {
  DEFAULT_CHECK_TEMPLATES,
  computeMissingChecks,
} from "./recurring-checks-engine";

export function materialiseRecurringChecks(nowIso: string): {
  enabled: boolean;
  created: number;
  considered: number;
} {
  if (!isFeatureEnabled("recurring_checks")) {
    return { enabled: false, created: 0, considered: 0 };
  }
  const tasks = getStore().tasks;
  const missing = computeMissingChecks(DEFAULT_CHECK_TEMPLATES, tasks, nowIso);
  for (const m of missing) {
    db.tasks.create({
      title: m.template.name,
      description: `${m.template.description}${m.template.regulatory_ref ? ` (${m.template.regulatory_ref})` : ""} ${m.marker}`,
      category: m.template.category as never,
      priority: "medium" as never,
      status: "pending" as never,
      assigned_to: null,
      assigned_role: m.template.assigned_role as never,
      due_date: m.due_date,
      created_by: "system_recurring_checks",
    });
  }
  return {
    enabled: true,
    created: missing.length,
    considered: DEFAULT_CHECK_TEMPLATES.filter((t) => t.active).length,
  };
}
