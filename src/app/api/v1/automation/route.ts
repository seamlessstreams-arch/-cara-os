// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATION ENGINE API ROUTE
// GET /api/v1/automation
// Returns all automation rules (default + custom) with run counts and status.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAllRules } from "@/lib/automation/automation-engine";

export async function GET() {
  try {
    const rules = getAllRules();

    const enabledCount = rules.filter((r) => r.enabled).length;
    const disabledCount = rules.filter((r) => !r.enabled).length;
    const totalRunCount = rules.reduce((sum, r) => sum + r.run_count, 0);

    // Group rules by trigger for summary
    const triggerCounts: Record<string, number> = {};
    for (const rule of rules) {
      triggerCounts[rule.trigger] = (triggerCounts[rule.trigger] ?? 0) + 1;
    }

    return NextResponse.json({
      data: {
        rules,
        summary: {
          total_rules: rules.length,
          enabled: enabledCount,
          disabled: disabledCount,
          total_runs: totalRunCount,
          triggers_covered: Object.keys(triggerCounts).length,
          trigger_counts: triggerCounts,
        },
      },
    });
  } catch (_err) {
    return NextResponse.json(
      { error: "Failed to fetch automation rules" },
      { status: 500 },
    );
  }
}
