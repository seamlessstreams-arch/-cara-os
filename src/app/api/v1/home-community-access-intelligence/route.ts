// ══════════════════════════════════════════════════════════════════════════════
// API — HOME COMMUNITY ACCESS INTELLIGENCE
// GET /api/v1/home-community-access-intelligence
// Maps in-memory store -> engine input -> JSON response.
// CHR 2015 Reg 9 (enjoyment & achievement), Reg 12 (independence).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeCommunityAccess,
  type TransportLogInput,
  type TransportRAInput,
  type IndependentTravelInput,
  type TripPlanInput,
  type CommunityEngagementInput,
} from "@/lib/engines/home-community-access-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Transport Logs ──────────────────────────────────────────────────
  const transport_logs: TransportLogInput[] = ((store as any).transportLogRecords ?? []).map((l: any) => ({
    id: l.id,
    date: (l.date ?? "").toString().slice(0, 10),
    driver_licence_checked: !!(l.driver_licence_checked),
    vehicle_checked: !!(l.vehicle_checked),
    incident_during_journey: !!(l.incident_during_journey),
    behaviour_during_journey: l.behaviour_during_journey ?? "good",
    passengers: (l.passengers ?? []).map((p: any) => ({ child_id: p.child_id ?? p.id ?? "" })),
  }));

  // ── Transport Risk Assessments ──────────────────────────────────────
  const transport_ras: TransportRAInput[] = ((store as any).transportRAs ?? []).map((ra: any) => ({
    id: ra.id,
    signedOffByRM: !!(ra.signedOffByRM),
    hazards: (ra.hazards ?? []).map((h: any) => ({ description: h.description ?? "" })),
    emergencyProcedure: ra.emergencyProcedure ?? "",
    breakdownProcedure: ra.breakdownProcedure ?? "",
    nextReviewDate: (ra.nextReviewDate ?? "").toString().slice(0, 10),
    inUseStatus: !!(ra.inUseStatus),
  }));

  // ── Independent Travel Records ──────────────────────────────────────
  const independent_travel_records: IndependentTravelInput[] = ((store as any).independentTravelRecords ?? []).map((r: any) => ({
    id: r.id,
    child_id: r.child_id ?? "",
    current_stage: r.current_stage ?? "stage_1_accompanied",
    routes_mastered: (r.routes_mastered ?? []).map((rm: any) => ({ route: rm.route ?? rm.name ?? "" })),
    child_confidence: r.child_confidence ?? "cautious",
    child_voice: r.child_voice ?? "",
    review_date: (r.review_date ?? "").toString().slice(0, 10),
  }));

  // ── Trip Plans ──────────────────────────────────────────────────────
  const trip_plans: TripPlanInput[] = ((store as any).tripPlans ?? []).map((t: any) => ({
    id: t.id,
    start_date: (t.start_date ?? "").toString().slice(0, 10),
    manager_approval: !!(t.manager_approval),
    social_worker_approval: (t.social_worker_approval ?? []).map((sw: any) => ({ approved: !!(sw.approved) })),
    risk_assessment: t.risk_assessment ? { completed: !!(t.risk_assessment.completed) } : null,
    children_views: t.children_views ?? "",
    post_trip_evaluation: t.post_trip_evaluation ? { completed: !!(t.post_trip_evaluation.completed) } : null,
    young_people: (t.young_people ?? []).map((yp: any) => ({ child_id: yp.child_id ?? yp.id ?? "" })),
    status: t.status ?? "planning",
  }));

  // ── Community Engagements ───────────────────────────────────────────
  const community_engagements: CommunityEngagementInput[] = ((store as any).communityEngagements ?? []).map((e: any) => ({
    id: e.id,
    date: (e.date ?? "").toString().slice(0, 10),
    young_people: e.young_people ?? [],
    activity_type: e.activity_type ?? "",
    outcomes: e.outcomes ?? [],
    child_feedback: e.child_feedback ?? "",
    builds_connections: !!(e.builds_connections),
    ongoing_commitment: !!(e.ongoing_commitment),
  }));

  const result = computeHomeCommunityAccess({
    today,
    transport_logs,
    transport_ras,
    independent_travel_records,
    trip_plans,
    community_engagements,
    total_children: store.youngPeople?.length ?? 0,
  });

  return NextResponse.json({ data: result });
}
