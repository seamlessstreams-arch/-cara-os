// ─────────────────────────────────────────────────────────────────────────────
// Protective Relationships Engine
//
// Reads a child's relationship map and surfaces how protective their network is,
// where the risks are, and — by cross-referencing incidents and missing episodes
// — when a risky person is showing up in what's actually happening. Every flag is
// explainable. Deterministic (injected `now`, no LLM) → prod-safe.
// ─────────────────────────────────────────────────────────────────────────────

import type { RelationshipEntry, RelationshipCategory } from "./types";
import type { PostIncidentReflection } from "@/lib/post-incident-reflection/types";
import type { Incident } from "@/types";
import type { MissingEpisode } from "@/types/extended";

export type FlagSeverity = "info" | "advisory" | "high";

export interface RelationshipFlag {
  key: string;
  severity: FlagSeverity;
  message: string;
  why: string;
}

export interface ChildRelationshipAnalysis {
  childId: string;
  protectiveCount: number;
  riskCount: number;
  neutralCount: number;
  trustedAdultCount: number;
  status: "secure" | "developing" | "fragile";
  flags: RelationshipFlag[];
}

const TRUSTED_CATEGORIES: RelationshipCategory[] = ["safe_adult", "trusted_professional", "goto_when_upset", "family_support"];

