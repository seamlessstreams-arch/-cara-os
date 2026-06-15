import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/db/store";
import { getStaffName } from "@/lib/seed-data";
import type { IssueType } from "@/lib/writing-assistant/types";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = ["accepted", "ignored"] as const;

// ── GET — manager audit reporting ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.USE_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") ?? "7", 10), 1), 365);
  const filterUser = searchParams.get("userId") ?? undefined;
  const filterAction = (searchParams.get("action") as "accepted" | "ignored") ?? undefined;

  const all = db.writingAssistant.getAllAuditEvents(days, filterUser, filterAction);

  // Aggregate stats
  const total = all.length;
  const accepted = all.filter((e) => e.action === "accepted").length;
  const ignored = total - accepted;
  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  // By issue type
  const byIssueType: Record<string, { accepted: number; ignored: number }> = {};
  for (const e of all) {
    if (!byIssueType[e.issue_type]) byIssueType[e.issue_type] = { accepted: 0, ignored: 0 };
    byIssueType[e.issue_type][e.action]++;
  }

  // By staff — sorted by total activity
  const staffMap: Record<string, { accepted: number; ignored: number }> = {};
  for (const e of all) {
    if (!staffMap[e.user_id]) staffMap[e.user_id] = { accepted: 0, ignored: 0 };
    staffMap[e.user_id][e.action]++;
  }
  const byStaff = Object.entries(staffMap)
    .map(([userId, counts]) => ({
      userId,
      name: getStaffName(userId),
      total: counts.accepted + counts.ignored,
      accepted: counts.accepted,
      ignored: counts.ignored,
      rate: counts.accepted + counts.ignored > 0
        ? Math.round((counts.accepted / (counts.accepted + counts.ignored)) * 100)
        : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Recent events (last 50, newest first) with resolved staff name
  const recent = [...all]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 50)
    .map((e) => ({ ...e, staffName: getStaffName(e.user_id) }));

  return NextResponse.json({
    data: { stats: { total, accepted, ignored, acceptanceRate, days }, byIssueType, byStaff, recent },
  });
}

// ── POST — log a single accept/ignore event ───────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.USE_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;

  const uid = req.headers.get("x-user-id") ?? req.headers.get("x-cs-user-id");
  if (!uid) return NextResponse.json({ error: "x-user-id required" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action as string;
  if (!VALID_ACTIONS.includes(action as "accepted" | "ignored")) {
    return NextResponse.json({ error: "action must be 'accepted' or 'ignored'" }, { status: 400 });
  }
  const issue_type = typeof body.issue_type === "string" ? (body.issue_type as IssueType) : undefined;
  if (!issue_type) return NextResponse.json({ error: "issue_type required" }, { status: 400 });

  const rec = db.writingAssistant.logAudit({
    user_id: uid,
    action: action as "accepted" | "ignored",
    issue_type,
    original_text: typeof body.original_text === "string" ? body.original_text.slice(0, 200) : "",
    replacement_text: typeof body.replacement_text === "string" ? body.replacement_text.slice(0, 200) : undefined,
    record_type: typeof body.record_type === "string" ? body.record_type : undefined,
    field_name: typeof body.field_name === "string" ? body.field_name : undefined,
    child_id: typeof body.child_id === "string" ? body.child_id : undefined,
  });

  return NextResponse.json({ data: rec }, { status: 201 });
}
