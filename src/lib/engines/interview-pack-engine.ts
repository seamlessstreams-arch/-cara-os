// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTERVIEW PACK ENGINE (pure / deterministic)
//
// Assembles a structured, values-aligned interview pack for a children's-home
// role — values, safeguarding, trauma-informed practice, PACE/co-regulation,
// scenario and (for senior roles) leadership questions, each with scoring
// guidance and red-flag prompts. Optionally enriched with the home's Employer
// Values Profile and a candidate's match-derived probes (from Slice 1).
//
// SUPPORT, not a decision: the pack structures a fair, consistent interview. The
// panel scores and decides using safer-recruitment practice and professional
// judgement. Scoring categories mirror the existing CandidateInterview/
// InterviewScore model so a completed pack maps straight onto the recruitment
// record.
// ══════════════════════════════════════════════════════════════════════════════

import type { EmployerValuesProfile } from "@/lib/engines/values-match-engine";

export const INTERVIEW_DISCLAIMER =
  "These prompts support a structured, fair interview. They do not replace safer-recruitment practice or panel judgement — score and decide as a panel, using your professional judgement.";

export interface InterviewQuestion {
  q: string;
  guidance: string;          // what a strong answer looks like
  red_flags: string[];       // concerns to listen for
}
export interface InterviewSection {
  key: string;
  title: string;
  questions: InterviewQuestion[];
}
export interface InterviewPack {
  role: string;
  role_label: string;
  intro: string;
  values_prompts: string[];      // derived from the home's Employer Values Profile
  candidate_prompts: string[];   // candidate-specific probes (from the values match)
  sections: InterviewSection[];
  scoring_categories: { key: string; label: string }[];
  scoring_guidance: string;
  panel_decision_options: { key: string; label: string }[];
  disclaimer: string;
}

export const INTERVIEW_ROLES: { key: string; label: string; senior: boolean }[] = [
  { key: "residential_care_worker", label: "Residential Childcare Worker", senior: false },
  { key: "team_leader", label: "Senior / Team Leader", senior: true },
  { key: "deputy_manager", label: "Deputy Manager", senior: true },
  { key: "registered_manager", label: "Registered Manager", senior: true },
];

// scoring categories mirror InterviewScore on the recruitment record
const SCORING_CATEGORIES = [
  { key: "values_behaviours", label: "Values & behaviours" },
  { key: "safeguarding_awareness", label: "Safeguarding awareness" },
  { key: "relevant_experience", label: "Relevant experience" },
  { key: "communication", label: "Communication" },
  { key: "motivation", label: "Motivation" },
  { key: "resilience", label: "Resilience" },
  { key: "teamwork", label: "Teamwork" },
];

const PANEL_DECISIONS = [
  { key: "strongly_recommend", label: "Strongly recommend" },
  { key: "recommend", label: "Recommend" },
  { key: "borderline", label: "Borderline — explore further" },
  { key: "do_not_recommend", label: "Do not recommend" },
];

