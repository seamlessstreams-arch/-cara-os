// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Weekly Intelligence Object chokepoint
//
// getWeeklyIntelligenceObject(childId, weekEnding?) is how any module reads a
// child's structured weekly pre-report object. It queries the Digital Twin (via
// getChildTwin — the whole-child understanding) and windows the store's records
// to the 7 days ending on `weekEnding` (default: today). No module builds a
// weekly summary from raw records independently — they consume this object.
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from "@/lib/db/store";
import { getChildTwin } from "./get-child-twin";
import { buildWeeklyIntelligenceObject, type WeeklyIntelligenceObject } from "./weekly-intelligence-object";

type Store = ReturnType<typeof getStore>;

function rows(store: Store, k: string): Record<string, unknown>[] {
  const v = (store as unknown as Record<string, unknown>)[k];
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

/** The single way any module reads a child's weekly intelligence object. */
export function getWeeklyIntelligenceObject(
  childId: string,
  weekEnding: string = new Date().toISOString().slice(0, 10),
  nowIso: string = new Date().toISOString(),
): WeeklyIntelligenceObject | null {
  const twin = getChildTwin(childId, nowIso);
  if (!twin) return null;
  const store = getStore();

  return buildWeeklyIntelligenceObject({
    twin,
    now: nowIso,
    weekEnding,
    positiveAchievements: rows(store, "positiveAchievements"),
    lifeStoryEntries: rows(store, "lifeStoryEntries"),
    incidents: rows(store, "incidents"),
    missingEpisodes: rows(store, "missingEpisodes"),
    keyWorkingSessions: rows(store, "keyWorkingSessions"),
    familyTimeSessions: rows(store, "familyTimeSessions"),
    dailyLogs: rows(store, "dailyLog"),
    behaviourLog: rows(store, "behaviourLog"),
    educationRecords: rows(store, "educationRecords"),
    returnInterviews: rows(store, "returnInterviews"),
  });
}

/** Weekly objects for every current child (home rollups, manager review). */
export function getAllWeeklyIntelligenceObjects(
  weekEnding: string = new Date().toISOString().slice(0, 10),
  nowIso: string = new Date().toISOString(),
): WeeklyIntelligenceObject[] {
  const store = getStore();
  return ((store.youngPeople ?? []) as Array<{ id: string; status?: string }>)
    .filter((yp) => (yp.status ?? "current") === "current")
    .map((yp) => getWeeklyIntelligenceObject(yp.id, weekEnding, nowIso))
    .filter((w): w is WeeklyIntelligenceObject => !!w);
}
