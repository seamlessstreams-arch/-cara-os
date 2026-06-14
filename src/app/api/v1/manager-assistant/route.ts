// ══════════════════════════════════════════════════════════════════════════════
// CARA — AI MANAGER ASSISTANT API (workforce slice 6, spec §13)
// GET  /api/v1/manager-assistant → vacancies, candidates, tool metadata
// POST /api/v1/manager-assistant
//        { tool: "job_advert", vacancy_id }       → advert draft
//        { tool: "candidate_summary", candidate_id } → strengths summary draft
//        { tool: "action_plan", goal, context? }  → action-plan draft
//
// Every tool returns a DETERMINISTIC scaffold built only from recorded data,
// plus an optional Cara polish when an LLM key is configured (graceful without).
// Drafts only — nothing is published or sent; every AI generation is audited.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { generateText } from "@/lib/cara/cara-provider";
import { intelligenceDb } from "@/lib/intelligence/store";
import {
  buildJobAdvertScaffold, buildCandidateSummaryScaffold, buildActionPlanScaffold,
  ADVERT_AI_SYSTEM_PROMPT, SUMMARY_AI_SYSTEM_PROMPT, PLAN_AI_SYSTEM_PROMPT,
  ASSISTANT_DISCLAIMER, type VacancyLite,
} from "@/lib/engines/manager-assistant-engine";
import { computeValuesMatch, type EmployerValuesProfile, type CandidateValuesProfile } from "@/lib/engines/values-match-engine";

function audit(user_id: string, note: string, child_id?: string) {
  try {
    intelligenceDb.caraAuditTrail.create({
      home_id: "home_oak", user_id, child_id,
      action_type: "ai_record_rewrite_generated",
      source_table: "manager_assistant",
      human_edit: note,
    });
  } catch { /* audit must never break the flow */ }
}

export async function GET() {
  const store = getStore() as any;
  const vacancies = ((store.vacancies ?? []) as any[]).map((v) => ({ id: v.id, title: v.title, status: v.status }));
  const profiles: any[] = store.candidateProfiles ?? [];
  const candidates = ((store.candidateValuesProfiles ?? []) as CandidateValuesProfile[]).map((c) => {
    const p = profiles.find((x) => x.id === c.candidate_id);
    return { id: c.candidate_id, name: c.candidate_name || (p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : c.candidate_id) };
  });
  return NextResponse.json({
    data: {
      vacancies, candidates,
      has_values_profile: !!(store.employerValuesProfiles ?? [])[0],
      disclaimer: ASSISTANT_DISCLAIMER,
    },
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any;
  const user_id = req.headers.get("x-user-id")?.trim() || "staff_darren";
  const store = getStore() as any;
  const employer: EmployerValuesProfile | null = (store.employerValuesProfiles ?? [])[0] ?? null;
  const tool = String(body.tool ?? "");

  let scaffold = "";
  let systemPrompt = "";
  let auditNote = "";
  let child_id: string | undefined;

  if (tool === "job_advert") {
    const vacancy = ((store.vacancies ?? []) as VacancyLite[]).find((v) => v.id === String(body.vacancy_id ?? ""));
    if (!vacancy) return NextResponse.json({ ok: false, error: "Select a vacancy first." }, { status: 400 });
    scaffold = buildJobAdvertScaffold(vacancy, employer);
    systemPrompt = ADVERT_AI_SYSTEM_PROMPT;
    auditNote = `job advert draft (vacancy=${vacancy.id})`;
  } else if (tool === "candidate_summary") {
    const candidate = ((store.candidateValuesProfiles ?? []) as CandidateValuesProfile[]).find((c) => c.candidate_id === String(body.candidate_id ?? ""));
    if (!candidate) return NextResponse.json({ ok: false, error: "Select a candidate first." }, { status: 400 });
    if (!employer) return NextResponse.json({ ok: false, error: "Create your Employer Values Profile first — the summary is built from the values match." }, { status: 400 });
    scaffold = buildCandidateSummaryScaffold(computeValuesMatch(employer, candidate));
    systemPrompt = SUMMARY_AI_SYSTEM_PROMPT;
    auditNote = `candidate summary draft (candidate=${candidate.candidate_id})`;
  } else if (tool === "action_plan") {
    const goal = String(body.goal ?? "").trim();
    if (!goal) return NextResponse.json({ ok: false, error: "Describe the goal first." }, { status: 400 });
    scaffold = buildActionPlanScaffold(goal, body.context ? String(body.context) : undefined);
    systemPrompt = PLAN_AI_SYSTEM_PROMPT;
    auditNote = "action plan draft";
  } else {
    return NextResponse.json({ ok: false, error: "Unknown tool." }, { status: 400 });
  }

  const result = await generateText({ systemPrompt, userPrompt: scaffold, temperature: 0.4, maxOutputTokens: 900 });
  const llmUsed = result.llmUsed && !!result.text?.trim();
  audit(user_id, `${auditNote}${llmUsed ? " + Cara polish" : " (deterministic only)"}`, child_id);

  return NextResponse.json({
    data: {
      scaffold,
      ai_draft: llmUsed ? result.text.trim() : null,
      llmUsed,
      llm_message: llmUsed ? null : "Cara's AI polish isn't configured in this environment — the structured draft below is assembled from your recorded data and is ready to edit.",
      disclaimer: ASSISTANT_DISCLAIMER,
    },
  });
}
