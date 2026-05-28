// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FAMILY & SOCIAL CONNECTIVITY INTELLIGENCE API ROUTE
// GET /api/v1/home-family-social-connectivity-intelligence
// Cross-domain composite: familyTimeSessions + contactPlans +
// parentPartnershipRecords + socialWorkerContactRecords + siblingContactProtocolRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeFamilySocialConnectivity,
  type FamilyTimeSessionInput,
  type ContactPlanInput,
  type ParentPartnershipRecordInput,
  type SocialWorkerContactInput,
  type SiblingContactProtocolInput,
} from "@/lib/engines/home-family-social-connectivity-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawSessions = (store.familyTimeSessions ?? []) as any[];
    const family_time_sessions: FamilyTimeSessionInput[] = rawSessions.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      session_date: (s.session_date ?? s.date ?? today).toString(),
      session_type: s.session_type ?? s.type ?? "face_to_face",
      family_member: s.family_member ?? s.contact_name ?? "",
      duration_minutes: s.duration_minutes ?? s.duration ?? 60,
      quality_rating: s.quality_rating ?? 3,
      child_voice_captured: !!s.child_voice_captured,
      child_enjoyed: s.child_enjoyed !== false,
      post_contact_distress: !!s.post_contact_distress,
      follow_up_actions: s.follow_up_actions ?? null,
      staff_id: s.staff_id ?? "",
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawPlans = (store.contactPlans ?? []) as any[];
    const contact_plans: ContactPlanInput[] = rawPlans.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      contact_type: p.contact_type ?? "face_to_face",
      frequency: p.frequency ?? "weekly",
      status: p.status ?? "active",
      last_reviewed: p.last_reviewed ?? null,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawPartnership = (store.parentPartnershipRecords ?? []) as any[];
    const parent_partnership_records: ParentPartnershipRecordInput[] = rawPartnership.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      parent_name: r.parent_name ?? "",
      engagement_level: r.engagement_level ?? "medium",
      communication_method: r.communication_method ?? "phone",
      last_contact_date: (r.last_contact_date ?? today).toString(),
      partnership_quality: r.partnership_quality ?? "neutral",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSW = (store.socialWorkerContactRecords ?? []) as any[];
    const social_worker_contacts: SocialWorkerContactInput[] = rawSW.map((c: any) => ({
      id: c.id ?? "",
      child_id: c.child_id ?? "",
      contact_date: (c.contact_date ?? c.date ?? today).toString(),
      contact_type: c.contact_type ?? "visit",
      purpose: c.purpose ?? "",
      child_seen: c.child_seen !== false,
      outcome_recorded: !!c.outcome_recorded,
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawSibling = (store.siblingContactProtocolRecords ?? []) as any[];
    const sibling_contact_protocols: SiblingContactProtocolInput[] = rawSibling.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      sibling_name: s.sibling_name ?? "",
      contact_frequency: s.contact_frequency ?? "monthly",
      last_contact_date: s.last_contact_date ?? null,
      protocol_status: s.protocol_status ?? s.status ?? "active",
      contact_maintained: s.contact_maintained !== false,
      created_at: (s.created_at ?? today).toString(),
    }));

    const result = computeFamilySocialConnectivity({
      today,
      total_children,
      total_staff: ((store.staff ?? []) as any[]).filter((s: any) => s.is_active !== false).length,
      family_time_sessions,
      contact_plans,
      parent_partnership_records,
      social_worker_contacts,
      sibling_contact_protocols,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
