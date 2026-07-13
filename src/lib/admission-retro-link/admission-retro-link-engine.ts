// ══════════════════════════════════════════════════════════════════════════════
// CARA — ADMISSION RETRO-LINK ENGINE (Phase 3 · Admissions · Module 1)
//
// The audit's named Admissions gap: the referral models (AdmissionReferral,
// MatchingReferral, + commissioning) identify the child by NAME + DOB, with NO
// foreign key to the young-person record. So once a child is placed, their
// pre-placement story — who referred them, why, the matching decision, the
// risks flagged before they arrived — is orphaned: the chronology and the CPIE
// twin never see it. "How this child came to us" is invisible.
//
// This RETRO-LINKS deterministically: given a young person, it matches referrals
// by normalised name (+ DOB when present) and consolidates the three models into
// ONE origin projection. Pure + read-only — it invents nothing and writes
// nothing; it reconnects records that were already there. Match confidence is
// reported honestly (exact-DOB vs name-only) so a weak match is never presented
// as certain.
// ══════════════════════════════════════════════════════════════════════════════

export interface YoungPersonLite {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  date_of_birth?: string | null;
  placement_start?: string | null;
}

export interface AdmissionReferralLite {
  id: string;
  child_name: string;
  date_of_birth?: string;
  referral_date?: string;
  referral_source?: string;
  local_authority?: string;
  status?: string;
  presenting_needs?: string[];
  risk_factors?: string[];
  estimated_placement_date?: string;
}

export interface MatchingReferralLite {
  id: string;
  child_name: string;
  referral_date?: string;
  local_authority?: string;
  status?: string;
  overall_match?: unknown;
  decision_date?: string | null;
  placement_type?: string;
  presenting_needs?: string[];
}

/** The third model (commissioning): PlacementReferral, name-keyed, no DOB. */
export interface PlacementReferralLite {
  id: string;
  child_name: string;
  referring_authority?: string;
  referral_date?: string;
  urgency?: string;
  status?: string;
  presenting_needs?: string[];
  risk_factors?: string[];
  placement_start_date?: string | null;
}

export type MatchConfidence = "exact" | "strong" | "weak" | "none";

export interface OriginStory {
  child_id: string;
  child_name: string;
  match_confidence: MatchConfidence;
  /** Human note on how the link was made — never presented as more certain than it is. */
  match_basis: string;
  admission_referral?: AdmissionReferralLite;
  matching_referral?: MatchingReferralLite;
  placement_referral?: PlacementReferralLite;
  /** The consolidated pre-placement facts, source-attributed. */
  presenting_needs: string[];
  risk_factors: string[];
  referral_source?: string;
  local_authority?: string;
  referral_date?: string;
}

/** Normalise a name for matching: lowercase, strip punctuation, collapse space. */
export function normaliseName(name: string): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Candidate name forms for a young person (full + preferred variants). */
function ypNameForms(yp: YoungPersonLite): string[] {
  const forms = [
    `${yp.first_name} ${yp.last_name}`,
    yp.preferred_name ? `${yp.preferred_name} ${yp.last_name}` : "",
  ]
    .map(normaliseName)
    .filter(Boolean);
  return Array.from(new Set(forms));
}

function nameMatches(referralName: string, yp: YoungPersonLite): boolean {
  const r = normaliseName(referralName);
  if (!r) return false;
  return ypNameForms(yp).some((f) => f === r);
}

/** A reusable matcher for one young person (for callers like the emergency
 *  follow-ups engine that classify referrals per child). */
export function makeChildNameMatcher(yp: YoungPersonLite): (referralName: string) => boolean {
  return (referralName: string) => nameMatches(referralName, yp);
}

function confidenceFor(nameHit: boolean, dobHit: boolean | null): MatchConfidence {
  if (!nameHit) return "none";
  if (dobHit === true) return "exact";
  if (dobHit === false) return "weak"; // name matched but DOB conflicts — flag it
  return "strong"; // name matched, no DOB to compare
}

/**
 * Retro-link a young person to their referral origin. Pure. Returns null when
 * no referral plausibly matches (no fabricated origin).
 */
export function buildOriginStory(
  yp: YoungPersonLite,
  admissionReferrals: readonly AdmissionReferralLite[],
  matchingReferrals: readonly MatchingReferralLite[],
  placementReferrals: readonly PlacementReferralLite[] = [],
): OriginStory | null {
  // Best admission referral: name match, prefer DOB agreement, then latest date.
  const adCandidates = admissionReferrals
    .filter((r) => nameMatches(r.child_name, yp))
    .map((r) => {
      const dobHit = r.date_of_birth && yp.date_of_birth ? r.date_of_birth === yp.date_of_birth : null;
      return { r, dobHit, conf: confidenceFor(true, dobHit) };
    })
    // drop weak (DOB-conflicting) matches — a different child with the same name
    .filter((c) => c.conf !== "weak")
    .sort((a, b) => (b.dobHit === true ? 1 : 0) - (a.dobHit === true ? 1 : 0) || String(b.r.referral_date ?? "").localeCompare(String(a.r.referral_date ?? "")));

  const admission = adCandidates[0];
  const matching = matchingReferrals.find((m) => nameMatches(m.child_name, yp));
  // The commissioning model has no DOB — name-keyed only (strong at best).
  const placement = placementReferrals.find((p) => nameMatches(p.child_name, yp));

  if (!admission && !matching && !placement) return null;

  const confidence: MatchConfidence = admission?.conf ?? (matching || placement ? "strong" : "none");
  const basis = admission
    ? admission.dobHit === true
      ? "Matched on name + date of birth."
      : "Matched on name (no date of birth on the referral to confirm)."
    : matching
      ? "Matched on name via the matching referral only."
      : "Matched on name via the commissioning referral only.";

  const presenting = Array.from(
    new Set([
      ...(admission?.r.presenting_needs ?? []),
      ...(matching?.presenting_needs ?? []),
      ...(placement?.presenting_needs ?? []),
    ]),
  );
  const risks = Array.from(
    new Set([...(admission?.r.risk_factors ?? []), ...(placement?.risk_factors ?? [])]),
  );

  return {
    child_id: yp.id,
    child_name: `${yp.first_name} ${yp.last_name}`.trim(),
    match_confidence: confidence,
    match_basis: basis,
    admission_referral: admission?.r,
    matching_referral: matching,
    placement_referral: placement,
    presenting_needs: presenting,
    risk_factors: risks,
    referral_source: admission?.r.referral_source,
    local_authority: admission?.r.local_authority ?? matching?.local_authority ?? placement?.referring_authority,
    referral_date: admission?.r.referral_date ?? matching?.referral_date ?? placement?.referral_date,
  };
}

/** Reverse view: which young person a "placed" referral became (or null). */
export function resolveReferralToChild(
  referral: AdmissionReferralLite,
  youngPeople: readonly YoungPersonLite[],
): { child_id: string; confidence: MatchConfidence } | null {
  const hits = youngPeople
    .filter((yp) => nameMatches(referral.child_name, yp))
    .map((yp) => {
      const dobHit = referral.date_of_birth && yp.date_of_birth ? referral.date_of_birth === yp.date_of_birth : null;
      return { yp, conf: confidenceFor(true, dobHit) };
    })
    .filter((c) => c.conf !== "weak")
    .sort((a, b) => (a.conf === "exact" ? -1 : 0) - (b.conf === "exact" ? -1 : 0));
  return hits[0] ? { child_id: hits[0].yp.id, confidence: hits[0].conf } : null;
}
