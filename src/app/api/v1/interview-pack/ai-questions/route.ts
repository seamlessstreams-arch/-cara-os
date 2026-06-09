// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTERVIEW PACK · ARIA EXTRA QUESTIONS
// POST /api/v1/interview-pack/ai-questions   body: { role, candidateId? }
//
// Optional AI support (spec §7 + §13): suggests a few ADDITIONAL, values-aligned
// interview questions from the role, the home's values and (optionally) the
// candidate. DRAFTS ONLY — the manager accepts, edits or rejects. Graceful when
// no LLM key is configured (returns llmUsed:false). Reuses the sanctioned
// generateText provider; never auto-decides.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { generateText } from "@/lib/aria/aria-provider";
import { INTERVIEW_ROLES } from "@/lib/engines/interview-pack-engine";
import type { EmployerValuesProfile, CandidateValuesProfile } from "@/lib/engines/values-match-engine";

const AI_DISCLAIMER = "AI suggestions require professional judgement and manager approval. Review, edit or reject before use.";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const role = String(body.role || INTERVIEW_ROLES[0].key);
  const candidateId = body.candidateId ? String(body.candidateId) : null;
  const roleLabel = (INTERVIEW_ROLES.find((r) => r.key === role) ?? INTERVIEW_ROLES[0]).label;

  const store = getStore() as any;
  const employer: EmployerValuesProfile | null = (store.employerValuesProfiles ?? [])[0] ?? null;
  const candidates: CandidateValuesProfile[] = store.candidateValuesProfiles ?? [];
  const cand = candidateId ? candidates.find((c) => c.candidate_id === candidateId) : null;

  const facts: string[] = [`Role: ${roleLabel}.`];
  if (employer) {
    facts.push(`Home: ${employer.home_name}.`);
    if (employer.core_values?.length) facts.push(`Core values: ${employer.core_values.join(", ")}.`);
    if (employer.therapeutic_model) facts.push(`Therapeutic model: ${employer.therapeutic_model}`);
    if (employer.non_negotiables?.length) facts.push(`Non-negotiables: ${employer.non_negotiables.join("; ")}.`);
  }
  if (cand) {
    if (cand.development_areas?.length) facts.push(`Candidate development areas to probe: ${cand.development_areas.join(", ")}.`);
    if (cand.preferred_role) facts.push(`Candidate prefers: ${cand.preferred_role}.`);
  }

  const systemPrompt =
    "You are helping a children's-home manager prepare a fair, values-based, trauma-informed interview. " +
    "Suggest 4–5 ADDITIONAL open interview questions tailored to the role and the home's values. " +
    "Questions must be relational, safeguarding-aware and non-leading. Do NOT make any hiring judgement or score anyone. " +
    "Return ONLY the questions, one per line, no numbering, no preamble.";
  const userPrompt = facts.join("\n");

  const result = await generateText({ systemPrompt, userPrompt, temperature: 0.5, maxOutputTokens: 400 });

  if (!result.llmUsed || !result.text?.trim()) {
    return NextResponse.json({
      data: {
        questions: [],
        llmUsed: false,
        message: "ARIA isn't configured in this environment, so AI-suggested questions are unavailable. The structured pack above is complete on its own. (Add an ANTHROPIC_API_KEY to enable AI suggestions.)",
        disclaimer: AI_DISCLAIMER,
      },
    });
  }

  const questions = result.text
    .split("\n")
    .map((l) => l.replace(/^\s*[-*\d.\)]+\s*/, "").trim())
    .filter((l) => l.length > 8)
    .slice(0, 6);

  return NextResponse.json({ data: { questions, llmUsed: true, message: null, disclaimer: AI_DISCLAIMER } });
}
