// Soft duplicate detection for admitting a child.
//
// young_people has no uniqueness constraint, so the same child entered twice
// simply makes two rows (Oak House had two "Wesley Lowe" records from go-live
// setup). This finds an existing young person who looks like the one being
// admitted so the form can WARN — never block: two different children can
// genuinely share a name, and the admitting worker is the one who decides.
//
// Match is on normalised first + last name (case- and spacing-insensitive).
// DOB is deliberately NOT required to match: the real duplicates carried
// different (placeholder) dates of birth, so a DOB gate would have missed them.
// A shared DOB is surfaced separately as a stronger signal for the message.

export interface DuplicateCandidate {
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
}

export interface ExistingChildLike extends DuplicateCandidate {
  id: string;
  preferred_name?: string | null;
  status?: string | null;
}

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Existing children whose first + last name match the candidate's, normalised.
 * Empty when the candidate has no first or last name yet, so a half-typed form
 * does not warn. `dob_matches` on each result flags the stronger case where the
 * dates of birth also line up.
 */
export function findLikelyDuplicates<T extends ExistingChildLike>(
  existing: readonly T[],
  candidate: DuplicateCandidate,
): Array<T & { dob_matches: boolean }> {
  const fn = norm(candidate.first_name);
  const ln = norm(candidate.last_name);
  if (!fn || !ln) return [];
  const candidateDob = (candidate.date_of_birth ?? "").trim();
  return existing
    .filter((c) => norm(c.first_name) === fn && norm(c.last_name) === ln)
    .map((c) => {
      const existingDob = (c.date_of_birth ?? "").trim();
      return { ...c, dob_matches: Boolean(candidateDob) && candidateDob === existingDob };
    });
}
