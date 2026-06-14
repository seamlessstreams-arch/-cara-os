// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — CORE ENGINE
//
// The orchestrator for the intelligence layer. Retrieves evidence, calls the
// AI provider, validates the output, persists the AI run and evidence links,
// and records the audit trail.
//
// All output is "Cara suggested draft" until a human approves and commits.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { generateCaraJson } from "./provider";
import {
  CaraOutputSchema,
  CaraRequestSchema,
  type CaraOutput,
  type CaraRequest,
} from "./types";
import { retrieveCaraEvidence } from "./evidence";
import {
  CARA_CORE_GUARDRAILS,
  buildHumanWritingInstruction,
  detectUnsafeOutput,
  hashPrompt,
} from "./guardrails";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function evidenceForPrompt(evidence: Awaited<ReturnType<typeof retrieveCaraEvidence>>) {
  return evidence.map((item, index) => ({
    number: index + 1,
    sourceTable: item.sourceTable,
    sourceId: item.sourceId,
    sourceDate: item.sourceDate,
    sourceTitle: item.sourceTitle,
    sourceExcerpt: item.sourceExcerpt,
    regulationRefs: item.regulationRefs,
    qualityStandardRefs: item.qualityStandardRefs,
  }));
}

function buildSystemPrompt(request: CaraRequest) {
  return `
${CARA_CORE_GUARDRAILS}
${buildHumanWritingInstruction()}

Current mode: ${request.roleMode}
Feature: ${request.featureKey}
Strict evidence mode: ${request.strictEvidenceMode ? "enabled" : "disabled"}
Therapeutic lens: ${request.includeTherapeuticLens ? "enabled" : "disabled"}
Ofsted lens: ${request.includeOfstedLens ? "enabled" : "disabled"}
Staff development lens: ${request.includeStaffDevelopmentLens ? "enabled" : "disabled"}

Return JSON only. The JSON must match this exact structure:
{
  "answer": "string",
  "executiveSummary": "string",
  "childVoiceProtected": true,
  "confidence": 0,
  "safetyFlags": [],
  "evidenceUsed": [
    {
      "sourceTable": "string",
      "sourceId": "uuid",
      "sourceDate": "string",
      "sourceTitle": "string",
      "sourceExcerpt": "string",
      "sourceAuthorId": null,
      "relevanceScore": 0,
      "evidenceType": "record",
      "regulationRefs": [],
      "qualityStandardRefs": []
    }
  ],
  "suggestedUpdates": [
    {
      "targetTable": "string",
      "targetId": null,
      "updateType": "review",
      "title": "string",
      "rationale": "string",
      "suggestedPayload": {},
      "riskLevel": "low"
    }
  ],
  "missingEvidence": [],
  "managementOversightRequired": false,
  "regulatoryRefs": [],
  "qualityStandardRefs": [],
  "practicePrompts": [],
  "nextBestActions": [
    {
      "title": "string",
      "ownerRole": "string",
      "duePriority": "today",
      "rationale": "string"
    }
  ]
}
`;
}

