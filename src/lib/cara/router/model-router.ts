// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Model Router (CaraModelRouter)
//
// Central decision engine. Routes AI tasks to the correct provider based on:
// task type, risk level, data sensitivity, role permission, cost, speed,
// context size, child-identifiable data presence, and governance requirements.
//
// Safety-first: blocks unsafe routes, enforces redaction, requires approval.
// ══════════════════════════════════════════════════════════════════════════════

import { randomUUID } from "crypto";
import { createHash } from "crypto";
import type {
  CaraTaskRequest,
  CaraRouteDecision,
  CaraTaskResult,
  CaraProviderName,
  CaraRiskLevel,
  CaraDataSensitivity,
  CaraApprovalStatus,
  CaraTokenUsage,
} from "../core/types";
import {
  TASK_DEFAULT_RISK,
  TASK_PROVIDER_PREFERENCE,
  TASKS_REQUIRING_APPROVAL,
  PROVIDER_MAX_SENSITIVITY,
  DEFAULT_COST_LIMITS,
} from "../core/constants";
import {
  CaraRoutingBlockedError,
  CaraSafetyBlockError,
  CaraPermissionDeniedError,
  isRetryableError,
} from "../core/errors";
import { getProvider, getAvailableProviders } from "../providers";
import type { BaseCaraProvider } from "../providers";
import {
  classifyInputSensitivity,
  redactSensitiveData,
  blockUnsafeRouting,
  validateProviderAllowedForSensitivity,
} from "../safety/data-protection";
import { validateRolePermission } from "../rbac/ai-permissions";

// ── CaraModelRouter ───────────────────────────────────────────────────────

export class CaraModelRouter {

  /**
   * Route a task to the optimal provider without executing it.
   * Returns the decision including provider, model, risk assessment.
   */
  async routeTask(input: CaraTaskRequest): Promise<CaraRouteDecision> {
    // 1. Validate role permissions
    validateRolePermission(input.userRole, input.taskType);

    // 2. Classify sensitivity
    const sensitivityLevel = classifyInputSensitivity(
      input.prompt,
      input.taskType,
      { childId: input.childId, staffId: input.staffId },
    );

    // 3. Determine risk level
    const riskLevel = this.determineRiskLevel(input, sensitivityLevel);

    // 4. Determine if redaction is needed
    const requiresRedaction = this.shouldRedact(sensitivityLevel, riskLevel);

    // 5. Determine if approval is needed
    const requiresApproval = this.shouldRequireApproval(input.taskType, riskLevel, sensitivityLevel);

    // 6. Select provider
    const { provider, model, fallbacks, blocked, blockReason } = this.selectProvider(
      input,
      sensitivityLevel,
      riskLevel,
    );

    if (blocked) {
      return {
        provider: provider ?? "openai",
        model: model ?? "none",
        riskLevel,
        sensitivityLevel,
        requiresApproval,
        requiresRedaction,
        redactionApplied: false,
        routingReason: blockReason ?? "Blocked",
        estimatedCost: 0,
        estimatedLatencyMs: 0,
        fallbackProviders: [],
        blocked: true,
        blockReason,
      };
    }

    // 7. Estimate cost
    const providerInstance = getProvider(provider!);
    const estimatedInputTokens = Math.ceil(input.prompt.length / 4);
    const estimatedOutputTokens = input.options?.maxTokens ?? 2000;
    const estimatedCost = providerInstance.estimateCost(estimatedInputTokens, estimatedOutputTokens);

    // 8. Build routing reason
    const routingReason = this.buildRoutingReason(input.taskType, provider!, sensitivityLevel, riskLevel);

    return {
      provider: provider!,
      model: model!,
      riskLevel,
      sensitivityLevel,
      requiresApproval,
      requiresRedaction,
      redactionApplied: false,
      humanApprovalReason: requiresApproval
        ? `Task type '${input.taskType}' at risk level '${riskLevel}' requires human review`
        : undefined,
      routingReason,
      estimatedCost,
      estimatedLatencyMs: this.estimateLatency(provider!),
      fallbackProviders: fallbacks,
      blocked: false,
    };
  }

