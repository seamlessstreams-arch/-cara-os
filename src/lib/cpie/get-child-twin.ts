// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · the chokepoint
//
// getChildTwin(childId) is how EVERY CARA module reads the platform's
// understanding of a child. No module should interpret raw child records
// independently — they query the twin (the spec's platform-integration rule).
//
// Incremental evolution: the twin is memoised against a cheap content signature
// of the collections that feed it, so it only recomputes when something about
// the child's world actually changes — "update incrementally instead of
// rebuilding" honoured at the read layer. (True cross-instance persistence is
// the Supabase activation path; on this per-instance demo store the signature
// check makes repeat reads free.)
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from "@/lib/db/store";
import { buildChildTwin, type ChildTwinInput } from "./child-twin-engine";
import type { ChildTwin } from "./types";

type Store = ReturnType<typeof getStore>;

const s = (v: unknown): string => (typeof v === "string" ? v : "");

// The collections that feed the twin — the signature watches exactly these.
const FEED_KEYS = [
  "youngPeople", "childPaceProfiles", "personalPassports", "aspirationRecords",
  "lifeStoryEntries", "positiveAchievements", "friendshipMaps", "dailyLog",
  "keyWorkingSessions", "behaviourLog", "incidents", "missingEpisodes",
  "returnInterviews", "familyTimeSessions", "educationRecords", "lacReviews",
  "debriefRecords", "riskAssessments", "staff",
] as const;

function contentSignature(store: Store): string {
  const st = store as unknown as Record<string, unknown>;
  return FEED_KEYS.map((k) => {
    const v = st[k];
    return Array.isArray(v) ? v.length : 0;
  }).join(":");
}

const cache = new Map<string, { sig: string; twin: ChildTwin }>();

function buildInput(store: Store, childId: string, nowIso: string): ChildTwinInput | null {
  const st = store as unknown as Record<string, unknown[]>;
  const child = (store.youngPeople ?? []).find((yp: { id: string }) => yp.id === childId) as Record<string, unknown> | undefined;
  if (!child) return null;

  const staffById = new Map(
    ((store.staff ?? []) as Array<Record<string, unknown>>).map((x) => [
      String(x.id),
      s(x.full_name) || [x.first_name, x.last_name].filter(Boolean).join(" ") || String(x.id),
    ]),
  );

  const rows = (k: string) => (Array.isArray(st[k]) ? (st[k] as Record<string, unknown>[]) : []);

  return {
    childId,
    childName: s(child.preferred_name) || s(child.first_name) || childId,
    now: nowIso,
    child,
    paceProfile: (store.childPaceProfiles ?? []).find((p) => p.childId === childId) as Record<string, unknown> | undefined,
    personalPassports: rows("personalPassports"),
    aspirationRecords: rows("aspirationRecords"),
    lifeStoryEntries: rows("lifeStoryEntries"),
    positiveAchievements: rows("positiveAchievements"),
    friendshipMaps: rows("friendshipMaps"),
    dailyLogs: rows("dailyLog"),
    keyWorkingSessions: rows("keyWorkingSessions"),
    behaviourLog: rows("behaviourLog"),
    incidents: rows("incidents"),
    missingEpisodes: rows("missingEpisodes"),
    returnInterviews: rows("returnInterviews"),
    familyTimeSessions: rows("familyTimeSessions"),
    educationRecords: rows("educationRecords"),
    lacReviews: rows("lacReviews"),
    debriefRecords: rows("debriefRecords"),
    riskAssessments: rows("riskAssessments"),
    staffName: (id: string) => staffById.get(id) ?? id,
  };
}

/** The single way any CARA module reads the twin. Returns null for unknown ids. */
export function getChildTwin(childId: string, nowIso: string = new Date().toISOString()): ChildTwin | null {
  const store = getStore();
  const sig = contentSignature(store);
  const hit = cache.get(childId);
  if (hit && hit.sig === sig) return hit.twin;

  const input = buildInput(store, childId, nowIso);
  if (!input) return null;
  const twin = buildChildTwin(input);
  cache.set(childId, { sig, twin });
  return twin;
}

/** Twins for every current child (manager rollups, weekly objects, dashboards). */
export function getAllChildTwins(nowIso: string = new Date().toISOString()): ChildTwin[] {
  const store = getStore();
  return ((store.youngPeople ?? []) as Array<{ id: string; status?: string }>)
    .filter((yp) => (yp.status ?? "current") === "current")
    .map((yp) => getChildTwin(yp.id, nowIso))
    .filter((t): t is ChildTwin => !!t);
}