export async function runCaraIntelligence(rawRequest: unknown, requestedBy: string): Promise<{
  aiRunId: string;
  output: CaraOutput;
}> {
  const request = CaraRequestSchema.parse(rawRequest);

  const evidence = await retrieveCaraEvidence({
    homeId: request.homeId,
    childId: request.childId,
    searchText: request.userQuestion,
  });

  const systemPrompt = buildSystemPrompt(request);
  const userPayload = JSON.stringify({
    userQuestion: request.userQuestion,
    evidence: evidenceForPrompt(evidence),
  });

  const raw = await generateCaraJson({
    model: request.featureKey.includes("inspection")
      ? (process.env.CARA_REVIEW_MODEL ?? process.env.CARA_REVIEW_MODEL) ?? (process.env.CARA_MODEL ?? process.env.CARA_MODEL)
      : (process.env.CARA_MODEL ?? process.env.CARA_MODEL),
    temperature: 0.15,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPayload },
    ],
  });

  const parsed = CaraOutputSchema.parse(raw);
  const extraSafetyFlags = detectUnsafeOutput(parsed.answer);
  const output: CaraOutput = {
    ...parsed,
    safetyFlags: [...parsed.safetyFlags, ...extraSafetyFlags],
    confidence: request.strictEvidenceMode && evidence.length === 0 ? Math.min(parsed.confidence, 35) : parsed.confidence,
  };

  // Persist the AI run if Supabase is available
  if (!isSupabaseEnabled()) {
    return { aiRunId: "demo-run-id", output };
  }

  const sb = createServerClient();
  if (!sb) return { aiRunId: "demo-run-id", output };

  const promptHash = hashPrompt(`${systemPrompt}:${userPayload}`);

  const { data: run, error: runError } = await (sb.from("cara_ai_runs") as SB)
    .insert({
      home_id: request.homeId,
      child_id: request.childId,
      requested_by: requestedBy,
      role_mode: request.roleMode,
      feature_key: request.featureKey,
      prompt_hash: promptHash,
      model: (process.env.CARA_MODEL ?? process.env.CARA_MODEL) ?? "gpt-4.1-mini",
      input_summary: request.userQuestion.slice(0, 1000),
      output_summary: output.executiveSummary ?? output.answer.slice(0, 1000),
      output_json: output,
      status: output.safetyFlags.length ? "requires_review" : "draft",
      confidence: output.confidence,
      requires_human_approval: true,
      safety_flags: output.safetyFlags,
      evidence_count: output.evidenceUsed.length,
    })
    .select("id")
    .single();

  if (runError || !run) throw new Error(runError?.message ?? "Failed to create Cara AI run.");

  const evidenceRows = output.evidenceUsed.length ? output.evidenceUsed : evidence.slice(0, 12);

  if (evidenceRows.length) {
    await (sb.from("cara_evidence_links") as SB).insert(
      evidenceRows.map((item) => ({
        home_id: request.homeId,
        ai_run_id: run.id,
        source_table: item.sourceTable,
        source_id: item.sourceId,
        source_date: item.sourceDate,
        source_title: item.sourceTitle,
        source_excerpt: item.sourceExcerpt,
        source_author_id: item.sourceAuthorId,
        relevance_score: item.relevanceScore,
        evidence_type: item.evidenceType,
        regulation_refs: item.regulationRefs,
        quality_standard_refs: item.qualityStandardRefs,
      }))
    );
  }

  if (output.suggestedUpdates.length) {
    await (sb.from("cara_suggested_updates") as SB).insert(
      output.suggestedUpdates.map((update) => ({
        home_id: request.homeId,
        ai_run_id: run.id,
        child_id: request.childId,
        target_table: update.targetTable,
        target_id: update.targetId,
        update_type: update.updateType,
        title: update.title,
        rationale: update.rationale,
        suggested_payload: update.suggestedPayload,
        risk_level: update.riskLevel,
        status: "requires_review",
      }))
    );
  }

  await (sb.from("cara_approval_events") as SB).insert({
    home_id: request.homeId,
    ai_run_id: run.id,
    actor_id: requestedBy,
    action: "created",
    notes: "Cara generated a draft requiring human review.",
    after_json: output,
  });

  return { aiRunId: run.id, output };
}

export async function approveCaraRun(input: {
  homeId: string;
  aiRunId: string;
  actorId: string;
  notes?: string;
}) {
  if (!isSupabaseEnabled()) return { ok: true };
  const sb = createServerClient();
  if (!sb) return { ok: true };

  const { data: existing, error: fetchError } = await (sb.from("cara_ai_runs") as SB)
    .select("*")
    .eq("id", input.aiRunId)
    .eq("home_id", input.homeId)
    .single();

  if (fetchError || !existing) throw new Error(fetchError?.message ?? "AI run not found.");

  const { error } = await (sb.from("cara_ai_runs") as SB)
    .update({
      status: "approved",
      human_approved_by: input.actorId,
      human_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.aiRunId)
    .eq("home_id", input.homeId);

  if (error) throw new Error(error.message);

  await (sb.from("cara_approval_events") as SB).insert({
    home_id: input.homeId,
    ai_run_id: input.aiRunId,
    actor_id: input.actorId,
    action: "approved",
    notes: input.notes ?? "Human approved Cara draft.",
    before_json: existing,
  });

  return { ok: true };
}

export async function rejectCaraRun(input: {
  homeId: string;
  aiRunId: string;
  actorId: string;
  reason: string;
}) {
  if (!isSupabaseEnabled()) return { ok: true };
  const sb = createServerClient();
  if (!sb) return { ok: true };

  const { data: existing, error: fetchError } = await (sb.from("cara_ai_runs") as SB)
    .select("*")
    .eq("id", input.aiRunId)
    .eq("home_id", input.homeId)
    .single();

  if (fetchError || !existing) throw new Error(fetchError?.message ?? "AI run not found.");

  const { error } = await (sb.from("cara_ai_runs") as SB)
    .update({
      status: "rejected",
      rejection_reason: input.reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.aiRunId)
    .eq("home_id", input.homeId);

  if (error) throw new Error(error.message);

  await (sb.from("cara_approval_events") as SB).insert({
    home_id: input.homeId,
    ai_run_id: input.aiRunId,
    actor_id: input.actorId,
    action: "rejected",
    notes: input.reason,
    before_json: existing,
  });

  return { ok: true };
}
