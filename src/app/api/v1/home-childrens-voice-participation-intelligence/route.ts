import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeChildrensVoiceParticipation,
  type ChildrensMeetingInput,
  type ChildFeedbackInput,
  type ChildFriendlyPolicyInput,
  type ChildExpertInput,
} from "@/lib/engines/home-childrens-voice-participation-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.youngPeople ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Children's meeting records → ChildrensMeetingInput[]
  const rawMeetings = (store.childrensMeetingRecords as any[] ?? []);
  const meetings: ChildrensMeetingInput[] = rawMeetings.map((m: any) => {
    const present = (m.yp_present ?? []) as any[];
    const absent = (m.yp_absent ?? []) as any[];
    return {
      id: m.id ?? "",
      date: (m.date ?? "").toString().slice(0, 10),
      total_children_invited: present.length + absent.length,
      total_children_attended: present.length,
      child_chaired: !!(m.child_chair),
      child_minute_taker: !!(m.child_minute_taker),
      actions_count: ((m.actions ?? []) as any[]).length,
    };
  });

  // Child staff feedback → ChildFeedbackInput[]
  const rawFeedback = (store.childStaffFeedback as any[] ?? []);
  const feedback: ChildFeedbackInput[] = rawFeedback.map((f: any) => ({
    id: f.id ?? "",
    child_id: f.child_id ?? "",
    sentiment: f.feedback_sentiment ?? "neutral",
    responded_to: !!(f.staff_response),
    response_timely: !!(f.staff_response && f.staff_member_informed),
  }));

  // Child-friendly policies → ChildFriendlyPolicyInput[]
  const rawPolicies = (store.childFriendlyPolicies as any[] ?? []);
  const policies: ChildFriendlyPolicyInput[] = rawPolicies.map((p: any) => ({
    id: p.id ?? "",
    title: p.title ?? "",
    format: p.format ?? "text",
    audience_age: p.audience_age ?? "all",
    has_plain_english_summary: !!(p.plain_english_summary),
    has_what_this_means: ((p.what_this_means ?? []) as any[]).length > 0,
    has_your_rights: ((p.your_rights ?? []) as any[]).length > 0,
  }));

  // Child expert entries → ChildExpertInput[]
  const rawExperts = (store.childExpertEntries as any[] ?? []);
  const experts: ChildExpertInput[] = rawExperts.map((e: any) => ({
    id: e.id ?? "",
    child_id: e.child_id ?? "",
    date: (e.date ?? "").toString().slice(0, 10),
    expertise: e.expertise ?? "",
    contribution: e.contribution ?? "",
    impact_recorded: !!(e.impact_recorded),
  }));

  const result = computeChildrensVoiceParticipation({
    today,
    total_children: (children as any[]).length,
    meetings,
    feedback,
    policies,
    experts,
  });

  return NextResponse.json({ data: result });
}
