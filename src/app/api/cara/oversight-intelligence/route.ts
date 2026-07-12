// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/oversight-intelligence
//
// AI-powered management oversight intelligence using Vercel AI Gateway.
// Runs on Claude (Anthropic) — the only AI provider.
//
// POST — Run AI analysis for a specific oversight domain
// GET  — Health check / provider status
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateViaGateway,
  runOversightAnalysis,
  resolveProvider,
  resolveModel,
  type OversightDomain,
  type AIProvider,
  ALL_OVERSIGHT_DOMAINS,
} from "@/lib/cara/ai/gateway";
import { readJsonBody } from "@/lib/http/read-json";

const VALID_DOMAINS: OversightDomain[] = [...ALL_OVERSIGHT_DOMAINS];

// ── POST: Run AI oversight analysis ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    action,
    domain,
    context,
    childPseudonym,
    homeId,
    additionalContext,
    crossValidate,
    provider,
    systemPrompt,
    userPrompt,
  } = body as {
    action?: string;
    domain?: OversightDomain;
    context?: string;
    childPseudonym?: string;
    homeId?: string;
    additionalContext?: string;
    crossValidate?: boolean;
    provider?: AIProvider;
    systemPrompt?: string;
    userPrompt?: string;
  };

  // Action: "analyse" — Full oversight analysis with optional cross-validation
  if (action === "analyse" || action === "analyze") {
    if (!domain || !VALID_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: `domain must be one of: ${VALID_DOMAINS.join(", ")}` },
        { status: 400 },
      );
    }
    if (!context || context.trim().length === 0) {
      return NextResponse.json(
        { error: "context is required and must be non-empty" },
        { status: 400 },
      );
    }

    try {
      const result = await runOversightAnalysis({
        domain,
        context,
        childPseudonym,
        homeId,
        additionalContext,
        crossValidate: crossValidate ?? false,
      });

      return NextResponse.json({
        data: {
          domain,
          provider: result.primaryAnalysis.provider,
          model: result.primaryAnalysis.model,
          analysis: result.primaryAnalysis.content,
          tokensUsed: result.primaryAnalysis.tokensUsed,
          latencyMs: result.primaryAnalysis.latencyMs,
          crossValidation: result.crossValidation ? {
            provider: result.crossValidation.provider,
            model: result.crossValidation.model,
            content: result.crossValidation.content,
            agreement: result.agreement,
          } : undefined,
          combinedConfidence: result.combinedConfidence,
          caraLabel: "AI suggested draft",
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: "Analysis failed", detail: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  }

  // Action: "generate" — Direct generation for a custom prompt
  if (action === "generate") {
    if (!domain || !VALID_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: `domain must be one of: ${VALID_DOMAINS.join(", ")}` },
        { status: 400 },
      );
    }
    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: "systemPrompt and userPrompt are required" },
        { status: 400 },
      );
    }

    try {
      const result = await generateViaGateway({
        provider,
        domain,
        systemPrompt,
        userPrompt,
        maxOutputTokens: 2500,
        temperature: 0.3,
      });

      return NextResponse.json({
        data: {
          content: result.content,
          provider: result.provider,
          model: result.model,
          tokensUsed: result.tokensUsed,
          latencyMs: result.latencyMs,
          wasSanitised: result.wasSanitised,
          caraLabel: "AI suggested draft",
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: "Generation failed", detail: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  }

  // Action: "route" — Check which provider would handle a domain
  if (action === "route") {
    if (!domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }
    const resolved = resolveProvider(domain as OversightDomain, provider);
    const model = resolveModel(resolved);
    return NextResponse.json({
      data: {
        domain,
        provider: resolved,
        model,
        reason: "Oversight intelligence → Claude (Anthropic)",
      },
    });
  }

  return NextResponse.json(
    { error: "action must be 'analyse', 'generate', or 'route'" },
    { status: 400 },
  );
}

// ── GET: Health check and provider info ──────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: "operational",
    gateway: "vercel-ai-sdk",
    providers: {
      anthropic: {
        role: "Oversight & Operational Intelligence (Cara)",
        model: resolveModel("anthropic"),
        domains: ALL_OVERSIGHT_DOMAINS,
      },
    },
    routing: "All oversight domains run on Claude (Anthropic) — the only AI provider",
    caraLabel: "All AI output is labelled 'AI suggested draft' — never final until human-approved",
  });
}
