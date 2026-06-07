// ══════════════════════════════════════════════════════════════════════════════
// ARIA PRACTICE INTELLIGENCE — DRAFTING ENGINE
//
// ARIA DRAFTS stronger, child-centred records. Every draft type produces a
// STRUCTURED, EDITABLE scaffold deterministically (works with NO AI key). When an
// AI provider is configured, an enhanced narrative is layered on top via the
// existing generateText() abstraction — the scaffold is never lost.
//
// ARIA suggests; humans approve. Every draft carries a clear disclaimer.
// ══════════════════════════════════════════════════════════════════════════════

import { analyzePractice } from "./aria-practice-engine";
import type { AriaPracticeOutput, PracticeSourceType } from "./types";

export type AriaDraftType =
  | "professional_record"
  | "child_friendly_explanation"
  | "manager_threshold_summary"
  | "supervision_reflection"
  | "care_plan_impact_statement"
  | "protective_factor_rewrite"
  | "livers_analysis";

export interface AriaDraftInput {
  draftType: AriaDraftType;
  sourceType: PracticeSourceType;
  content: string;
  context?: Record<string, unknown>;
  childId?: string | null;
  staffId?: string | null;
  homeId?: string | null;
  today?: string;
}

export interface AriaDraftSection {
  heading: string;
  body: string;
}

export interface AriaDraftResult {
  draftType: AriaDraftType;
  title: string;
  /** Structured, editable scaffold — always present. */
  sections: AriaDraftSection[];
  /** Enhanced free-text draft from the AI provider when configured; else null. */
  aiNarrative: string | null;
  generatedBy: "deterministic" | "ai";
  disclaimer: string;
  analysisSummary: string;
  editable: true;
}

export const ARIA_DRAFT_DISCLAIMER =
  "ARIA suggested draft — requires human review and approval before it is committed. ARIA advises; the manager and author decide. The child's lived experience remains the measure of quality.";

const TITLES: Record<AriaDraftType, string> = {
  professional_record: "Professional record (child-centred)",
  child_friendly_explanation: "Child-friendly explanation",
  manager_threshold_summary: "Manager threshold consultation summary",
  supervision_reflection: "Reflective supervision draft",
  care_plan_impact_statement: "Care plan — impact statement",
  protective_factor_rewrite: "Protective factor — strengthened rewrite",
  livers_analysis: "L.I.V.E.R.S. analysis",
};

// ── Helpers that turn ARIA's analysis into scaffold content ────────────────────

function recommendationsBlock(a: AriaPracticeOutput): string {
  const recs = a.recommendations.map((r) => `• ${r.title} — ${r.detail} (${r.urgency})`);
  const actions = a.nextBestActions.map((x) => `• ${x}`);
  const lines = [...recs, ...actions];
  return lines.length ? lines.join("\n") : "<add specific, owned next steps>";
}

function flagsBlock(a: AriaPracticeOutput): string {
  if (a.flags.length === 0) return "No automated practice concerns detected. Record the risks, worries and the evidence behind them.";
  return a.flags.map((f) => `• [${f.severity}] ${f.title} — ${f.description}`).join("\n");
}

function questionsBlock(a: AriaPracticeOutput, domain: string): string {
  const qs = a.questions.filter((q) => q.domain === domain).map((q) => `• ${q.question}`);
  return qs.length ? qs.join("\n") : "";
}

// ── Per-type deterministic scaffolds ──────────────────────────────────────────

function professionalRecord(content: string, a: AriaPracticeOutput): AriaDraftSection[] {
  const protective =
    a.protectiveFactors.length > 0
      ? a.protectiveFactors.map((p) => `Claimed: ${p.factorDescription}. ${p.challenge}`).join("\n")
      : "<list any protective factors and test whether each is real: what it protects from, reliability under stress, strength for the current risk>";
  return [
    { heading: "Professional summary", body: "<a clear, factual summary of what happened and why it matters for the child>" },
    { heading: "Child's lived experience", body: "<what the child said, showed, feared, avoided or experienced — in their words and behaviour>" },
    { heading: "What has changed for the child", body: `<what is now different for the child — safer, calmer, more connected, more hopeful — and the evidence>\n${questionsBlock(a, "so_what")}` },
    { heading: "What remains missing or uncertain", body: "<what we still do not know, and what we will do to find out>" },
    { heading: "Protective factors — and whether they are real", body: protective },
    { heading: "Risks, worries and evidence", body: flagsBlock(a) },
    { heading: "So What analysis", body: questionsBlock(a, "so_what") || "So what has actually changed for the child as a result of this work?" },
    { heading: "Recommended next steps", body: recommendationsBlock(a) },
    { heading: "Manager review required", body: a.requiresManagerReview ? `YES — ${a.flags.filter((f) => f.requiresManagerReview).map((f) => f.title).join("; ")}` : "No — routine record; no escalation indicated by ARIA." },
  ];
}

