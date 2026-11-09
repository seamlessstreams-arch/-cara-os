// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE PATTERNS  (pure · deterministic · inspectable)
//
// A curated library of GENERAL practice patterns — repeatable shapes of good
// practice for children's residential care — that Cara reasons with and can
// surface to registered managers (RMs) and responsible individuals (RIs).
//
// Distinct from two neighbours:
//   - cara/knowledge-base.ts (KB_ENTRIES) — doctrine/models/frameworks.
//   - practice_bank_entries (DB)          — a CHILD-SPECIFIC "what works" bank.
// This collection is the home-agnostic "how good practice is shaped" layer,
// tagged by domain and linked to the regulatory spine so retrieval can go
// regulation → practice questions → evidence.
//
// INSPECTABILITY (safety rail): every pattern carries a `claim_basis` — is it
// a statutory duty, a Quality Standard, widely-held good practice, one
// practitioner's attributed view, or Cara's own doctrine? Cara must never
// present "good practice suggests" as "regulation says", nor a practitioner's
// view as Ofsted's position.
//
// CONTENT HANDLING: patterns derived from an external practitioner's content
// are PARAPHRASED in Cara's own words and MUST carry source attribution. No
// third party's wording or commercial toolkits are reproduced here.
//
// Pure: no store, no AI, no imports — any engine may use it without cycles.
// schema v0.1.0 — seeded 2026-11-09
// ══════════════════════════════════════════════════════════════════════════════

// ── Claim basis — the authority behind a pattern (safety rail F) ───────────────

export type ClaimBasis =
  | "regulation" // a statutory duty under the Children's Homes (England) Regs 2015
  | "quality_standard" // drawn from a Quality Standard (SCCIF)
  | "good_practice" // widely-held good practice — NOT a statutory requirement
  | "practitioner_view" // one practitioner's attributed position — not regulation, not Ofsted
  | "cara_doctrine"; // Cara's own relational, love-led stance

export const CLAIM_BASIS_META: Record<ClaimBasis, { label: string; note: string }> = {
  regulation: {
    label: "Regulation says",
    note: "A statutory duty under the Children's Homes (England) Regulations 2015. Cite the regulation number only when verified against the source.",
  },
  quality_standard: {
    label: "Quality Standard",
    note: "Drawn from a Quality Standard (SCCIF) — a standard to be met, not a specific regulation clause.",
  },
  good_practice: {
    label: "Good practice suggests",
    note: "Widely-held good practice. Helpful and defensible, but not in itself a statutory requirement.",
  },
  practitioner_view: {
    label: "One practitioner's view",
    note: "An attributed practitioner position, offered as perspective. Not regulation and not Ofsted's position.",
  },
  cara_doctrine: {
    label: "Cara's stance",
    note: "Cara's own relational, love-led practice doctrine.",
  },
};

// ── Domains (retrieval tags) ──────────────────────────────────────────────────

export type PatternDomain =
  | "reg-14"
  | "reg-40"
  | "reg-44"
  | "reg-45"
  | "admissions"
  | "matching"
  | "safer-recruitment"
  | "safeguarding"
  | "rm-ri-oversight"
  | "l-and-d"
  | "reflective-practice"
  | "recording-quality"
  | "document-control"
  | "placement-stability"
  | "evidence-vs-evaluation"
  | "human-outcomes"
  | "connected-system";

// ── Source attribution + provenance ───────────────────────────────────────────

export interface SourceAttribution {
  author: string; // e.g. "Linzi Sim (Managing Director, Outcomes Consulting Ltd)"
  platform: string; // e.g. "LinkedIn"
  published?: string; // ISO date of the source post, when known
  url?: string; // specific source URL, when known
  note?: string; // handling note (e.g. paraphrase + commercial-toolkit caveat)
}

export type PatternProvenance =
  | "derived_external" // paraphrased from an external practitioner's content (needs attribution)
  | "cara_authored" // authored by Cara's team
  | "regulatory_source"; // taken from a statutory/regulatory source

export type PatternStatus = "approved" | "pending_review" | "rejected";
export type PatternConfidence = "high" | "medium" | "low";

export interface PracticePattern {
  id: string;
  name: string;
  summary: string; // Cara's OWN paraphrase — never the source's wording
  domains: PatternDomain[];
  claim_basis: ClaimBasis;
  regulation_refs: string[]; // e.g. ["reg-45"] — links to regulation-mapping.service
  quality_standard_refs: string[]; // e.g. ["1.1"]
  key_questions: string[]; // the reflective questions this pattern asks
  evidence_indicators: string[]; // what good evidence of this pattern looks like
  failure_modes: string[]; // common ways this goes wrong
  source: SourceAttribution;
  provenance: PatternProvenance;
  confidence: PatternConfidence;
  retrieved_at: string; // ISO date this pattern entered the library
  status: PatternStatus;
}

