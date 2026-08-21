// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATION ENGINE
// Deterministic trigger-action engine. Evaluates rules against trigger data,
// checks conditions, and returns an AutomationRun describing what WOULD
// happen — without side-effects. The caller decides whether to execute.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  AutomationTrigger,
  AutomationRule,
  AutomationCondition,
  AutomationActionConfig,
  AutomationRun,
  AutomationAction,
} from "./types";
import { DEFAULT_RULES } from "./default-rules";

// ── Custom rule storage (in-memory for now) ─────────────────────────────────

let customRules: AutomationRule[] = [];

export function addCustomRule(rule: AutomationRule): void {
  customRules.push(rule);
}

export function removeCustomRule(ruleId: string): void {
  customRules = customRules.filter((r) => r.id !== ruleId);
}

// ── Rule retrieval ──────────────────────────────────────────────────────────

/**
 * Returns ALL rules — built-in defaults merged with any custom rules.
 * Sorted by priority (lower number = higher priority).
 */
export function getAllRules(): AutomationRule[] {
  return [...DEFAULT_RULES, ...customRules].sort((a, b) => a.priority - b.priority);
}

/**
 * Returns only the enabled rules whose trigger matches the given trigger.
 */
export function getApplicableRules(trigger: AutomationTrigger): AutomationRule[] {
  return getAllRules().filter((r) => r.enabled && r.trigger === trigger);
}

// ── Condition evaluation ────────────────────────────────────────────────────

function resolveValue(raw: any): any {
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean" || raw == null) {
    return raw;
  }
  return String(raw);
}

function evaluateCondition(condition: AutomationCondition, data: Record<string, any>): boolean {
  const fieldValue = resolveValue(data[condition.field]);
  const targetValue = resolveValue(condition.value);

  switch (condition.operator) {
    case "equals":
      return fieldValue === targetValue;
    case "not_equals":
      return fieldValue !== targetValue;
    case "contains":
      return typeof fieldValue === "string" && typeof targetValue === "string"
        ? fieldValue.toLowerCase().includes(targetValue.toLowerCase())
        : false;
    case "greater_than":
      return typeof fieldValue === "number" && typeof targetValue === "number"
        ? fieldValue > targetValue
        : false;
    case "less_than":
      return typeof fieldValue === "number" && typeof targetValue === "number"
        ? fieldValue < targetValue
        : false;
    case "is_empty":
      return fieldValue == null || fieldValue === "" || (Array.isArray(fieldValue) && fieldValue.length === 0);
    case "is_not_empty":
      return fieldValue != null && fieldValue !== "" && !(Array.isArray(fieldValue) && fieldValue.length === 0);
    default:
      return false;
  }
}

function evaluateConditions(conditions: AutomationCondition[] | undefined, data: Record<string, any>): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(c, data));
}

// ── Template interpolation ──────────────────────────────────────────────────

function interpolateParams(params: Record<string, any>, data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
        return data[varName] !== undefined ? String(data[varName]) : `{{${varName}}}`;
      });
    } else if (Array.isArray(value)) {
      result[key] = value;
    } else if (typeof value === "object" && value !== null) {
      result[key] = interpolateParams(value, data);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ── Action simulation ───────────────────────────────────────────────────────

function simulateAction(
  actionConfig: AutomationActionConfig,
  data: Record<string, any>,
): { action: AutomationAction; success: boolean; result?: any; error?: string } {
  try {
    const resolvedParams = interpolateParams(actionConfig.params, data);
    return {
      action: actionConfig.action,
      success: true,
      result: { resolved_params: resolvedParams },
    };
  } catch (err) {
    return {
      action: actionConfig.action,
      success: false,
      error: err instanceof Error ? err.message : "Unknown error during action simulation",
    };
  }
}

// ── Main evaluation ─────────────────────────────────────────────────────────

let runCounter = 0;

/**
 * Evaluate all applicable rules for a given trigger and data payload.
 * Returns an AutomationRun for EACH matching rule, describing the actions
 * that would be executed. This is deterministic and side-effect-free.
 *
 * When an explicit `rules` array is supplied it is used instead of the
 * default + custom rule set — useful for testing or previewing a single rule.
 */
export function evaluateRules(
  trigger: AutomationTrigger,
  triggerData: Record<string, any>,
  rules?: AutomationRule[],
): AutomationRun[] {
  const applicableRules = rules
    ? rules.filter((r) => r.enabled && r.trigger === trigger)
    : getApplicableRules(trigger);

  const runs: AutomationRun[] = [];

  for (const rule of applicableRules) {
    const ruleStart = performance.now();

    // Check conditions
    if (!evaluateConditions(rule.conditions, triggerData)) {
      continue;
    }

    // Simulate all actions
    const actionsExecuted = rule.actions.map((a) => simulateAction(a, triggerData));
    const allSucceeded = actionsExecuted.every((a) => a.success);
    const anySucceeded = actionsExecuted.some((a) => a.success);

    const run: AutomationRun = {
      id: `run_${Date.now()}_${++runCounter}`,
      rule_id: rule.id,
      trigger,
      trigger_data: triggerData,
      actions_executed: actionsExecuted,
      status: allSucceeded ? "success" : anySucceeded ? "partial" : "failed",
      duration_ms: Math.round(performance.now() - ruleStart),
      created_at: new Date().toISOString(),
    };

    runs.push(run);
  }

  return runs;
}
