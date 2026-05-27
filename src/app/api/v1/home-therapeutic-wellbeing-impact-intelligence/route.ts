import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeTherapeuticWellbeingImpact,
  type TherapeuticImpactInput,
  type WellbeingPulseInput,
  type SelfSoothingInput,
  type GriefSupportInput,
} from "@/lib/engines/home-therapeutic-wellbeing-impact-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.youngPeople ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Therapeutic child impact → TherapeuticImpactInput[]
  const rawImpact = (store.therapeuticChildImpact as any[] ?? []);
  const impacts: TherapeuticImpactInput[] = rawImpact.map((t: any) => ({
    id: t.id ?? "",
    child_id: t.child_id ?? "",
    key_outcomes_count: ((t.keyOutcomes ?? []) as any[]).length,
    has_evidence_of_progress: !!(t.evidenceOfProgress),
    model_application_count: ((t.modelApplication ?? []) as any[]).length,
    review_date: (t.reviewDate ?? "").toString().slice(0, 10),
  }));

  // Wellbeing pulse survey records → WellbeingPulseInput[]
  const rawPulse = (store.wellbeingPulseSurveyRecords as any[] ?? []);
  const pulses: WellbeingPulseInput[] = rawPulse.map((w: any) => ({
    id: w.id ?? "",
    child_id: w.child_id ?? "",
    date: (w.date ?? "").toString().slice(0, 10),
    overall_score: w.overall_score ?? 0,
    trend_vs_last: w.trend_vs_last ?? "stable",
    actions_arising_count: ((w.actions_arising ?? []) as any[]).length,
    follow_up_needed: !!(w.follow_up_needed),
  }));

  // Self-soothing toolkits → SelfSoothingInput[]
  const rawSoothing = (store.selfSoothingToolkits as any[] ?? []);
  const toolkits: SelfSoothingInput[] = rawSoothing.map((s: any) => {
    const totalStrategies =
      ((s.sensory_strategies ?? []) as any[]).length +
      ((s.breathing_strategies ?? []) as any[]).length +
      ((s.movement_strategies ?? []) as any[]).length +
      ((s.distraction_strategies ?? []) as any[]).length +
      ((s.co_regulation_strategies ?? []) as any[]).length;
    return {
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      total_strategies: totalStrategies,
      child_chose_all: !!(s.child_chose_all),
      effectiveness_rating: s.effectiveness_rating ?? "unknown",
      last_updated: (s.last_updated ?? "").toString().slice(0, 10),
      review_date: (s.review_date ?? "").toString().slice(0, 10),
    };
  });

  // Grief records → GriefSupportInput[]
  const rawGrief = (store.griefRecords as any[] ?? []);
  const grief_records: GriefSupportInput[] = rawGrief.map((g: any) => ({
    id: g.id ?? "",
    child_id: g.child_id ?? "",
    loss_type: g.loss_type ?? "",
    external_support_count: ((g.external_support_in_place ?? []) as any[]).length,
    home_support_count: ((g.home_based_support ?? []) as any[]).length,
    has_key_worker_involvement: !!(g.key_worker_involvement),
    traditions_count: ((g.traditions_and_rituals ?? []) as any[]).length,
    has_anniversary_acknowledgement: !!(g.anniversary_acknowledgement),
    creative_outlets_count: ((g.creative_outlets ?? []) as any[]).length,
  }));

  const result = computeTherapeuticWellbeingImpact({
    today,
    total_children: (children as any[]).length,
    impacts,
    pulses,
    toolkits,
    grief_records,
  });

  return NextResponse.json({ data: result });
}
