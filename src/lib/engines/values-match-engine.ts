// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VALUES-BASED MATCHING ENGINE (pure / deterministic / explainable)
//
// Compares a candidate against the home's Employer Values Profile and produces a
// transparent, dimension-by-dimension match with strengths, concerns, interview
// prompts and suggested support — to SUPPORT human recruitment judgement.
//
// HARD RULE: this is a decision-SUPPORT tool, never a hiring decision. The
// MATCH_DISCLAIMER must be shown wherever a match is presented. Scoring is
// deterministic and explainable (every dimension carries a note) — no black box,
// no LLM required.
//
// "Care quality starts with workforce quality."
// ══════════════════════════════════════════════════════════════════════════════

export const MATCH_DISCLAIMER =
  "This is a support tool only. Final recruitment decisions must be made by the organisation using safer recruitment practice, professional judgement and human decision-making.";

export interface EmployerValuesProfile {
  id: string;
  home_id: string;
  organisation_name: string;
  home_name: string;
  core_values: string[];                 // value tags, e.g. ["child-centred","warmth","resilience"]
  care_approach: string;
  leadership_style: string;
  therapeutic_model: string;
  pace_commitment: string;               // PACE = Playfulness, Acceptance, Curiosity, Empathy
  trauma_informed_expectations: string;
  safeguarding_culture: string;
  expected_behaviours: string[];
  non_negotiables: string[];
  what_makes_us_different: string;
  relational_practice_priority: "high" | "medium" | "low";
  updated_at: string;
  updated_by?: string | null;
}

export interface CandidateValuesProfile {
  id: string;
  candidate_id: string;
  candidate_name?: string | null;
  values: string[];                      // candidate's stated values (tags)
  what_matters_in_employer: string;
  childrens_home_experience_years: number;
  preferred_role: string;                // e.g. "residential_care_worker", "team_leader"
  availability: string;                  // e.g. "Full-time, flexible"
  qualifications: string[];              // e.g. ["Level 3 Residential Childcare"]
  confidence_areas: string[];
  development_areas: string[];
  safeguarding_mindset: string;          // free-text / scenario answer
  relational_indicators: string[];       // e.g. ["PACE","co-regulation","attunement"]
  scenario_answers?: { prompt: string; answer: string }[];
  updated_at: string;
}

export interface MatchDimension {
  key: string;
  label: string;
  score: number;        // 0..1
  weight: number;       // 0..1 (weights sum to 1)
  note: string;         // explainable rationale
}

export type MatchBand = "strong" | "promising" | "explore" | "limited";

export interface ValuesMatchResult {
  candidate_id: string;
  candidate_name: string;
  preferred_role: string;
  match_percent: number;        // 0..100
  band: MatchBand;
  dimensions: MatchDimension[];
  shared_values: string[];
  strengths: string[];
  concerns: string[];
  interview_prompts: string[];
  suggested_support: string[];
  areas_to_explore: string[];
  disclaimer: string;
}

// ── helpers (pure) ──────────────────────────────────────────────────────────────
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
function overlap(a: string[], b: string[]): string[] {
  const setB = new Set((b || []).map(norm));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of a || []) {
    const n = norm(raw);
    if (setB.has(n) && !seen.has(n)) { seen.add(n); out.push(raw.trim()); }
  }
  return out;
}
function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }

const RELATIONAL_VOCAB = [
  "pace", "co-regulation", "coregulation", "attunement", "attachment", "empathy",
  "curiosity", "playfulness", "acceptance", "reflective", "trauma-informed",
  "trauma informed", "relational", "nurture", "unconditional positive regard",
];
const SAFEGUARDING_VOCAB = [
  "safeguard", "child protection", "report", "escalate", "disclosure", "protect",
  "welfare", "concern", "designated", "policy", "whistleblow", "record",
];

// role → expected children's-home experience (years) for a "full" experience score
const ROLE_EXPECTED_YEARS: Record<string, number> = {
  residential_care_worker: 1,
  bank_staff: 1,
  team_leader: 3,
  deputy_manager: 4,
  registered_manager: 5,
};

function countVocabHits(text: string, vocab: string[]): number {
  const t = norm(text || "");
  let hits = 0;
  for (const w of vocab) if (t.includes(w)) hits++;
  return hits;
}

