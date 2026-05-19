import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { detectAllGaps } from "@/lib/aria/aria-studio-gaps";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";

const HOME_ID = "home_oak";

// GET /api/v1/aria-studio/gaps
// Returns detected evidence gaps. Persists new gaps found.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? HOME_ID;
  const childId = searchParams.get("child_id");
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const refresh = searchParams.get("refresh") === "true";

  // If refresh requested, run detection and persist new gaps
  if (refresh) {
    const detected = await detectAllGaps(homeId);
    for (const gap of detected) {
      // Only add if not already open with same type/child
      const existing = db.ariaGaps.findAll(homeId).find(
        (g) => g.gap_type === gap.gap_type && g.child_id === gap.child_id && g.status === "open"
      );
      if (!existing) {
        db.ariaGaps.create(gap);
      }
    }
  }

  let items = db.ariaGaps.findAll(homeId);

  if (childId) items = items.filter((g) => g.child_id === childId);
  if (status) items = items.filter((g) => g.status === status);
  if (severity) items = items.filter((g) => g.severity === severity);

  items = items.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
  });

  return NextResponse.json({
    data: items,
    meta: {
      total: items.length,
      critical: items.filter((g) => g.severity === "critical").length,
      high: items.filter((g) => g.severity === "high").length,
      open: items.filter((g) => g.status === "open").length,
    },
  });
}

// PATCH /api/v1/aria-studio/gaps
// Update gap status (acknowledge, resolve, assign)
export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const gapId = body.id as string;
  if (!gapId) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.create_tasks",
    homeId: HOME_ID,
    intent: `update gap ${gapId}`,
  });
  if (!guard.ok) return guard.response;

  const gap = db.ariaGaps.patch(gapId, {
    status: (body.status as never) ?? undefined,
    assigned_to: (body.assigned_to as string) ?? undefined,
    resolved_at: body.status === "resolved" ? new Date().toISOString() : undefined,
  });

  if (!gap) return NextResponse.json({ error: "Gap not found" }, { status: 404 });

  return NextResponse.json({ data: gap });
}
