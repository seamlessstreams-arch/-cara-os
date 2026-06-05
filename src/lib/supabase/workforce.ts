// ══════════════════════════════════════════════════════════════════════════════
// WORKFORCE SAFE ACCESS — Supabase write-through (Phases 5/7)
//
// Durable persistence for sign-in presence verifications + emergency alerts. Fully
// gated by isSupabaseEnabled():
//   • Supabase off (demo) → every function is a safe no-op; the in-memory store
//     already holds the data. Zero behaviour change.
//   • Supabase on → rows are upserted to the tables in migration 404 and survive
//     restarts. Best-effort: a failure never breaks the in-memory write.
//
// PRIVACY: sign_in_verifications never includes coordinates (the SignInVerification
// type carries none); emergency rows carry only operational detail.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "./server";
import type { SignInVerification } from "@/lib/attendance/presence-verification";
import type { EmergencyAlert } from "@/lib/staffing/emergency-types";

type SB = any; // eslint-disable-line @typescript-eslint/no-explicit-any
function sb(): SB | null {
  return createServerClient() as unknown as SB;
}

async function upsert(table: string, row: Record<string, unknown>): Promise<{ persisted: boolean; error?: string }> {
  if (!isSupabaseEnabled()) return { persisted: false };
  const s = sb();
  if (!s) return { persisted: false };
  try {
    const { error } = await s.from(table).upsert(row);
    return error ? { persisted: false, error: error.message } : { persisted: true };
  } catch (err) {
    return { persisted: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function persistSignInVerification(v: SignInVerification) {
  return upsert("sign_in_verifications", {
    id: v.id, staff_id: v.staff_id, shift_id: v.shift_id, home_id: v.home_id,
    method: v.method, verified: v.verified, band: v.band, created_at: v.created_at,
  });
}

export function persistEmergencyAlert(a: EmergencyAlert) {
  return upsert("emergency_alerts", {
    id: a.id, home_id: a.home_id, type: a.type, raised_by: a.raised_by, raised_by_name: a.raised_by_name,
    location: a.location, note: a.note, status: a.status, responders: a.responders,
    broadcast_message_id: a.broadcast_message_id, created_at: a.created_at,
    resolved_at: a.resolved_at, resolved_by: a.resolved_by,
  });
}
