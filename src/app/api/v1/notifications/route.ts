// ══════════════════════════════════════════════════════════════════════════════
// API: GET/POST/PATCH /api/v1/notifications
//
// Dedicated route, taking precedence over the generic catch-all
// (`/api/v1/[...slug]`), which could not serve this collection correctly:
//
//   1. It resolved `notifications` through DAL_MAP, but dal.notifications has no
//      findAll — every GET threw `dalCol.findAll is not a function` and returned
//      500 ("Failed to fetch notifications" in the UI).
//   2. Its fallback read the in-memory demo store, so a live tenant was shown
//      seed notifications rather than its own.
//   3. It ignores `recipient_id` entirely and applies no auth, so a working
//      version of it would have returned the whole home's notifications to any
//      caller. Notifications quote incidents, safeguarding concerns and
//      medication events by name — they are not home-wide reading.
//
// Scoping rule: the recipient is taken from the SESSION, never from the query
// string. `recipient_id` is accepted and ignored in activated mode — a client
// cannot read another staff member's notifications by changing it. Reads use the
// service-role client (RLS bypassed), so this is the only thing enforcing it.
// In demo mode identity comes from the X-User-Id header convention, as elsewhere.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// ── GET /api/v1/notifications ────────────────────────────────────────────────
// Query: unread_only=true (default false — the full page wants read ones too).
//        recipient_id is accepted for backwards compatibility and ignored.
export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const unreadOnly = req.nextUrl.searchParams.get("unread_only") === "true";
    const list = await dal.notifications.findForUser(identity.userId, { unreadOnly });
    const data = Array.isArray(list) ? list : [];

    return NextResponse.json({ data, meta: { total: data.length } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH /api/v1/notifications ──────────────────────────────────────────────
// Body: { id, read, read_at? } — marks one of the CALLER'S notifications read.
// A notification belonging to someone else returns 404, not 403: the caller
// shouldn't learn whether that id exists.
export async function PATCH(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const body = await readJsonBody(req);
    if (!body.ok) return body.response;

    const { id, read, read_at } = body.data as {
      id?: string;
      read?: boolean;
      read_at?: string | null;
    };
    if (!id) return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });

    const record = await dal.notifications.markRead(
      id,
      identity.userId,
      read !== false,
      read_at ?? new Date().toISOString(),
    );
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/v1/notifications ───────────────────────────────────────────────
// Body: { recipient_id, title, body?, type?, priority?, entity_type?, entity_id? }
// Creates one notification for one recipient. The rota's "offer to bank staff"
// posts here (one per bank member). When this dedicated route replaced the
// catch-all for GET/PATCH it did not carry POST, so that button 405'd — the
// API-contract audit caught it. Session-authenticated.
export async function POST(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const jb = await readJsonBody(req);
    if (!jb.ok) return jb.response;
    const b = jb.data as Record<string, unknown>;
    const recipientId = typeof b.recipient_id === "string" ? b.recipient_id : "";
    const title = typeof b.title === "string" ? b.title.trim() : "";
    if (!recipientId || !title) {
      return NextResponse.json({ error: "recipient_id and title are required" }, { status: 400 });
    }
    const str = (k: string, d: string | null = null) => (typeof b[k] === "string" ? (b[k] as string) : d);

    const created = await dal.notifications.create({
      recipient_id: recipientId,
      title,
      body: str("body", "") ?? "",
      type: str("type", "system") ?? "system",
      priority: str("priority", "normal") ?? "normal",
      entity_type: str("entity_type"),
      entity_id: str("entity_id"),
      action_url: str("action_url"),
      read: false,
      read_at: null,
    } as Parameters<typeof dal.notifications.create>[0]);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
