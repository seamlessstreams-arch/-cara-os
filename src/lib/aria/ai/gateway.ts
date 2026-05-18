// ══════════════════════════════════════════════════════════════════════════════
// ARIA AI GATEWAY — Vercel AI SDK Integration
//
// Unified AI provider for all ARIA intelligence features using Vercel AI Gateway.
// Routes requests to OpenAI (management oversight) or Anthropic (operational)
// based on the task domain.
//
// - OpenAI: management-level oversight, pattern detection, compliance audit,
//           Ofsted readiness, risk escalation, governance verification
// - Anthropic (Claude): operational intelligence, daily analysis, therapeutic
//           support suggestions, care record enhancement
//
// All requests go through Vercel AI Gateway — authenticated via OIDC token,
// no direct API keys needed in production.
// ══════════════════════════════════════════════════════════════════════════════

import { generateText, streamText } from "ai";
import { ARIA_SYSTEM_PREAMBLE, sanitiseOutput } from "./safety";

// ── Types ────────────────────────────────────────────────────────────────────

export type AIProvider = "openai" | "anthropic";

export type OversightDomain =
  | "quality_of_care_review"
  | "compliance_audit"
  | "pattern_detection"
  | "ofsted_readiness"
  | "staff_practice_quality"
  | "governance_verification"
  | "outcome_tracking"
  | "risk_escalation"
  | "financial_oversight"
  | "safeguarding_audit"
  | "aria_output_validation"
  | "regulatory_interpretation"
  | "record_oversight"
  | "operational_intelligence"
  | "therapeutic_support"
  | "daily_analysis";

