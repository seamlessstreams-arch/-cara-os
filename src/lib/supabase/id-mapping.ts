/**
 * ID mapping between application string IDs and Supabase UUIDs.
 *
 * Migration 004 defines deterministic UUIDs for the dev/test seed data.
 * This module translates between the two representations.
 *
 * In production, real UUIDs from Supabase Auth/tables will be used directly.
 * String IDs are the in-memory store convention from the demo seed.
 */

// ── String ID → UUID ──────────────────────────────────────────────────────────

const STRING_TO_UUID: Record<string, string> = {
  // Home
  home_oak: "a0000000-0000-0000-0000-000000000001",

  // Staff
  staff_darren:   "b0000000-0000-0000-0000-000000000001",
  staff_ryan:     "b0000000-0000-0000-0000-000000000002",
  staff_edward:   "b0000000-0000-0000-0000-000000000003",
  staff_anna:     "b0000000-0000-0000-0000-000000000004",
  staff_chervelle: "b0000000-0000-0000-0000-000000000005",
  staff_lackson:  "b0000000-0000-0000-0000-000000000006",
  staff_diane:    "b0000000-0000-0000-0000-000000000007",
  staff_mirela:   "b0000000-0000-0000-0000-000000000008",
  staff_priya:    "b0000000-0000-0000-0000-000000000009",
  staff_callum:   "b0000000-0000-0000-0000-000000000010",
  staff_tyrese:   "b0000000-0000-0000-0000-000000000011",
  staff_sam:      "b0000000-0000-0000-0000-000000000012",

  // Young People
  yp_alex:   "c0000000-0000-0000-0000-000000000001",
  yp_jordan: "c0000000-0000-0000-0000-000000000002",
  yp_casey:  "c0000000-0000-0000-0000-000000000003",
};

// ── UUID → String ID ──────────────────────────────────────────────────────────

const UUID_TO_STRING: Record<string, string> = Object.fromEntries(
  Object.entries(STRING_TO_UUID).map(([k, v]) => [v, k])
);

/**
 * Converts a string ID (e.g. "staff_darren") to its Supabase UUID.
 * If the ID is already a UUID or not in the mapping, returns it unchanged.
 */
export function toUUID(id: string | null | undefined): string | null {
  if (!id) return null;
  return STRING_TO_UUID[id] ?? id;
}

/**
 * Converts a Supabase UUID back to the application string ID.
 * If not in the mapping (a real production UUID), returns the UUID unchanged.
 */
export function fromUUID(uuid: string | null | undefined): string | null {
  if (!uuid) return null;
  return UUID_TO_STRING[uuid] ?? uuid;
}

/**
 * Returns true if the given string looks like a UUID (not a string ID).
 */
export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