// ── Validation (anti-fabrication / attribution gate) ──────────────────────────

export interface PatternValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Deterministic integrity + attribution check. A pattern PARAPHRASED from an
 * external source MUST carry author attribution — an unattributed derived
 * pattern is rejected (never silently stored). Also guards the claim-basis
 * vocabulary so nothing can masquerade as a different kind of authority.
 */
export function validatePracticePattern(p: PracticePattern): PatternValidationResult {
  const errors: string[] = [];
  if (!p.id?.trim()) errors.push("pattern must have an id");
  if (!p.name?.trim()) errors.push("pattern must have a name");
  if (!p.summary?.trim()) errors.push("pattern must have a summary");
  if (!CLAIM_BASIS_META[p.claim_basis]) {
    errors.push(`invalid claim_basis: ${String(p.claim_basis)}`);
  }
  if (p.provenance === "derived_external") {
    if (!p.source || !p.source.author?.trim()) {
      errors.push("a derived_external pattern must carry source.author attribution");
    }
    if (!p.source || !p.source.platform?.trim()) {
      errors.push("a derived_external pattern must name the source platform");
    }
  }
  // A regulation-basis claim must point at a regulation; a good-practice claim
  // must NOT be dressed up as a statutory duty by claiming regulation basis.
  if (p.claim_basis === "regulation" && p.regulation_refs.length === 0) {
    errors.push("a regulation claim_basis must cite at least one regulation_ref");
  }
  return { ok: errors.length === 0, errors };
}

// ── The seeded library (paraphrased + attributed) ─────────────────────────────
//
// Each pattern below is paraphrased in Cara's own words from publicly-observed
// practice content by Linzi Sim (Outcomes Consulting Ltd). Specific post dates
// and URLs are intentionally left for the trusted-voices ingestion routine to
// capture (Phase 4) rather than guessed here. Her commercial toolkits are
// inspiration only and are not reproduced.

const LINZI: SourceAttribution = {
  author: "Linzi Sim (Managing Director, Outcomes Consulting Ltd)",
  platform: "LinkedIn",
  note: "Paraphrased in Cara's own words from publicly-observed practice content. Specific post dates/URLs to be captured by the trusted-voices ingestion routine. Commercial toolkits (Excellence Sets, Compliance bundle, e-learning) treated as inspiration only; not reproduced.",
};

const SEEDED = "2026-11-09";

