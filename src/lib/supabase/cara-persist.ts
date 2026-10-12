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
  CaraChildLearningProfile,
} from "@/lib/cara-studio/cara-types";

// The generated Database type doesn't know the 411/412 tables yet — use a
// narrow untyped escape hatch for these inserts (payload shapes are mirrored
// from the migrations above and exercised by the live probe).
import type { RawClient } from "@/lib/supabase/loose-client";
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

/** Read a child's Cara Studio outputs from the durable table (live only).
 *  The in-memory store is emptied on a live tenant, so the child workspace must
 *  read these back from cara_studio_outputs where persistCaraStudioOutput wrote
 *  them — otherwise the page 404s (no child in the store) or shows no drafts. */
export async function getCaraStudioOutputsByChild(childId: string): Promise<CaraSavedOutput[]> {
  if (!isSupabaseEnabled()) return [];
  const c = createServerClient();
  if (!c) return [];
  try {
    const { data } = await raw(c)
      .from("cara_studio_outputs")
      .select("id, module, child_id, title, output, status, manager_review_status, manager_review_reasons, guardrail_severity, guardrail_flags, llm_used, created_by, reviewed_by, reviewed_at, review_note, created_at, updated_at")
      .eq("home_id", homeId())
      .eq("child_id", childId)
      .order("created_at", { ascending: false });
    return (data ?? []) as unknown as CaraSavedOutput[];
  } catch {
    return [];
  }
}

/** Home-wide Cara Studio outputs for the manager review centre (live only). */
export async function getCaraStudioOutputsForHome(): Promise<CaraSavedOutput[]> {
  if (!isSupabaseEnabled()) return [];
  const c = createServerClient();
  if (!c) return [];
  try {
    const { data } = await raw(c)
      .from("cara_studio_outputs")
      .select("id, module, child_id, title, output, status, manager_review_status, manager_review_reasons, guardrail_severity, guardrail_flags, llm_used, created_by, reviewed_by, reviewed_at, review_note, created_at, updated_at")
      .eq("home_id", homeId())
      .order("created_at", { ascending: false });
    return (data ?? []) as unknown as CaraSavedOutput[];
  } catch {
    return [];
  }
}

/** Recent guardrail events for the home (live only), newest first. */
export async function getRecentCaraGuardrailEvents(limit = 30): Promise<CaraGuardrailEvent[]> {
  if (!isSupabaseEnabled()) return [];
  const c = createServerClient();
  if (!c) return [];
  try {
    const { data } = await raw(c)
      .from("cara_guardrail_events")
      .select("id, module, risk_type, severity, flagged_text, action_taken, user_id, child_id, created_at")
      .eq("home_id", homeId())
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ""),
      user_id: (r.user_id as string) ?? "",
      child_id: (r.child_id as string | null) ?? null,
      module: r.module as CaraGuardrailEvent["module"],
      risk_type: String(r.risk_type ?? ""),
      severity: r.severity as CaraGuardrailEvent["severity"],
      flagged_text: String(r.flagged_text ?? ""),
      action_taken: r.action_taken as CaraGuardrailEvent["action_taken"],
      created_at: String(r.created_at ?? ""),
    }));
  } catch {
    return [];
  }
}

/** Recent AI runs for the home (live only), newest first. The stored row packs
 *  identity/summary into input_context and the output id into output, so this
 *  reverses that mapping; llm_used isn't persisted and is inferred from the model. */
export async function getRecentCaraAiRuns(limit = 30): Promise<CaraAiRun[]> {
  if (!isSupabaseEnabled()) return [];
  const c = createServerClient();
  if (!c) return [];
  try {
    const { data } = await raw(c)
      .from("cara_ai_runs")
      .select("id, module, prompt_type, input_context, output, safety_flags, model_used, human_review_required, created_at")
      .eq("home_id", homeId())
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as Record<string, unknown>[]).map((r) => {
      const ctx = (r.input_context ?? {}) as { summary?: string; user?: string; child?: string | null };
      const out = (r.output ?? {}) as { output_id?: string | null };
      const model = String(r.model_used ?? "");
      return {
        id: String(r.id ?? ""),
        user_id: ctx.user ?? "",
        child_id: ctx.child ?? null,
        module: r.module as CaraAiRun["module"],
        prompt_type: String(r.prompt_type ?? ""),
        input_summary: ctx.summary ?? "",
        output_id: out.output_id ?? null,
        safety_flags: (r.safety_flags as string[]) ?? [],
        model_used: model,
        llm_used: model !== "" && model !== "stub" && model !== "deterministic",
        human_review_required: Boolean(r.human_review_required),
        created_at: String(r.created_at ?? ""),
      };
    });
  } catch {
    return [];
  }
}

/** Read a child's learning profile from the durable table (live only), or null.
 *  Counterpart to persistCaraLearningProfile — same table, cara_child_learning_profiles. */
export async function getCaraLearningProfileByChild(childId: string): Promise<CaraChildLearningProfile | null> {
  if (!isSupabaseEnabled()) return null;
  const c = createServerClient();
  if (!c) return null;
  try {
    const { data } = await raw(c)
      .from("cara_child_learning_profiles")
      .select("*")
      .eq("home_id", homeId())
      .eq("child_id", childId)
      .order("updated_at", { ascending: false })
      .limit(1);
    const row = Array.isArray(data) ? data[0] : null;
    return (row as unknown as CaraChildLearningProfile) ?? null;
  } catch {
    return null;
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
