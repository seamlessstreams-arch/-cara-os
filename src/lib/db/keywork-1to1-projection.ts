import type { Database } from "@/lib/supabase/types";
import type { KeyworkerSessionRecord, KeyworkerSessionFormat } from "@/types/extended";

/** The 1:1 Sessions projection of cs_key_work_sessions.
 *
 *  The same rows that dal.keyWorkingSessions reads as KeyWorkingSession, read
 *  in the shape the 1:1 page works in. Two views of one table, so a session is
 *  recorded once and every inspection-facing reader sees it, rather than the
 *  two pages each writing somewhere the other never looks.
 *
 *  Nothing here invents a value it was not given. A field the recorder did not
 *  supply comes back null, and the page says so.
 */

type Row = Database["public"]["Tables"]["cs_key_work_sessions"]["Row"];

const FORMATS: readonly KeyworkerSessionFormat[] = [
  "one_to_one_at_home", "one_to_one_walk", "one_to_one_cafe",
  "one_to_one_driving", "one_to_one_cooking_together",
  "one_to_one_boxing_sport", "brief_check_in", "crisis_check_in",
];

function strings(j: unknown): string[] {
  return Array.isArray(j) ? j.map(String) : [];
}

/** A 1-5 rating, or null. Out-of-scale readings are discarded rather than
 *  clamped, matching the mood pair in the KeyWorkingSession projection. */
export function rating1to5(v: unknown): 1 | 2 | 3 | 4 | 5 | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 5
    ? (Math.round(v) as 1 | 2 | 3 | 4 | 5) : null;
}

/** The stored format, or null. An unrecognised string is null rather than a
 *  guess: the page filters and colours by this, and a wrong bucket is worse
 *  than an honest blank. */
export function sessionFormat(v: unknown): KeyworkerSessionFormat | null {
  return typeof v === "string" && (FORMATS as readonly string[]).includes(v)
    ? (v as KeyworkerSessionFormat) : null;
}

export function rowTo1to1(r: Row): KeyworkerSessionRecord {
  return {
    id: r.id,
    child_id: r.child_id ?? "",
    staff_id: r.key_worker_id ?? "",
    session_date: r.completed_date ?? r.planned_date ?? r.created_at.slice(0, 10),
    duration_minutes: r.duration_minutes ?? 0,
    // Null for a session recorded through /key-working, which never asks how
    // the session happened.
    format: sessionFormat(r.session_format),
    child_chose_format: typeof r.child_chose_format === "boolean" ? r.child_chose_format : null,
    themes_covered: strings(r.topics_covered),
    child_went_in_with: rating1to5(r.child_mood_before),
    child_walked_out_with: rating1to5(r.child_mood),
    what_child_brought_up: r.child_voice ?? "",
    what_staff_brought_up: r.staff_agenda ?? "",
    agreed_actions_staff: strings(r.actions),
    agreed_actions_child: strings(r.child_actions),
    // The child's own rating. Null means nobody asked.
    child_satisfaction: rating1to5(r.child_satisfaction),
    follow_up_date: r.follow_up_date,
    flags_raised: strings(r.flags_raised),
    notes: r.notes ?? undefined,
    home_id: r.home_id ?? "",
    created_at: r.created_at,
  };
}

/** KeyworkerSessionRecord -> a cs_key_work_sessions row.
 *
 *  A key absent from the input is absent from the row, so a patch never blanks
 *  a column the caller did not mention. home_id is not written here: the dal
 *  stamps it server-side on create and never patches it.
 */
export function oneToOneToRow(s: Partial<KeyworkerSessionRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => { if (v !== undefined) row[k] = v; };
  set("child_id", s.child_id);
  set("key_worker_id", s.staff_id);
  // Written to both date columns for the same reason as the KeyWorkingSession
  // writer: findAll orders by planned_date, so completed_date alone would leave
  // every session recorded here with a null sort key.
  if (s.session_date !== undefined) {
    row.completed_date = s.session_date;
    row.planned_date = s.session_date;
  }
  // Every row this page writes IS a one-to-one; session_type is the coarse
  // kind the other projection reads, session_format the fine one this page
  // records. Both are stated rather than inferred later.
  if (s.format !== undefined) {
    row.session_format = sessionFormat(s.format);
    row.session_type = "one_to_one";
  }
  set("duration_minutes", s.duration_minutes);
  set("child_chose_format", s.child_chose_format);
  set("topics_covered", s.themes_covered);
  if (s.child_went_in_with !== undefined) row.child_mood_before = rating1to5(s.child_went_in_with);
  if (s.child_walked_out_with !== undefined) row.child_mood = rating1to5(s.child_walked_out_with);
  set("child_voice", s.what_child_brought_up);
  set("staff_agenda", s.what_staff_brought_up);
  set("actions", s.agreed_actions_staff);
  set("child_actions", s.agreed_actions_child);
  if (s.child_satisfaction !== undefined) row.child_satisfaction = rating1to5(s.child_satisfaction);
  set("follow_up_date", s.follow_up_date);
  set("flags_raised", s.flags_raised);
  set("notes", s.notes);
  return row;
}