export interface GatewayRequest {
  provider?: AIProvider;
  domain: OversightDomain;
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

export interface GatewayResponse {
  content: string;
  model: string;
  provider: AIProvider;
  tokensUsed: number;
  finishReason: string;
  wasSanitised: boolean;
  latencyMs: number;
}

// ── Provider Routing ─────────────────────────────────────────────────────────

const OPENAI_DOMAINS: OversightDomain[] = [
  "quality_of_care_review",
  "compliance_audit",
  "pattern_detection",
  "ofsted_readiness",
  "staff_practice_quality",
  "governance_verification",
  "outcome_tracking",
  "risk_escalation",
  "financial_oversight",
  "safeguarding_audit",
  "aria_output_validation",
  "regulatory_interpretation",
];

const ANTHROPIC_DOMAINS: OversightDomain[] = [
  "record_oversight",
  "operational_intelligence",
  "therapeutic_support",
  "daily_analysis",
];

function resolveProvider(domain: OversightDomain, explicit?: AIProvider): AIProvider {
  if (explicit) return explicit;
  if (OPENAI_DOMAINS.includes(domain)) return "openai";
  if (ANTHROPIC_DOMAINS.includes(domain)) return "anthropic";
  return "openai"; // default to OpenAI for management-level tasks
}

function resolveModel(provider: AIProvider): string {
  switch (provider) {
    case "openai":
      return "openai/gpt-4.1";
    case "anthropic":
      return "anthropic/claude-sonnet-4-6";
    default:
      return "openai/gpt-4.1";
  }
}

// ── Core Generation ──────────────────────────────────────────────────────────

/**
 * Generate AI content through Vercel AI Gateway.
 * Routes to OpenAI or Anthropic based on domain.
 */
export async function generateViaGateway(request: GatewayRequest): Promise<GatewayResponse> {
  const provider = resolveProvider(request.domain, request.provider);
  const model = resolveModel(provider);
  const fullSystem = `${ARIA_SYSTEM_PREAMBLE}\n\n${request.systemPrompt}`;

  const start = Date.now();

  try {
    const result = await generateText({
      model: model as any,
      system: fullSystem,
      prompt: request.userPrompt,
      maxOutputTokens: request.maxOutputTokens ?? 2000,
      temperature: request.temperature ?? 0.3,
    });

    const latencyMs = Date.now() - start;
    const raw = result.text;
    const sanitised = sanitiseOutput(raw);
    const wasSanitised = sanitised !== raw;

    return {
      content: sanitised,
      model,
      provider,
      tokensUsed: (result.usage?.totalTokens) ?? 0,
      finishReason: result.finishReason ?? "stop",
      wasSanitised,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    console.error(`[aria-gateway] ${provider} generation failed (${model}):`, err);

    // If OpenAI fails, try Anthropic as fallback (and vice versa)
    if (provider === "openai") {
      console.warn("[aria-gateway] Falling back to Anthropic...");
      return generateViaGateway({
        ...request,
        provider: "anthropic",
      });
    }

    return {
      content:
        "ARIA was unable to generate content via AI Gateway. " +
        "The provider returned an error. Please retry or contact your administrator.",
      model: "unavailable",
      provider,
      tokensUsed: 0,
      finishReason: "error",
      wasSanitised: false,
      latencyMs,
    };
  }
}

/**
 * Stream AI content through Vercel AI Gateway (for real-time UI).
 */
export function streamViaGateway(request: GatewayRequest) {
  const provider = resolveProvider(request.domain, request.provider);
  const model = resolveModel(provider);
  const fullSystem = `${ARIA_SYSTEM_PREAMBLE}\n\n${request.systemPrompt}`;

  return streamText({
    model: model as any,
    system: fullSystem,
    prompt: request.userPrompt,
    maxOutputTokens: request.maxOutputTokens ?? 2000,
    temperature: request.temperature ?? 0.3,
  });
}

// ── Management Oversight Specific ────────────────────────────────────────────

export interface OversightAnalysisRequest {
  domain: OversightDomain;
  context: string;
  childPseudonym?: string;
  homeId?: string;
  additionalContext?: string;
  crossValidate?: boolean;
}

export interface OversightAnalysisResponse {
  primaryAnalysis: GatewayResponse;
  crossValidation?: GatewayResponse;
  agreement?: "agreed" | "partially_agreed" | "disagreed";
  combinedConfidence: number;
}

/**
 * Run management oversight analysis with optional cross-validation.
 * Primary analysis via OpenAI, cross-validation via Anthropic.
 */
export async function runOversightAnalysis(
  request: OversightAnalysisRequest
): Promise<OversightAnalysisResponse> {
  const systemPrompt = buildOversightSystemPrompt(request.domain);
  const userPrompt = buildOversightUserPrompt(request);

  // Primary analysis (OpenAI for management oversight)
  const primaryAnalysis = await generateViaGateway({
    provider: "openai",
    domain: request.domain,
    systemPrompt,
    userPrompt,
    maxOutputTokens: 2500,
    temperature: 0.2,
  });

  if (!request.crossValidate) {
    return {
      primaryAnalysis,
      combinedConfidence: 0.85,
    };
  }

  // Cross-validation via Anthropic
  const crossValidation = await generateViaGateway({
    provider: "anthropic",
    domain: request.domain,
    systemPrompt: `You are ARIA, cross-validating a management oversight analysis. Review the analysis below and state whether you agree, partially agree, or disagree. Provide a brief rationale.\n\n${systemPrompt}`,
    userPrompt: `ORIGINAL ANALYSIS:\n${primaryAnalysis.content}\n\nORIGINAL CONTEXT:\n${request.context}`,
    maxOutputTokens: 1000,
    temperature: 0.2,
  });

  // Determine agreement
  const cvText = crossValidation.content.toLowerCase();
  let agreement: "agreed" | "partially_agreed" | "disagreed" = "agreed";
  if (cvText.includes("disagree") || cvText.includes("do not agree")) {
    agreement = "disagreed";
  } else if (cvText.includes("partial") || cvText.includes("with reservations") || cvText.includes("mostly agree")) {
    agreement = "partially_agreed";
  }

  const combinedConfidence = agreement === "agreed" ? 0.92 :
    agreement === "partially_agreed" ? 0.75 : 0.55;

  return {
    primaryAnalysis,
    crossValidation,
    agreement,
    combinedConfidence,
  };
}

// ── System Prompts ───────────────────────────────────────────────────────────

function buildOversightSystemPrompt(domain: OversightDomain): string {
  const base = `You are an expert management oversight AI for UK children's residential homes, operating under the Children's Homes (England) Regulations 2015 and the Social Care Common Inspection Framework (SCCIF).

Your output is always labelled "AI suggested draft" — it is never final until a Registered Manager reviews and approves it.

Key principles:
- Evidence-based: cite specific observations, not generalities
- Proportionate: match the response to the level of concern
- Child-centred: always consider impact on the child's experience
- Regulatory-aware: link findings to specific regulations
- Strengths-based: acknowledge good practice alongside areas for development`;

  const domainPrompts: Partial<Record<OversightDomain, string>> = {
    quality_of_care_review: `\n\nDOMAIN: Quality of Care Review (Reg 45)\nFocus on: overall quality of care, staff practice, outcomes for children, therapeutic model adherence, physical environment, health and education.`,
    compliance_audit: `\n\nDOMAIN: Regulatory Compliance Audit\nFocus on: CHR 2015 compliance across all regulations, policy adherence, record-keeping standards, notification obligations, statement of purpose accuracy.`,
    pattern_detection: `\n\nDOMAIN: Pattern Detection & Analysis\nFocus on: cross-child patterns, incident correlations, staffing impact on behaviour, environmental triggers, seasonal/temporal patterns.`,
    ofsted_readiness: `\n\nDOMAIN: Ofsted Readiness Assessment\nFocus on: SCCIF judgement areas (experiences & progress, how well children are helped & protected, effectiveness of leaders & managers), evidence strength, improvement priorities.`,
    staff_practice_quality: `\n\nDOMAIN: Staff Practice Quality\nFocus on: therapeutic model application, recording quality, reflective practice, child voice inclusion, de-escalation approaches, relationship-based practice.`,
    risk_escalation: `\n\nDOMAIN: Risk Escalation Analysis\nFocus on: risk level changes, protective factor assessment, multi-agency response adequacy, safety planning, professional judgement.`,
    record_oversight: `\n\nDOMAIN: Record Quality & Oversight\nFocus on: completeness, child voice, plan linkage, regulatory requirements met, missing evidence, strengths in recording, actions needed.`,
    safeguarding_audit: `\n\nDOMAIN: Safeguarding Audit\nFocus on: threshold decisions, timeliness of referrals, strategy discussions, child protection planning, contextual safeguarding awareness, professional curiosity.`,
  };

  return base + (domainPrompts[domain] ?? "");
}

function buildOversightUserPrompt(request: OversightAnalysisRequest): string {
  const parts: string[] = [];

  if (request.homeId) parts.push(`HOME: ${request.homeId}`);
  if (request.childPseudonym) parts.push(`CHILD REFERENCE: ${request.childPseudonym}`);
  parts.push(`\nCONTEXT FOR ANALYSIS:\n${request.context}`);
  if (request.additionalContext) {
    parts.push(`\nADDITIONAL CONTEXT:\n${request.additionalContext}`);
  }
  parts.push(`\nProvide your analysis in a structured format. Include:
1. Key findings (evidence-based)
2. Strengths identified
3. Areas for development
4. Recommended actions (with priority and timeframe)
5. Regulatory links
6. Confidence level in your assessment`);

  return parts.join("\n");
}

// ── Convenience exports ──────────────────────────────────────────────────────

export { resolveProvider, resolveModel, OPENAI_DOMAINS, ANTHROPIC_DOMAINS };
