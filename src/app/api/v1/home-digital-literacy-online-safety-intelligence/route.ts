import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeDigitalLiteracyOnlineSafety,
  type DigitalSkillInput,
  type DigitalPlanInput,
  type PhoneRecordInput,
  type RseDigitalInput,
} from "@/lib/engines/home-digital-literacy-online-safety-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.youngPeople ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Digital literacy skill records → DigitalSkillInput[]
  const rawSkills = (store.digitalLiteracySkillRecords as any[] ?? []);
  const skills: DigitalSkillInput[] = rawSkills.map((s: any) => {
    const specificSkills = (s.specific_skills ?? []) as any[];
    const achieved = specificSkills.filter((sk: any) => sk.achieved).length;
    return {
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      domain: s.domain ?? "",
      competency: s.competency ?? "none",
      skills_achieved: achieved,
      skills_total: specificSkills.length,
    };
  });

  // Digital plans → DigitalPlanInput[]
  const rawPlans = (store.digitalPlans as any[] ?? []);
  const plans: DigitalPlanInput[] = rawPlans.map((p: any) => ({
    id: p.id ?? "",
    child_id: p.child_id ?? "",
    has_parental_controls: p.parental_controls_level !== "none" && p.parental_controls_level !== undefined,
    exploitation_risk_factors_count: ((p.exploitation_risk_factors ?? []) as any[]).length,
    exploitation_protections_count: ((p.exploitation_protections ?? []) as any[]).length,
    cyberbullying_response_count: ((p.cyberbullying_response ?? []) as any[]).length,
    pornography_protections_count: ((p.pornography_and_exposure_protections ?? []) as any[]).length,
    online_safety_knowledge_count: ((p.child_online_safety_knowledge ?? []) as any[]).length,
  }));

  // Child phone records → PhoneRecordInput[]
  const rawPhones = (store.childPhoneRecords as any[] ?? []);
  const phones: PhoneRecordInput[] = rawPhones.map((ph: any) => ({
    id: ph.id ?? "",
    child_id: ph.child_id ?? "",
    parental_controls_active: !!(ph.parental_controls_active),
    screen_time_weekly_avg: ph.screen_time_weekly_avg ?? 0,
  }));

  // RSE tracker records (digital topics) → RseDigitalInput[]
  const rawRse = (store.rseTrackerRecords as any[] ?? []);
  const rse_records: RseDigitalInput[] = rawRse.map((r: any) => ({
    id: r.id ?? "",
    child_id: r.child_id ?? "",
    topic: r.topic ?? "",
    child_initiated: !!(r.child_initiation_of_topic),
    concepts_covered_count: ((r.key_concepts_covered ?? []) as any[]).length,
  }));

  const result = computeDigitalLiteracyOnlineSafety({
    today,
    total_children: (children as any[]).length,
    skills,
    plans,
    phones,
    rse_records,
  });

  return NextResponse.json({ data: result });
}
