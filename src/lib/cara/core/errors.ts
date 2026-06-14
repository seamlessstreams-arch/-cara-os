// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Error Types
// ══════════════════════════════════════════════════════════════════════════════

export class CaraError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly safe: boolean;  // safe to expose to client

  constructor(message: string, code: string, statusCode: number = 500, safe: boolean = false) {
    super(message);
    this.name = "CaraError";
    this.code = code;
    this.statusCode = statusCode;
    this.safe = safe;
  }
}

export class CaraProviderError extends CaraError {
  public readonly provider: string;
  public readonly retryable: boolean;

  constructor(message: string, provider: string, retryable: boolean = false) {
    super(message, "PROVIDER_ERROR", 502, false);
    this.name = "CaraProviderError";
    this.provider = provider;
    this.retryable = retryable;
  }
}

export class CaraRoutingBlockedError extends CaraError {
  constructor(reason: string) {
    super(reason, "ROUTING_BLOCKED", 403, true);
    this.name = "CaraRoutingBlockedError";
  }
}

export class CaraPermissionDeniedError extends CaraError {
  constructor(role: string, action: string) {
    super(`Role '${role}' not permitted to: ${action}`, "PERMISSION_DENIED", 403, true);
    this.name = "CaraPermissionDeniedError";
  }
}

export class CaraApprovalRequiredError extends CaraError {
  constructor(taskType: string) {
    super(`Task '${taskType}' requires human approval before finalisation`, "APPROVAL_REQUIRED", 200, true);
    this.name = "CaraApprovalRequiredError";
  }
}

export class CaraCostLimitError extends CaraError {
  constructor(limit: string, current: number, max: number) {
    super(`Cost limit exceeded: ${limit} (${current.toFixed(4)} / ${max.toFixed(4)} GBP)`, "COST_LIMIT", 429, true);
    this.name = "CaraCostLimitError";
  }
}

export class CaraRedactionError extends CaraError {
  constructor(message: string) {
    super(message, "REDACTION_ERROR", 500, false);
    this.name = "CaraRedactionError";
  }
}

export class CaraSafetyBlockError extends CaraError {
  constructor(reason: string) {
    super(reason, "SAFETY_BLOCK", 403, true);
    this.name = "CaraSafetyBlockError";
  }
}

export class CaraTimeoutError extends CaraError {
  public readonly provider: string;

  constructor(provider: string, timeoutMs: number) {
    super(`Provider '${provider}' timed out after ${timeoutMs}ms`, "TIMEOUT", 504, true);
    this.name = "CaraTimeoutError";
    this.provider = provider;
  }
}

export class CaraRateLimitError extends CaraError {
  public readonly provider: string;
  public readonly retryAfterMs?: number;

  constructor(provider: string, retryAfterMs?: number) {
    super(`Provider '${provider}' rate limited`, "RATE_LIMITED", 429, true);
    this.name = "CaraRateLimitError";
    this.provider = provider;
    this.retryAfterMs = retryAfterMs;
  }
}

// ── Error Helpers ─────────────────────────────────────────────────────────

export function isRetryableError(error: unknown): boolean {
  if (error instanceof CaraProviderError) return error.retryable;
  if (error instanceof CaraTimeoutError) return true;
  if (error instanceof CaraRateLimitError) return true;
  return false;
}

export function sanitiseErrorForClient(error: unknown): { message: string; code: string } {
  if (error instanceof CaraError && error.safe) {
    return { message: error.message, code: error.code };
  }
  return {
    message: "An internal error occurred. Please try again or contact support.",
    code: "INTERNAL_ERROR",
  };
}
