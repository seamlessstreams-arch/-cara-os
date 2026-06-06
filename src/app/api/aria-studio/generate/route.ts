// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria-studio/generate — Governed AI Content Generation
//
// Safety-checked, profile-aware generation pipeline.
// ARIA drafts. Humans decide. Only authorised humans approve and commit.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/aria-studio/generator";
import { generateRequestSchema } from "@/lib/aria-studio/schemas";
import { getUserIdFromRequest, getUserRoleFromRequest } from "@/lib/auth-guard";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeStudioAuditLog } from "@/lib/aria-studio/audit.service";
import { TONES } from "@/lib/aria-studio/types";
import type { GenerationRequest } from "@/lib/aria-studio/types";

type SB = any;

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
      generationType: String(rawBody.generationType ?? rawBody.artifact_type ?? "").toUpperCase(),
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
      const { data: inserted } = await (sb.from("aria_studio_generations") as SB)
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
    console.error("[aria-studio/generate] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate content", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
