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
import { dal } from "@/lib/db/dal";
import { isLiveTenant } from "@/lib/db/live-mode";
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
  // Checked against the store's own collections: a phantom key here would
  // contribute a constant 0 to the signature, so the twin's cache would never
  // notice that collection changing.
  return FEED_KEYS.map((k) => {
    const v = store[k];
    return Array.isArray(v) ? v.length : 0;
  }).join(":");
}

const cache = new Map<string, { sig: string; twin: ChildTwin }>();

function buildInput(store: Store, childId: string, nowIso: string): ChildTwinInput | null {
  const child = (store.youngPeople ?? []).find((yp: { id: string }) => yp.id === childId) as unknown as Record<string, unknown> | undefined;
  if (!child) return null;

  const staffById = new Map(
    ((store.staff ?? []) as unknown as Array<Record<string, unknown>>).map((x) => [
      String(x.id),
      s(x.full_name) || [x.first_name, x.last_name].filter(Boolean).join(" ") || String(x.id),
    ]),
  );

  // The key is checked against the store's own collections — a phantom name
  // used to return [] in silence (see the ops snapshot fix in #1059). The rows
  // stay loose because ChildTwinInput takes them that way.
  const rows = (k: keyof Store) =>
    (Array.isArray(store[k]) ? store[k] : []) as unknown as Record<string, unknown>[];

  return {
    childId,
    childName: s(child.preferred_name) || s(child.first_name) || childId,
    now: nowIso,
    child,
    paceProfile: (store.childPaceProfiles ?? []).find((p) => p.childId === childId) as unknown as Record<string, unknown> | undefined,
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

// ── Live-safe gather (a live tenant's store is EMPTY) ───────────────────────────
// buildInput reads the in-memory store, so getChildTwin returns null on a live
// tenant ("Child not found"). buildInputLive gathers the SAME ChildTwinInput from
// the live-safe dal collections (each sb()-backed) and feeds the identical pure
// buildChildTwin. The enrichment collections with no live-safe source (personal
// passports, aspirations, life story, achievements, friendship maps, return
// interviews, family time, debriefs) are left EMPTY — honest gaps the twin
// reports in missingInformation, never invents. Rows are whole-home; the engine
// windows per child.
async function buildInputLive(childId: string, nowIso: string): Promise<ChildTwinInput | null> {
  const [children, staff, pace, dailyLogs, keywork, behaviour, incidents, missing, education, lac, risk] =
    await Promise.all([
      dal.youngPeople.findAll(),
      dal.staff.findAll(),
      dal.childPaceProfiles.findAll(),
      dal.dailyLog.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.behaviourLog.findAll(),
      dal.incidents.findAll(),
      dal.missingEpisodes.findAll(),
      dal.educationRecords.findAll(),
      dal.lacReviews.findAll(),
      dal.riskAssessments.findAll(),
    ]);
  const R = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as unknown as Record<string, unknown>[]) : []);
  const child = R(children).find((yp) => String(yp.id) === childId);
  if (!child) return null;
  const staffById = new Map(
    R(staff).map((x) => [
      String(x.id),
      s(x.full_name) || [x.first_name, x.last_name].filter(Boolean).join(" ") || String(x.id),
    ]),
  );
  return {
    childId,
    childName: s(child.preferred_name) || s(child.first_name) || childId,
    now: nowIso,
    child,
    paceProfile: R(pace).find((p) => String(p.childId ?? p.child_id) === childId),
    // Store-only enrichment — honest gaps on live (never invented).
    personalPassports: [],
    aspirationRecords: [],
    lifeStoryEntries: [],
    positiveAchievements: [],
    friendshipMaps: [],
    returnInterviews: [],
    familyTimeSessions: [],
    debriefRecords: [],
    // Live-safe record collections.
    dailyLogs: R(dailyLogs),
    keyWorkingSessions: R(keywork),
    behaviourLog: R(behaviour),
    incidents: R(incidents),
    missingEpisodes: R(missing),
    educationRecords: R(education),
    lacReviews: R(lac),
    riskAssessments: R(risk),
    staffName: (id: string) => staffById.get(id) ?? id,
  };
}

/** The twin, resolved live-safely: the dal collections on a live tenant, the
 *  in-memory store (memoised) in demo. The one way a ROUTE should read the twin. */
export async function getChildTwinAsync(childId: string, nowIso: string = new Date().toISOString()): Promise<ChildTwin | null> {
  if (!isLiveTenant()) return getChildTwin(childId, nowIso);
  const input = await buildInputLive(childId, nowIso);
  if (!input) return null;
  return buildChildTwin(input);
}

/** Twins for every current child (manager rollups, weekly objects, dashboards). */
export function getAllChildTwins(nowIso: string = new Date().toISOString()): ChildTwin[] {
  const store = getStore();
  return ((store.youngPeople ?? []) as Array<{ id: string; status?: string }>)
    .filter((yp) => (yp.status ?? "current") === "current")
    .map((yp) => getChildTwin(yp.id, nowIso))
    .filter((t): t is ChildTwin => !!t);
}