function childFriendly(): AriaDraftSection[] {
  return [
    { heading: "What is happening", body: "<explain clearly and simply, written directly to the child, what is happening>" },
    { heading: "How this might feel", body: "<gently acknowledge how this might feel — it's okay to feel that way>" },
    { heading: "What is not your fault", body: "Some things that adults do are the adults' responsibility, not yours. <name what is not the child's fault>" },
    { heading: "Who can help", body: "<name the trusted adults and how to reach them, including an independent advocate>" },
    { heading: "What happens next", body: "<explain the next steps in simple, honest terms>" },
    { heading: "You matter", body: "You matter. Your voice matters, and the adults here want to understand you and keep you safe." },
  ];
}

function thresholdSummary(a: AriaPracticeOutput): AriaDraftSection[] {
  const t = a.threshold;
  return [
    { heading: "The concerns relate to", body: "<summarise the concern>" },
    { heading: "The child is currently experiencing", body: "<the child's lived experience>" },
    { heading: "Evidence supporting this includes", body: flagsBlock(a) },
    { heading: "Evidence that challenges or complicates this includes", body: "<counter-evidence and what is still unknown>" },
    { heading: "The trajectory appears", body: "<escalating / static / improving — with reasons>" },
    { heading: "Current intervention is / is not sufficient because", body: "<rationale>" },
    { heading: "The immediate risk if we do not escalate is", body: t?.emergencyActionRecommended ? "Immediate danger may be present — take protective action now, then consult." : "<state the risk>" },
    { heading: "The most proportionate next step is", body: t?.strategyDiscussionRecommended ? "Consider a strategy discussion and complete a threshold consultation." : "<state the next step>" },
    { heading: "Threshold judgement (manager decides — ARIA advises only)", body: "I believe the threshold for a strategy discussion is / is not met because: <manager judgement>" },
  ];
}

function supervisionReflection(a: AriaPracticeOutput): AriaDraftSection[] {
  return [
    { heading: "What has felt professionally difficult", body: "<name the professionally difficult parts>" },
    { heading: "What has felt emotionally heavy", body: "<name the emotional weight this work has carried>" },
    { heading: "What has stayed with you outside work", body: "<what has been hard to put down after shift>" },
    { heading: "Pressure to appear certain / confident / in control", body: "<where has there been pressure to seem more certain than you feel?>" },
    { heading: "What support is needed", body: questionsBlock(a, "reflective") || "<what support would help right now?>" },
    { heading: "How wellbeing may be affecting practice", body: a.flags.some((f) => f.flagType === "staff_wellbeing") ? "ARIA detected wellbeing signals. Interpret these supportively, never punitively." : "<reflect on how wellbeing may be affecting practice>" },
    { heading: "Development & support actions", body: recommendationsBlock(a) },
    { heading: "What will improve for children if this support works", body: "<what becomes better for the children if the worker is well-supported?>" },
  ];
}

function carePlanImpact(content: string, a: AriaPracticeOutput): AriaDraftSection[] {
  const gaps =
    a.developmentalGaps.length > 0
      ? a.developmentalGaps.map((g) => `• ${g.domain}: ${g.gapDescription} Impact: ${g.impactOnChild}`).join("\n")
      : "<identify the developmental gaps this plan must close>";
  return [
    { heading: "Current lived reality", body: "<what the child's daily life is actually like now>" },
    { heading: "Developmental gaps to close", body: gaps },
    { heading: "Planned actions & owners", body: recommendationsBlock(a) },
    { heading: "What will be different for the child", body: "<if this plan succeeds, what will be different in the child's lived experience?>" },
    { heading: "How we will know (evidence)", body: "<the evidence that will show the gap is closing — not just that activities happened>" },
  ];
}

function protectiveFactorRewrite(a: AriaPracticeOutput): AriaDraftSection[] {
  const factor = a.protectiveFactors[0]?.factorDescription ?? "<the proposed protective factor>";
  return [
    { heading: "Proposed protective factor", body: factor },
    { heading: "What it protects from", body: "<the specific harm it reduces>" },
    { heading: "Evidence it reduces harm", body: "<the evidence that it actually reduces harm in the child's life>" },
    { heading: "Reliability", body: "<is it reliable, or intermittent?>" },
    { heading: "Proximity", body: "<is it close enough to the child's lived experience?>" },
    { heading: "Strength", body: "<is it strong enough for the current level of risk?>" },
    { heading: "Durability", body: "<does it last over time and hold under stress without professional pressure?>" },
    { heading: "Relational quality", body: "<is there genuine relational warmth behind it?>" },
    { heading: "Limits / conditions", body: "<the conditions under which it holds — and where it does not>" },
    { heading: "What would happen if it were removed tomorrow", body: "<the impact on the child if it disappeared>" },
  ];
}

