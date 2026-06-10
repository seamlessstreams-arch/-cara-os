// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — AI MANAGER ASSISTANT ENGINE (pure / deterministic)
//
// Workforce slice 6 (spec §13): drafting tools for managers — job adverts (from
// the vacancy + the Employer Values Profile), candidate-strengths summaries
// (from the values match) and action plans. Every tool produces a DETERMINISTIC
// scaffold assembled only from recorded data (genuinely useful with no AI key);
// the route may add an optional ARIA polish on top. Drafts only — the manager
// accepts, edits or rejects, and every generation is audit-logged.
//
// "AI suggestions require professional judgement and manager approval."
// ══════════════════════════════════════════════════════════════════════════════

import type { EmployerValuesProfile, ValuesMatchResult } from "@/lib/engines/values-match-engine";

export const ASSISTANT_DISCLAIMER =
  "AI suggestions require professional judgement and manager approval. Everything here is a draft for you to accept, edit or reject — nothing is published or sent automatically.";

export interface VacancyLite {
  id: string;
  title: string;
  employment_type?: string | null;
  contract_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  hours?: number | null;
  shift_pattern?: string | null;
  safeguarding_statement?: string | null;
}

const money = (n: number) => `£${n.toLocaleString("en-GB")}`;

// ── 1. Job advert (vacancy + values profile → structured draft) ────────────────
export function buildJobAdvertScaffold(vacancy: VacancyLite, employer: EmployerValuesProfile | null): string {
  const lines: string[] = [];
  const homeName = employer?.home_name || "our children's home";

  lines.push(`${vacancy.title} — ${homeName}`);
  const terms: string[] = [];
  if (vacancy.employment_type) terms.push(vacancy.employment_type.replace(/_/g, " "));
  if (vacancy.contract_type) terms.push(vacancy.contract_type.replace(/_/g, " "));
  if (vacancy.hours) terms.push(`${vacancy.hours} hours/week`);
  if (vacancy.salary_min && vacancy.salary_max) terms.push(`${money(vacancy.salary_min)}–${money(vacancy.salary_max)}`);
  if (terms.length) lines.push(terms.join(" · "));
  lines.push("");

  lines.push("About us");
  if (employer?.what_makes_us_different) lines.push(employer.what_makes_us_different);
  if (employer?.care_approach) lines.push(employer.care_approach);
  if (employer?.therapeutic_model) lines.push(`Our practice: ${employer.therapeutic_model}`);
  if (!employer) lines.push("[Add a short paragraph about your home — what makes it different, and how you care.]");
  lines.push("");

  if (employer?.core_values?.length) {
    lines.push("Our values");
    lines.push(employer.core_values.join(" · "));
    lines.push("");
  }

  lines.push("The role");
  lines.push(`You will help children feel safe, build trusting relationships and experience everyday childhood — supported by reflective supervision, training and a team that looks after its people.`);
  if (vacancy.shift_pattern) lines.push(`Shift pattern: ${vacancy.shift_pattern}`);
  lines.push("");

  lines.push("Who we're looking for");
  if (employer?.expected_behaviours?.length) {
    for (const b of employer.expected_behaviours) lines.push(`• ${b}`);
  } else {
    lines.push("• Warmth, reliability and emotional resilience");
    lines.push("• Curiosity about what behaviour communicates");
  }
  if (employer?.pace_commitment) lines.push(`• Commitment to PACE: ${employer.pace_commitment}`);
  lines.push("");

  lines.push("Safer recruitment");
  lines.push(vacancy.safeguarding_statement || "This post is subject to an enhanced DBS check, barred list check and satisfactory references. We follow safer recruitment practice throughout.");
  if (employer?.safeguarding_culture) lines.push(`Our safeguarding culture: ${employer.safeguarding_culture}`);
  lines.push("");
  lines.push("How to apply");
  lines.push("[Add your application route and closing date.] We welcome informal visits and conversations before you apply.");

  return lines.join("\n");
}

export const ADVERT_AI_SYSTEM_PROMPT =
  "You are ARIA, helping a children's-home manager polish a job advert. Improve warmth, flow and clarity of the draft provided WITHOUT inventing any facts — keep every concrete detail (salary, hours, shift pattern, safeguarding statement, values) exactly as given, keep the safer-recruitment section verbatim, keep all [bracketed placeholders] for the manager to complete, and keep it values-led and non-corporate. Return only the polished advert text.";

// ── 2. Candidate strengths summary (values match → draft narrative) ────────────
export function buildCandidateSummaryScaffold(match: ValuesMatchResult): string {
  const lines: string[] = [];
  lines.push(`Candidate summary (draft) — ${match.candidate_name}`);
  lines.push(`Values alignment: ${match.match_percent}% (${match.band}). ${match.shared_values.length ? `Shared values: ${match.shared_values.join(", ")}.` : "No stated values overlap — explore at interview."}`);
  lines.push("");
  if (match.strengths.length) {
    lines.push("Strengths");
    for (const s of match.strengths) lines.push(`• ${s}`);
    lines.push("");
  }
  if (match.concerns.length) {
    lines.push("Areas to explore");
    for (const c of match.concerns) lines.push(`• ${c}`);
    lines.push("");
  }
  if (match.suggested_support.length) {
    lines.push("Support if appointed");
    for (const s of match.suggested_support) lines.push(`• ${s}`);
    lines.push("");
  }
  lines.push(match.disclaimer);
  return lines.join("\n");
}

export const SUMMARY_AI_SYSTEM_PROMPT =
  "You are ARIA, helping a children's-home manager turn a structured candidate analysis into a short, balanced narrative summary (4–6 sentences) for the recruitment file. Use ONLY the facts provided — never invent experience or qualities, keep strengths and areas-to-explore balanced, make no hiring recommendation, and end by noting that the decision rests with the panel under safer recruitment practice. Return only the summary.";

// ── 3. Action plan (goal → structured draft) ───────────────────────────────────
export function buildActionPlanScaffold(goal: string, context?: string): string {
  const g = goal.trim();
  const lines: string[] = [];
  lines.push(`Action plan (draft): ${g}`);
  if (context?.trim()) lines.push(`Context: ${context.trim()}`);
  lines.push("");
  lines.push("Objective");
  lines.push(`${g} — define what "done" looks like and how you'll evidence it.`);
  lines.push("");
  lines.push("Actions");
  lines.push("1. [First concrete step] — owner: [name], by: [date]");
  lines.push("2. [Second step] — owner: [name], by: [date]");
  lines.push("3. [Communication/training step — who needs to know or learn what] — owner: [name], by: [date]");
  lines.push("");
  lines.push("Evidence & review");
  lines.push("• What will show this worked (records, feedback, audit)?");
  lines.push("• Review date: [date] — owner: [name]");
  lines.push("• Escalation if off-track: raise at team meeting / manager review.");
  return lines.join("\n");
}

export const PLAN_AI_SYSTEM_PROMPT =
  "You are ARIA, helping a children's-home manager draft an action plan. Expand the goal and context provided into 4–6 specific, realistic actions with suggested owners ([Registered Manager], [Deputy], [Key worker], [Whole team]) and relative timeframes (within 1 week / 1 month). Use ONLY the goal and context given — do not invent facts about the home. Include an evidence-and-review section. This is a draft the manager will edit. Return only the plan.";
