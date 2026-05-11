// ══════════════════════════════════════════════════════════════════════════════
// API — Notifications Center  (Milestone 27, extended in M34)
//
// GET  ?home_id=&include_dismissed=     → NotificationStream for the viewer.
//                                         Falls back to the viewer-agnostic
//                                         stream if no actor user is known.
// POST { home_id, notification_ids[], action: "read" | "unread"
//        | "dismiss" | "undismiss" }    → bulk per-user state mutation.
//
// Permission: aria.view_audit_logs (read), aria.commit_to_records (mutate).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import {
  loadNotifications,
  loadNotificationsForUser,
} from "@/lib/care-events/notifications";
import { db } from "@/lib/db/store";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  const includeDismissed =
    searchParams.get("include_dismissed") === "true";

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "view notifications stream",
  });
  if (!guard.ok) return guard.response;

  const userId = guard.actor.userId;
  const data =
    userId && userId !== "actor_unknown"
      ? loadNotificationsForUser(homeId, userId, { includeDismissed })
      : loadNotifications(homeId);

  return NextResponse.json({ data });
}

interface MutateBody {
  home_id?: string;
  notification_ids?: unknown;
  action?: "read" | "unread" | "dismiss" | "undismiss";
  actor_id?: string;
  actor_role?: string;
}

export async function POST(req: NextRequest) {
  let body: MutateBody;
  try {
    body = (await req.json()) as MutateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const homeId = body.home_id ?? DEFAULT_HOME_ID;
  const action = body.action;
  const ids = Array.isArray(body.notification_ids)
    ? body.notification_ids.filter((x): x is string => typeof x === "string")
    : [];

  if (!action || !["read", "unread", "dismiss", "undismiss"].includes(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "no_notification_ids" }, { status: 400 });
  }

  const guard = requireAriaStudioPermission(
    req,
    body as unknown as Record<string, unknown>,
    {
      permission: "aria.commit_to_records",
      homeId,
      intent: `notification.${action}`,
    },
  );
  if (!guard.ok) return guard.response;

  const userId = guard.actor.userId;
  if (!userId || userId === "actor_unknown") {
    return NextResponse.json({ error: "actor_required" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const updated: string[] = [];
  for (const notificationId of ids) {
    const patch: { read_at?: string | null; dismissed_at?: string | null } = {};
    if (action === "read") patch.read_at = now;
    else if (action === "unread") patch.read_at = null;
    else if (action === "dismiss") patch.dismissed_at = now;
    else if (action === "undismiss") patch.dismissed_at = null;

    db.userNotificationStates.upsert({
      user_id: userId,
      notification_id: notificationId,
      home_id: homeId,
      ...patch,
    });
    updated.push(notificationId);
  }

  appendAriaAudit({
    homeId,
    actorId: userId,
    actionType: "artifact_committed",
    summary: `notifications.${action} (${updated.length})`,
    sourceIds: updated,
  });

  return NextResponse.json({ data: { updated, action } });
}