export function bandFor(pct: number): MatchBand {
  if (pct >= 80) return "strong";
  if (pct >= 65) return "promising";
  if (pct >= 50) return "explore";
  return "limited";
}

export function computeValuesMatch(employer: EmployerValuesProfile, candidate: CandidateValuesProfile): ValuesMatchResult {
  const shared_values = overlap(candidate.values, employer.core_values);

  // 1. Values alignment
  const valuesDenom = Math.max(1, Math.min((employer.core_values || []).length, 6));
  const valuesScore = clamp01(shared_values.length / valuesDenom);

  // 2. Relational / therapeutic practice
  const candRelational = [
    ...(candidate.relational_indicators || []),
    candidate.safeguarding_mindset || "",
    ...(candidate.scenario_answers || []).map((s) => s.answer),
  ].join(" ");
  const relationalHits = countVocabHits(candRelational, RELATIONAL_VOCAB);
  let relationalScore = clamp01(relationalHits / 3);
  // employer priority nudges how decisive this dimension is
  const relWeight = employer.relational_practice_priority === "high" ? 0.24
    : employer.relational_practice_priority === "low" ? 0.12 : 0.18;

  // 3. Experience
  const expected = ROLE_EXPECTED_YEARS[norm(candidate.preferred_role).replace(/ /g, "_")] ?? 2;
  const experienceScore = clamp01((candidate.childrens_home_experience_years || 0) / expected);

  // 4. Qualifications (Level 3+ is the residential childcare baseline)
  const qualText = (candidate.qualifications || []).join(" ").toLowerCase();
  const hasLevel3Plus = /level\s*(3|4|5)/.test(qualText) || /diploma|degree/.test(qualText);
  const qualScore = (candidate.qualifications || []).length === 0 ? 0.3 : hasLevel3Plus ? 1 : 0.6;

  // 5. Role fit (is a preferred role stated and recognised)
  const roleScore = candidate.preferred_role ? (ROLE_EXPECTED_YEARS[norm(candidate.preferred_role).replace(/ /g, "_")] ? 1 : 0.7) : 0.5;

  // 6. Availability
  const avail = norm(candidate.availability || "");
  const availScore = !avail ? 0.5 : /full|flexible|any/.test(avail) ? 1 : 0.75;

  // 7. Safeguarding mindset (SUPPORT indicator, not a decision)
  const sgHits = countVocabHits(candidate.safeguarding_mindset, SAFEGUARDING_VOCAB);
  const safeguardingScore = clamp01(sgHits / 3);

  // weights (sum to 1; relational weight is variable, remainder rebalanced)
  const baseRel = 0.18;
  const dims: MatchDimension[] = [
    { key: "values", label: "Values alignment", score: valuesScore, weight: 0.30, note: shared_values.length ? `Shares ${shared_values.length} core value${shared_values.length === 1 ? "" : "s"}: ${shared_values.join(", ")}.` : "No stated values overlap with the home's core values — explore at interview." },
    { key: "relational", label: "Relational & therapeutic practice", score: relationalScore, weight: relWeight, note: relationalHits ? `References ${relationalHits} relational-practice cue${relationalHits === 1 ? "" : "s"} (e.g. PACE, co-regulation, attunement).` : "Little relational-practice language evident — probe with a scenario." },
    { key: "experience", label: "Children's-home experience", score: experienceScore, weight: 0.15, note: `${candidate.childrens_home_experience_years || 0} yr vs ~${expected} yr typical for ${humaniseRole(candidate.preferred_role)}.` },
    { key: "qualifications", label: "Qualifications", score: qualScore, weight: 0.10, note: (candidate.qualifications || []).length ? `${candidate.qualifications.join(", ")}.` : "No qualifications listed." },
    { key: "role", label: "Role fit", score: roleScore, weight: 0.05, note: candidate.preferred_role ? `Prefers ${humaniseRole(candidate.preferred_role)}.` : "No preferred role stated." },
    { key: "availability", label: "Availability", score: availScore, weight: 0.05, note: candidate.availability || "Not stated." },
    { key: "safeguarding", label: "Safeguarding mindset", score: safeguardingScore, weight: 0.15, note: sgHits ? "Answer reflects a safeguarding-oriented mindset — verify with safer-recruitment questions." : "Safeguarding language thin — explore thoroughly with safer-recruitment questions." },
  ];
  // rebalance so weights total 1 (relWeight varies around baseRel)
  const rawTotal = dims.reduce((s, d) => s + d.weight, 0);
  const scale = 1 / rawTotal;
  for (const d of dims) d.weight = d.weight * scale;

  const match_percent = Math.round(dims.reduce((s, d) => s + d.score * d.weight, 0) * 100);
  const band = bandFor(match_percent);

  // strengths / concerns
  const strengths: string[] = [];
  const concerns: string[] = [];
  for (const d of dims) {
    if (d.score >= 0.8) strengths.push(`${d.label}: ${d.note}`);
    else if (d.score < 0.5) concerns.push(`${d.label}: ${d.note}`);
  }
  for (const c of candidate.confidence_areas || []) strengths.push(`Self-identified strength: ${c}.`);

  // interview prompts (from concerns + always-on values/relational probes)
  const interview_prompts: string[] = [];
  if (employer.core_values?.length) interview_prompts.push(`Ask for a real example showing "${employer.core_values[0]}" in their practice with a child.`);
  interview_prompts.push("Describe a time you co-regulated with a dysregulated young person — what did you do, and why?");
  for (const d of dims) {
    if (d.score < 0.5) {
      if (d.key === "safeguarding") interview_prompts.push("Walk me through exactly what you'd do if a child made a disclosure to you on shift.");
      else if (d.key === "relational") interview_prompts.push("Tell me about a relationship with a child you found hard to build — what helped?");
      else if (d.key === "experience") interview_prompts.push("What from your background transfers into residential childcare, given your experience to date?");
      else if (d.key === "values") interview_prompts.push("What matters most to you in how a children's home is run, and why?");
    }
  }
  for (const nn of employer.non_negotiables || []) interview_prompts.push(`Explore alignment with a non-negotiable: "${nn}".`);

  // suggested support if appointed
  const suggested_support: string[] = [];
  for (const dev of candidate.development_areas || []) suggested_support.push(`Plan early development in: ${dev}.`);
  if (experienceScore < 0.6) suggested_support.push("Pair with an experienced co-worker for the first weeks; structured shadow shifts.");
  if (relationalScore < 0.6) suggested_support.push("Prioritise trauma-informed / PACE training and reflective supervision early.");
  if (qualScore < 0.6) suggested_support.push("Agree a route to (or top-up of) the Level 3 Diploma in Residential Childcare.");
  if (suggested_support.length === 0) suggested_support.push("Standard induction and probation supervision; build on identified strengths.");

  // areas to explore
  const areas_to_explore: string[] = [];
  if (valuesScore < 0.6) areas_to_explore.push("How their personal values map to the home's core values.");
  if (safeguardingScore < 0.6) areas_to_explore.push("Depth of safeguarding understanding (verify thoroughly under safer recruitment).");
  if (experienceScore < 0.6) areas_to_explore.push("Transferable experience and resilience for the role.");
  if (candidate.development_areas?.length) areas_to_explore.push(`Self-identified development areas: ${candidate.development_areas.join(", ")}.`);
  if (areas_to_explore.length === 0) areas_to_explore.push("Confirm strengths in practice with scenario questions; standard safer-recruitment exploration.");

  return {
    candidate_id: candidate.candidate_id,
    candidate_name: candidate.candidate_name || candidate.candidate_id,
    preferred_role: candidate.preferred_role,
    match_percent,
    band,
    dimensions: dims,
    shared_values,
    strengths,
    concerns,
    interview_prompts: dedupe(interview_prompts),
    suggested_support: dedupe(suggested_support),
    areas_to_explore: dedupe(areas_to_explore),
    disclaimer: MATCH_DISCLAIMER,
  };
}

export function computeAllMatches(employer: EmployerValuesProfile, candidates: CandidateValuesProfile[]): ValuesMatchResult[] {
  return candidates
    .map((c) => computeValuesMatch(employer, c))
    .sort((a, b) => b.match_percent - a.match_percent || a.candidate_name.localeCompare(b.candidate_name));
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((x) => { const k = x.trim(); if (seen.has(k)) return false; seen.add(k); return true; });
}

function humaniseRole(role: string): string {
  if (!role) return "the role";
  return role.replace(/_/g, " ");
}
