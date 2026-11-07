import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import type { YoungPerson } from "@/types";

export const dynamic = "force-dynamic";

// Age from DOB — mirrors the single-child route (/young-people/[id]) so the list
// and the detail view always agree. Calendar-part arithmetic (prod runs UTC);
// never reads time-of-day. Returns null when the DOB is missing/unparseable
// rather than a misleading 0.
function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Group rows by a child-id selector; rows whose key is null/undefined are skipped.
function groupByChild<T>(rows: T[], key: (r: T) => string | null | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    if (!k) continue;
    const bucket = map.get(k);
    if (bucket) bucket.push(row);
    else map.set(k, [row]);
  }
  return map;
}

// GET /api/v1/young-people?status=current|former|all
//
// Enriched child list. The generic /api/v1 catch-all returns bare young_people
// rows with meta:{ total } only, so the Child Profiles page (and ~10 other
// consumers) rendered blanks/NaN for age, open incidents, medications, key
// worker, missing episodes and the current/former/high-risk breakdown. This
// dedicated route joins those sources and computes age, so the page shows real
// per-child intelligence.
//
// Live-safe: every read goes through the dual-mode dal — the real Supabase
// tables on a live tenant, the in-memory store otherwise — so it populates on
// live, where the store is emptied at module load. Additive only: it returns
// the same { data, meta } shape with extra fields, and honours ?status= (the
// catch-all ignored it), which is what every caller already asked for.
export async function GET(req: NextRequest) {
  try {
    // Default to "all" when no param is given, preserving the catch-all's old
    // paramless behaviour (it ignored status entirely). Callers always pass an
    // explicit status, so this only affects a bare /young-people hit.
    const statusParam = (req.nextUrl.searchParams.get("status") ?? "all").toLowerCase();

    // One batched read per source; the full young_people set drives the meta
    // breakdown, the returned `data` is filtered by status.
    const [allYP, allStaff, allIncidents, allTasks, allMeds, allMissing, allLogs] = await Promise.all([
      dal.youngPeople.findAll(),
      dal.staff.findAll(),
      dal.incidents.findAll(),
      dal.tasks.findAll(),
      dal.medications.findAll(),
      dal.missingEpisodes.findAll(),
      dal.dailyLog.findAll(),
    ]);

    const staffById = new Map(allStaff.map((s) => [s.id, s]));
    const incByChild = groupByChild(allIncidents, (i) => i.child_id);
    const taskByChild = groupByChild(allTasks, (t) => t.linked_child_id);
    const medByChild = groupByChild(allMeds, (m) => m.child_id);
    const missByChild = groupByChild(allMissing, (m) => m.child_id);
    const logByChild = groupByChild(allLogs, (l) => l.child_id);

    const enrich = (yp: YoungPerson) => {
      const incidents = incByChild.get(yp.id) ?? [];
      const tasks = taskByChild.get(yp.id) ?? [];
      const meds = medByChild.get(yp.id) ?? [];
      const missing = missByChild.get(yp.id) ?? [];
      const logs = logByChild.get(yp.id) ?? [];
      const lastLog = logs.reduce<string | null>(
        (latest, l) => (!latest || l.date > latest ? l.date : latest),
        null,
      );
      return {
        ...yp,
        age: calcAge(yp.date_of_birth),
        key_worker: yp.key_worker_id ? (staffById.get(yp.key_worker_id) ?? null) : null,
        secondary_worker: yp.secondary_worker_id ? (staffById.get(yp.secondary_worker_id) ?? null) : null,
        open_incidents: incidents.filter((i) => i.status === "open").length,
        active_tasks: tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
        active_medications: meds.filter((m) => m.is_active).length,
        missing_episodes_total: missing.length,
        risk_flags_count: (yp.risk_flags ?? []).length,
        last_log_date: lastLog,
      };
    };

    const isCurrent = (yp: YoungPerson) => yp.status === "current";
    // The UI's "former" is a label, not a DB status; the canonical query maps it
    // to the "ended" placement status (see sq.getYoungPeople), so match that.
    const isFormer = (yp: YoungPerson) => yp.status === "ended";

    // "current" → current only; "former" → former only; anything else
    // (incl. "all" and no param) → the full set, preserving the catch-all's
    // previous paramless behaviour.
    const filtered =
      statusParam === "current" ? allYP.filter(isCurrent) :
      statusParam === "former" ? allYP.filter(isFormer) :
      allYP;

    const data = filtered.map(enrich);

    const meta = {
      total: allYP.length,
      current: allYP.filter(isCurrent).length,
      former: allYP.filter(isFormer).length,
      high_risk: allYP.filter((yp) => isCurrent(yp) && (yp.risk_flags ?? []).length > 0).length,
    };

    return NextResponse.json({ data, meta });
  } catch (err) {
    console.error("[young-people:list] enrichment failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
