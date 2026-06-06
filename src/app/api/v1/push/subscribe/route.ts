// ══════════════════════════════════════════════════════════════════════════════
// API: /api/v1/push/subscribe — Web Push device subscriptions
//   GET    → { configured, publicKey }  (the client needs the VAPID public key)
//   POST   → register/refresh this device's subscription for the signed-in user
//   DELETE → unsubscribe this device (by endpoint)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { isPushConfigured } from "@/lib/push/web-push";

export const dynamic = "force-dynamic";

const DEFAULT_USER = "staff_darren";
function userId(req: NextRequest): string {
  return req.headers.get("x-user-id") || DEFAULT_USER;
}

export async function GET() {
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY ?? null,
  });
}

export async function POST(req: NextRequest) {
  const sub = await req.json().catch(() => null);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  const rec = db.pushSubscriptions.upsert({
    recipient_id: userId(req),
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
  return NextResponse.json({ data: { id: rec.id } }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body?.endpoint) db.pushSubscriptions.removeByEndpoint(body.endpoint);
  return NextResponse.json({ ok: true });
}
