// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE EVOLUTION ENGINE (pure)
//
// runKnowledgeEvolution(input) scores each KB entry against the practice corpus
// (how often its keywords appear, how fresh it is) to derive a lifecycle signal,
// and scans for COVERAGE GAPS — recurring practice themes that no KB entry
// addresses. It emits evolution proposals: codify a gap, review a stale entry,
// embed a dormant one, reinforce an embedded one.
//
// Pure — no store, no model. Word-boundary matching only (mentionsAny), so
// "care" never matches "scared". PROPOSES; never edits knowledge.
// ══════════════════════════════════════════════════════════════════════════════

import { mentionsAny } from "@/lib/text/keyword-match";
import {
  KNOWLEDGE_EVOLUTION_VERSION,
  type EntryLifecycle,
  type EvolutionProposal,
  type KBEntrySignal,
  type KnowledgeEvolutionInput,
  type KnowledgeEvolutionReport,
  type ProposalSeverity,
} from "./types";

const DISCLAIMER =
  "Cara proposes how the knowledge base should evolve against what practice actually does — a practice lead decides. Cara never auto-edits practice knowledge; clinical and practice models are an expert judgement, not a machine's.";

// ── Practice theme catalogue ──────────────────────────────────────────────────
// Important themes for a children's home. Each is checked two ways: does it
// appear in the records, and does ANY KB entry already cover it? A theme that
// recurs in practice but no entry covers is a coverage gap. This is dynamic — add
// a KB entry with matching keywords and the gap closes automatically.
interface Theme {
  id: string;
  label: string;
  keywords: string[];
}

const THEME_CATALOGUE: Theme[] = [
  { id: "self_harm", label: "Self-harm and suicidal ideation", keywords: ["self-harm", "self harm", "selfharm", "suicidal", "suicide", "ligature", "overdose"] },
  { id: "exploitation", label: "Child exploitation (CSE / CCE / county lines)", keywords: ["exploitation", "cse", "cce", "county lines", "grooming", "trafficking"] },
  { id: "substance", label: "Substance misuse", keywords: ["substance", "drugs", "cannabis", "alcohol", "vaping", "nitrous"] },
  { id: "online_safety", label: "Online and digital safety", keywords: ["online safety", "social media", "sexting", "online grooming", "screen time"] },
  { id: "bereavement", label: "Bereavement, loss and grief", keywords: ["bereavement", "grief", "grieving", "loss of", "died", "funeral"] },
  { id: "neurodiversity", label: "Neurodiversity (autism / ADHD / sensory)", keywords: ["autism", "autistic", "adhd", "sensory", "neurodivergent", "stimming"] },
  { id: "contextual_safeguarding", label: "Contextual safeguarding (harm outside the home)", keywords: ["contextual safeguarding", "peer group", "extra-familial", "gang"] },
  { id: "transitions", label: "Transitions and leaving care", keywords: ["leaving care", "transition to", "moving on", "independence plan", "pathway plan"] },
  { id: "family_contact", label: "Family contact and relationships", keywords: ["family contact", "family time", "supervised contact", "birth family"] },
  { id: "education", label: "Education engagement and school refusal", keywords: ["school refusal", "not attending school", "exclusion", "education engagement", "reintegration"] },
  { id: "restraint_reduction", label: "Restraint reduction and physical intervention", keywords: ["restraint reduction", "physical intervention", "de-escalation", "restrictive practice"] },
  { id: "cultural_identity", label: "Cultural identity and anti-oppressive practice", keywords: ["cultural identity", "anti-oppressive", "racism", "religion", "heritage"] },
];

function monthsBetween(fromISO: string, asOf: string): number {
  const a = new Date(fromISO).getTime();
  const b = new Date(asOf).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / (30 * 86_400_000)));
}

