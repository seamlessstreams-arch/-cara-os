import { NextRequest, NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import { runDueReminders } from "@/lib/calendar/calendar-service";
import { materialiseRecurringChecks } from "@/lib/recurring-checks/materialise";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SCHEDULED JOBS ENDPOINT (Phase 1 infra · 3/3, Vercel cron)
//
// Vercel cron invokes this on the schedule in vercel.json. It runs the registered
// idempotent sweeps (currently the calendar reminder sweep — runDueReminders,
// which dedupes per occurrence, so repeat runs are safe).
//
// Gating (in order):
//   1. Feature flag — isFeatureEnabled("cron_scheduler"), OPT-IN default OFF. When
//      off (the demo's state) the endpoint is a 200 no-op: a disabled scheduler
//      must never error, and the cron firing on the demo does nothing.
//   2. Secret configured — CRON_SECRET must be set to run authenticated. Vercel
//      automatically sends `Authorization: Bearer $CRON_SECRET` when it is set.
//   3. Authorised — the header must match. Fail-closed (401) otherwise, so the
//      endpoint can't be triggered by an unauthenticated caller.
//
// NOTE: the trajectory escalation / ack-overdue states are computed on READ for
// dashboards (pure projections) — they don't need a scheduled sweep. Add only
// genuinely side-effecting, idempotent jobs to JOBS below.
// ══════════════════════════════════════════════════════════════════════════════

interface JobResult {
  name: string;
  ok: boolean;
  detail?: Record<string, unknown>;
  error?: string;
}

/** Registered scheduled jobs. Each must be idempotent (safe to run repeatedly). */
const JOBS: { name: string; run: (now: string) => Record<string, unknown> }[] = [
  { name: "due_reminders", run: (now) => runDueReminders(now) },
  // Flag-gated internally (recurring_checks): off → {enabled:false, created:0}.
  { name: "recurring_checks", run: (now) => materialiseRecurringChecks(now) },
];

function isAuthorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(request: NextRequest): Promise<NextResponse> {
  // 1. Disabled → no-op (demo-safe; the cron may still fire, it just does nothing).
  if (!isFeatureEnabled("cron_scheduler")) {
    return NextResponse.json({ ran: false, reason: "cron_scheduler flag is off" });
  }
  // 2. Must be configured with a secret to run authenticated.
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { ran: false, error: "CRON_SECRET not configured — cannot run scheduled jobs authenticated." },
      { status: 500 },
    );
  }
  // 3. Verify the caller.
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const jobs: JobResult[] = [];
  for (const job of JOBS) {
    try {
      jobs.push({ name: job.name, ok: true, detail: job.run(now) });
    } catch (e) {
      // One failing job must not abort the others.
      jobs.push({ name: job.name, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return NextResponse.json({ ran: true, at: now, jobs });
}

// Vercel cron issues a GET; POST is accepted for a manual authenticated trigger.
export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
