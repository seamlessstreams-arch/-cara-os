/**
 * Unified data layer entry point
 *
 * Exports `db` — the same interface whether Supabase is enabled or not.
 *
 * When NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set,
 * all care event pipeline reads/writes go to Supabase.
 *
 * Otherwise, the in-memory store is used (development / demo mode).
 *
 * API routes should:
 *   import { db, careEventsDb } from "@/lib/db"
 *   (not @/lib/db/store directly)
 *
 * For the care events pipeline specifically, use careEventsDb which
 * automatically switches to Supabase when credentials are present.
 */

export { db } from "./store";

// Async dual-mode DAL (Supabase-ready)
export { dal, genericTable } from "./dal";

import {
  sbCareEvents,
  sbCareEventRoutes,
  sbCareEventAuditLog,
  sbReg45EvidenceQueue,
  sbAnnexAEvidenceQueue,
  sbChildDailySummaries,
  sbNotifications,
} from "@/lib/supabase/care-events";
import { db as memDb } from "./store";
import { isSupabaseEnabled } from "@/lib/supabase/server";
export { isSupabaseEnabled };

/**
 * Care events database interface — switches between Supabase and in-memory
 * based on whether Supabase credentials are configured.
 *
 * All methods are async. In-memory methods are wrapped in Promise.resolve().
 */
export const careEventsDb = {
  careEvents: isSupabaseEnabled()
    ? sbCareEvents
    : {
        findAll: async () => memDb.careEvents.findAll(),
        findById: async (id: string) => memDb.careEvents.findById(id) ?? null,
        findCurrent: async () => memDb.careEvents.findCurrent(),
        findByChild: async (childId: string) => memDb.careEvents.findByChild(childId),
        findByStatus: async (status: Parameters<typeof memDb.careEvents.findByStatus>[0]) =>
          memDb.careEvents.findByStatus(status),
        findNeedingManagerReview: async () => memDb.careEvents.findNeedingManagerReview(),
        findForReg40: async () => memDb.careEvents.findForReg40(),
        create: async (data: Parameters<typeof memDb.careEvents.create>[0]) =>
          memDb.careEvents.create(data),
        patch: async (id: string, data: Parameters<typeof memDb.careEvents.patch>[1]) =>
          memDb.careEvents.patch(id, data),
      },

  careEventRoutes: isSupabaseEnabled()
    ? sbCareEventRoutes
    : {
        findByCareEvent: async (careEventId: string) =>
          memDb.careEventRoutes.findByCareEvent(careEventId),
        findFailed: async () => memDb.careEventRoutes.findFailed(),
        upsert: async (data: Parameters<typeof memDb.careEventRoutes.upsert>[0]) =>
          memDb.careEventRoutes.upsert(data),
        patch: async (id: string, data: Parameters<typeof memDb.careEventRoutes.patch>[1]) =>
          memDb.careEventRoutes.patch(id, data),
      },

  careEventAuditLog: isSupabaseEnabled()
    ? sbCareEventAuditLog
    : {
        findAll: async () => memDb.careEventAuditLog.findAll(),
        findByCareEvent: async (careEventId: string) =>
          memDb.careEventAuditLog.findByCareEvent(careEventId),
        append: async (data: Parameters<typeof memDb.careEventAuditLog.append>[0]) =>
          memDb.careEventAuditLog.append(data),
      },

  reg45EvidenceQueue: isSupabaseEnabled()
    ? sbReg45EvidenceQueue
    : {
        findAll: async () => memDb.reg45EvidenceQueue.findAll(),
        findByHome: async () => memDb.reg45EvidenceQueue.findByHome(),
        findPending: async () => memDb.reg45EvidenceQueue.findPending(),
        upsert: async (data: Parameters<typeof memDb.reg45EvidenceQueue.upsert>[0]) =>
          memDb.reg45EvidenceQueue.upsert(data),
        patch: async (id: string, data: Parameters<typeof memDb.reg45EvidenceQueue.patch>[1]) =>
          memDb.reg45EvidenceQueue.patch(id, data),
      },

  annexAEvidenceQueue: isSupabaseEnabled()
    ? sbAnnexAEvidenceQueue
    : {
        findAll: async () => memDb.annexAEvidenceQueue.findAll(),
        findPending: async () => memDb.annexAEvidenceQueue.findPending(),
        upsert: async (data: Parameters<typeof memDb.annexAEvidenceQueue.upsert>[0]) =>
          memDb.annexAEvidenceQueue.upsert(data),
        patch: async (id: string, data: Parameters<typeof memDb.annexAEvidenceQueue.patch>[1]) =>
          memDb.annexAEvidenceQueue.patch(id, data),
      },

  childDailySummaries: isSupabaseEnabled()
    ? sbChildDailySummaries
    : {
        findAll: async () => memDb.childDailySummaries.findAll(),
        findByChild: async (childId: string) =>
          memDb.childDailySummaries.findByChild(childId),
        findByDate: async (date: string) =>
          memDb.childDailySummaries.findByDate(date),
        upsert: async (data: Parameters<typeof memDb.childDailySummaries.upsert>[0]) =>
          memDb.childDailySummaries.upsert(data),
      },

  notifications: isSupabaseEnabled()
    ? sbNotifications
    : {
        findByRecipient: async (recipientId: string, unreadOnly = false) =>
          unreadOnly
            ? memDb.notifications.findAll().filter(
                (n) => n.recipient_id === recipientId && !n.read
              )
            : memDb.notifications.findAll().filter((n) => n.recipient_id === recipientId),
        create: async (data: Parameters<typeof memDb.notifications.create>[0]) =>
          memDb.notifications.create(data),
        markRead: async (id: string) => {
          memDb.notifications.patch(id, { read: true, read_at: new Date().toISOString() });
        },
        markAllRead: async (recipientId: string) => {
          memDb.notifications
            .findAll()
            .filter((n) => n.recipient_id === recipientId && !n.read)
            .forEach((n) => memDb.notifications.patch(n.id, { read: true, read_at: new Date().toISOString() }));
        },
      },
};

/**
 * Returns the home_id to use for all operations.
 *
 * In production this will be resolved from the authenticated session.
 * During in-memory mode, returns the seed home_id.
 *
 * TODO: Replace with auth session lookup once Supabase Auth is wired.
 */
export function getHomeId(): string {
  return process.env.SEED_HOME_ID ?? "home_oak";
}

/**
 * Returns the home UUID for Supabase queries.
 * This is the fixed UUID used in migration 004.
 */
export function getSupabaseHomeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}
