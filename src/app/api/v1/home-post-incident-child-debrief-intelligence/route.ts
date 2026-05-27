import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computePostIncidentDebrief } from "@/lib/engines/home-post-incident-child-debrief-intelligence-engine";
import type { PostIncidentDebriefRecordInput } from "@/lib/engines/home-post-incident-child-debrief-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore();
    const raw = store.postIncidentChildDebriefs as any[];
    const total_children = (store.youngPeople ?? []).length;
    const today = new Date().toISOString().slice(0, 10);

    const debriefs: PostIncidentDebriefRecordInput[] = raw.map((r: any) => ({
      id: r.id,
      child_id: r.child_id,
      incident_date: r.incident_date ? r.incident_date.toString().slice(0, 10) : "",
      debrief_date: r.debrief_date ? r.debrief_date.toString().slice(0, 10) : "",
      debrief_method: r.debrief_method || "conversation",
      child_ready_to_debrief: !!r.child_ready_to_debrief,
      has_child_account: !!(r.child_account_of_what_happened && r.child_account_of_what_happened.trim()),
      has_feelings_before_during: !!(r.child_feelings_before_during && r.child_feelings_before_during.trim()),
      has_feelings_now: !!(r.child_feelings_now && r.child_feelings_now.trim()),
      has_wishes_different: !!(r.what_child_wishes_had_been_different && r.what_child_wishes_had_been_different.trim()),
      what_helped_count: Array.isArray(r.what_helped_child) ? r.what_helped_child.length : 0,
      what_did_not_help_count: Array.isArray(r.what_did_not_help) ? r.what_did_not_help.length : 0,
      child_requests_count: Array.isArray(r.child_requests_for_future) ? r.child_requests_for_future.length : 0,
      has_apologies_offered: !!(r.apologies_offered && r.apologies_offered.trim()),
      has_apologies_received: !!(r.apologies_received && r.apologies_received.trim()),
      repairs_agreed_count: Array.isArray(r.repairs_agreed) ? r.repairs_agreed.length : 0,
      child_accepts_outcome: !!r.child_accepts_outcome,
      has_support_needed: !!(r.support_needed_now && r.support_needed_now.trim()),
      has_follow_up_date: !!r.follow_up_date,
    }));

    const result = computePostIncidentDebrief({ today, total_children, debriefs });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
