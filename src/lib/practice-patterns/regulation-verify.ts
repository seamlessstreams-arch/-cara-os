// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION-NUMBER VERIFICATION  (pure · deterministic)
//
// Safety rail (practice-patterns brief, F): "Cite regulation numbers only when
// verified against the source text in the repo; otherwise flag as unverified."
//
// The in-repo source of truth is the regulatory spine
// `CHILDRENS_HOMES_REGULATIONS` (regulation-mapping.service). This helper takes a
// cited reference in any common spelling ("reg-14", "Reg 14", "Regulation 45",
// "r45", "14") and reports whether that regulation number exists in the
// catalogue. A number not in the catalogue is flagged UNVERIFIED — never
// silently accepted — so Cara (and any AI second-pass) can refuse to present an
// unverifiable regulation citation as fact.
//
// This does not claim the cited reg is the RIGHT one for the context — only that
// the number is a real, catalogued Children's Homes (England) Regulations 2015
// regulation. Pure: imports only the catalogue constant.
// ══════════════════════════════════════════════════════════════════════════════

import { CHILDRENS_HOMES_REGULATIONS } from "@/lib/practice-intelligence/regulation-mapping.service";

/** The set of regulation NUMBERS present in the canonical spine. */
export const KNOWN_REGULATION_NUMBERS: ReadonlySet<number> = new Set(
  Object.keys(CHILDRENS_HOMES_REGULATIONS)
    .map((key) => {
      const digits = key.replace(/\D+/g, "");
      return digits ? parseInt(digits, 10) : NaN;
    })
    .filter((n) => Number.isFinite(n)),
);

export interface RegVerifyResult {
  ref: string; // the input, verbatim
  number: number | null; // the parsed regulation number, or null if none found
  verified: boolean; // true only if `number` is in the canonical catalogue
  reason?: string; // populated when not verified
}

/** Parse the regulation number out of a free-form reference. */
export function parseRegulationNumber(ref: string): number | null {
  if (typeof ref !== "string") return null;
  // First run of digits anywhere in the string ("reg-14b" -> 14, "s.45(2)" -> 45).
  const m = ref.match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) ? n : null;
}

/** Verify a single cited regulation reference against the spine. */
export function verifyRegulationRef(ref: string): RegVerifyResult {
  const number = parseRegulationNumber(ref);
  if (number === null) {
    return { ref, number: null, verified: false, reason: "no regulation number found in reference" };
  }
  if (!KNOWN_REGULATION_NUMBERS.has(number)) {
    return {
      ref,
      number,
      verified: false,
      reason: `Regulation ${number} is not in the catalogue — verify against the source before citing`,
    };
  }
  return { ref, number, verified: true };
}

export interface RegVerifyBatch {
  allVerified: boolean;
  results: RegVerifyResult[];
  unverified: string[]; // the refs that could not be verified
}

/** Verify a list of cited references; reports which (if any) are unverified. */
export function verifyRegulationRefs(refs: string[]): RegVerifyBatch {
  const results = refs.map(verifyRegulationRef);
  const unverified = results.filter((r) => !r.verified).map((r) => r.ref);
  return { allVerified: unverified.length === 0, results, unverified };
}
