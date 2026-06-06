// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Web Push send helper
//
// Best-effort Web Push to a recipient's subscribed devices. No-op until the VAPID
// keys are configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT)
// — generate once with `npx web-push generate-vapid-keys` and set in the env, same
// pattern as the Supabase activation. Never throws; prunes dead subscriptions.
//
// PRIVACY: payloads must be operational only (a title + a non-identifying body), never
// child / medical / safeguarding detail — the same rule as the emergency broadcast.
// ══════════════════════════════════════════════════════════════════════════════

import webpush from "web-push";
import { db, type StoredPushSubscription } from "@/lib/db/store";

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:notifications@cornerstone.app";
  if (!pub || !priv || pub.includes("placeholder") || priv.includes("placeholder")) {
    configured = false;
    return false;
  }
  try {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

/** True when the VAPID keys are set (push can actually be delivered). */
export function isPushConfigured(): boolean {
  return ensureConfigured();
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  priority?: "normal" | "critical";
}

async function dispatch(subs: StoredPushSubscription[], payload: PushPayload): Promise<void> {
  if (subs.length === 0) return;
  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) db.pushSubscriptions.removeByEndpoint(sub.endpoint);
      }
    }),
  );
}

/**
 * Best-effort Web Push to all of a recipient's subscribed devices. No-op when VAPID
 * isn't configured or the recipient has no subscriptions. Never throws; a 404/410
 * (gone) subscription is pruned.
 */
export async function sendPushToUser(recipientId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  await dispatch(db.pushSubscriptions.findByUser(recipientId), payload);
}

/** Best-effort broadcast to every subscribed device (e.g. an emergency). Same gating. */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  await dispatch(db.pushSubscriptions.findAll(), payload);
}