function liversAnalysis(a: AriaPracticeOutput): AriaDraftSection[] {
  return [
    { heading: "L — Lived experience", body: "<what is it like to be this child every single day?>" },
    { heading: "I — Immediate & cumulative risk", body: "<what harm is occurring now, and how is it building over time?>" },
    { heading: "V — Viability of change", body: "<is change possible within the child's timeframe?>" },
    { heading: "E — Environment & system forces", body: "<what forces are helping or sabotaging change?>" },
    { heading: "R — Relational & psychological drivers", body: "<what unmet need, trauma, attachment pattern or function may be sustaining the behaviour?>" },
    { heading: "S — Sustainability & independence of safety", body: "<can safety continue without professional pressure, monitoring or presence?>" },
    { heading: "Final formulation", body: "<explain the child's present, predict their future, and justify the intervention — analysis, not description>" },
    { heading: "Recommended intervention rationale", body: recommendationsBlock(a) },
  ];
}

function scaffoldFor(input: AriaDraftInput, a: AriaPracticeOutput): AriaDraftSection[] {
  switch (input.draftType) {
    case "professional_record": return professionalRecord(input.content, a);
    case "child_friendly_explanation": return childFriendly();
    case "manager_threshold_summary": return thresholdSummary(a);
    case "supervision_reflection": return supervisionReflection(a);
    case "care_plan_impact_statement": return carePlanImpact(input.content, a);
    case "protective_factor_rewrite": return protectiveFactorRewrite(a);
    case "livers_analysis": return liversAnalysis(a);
  }
}

/** Pure, deterministic scaffold — works with no AI key. */
export function buildDraftScaffold(input: AriaDraftInput): AriaDraftResult {
  const analysis = analyzePractice({
    text: input.content,
    sourceType: input.sourceType,
    assessmentType: input.draftType === "livers_analysis" ? "livers_analysis" : "general",
    childId: input.childId,
    staffId: input.staffId,
    homeId: input.homeId,
    today: input.today,
  });
  return {
    draftType: input.draftType,
    title: TITLES[input.draftType],
    sections: scaffoldFor(input, analysis),
    aiNarrative: null,
    generatedBy: "deterministic",
    disclaimer: ARIA_DRAFT_DISCLAIMER,
    analysisSummary: analysis.summary,
    editable: true,
  };
}

// ── System prompt for AI enhancement (encodes ARIA's language standard) ────────

const DRAFT_SYSTEM_PROMPT = [
  "You are ARIA, a child-centred practice-intelligence assistant for a children's home.",
  "Write in warm, professional, non-shaming language. Never blame the child for adult harm.",
  "Place responsibility for adult behaviour with adults, systems and context.",
  "Distinguish evidence from interpretation. Name what is unknown. Always ask what has changed for the child.",
  "Replace vague reassurance: 'engaged well' → 'engaged by doing X, and the impact for the child was Y'; 'settled' → 'appeared calmer because X, but Y remains unclear'; 'no concerns' → 'no new concerns observed during X; existing concerns remain Y'.",
  "You DRAFT and ADVISE; humans decide. Never make a final statutory safeguarding decision. Advise emergency action if immediate danger is described. Recommend manager review for safeguarding thresholds and LADO consideration where an adult's conduct toward a child may meet threshold.",
  "Return a clear, editable draft the author can refine. Keep it grounded in the supplied record; do not invent facts.",
].join(" ");

/**
 * Returns the deterministic scaffold, enhanced with an AI narrative when a
 * provider is configured. Never throws; degrades gracefully to deterministic.
 */
export async function generateDraft(input: AriaDraftInput): Promise<AriaDraftResult> {
  const result = buildDraftScaffold(input);
  try {
    const { generateText } = await import("@/lib/aria/aria-provider");
    const userPrompt = [
      `Draft type: ${input.draftType.replace(/_/g, " ")}.`,
      `Source type: ${input.sourceType}.`,
      "Source record:",
      input.content,
      "",
      "Produce a stronger, child-centred draft following these section headings:",
      result.sections.map((s) => `- ${s.heading}`).join("\n"),
      "",
      `ARIA's analysis summary: ${result.analysisSummary}`,
    ].join("\n");
    const ai = await generateText({ systemPrompt: DRAFT_SYSTEM_PROMPT, userPrompt, temperature: 0.4, maxOutputTokens: 1400 });
    if (ai.llmUsed && ai.text.trim().length > 0) {
      result.aiNarrative = ai.text.trim();
      result.generatedBy = "ai";
    }
  } catch {
    // Provider unavailable — deterministic scaffold stands on its own.
  }
  return result;
}