  /**
   * Execute a task end-to-end: route, redact, call provider, log.
   */
  async executeTask(input: CaraTaskRequest): Promise<CaraTaskResult> {
    const id = input.id ?? randomUUID();
    const startTime = Date.now();

    // Route the task
    const decision = await this.routeTask(input);

    if (decision.blocked) {
      throw new CaraRoutingBlockedError(decision.blockReason ?? "Task routing blocked");
    }

    // Apply redaction if needed
    let processedPrompt = input.prompt;
    let redactionMap: any[] = [];
    let redactionApplied = false;

    if (decision.requiresRedaction) {
      const redactionResult = redactSensitiveData(input.prompt);
      processedPrompt = redactionResult.redactedText;
      redactionMap = redactionResult.redactionMap;
      redactionApplied = redactionResult.sensitiveItemsDetected > 0;
    }

    // Validate provider safety
    blockUnsafeRouting(decision.provider, decision.sensitivityLevel);

    // Get provider and execute
    const provider = getProvider(decision.provider);
    const systemPrompt = this.buildSystemPrompt(input);

    let output = "";
    let tokenUsage: CaraTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let finishReason = "stop";

    try {
      if (input.options?.returnStructured && input.options.structuredSchema) {
        const response = await provider.generateStructured({
          prompt: processedPrompt,
          systemPrompt,
          maxTokens: input.options.maxTokens,
          temperature: input.options.temperature,
          schema: input.options.structuredSchema,
        });
        output = response.text;
        tokenUsage = response.tokenUsage;
        finishReason = response.finishReason;
      } else {
        const response = await provider.generateText({
          prompt: processedPrompt,
          systemPrompt,
          maxTokens: input.options?.maxTokens,
          temperature: input.options?.temperature,
        });
        output = response.text;
        tokenUsage = response.tokenUsage;
        finishReason = response.finishReason;
      }
    } catch (error) {
      // Try fallback providers
      if (isRetryableError(error) && decision.fallbackProviders.length > 0) {
        for (const fallbackName of decision.fallbackProviders) {
          // Verify fallback is safe for this sensitivity
          if (!validateProviderAllowedForSensitivity(fallbackName, decision.sensitivityLevel)) {
            continue;
          }
          try {
            const fallback = getProvider(fallbackName);
            if (!fallback.isAvailable()) continue;

            const response = await fallback.generateText({
              prompt: processedPrompt,
              systemPrompt,
              maxTokens: input.options?.maxTokens,
              temperature: input.options?.temperature,
            });
            output = response.text;
            tokenUsage = response.tokenUsage;
            finishReason = response.finishReason;
            break;
          } catch {
            continue;
          }
        }
        if (!output) throw error;
      } else {
        throw error;
      }
    }

    const latencyMs = Date.now() - startTime;
    const promptHash = hashContent(processedPrompt);
    const outputHash = hashContent(output);
    const estimatedCost = provider.estimateCost(tokenUsage.promptTokens, tokenUsage.completionTokens);

    // Determine approval status
    const approvalStatus: CaraApprovalStatus = decision.requiresApproval
      ? "draft_ai_generated"
      : "approved"; // auto-approved for low-risk tasks

    // Parse structured output if applicable
    let structuredOutput: Record<string, unknown> | undefined;
    if (input.options?.returnStructured) {
      try {
        structuredOutput = JSON.parse(output);
      } catch {
        // Output wasn't valid JSON, leave as text
      }
    }

    return {
      id,
      taskType: input.taskType,
      provider: decision.provider,
      model: decision.model,
      riskLevel: decision.riskLevel,
      sensitivityLevel: decision.sensitivityLevel,
      output,
      structuredOutput,
      approvalStatus,
      requiresApproval: decision.requiresApproval,
      redactionApplied,
      redactionMap,
      tokenUsage,
      estimatedCost,
      latencyMs,
      promptHash,
      outputHash,
      generatedAt: new Date().toISOString(),
      metadata: {
        finishReason,
        safetyFlags: [],
        confidence: this.assessConfidence(decision.riskLevel, finishReason),
        limitations: this.getTaskLimitations(input.taskType),
      },
    };
  }