// ── question bank (common sections) ───────────────────────────────────────────
const VALUES: InterviewSection = {
  key: "values", title: "Values & motivation",
  questions: [
    { q: "Why do you want to work with children and young people in a residential setting — and why now?", guidance: "A child-centred motivation grounded in wanting to make a difference; realistic about the challenges; not money- or convenience-led.", red_flags: ["Wanting to 'fix' or 'save' children", "Only motivated by hours/pay/location", "Unrealistic or rescuer mindset"] },
    { q: "Tell us about a time your values were tested at work. What did you do?", guidance: "Holds boundaries with warmth; acts with integrity; reflects on the decision.", red_flags: ["No example", "Compromised on safeguarding or honesty", "Blames others, no reflection"] },
    { q: "What does a good day in this home look like to you?", guidance: "Describes warm, ordinary, relationship-based moments — not just 'no incidents'.", red_flags: ["Defines success only as control/compliance", "No mention of the children's experience"] },
  ],
};
const SAFEGUARDING: InterviewSection = {
  key: "safeguarding", title: "Safeguarding",
  questions: [
    { q: "A young person tells you something that worries you about their safety. Walk us through exactly what you'd do.", guidance: "Listens without leading, reassures appropriately, doesn't promise confidentiality, records accurately in the child's words, escalates to the DSL without delay.", red_flags: ["Promises to keep it secret", "Delays or 'handles it themselves'", "Vague on recording or escalation"] },
    { q: "What would you do if you had a concern about a colleague's conduct towards a child?", guidance: "Knows whistleblowing/LADO routes; would report despite discomfort; child's safety over loyalty.", red_flags: ["Would stay quiet or 'not get involved'", "Unaware of escalation routes"] },
    { q: "What does safeguarding mean to you beyond the policies?", guidance: "Sees safeguarding as everyday relational vigilance and culture, not just procedure.", red_flags: ["Purely procedural", "Sees it as someone else's job"] },
  ],
};
const TRAUMA: InterviewSection = {
  key: "trauma_informed", title: "Trauma-informed practice",
  questions: [
    { q: "A child is shouting and refusing to follow any request. What's going on for them, and how do you respond?", guidance: "Reads behaviour as communication; stays regulated; prioritises safety and connection over compliance; curious about the unmet need.", red_flags: ["Takes it personally", "Reaches for sanctions/control first", "Labels the child as 'manipulative' or 'naughty'"] },
    { q: "How do you keep yourself regulated when a child is dysregulated?", guidance: "Self-awareness, grounding strategies, uses the team, debriefs.", red_flags: ["No self-regulation strategy", "Escalates with the child"] },
  ],
};
const PACE: InterviewSection = {
  key: "pace", title: "PACE & co-regulation",
  questions: [
    { q: "Tell us about a relationship with a child or young person you found hard to build. What helped?", guidance: "Patience, attunement, consistency, small moments; didn't give up; let the child set the pace.", red_flags: ["Gave up", "Expected instant trust", "Made it about being liked"] },
    { q: "Give an example of using playfulness, acceptance, curiosity or empathy to help a young person feel safe.", guidance: "A concrete, warm example showing genuine PACE in practice.", red_flags: ["No concrete example", "Misunderstands acceptance as 'anything goes'"] },
  ],
};
const SCENARIO: InterviewSection = {
  key: "scenario", title: "Scenario",
  questions: [
    { q: "It's the end of a long shift, two young people are in conflict, one is threatening to leave, and the phone is ringing. What do you do?", guidance: "Prioritises safety, stays calm, delegates/uses the team, keeps relationships central, records afterwards.", red_flags: ["Freezes or panics", "Abandons one situation for another", "No use of team/escalation"] },
    { q: "A young person returns from being missing. What matters most in the first hour?", guidance: "Warm, non-punitive welcome back; safety and health check; return interview later; curiosity not interrogation.", red_flags: ["Punitive/cold response", "Interrogates immediately", "Misses welfare check"] },
  ],
};
const LEADERSHIP: InterviewSection = {
  key: "leadership", title: "Leadership & management",
  questions: [
    { q: "How do you keep a staff team regulated, motivated and safe — especially after a difficult incident?", guidance: "Models regulation, prioritises debrief and reflective supervision, spots burnout early, leads by example.", red_flags: ["Top-down only", "Ignores staff wellbeing", "No debrief culture"] },
    { q: "How would you evidence the quality of care and practice in this home to an inspector?", guidance: "Uses real records, child voice, outcomes and reflective practice — not just compliance paperwork.", red_flags: ["Only talks paperwork", "Can't connect evidence to children's experience"] },
    { q: "Tell us about a time you had to address a practice or conduct concern in your team.", guidance: "Acts promptly and fairly, supports improvement, follows process, keeps children safe throughout.", red_flags: ["Avoids difficult conversations", "Unfair or purely punitive", "Lets concerns drift"] },
  ],
};

export function buildInterviewPack(opts: {
  role: string;
  employer?: EmployerValuesProfile | null;
  candidatePrompts?: string[];
}): InterviewPack {
  const roleDef = INTERVIEW_ROLES.find((r) => r.key === opts.role) ?? INTERVIEW_ROLES[0];

  const sections: InterviewSection[] = [VALUES, SAFEGUARDING, TRAUMA, PACE, SCENARIO];
  if (roleDef.senior) sections.push(LEADERSHIP);

  const values_prompts: string[] = [];
  if (opts.employer) {
    for (const v of (opts.employer.core_values || []).slice(0, 3)) {
      values_prompts.push(`Ask for a concrete, recent example of "${v}" in their day-to-day practice.`);
    }
    for (const nn of (opts.employer.non_negotiables || []).slice(0, 3)) {
      values_prompts.push(`Explore how they would uphold a non-negotiable: "${nn}".`);
    }
  }

  return {
    role: roleDef.key,
    role_label: roleDef.label,
    intro: `Structured interview pack for the ${roleDef.label} role${opts.employer ? ` at ${opts.employer.home_name}` : ""}. Use the same core questions with every candidate for fairness, score each area together as a panel, and record your rationale.`,
    values_prompts,
    candidate_prompts: dedupe(opts.candidatePrompts || []),
    sections,
    scoring_categories: SCORING_CATEGORIES,
    scoring_guidance: "Score each area 1–5: 1 = significant concern, 3 = meets the bar, 5 = strong evidence. A low safeguarding score should weigh heavily regardless of the total. Agree scores as a panel and note the evidence behind them.",
    panel_decision_options: PANEL_DECISIONS,
    disclaimer: INTERVIEW_DISCLAIMER,
  };
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((x) => { const k = x.trim(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
}
