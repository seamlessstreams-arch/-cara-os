import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeAttachmentProfile } from "@/lib/engines/home-attachment-profile-intelligence-engine";
import type { AttachmentProfileRecordInput } from "@/lib/engines/home-attachment-profile-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore();
    const raw = store.attachmentProfiles as any[];
    const total_children = (store.youngPeople ?? []).length;
    const today = new Date().toISOString().slice(0, 10);

    const profiles: AttachmentProfileRecordInput[] = raw.map((r: any) => {
      const behaviours = Array.isArray(r.behaviours) ? r.behaviours : [];
      const relationships = Array.isArray(r.key_relationships) ? r.key_relationships : [];

      return {
        id: r.id,
        child_id: r.child_id,
        status: r.status || "active",
        primary_style: r.primary_style || "secure",
        has_secondary_patterns: Array.isArray(r.secondary_patterns) && r.secondary_patterns.length > 0,
        has_assessed_by: !!(r.assessed_by && r.assessed_by.trim()),
        assessment_date: r.assessment_date ? r.assessment_date.toString().slice(0, 10) : "",
        has_review_date: !!r.review_date,
        review_date: r.review_date ? r.review_date.toString().slice(0, 10) : "",
        has_early_history: !!(r.early_history && r.early_history.trim()),
        has_placement_history: !!(r.placement_history && r.placement_history.trim()),
        behaviour_count: behaviours.length,
        behaviours_with_need_count: behaviours.filter(
          (b: any) => b.underlying_need && b.underlying_need.trim(),
        ).length,
        behaviours_with_response_count: behaviours.filter(
          (b: any) => b.recommended_response && b.recommended_response.trim(),
        ).length,
        key_relationship_count: relationships.length,
        strong_relationship_count: relationships.filter(
          (rel: any) => rel.quality === "strong",
        ).length,
        strained_relationship_count: relationships.filter(
          (rel: any) => rel.quality === "strained",
        ).length,
        therapeutic_approach_count: Array.isArray(r.therapeutic_approach) ? r.therapeutic_approach.length : 0,
        staff_guidance_count: Array.isArray(r.staff_guidance) ? r.staff_guidance.length : 0,
        protective_factor_count: Array.isArray(r.protective_factors) ? r.protective_factors.length : 0,
        risk_factor_count: Array.isArray(r.risk_factors) ? r.risk_factors.length : 0,
        has_child_views: !!(r.child_views && r.child_views.trim()),
        has_professional_input: !!(r.professional_input && r.professional_input.trim()),
      };
    });

    const result = computeAttachmentProfile({ today, total_children, profiles });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
