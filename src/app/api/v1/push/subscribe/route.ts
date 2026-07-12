// ══════════════════════════════════════════════════════════════════════════════
// API: /api/v1/push/subscribe — Web Push device subscriptions
//   GET    → { configured, publicKey }  (the client needs the VAPID public key)
//   POST   → register/refresh this device's subscription for the signed-in user
//   DELETE → unsubscribe this device (by endpoint)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { isPushConfigured } from "@/lib/push/web-push";
import { getRequestIdentity } from "@/lib/auth-guard";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY ?? null,
  });
}

export async function POST(req: NextRequest) {
  // A device may only register a subscription for the authenticated user —
  // the recipient comes from the session (activated mode), never a client header.
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const sub = __parsed.data;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  const rec = db.pushSubscriptions.upsert({
    recipient_id: identity.userId,
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
  return NextResponse.json({ data: { id: rec.id } }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const __parsed2 = await readJsonBody(req);
  if (!__parsed2.ok) return __parsed2.response;
  const body = __parsed2.data;
  if (body?.endpoint) db.pushSubscriptions.removeByEndpoint(body.endpoint);
  return NextResponse.json({ ok: true });
}
