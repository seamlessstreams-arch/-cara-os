// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Child pronouns (pure)
//
// The narrators default to they/them/their; where the record actually holds the
// child's pronouns, use them. Sources, most child-led first:
//   1. personalPassports.pronouns — the child's OWN stated pronouns ("he/him")
//   2. youngPeople.gender — male/female → he/she; anything else stays they
//   3. they/them/their (always-safe default)
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";
import type { Pronouns } from "./weekly-narrative";

type Store = ReturnType<typeof getStore>;
type Rec = Record<string, unknown>;

const THEY: Pronouns = { subject: "they", object: "them", possessive: "their" };
const HE: Pronouns = { subject: "he", object: "him", possessive: "his" };
const SHE: Pronouns = { subject: "she", object: "her", possessive: "her" };

const s = (v: unknown): string => (typeof v === "string" ? v : "");

/** Parse a stated pronoun string ("he/him", "She/Her", "they/them"). */
export function parsePronouns(stated: string): Pronouns | null {
  const first = s(stated).toLowerCase().split(/[\s/,]+/)[0];
  if (first === "he") return HE;
  if (first === "she") return SHE;
  if (first === "they") return THEY;
  return null;
}

/** Gender → pronouns, only for unambiguous values; anything else → null. */
export function pronounsForGender(gender: string): Pronouns | null {
  const g = s(gender).toLowerCase();
  if (g === "male" || g === "boy" || g === "m") return HE;
  if (g === "female" || g === "girl" || g === "f") return SHE;
  return null;
}

/** The child's pronouns from the record — passport first, gender next, they/them last. */
export function pronounsForChild(childId: string, store: Store): Pronouns {
  const st = store as unknown as Record<string, unknown>;
  const passports = Array.isArray(st.personalPassports) ? (st.personalPassports as Rec[]) : [];
  const pp = passports.find((p) => s(p.child_id) === childId);
  if (pp) {
    const parsed = parsePronouns(s(pp.pronouns));
    if (parsed) return parsed;
  }
  const children = Array.isArray(st.youngPeople) ? (st.youngPeople as Rec[]) : [];
  const child = children.find((c) => s(c.id) === childId);
  if (child) {
    const fromGender = pronounsForGender(s(child.gender));
    if (fromGender) return fromGender;
  }
  return THEY;
}
