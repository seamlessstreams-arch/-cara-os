// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ETHNIC HAIR & SKINCARE INTELLIGENCE API ROUTE
// GET /api/v1/home-ethnic-hair-skincare-intelligence
// Cross-domain composite: hairCareRecords + skincareRoutineRecords +
// productProvisionRecords + specialistReferralRecords + childSatisfactionRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeEthnicHairSkincare,
  type HairCareRecordInput,
  type SkincareRoutineRecordInput,
  type ProductProvisionRecordInput,
  type SpecialistReferralRecordInput,
  type ChildSatisfactionRecordInput,
} from "@/lib/engines/home-ethnic-hair-skincare-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawHairCare = (store.hairCareRecords ?? []) as any[];
    const hair_care_records: HairCareRecordInput[] = rawHairCare.map((h: any) => ({
      id: h.id ?? "",
      child_id: h.child_id ?? "",
      date: (h.date ?? today).toString(),
      hair_type: h.hair_type ?? "unspecified",
      care_plan_in_place: !!h.care_plan_in_place,
      care_plan_reviewed: !!h.care_plan_reviewed,
      care_plan_review_date: (h.care_plan_review_date ?? today).toString(),
      appropriate_products_used: !!h.appropriate_products_used,
      products_culturally_matched: !!h.products_culturally_matched,
      styling_preferences_documented: !!h.styling_preferences_documented,
      child_voice_captured: !!h.child_voice_captured,
      child_satisfied: !!h.child_satisfied,
      protective_styling_offered: !!h.protective_styling_offered,
      staff_competent: !!h.staff_competent,
      staff_trained_ethnic_hair: !!h.staff_trained_ethnic_hair,
      external_specialist_used: !!h.external_specialist_used,
      specialist_name: h.specialist_name ?? "",
      frequency_appropriate: !!h.frequency_appropriate,
      scalp_condition_healthy: !!h.scalp_condition_healthy,
      condition_concerns: h.condition_concerns ?? "",
      notes: h.notes ?? "",
      created_at: (h.created_at ?? today).toString(),
    }));

    const rawSkincare = (store.skincareRoutineRecords ?? []) as any[];
    const skincare_routine_records: SkincareRoutineRecordInput[] = rawSkincare.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      date: (s.date ?? today).toString(),
      skin_type: s.skin_type ?? "other",
      routine_in_place: !!s.routine_in_place,
      routine_documented: !!s.routine_documented,
      routine_followed_consistently: !!s.routine_followed_consistently,
      products_appropriate_for_skin_type: !!s.products_appropriate_for_skin_type,
      products_culturally_specific: !!s.products_culturally_specific,
      moisturising_frequency_adequate: !!s.moisturising_frequency_adequate,
      spf_protection_provided: !!s.spf_protection_provided,
      dermatological_needs_identified: !!s.dermatological_needs_identified,
      dermatological_needs_met: !!s.dermatological_needs_met,
      child_educated_on_routine: !!s.child_educated_on_routine,
      child_independent_in_routine: !!s.child_independent_in_routine,
      child_satisfied: !!s.child_satisfied,
      staff_knowledgeable: !!s.staff_knowledgeable,
      condition_concerns: s.condition_concerns ?? "",
      notes: s.notes ?? "",
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawProducts = (store.productProvisionRecords ?? []) as any[];
    const product_provision_records: ProductProvisionRecordInput[] = rawProducts.map((p: any) => ({
      id: p.id ?? "",
      date: (p.date ?? today).toString(),
      product_category: p.product_category ?? "other",
      brand_name: p.brand_name ?? "",
      culturally_appropriate: !!p.culturally_appropriate,
      child_id: p.child_id ?? null,
      requested_by_child: !!p.requested_by_child,
      in_stock: !!p.in_stock,
      budget_adequate: !!p.budget_adequate,
      sourced_from_specialist_supplier: !!p.sourced_from_specialist_supplier,
      quality_rating: p.quality_rating ?? 3,
      child_approved: !!p.child_approved,
      replacement_ordered_timely: !!p.replacement_ordered_timely,
      notes: p.notes ?? "",
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawSpecialist = (store.specialistReferralRecords ?? []) as any[];
    const specialist_referral_records: SpecialistReferralRecordInput[] = rawSpecialist.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      referral_date: (r.referral_date ?? today).toString(),
      specialist_type: r.specialist_type ?? "other",
      referral_reason: r.referral_reason ?? "",
      referral_made: !!r.referral_made,
      appointment_date: (r.appointment_date ?? today).toString(),
      appointment_attended: !!r.appointment_attended,
      waiting_time_days: r.waiting_time_days ?? 0,
      outcome_positive: !!r.outcome_positive,
      child_satisfied: !!r.child_satisfied,
      follow_up_needed: !!r.follow_up_needed,
      follow_up_arranged: !!r.follow_up_arranged,
      staff_advocated: !!r.staff_advocated,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSatisfaction = (store.childSatisfactionRecords ?? []) as any[];
    const child_satisfaction_records: ChildSatisfactionRecordInput[] = rawSatisfaction.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      date: (s.date ?? today).toString(),
      satisfaction_area: s.satisfaction_area ?? "overall",
      satisfaction_rating: s.satisfaction_rating ?? 3,
      child_feels_listened_to: !!s.child_feels_listened_to,
      child_feels_culturally_respected: !!s.child_feels_culturally_respected,
      child_preferences_acted_on: !!s.child_preferences_acted_on,
      child_can_choose_products: !!s.child_can_choose_products,
      child_can_choose_stylist: !!s.child_can_choose_stylist,
      child_educated_about_care: !!s.child_educated_about_care,
      child_confident_in_self_care: !!s.child_confident_in_self_care,
      complaints_raised: !!s.complaints_raised,
      complaint_resolved: !!s.complaint_resolved,
      feedback_text: s.feedback_text ?? "",
      notes: s.notes ?? "",
      created_at: (s.created_at ?? today).toString(),
    }));

    const result = computeEthnicHairSkincare({
      today,
      total_children,
      hair_care_records,
      skincare_routine_records,
      product_provision_records,
      specialist_referral_records,
      child_satisfaction_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
