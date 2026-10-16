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
import { dal } from "@/lib/db/dal";
import { isLiveTenant } from "@/lib/db/live-mode";
import { getChildTwin, getChildTwinAsync } from "./get-child-twin";
import { buildWeeklyIntelligenceObject, type WeeklyIntelligenceObject } from "./weekly-intelligence-object";
import { todayStr } from "@/lib/utils";

type Store = ReturnType<typeof getStore>;

function rows(store: Store, k: string): Record<string, unknown>[] {
  const v = (store as unknown as Record<string, unknown>)[k];
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

/** The single way any module reads a child's period intelligence object.
 *  Default window is 7 days (weekly); pass windowDays/periodLabel for monthly. */
export function getWeeklyIntelligenceObject(
  childId: string,
  weekEnding: string = todayStr(),
  nowIso: string = new Date().toISOString(),
  windowDays = 7,
  periodLabel = "week",
): WeeklyIntelligenceObject | null {
  const twin = getChildTwin(childId, nowIso);
  if (!twin) return null;
  const store = getStore();

  return buildWeeklyIntelligenceObject({
    twin,
    now: nowIso,
    weekEnding,
    windowDays,
    periodLabel,
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

/** A child's MONTHLY intelligence object — a 30-day window. */
export function getMonthlyIntelligenceObject(
  childId: string,
  monthEnding: string = todayStr(),
  nowIso: string = new Date().toISOString(),
): WeeklyIntelligenceObject | null {
  return getWeeklyIntelligenceObject(childId, monthEnding, nowIso, 30, "month");
}

// ── Live-safe variants (a live tenant's store is EMPTY) ─────────────────────────
// The sync versions read the store (and getChildTwin), so they return null on a
// live tenant. These resolve the twin via getChildTwinAsync and window the
// live-safe dal record collections; the store-only ones (achievements, life
// story, family time, return interviews) stay empty — honest, never invented.
export async function getWeeklyIntelligenceObjectAsync(
  childId: string,
  weekEnding: string = todayStr(),
  nowIso: string = new Date().toISOString(),
  windowDays = 7,
  periodLabel = "week",
): Promise<WeeklyIntelligenceObject | null> {
  const twin = await getChildTwinAsync(childId, nowIso);
  if (!twin) return null;
  const R = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
  let recs: Parameters<typeof buildWeeklyIntelligenceObject>[0];
  if (isLiveTenant()) {
    const [incidents, missing, keywork, dailyLogs, behaviour, education] = await Promise.all([
      dal.incidents.findAll(),
      dal.missingEpisodes.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.dailyLog.findAll(),
      dal.behaviourLog.findAll(),
      dal.educationRecords.findAll(),
    ]);
    recs = {
      twin, now: nowIso, weekEnding, windowDays, periodLabel,
      positiveAchievements: [], lifeStoryEntries: [], familyTimeSessions: [], returnInterviews: [],
      incidents: R(incidents), missingEpisodes: R(missing), keyWorkingSessions: R(keywork),
      dailyLogs: R(dailyLogs), behaviourLog: R(behaviour), educationRecords: R(education),
    };
  } else {
    const store = getStore();
    recs = {
      twin, now: nowIso, weekEnding, windowDays, periodLabel,
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
    };
  }
  return buildWeeklyIntelligenceObject(recs);
}

export async function getMonthlyIntelligenceObjectAsync(
  childId: string,
  monthEnding: string = todayStr(),
  nowIso: string = new Date().toISOString(),
): Promise<WeeklyIntelligenceObject | null> {
  return getWeeklyIntelligenceObjectAsync(childId, monthEnding, nowIso, 30, "month");
}

/** Weekly objects for every current child (home rollups, manager review). */
export function getAllWeeklyIntelligenceObjects(
  weekEnding: string = todayStr(),
  nowIso: string = new Date().toISOString(),
): WeeklyIntelligenceObject[] {
  const store = getStore();
  return ((store.youngPeople ?? []) as Array<{ id: string; status?: string }>)
    .filter((yp) => (yp.status ?? "current") === "current")
    .map((yp) => getWeeklyIntelligenceObject(yp.id, weekEnding, nowIso))
    .filter((w): w is WeeklyIntelligenceObject => !!w);
}
