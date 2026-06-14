// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — THERAPEUTIC FORMULATION ENGINE
//
// Builds and maintains therapeutic formulations for each young person.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { CaraStudioFormulation } from "@/types/cara-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function createFormulation(
  formulation: Omit<CaraStudioFormulation, "id" | "created_at" | "approved_at"> & { id?: string },
): Promise<CaraStudioFormulation | null> {
  const sb = createServerClient();
  if (!sb) return getDemoFormulation(formulation.child_id);

  const { data, error } = await (sb.from("cara_studio_formulations") as any)
    .insert({
      home_id: formulation.home_id || homeId(),
      child_id: formulation.child_id, title: formulation.title,
      presenting_behaviour: formulation.presenting_behaviour,
      possible_unmet_need: formulation.possible_unmet_need,
      trauma_link: formulation.trauma_link,
      attachment_considerations: formulation.attachment_considerations,
      triggers: formulation.triggers, protective_factors: formulation.protective_factors,
      relational_strengths: formulation.relational_strengths,
      staff_response_patterns: formulation.staff_response_patterns,
      what_helps: formulation.what_helps, what_escalates: formulation.what_escalates,
      therapeutic_hypothesis: formulation.therapeutic_hypothesis,
      recommended_intervention: formulation.recommended_intervention,
      review_date: formulation.review_date,
      evidence_source_ids: formulation.evidence_source_ids,
      created_by: formulation.created_by, approved_by: null,
    })
    .select().single();

  if (error) { console.error("[cara-studio/formulation] Create error:", error); return null; }
  return data as CaraStudioFormulation;
}

export async function getFormulationForChild(childId: string): Promise<CaraStudioFormulation | null> {
  const sb = createServerClient();
  if (!sb) return getDemoFormulation(childId);

  const { data, error } = await (sb.from("cara_studio_formulations") as any)
    .select("*").eq("home_id", homeId()).eq("child_id", childId)
    .order("created_at", { ascending: false }).limit(1).single();

  if (error) return null;
  return data as CaraStudioFormulation;
}

export async function listFormulations(hId: string, childId?: string): Promise<CaraStudioFormulation[]> {
  const sb = createServerClient();
  if (!sb) return [getDemoFormulation(childId ?? "demo-child-1")];

  let query = (sb.from("cara_studio_formulations") as any)
    .select("*").eq("home_id", hId).order("created_at", { ascending: false });
  if (childId) query = query.eq("child_id", childId);

  const { data, error } = await query;
  if (error) { console.error("[cara-studio/formulation] List error:", error); return []; }
  return (data ?? []) as CaraStudioFormulation[];
}

export async function updateFormulation(formulationId: string, updates: Partial<CaraStudioFormulation>): Promise<CaraStudioFormulation | null> {
  const sb = createServerClient();
  if (!sb) return null;

  const { data, error } = await (sb.from("cara_studio_formulations") as any)
    .update(updates).eq("id", formulationId).select().single();

  if (error) { console.error("[cara-studio/formulation] Update error:", error); return null; }
  return data as CaraStudioFormulation;
}

export async function approveFormulation(formulationId: string, approvedBy: string): Promise<boolean> {
  const sb = createServerClient();
  if (!sb) return false;

  const { error } = await (sb.from("cara_studio_formulations") as any)
    .update({ approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq("id", formulationId);

  if (error) { console.error("[cara-studio/formulation] Approve error:", error); return false; }
  return true;
}

function getDemoFormulation(childId: string): CaraStudioFormulation {
  const now = new Date().toISOString();
  return {
    id: "demo-formulation-1", home_id: homeId(), child_id: childId,
    title: "Therapeutic Formulation (demo)",
    presenting_behaviour: "Emotional dysregulation during transitions, especially around contact with family members.",
    possible_unmet_need: "Need for predictability, safety, and reassurance that relationships are reliable.",
    trauma_link: "Early experiences of inconsistent caregiving and multiple placement moves.",
    attachment_considerations: "Displays an anxious-avoidant attachment style.",
    triggers: [
      { trigger: "Unplanned changes to routine", severity: "high" },
      { trigger: "Contact with birth family", severity: "high" },
      { trigger: "Perceived rejection by peers", severity: "medium" },
    ],
    protective_factors: [
      { factor: "Strong relationship with key worker", strength: "high" },
      { factor: "Enjoys creative activities", strength: "medium" },
      { factor: "Growing ability to name emotions", strength: "medium" },
    ],
    relational_strengths: [
      { strength: "Responds well to playfulness and humour" },
      { strength: "Can accept comfort when trust is established" },
    ],
    staff_response_patterns: [
      { pattern: "PACE approach effective during early escalation", outcome: "positive" },
      { pattern: "Directive language during dysregulation increases escalation", outcome: "negative" },
    ],
    what_helps: "Predictable routines, advance warning of changes, having a familiar adult available.",
    what_escalates: "Sudden changes, raised voices, being told rather than asked, too many demands.",
    therapeutic_hypothesis: "This young person's behaviour communicates unmet attachment needs.",
    recommended_intervention: "Continue PACE-based key work. Introduce DDP-informed 'wondering aloud'.",
    review_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    evidence_source_ids: ["demo-src-1", "demo-src-2"],
    created_by: "demo-user-1", approved_by: null,
    created_at: now, approved_at: null,
  };
}