export function runKnowledgeEvolution(input: KnowledgeEvolutionInput): KnowledgeEvolutionReport {
  const reviewDueMonths = input.reviewDueMonths ?? 12;
  const corpus = input.corpus;

  // ── Per-entry lifecycle ─────────────────────────────────────────────────────
  const entrySignals: KBEntrySignal[] = input.entries.map((e) => {
    const sources = new Set<string>();
    let references = 0;
    for (const rec of corpus) {
      if (mentionsAny(rec.text, e.keywords)) {
        references++;
        sources.add(rec.recordType);
      }
    }
    const ageMonths = monthsBetween(e.ingestedAt, input.asOf);
    const stale = ageMonths >= reviewDueMonths || !e.reviewed;

    let lifecycle: EntryLifecycle;
    if (references === 0) lifecycle = "dormant";
    else if (references <= 2) lifecycle = "emerging";
    else lifecycle = "embedded";
    // Freshness overrides: a stale entry is flagged for review regardless of use.
    if (stale) lifecycle = "review_due";

    return { id: e.id, title: e.title, type: e.type, references, sources: [...sources], ageMonths, reviewed: e.reviewed, lifecycle };
  });

  // ── Coverage gaps ───────────────────────────────────────────────────────────
  // A theme is "covered" if any KB entry's keywords overlap the theme's keywords.
  const entryKeywordText = input.entries.map((e) => `${e.title} ${e.keywords.join(" ")}`.toLowerCase());
  const isCoveredByKB = (theme: Theme): boolean =>
    entryKeywordText.some((kw) => mentionsAny(kw, theme.keywords));

  const proposals: EvolutionProposal[] = [];
  let coverageGaps = 0;

  for (const theme of THEME_CATALOGUE) {
    const hits = corpus.filter((rec) => mentionsAny(rec.text, theme.keywords)).length;
    if (hits === 0) continue; // theme doesn't appear in practice → not a gap here
    if (isCoveredByKB(theme)) continue; // KB already addresses it
    coverageGaps++;
    const severity: ProposalSeverity = hits >= 5 ? "high" : hits >= 2 ? "medium" : "low";
    proposals.push({
      id: `ke_gap_${theme.id}`,
      kind: "codify_gap",
      severity,
      title: `No knowledge on: ${theme.label}`,
      evidence: `Appears in ${hits} record${hits === 1 ? "" : "s"} across practice, but no knowledge-base entry addresses it.`,
      recommendation: `Consider adding a knowledge-base entry on ${theme.label.toLowerCase()} so staff have a grounded, shared approach — the theme is live in this home.`,
      humanDecisionRequired: true,
    });
  }

  // ── Entry proposals from lifecycle ──────────────────────────────────────────
  for (const s of entrySignals) {
    if (s.lifecycle === "review_due") {
      const why = !s.reviewed ? "has never been reviewed" : `was last ingested ${s.ageMonths} month${s.ageMonths === 1 ? "" : "s"} ago`;
      proposals.push({
        id: `ke_review_${s.id}`,
        kind: "review_entry",
        severity: "medium",
        title: `Review knowledge: ${s.title}`,
        evidence: `This entry ${why}. Practice, evidence and language move on — knowledge should be revisited.`,
        recommendation: "A practice lead should review the entry against current evidence and this home's practice, then mark it reviewed.",
        relatedEntryId: s.id,
        humanDecisionRequired: true,
      });
    } else if (s.lifecycle === "dormant") {
      proposals.push({
        id: `ke_embed_${s.id}`,
        kind: "embed_dormant",
        severity: "low",
        title: `Not reaching practice: ${s.title}`,
        evidence: "This knowledge is in the base but never appears in the home's records — the idea isn't landing in day-to-day practice.",
        recommendation: "Decide whether to embed it (supervision, a Cara Studio activity, team reflection) or retire it if it no longer fits. Don't leave it dormant.",
        relatedEntryId: s.id,
        humanDecisionRequired: true,
      });
    } else if (s.lifecycle === "embedded") {
      proposals.push({
        id: `ke_reinforce_${s.id}`,
        kind: "reinforce",
        severity: "low",
        title: `Well embedded: ${s.title}`,
        evidence: `Referenced across ${s.references} records (${s.sources.join(", ")}) — this knowledge is genuinely shaping practice.`,
        recommendation: "Keep reinforcing it; it's a strength to name in supervision and inspection evidence.",
        relatedEntryId: s.id,
        humanDecisionRequired: true,
      });
    }
  }

  // Most actionable first: gaps & reviews above reinforcements.
  const KIND_RANK: Record<string, number> = { codify_gap: 0, review_entry: 1, embed_dormant: 2, reinforce: 3 };
  const SEV_RANK: Record<ProposalSeverity, number> = { high: 0, medium: 1, low: 2 };
  proposals.sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || SEV_RANK[a.severity] - SEV_RANK[b.severity]);

  const summary = {
    entries: entrySignals.length,
    embedded: entrySignals.filter((s) => s.lifecycle === "embedded").length,
    emerging: entrySignals.filter((s) => s.lifecycle === "emerging").length,
    dormant: entrySignals.filter((s) => s.lifecycle === "dormant").length,
    reviewDue: entrySignals.filter((s) => s.lifecycle === "review_due").length,
    coverageGaps,
  };

  return {
    homeId: input.homeId,
    asOf: input.asOf,
    entrySignals,
    proposals,
    summary,
    disclaimer: DISCLAIMER,
    engineVersion: KNOWLEDGE_EVOLUTION_VERSION,
  };
}

export { KNOWLEDGE_EVOLUTION_VERSION };
