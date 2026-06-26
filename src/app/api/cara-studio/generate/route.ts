// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/generate — Governed AI Content Generation
//
// Safety-checked, profile-aware generation pipeline.
// Cara drafts. Humans decide. Only authorised humans approve and commit.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/cara-studio/generator";
import { generateRequestSchema } from "@/lib/cara-studio/schemas";
import { getUserIdFromRequest, getUserRoleFromRequest } from "@/lib/auth-guard";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeStudioAuditLog } from "@/lib/cara-studio/audit.service";
import { TONES, GENERATION_TYPES } from "@/lib/cara-studio/types";
import type { GenerationRequest } from "@/lib/cara-studio/types";

type SB = any;

// The standalone Studio page offers a richer artifact catalogue
// (CARA_ARTIFACT_TYPE_LABELS — 31 entries) than the generator's GenerationType
// enum (GENERATION_TYPES — 22 entries). Without a mapping, 28 of the 31 page
// types uppercase to a value that isn't in the enum, so generation failed
// validation with a 400 and the page silently showed nothing ("no outcomes").
// Map every page artifact_type to the closest generator type; unknown/empty
// values fall back to a safe generic briefing so generation never hard-fails.
const ARTIFACT_TYPE_TO_GENERATION_TYPE: Record<string, string> = {
  keywork_session: "KEYWORK_SESSION",
  direct_work_session: "DIRECT_WORK_SESSION",
  child_friendly_worksheet: "FLASHCARDS",
  child_friendly_explanation: "YOUNG_PERSON_EXPLAINER",
  staff_training: "STAFF_MICRO_TRAINING",
  quiz: "STAFF_MICRO_TRAINING",
  flashcards: "FLASHCARDS",
  reflective_practice_prompt: "MANAGER_OVERSIGHT_PROMPTS",
  management_oversight: "MANAGER_OVERSIGHT_PROMPTS",
  incident_learning_review: "STAFF_BRIEFING",
  risk_review: "RISK_ASSESSMENT_DRAFT",
  safeguarding_review: "STAFF_BRIEFING",
  child_plan: "CARE_PLAN_DRAFT",
  placement_plan_update: "PLACEMENT_PLAN_DRAFT",
  care_plan_update: "CARE_PLAN_DRAFT",
  annex_a_update: "REG45_EVIDENCE_PREP",
  ofsted_readiness_summary: "REG44_EVIDENCE_PREP",
  ri_briefing: "STAFF_BRIEFING",
  social_worker_update: "STAFF_BRIEFING",
  parent_professional_letter: "STAFF_BRIEFING",
  team_meeting_discussion: "TEAM_DISCUSSION_GUIDE",
  supervision_prompt: "MANAGER_OVERSIGHT_PROMPTS",
  audio_briefing_script: "STAFF_BRIEFING",
  video_briefing_script: "STAFF_BRIEFING",
  slide_deck_outline: "TEAM_MEETING_PACK",
  mind_map: "STAFF_BRIEFING",
  timeline: "STAFF_BRIEFING",
  visual_formulation: "STAFF_BRIEFING",
  action_plan: "STAFF_BRIEFING",
  reflective_workbook: "DIRECT_WORK_SESSION",
  scenario_simulation: "STAFF_MICRO_TRAINING",
};

