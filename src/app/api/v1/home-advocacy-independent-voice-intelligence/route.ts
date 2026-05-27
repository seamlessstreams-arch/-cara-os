import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeAdvocacyIndependentVoice } from "@/lib/engines/home-advocacy-independent-voice-intelligence-engine";
import type { AdvocacyRecordInput } from "@/lib/engines/home-advocacy-independent-voice-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore();
    const raw = store.advocacyRecords as any[];
    const total_children = (store.youngPeople ?? []).length;

    const records: AdvocacyRecordInput[] = raw.map((r: any) => ({
      id: r.id,
      child_id: r.child_id,
      advocacy_type: r.advocacy_type ?? "independent",
      status: r.status ?? "pending_referral",
      has_visits: Array.isArray(r.visits) && r.visits.length > 0,
      visit_count: Array.isArray(r.visits) ? r.visits.length : 0,
      private_session_count: Array.isArray(r.visits) ? r.visits.filter((v: any) => v.private_session).length : 0,
      actions_raised_count: Array.isArray(r.visits) ? r.visits.reduce((sum: number, v: any) => sum + (Array.isArray(v.actions_raised) ? v.actions_raised.length : 0), 0) : 0,
      has_child_view: !!(r.child_view && r.child_view.trim().length > 0),
      has_home_response: !!(r.home_response && r.home_response.trim().length > 0),
      issues_raised_count: Array.isArray(r.issues_raised) ? r.issues_raised.length : 0,
    }));

    const result = computeAdvocacyIndependentVoice({ today: new Date().toISOString().slice(0, 10), total_children, records });
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