  /**
   * Explain why a particular routing decision was made.
   */
  explainRouting(decision: CaraRouteDecision): string {
    const lines: string[] = [
      `Provider: ${decision.provider} (model: ${decision.model})`,
      `Risk Level: ${decision.riskLevel}`,
      `Sensitivity: ${decision.sensitivityLevel}`,
      `Reason: ${decision.routingReason}`,
    ];

    if (decision.requiresRedaction) {
      lines.push("Redaction: Required before sending to provider");
    }
    if (decision.requiresApproval) {
      lines.push(`Approval: ${decision.humanApprovalReason}`);
    }
    if (decision.blocked) {
      lines.push(`BLOCKED: ${decision.blockReason}`);
    }
    if (decision.fallbackProviders.length > 0) {
      lines.push(`Fallbacks: ${decision.fallbackProviders.join(" → ")}`);
    }
    lines.push(`Estimated cost: £${decision.estimatedCost.toFixed(4)}`);

    return lines.join("\n");
  }

  // ── Private Methods ─────────────────────────────────────────────────────

  private determineRiskLevel(
    input: CaraTaskRequest,
    sensitivity: CaraDataSensitivity,
  ): CaraRiskLevel {
    let level = TASK_DEFAULT_RISK[input.taskType] ?? "medium";

    // Escalate based on sensitivity
    if (sensitivity === "safeguarding_sensitive" && level !== "critical") {
      level = "high";
    }
    if (sensitivity === "legal_sensitive" && level === "low") {
      level = "medium";
    }

    return level;
  }

  private shouldRedact(
    sensitivity: CaraDataSensitivity,
    _riskLevel: CaraRiskLevel,
  ): boolean {
    // Always redact for sensitive categories unless using enterprise provider
    return [
      "child_sensitive",
      "safeguarding_sensitive",
      "legal_sensitive",
      "health_sensitive",
      "staff_sensitive",
    ].includes(sensitivity);
  }

  private shouldRequireApproval(
    taskType: string,
    riskLevel: CaraRiskLevel,
    sensitivity: CaraDataSensitivity,
  ): boolean {
    if (TASKS_REQUIRING_APPROVAL.includes(taskType as any)) return true;
    if (riskLevel === "critical") return true;
    if (sensitivity === "safeguarding_sensitive") return true;
    if (sensitivity === "legal_sensitive") return true;
    return false;
  }

  private selectProvider(
    input: CaraTaskRequest,
    sensitivity: CaraDataSensitivity,
    _riskLevel: CaraRiskLevel,
  ): {
    provider: CaraProviderName | null;
    model: string | null;
    fallbacks: CaraProviderName[];
    blocked: boolean;
    blockReason?: string;
  } {
    // Check user preferred provider
    if (input.options?.preferredProvider) {
      const pref = input.options.preferredProvider;
      if (validateProviderAllowedForSensitivity(pref, sensitivity)) {
        const provider = getProvider(pref);
        if (provider.isAvailable()) {
          const fallbacks = this.getFallbacks(input.taskType, pref, sensitivity);
          return { provider: pref, model: provider.getDefaultModel(), fallbacks, blocked: false };
        }
      }
    }

    // Use task-specific provider preferences
    const preferences = TASK_PROVIDER_PREFERENCE[input.taskType] ?? ["openai", "anthropic"];

    for (const name of preferences) {
      if (!validateProviderAllowedForSensitivity(name, sensitivity)) continue;
      const provider = getProvider(name);
      if (!provider.isAvailable()) continue;

      const fallbacks = this.getFallbacks(input.taskType, name, sensitivity);
      return { provider: name, model: provider.getDefaultModel(), fallbacks, blocked: false };
    }

    // No valid provider found
    return {
      provider: null,
      model: null,
      fallbacks: [],
      blocked: true,
      blockReason: `No available provider approved for sensitivity '${sensitivity}' and task '${input.taskType}'`,
    };
  }

  private getFallbacks(
    taskType: string,
    primary: CaraProviderName,
    sensitivity: CaraDataSensitivity,
  ): CaraProviderName[] {
    const preferences = TASK_PROVIDER_PREFERENCE[taskType as keyof typeof TASK_PROVIDER_PREFERENCE] ?? [];
    return preferences
      .filter(p => p !== primary)
      .filter(p => validateProviderAllowedForSensitivity(p, sensitivity))
      .filter(p => getProvider(p).isAvailable())
      .slice(0, 2);
  }

