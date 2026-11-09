// ══════════════════════════════════════════════════════════════════════════════
// Cara — Practice-pattern intake pipeline (Phase 4b)
//
// Pure functions that turn ONE manual submission (a link plus the submitter's
// own note) into a review-queue candidate, or reject it with reasons. Nothing
// here fetches the link: Cara never browses LinkedIn or any other site, which
// is the point of Phase 4 (see the design doc's source policy, approved P4-2).
//
// The gates, in order. Nothing is stored for an item the first four reject:
//   1. Source policy — the submitter confirms the item is publicly available.
//                      Paid or members-only content, including commercial
//                      toolkits, is inspiration only and never ingested.
//   2. Child data    — anything that could identify a child is REJECTED
//                      outright, not redacted and kept.
//   3. Attribution   — an item with no author is rejected.
//   4. Watchlist     — a practitioner who said no, or a listed practitioner
//                      who has not yet agreed, is held back (4a, P4-4).
//   5. Dedupe        — the same post submitted again is merged into its one
//                      candidate instead of being queued twice.
//   6. Tagging       — pattern domains, the nearest seed pattern, and every
//                      regulation the note cites, verified against the
//                      catalogue. An unverifiable citation is flagged, and the
//                      item is held as one practitioner's view.
//
// Every candidate enters as claim_basis "practitioner_view" with status
// "pending_review". Only a named human approver (4d) can change either.
// ══════════════════════════════════════════════════════════════════════════════

import { mentionsAny } from "@/lib/text/keyword-match";
import { classifyInputSensitivity } from "@/lib/cara/safety/data-protection";
import type { CaraDataSensitivity } from "@/lib/cara/core/types";
import { todayStr } from "@/lib/utils";
import { tagDomains } from "./domains";
import { PRACTICE_PATTERNS, type PatternDomain, type PracticePattern } from "./practice-patterns";
import { verifyRegulationRef } from "./regulation-verify";
import { findMatchingVoices, gateVoice, isHttpUrl, isIsoDate, type TrustedVoice, type VoiceTier } from "./trusted-voices";

// ── Records ───────────────────────────────────────────────────────────────────

export type CandidateStatus = "pending_review" | "approved" | "rejected";

export type CandidateFlag =
  | "unverified_regulation_claim" // cites a regulation the catalogue does not hold
  | "ofsted_position_claim" // speaks for Ofsted ("Ofsted expects…") — check before it reads as policy
  | "possible_commercial_content"; // mentions toolkits, bundles, paywalls — check it is not paid content

export interface CandidateSubmission {
  by: string;
  at: string; // ISO timestamp
  /** The submitter's OWN note: what the post says and why it matters. */
  note: string;
}

export interface NearestSeed {
  id: string;
  name: string;
  /** The words the candidate shares with the seed pattern: the evidence for the match. */
  shared_terms: string[];
}

export interface PatternDraft {
  name: string;
  summary: string;
  key_questions: string[];
  evidence_indicators: string[];
  failure_modes: string[];
  method: "ai" | "deterministic";
  generated_at: string;
  flags: string[];
}

export interface CandidateDecision {
  outcome: "approved" | "rejected";
  by: string;
  by_name: string;
  at: string;
  reason: string;
  pattern_id?: string;
}

export interface PatternCandidate {
  id: string;
  record_kind: "practice_pattern_candidate";
  url: string;
  dedupe_key: string;
  platform: string;
  author: string;
  published?: string; // YYYY-MM-DD
  title?: string;
  submissions: CandidateSubmission[];
  voice_id: string | null;
  tier: VoiceTier | null;
  domains: PatternDomain[];
  nearest_seed: NearestSeed | null;
  regulation_refs: { ref: string; verified: boolean }[];
  flags: CandidateFlag[];
  claim_basis: "practitioner_view";
  /** Cara's existing sensitivity classifier, run before storage and kept for the reviewer. */
  sensitivity: CaraDataSensitivity;
  status: CandidateStatus;
  received_at: string; // ISO timestamp
  draft?: PatternDraft;
  decision?: CandidateDecision;
}

export type NewCandidate = Omit<PatternCandidate, "id">;

/** Narrow a generic_records row to a candidate (a by-id read does not filter by type). */
export function isCandidateRecord(value: unknown): value is PatternCandidate {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<PatternCandidate>;
  return (
    v.record_kind === "practice_pattern_candidate" &&
    typeof v.id === "string" &&
    typeof v.url === "string" &&
    Array.isArray(v.submissions)
  );
}

