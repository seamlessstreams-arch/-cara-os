// ══════════════════════════════════════════════════════════════════════════════
// CARA — recording-form draft persistence (localStorage)
//
// Drafts of recording forms carry child names and free-text narrative, and the
// office machine in a children's home is SHARED. Two rules follow:
//
//  1. A draft belongs to the person who wrote it. The storage key carries the
//     user id, so switching user on the same machine starts a fresh form and
//     leaves the author's draft waiting for them — one person's half-written
//     incident narrative must never open under another person's session.
//  2. A draft nobody came back for must not sit on a shared disk forever.
//     Drafts expire after DRAFT_TTL_HOURS and are removed at the next load.
//
// Legacy keys from before user-scoping (`<prefix><childId>`) are ownerless and
// therefore unreadable by design: deleted on sight, never adopted into the
// current user.
// ══════════════════════════════════════════════════════════════════════════════
import { currentUserId } from "@/lib/auth/current-user";

export const DRAFT_TTL_HOURS = 24;

type DraftEnvelope<T> = { v: 1; savedAt: string; data: T };

const scopedKey = (prefix: string, childId: string) => `${prefix}${currentUserId()}:${childId}`;
// Pre-scoping keys never contain ":" (user ids do), so the two can't collide.
const legacyKey = (prefix: string, childId: string) => `${prefix}${childId}`;

/** Persist a draft for the current user. Best-effort: storage may be unavailable. */
export function saveDraft<T>(prefix: string, childId: string, data: T): void {
  try {
    const envelope: DraftEnvelope<T> = { v: 1, savedAt: new Date().toISOString(), data };
    localStorage.setItem(scopedKey(prefix, childId), JSON.stringify(envelope));
  } catch {
    // Private mode / quota — autosave is best-effort by design.
  }
}

/** The current user's live draft, or null. Expired, foreign and legacy drafts are removed, not returned. */
export function loadDraft<T>(prefix: string, childId: string): T | null {
  try {
    localStorage.removeItem(legacyKey(prefix, childId));
    const raw = localStorage.getItem(scopedKey(prefix, childId));
    if (!raw) return null;
    const envelope = JSON.parse(raw) as DraftEnvelope<T>;
    if (!envelope || envelope.v !== 1 || typeof envelope.savedAt !== "string") {
      localStorage.removeItem(scopedKey(prefix, childId));
      return null;
    }
    const ageMs = Date.now() - new Date(envelope.savedAt).getTime();
    if (!Number.isFinite(ageMs) || ageMs > DRAFT_TTL_HOURS * 3_600_000) {
      localStorage.removeItem(scopedKey(prefix, childId));
      return null;
    }
    return envelope.data;
  } catch {
    return null;
  }
}

/** Remove the current user's draft (call on successful submit). */
export function clearDraft(prefix: string, childId: string): void {
  try {
    localStorage.removeItem(scopedKey(prefix, childId));
  } catch {
    // ignore
  }
}
