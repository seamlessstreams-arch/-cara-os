import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeSelfHarmSafetyPlan } from "@/lib/engines/home-self-harm-safety-plan-intelligence-engine";
import type { SelfHarmSafetyPlanRecordInput } from "@/lib/engines/home-self-harm-safety-plan-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore();
    const raw = store.selfHarmSafetyPlanRecords as any[];
    const total_children = (store.youngPeople ?? []).length;
    const today = new Date().toISOString().slice(0, 10);

    const plans: SelfHarmSafetyPlanRecordInput[] = raw.map((r: any) => ({
      id: r.id,
      child_id: r.child_id,
      plan_date: r.plan_date ? r.plan_date.toString().slice(0, 10) : "",
      status: r.status || "active_preventive",
      co_produced_with_count: Array.isArray(r.co_produced_with) ? r.co_produced_with.length : 0,
      warning_signs_external_count: Array.isArray(r.warning_signs_external) ? r.warning_signs_external.length : 0,
      warning_signs_internal_count: Array.isArray(r.warning_signs_internal) ? r.warning_signs_internal.length : 0,
      early_trigger_count: Array.isArray(r.early_triggers) ? r.early_triggers.length : 0,
      internal_coping_strategy_count: Array.isArray(r.internal_coping_strategies) ? r.internal_coping_strategies.length : 0,
      social_distraction_count: Array.isArray(r.social_distractions) ? r.social_distractions.length : 0,
      people_to_contact_count: Array.isArray(r.people_to_contact) ? r.people_to_contact.length : 0,
      professional_contact_count: Array.isArray(r.professional_contacts) ? r.professional_contacts.length : 0,
      means_restriction_count: Array.isArray(r.means_restriction_agreed) ? r.means_restriction_agreed.length : 0,
      reasons_to_live_count: Array.isArray(r.reasons_to_live) ? r.reasons_to_live.length : 0,
      reasons_for_hope_count: Array.isArray(r.reasons_for_hope) ? r.reasons_for_hope.length : 0,
      child_signed_off: !!r.child_signed_off,
      professionals_informed_count: Array.isArray(r.professionals_informed) ? r.professionals_informed.length : 0,
      review_frequency: r.review_frequency || "monthly",
      has_next_review_date: !!r.next_review_date,
      next_review_date: r.next_review_date ? r.next_review_date.toString().slice(0, 10) : "",
      has_child_voice: !!(r.child_voice && r.child_voice.trim()),
      has_staff_observation: !!(r.staff_observation && r.staff_observation.trim()),
      flag_for_review_count: Array.isArray(r.flags_for_review) ? r.flags_for_review.length : 0,
    }));

    const result = computeSelfHarmSafetyPlan({ today, total_children, plans });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
