// ==============================================================================
// CORNERSTONE -- HOME MENSTRUATION & PUBERTY SUPPORT INTELLIGENCE API ROUTE
// GET /api/v1/home-menstruation-puberty-support-intelligence
// Cross-domain composite: pubertyEducationRecords + menstruationSupportRecords +
// productAvailabilityRecords + dignityCareRecords + bodyConfidenceRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeMenstruationPubertySupport,
  type PubertyEducationRecordInput,
  type MenstruationSupportRecordInput,
  type ProductAvailabilityRecordInput,
  type DignityCareRecordInput,
  type BodyConfidenceRecordInput,
} from "@/lib/engines/home-menstruation-puberty-support-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawPubertyEducation = (store.pubertyEducationRecords ?? []) as any[];
    const puberty_education_records: PubertyEducationRecordInput[] = rawPubertyEducation.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      topic: r.topic ?? "other",
      delivery_method: r.delivery_method ?? "other",
      age_appropriate: !!r.age_appropriate,
      child_engaged: !!r.child_engaged,
      child_understanding_demonstrated: !!r.child_understanding_demonstrated,
      staff_confident: !!r.staff_confident,
      follow_up_planned: !!r.follow_up_planned,
      follow_up_completed: !!r.follow_up_completed,
      child_satisfaction: r.child_satisfaction ?? 3,
      cultural_sensitivity_considered: !!r.cultural_sensitivity_considered,
      parent_carer_informed: !!r.parent_carer_informed,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawMenstruationSupport = (store.menstruationSupportRecords ?? []) as any[];
    const menstruation_support_records: MenstruationSupportRecordInput[] = rawMenstruationSupport.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      support_type: r.support_type ?? "other",
      support_provided: !!r.support_provided,
      staff_responsive: !!r.staff_responsive,
      response_timely: !!r.response_timely,
      child_comfort_level: r.child_comfort_level ?? 3,
      privacy_maintained: !!r.privacy_maintained,
      preferred_staff_available: !!r.preferred_staff_available,
      medical_needs_addressed: !!r.medical_needs_addressed,
      pain_managed_effectively: !!r.pain_managed_effectively,
      school_absence_due_to_period: !!r.school_absence_due_to_period,
      school_absence_managed: !!r.school_absence_managed,
      child_voice_captured: !!r.child_voice_captured,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawProductAvailability = (store.productAvailabilityRecords ?? []) as any[];
    const product_availability_records: ProductAvailabilityRecordInput[] = rawProductAvailability.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      product_type: r.product_type ?? "other",
      available: !!r.available,
      accessible_location: !!r.accessible_location,
      discreet_access: !!r.discreet_access,
      variety_offered: !!r.variety_offered,
      child_choice_respected: !!r.child_choice_respected,
      stock_adequate: !!r.stock_adequate,
      last_stock_check_date: r.last_stock_check_date ?? null,
      budget_allocated: !!r.budget_allocated,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawDignityCare = (store.dignityCareRecords ?? []) as any[];
    const dignity_care_records: DignityCareRecordInput[] = rawDignityCare.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      context: r.context ?? "other",
      privacy_respected: !!r.privacy_respected,
      child_preferences_followed: !!r.child_preferences_followed,
      gender_appropriate_staff: !!r.gender_appropriate_staff,
      embarrassment_minimised: !!r.embarrassment_minimised,
      child_felt_comfortable: !!r.child_felt_comfortable,
      child_satisfaction: r.child_satisfaction ?? 3,
      dignity_concern_raised: !!r.dignity_concern_raised,
      dignity_concern_resolved: !!r.dignity_concern_resolved,
      cultural_needs_met: !!r.cultural_needs_met,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawBodyConfidence = (store.bodyConfidenceRecords ?? []) as any[];
    const body_confidence_records: BodyConfidenceRecordInput[] = rawBodyConfidence.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      activity_type: r.activity_type ?? "other",
      age_appropriate: !!r.age_appropriate,
      child_engaged: !!r.child_engaged,
      positive_outcome_observed: !!r.positive_outcome_observed,
      staff_modelled_positive_behaviour: !!r.staff_modelled_positive_behaviour,
      child_self_assessment: r.child_self_assessment ?? 3,
      concerns_identified: !!r.concerns_identified,
      concerns_actioned: !!r.concerns_actioned,
      follow_up_planned: !!r.follow_up_planned,
      follow_up_completed: !!r.follow_up_completed,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeMenstruationPubertySupport({
      today,
      total_children,
      puberty_education_records,
      menstruation_support_records,
      product_availability_records,
      dignity_care_records,
      body_confidence_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
