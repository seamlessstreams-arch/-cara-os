// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara Studio write-through helpers
//
// Same contract as care-records.ts: best-effort, never throws, no-op while
// Supabase is off. Outputs keep their application TEXT id (cso_…) so the
// manager-review PATCH can update the same row; runs and guardrail events are
// append-only and map onto the migration-411 tables.
// ══════════════════════════════════════════════════════════════════════════════

import { isSupabaseEnabled, createServerClient } from "./server";
import type {
  CaraSavedOutput,
  CaraAiRun,
  CaraGuardrailEvent,
} from "@/lib/cara-studio/cara-types";

// The generated Database type doesn't know the 411/412 tables yet — use a
// narrow untyped escape hatch for these inserts (payload shapes are mirrored
// from the migrations above and exercised by the live probe).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawClient = { from(table: string): any };
function raw(c: NonNullable<ReturnType<typeof createServerClient>>): RawClient {
  return c as unknown as RawClient;
}

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

/** Insert the unified Cara Studio output row (text id preserved). */
export async function persistCaraStudioOutput(o: CaraSavedOutput): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("cara_studio_outputs").insert({
      id: o.id,
      home_id: homeId(),
      module: o.module,
      child_id: o.child_id,
      title: o.title,
      output: o.output as Record<string, unknown>,
      status: o.status,
      manager_review_status: o.manager_review_status,
      manager_review_reasons: o.manager_review_reasons,
      guardrail_severity: o.guardrail_severity,
      guardrail_flags: o.guardrail_flags as unknown as Record<string, unknown>[],
      llm_used: o.llm_used,
      created_by: o.created_by,
      created_at: o.created_at,
      updated_at: o.updated_at,
    });
  } catch {
    // best-effort — the in-memory write already succeeded
  }
}

/** Update the review state of an existing output (matches by text id). */
export async function persistCaraStudioReview(o: CaraSavedOutput): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c)
      .from("cara_studio_outputs")
      .update({
        status: o.status,
        manager_review_status: o.manager_review_status,
        reviewed_by: o.reviewed_by,
        reviewed_at: o.reviewed_at,
        review_note: o.review_note,
        updated_at: o.updated_at,
      })
      .eq("id", o.id);
  } catch {
    // best-effort
  }
}

/** Upsert the child's learning profile (matched by child_id; 411 table). */
export async function persistCaraLearningProfile(p: {
  child_id: string;
  [key: string]: unknown;
}): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    const { id: _id, child_id, created_by, updated_by, created_at, updated_at, ...fields } = p as Record<string, unknown>;
    const { data } = await raw(c)
      .from("cara_child_learning_profiles")
      .select("id")
      .eq("child_id", child_id)
      .maybeSingle();
    if (data?.id) {
      await raw(c).from("cara_child_learning_profiles").update({ ...fields, updated_at }).eq("id", data.id);
    } else {
      await raw(c).from("cara_child_learning_profiles").insert({ ...fields, child_id, home_id: homeId(), created_at, updated_at });
    }
  } catch {
    // best-effort
  }
}

/** Append the AI-run audit row (maps onto migration 411 cara_ai_runs). */
export async function persistCaraAiRun(r: CaraAiRun): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("cara_ai_runs").insert({
      home_id: homeId(),
      user_id: null, // demo staff ids aren't uuids; identity kept in input_context
      child_id: null,
      module: r.module,
      prompt_type: r.prompt_type,
      input_context: { summary: r.input_summary, user: r.user_id, child: r.child_id },
      output: { output_id: r.output_id },
      safety_flags: r.safety_flags,
      model_used: r.model_used,
      human_review_required: r.human_review_required,
      created_at: r.created_at,
    });
  } catch {
    // best-effort
  }
}

/** Insert a library resource (text app id preserved — migration 413). */
export async function persistLibraryResource(r: Record<string, unknown>): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("cara_resource_library").insert({ home_id: homeId(), ...r });
  } catch {
    // best-effort
  }
}

/** Update a library resource's approval state (matches by text id). */
export async function persistLibraryApproval(r: { id: string; approved: boolean; approved_by: string | null; updated_at: string }): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c)
      .from("cara_resource_library")
      .update({ approved: r.approved, approved_by: r.approved_by, updated_at: r.updated_at })
      .eq("id", r.id);
  } catch {
    // best-effort
  }
}

/** Append a guardrail event (maps onto migration 411 cara_guardrail_events). */
export async function persistCaraGuardrailEvent(e: CaraGuardrailEvent): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("cara_guardrail_events").insert({
      home_id: homeId(),
      user_id: null, // see note above — demo ids carried in flagged context
      child_id: null,
      module: e.module,
      risk_type: e.risk_type,
      severity: e.severity,
      flagged_text: `${e.flagged_text} [user:${e.user_id}${e.child_id ? ` child:${e.child_id}` : ""}]`,
      action_taken: e.action_taken,
      created_at: e.created_at,
    });
  } catch {
    // best-effort
  }
}
