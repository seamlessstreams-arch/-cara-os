import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeSensoryTherapeuticEnvironment,
  type SensoryRoomUsageInput,
  type SensoryEquipmentInput,
  type PhysicalActivityInput,
} from "@/lib/engines/home-sensory-therapeutic-environment-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? store.youngPeople ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Sensory room usage
  const rawSensory = (store.sensoryRoomUsageRecords as any[] ?? []);
  const sensory_room_usage: SensoryRoomUsageInput[] = rawSensory.map((s: any) => ({
    id: s.id ?? "",
    child_id: s.child_id ?? "",
    date: (s.date ?? today).toString().slice(0, 10),
    duration_minutes: s.duration_minutes ?? 0,
    was_beneficial: s.effectiveness_rating != null ? s.effectiveness_rating >= 3 : !!(s.was_beneficial),
    staff_supported: !!(s.staff_present && (s.staff_present as any[]).length > 0),
  }));

  // Sensory equipment
  const rawEquipment = (store.sensoryEquipmentRecords as any[] ?? []);
  const sensory_equipment: SensoryEquipmentInput[] = rawEquipment.map((e: any) => ({
    id: e.id ?? "",
    item_name: e.item_name ?? "",
    condition: e.condition === "excellent" ? "good" : (e.condition === "worn_replace_soon" ? "fair" : (e.condition === "damaged_out_of_use" ? "broken" : (e.condition ?? "good"))),
    last_checked: (e.purchase_date ?? today).toString().slice(0, 10),
    in_use: !!(e.use_frequency && e.use_frequency !== "never"),
  }));

  // Physical activities — combine from physicalActivityEntries, cyclingBikeRecords, swimRecords
  const rawPhysical = (store.physicalActivityEntries as any[] ?? []);
  const physical_activities: PhysicalActivityInput[] = rawPhysical.map((a: any) => ({
    id: a.id ?? "",
    child_id: a.child_id ?? "",
    date: (a.date ?? today).toString().slice(0, 10),
    activity_type: a.category ?? a.activity_type ?? "other",
    duration_minutes: a.duration_minutes ?? 0,
    child_enjoyed: a.enjoyment_rating != null ? a.enjoyment_rating >= 3 : !!(a.child_enjoyed),
  }));

  // Add cycling records
  const rawCycling = (store.cyclingBikeRecords as any[] ?? []);
  rawCycling.forEach((c: any) => physical_activities.push({
    id: c.id ?? "",
    child_id: c.child_id ?? "",
    date: (c.date ?? today).toString().slice(0, 10),
    activity_type: "cycling",
    duration_minutes: c.duration_minutes ?? 30,
    child_enjoyed: !!(c.child_enjoyed ?? c.enjoyment_rating >= 3),
  }));

  // Add swim records
  const rawSwim = (store.swimRecords as any[] ?? []);
  rawSwim.forEach((s: any) => physical_activities.push({
    id: s.id ?? "",
    child_id: s.child_id ?? "",
    date: (s.date ?? today).toString().slice(0, 10),
    activity_type: "swimming",
    duration_minutes: s.duration_minutes ?? 45,
    child_enjoyed: !!(s.child_enjoyed ?? true),
  }));

  const result = computeHomeSensoryTherapeuticEnvironment({
    today,
    total_children: (children as any[]).length,
    sensory_room_usage,
    sensory_equipment,
    physical_activities,
  });

  return NextResponse.json({ data: result });
}
