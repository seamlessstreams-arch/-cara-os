import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStakeholderEngagementFeedback,
  type StakeholderFeedbackInput,
  type ParentPartnershipInput,
  type CommunityFeedbackInput,
} from "@/lib/engines/home-stakeholder-engagement-feedback-intelligence-engine";

export const dynamic = "force-dynamic";

const ENGAGEMENT_MAP: Record<string, string> = {
  positive: "strong",
  neutral: "developing",
  difficult: "limited",
  disengaged: "none",
  hostile: "none",
};

export async function GET() {
  const store = getStore();
  const children = store.children ?? store.youngPeople ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Stakeholder feedback records
  const rawFeedback = (store.stakeholderFeedbackRecords as any[] ?? []);
  const stakeholder_feedback: StakeholderFeedbackInput[] = rawFeedback.map((s: any) => ({
    id: s.id ?? "",
    date: (s.date ?? today).toString().slice(0, 10),
    source: s.source ?? "community",
    sentiment: s.sentiment === "mixed" ? "neutral" : (s.sentiment ?? "neutral"),
    action_taken: !!(s.action_taken),
    responded_to: !!(s.response_date),
  }));

  // Also include visitors feedback as stakeholder feedback
  const rawVisitors = (store.visitorsFeedbackRecords as any[] ?? []);
  const visitorFeedback: StakeholderFeedbackInput[] = rawVisitors.map((v: any) => ({
    id: v.id ?? "",
    date: (v.date ?? v.visit_date ?? today).toString().slice(0, 10),
    source: "visitor",
    sentiment: v.sentiment === "mixed" ? "neutral" : (v.sentiment ?? v.overall_impression ?? "neutral"),
    action_taken: !!(v.action_taken ?? v.actions_required),
    responded_to: !!(v.response_date ?? v.acknowledged),
  }));

  // Parent partnership records
  const rawParent = (store.parentPartnershipRecords as any[] ?? []);
  const parent_partnerships: ParentPartnershipInput[] = rawParent.map((p: any) => ({
    id: p.id ?? "",
    child_id: p.child_id ?? "",
    date: (p.date ?? today).toString().slice(0, 10),
    engagement_quality: ENGAGEMENT_MAP[p.engagement_level] ?? "developing",
    contact_maintained: true,
    views_sought: p.initiated_by === "home" || p.initiated_by === "social_worker",
  }));

  // Community feedback records
  const rawCommunity = (store.communityFeedbackRecords as any[] ?? []);
  const community_feedback: CommunityFeedbackInput[] = rawCommunity.map((c: any) => {
    const type = c.feedback_type ?? "";
    const sentiment = (type === "compliment" || type === "recognition") ? "positive"
      : (type === "concern" || type === "complaint") ? "negative"
      : "neutral";
    return {
      id: c.id ?? "",
      date: (c.date_received ?? today).toString().slice(0, 10),
      sentiment,
      responded_to: !!(c.response_sent),
    };
  });

  const result = computeStakeholderEngagementFeedback({
    today,
    total_children: (children as any[]).length,
    stakeholder_feedback: [...stakeholder_feedback, ...visitorFeedback],
    parent_partnerships,
    community_feedback,
  });

  return NextResponse.json({ data: result });
}
