import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { dal } from "@/lib/db/dal";
import {
  DEFAULT_CHECK_TEMPLATES,
  computeCheckStatuses,
} from "@/lib/recurring-checks/recurring-checks-engine";
import { isFeatureEnabled } from "@/lib/config/feature-flags";

export const dynamic = "force-dynamic";

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole dashboard.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

// GET /api/v1/recurring-checks — this period's status per check template
// (done / pending / not_created), read straight off the task list. Read-only;
// the flag-gated cron job is what materialises tasks.
export async function GET(request: NextRequest) {
  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const now = new Date().toISOString();
  const allTasks = await safeList(dal.tasks.findAll());
  const statuses = computeCheckStatuses(DEFAULT_CHECK_TEMPLATES, allTasks, now);
  return NextResponse.json({
    data: {
      materialiser_enabled: isFeatureEnabled("recurring_checks"),
      checks: statuses,
      summary: {
        done: statuses.filter((s) => s.status === "done").length,
        pending: statuses.filter((s) => s.status === "pending").length,
        not_created: statuses.filter((s) => s.status === "not_created").length,
      },
    },
  });
}
