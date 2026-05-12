// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — DECISION SUPPORT SERVICE
//
// Helps managers structure complex decisions: what is known vs unknown,
// risks of each option, child impact, compliance implications, and
// recommended next steps. ARIA never makes the decision — it frames it.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { AriaStudioDecisionSupport } from "@/types/aria-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function createDecisionSupport(
  record: Omit<AriaStudioDecisionSupport, "id" | "created_at" | "decision_recorded_at">,
): Promise<AriaStudioDecisionSupport | null> {
  const sb = createServerClient();
  if (!sb) return getDemoDecisionSupport(record.decision_context);

  const { data, error } = await (sb.from("aria_studio_decision_support") as any)
    .insert({
      home_id: record.home_id || homeId(),
      decision_context: record.decision_context,
      child_id: record.child_id, staff_id: record.staff_id,
      known_facts: record.known_facts, unknowns: record.unknowns,
      risks: record.risks, options: record.options, pros_cons: record.pros_cons,
      child_impact: record.child_impact, staff_impact: record.staff_impact,
      compliance_impact: record.compliance_impact,
      recommended_next_steps: record.recommended_next_steps,
      evidence_needed: record.evidence_needed, decision_made_by: null,
    })
    .select().single();

  if (error) { console.error("[aria-studio/decision-support] Create error:", error); return null; }
  return data as AriaStudioDecisionSupport;
}

export async function getDecisionSupport(id: string): Promise<AriaStudioDecisionSupport | null> {
  const sb = createServerClient();
  if (!sb) return getDemoDecisionSupport();

  const { data, error } = await (sb.from("aria_studio_decision_support") as any)
    .select("*").eq("id", id).single();
  if (error) return null;
  return data as AriaStudioDecisionSupport;
}

export async function listDecisionSupport(hId: string, childId?: string): Promise<AriaStudioDecisionSupport[]> {
  const sb = createServerClient();
  if (!sb) return [getDemoDecisionSupport()];

  let query = (sb.from("aria_studio_decision_support") as any)
    .select("*").eq("home_id", hId).order("created_at", { ascending: false });
  if (childId) query = query.eq("child_id", childId);

  const { data, error } = await query;
  if (error) { console.error("[aria-studio/decision-support] List error:", error); return []; }
  return (data ?? []) as AriaStudioDecisionSupport[];
}

export async function recordDecision(id: string, decisionMadeBy: string): Promise<boolean> {
  const sb = createServerClient();
  if (!sb) return false;

  const { error } = await (sb.from("aria_studio_decision_support") as any)
    .update({ decision_made_by: decisionMadeBy, decision_recorded_at: new Date().toISOString() })
    .eq("id", id);

  if (error) { console.error("[aria-studio/decision-support] Record error:", error); return false; }
  return true;
}

function getDemoDecisionSupport(context?: string): AriaStudioDecisionSupport {
  const now = new Date().toISOString();
  return {
    id: "demo-decision-1", home_id: homeId(),
    decision_context: context ?? "Whether to increase staffing ratios during the school holiday period.",
    child_id: null, staff_id: null,
    known_facts: [
      { fact: "3 incidents occurred in the last school holiday period" },
      { fact: "2 young people have identified holidays as a trigger for anxiety" },
      { fact: "Current staffing ratio is 1:2 during day shifts" },
    ],
    unknowns: [
      { unknown: "Whether planned activities will mitigate the risk" },
      { unknown: "Whether all young people will be in placement during the holiday" },
    ],
    risks: [
      { risk: "Under-staffing may lead to increased incidents", level: "high" },
      { risk: "Over-staffing may create budget pressure", level: "medium" },
    ],
    options: [
      { option: "Increase to 1:1 ratio with existing team overtime", cost: "moderate" },
      { option: "Add one agency staff per shift", cost: "high" },
      { option: "Maintain current ratio with enhanced activity programme", cost: "low" },
    ],
    pros_cons: [
      { option: "Option 1", pros: ["Team consistency"], cons: ["Staff fatigue risk"] },
      { option: "Option 2", pros: ["Numbers covered"], cons: ["Unfamiliar adults", "Higher cost"] },
    ],
    child_impact: "Young people benefit from familiar adults during unstructured time.",
    staff_impact: "Staff wellbeing should be considered. Extended overtime increases burnout risk.",
    compliance_impact: "Regulation 32 requires sufficient staff. Staffing should be determined by children's needs, not cost.",
    recommended_next_steps: [
      { step: "Consult with the team about capacity" },
      { step: "Review planned activities schedule" },
      { step: "Present options to the RI for approval" },
    ],
    evidence_needed: [
      { evidence: "Incident data from last three holiday periods" },
      { evidence: "Young people's views on staffing during holidays" },
    ],
    decision_made_by: null, decision_recorded_at: null, created_at: now,
  };
}
