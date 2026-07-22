// ══════════════════════════════════════════════════════════════════════════════
// CARA — NOTIFICATION BOUNDARIES (doctrine 1.16 / 2.3.6)
//
// GET /api/v1/notification-boundaries            → the caller's own plan
// GET /api/v1/notification-boundaries?staff_id=… → another person's (manager)
//
// What would reach this person right now, and what is being held because they
// are off shift. Read only — it explains the delivery rules and audits Cara's
// own notification copy for guilt mechanics; it sends nothing.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { dal } from "@/lib/db/dal";
import { isOnShiftNow } from "@/lib/permissions/build-user-context";
import { generateNotifications } from "@/lib/notifications/notification-engine";
import { planDelivery, type DeliverableNotification } from "@/lib/notifications/delivery-boundaries";

export const dynamic = "force-dynamic";

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const asked = new URL(req.url).searchParams.get("staff_id");
    const staffId = asked ?? identity.userId;

    // Reading someone else's delivery plan is a management view of workload —
    // the doctrine wants capacity visible so trade-offs are negotiated, not
    // silently absorbed. Only managers may look at another person's.
    if (asked && asked !== identity.userId && identity.role !== "registered_manager" && identity.role !== "deputy_manager") {
      return NextResponse.json(
        { error: "Only a manager can view another person's delivery plan." },
        { status: 403 },
      );
    }

    const now = new Date();
    const onShift = isOnShiftNow(staffId, now);
    const notifications = generateNotifications(staffId).map<DeliverableNotification>((n) => ({
      id: n.id,
      type: n.type,
      priority: n.priority,
      title: n.title,
      body: n.body,
      created_at: n.created_at,
    }));

    const plan = planDelivery(notifications, onShift);
    const staff = (await safeList(dal.staff.findAll())).find((s) => s.id === staffId);

    return NextResponse.json({
      data: {
        staffId,
        staffName: staff?.full_name ?? staffId,
        onShift,
        ...plan,
        notifications,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
