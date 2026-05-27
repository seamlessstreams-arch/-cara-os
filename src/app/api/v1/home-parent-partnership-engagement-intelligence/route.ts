import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeParentPartnershipEngagement,
  type ParentContactInput,
} from "@/lib/engines/home-parent-partnership-engagement-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Parent partnership records → ParentContactInput[]
  const rawContacts = (store.parentPartnershipRecords as any[] ?? []);
  const contacts: ParentContactInput[] = rawContacts.map((c: any) => ({
    id: c.id ?? "",
    child_id: c.child_id ?? "",
    relationship_type: c.relationship_type ?? "other",
    contact_type: c.contact_type ?? "phone_call",
    engagement_level: c.engagement_level ?? "neutral",
    positive_outcomes_count: (c.positive_outcomes ?? []).length,
    follow_up_actions_count: (c.follow_up_actions ?? []).length,
    sw_informed: !!(c.sw_informed),
    has_concerns: !!(c.concerns && c.concerns.trim().length > 0),
  }));

  const result = computeParentPartnershipEngagement({
    today,
    total_children: (children as any[]).length,
    contacts,
  });

  return NextResponse.json({ data: result });
}
