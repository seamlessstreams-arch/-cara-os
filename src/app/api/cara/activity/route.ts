// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/activity
// GET — returns Cara activity statistics for the current home. Powers the
// Cara activity widget on dashboards and the management Cara page.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

export interface ActivityStats {
  totalRequests: number;
  totalOutputs: number;
  approvedOutputs: number;
  rejectedOutputs: number;
  committedOutputs: number;
  pendingOutputs: number;
  transcriptions: number;
  tasksCreated: number;
  topCommands: Array<{ commandId: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  approvalRate: number;
  avgConfidence: string;
}

// ── Pure computation helpers (extracted for testing) ────────────────────────

export function computeTopEntries<T extends Record<string, string>>(
  items: T[],
  key: keyof T,
  limit = 10,
): Array<{ id: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const val = item[key] as string;
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}

export function computeApprovalRate(approved: number, rejected: number): number {
  const decided = approved + rejected;
  return decided > 0 ? Math.round((approved / decided) * 100) : 0;
}

export function computeAvgConfidence(
  outputs: Array<{ confidence: string }>,
): string {
  const confMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
  const confValues = outputs
    .map((o) => confMap[o.confidence])
    .filter(Boolean);
  const avgConf =
    confValues.length > 0
      ? confValues.reduce((a, b) => a + b, 0) / confValues.length
      : 0;
  return avgConf >= 2.5 ? "high" : avgConf >= 1.5 ? "medium" : "low";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? undefined;
  const days = Math.min(
    Number.parseInt(url.searchParams.get("days") ?? "30", 10) || 30,
    90,
  );

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ data: getDemoStats() });
  }

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({ data: getDemoStats() });
  }
  const supabase = loose(supabaseRaw);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  // Run queries in parallel
  const [
    requestsResult,
    outputsResult,
    transcriptionsResult,
    tasksResult,
  ] = await Promise.all([
    // Total requests
    (supabase.from("cara_requests") as any)
      .select("id, command_id, user_id")
      .gte("created_at", cutoffISO)
      .limit(1000),
    // Outputs with statuses
    (supabase.from("cara_outputs") as any)
      .select("id, status, confidence")
      .gte("created_at", cutoffISO)
      .limit(1000),
    // Transcriptions
    (supabase.from("cara_transcriptions") as any)
      .select("id")
      .gte("created_at", cutoffISO)
      .limit(1000),
    // Task links
    (supabase.from("cara_task_links") as any)
      .select("id")
      .gte("created_at", cutoffISO)
      .limit(1000),
  ]);

  const requests = (requestsResult.data ?? []) as Array<{
    id: string;
    command_id: string;
    user_id: string;
  }>;
  const outputs = (outputsResult.data ?? []) as Array<{
    id: string;
    status: string;
    confidence: string;
  }>;
  const transcriptions = (transcriptionsResult.data ?? []) as Array<{ id: string }>;
  const tasks = (tasksResult.data ?? []) as Array<{ id: string }>;

  // Compute top commands
  const commandCounts = new Map<string, number>();
  for (const r of requests) {
    commandCounts.set(r.command_id, (commandCounts.get(r.command_id) ?? 0) + 1);
  }
  const topCommands = [...commandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([commandId, count]) => ({ commandId, count }));

  // Compute top users
  const userCounts = new Map<string, number>();
  for (const r of requests) {
    userCounts.set(r.user_id, (userCounts.get(r.user_id) ?? 0) + 1);
  }
  const topUsers = [...userCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, count }));

  // Compute statuses
  const approved = outputs.filter((o) => o.status === "approved").length;
  const rejected = outputs.filter((o) => o.status === "rejected").length;
  const committed = outputs.filter((o) => o.status === "committed").length;
  const pending = outputs.filter(
    (o) => o.status === "draft" || o.status === "submitted_for_approval",
  ).length;

  // Approval rate
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;

  // Average confidence
  const confMap = { low: 1, medium: 2, high: 3 };
  const confValues = outputs
    .map((o) => confMap[o.confidence as keyof typeof confMap])
    .filter(Boolean);
  const avgConf =
    confValues.length > 0
      ? confValues.reduce((a, b) => a + b, 0) / confValues.length
      : 0;
  const avgConfidence =
    avgConf >= 2.5 ? "high" : avgConf >= 1.5 ? "medium" : "low";

  const stats: ActivityStats = {
    totalRequests: requests.length,
    totalOutputs: outputs.length,
    approvedOutputs: approved,
    rejectedOutputs: rejected,
    committedOutputs: committed,
    pendingOutputs: pending,
    transcriptions: transcriptions.length,
    tasksCreated: tasks.length,
    topCommands,
    topUsers,
    approvalRate,
    avgConfidence,
  };

  return NextResponse.json({ data: stats });
}

export function getDemoStats(): ActivityStats {
  return {
    totalRequests: 47,
    totalOutputs: 42,
    approvedOutputs: 28,
    rejectedOutputs: 5,
    committedOutputs: 22,
    pendingOutputs: 9,
    transcriptions: 12,
    tasksCreated: 15,
    topCommands: [
      { commandId: "improve_writing", count: 12 },
      { commandId: "draft_daily_log", count: 8 },
      { commandId: "draft_management_oversight", count: 6 },
      { commandId: "summarise_text", count: 5 },
      { commandId: "extract_actions", count: 4 },
    ],
    topUsers: [
      { userId: "staff_darren", count: 24 },
      { userId: "staff_sarah", count: 13 },
      { userId: "staff_mark", count: 10 },
    ],
    approvalRate: 85,
    avgConfidence: "medium",
  };
}
