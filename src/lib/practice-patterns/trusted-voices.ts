// ══════════════════════════════════════════════════════════════════════════════
// Cara — Trusted-voices watchlist model (Phase 4a)
//
// The watchlist records whose published practice writing deserves a closer
// look. Its curator-set tier only ORDERS the review queue — it never approves
// anything: every pattern still needs a named human approver (4d).
//
// Decisions this file enforces (Phase 4 design doc, all decided 9 Nov 2026):
//   P4-3  Quality is a curator tier 1–3 with a written rationale, set against
//         four written tests. There is no algorithmic score, and nothing here
//         reads likes, follower counts or any other engagement data.
//   P4-4  Ask first. A listed practitioner's items reach the queue only once
//         their agreement is recorded. An opt-out, a decline or a withdrawal
//         blocks them outright, whatever else the entry says.
//   P4-7  The watchlist is personal data about named professionals. It starts
//         EMPTY and no one is added on live until the DPO has signed off the
//         legitimate interests assessment — there is deliberately no seed list.
//
// Each entry is a `trusted_voice` record in generic_records (no migration).
// ══════════════════════════════════════════════════════════════════════════════

import { todayStr } from "@/lib/utils";
import { isPatternDomain } from "./domains";
import type { PatternDomain } from "./practice-patterns";

// ── Tiers and the four written tests ──────────────────────────────────────────

export type VoiceTier = 1 | 2 | 3;
export const VOICE_TIERS: readonly VoiceTier[] = [1, 2, 3];

export type TierTestId =
  | "anchors_to_duties"
  | "verifiable_experience"
  | "original_work"
  | "fits_english_residential_care";

/** The written tests a curator answers before setting a tier (the "tier tests as data"). */
export const TIER_TESTS: ReadonlyArray<{ id: TierTestId; question: string }> = [
  {
    id: "anchors_to_duties",
    question: "Does their writing anchor practice to specific duties: regulations, quality standards or statutory guidance?",
  },
  { id: "verifiable_experience", question: "Can their experience be verified from public sources?" },
  { id: "original_work", question: "Is the work their own, rather than reposted from someone else?" },
  {
    id: "fits_english_residential_care",
    question: "Does it fit children's residential care in England?",
  },
];

/** A rationale shorter than this does not explain a tier — it labels one. */
export const MIN_RATIONALE_CHARS = 30;

/** Tiers are re-checked quarterly. */
export const REVIEW_INTERVAL_MONTHS = 3;

// ── Permission (P4-4) ─────────────────────────────────────────────────────────

export type PermissionStatus = "not_asked" | "asked" | "agreed" | "declined" | "withdrawn";
export const PERMISSION_STATUSES: readonly PermissionStatus[] = [
  "not_asked",
  "asked",
  "agreed",
  "declined",
  "withdrawn",
];

export interface VoicePermission {
  status: PermissionStatus;
  /** How agreement (or a refusal) was given, e.g. "email reply to the RM". */
  how?: string;
  recorded_by?: string;
  recorded_at?: string; // YYYY-MM-DD
}

// ── The record ────────────────────────────────────────────────────────────────

export type VoiceChannelKind = "newsletter" | "blog" | "rss" | "website" | "profile";

export interface VoiceChannel {
  kind: VoiceChannelKind;
  /** Where their work appears. A profile URL is for MANUAL reading only. */
  url: string;
}

export interface TrustedVoice {
  id: string;
  /** As they publicly state it. */
  name: string;
  role?: string;
  organisation?: string;
  channels: VoiceChannel[];
  domains: PatternDomain[];
  tier: VoiceTier;
  /** The written reason for that tier. */
  rationale: string;
  /** The curator's answer to each of the four written tests. */
  tier_tests: Record<TierTestId, boolean>;
  /** The named curator who set the tier. */
  added_by: string;
  added_at: string; // YYYY-MM-DD
  review_due: string; // YYYY-MM-DD
  permission: VoicePermission;
  /** false = removed from the watchlist by the curator (recorded, not deleted). */
  active: boolean;
  /** true = the practitioner asked to be left out. Recorded, never deleted. */
  opted_out: boolean;
  opted_out_at?: string; // YYYY-MM-DD
}