export function primaryNote(c: Pick<PatternCandidate, "submissions">): string {
  return c.submissions[0]?.note ?? "";
}

// ── Limits ────────────────────────────────────────────────────────────────────

export const INTAKE_LIMITS = {
  urlMax: 2048,
  authorMax: 120,
  noteMin: 20,
  noteMax: 2000,
  titleMax: 200,
} as const;

// ── Gate 2: child data ────────────────────────────────────────────────────────

export interface RosterChild {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
}

export type ChildDataReason =
  | "names_a_child_at_the_home"
  | "named_child_with_age"
  | "child_record_identifier"
  | "nhs_number"
  | "postcode"
  | "date_of_birth";

/** What the submitter is told. Never echoes the matched name back. */
export const CHILD_DATA_REASON_TEXT: Record<ChildDataReason, string> = {
  names_a_child_at_the_home: "It mentions the name of a child who lives, or has lived, at the home.",
  named_child_with_age: "It names a child alongside their age.",
  child_record_identifier: "It contains a child record identifier.",
  nhs_number: "It contains what looks like an NHS number.",
  postcode: "It contains a postcode.",
  date_of_birth: "It contains a date of birth.",
};

const MAX_CHILD_AGE = 17;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A whole-word matcher that also respects accented letters (plain \b does not). */
function wholeWord(word: string, flags: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(word)}(?![\\p{L}\\p{N}])`, `${flags}u`);
}

function clean(name: string | null | undefined): string {
  return (name ?? "").trim().replace(/\s+/g, " ");
}

function capitalise(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function isChildAge(n: string | undefined): boolean {
  const age = Number(n);
  return Number.isInteger(age) && age >= 0 && age <= MAX_CHILD_AGE;
}

const NAMED_THEN_AGE = /\b(?:called|named)\s+[A-Z][a-z'-]+\b[^.!?\n]{0,60}?\b(\d{1,2})[- ]?(?:years?|yrs?)[- ]?old\b/g;
const AGE_THEN_NAMED = /\b(\d{1,2})[- ]?(?:years?|yrs?)[- ]?old\b[^.!?\n]{0,60}?\b(?:called|named)\s+[A-Z][a-z'-]+/g;
const NAME_AGE_BRACKET = /\b[A-Z][a-z'-]+\s*\((?:aged\s*)?(\d{1,2})\)/g;
const NAME_COMMA_AGE = /\b[A-Z][a-z'-]+,\s*(?:aged\s*)?(\d{1,2}),/g;

/**
 * Deterministic screen for anything that could identify a child.
 *
 * Children known to the home match by full name (any case) or by first or
 * preferred name as a capitalised whole word, so the verb "will" does not
 * match a child called Will, though "Will" at the start of a sentence still
 * does: the gate errs towards rejecting. With `namesOnly` (used on a link's
 * slug) only the roster check runs, because ids in URLs look like postcodes.
 *
 * Practice vocabulary is NOT an identifier: "S47", "CP plan" and "LAC review"
 * pass, which is why this does not reuse the AI gateway's sensitivity
 * detectors wholesale. The named human approver remains the final check.
 */
export function screenForChildData(
  text: string,
  roster: readonly RosterChild[],
  opts: { namesOnly?: boolean } = {},
): { blocked: boolean; reasons: ChildDataReason[] } {
  const reasons = new Set<ChildDataReason>();

  for (const c of roster) {
    const first = clean(c.first_name);
    const last = clean(c.last_name);
    const preferred = clean(c.preferred_name);
    const full = first && last ? `${first} ${last}` : "";
    const given = [first, preferred].filter((n) => n.length >= 2);
    if (
      (full && wholeWord(full, "i").test(text)) ||
      given.some((n) => wholeWord(capitalise(n), "").test(text))
    ) {
      reasons.add("names_a_child_at_the_home");
      break;
    }
  }

  if (!opts.namesOnly) {
    for (const re of [NAMED_THEN_AGE, AGE_THEN_NAMED, NAME_AGE_BRACKET, NAME_COMMA_AGE]) {
      for (const m of text.matchAll(re)) {
        if (isChildAge(m[1])) reasons.add("named_child_with_age");
      }
    }
    if (/\bchild[-_ ]?id\b/i.test(text) || /\bLAC\s*(?:no\.?|number)?\s*\d{3,}/i.test(text)) {
      reasons.add("child_record_identifier");
    }
    if (/(?<!\d)\d{3}[ -]?\d{3}[ -]?\d{4}(?!\d)/.test(text)) reasons.add("nhs_number");
    if (/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/.test(text)) reasons.add("postcode");
    if (
      /\b(?:born|dob|d\.o\.b\.?|date of birth)\b[^.!?\n]{0,25}?\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/i.test(text) ||
      /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b[^.!?\n]{0,15}?\b(?:born|dob)\b/i.test(text)
    ) {
      reasons.add("date_of_birth");
    }
  }

  return { blocked: reasons.size > 0, reasons: [...reasons] };
}

// ── Gate 5: one canonical address per post ────────────────────────────────────

const TRACKING_PARAMS = /^(utm_[a-z_]+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|trk|trkinfo|trackingid|lipi|licu|rcm|ref_src|igshid|si)$/i;

const PLATFORMS: ReadonlyArray<readonly [string, string]> = [
  ["linkedin.com", "LinkedIn"],
  ["substack.com", "Substack"],
  ["medium.com", "Medium"],
  ["youtube.com", "YouTube"],
  ["youtu.be", "YouTube"],
  ["x.com", "X"],
  ["twitter.com", "X"],
  ["facebook.com", "Facebook"],
  ["gov.uk", "GOV.UK"],
  ["wordpress.com", "WordPress"],
  ["blogspot.com", "Blogger"],
];

export function platformForHost(host: string): string {
  for (const [h, name] of PLATFORMS) if (host === h || host.endsWith(`.${h}`)) return name;
  return host;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function linkedInKey(u: URL, host: string): string | null {
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;
  const href = safeDecode(u.pathname + u.search);
  const m = href.match(/urn:li:(activity|ugcpost|share):(\d{6,})/i) ?? href.match(/\b(activity|ugcpost|share)-(\d{6,})/i);
  return m ? `linkedin:${m[1].toLowerCase()}:${m[2]}` : null;
}

export interface CanonicalUrl {
  url: string;
  key: string;
  host: string;
  platform: string;
}

/**
 * One address per post: lower-case host without "www.", no fragment, no
 * tracking parameters, sorted query, no trailing slash. LinkedIn's several
 * URL shapes for one post collapse to its activity id.
 */
export function canonicaliseUrl(raw: string): CanonicalUrl | null {
  const trimmed = (raw ?? "").trim();
  if (!isHttpUrl(trimmed)) return null;
  const u = new URL(trimmed);
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const kept = [...u.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.test(k))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const query = kept.length > 0 ? `?${new URLSearchParams(kept).toString()}` : "";
  const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : "";
  return {
    url: `${u.protocol}//${host}${path}${query}`,
    key: linkedInKey(u, host) ?? `${host}${path}${query}`,
    host,
    platform: platformForHost(host),
  };
}

