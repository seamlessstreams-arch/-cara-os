// ══════════════════════════════════════════════════════════════════════════════
// CARA — WHAT DO WE CALL THIS CHILD?
//
// One answer, because there were a dozen and several were wrong.
//
// The live Command Centre showed a staff member this, on the safeguarding
// panel:
//
//   "No daily log on record for 44aeb910-4a20-4e90-bc66-2233080fc56e."
//
// That child's record holds "WESLEY" and "LOWE". The caller was
// `preferred_name ?? c.id` — so a missing preferred name fell through to the
// database id, and the first and last name were never consulted at all. Two
// other routes had the same `|| yp.id` ending.
//
// The variants in the codebase also split on `??` vs `||`, which matters more
// than it looks: `??` only catches null and undefined, so a preferred_name of
// "" or "." passes straight through. Oak House had a record whose preferred
// name was literally "." and it rendered as "." across the app.
//
// Rules, in order:
//   1. preferred name, if it is more than whitespace
//   2. first + last, whichever of them are present
//   3. a neutral label — NEVER an id
//
// An id is not a name. Showing one to staff is worse than showing nothing: it
// is unreadable, it cannot be matched to a child in the room, and on a
// safeguarding alert it is the difference between a prompt that gets actioned
// and one that gets ignored.
// ══════════════════════════════════════════════════════════════════════════════

export interface ChildNameFields {
  preferred_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
}

/** Trimmed value, or null when absent, empty, or punctuation-only noise. */
function meaningful(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // A record whose preferred_name was "." is a real one from a live home. A
  // name has to contain at least one letter or digit to be a name.
  if (!/[\p{L}\p{N}]/u.test(trimmed)) return null;
  return trimmed;
}

/**
 * The name to show staff for a child.
 *
 * `fallback` is what to use when the record carries no usable name at all —
 * default "Unnamed child", which reads as the data problem it is. It is never
 * an id, and callers should not pass one.
 */
export function childDisplayName(
  child: ChildNameFields | null | undefined,
  fallback = "Unnamed child",
): string {
  if (!child) return fallback;

  const preferred = meaningful(child.preferred_name);
  if (preferred) return preferred;

  const first = meaningful(child.first_name);
  const last = meaningful(child.last_name);
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;

  const full = meaningful(child.full_name);
  if (full) return full;

  return fallback;
}