function resolveGenerationType(raw: unknown): string {
  const direct = String(raw ?? "").trim();
  if (!direct) return "STAFF_BRIEFING";
  const upper = direct.toUpperCase();
  if ((GENERATION_TYPES as readonly string[]).includes(upper)) return upper;
  return ARTIFACT_TYPE_TO_GENERATION_TYPE[direct.toLowerCase()] ?? "STAFF_BRIEFING";
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const userId = getUserIdFromRequest(req);
    const role = getUserRoleFromRequest(req);
    void role;
    const organisationId = process.env.SUPABASE_ORG_ID ?? "org_default";
    const homeId = process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";

    // ── Normalise the Studio page's field names into the schema shape ─────────
    // The page sends artifact_type / child_id / additional_context and omits
    // title/brief; map them + coerce so generation isn't rejected with a 400.
    const body = {
      childId: rawBody.childId ?? rawBody.child_id,
      generationType: resolveGenerationType(rawBody.generationType ?? rawBody.artifact_type),
      title: rawBody.title ?? (rawBody.artifact_type ? `${String(rawBody.artifact_type).replace(/_/g, " ")} draft` : undefined),
      brief: rawBody.brief ?? rawBody.additional_context ?? rawBody.additionalContext
        ?? "Generate this artifact using the child's profile and the context provided.",
      tone: (TONES as readonly string[]).includes(rawBody.tone) ? rawBody.tone : "warm_professional",
      audience: rawBody.audience ?? "staff",
      additionalContext: rawBody.additionalContext ?? rawBody.additional_context,
    };

    // ── Validate input ──────────────────────────────────────────────────────
    const parsed = generateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // ── Build generation request ────────────────────────────────────────────
    const request: GenerationRequest = {
      organisationId,
      homeId,
      userId,
      childId: input.childId,
      generationType: input.generationType,
      title: input.title,
      brief: input.brief,
      tone: input.tone,
      audience: input.audience ?? "staff",
      additionalContext: input.additionalContext,
    };

    // ── Generate (safety-checked pipeline) ──────────────────────────────────
    const result = await generate(request);

    // ── Persist to database ─────────────────────────────────────────────────
    let generationId: string | undefined;
    const sb = createServerClient();

    if (sb && isSupabaseEnabled() && result.output) {
      const { data: inserted } = await (sb.from("cara_studio_generations") as SB)
        .insert({
          organisation_id: organisationId,
          home_id: homeId,
          child_id: input.childId ?? null,
          generation_type: input.generationType,
          title: input.title,
          brief: input.brief,
          tone: input.tone,
          audience: input.audience ?? "staff",
          status: result.success ? "draft" : "rejected",
          output_json: result.output,
          safety_json: result.safety,
          profile_json: result.profile ?? null,
          model: result.model,
          created_by: userId,
          error: result.error ?? null,
        })
        .select("id")
        .single();

      generationId = inserted?.id;
    }

    // ── Audit trail ─────────────────────────────────────────────────────────
    await writeStudioAuditLog({
      home_id: homeId,
      actor_id: userId,
      action_type: result.success ? "artifact_generated" : "artifact_rejected",
      artifact_id: generationId ?? null,
      prompt_summary: `${input.generationType}: ${input.title}`,
      model_name: result.model,
      request_metadata: { tone: input.tone, audience: input.audience, hasChild: !!input.childId },
      response_metadata: { safety: result.safety, success: result.success },
    });

    // ── Return response ─────────────────────────────────────────────────────
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          safety: result.safety,
          generationId,
        },
        { status: 422 },
      );
    }

    // Compatibility shape for the standalone Studio page, which reads
    // data.artifact.generated_content / data.quality_check / data.gaps_found.
    const generatedContent = result.output
      ? [
          `# ${result.output.title}`,
          result.output.summary,
          ...result.output.sections.map((s) =>
            `## ${s.heading}\n\n${s.content}` +
            (s.items && s.items.length ? "\n\n" + s.items.map((i) => `- ${i}`).join("\n") : "")),
        ].filter(Boolean).join("\n\n")
      : "";

    return NextResponse.json(
      {
        success: true,
        generationId,
        output: result.output,
        artifact: result.output
          ? { id: generationId ?? null, generated_title: result.output.title, generated_content: generatedContent }
          : undefined,
        quality_check: result.safety,
        gaps_found: [],
        safety: result.safety,
        profile: result.profile ? {
          childName: result.profile.preferredName ?? result.profile.childName,
          age: result.profile.age,
          strengths: result.profile.strengths,
          needs: result.profile.needs,
          riskFlags: result.profile.riskFlags,
        } : undefined,
        model: result.model,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[cara-studio/generate] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate content", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