  private buildSystemPrompt(input: CaraTaskRequest): string {
    const parts: string[] = [
      "You are Cara, an AI assistant for Cara OS — a UK children's residential care platform.",
      "You support social care professionals in their work with looked-after children.",
      "Always be professional, warm, evidence-informed, and child-centred.",
      "Never fabricate evidence. Always distinguish between evidence, inference, and recommendation.",
      "Flag any uncertainty. Recommend escalation for safeguarding concerns.",
      "",
    ];

    if (input.systemPrompt) {
      parts.push(input.systemPrompt);
    }

    // Add task-specific guidance
    const taskGuidance = TASK_SYSTEM_GUIDANCE[input.taskType];
    if (taskGuidance) {
      parts.push(taskGuidance);
    }

    return parts.join("\n");
  }

  private buildRoutingReason(
    taskType: string,
    provider: CaraProviderName,
    sensitivity: CaraDataSensitivity,
    riskLevel: CaraRiskLevel,
  ): string {
    return `Task '${taskType}' routed to '${provider}' | ` +
      `Sensitivity: ${sensitivity} | Risk: ${riskLevel} | ` +
      `Provider approved for this sensitivity level`;
  }

  private estimateLatency(provider: CaraProviderName): number {
    const estimates: Partial<Record<CaraProviderName, number>> = {
      openai: 2000,
      anthropic: 3000,
      azure_openai: 2500,
      mistral: 1500,
      perplexity: 3000,
      cohere: 2000,
      voyage: 500,
    };
    return estimates[provider] ?? 3000;
  }

  private assessConfidence(
    riskLevel: CaraRiskLevel,
    finishReason: string,
  ): "high" | "medium" | "low" {
    if (finishReason === "length") return "low"; // output was truncated
    if (riskLevel === "critical") return "low"; // AI shouldn't be confident on critical matters
    if (riskLevel === "high") return "medium";
    return "high";
  }

  private getTaskLimitations(taskType: string): string[] {
    const limitations: string[] = [
      "AI-generated draft — requires human review before use",
      "Based on information provided — may not reflect full picture",
    ];

    if (taskType.includes("safeguarding")) {
      limitations.push("AI must not make safeguarding decisions — professional judgement required");
    }
    if (taskType.includes("risk")) {
      limitations.push("Risk assessment requires professional assessment — AI provides indicators only");
    }

    return limitations;
  }
}

// ── Task System Guidance ──────────────────────────────────────────────────

const TASK_SYSTEM_GUIDANCE: Partial<Record<string, string>> = {
  safeguarding_analysis:
    "CRITICAL: You are assisting with safeguarding analysis. You MUST NOT make final decisions. " +
    "Present evidence, identify patterns, flag concerns, and recommend actions. " +
    "Always recommend professional judgement and multi-agency discussion.",
  reg45_report:
    "You are helping draft a Regulation 45 report for Ofsted. Use clear, professional language. " +
    "Structure around the quality standards. Reference specific evidence. " +
    "This is a DRAFT that requires Registered Manager review and sign-off.",
  keywork_session_plan:
    "Create a warm, child-centred session plan. Consider the child's age, interests, " +
    "and communication style. Include therapeutic elements where appropriate. " +
    "Make activities engaging and purposeful.",
  staff_supervision_reflection:
    "Support reflective supervision. Use open questions. Encourage professional curiosity. " +
    "Help staff explore their practice, emotional responses, and development needs.",
  behaviour_pattern_analysis:
    "Analyse behaviour patterns objectively. Avoid labelling the child. " +
    "Consider antecedents, functions of behaviour, and unmet needs. " +
    "Recommend trauma-informed responses.",
  quality_assurance_review:
    "Review recording quality against good practice standards. " +
    "Check for: voice of the child, professional analysis, links to care plan, " +
    "management oversight, and evidence of follow-through.",
};

// ── Helpers ───────────────────────────────────────────────────────────────

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}
