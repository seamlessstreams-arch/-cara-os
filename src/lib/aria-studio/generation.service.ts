// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — GENERATION SERVICE
// Orchestrates: source fetch → prompt build → AI call → persist → quality check
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { generateStudioContent } from "./ai-provider.service";
import { buildGenerationPrompt } from "./prompts";
import { runQualityCheck } from "./quality-check.service";
import { writeStudioAuditLog } from "./audit.service";
import type {
  AriaStudioGenerateRequest,
  AriaStudioGenerateResponse,
  AriaStudioArtifact,
  AriaStudioArtifactSource,
  AriaStudioGap,
  AriaStudioContradiction,
  AriaStudioSafeguardingPattern,
  AriaStudioQualityCheck,
} from "@/types/aria-studio";
import { ARTIFACT_TYPE_LABELS } from "@/types/aria-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function generateArtifact(
  request: AriaStudioGenerateRequest,
  actor: { userId: string; role: string; homeId?: string },
): Promise<AriaStudioGenerateResponse> {
  const sb = createServerClient();
  const hid = actor.homeId ?? request.home_id ?? homeId();

  // 1. Fetch sources
  let sourceContext = "";
  const sourcesUsed: AriaStudioArtifactSource[] = [];

  if (sb && request.source_ids?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sources } = await (sb.from("aria_studio_sources") as any)
      .select("*")
      .in("id", request.source_ids)
      .eq("home_id", hid);

    if (sources?.length) {
      sourceContext = sources
        .map((s: { source_type: string; title: string; summary: string; content: string; source_date: string }) =>
          `[${s.source_type}] ${s.title ?? "Untitled"} (${s.source_date ?? "no date"})\n${s.summary ?? s.content ?? "No content"}`,
        )
        .join("\n\n---\n\n");
    }
  }

  // 2. Build prompt
  const { systemPrompt, userPrompt } = buildGenerationPrompt({
    artifactType: request.artifact_type,
    framework: request.framework,
    tone: request.tone,
    sourceContext,
    additionalContext: request.additional_context,
  });

  // 3. Call AI
  const aiResponse = await generateStudioContent(systemPrompt, userPrompt);

  // 4. Build artifact title
  const typeLabel = ARTIFACT_TYPE_LABELS[request.artifact_type];
  const title = `${typeLabel} — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

  // 5. Persist artifact
  let artifact: AriaStudioArtifact;
  if (sb) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from("aria_studio_artifacts") as any)
      .insert({
        home_id: hid,
        artifact_type: request.artifact_type,
        title,
        status: "draft",
        child_id: request.child_id ?? null,
        staff_id: request.staff_id ?? null,
        incident_id: request.incident_id ?? null,
        framework: request.framework ?? null,
        tone: request.tone ?? "balanced",
        creative_mode: request.creative_mode ?? "balanced",
        generated_content: aiResponse.content,
        plain_text_content: aiResponse.content,
        created_by: actor.userId,
      })
      .select("*")
      .single();

    if (error) throw new Error(`Failed to persist artifact: ${error.message}`);
    artifact = data;

    // Link sources
    if (request.source_ids?.length) {
      const links = request.source_ids.map((sid) => ({
        artifact_id: artifact.id,
        source_id: sid,
        confidence_level: "medium",
        is_primary_evidence: false,
        is_child_voice: false,
        is_contradicted: false,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb.from("aria_studio_artifact_sources") as any).insert(links);
    }

    // Write audit log
    await writeStudioAuditLog({
      home_id: hid,
      actor_id: actor.userId,
      action_type: "artifact_generated",
      artifact_id: artifact.id,
      source_ids: request.source_ids ?? [],
      prompt_summary: `Generated ${request.artifact_type} with ${request.framework ?? "no"} framework, ${request.tone ?? "balanced"} tone`,
      model_provider: aiResponse.provider,
      model_name: aiResponse.model,
      response_metadata: { tokens_used: aiResponse.tokens_used },
    });
  } else {
    // Demo mode — return without persistence
    artifact = {
      id: crypto.randomUUID(),
      home_id: hid,
      artifact_type: request.artifact_type,
      title,
      status: "draft",
      child_id: request.child_id ?? null,
      staff_id: request.staff_id ?? null,
      incident_id: request.incident_id ?? null,
      linked_record_id: null,
      linked_record_type: null,
      framework: request.framework ?? null,
      tone: (request.tone ?? "balanced") as AriaStudioArtifact["tone"],
      creative_mode: request.creative_mode ?? "balanced",
      generated_content: aiResponse.content,
      structured_content: null,
      plain_text_content: aiResponse.content,
      quality_score: null,
      evidence_confidence_score: null,
      safeguarding_level: "none",
      regulation_relevance: [],
      created_by: actor.userId,
      reviewed_by: null,
      approved_by: null,
      committed_by: null,
      rejected_by: null,
      created_at: new Date().toISOString(),
      submitted_for_review_at: null,
      reviewed_at: null,
      approved_at: null,
      committed_at: null,
      rejected_at: null,
      archived_at: null,
      version_number: 1,
      filing_cabinet_path: null,
      official_record_id: null,
    };
  }

  // 6. Run quality check
  let qualityCheck: AriaStudioQualityCheck | null = null;
  try {
    qualityCheck = await runQualityCheck(artifact.id, artifact.generated_content ?? "");
  } catch {
    // Quality check failure should not block generation
  }

  return {
    artifact,
    sources_used: sourcesUsed,
    quality_check: qualityCheck,
    gaps_found: [] as AriaStudioGap[],
    contradictions_found: [] as AriaStudioContradiction[],
    safeguarding_alerts: [] as AriaStudioSafeguardingPattern[],
  };
}
