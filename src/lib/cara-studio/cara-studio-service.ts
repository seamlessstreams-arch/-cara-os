// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — SERVICE LAYER  (server-only)
//
// The shared pipeline every /api/cara route runs:
//   authenticate → validate (route) → build context → generate → Zod-validate
//   → guardrails → merge §23 review → SAVE output → LOG ai run + guardrail
//   events → return.
//
// Critical/high guardrail hits are saved but BLOCKED from the response body —
// the staff member sees a manager-review notice instead of the content.
// ══════════════════════════════════════════════════════════════════════════════

import "server-only";
import type { z } from "zod";
import { db, getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { buildChildContext, type CaraChildContext } from "./cara-context-builder";
import { runCaraGuardrails } from "./cara-guardrails";
import type {
  CaraModule, CaraSavedOutput, CaraGuardrailResult, GuardrailSeverity,
} from "./cara-types";
import type { ManagerReviewDecision } from "./cara-guardrails";

export interface CaraActor {
  userId: string;
  role: string;
}

export function actorFromHeaders(headers: Headers): CaraActor {
  return {
    userId: headers.get("x-user-id") ?? "staff_darren",
    role: headers.get("x-user-role") ?? "residential_support_worker",
  };
}

const APPROVER_ROLES = new Set(["registered_manager", "responsible_individual", "deputy_manager"]);
export function canApprove(actor: CaraActor): boolean {
  return APPROVER_ROLES.has(actor.role);
}

export function loadContext(childId: string | null, theme: string): CaraChildContext {
  const store = getStore();
  const child = childId ? db.youngPeople.findById(childId) ?? null : null;
  const profile = childId ? db.caraLearningProfiles.findByChild(childId) ?? null : null;
  const incidents = childId
    ? db.incidents
        .findAll()
        .filter((i) => i.child_id === childId)
        .sort((a, b) => (b.date > a.date ? 1 : -1))
        .slice(0, 3)
        .map((i) => ({ date: i.date, type: String(i.type), severity: String(i.severity), description: i.description }))
    : [];
  const keywork = childId
    ? (store.keyWorkingSessions ?? [])
        .filter((k) => (k as { child_id?: string }).child_id === childId)
        .slice(-5)
        .map((k) => {
          const r = k as { topic?: string; theme?: string; title?: string };
          return r.topic || r.theme || r.title || "";
        })
        .filter(Boolean)
    : [];
  return buildChildContext({
    child: child
      ? { id: child.id, first_name: child.first_name, preferred_name: child.preferred_name, date_of_birth: child.date_of_birth }
      : null,
    profile,
    recentIncidents: incidents,
    keyworkThemes: [...new Set(keywork)] as string[],
    approvedResources: db.caraLibraryResources.findApproved(),
    theme,
    today: new Date().toISOString().slice(0, 10),
  });
}

export interface PersistParams<T> {
  module: CaraModule;
  promptType: string;
  actor: CaraActor;
  childId: string | null;
  title: string;
  inputSummary: string;
  schema: z.ZodType<T>;
  output: T & { managerReviewNeeded: boolean };
  review: ManagerReviewDecision;
  llmUsed?: boolean;
  modelUsed?: string;
}

export interface PersistResult<T> {
  saved: CaraSavedOutput<T>;
  guardrails: CaraGuardrailResult;
  blocked: boolean;
}

export function persistCaraOutput<T>(params: PersistParams<T>): PersistResult<T> {
  // 1. Zod validation — generators are typed, but this is the contract gate
  //    (and the gate for future LLM-enriched outputs).
  const parsed = params.schema.safeParse(params.output);
  if (!parsed.success) {
    throw new Error(`Cara output failed ${params.module} schema validation: ${parsed.error.issues[0]?.message ?? "unknown"}`);
  }

  // 2. Guardrails over the validated output.
  const guardrails = runCaraGuardrails(parsed.data);
  const blocked = guardrails.action === "block_pending_review";

  // 3. Merge §23 review with guardrail outcome — either source can require it.
  const reviewRequired = params.review.required || params.output.managerReviewNeeded || guardrails.action !== "allow";
  const reasons = [
    ...params.review.reasons,
    ...guardrails.flags.map((f) => `Guardrail: ${f.risk_type} (${f.severity})`),
  ];

  const now = new Date().toISOString();
  const saved: CaraSavedOutput<T> = {
    id: generateId("cso"),
    module: params.module,
    child_id: params.childId,
    title: params.title,
    output: parsed.data,
    status: "draft",
    manager_review_status: reviewRequired ? "review_required" : "not_reviewed",
    manager_review_reasons: [...new Set(reasons)],
    guardrail_severity: guardrails.severity,
    guardrail_flags: guardrails.flags,
    llm_used: params.llmUsed ?? false,
    created_by: params.actor.userId,
    reviewed_by: null,
    reviewed_at: null,
    review_note: null,
    created_at: now,
    updated_at: now,
  };
  db.caraStudioOutputs.create(saved as CaraSavedOutput);

  // 4. Audit: the AI run, always.
  db.caraAiRuns.create({
    id: generateId("crun"),
    user_id: params.actor.userId,
    child_id: params.childId,
    module: params.module,
    prompt_type: params.promptType,
    input_summary: params.inputSummary.slice(0, 300),
    output_id: saved.id,
    safety_flags: guardrails.flags.map((f) => f.risk_type),
    model_used: params.modelUsed ?? "deterministic",
    llm_used: params.llmUsed ?? false,
    human_review_required: reviewRequired,
    created_at: now,
  });

  // 5. Audit: each guardrail flag as an event.
  for (const f of guardrails.flags) {
    db.caraGuardrailEvents.create({
      id: generateId("cge"),
      user_id: params.actor.userId,
      child_id: params.childId,
      module: params.module,
      risk_type: f.risk_type,
      severity: f.severity,
      flagged_text: f.matched_text,
      action_taken: blocked ? "blocked_pending_review" : "flagged_for_review",
      created_at: now,
    });
  }

  return { saved, guardrails, blocked };
}

/** The standard response body. Blocked outputs hide the content. */
export function caraResponse<T>(result: PersistResult<T>) {
  const { saved, guardrails, blocked } = result;
  return {
    id: saved.id,
    module: saved.module,
    title: saved.title,
    status: saved.status,
    manager_review_status: saved.manager_review_status,
    manager_review_reasons: saved.manager_review_reasons,
    guardrails: { severity: guardrails.severity, flags: guardrails.flags, action: guardrails.action },
    blocked,
    review_banner: saved.manager_review_status === "review_required"
      ? "This resource should be reviewed by a manager before use."
      : null,
    output: blocked ? null : saved.output,
    blocked_message: blocked
      ? "This draft raised high-severity safety flags and is held for manager review — it has been saved to the Review Centre and is not shown here."
      : null,
  };
}

export function severityAtLeast(s: GuardrailSeverity | null, min: GuardrailSeverity): boolean {
  const order = ["low", "medium", "high", "critical"];
  return s != null && order.indexOf(s) >= order.indexOf(min);
}
