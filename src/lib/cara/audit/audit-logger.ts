// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Audit Logger
//
// Every AI action is logged. Never stores raw prompts containing sensitive
// child information unless explicitly configured and encrypted.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraAuditLogEntry,
  CaraTaskRequest,
  CaraTaskResult,
  CaraRouteDecision,
  CaraSafetyEvent,
  CaraSafetyEventType,
  CaraRiskLevel,
} from "../core/types";

// ── CaraAuditLogger ───────────────────────────────────────────────────────

export class CaraAuditLogger {
  private logs: CaraAuditLogEntry[] = [];
  private safetyEvents: CaraSafetyEvent[] = [];

  /**
   * Log a completed AI task execution.
   */
  logTaskExecution(
    request: CaraTaskRequest,
    result: CaraTaskResult,
  ): CaraAuditLogEntry {
    const entry: CaraAuditLogEntry = {
      id: result.id,
      userId: request.userId,
      organisationId: request.organisationId,
      homeId: request.homeId,
      childId: request.childId,
      staffId: request.staffId,
      taskType: request.taskType,
      provider: result.provider,
      model: result.model,
      riskLevel: result.riskLevel,
      sensitivityLevel: result.sensitivityLevel,
      redactionApplied: result.redactionApplied,
      approvalRequired: result.requiresApproval,
      promptHash: result.promptHash,
      outputHash: result.outputHash,
      tokenUsage: result.tokenUsage,
      estimatedCost: result.estimatedCost,
      latencyMs: result.latencyMs,
      status: "success",
      createdAt: result.generatedAt,
    };

    this.logs.push(entry);
    return entry;
  }

  /**
   * Log a failed AI task execution.
   */
  logTaskFailure(
    request: CaraTaskRequest,
    decision: CaraRouteDecision,
    error: Error,
    latencyMs: number,
  ): CaraAuditLogEntry {
    const entry: CaraAuditLogEntry = {
      id: crypto.randomUUID(),
      userId: request.userId,
      organisationId: request.organisationId,
      homeId: request.homeId,
      childId: request.childId,
      staffId: request.staffId,
      taskType: request.taskType,
      provider: decision.provider,
      model: decision.model,
      riskLevel: decision.riskLevel,
      sensitivityLevel: decision.sensitivityLevel,
      redactionApplied: decision.redactionApplied,
      approvalRequired: decision.requiresApproval,
      promptHash: "",
      outputHash: "",
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      estimatedCost: 0,
      latencyMs,
      status: this.classifyErrorStatus(error),
      errorCode: error.constructor.name,
      createdAt: new Date().toISOString(),
    };

    this.logs.push(entry);
    return entry;
  }

  /**
   * Log a blocked routing attempt.
   */
  logBlockedRoute(
    request: CaraTaskRequest,
    decision: CaraRouteDecision,
  ): CaraAuditLogEntry {
    const entry: CaraAuditLogEntry = {
      id: crypto.randomUUID(),
      userId: request.userId,
      organisationId: request.organisationId,
      homeId: request.homeId,
      childId: request.childId,
      staffId: request.staffId,
      taskType: request.taskType,
      provider: decision.provider,
      model: decision.model,
      riskLevel: decision.riskLevel,
      sensitivityLevel: decision.sensitivityLevel,
      redactionApplied: false,
      approvalRequired: false,
      promptHash: "",
      outputHash: "",
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      estimatedCost: 0,
      latencyMs: 0,
      status: "blocked",
      errorCode: decision.blockReason,
      createdAt: new Date().toISOString(),
    };

    this.logs.push(entry);
    return entry;
  }

  /**
   * Log a safety event (redaction failure, permission denial, etc).
   */
  logSafetyEvent(
    type: CaraSafetyEventType,
    severity: CaraRiskLevel,
    description: string,
    context: {
      userId: string;
      organisationId: string;
      homeId?: string;
      childId?: string;
      taskType: string;
      provider?: string;
      blocked: boolean;
    },
  ): CaraSafetyEvent {
    const event: CaraSafetyEvent = {
      id: crypto.randomUUID(),
      type,
      severity,
      description,
      userId: context.userId,
      organisationId: context.organisationId,
      homeId: context.homeId,
      childId: context.childId,
      taskType: context.taskType as any,
      provider: context.provider as any,
      blocked: context.blocked,
      createdAt: new Date().toISOString(),
    };

    this.safetyEvents.push(event);
    return event;
  }

  /**
   * Get audit logs, optionally filtered.
   */
  getAuditLogs(filters?: {
    organisationId?: string;
    homeId?: string;
    userId?: string;
    taskType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): CaraAuditLogEntry[] {
    let results = [...this.logs];

    if (filters?.organisationId) {
      results = results.filter(l => l.organisationId === filters.organisationId);
    }
    if (filters?.homeId) {
      results = results.filter(l => l.homeId === filters.homeId);
    }
    if (filters?.userId) {
      results = results.filter(l => l.userId === filters.userId);
    }
    if (filters?.taskType) {
      results = results.filter(l => l.taskType === filters.taskType);
    }
    if (filters?.dateFrom) {
      results = results.filter(l => l.createdAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      results = results.filter(l => l.createdAt <= filters.dateTo!);
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return results.slice(0, filters?.limit ?? 100);
  }

  /**
   * Get safety events.
   */
  getSafetyEvents(organisationId?: string): CaraSafetyEvent[] {
    let results = [...this.safetyEvents];
    if (organisationId) {
      results = results.filter(e => e.organisationId === organisationId);
    }
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private classifyErrorStatus(error: Error): "failed" | "blocked" | "timeout" | "rate_limited" {
    if (error.constructor.name === "CaraRoutingBlockedError") return "blocked";
    if (error.constructor.name === "CaraSafetyBlockError") return "blocked";
    if (error.constructor.name === "CaraTimeoutError") return "timeout";
    if (error.constructor.name === "CaraRateLimitError") return "rate_limited";
    return "failed";
  }
}

// Singleton for application-wide use
export const caraAuditLogger = new CaraAuditLogger();