export const PRACTICE_PATTERNS_ALL: PracticePattern[] = [
  {
    id: "pp_regulation_anchored_decision",
    name: "Regulation-anchored practice",
    summary:
      "Tie every significant decision to the specific duty it engages, so the reason for the decision is inspectable. Urgency does not remove the duty: an emergency referral still needs a safe, recorded decision.",
    domains: ["reg-14", "reg-44", "reg-45", "safeguarding", "connected-system"],
    claim_basis: "good_practice",
    regulation_refs: ["reg-14", "reg-44", "reg-45"],
    quality_standard_refs: [],
    key_questions: [
      "Which specific duty does this decision engage?",
      "If this referral is an emergency, what made the decision safe anyway?",
    ],
    evidence_indicators: [
      "The record names the regulation/standard the decision rests on",
      "A safe-decision rationale is present even for urgent/emergency cases",
    ],
    failure_modes: [
      "Urgency used to justify skipping the safe-decision record",
      "Decisions recorded with no link to the duty they engage",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "high",
    retrieved_at: SEEDED,
    status: "approved",
  },
  {
    id: "pp_evidence_to_evaluation",
    name: "Evidence to evaluation",
    summary:
      "Evidence shows what happened; evaluation explains the difference it made. Reviews (e.g. Reg 45) should explain impact on the child, not list activity.",
    domains: ["reg-45", "evidence-vs-evaluation", "recording-quality"],
    claim_basis: "good_practice",
    regulation_refs: ["reg-45"],
    quality_standard_refs: [],
    key_questions: [
      "Does this explain the difference it made, or only what was done?",
      "What changed for the child as a result?",
    ],
    evidence_indicators: [
      "Statements of impact/outcome, not just activity",
      "The child's experience and what changed are named",
    ],
    failure_modes: [
      "Activity lists ('meeting held', 'review completed') with no impact",
      "Reassurance language ('settled', 'no concerns') without evidence",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "high",
    retrieved_at: SEEDED,
    status: "approved",
  },
  {
    id: "pp_pulse_file_audit",
    name: "Pulse-check file audit",
    summary:
      "Sample a few files (e.g. three: referrals, starters, concerns), test a fixed list of criteria, rate RAG. Missing evidence defaults to amber/red, and any single red overrides the total. Look at declined referrals, not only accepted ones.",
    domains: ["safeguarding", "safer-recruitment", "admissions", "recording-quality"],
    claim_basis: "good_practice",
    regulation_refs: [],
    quality_standard_refs: [],
    key_questions: [
      "Did we sample declined referrals, not just accepted ones?",
      "Where evidence is missing, did we rate it amber/red rather than pass it?",
    ],
    evidence_indicators: [
      "A fixed criteria list applied to a named sample",
      "Any-red-overrides-total rule applied; declined referrals included",
    ],
    failure_modes: [
      "Averaging RAG so a red is washed out by greens",
      "Auditing only accepted referrals; missing evidence scored as a pass",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "high",
    retrieved_at: SEEDED,
    status: "approved",
  },
  {
    id: "pp_rm_ri_briefing",
    name: "RM-to-RI one-page briefing",
    summary:
      "A monthly registered-manager-to-responsible-individual briefing in four blocks: the home this month; risks needing challenge; decisions and resources needed (options, cost, consequence of delay); and the RI's response and follow-up. It records disagreement and escalation explicitly.",
    domains: ["rm-ri-oversight"],
    claim_basis: "good_practice",
    regulation_refs: ["reg-45"],
    quality_standard_refs: [],
    key_questions: [
      "Could you show what was decided last month and what happened next?",
      "Where RM and RI disagreed, is that recorded with the escalation taken?",
    ],
    evidence_indicators: [
      "Four blocks present, including a captured RI response + follow-up",
      "Disagreement and escalation recorded, not smoothed over",
    ],
    failure_modes: [
      "One-directional RM→RI reporting with no RI response captured",
      "Decisions listed with no follow-up evidence of what happened",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "high",
    retrieved_at: SEEDED,
    status: "approved",
  },
  {
    id: "pp_controlled_document_anatomy",
    name: "Controlled-document anatomy",
    summary:
      "A usable toolkit/policy has a clear pathway, practical tools, one worked example and adaptable templates — plus document control: a named owner, an adoption date and a next-review date, so it stays current and defensible.",
    domains: ["document-control", "l-and-d", "recording-quality"],
    claim_basis: "good_practice",
    regulation_refs: [],
    quality_standard_refs: [],
    key_questions: [
      "Does this document name an owner, an adoption date and a next-review date?",
      "Is there a worked example and an adaptable template?",
    ],
    evidence_indicators: [
      "Owner + adoption date + next-review date present",
      "Clear pathway, worked example, reusable templates",
    ],
    failure_modes: [
      "Undated/unowned documents that drift out of date",
      "Abstract guidance with no worked example to follow",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "medium",
    retrieved_at: SEEDED,
    status: "approved",
  },
  {
    id: "pp_placement_stability_from_admission",
    name: "Placement stability from admission",
    summary:
      "Stability is built at the point of admission: assess the individual, test compatibility with the children already living in the home, and confirm the staffing, skills, environment and external support exist from day one. Conditional offers specify what must be completed before arrival and who verifies it. No blanket exclusions by diagnosis or history.",
    domains: ["admissions", "matching", "placement-stability"],
    claim_basis: "good_practice",
    regulation_refs: ["reg-14"],
    quality_standard_refs: [],
    key_questions: [
      "Do staffing, skills, environment and support exist from admission?",
      "Does any conditional offer say what is completed before arrival and who verifies it?",
      "Is any exclusion individual and reasoned, not a blanket rule by diagnosis/history?",
    ],
    evidence_indicators: [
      "Compatibility with the existing group assessed and recorded",
      "Conditions named with a verifier; individualised decisions",
    ],
    failure_modes: [
      "Blanket exclusions by label rather than individual assessment",
      "Admissions with no check that the home can actually hold the child",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "high",
    retrieved_at: SEEDED,
    status: "approved",
  },
  {
    id: "pp_learning_changes_practice",
    name: "Learning that changes practice",
    summary:
      "Training is defensible when it is chosen for a reason and shows up in practice: a training needs analysis maps priorities to roles, learning pairs with a competency check, a learning journal and reflection (which can feed Level 3/5 diploma evidence), and scenarios are opened from the child's point of view.",
    domains: ["l-and-d", "reflective-practice"],
    claim_basis: "good_practice",
    regulation_refs: [],
    quality_standard_refs: [],
    key_questions: [
      "What is the defensible reason we chose this training?",
      "How would we see this learning in practice, from the child's point of view?",
    ],
    evidence_indicators: [
      "A TNA linking priorities to roles to a plan",
      "Competency check + reflection tied to each learning item",
    ],
    failure_modes: [
      "Training logged as attendance with no change in practice",
      "Scenarios framed only from the staff viewpoint, never the child's",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "medium",
    retrieved_at: SEEDED,
    status: "approved",
  },
  {
    id: "pp_beyond_documentation_human_layer",
    name: "Beyond documentation: the human layer",
    summary:
      "There is a difference between protecting someone from harm and protecting them from life. Documentation can show a good service without showing a good life. Ask what would endure for this child beyond paid support.",
    domains: ["human-outcomes"],
    claim_basis: "practitioner_view",
    regulation_refs: [],
    quality_standard_refs: [],
    key_questions: [
      "If our service disappeared tomorrow, what would remain in this person's life?",
      "Are we protecting this child from harm — or also from life?",
    ],
    evidence_indicators: [
      "Belonging, relationships and life beyond services are named and nurtured",
      "Plans reach past compliance into an ordinary good life",
    ],
    failure_modes: [
      "A compliant file that evidences a good service but not a good life",
      "Risk-aversion that removes ordinary experiences",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "medium",
    retrieved_at: SEEDED,
    status: "approved",
  },
  {
    id: "pp_connected_system",
    name: "Connected-system reasoning",
    summary:
      "The functions of a home are connected: a staffing gap affects quality, a compliance issue affects finances, a recruitment decision affects safeguarding. Reason across domains (HR, operations, finance, L&D, quality/compliance, clinical, recruitment, education) rather than in silos.",
    domains: ["connected-system", "rm-ri-oversight"],
    claim_basis: "practitioner_view",
    regulation_refs: [],
    quality_standard_refs: [],
    key_questions: [
      "How does this decision ripple across the home's other functions?",
      "Which other domain carries the consequence of this gap?",
    ],
    evidence_indicators: [
      "Cross-domain consequences named when a decision is made",
      "Risks traced from their source function to the one that bears them",
    ],
    failure_modes: [
      "Decisions taken in a single silo with unseen knock-on effects",
      "A compliance/finance/recruitment issue read as unrelated to safeguarding",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "medium",
    retrieved_at: SEEDED,
    status: "approved",
  },
  {
    id: "pp_output_shape",
    name: "Reusable output shape",
    summary:
      "A clear practice message has a reusable shape: a hook line, a short principle, three to eight concrete points, and one reflective question to the reader. Useful for Cara's own outputs and for shareable summaries.",
    domains: ["l-and-d"],
    claim_basis: "good_practice",
    regulation_refs: [],
    quality_standard_refs: [],
    key_questions: [
      "Is there one clear principle and a single reflective question to close?",
      "Are the points concrete rather than abstract?",
    ],
    evidence_indicators: [
      "Hook → principle → 3-8 concrete points → one reflective question",
      "Concrete, practitioner-usable phrasing",
    ],
    failure_modes: [
      "A wall of abstract text with no single takeaway",
      "No reflective question, so nothing prompts the reader to act",
    ],
    source: LINZI,
    provenance: "derived_external",
    confidence: "low",
    retrieved_at: SEEDED,
    status: "approved",
  },
];

/** Approved patterns only — what engines and surfaces should reason with. */
export const PRACTICE_PATTERNS: PracticePattern[] = PRACTICE_PATTERNS_ALL.filter(
  (p) => p.status === "approved",
);

// ── Pure retrieval helpers ────────────────────────────────────────────────────

export function getPatternsByDomain(domain: PatternDomain): PracticePattern[] {
  return PRACTICE_PATTERNS.filter((p) => p.domains.includes(domain));
}

export function getPatternsByRegulation(regRef: string): PracticePattern[] {
  const needle = regRef.toLowerCase();
  return PRACTICE_PATTERNS.filter((p) =>
    p.regulation_refs.some((r) => r.toLowerCase() === needle),
  );
}

export function getPatternsByClaimBasis(basis: ClaimBasis): PracticePattern[] {
  return PRACTICE_PATTERNS.filter((p) => p.claim_basis === basis);
}

export function getPatternById(id: string): PracticePattern | undefined {
  return PRACTICE_PATTERNS_ALL.find((p) => p.id === id);
}
