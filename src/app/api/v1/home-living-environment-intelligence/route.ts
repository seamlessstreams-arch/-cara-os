// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LIVING ENVIRONMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-living-environment-intelligence
// Bedrooms, pets, gardens, outdoor activities, environmental risks.
// CHR 2015 Reg 15.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeLivingEnvironment,
  type BedroomProfileInput,
  type PetRecordInput,
  type GardenPlotInput,
  type OutdoorActivityInput,
  type EnvironmentalRiskInput,
} from "@/lib/engines/home-living-environment-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ────────────────────────────────────────────────────────
  const childIds = new Set<string>();
  for (const c of (store.children ?? []) as any[]) {
    if (c.id) childIds.add(c.id.toString());
  }
  const total_children = childIds.size;

  // ── Bedroom Profiles ───────────────────────────────────────────────
  const bedroom_profiles: BedroomProfileInput[] = (
    (store.bedroomProfiles ?? []) as any[]
  ).map((b: any) => ({
    id: (b.id ?? "").toString(),
    child_id: (b.child_id ?? "").toString(),
    child_choose_colours: !!(b.child_choose_colours),
    furniture_chosen_by_child: !!(b.furniture_chosen_by_child),
    child_authored: !!(b.child_authored),
    child_satisfaction_rating: typeof b.child_satisfaction_rating === "number" ? b.child_satisfaction_rating : 0,
    meaningful_items_count: Array.isArray(b.meaningful_items) ? b.meaningful_items.length : 0,
    personal_artwork_count: Array.isArray(b.personal_artwork_displayed) ? b.personal_artwork_displayed.length : 0,
    photos_displayed_count: Array.isArray(b.photos_displayed) ? b.photos_displayed.length : 0,
    sensory_accommodations_count: Array.isArray(b.sensory_accommodations) ? b.sensory_accommodations.length : 0,
    review_date: (b.review_date ?? "").toString().slice(0, 10),
  }));

  // ── Pet Records ────────────────────────────────────────────────────
  const pet_records: PetRecordInput[] = (
    (store.petRecords ?? []) as any[]
  ).map((p: any) => ({
    id: (p.id ?? "").toString(),
    vaccinations_up_to_date: !!(p.vaccinations_up_to_date),
    insurance: !!(p.insurance),
    children_involved_in_care_count: Array.isArray(p.children_involved_in_care) ? p.children_involved_in_care.length : 0,
    therapeutic_value: (p.therapeutic_value ?? "").toString(),
    risk_assessment_date: (p.risk_assessment_date ?? "").toString().slice(0, 10),
  }));

  // ── Garden Plots ───────────────────────────────────────────────────
  const garden_plots: GardenPlotInput[] = (
    (store.gardenPlotRecords ?? []) as any[]
  ).map((g: any) => ({
    id: (g.id ?? "").toString(),
    contributing_children_count: Array.isArray(g.contributing_children) ? g.contributing_children.length : 0,
    hours_this_month: typeof g.hours_this_month === "number" ? g.hours_this_month : 0,
    sensory_benefits_count: Array.isArray(g.sensory_benefits) ? g.sensory_benefits.length : 0,
    child_voice: (g.child_voice ?? "").toString(),
    review_date: (g.review_date ?? "").toString().slice(0, 10),
  }));

  // ── Outdoor Activity Risk Assessments ──────────────────────────────
  const outdoor_activities: OutdoorActivityInput[] = (
    (store.outdoorActivityRiskAssessments ?? []) as any[]
  ).map((o: any) => ({
    id: (o.id ?? "").toString(),
    signed_off_by_rm: !!(o.signed_off_by_rm),
    permissions_obtained: !!(o.permissions_obtained),
    emergency_procedures_count: Array.isArray(o.emergency_procedures) ? o.emergency_procedures.length : 0,
    child_specific_considerations_count: Array.isArray(o.child_specific_considerations) ? o.child_specific_considerations.length : 0,
  }));

  // ── Environmental Risks ────────────────────────────────────────────
  const environmental_risks: EnvironmentalRiskInput[] = (
    (store.environmentalRisks ?? []) as any[]
  ).map((e: any) => ({
    id: (e.id ?? "").toString(),
    risk_level: (e.risk_level ?? "low").toString(),
    status: (e.status ?? "open").toString(),
    review_date: (e.review_date ?? "").toString().slice(0, 10),
  }));

  const result = computeHomeLivingEnvironment({
    today,
    bedroom_profiles,
    pet_records,
    garden_plots,
    outdoor_activities,
    environmental_risks,
    total_children,
  });

  return NextResponse.json({ data: result });
}
