// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Cost Control Service
//
// Estimates costs, tracks usage, enforces limits, selects cost-efficient
// models for low-risk tasks, and prevents overspend.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraProviderName,
  CaraModelId,
  CaraRiskLevel,
  CaraTaskType,
  CaraCostEstimate,
  CaraCostUsage,
} from "../core/types";
import { DEFAULT_COST_LIMITS, PROVIDER_COST_PER_1K } from "../core/constants";
import { CaraCostLimitError } from "../core/errors";
import { getProvider } from "../providers";

// ── CaraCostControlService ────────────────────────────────────────────────

export class CaraCostControlService {
  private usageLog: CaraCostUsage[] = [];
  private limits = { ...DEFAULT_COST_LIMITS };

  /**
   * Estimate cost before executing a request.
   */
  estimateCost(
    provider: CaraProviderName,
    model: CaraModelId,
    estimatedInputTokens: number,
    estimatedOutputTokens: number,
    context: { organisationId: string; homeId?: string; userId?: string },
  ): CaraCostEstimate {
    const providerInstance = getProvider(provider);
    const estimatedCostGBP = providerInstance.estimateCost(estimatedInputTokens, estimatedOutputTokens, model);

    const dailySpend = this.getDailySpend(context.organisationId, context.homeId, context.userId);
    const monthlySpend = this.getMonthlySpend(context.organisationId);

    const dailyLimit = context.homeId
      ? this.limits.dailyPerHome
      : context.userId
        ? this.limits.dailyPerUser
        : this.limits.dailyPerOrganisation;

    const withinBudget = estimatedCostGBP <= this.limits.perRequestMax &&
      (dailySpend + estimatedCostGBP) <= dailyLimit &&
      (monthlySpend + estimatedCostGBP) <= this.limits.monthlyPerOrganisation;

    return {
      provider,
      model,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCostGBP,
      withinBudget,
      dailySpendRemaining: Math.max(0, dailyLimit - dailySpend),
      monthlySpendRemaining: Math.max(0, this.limits.monthlyPerOrganisation - monthlySpend),
    };
  }

  /**
   * Enforce cost limits. Throws CaraCostLimitError if over budget.
   */
  enforceLimits(
    estimatedCostGBP: number,
    context: { organisationId: string; homeId?: string; userId?: string },
  ): void {
    // Per-request limit
    if (estimatedCostGBP > this.limits.perRequestMax) {
      throw new CaraCostLimitError(
        "per-request",
        estimatedCostGBP,
        this.limits.perRequestMax,
      );
    }

    // Daily per-user limit
    if (context.userId) {
      const userDaily = this.getDailySpend(context.organisationId, undefined, context.userId);
      if (userDaily + estimatedCostGBP > this.limits.dailyPerUser) {
        throw new CaraCostLimitError("daily-per-user", userDaily + estimatedCostGBP, this.limits.dailyPerUser);
      }
    }

    // Daily per-home limit
    if (context.homeId) {
      const homeDaily = this.getDailySpend(context.organisationId, context.homeId);
      if (homeDaily + estimatedCostGBP > this.limits.dailyPerHome) {
        throw new CaraCostLimitError("daily-per-home", homeDaily + estimatedCostGBP, this.limits.dailyPerHome);
      }
    }

    // Daily org limit
    const orgDaily = this.getDailySpend(context.organisationId);
    if (orgDaily + estimatedCostGBP > this.limits.dailyPerOrganisation) {
      throw new CaraCostLimitError("daily-per-organisation", orgDaily + estimatedCostGBP, this.limits.dailyPerOrganisation);
    }

    // Monthly org limit
    const orgMonthly = this.getMonthlySpend(context.organisationId);
    if (orgMonthly + estimatedCostGBP > this.limits.monthlyPerOrganisation) {
      throw new CaraCostLimitError("monthly-per-organisation", orgMonthly + estimatedCostGBP, this.limits.monthlyPerOrganisation);
    }
  }

  /**
   * Record usage after a successful request.
   */
  recordUsage(usage: CaraCostUsage): void {
    this.usageLog.push(usage);
  }

  /**
   * Select a cost-efficient model based on risk level.
   * Low-risk tasks can use cheaper models.
   */
  selectCostEfficientModel(
    provider: CaraProviderName,
    riskLevel: CaraRiskLevel,
    taskType: CaraTaskType,
  ): CaraModelId {
    const providerInstance = getProvider(provider);
    const models = providerInstance.getAvailableModels();

    // For low-risk simple tasks, prefer cheaper models
    if (riskLevel === "low" && isSimpleTask(taskType)) {
      // Return the smallest/cheapest available model
      const cheapModels: Record<string, string> = {
        openai: "gpt-4o-mini",
        anthropic: "claude-haiku-3",
        mistral: "mistral-small-latest",
        vertex_ai: "gemini-1.5-flash",
      };
      const cheap = cheapModels[provider];
      if (cheap && models.includes(cheap)) return cheap;
    }

    return providerInstance.getDefaultModel();
  }

  /**
   * Get cost usage summary for reporting.
   */
  getUsageSummary(
    organisationId: string,
    period: "day" | "week" | "month",
  ): {
    totalCost: number;
    requestCount: number;
    byProvider: Record<string, { cost: number; requests: number }>;
    byTaskType: Record<string, { cost: number; requests: number }>;
  } {
    const cutoff = this.getPeriodCutoff(period);
    const filtered = this.usageLog.filter(
      u => u.organisationId === organisationId && u.date >= cutoff,
    );

    const totalCost = filtered.reduce((sum, u) => sum + u.costGBP, 0);
    const requestCount = filtered.length;

    const byProvider: Record<string, { cost: number; requests: number }> = {};
    const byTaskType: Record<string, { cost: number; requests: number }> = {};

    for (const entry of filtered) {
      if (!byProvider[entry.provider]) byProvider[entry.provider] = { cost: 0, requests: 0 };
      byProvider[entry.provider].cost += entry.costGBP;
      byProvider[entry.provider].requests += 1;
    }

    return { totalCost, requestCount, byProvider, byTaskType };
  }

  /**
   * Update cost limits (admin only).
   */
  updateLimits(newLimits: Partial<typeof DEFAULT_COST_LIMITS>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * Get current limits.
   */
  getLimits() {
    return { ...this.limits };
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private getDailySpend(organisationId: string, homeId?: string, userId?: string): number {
    const today = new Date().toISOString().split("T")[0];
    return this.usageLog
      .filter(u => {
        if (u.organisationId !== organisationId) return false;
        if (!u.date.startsWith(today)) return false;
        if (homeId && u.homeId !== homeId) return false;
        if (userId && u.userId !== userId) return false;
        return true;
      })
      .reduce((sum, u) => sum + u.costGBP, 0);
  }

  private getMonthlySpend(organisationId: string): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return this.usageLog
      .filter(u => u.organisationId === organisationId && u.date >= monthStart)
      .reduce((sum, u) => sum + u.costGBP, 0);
  }

  private getPeriodCutoff(period: "day" | "week" | "month"): string {
    const now = new Date();
    switch (period) {
      case "day":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "month":
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function isSimpleTask(taskType: CaraTaskType): boolean {
  return [
    "admin_summary",
    "email_draft",
    "daily_task_generation",
    "form_prompt_support",
    "document_classification",
    "policy_search",
  ].includes(taskType);
}

// Singleton
export const caraCostControl = new CaraCostControlService();