function daysSince(dateIso: string | undefined, now: string): number {
  if (!dateIso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return Number.POSITIVE_INFINITY;
  return (n - t) / 86_400_000;
}

function isPast(dateIso: string | null | undefined, now: string): boolean {
  if (!dateIso) return false;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return false;
  return t < n;
}

const NAME_TITLES = new Set([
  "mr", "mrs", "ms", "miss", "dr", "sir", "uncle", "aunt", "auntie",
  "nan", "nana", "gran", "grandad", "granddad", "grandma", "grandmother", "grandfather",
]);

/** Significant name tokens (≥3 chars, not a title prefix), lowercased. */
function nameTokens(name: string): string[] {
  return (name || "").toLowerCase().split(/[\s.]+/).filter((t) => t.length >= 3 && !NAME_TITLES.has(t));
}

/**
 * Whether any significant token of `name` appears as a WHOLE WORD in `text`.
 * Whole-word matching (not substring) avoids false positives like "Sam" matching
 * "same" or "Mark" matching "market", which would wrongly flag a risk person as
 * named in a safeguarding incident. Title prefixes ("Mr", "Uncle") are skipped so
 * a name recorded with a title still matches on the actual name.
 */
function nameInText(name: string, text: string): boolean {
  const tokens = nameTokens(name);
  if (tokens.length === 0) return false;
  const lower = text.toLowerCase();
  return tokens.some((tok) => {
    const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(lower);
  });
}

export function analyseChildRelationships(
  entries: RelationshipEntry[],
  incidents: Incident[],
  missing: MissingEpisode[],
  now: string,
  recentWindowDays = 90,
): ChildRelationshipAnalysis {
  const active = entries.filter((e) => e.status !== "archived");
  const protectiveCount = active.filter((e) => e.rating === "protective").length;
  const riskCount = active.filter((e) => e.rating === "risk").length;
  const neutralCount = active.filter((e) => e.rating === "neutral").length;
  const trustedAdultCount = active.filter((e) => e.rating === "protective" && TRUSTED_CATEGORIES.includes(e.category)).length;

  const childId = active[0]?.child_id ?? entries[0]?.child_id ?? "";
  const inWindow = (d: string) => {
    const days = daysSince(d, now);
    return days >= 0 && days <= recentWindowDays; // exclude future-dated records
  };
  const recentIncidents = incidents.filter((i) => inWindow(i.date));
  const recentMissing = missing.filter((m) => inWindow(m.date_missing));

  const flags: RelationshipFlag[] = [];

  if (trustedAdultCount === 0) {
    flags.push({
      key: "no-trusted-adult",
      severity: "high",
      message: "No protective trusted adult is identified.",
      why: "A trusted adult the child turns to is the single biggest protective factor — make identifying one a priority.",
    });
  }

  // A risky person named in a recent incident description.
  const namedInIncident = active.filter((e) => {
    if (e.rating !== "risk") return false;
    return recentIncidents.some((i) => nameInText(e.name, i.description ?? ""));
  });
  if (namedInIncident.length > 0) {
    flags.push({
      key: "unsafe-in-incident",
      severity: "high",
      message: `${namedInIncident.map((e) => e.name).join(", ")} appears in a recent incident.`,
      why: "A person rated as a risk is showing up in what's actually happening — review contact and safety planning.",
    });
  }

  // A risk peer / missing-linked person while the child has been going missing.
  const riskPeerMissing = active.some((e) => e.rating === "risk" && ["risk_peer", "linked_to_missing", "exploitation_risk"].includes(e.category));
  if (riskPeerMissing && recentMissing.length > 0) {
    flags.push({
      key: "risk-peer-missing",
      severity: "high",
      message: "A risk relationship is recorded and the child has gone missing recently.",
      why: "Risky peers and missing episodes often connect — check return-home interviews and contextual safeguarding.",
    });
  }

  const riskNoReview = active.filter((e) => e.rating === "risk" && (!e.review_date || isPast(e.review_date, now)));
  if (riskNoReview.length > 0) {
    flags.push({
      key: "risk-no-review",
      severity: "advisory",
      message: `${riskNoReview.length} risk relationship${riskNoReview.length === 1 ? "" : "s"} with no current review.`,
      why: "Risk relationships need regular review so the picture stays accurate.",
    });
  }

  const hasHighFlag = flags.some((f) => f.severity === "high");
  const status: ChildRelationshipAnalysis["status"] =
    trustedAdultCount >= 2 && !hasHighFlag
      ? "secure"
      : trustedAdultCount === 0 || (riskCount > protectiveCount && hasHighFlag)
        ? "fragile"
        : "developing";

  return { childId, protectiveCount, riskCount, neutralCount, trustedAdultCount, status, flags };
}

// ── Home-wide overview ───────────────────────────────────────────────────────

export interface RelationshipAlert {
  key: string;
  label: string;
  why: string;
  items: string[];
}

export interface ChildRelationshipSummary {
  childId: string;
  childName: string;
  entryCount: number;
  analysis: ChildRelationshipAnalysis;
}

export interface RelationshipsOverview {
  generatedAt: string;
  headline: string;
  homeStatus: "settled" | "monitor" | "action_needed";
  childrenWithoutMap: { id: string; name: string }[];
  alerts: RelationshipAlert[];
  children: ChildRelationshipSummary[];
}

export interface RelationshipsOverviewInput {
  now: string;
  entries: RelationshipEntry[];
  children: { id: string; name: string }[];
  reflections: PostIncidentReflection[];
  incidents: Incident[];
  missing: MissingEpisode[];
  recentWindowDays?: number;
}

export function buildRelationshipsOverview(input: RelationshipsOverviewInput): RelationshipsOverview {
  const nameOf = (id: string) => input.children.find((c) => c.id === id)?.name ?? "Child";
  const windowDays = input.recentWindowDays ?? 90;

  const byChild = new Map<string, RelationshipEntry[]>();
  for (const e of input.entries) byChild.set(e.child_id, [...(byChild.get(e.child_id) ?? []), e]);

  const summaries: ChildRelationshipSummary[] = [...byChild.entries()]
    .map(([childId, entries]) => ({
      childId,
      childName: nameOf(childId),
      entryCount: entries.length,
      analysis: analyseChildRelationships(
        entries,
        input.incidents.filter((i) => i.child_id === childId),
        input.missing.filter((m) => m.child_id === childId),
        input.now,
        windowDays,
      ),
    }))
    .sort((a, b) => a.childName.localeCompare(b.childName));

  const childrenWithMap = new Set(byChild.keys());
  const childrenWithoutMap = input.children.filter((c) => !childrenWithMap.has(c.id));

  const reviewFlaggedChildren = [
    ...new Set(
      input.reflections
        .filter((r) => r.relationship_map_review && daysSince(r.incident_date, input.now) <= windowDays)
        .map((r) => r.child_id),
    ),
  ];

  const mk = (key: string, label: string, why: string, items: string[]): RelationshipAlert | null =>
    items.length ? { key, label, why, items: [...new Set(items)] } : null;

  const alerts = [
    mk("no_map", "Children with no relationship map", "Understanding a child's network is core to keeping them safe.", childrenWithoutMap.map((c) => c.name)),
    mk("review_flagged", "Relationship maps flagged for review after an incident", "A recent post-incident reflection asked for this child's map to be revisited.", reviewFlaggedChildren.map(nameOf)),
    mk("no_trusted_adult", "Children with no trusted protective adult", "A trusted adult is the strongest protective factor — prioritise building one.", summaries.filter((s) => s.analysis.flags.some((f) => f.key === "no-trusted-adult")).map((s) => s.childName)),
    mk("unsafe_in_incident", "A risky person appears in a recent incident", "A person rated as a risk is showing up in what's actually happening.", summaries.filter((s) => s.analysis.flags.some((f) => f.key === "unsafe-in-incident")).map((s) => s.childName)),
    mk("risk_peer_missing", "Risk relationships linked to recent missing episodes", "Risky peers and going missing often connect.", summaries.filter((s) => s.analysis.flags.some((f) => f.key === "risk-peer-missing")).map((s) => s.childName)),
  ].filter((a): a is RelationshipAlert => a !== null);

  const fragile = summaries.filter((s) => s.analysis.status === "fragile").length;
  const homeStatus: RelationshipsOverview["homeStatus"] =
    childrenWithoutMap.length > 0 || fragile > 0 || reviewFlaggedChildren.length > 0
      ? "action_needed"
      : alerts.length > 0
        ? "monitor"
        : "settled";

  const headline =
    summaries.length === 0 && childrenWithoutMap.length === 0
      ? "No relationship maps yet."
      : childrenWithoutMap.length > 0
        ? `${childrenWithoutMap.length} ${childrenWithoutMap.length === 1 ? "child has" : "children have"} no relationship map; ${fragile} fragile network${fragile === 1 ? "" : "s"}.`
        : `${summaries.length} relationship map${summaries.length === 1 ? "" : "s"}; ${fragile} need attention.`;

  return {
    generatedAt: input.now,
    headline,
    homeStatus,
    childrenWithoutMap,
    alerts,
    children: summaries,
  };
}