// ── Small, dependency-free helpers ────────────────────────────────────────────

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one. UTC, so no local-time drift.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** A real calendar date written YYYY-MM-DD (rejects 2026-02-30). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(y, m);
}

/** An http(s) link with a real host and no embedded credentials. */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return (u.protocol === "https:" || u.protocol === "http:") && !u.username && !u.password && /\./.test(u.hostname);
  } catch {
    return false;
  }
}

/** Calendar-month arithmetic on a YYYY-MM-DD date, clamping to the month's last day. */
export function addMonthsIso(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return `${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

export function nextQuarterlyReview(fromDate: string): string {
  return addMonthsIso(fromDate, REVIEW_INTERVAL_MONTHS);
}

/** Overdue once the review date has passed (a review due today is not yet overdue). */
export function isReviewOverdue(voice: TrustedVoice, today: string = todayStr()): boolean {
  return voice.review_due < today;
}

// ── Validation (4a eval: no rationale or no curator → rejected) ───────────────

export interface VoiceValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateTrustedVoice(v: TrustedVoice): VoiceValidationResult {
  const errors: string[] = [];
  if (!v.id?.trim()) errors.push("id is required");
  if (!v.name?.trim()) errors.push("name is required");
  if (!VOICE_TIERS.some((t) => t === v.tier)) errors.push("tier must be 1, 2 or 3");

  const rationale = v.rationale?.trim() ?? "";
  if (!rationale) errors.push("a written rationale for the tier is required");
  else if (rationale.length < MIN_RATIONALE_CHARS) {
    errors.push(`the rationale must explain the tier (at least ${MIN_RATIONALE_CHARS} characters)`);
  }
  if (!v.added_by?.trim()) errors.push("the named curator who set the tier (added_by) is required");

  for (const t of TIER_TESTS) {
    if (typeof v.tier_tests?.[t.id] !== "boolean") errors.push(`tier test "${t.id}" must be answered`);
  }

  if (!isIsoDate(v.added_at)) errors.push("added_at must be a YYYY-MM-DD date");
  if (!isIsoDate(v.review_due)) errors.push("review_due must be a YYYY-MM-DD date");
  else if (isIsoDate(v.added_at) && v.review_due <= v.added_at) {
    errors.push("review_due must fall after added_at");
  }

  if (!Array.isArray(v.domains) || v.domains.length === 0) {
    errors.push("at least one practice domain is required");
  } else {
    for (const d of v.domains) if (!isPatternDomain(d)) errors.push(`unknown domain "${String(d)}"`);
  }

  for (const c of v.channels ?? []) {
    if (!isHttpUrl(c.url)) errors.push(`channel is not an http(s) link: ${String(c.url)}`);
  }

  const status = v.permission?.status;
  if (!PERMISSION_STATUSES.some((s) => s === status)) errors.push("permission status is required");
  if (status === "agreed") {
    if (!v.permission.how?.trim()) errors.push("agreement must record how it was given");
    if (!v.permission.recorded_by?.trim()) errors.push("agreement must record who recorded it");
    if (!isIsoDate(v.permission.recorded_at)) errors.push("agreement must record the date it was given");
  }

  if (typeof v.active !== "boolean") errors.push("active must be recorded");
  if (typeof v.opted_out !== "boolean") errors.push("opted_out must be recorded");
  if (v.opted_out && !isIsoDate(v.opted_out_at)) errors.push("an opt-out must record its date");

  return { ok: errors.length === 0, errors };
}

// ── Matching an item's author to a watchlist entry ────────────────────────────

/** Platforms many authors share: a host match there needs a path match too. */
const SHARED_HOSTS: ReadonlySet<string> = new Set([
  "medium.com",
  "youtube.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
  "threads.net",
  "tiktok.com",
]);

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

function linkedInVanity(u: URL): string | null {
  const host = stripWww(u.hostname);
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;
  const segs = u.pathname.split("/").filter(Boolean);
  if (segs[0] === "in" && segs[1]) return segs[1].toLowerCase();
  if (segs[0] === "posts" && segs[1]) return (segs[1].split("_")[0] ?? "").toLowerCase() || null;
  return null;
}

function isLinkedIn(u: URL): boolean {
  const host = stripWww(u.hostname);
  return host === "linkedin.com" || host.endsWith(".linkedin.com");
}

function firstPathSegment(u: URL): string | null {
  return u.pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? null;
}

/** Case-, accent- and honorific-insensitive; drops a trailing "(role, organisation)". */
export function normaliseName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(dr|mr|mrs|ms|miss|prof)\b\.?/g, " ")
    .replace(/[^a-z'\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Does this item URL belong to one of the voice's channels? */
export function voiceMatchesUrl(voice: TrustedVoice, url: string): boolean {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return false;
  }
  const targetHost = stripWww(target.hostname);
  for (const ch of voice.channels) {
    let cu: URL;
    try {
      cu = new URL(ch.url);
    } catch {
      continue;
    }
    if (isLinkedIn(target)) {
      // LinkedIn: only the member's own vanity name identifies them.
      const a = linkedInVanity(target);
      const b = isLinkedIn(cu) ? linkedInVanity(cu) : null;
      if (a && b && a === b) return true;
      continue;
    }
    if (stripWww(cu.hostname) !== targetHost) continue;
    if (!SHARED_HOSTS.has(targetHost)) return true;
    const a = firstPathSegment(cu);
    const b = firstPathSegment(target);
    if (a && b && a === b) return true;
  }
  return false;
}

/** Every watchlist entry that matches the item's author by name or by channel. */
export function findMatchingVoices(voices: readonly TrustedVoice[], author: string, url: string): TrustedVoice[] {
  const name = normaliseName(author);
  return voices.filter((v) => (name !== "" && normaliseName(v.name) === name) || voiceMatchesUrl(v, url));
}

// ── The gate (4a eval: no recorded permission, or opted out → never queued) ──

export type VoiceGateResult =
  | { allowed: true; voice: TrustedVoice | null; tier: VoiceTier | null }
  | { allowed: false; voice: TrustedVoice; reason: string };

function saidNo(v: TrustedVoice): string | null {
  if (v.opted_out) return "This practitioner has opted out of Cara's intake.";
  if (v.permission?.status === "declined") return "This practitioner declined to be referenced.";
  if (v.permission?.status === "withdrawn") return "This practitioner withdrew their agreement.";
  return null;
}

/**
 * Decide whether an item from these matched voices may enter the queue.
 *
 *   1. Any matched entry where the person said no (opt-out, decline,
 *      withdrawal) blocks the item — safety first when entries disagree.
 *   2. An active entry with recorded agreement lets it in at that tier.
 *   3. An active entry still waiting for an answer blocks it (ask first).
 *   4. No entry, or only removed entries without a "no": the item enters
 *      untiered, like any other link a person saved (source policy, P4-2).
 */
export function gateVoice(matches: readonly TrustedVoice[]): VoiceGateResult {
  for (const v of matches) {
    const no = saidNo(v);
    if (no) return { allowed: false, voice: v, reason: no };
  }
  const active = matches.filter((v) => v.active === true);
  const agreed = active.find((v) => v.permission?.status === "agreed");
  if (agreed) return { allowed: true, voice: agreed, tier: agreed.tier };
  const waiting = active[0];
  if (waiting) {
    return {
      allowed: false,
      voice: waiting,
      reason: "This practitioner is on the watchlist but has not yet agreed to be referenced (P4-4: ask first).",
    };
  }
  return { allowed: true, voice: null, tier: null };
}
