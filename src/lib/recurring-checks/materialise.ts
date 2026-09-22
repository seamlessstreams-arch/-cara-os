// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECURRING-CHECK MATERIALISER (the side-effecting half of M2)
//
// Runs on the Phase-1 cron endpoint. For every active template whose current
// period has no task yet, creates ONE task carrying the idempotency marker —
// re-runs create nothing. Flag-gated (recurring_checks, opt-in default OFF):
// off = no tasks are ever created, the engine stays read-only.
// ══════════════════════════════════════════════════════════════════════════════

import { dal } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import {
  DEFAULT_CHECK_TEMPLATES,
  computeMissingChecks,
} from "./recurring-checks-engine";

export async function materialiseRecurringChecks(nowIso: string): Promise<{
  enabled: boolean;
  created: number;
  considered: number;
}> {
  if (!isFeatureEnabled("recurring_checks")) {
    return { enabled: false, created: 0, considered: 0 };
  }
  // Through the dal. Reading getStore().tasks meant that on a live tenant the
  // existing-task check saw an EMPTY list, so every template looked missing and
  // the sweep would re-create the whole set on each fresh container — into the
  // in-memory store, where the Tasks page (which reads the table) never sees them.
  const tasks = await dal.tasks.findAll();
  const missing = computeMissingChecks(DEFAULT_CHECK_TEMPLATES, tasks, nowIso);
  for (const m of missing) {
    await dal.tasks.create({
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
