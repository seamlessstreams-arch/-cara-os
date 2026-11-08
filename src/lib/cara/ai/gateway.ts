// ══════════════════════════════════════════════════════════════════════════════
// Cara OVERSIGHT GATEWAY — governed delegation
//
// Oversight-intelligence adapter for the management-oversight domains (quality of
// care review, pattern detection, compliance audit, Ofsted readiness, risk
// escalation, governance verification, operational intelligence, daily analysis,
// therapeutic support, record oversight, safeguarding audit).
//
// This module does NOT call a model directly. Every request is delegated to the
// single governed chokepoint — invokeAiGateway (src/lib/cara/ai-gateway/
// ai-gateway.ts) — so it inherits sensitivity classification, PII redaction, the
// provider risk register, the prompt-injection guard, the response scanner and the
// audit trail. Safeguarding-sensitive content is answered deterministically rather
// than sent to a model. The request/response shape is preserved so the oversight
// route is unchanged. (Previously this file used the Vercel AI SDK's generateText/
// streamText, which reached a model with none of those controls — see decision D5.)
// ══════════════════════════════════════════════════════════════════════════════

import { invokeAiGateway } from "@/lib/cara/ai-gateway/ai-gateway";
import { CARA_SYSTEM_PREAMBLE } from "./safety";

// ── Types ────────────────────────────────────────────────────────────────────

export type AIProvider = "anthropic";

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
  | "cara_output_validation"
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
  /** Optional audit context — threaded into the governed gateway's audit trail
   *  so an oversight AI call is traceable to the home and the child it concerns
   *  (non-negotiable #5). The childPseudonym is a pseudonym, never a real id. */
  homeId?: string;
  childPseudonym?: string;
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

// Every oversight domain runs on Claude (Anthropic). Kept as a single list
// so callers that enumerate valid domains keep working.
export const ALL_OVERSIGHT_DOMAINS: OversightDomain[] = [
  "quality_of_care_review", "compliance_audit", "pattern_detection", "ofsted_readiness",
  "staff_practice_quality", "governance_verification", "outcome_tracking", "risk_escalation",
  "financial_oversight", "safeguarding_audit", "cara_output_validation", "regulatory_interpretation",
  "record_oversight", "operational_intelligence", "therapeutic_support", "daily_analysis",
];

function resolveProvider(domain: OversightDomain, explicit?: AIProvider): AIProvider {
  // Every oversight domain runs on Claude (Anthropic) — the only AI provider —
  // regardless of domain or any explicit request. (Params retained for
  // signature compatibility.)
  void domain;
  void explicit;
  return "anthropic";
}

function resolveModel(provider: AIProvider): string {
  // Claude is the only gateway model.
  void provider;
  return "anthropic/claude-sonnet-4-6";
}

// ── Core Generation (governed) ───────────────────────────────────────────────

/**
 * Generate oversight content through the GOVERNED AI gateway. Runs on Claude
 * (Anthropic), the only AI provider — redacted, classified, provider-risk-checked,
 * injection-guarded, response-scanned and audited.
 *
 * When the governed gateway refuses — no API key, data classified
 * safeguarding-sensitive (must not leave the building), budget spent, or a safety
 * step failing closed — the content degrades to an explicit, non-silent
 * "AI second-pass unavailable" message. It never silently returns empty, and never
 * sends ungoverned child data to a model.
 */
export async function generateViaGateway(request: GatewayRequest): Promise<GatewayResponse> {
  const provider = resolveProvider(request.domain, request.provider);
  const start = Date.now();

  const result = await invokeAiGateway({
    purpose: `Management oversight — ${request.domain}`,
    feature: "oversight_intelligence",
    // The oversight framing preamble is preserved. The governed gateway redacts
    // the userPrompt (never the system prompt) before anything leaves the building.
    systemPrompt: `${CARA_SYSTEM_PREAMBLE}\n\n${request.systemPrompt}`,
    userPrompt: request.userPrompt,
    taskType: "management_oversight",
    temperature: request.temperature ?? 0.3,
    maxOutputTokens: request.maxOutputTokens ?? 2000,
    expectJson: request.jsonMode ?? false,
    identity: {
      homeId: request.homeId,
      // Pseudonym only — real identifiers are redacted by the gateway; this links
      // the audit entry to the child the oversight concerns (non-negotiable #5).
      childId: request.childPseudonym,
    },
  });

  const latencyMs = Date.now() - start;
  const refused = result.method === "refused" || !result.llmUsed;

  const content = refused
    ? `AI second-pass unavailable — deterministic checks only.${result.refusedReason ? ` (${result.refusedReason})` : ""}`
    : result.output;

  return {
    content,
    model: result.model ?? "unavailable",
    provider,
    tokensUsed: (result.tokensInput ?? 0) + (result.tokensOutput ?? 0),
    finishReason: refused ? "refused" : "stop",
    // The governed response scanner withheld/cut the output when this is true.
    wasSanitised: result.responseBlocked === true,
    latencyMs,
  };
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
 * Both the primary analysis and cross-validation run on Anthropic (Claude),
 * the only AI provider.
 */
export async function runOversightAnalysis(
  request: OversightAnalysisRequest
): Promise<OversightAnalysisResponse> {
  const systemPrompt = buildOversightSystemPrompt(request.domain);
  const userPrompt = buildOversightUserPrompt(request);

  // Primary analysis — governed (Anthropic / Claude)
  const primaryAnalysis = await generateViaGateway({
    provider: "anthropic",
    domain: request.domain,
    systemPrompt,
    userPrompt,
    homeId: request.homeId,
    childPseudonym: request.childPseudonym,
    maxOutputTokens: 2500,
    temperature: 0.2,
  });

  // If the governed gateway refused (e.g. safeguarding-sensitive data must not
  // leave the building, or no key is configured), there is no analysis to
  // cross-validate. Return honestly with zero confidence rather than cross-
  // checking a non-answer.
  if (primaryAnalysis.finishReason === "refused") {
    return { primaryAnalysis, combinedConfidence: 0 };
  }

  if (!request.crossValidate) {
    return {
      primaryAnalysis,
      combinedConfidence: 0.85,
    };
  }

  // Cross-validation — governed (Anthropic / Claude)
  const crossValidation = await generateViaGateway({
    provider: "anthropic",
    domain: request.domain,
    systemPrompt: `You are Cara, cross-validating a management oversight analysis. Review the analysis below and state whether you agree, partially agree, or disagree. Provide a brief rationale.\n\n${systemPrompt}`,
    userPrompt: `ORIGINAL ANALYSIS:\n${primaryAnalysis.content}\n\nORIGINAL CONTEXT:\n${request.context}`,
    homeId: request.homeId,
    childPseudonym: request.childPseudonym,
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

export { resolveProvider, resolveModel };