function urlWords(url: string): string {
  try {
    const u = new URL(url);
    return safeDecode(`${u.pathname} ${u.search}`).replace(/[^\p{L}\p{N}']+/gu, " ");
  } catch {
    return "";
  }
}

// ── Gate 6: nearest seed pattern (shared significant words, no score) ─────────

const STOPWORDS: ReadonlySet<string> = new Set([
  "about", "after", "again", "against", "also", "because", "been", "before", "being", "between", "both",
  "could", "does", "doing", "down", "during", "each", "every", "from", "further", "have", "having",
  "here", "into", "itself", "just", "more", "most", "much", "must", "only", "other", "over", "same",
  "should", "some", "such", "than", "that", "their", "them", "then", "there", "these", "they", "this",
  "those", "through", "under", "until", "very", "what", "when", "where", "which", "while", "will",
  "with", "would", "your", "yours", "home", "homes", "children", "child", "care", "young", "people",
  "person", "staff", "practice", "make", "made", "need", "needs", "work", "working", "good", "well",
]);

function stem(w: string): string {
  if (w.length > 6 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 5 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 5 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function significantTerms(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z]+/)) {
    if (raw.length < 4 || STOPWORDS.has(raw)) continue;
    out.add(stem(raw));
  }
  return out;
}

/** Fewer shared words than this is coincidence, not a match. */
export const MIN_SHARED_TERMS = 3;

export function nearestSeedPattern(
  text: string,
  seeds: readonly PracticePattern[] = PRACTICE_PATTERNS,
): NearestSeed | null {
  const mine = significantTerms(text);
  let best: NearestSeed | null = null;
  for (const p of seeds) {
    const theirs = significantTerms(
      [p.name, p.summary, ...p.key_questions, ...p.evidence_indicators, ...p.failure_modes].join(" "),
    );
    const shared = [...mine].filter((t) => theirs.has(t)).sort();
    if (shared.length >= MIN_SHARED_TERMS && (!best || shared.length > best.shared_terms.length)) {
      best = { id: p.id, name: p.name, shared_terms: shared };
    }
  }
  return best ? { ...best, shared_terms: best.shared_terms.slice(0, 8) } : null;
}

// ── Gate 6: regulation citations, verified ────────────────────────────────────

// "Reg 44", "regulation 45(2)", "regs 44 and 45". The (?!\d) stops
// "Regulations 2015" (the title of the 2015 Regulations) reading as a citation.
const REG_CITATION = /\breg(?:ulation)?s?\.?\s*(\d{1,3})(?!\d)((?:\s*(?:,|&|and|or)\s*\d{1,3}(?!\d))*)/gi;

export function extractRegulationNumbers(text: string): number[] {
  const seen: number[] = [];
  for (const m of text.matchAll(REG_CITATION)) {
    const nums = [m[1], ...(m[2]?.match(/\d{1,3}/g) ?? [])].map(Number);
    for (const n of nums) if (Number.isFinite(n) && seen.indexOf(n) === -1) seen.push(n);
  }
  return seen;
}

const OFSTED_POSITION_CUES = [
  "ofsted requires", "ofsted expects", "ofsted wants", "ofsted says", "ofsted will", "ofsted must",
  "inspectors require", "inspectors expect", "inspectors want", "inspectors will", "inspectors look for",
];

const COMMERCIAL_CUES = [
  "toolkit", "bundle", "e-learning", "elearning", "online course", "paid course", "subscription",
  "members only", "members-only", "paywall", "buy now", "discount code", "templates pack",
];

// ── The pipeline ──────────────────────────────────────────────────────────────

export interface IntakeSubmission {
  url: string;
  author: string;
  note: string;
  published?: string;
  title?: string;
  /** The submitter confirms this is public, not paid or members-only content. */
  publicly_available: boolean;
}

export type IntakeRejectionCode =
  | "invalid_url"
  | "unattributed"
  | "note_too_short"
  | "note_too_long"
  | "title_too_long"
  | "invalid_published_date"
  | "published_in_future"
  | "not_public"
  | "child_identifiable"
  | "voice_blocked";

export interface IntakeRejection {
  code: IntakeRejectionCode;
  message: string;
}

export interface IntakeContext {
  /** The home's children, current and past, loaded via the dal. A failed load must stop the intake. */
  roster: readonly RosterChild[];
  voices: readonly TrustedVoice[];
  existing: readonly PatternCandidate[];
  submittedBy: string;
  now: string; // ISO timestamp of receipt
  today?: string; // London YYYY-MM-DD; defaults to todayStr()
  seeds?: readonly PracticePattern[];
}

export type IntakeResult =
  | { outcome: "rejected"; reasons: IntakeRejection[] }
  | { outcome: "already_decided"; existing: { id: string; status: CandidateStatus; reason: string | null } }
  | { outcome: "merged"; candidate: PatternCandidate; added: boolean }
  | { outcome: "accepted"; candidate: NewCandidate };

export function runIntakePipeline(sub: IntakeSubmission, ctx: IntakeContext): IntakeResult {
  const reasons: IntakeRejection[] = [];
  const note = typeof sub.note === "string" ? sub.note.trim() : "";
  const author = typeof sub.author === "string" ? sub.author.trim() : "";
  const title = typeof sub.title === "string" && sub.title.trim() ? sub.title.trim() : undefined;
  const today = ctx.today ?? todayStr();

  const canon =
    typeof sub.url === "string" && sub.url.length <= INTAKE_LIMITS.urlMax ? canonicaliseUrl(sub.url) : null;
  if (!canon) reasons.push({ code: "invalid_url", message: "The link must be a full http(s) address." });
  if (note.length < INTAKE_LIMITS.noteMin) {
    reasons.push({
      code: "note_too_short",
      message: `Add your own note on what the post says and why it matters (at least ${INTAKE_LIMITS.noteMin} characters).`,
    });
  }
  if (note.length > INTAKE_LIMITS.noteMax) {
    reasons.push({ code: "note_too_long", message: `Keep the note under ${INTAKE_LIMITS.noteMax} characters.` });
  }
  if (title && title.length > INTAKE_LIMITS.titleMax) {
    reasons.push({ code: "title_too_long", message: `Keep the title under ${INTAKE_LIMITS.titleMax} characters.` });
  }
  if (typeof sub.published === "string" && sub.published !== "") {
    if (!isIsoDate(sub.published)) {
      reasons.push({ code: "invalid_published_date", message: "The published date must be a real YYYY-MM-DD date." });
    } else if (sub.published > today) {
      reasons.push({ code: "published_in_future", message: "The published date cannot be in the future." });
    }
  }

  // 1. Source policy.
  if (sub.publicly_available !== true) {
    reasons.push({
      code: "not_public",
      message:
        "Only publicly available content can enter the intake. Paid or members-only content, including commercial toolkits, is inspiration only.",
    });
  }

  // 2. Child data — the note, the title and the link's slug.
  const childReasons = new Set<ChildDataReason>(screenForChildData(`${title ?? ""}\n${note}`, ctx.roster).reasons);
  if (canon) {
    for (const r of screenForChildData(urlWords(canon.url), ctx.roster, { namesOnly: true }).reasons) childReasons.add(r);
  }
  if (childReasons.size > 0) {
    reasons.push({
      code: "child_identifiable",
      message: `Anything that could identify a child is rejected, not redacted. ${[...childReasons]
        .map((r) => CHILD_DATA_REASON_TEXT[r])
        .join(" ")}`,
    });
  }

  // 3. Attribution.
  if (!author) reasons.push({ code: "unattributed", message: "Every item needs the author's name so Cara can attribute it." });

  if (reasons.length > 0 || !canon) return { outcome: "rejected", reasons };

  // 4. Watchlist.
  const gate = gateVoice(findMatchingVoices(ctx.voices, author, canon.url));
  if (!gate.allowed) return { outcome: "rejected", reasons: [{ code: "voice_blocked", message: gate.reason }] };

  // 5. Dedupe.
  const dup = ctx.existing.find((c) => c.dedupe_key === canon.key);
  if (dup) {
    if (dup.status !== "pending_review") {
      return {
        outcome: "already_decided",
        existing: { id: dup.id, status: dup.status, reason: dup.decision?.reason ?? null },
      };
    }
    const repeat = dup.submissions.some((s) => s.by === ctx.submittedBy && s.note === note);
    const submissions = repeat ? dup.submissions : [...dup.submissions, { by: ctx.submittedBy, at: ctx.now, note }];
    return { outcome: "merged", candidate: { ...dup, submissions }, added: !repeat };
  }

  // 6. Tagging.
  const text = `${title ?? ""}\n${note}`;
  const regulationRefs = extractRegulationNumbers(text).map((n) => ({
    ref: `Regulation ${n}`,
    verified: verifyRegulationRef(`Regulation ${n}`).verified,
  }));
  const flags: CandidateFlag[] = [];
  if (regulationRefs.some((r) => !r.verified)) flags.push("unverified_regulation_claim");
  if (mentionsAny(text, OFSTED_POSITION_CUES)) flags.push("ofsted_position_claim");
  if (mentionsAny(text, COMMERCIAL_CUES)) flags.push("possible_commercial_content");

  const candidate: NewCandidate = {
    record_kind: "practice_pattern_candidate",
    url: canon.url,
    dedupe_key: canon.key,
    platform: canon.platform,
    author,
    ...(typeof sub.published === "string" && sub.published !== "" ? { published: sub.published } : {}),
    ...(title ? { title } : {}),
    submissions: [{ by: ctx.submittedBy, at: ctx.now, note }],
    voice_id: gate.voice?.id ?? null,
    tier: gate.tier,
    domains: tagDomains(text),
    nearest_seed: nearestSeedPattern(text, ctx.seeds ?? PRACTICE_PATTERNS),
    regulation_refs: regulationRefs,
    flags,
    claim_basis: "practitioner_view",
    sensitivity: classifyInputSensitivity(text, "training_material_generation"),
    status: "pending_review",
    received_at: ctx.now,
  };
  return { outcome: "accepted", candidate };
}
