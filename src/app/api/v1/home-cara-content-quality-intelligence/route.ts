// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME Cara CONTENT QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/home-cara-content-quality-intelligence
// Synthesises Cara artifacts to assess AI-assisted content quality, governance,
// review turnaround, safeguarding awareness, and framework diversity.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeCaraContentQuality,
  type CaraArtifactInput,
} from "@/lib/engines/home-cara-content-quality-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.is_active !== false).length;

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.length;

    // Cara artifacts
    const rawArtifacts = (store.caraArtifacts ?? []) as any[];
    const artifacts: CaraArtifactInput[] = rawArtifacts.map((a: any) => ({
      id: a.id ?? "",
      artifact_type: a.artifact_type ?? "general",
      status: a.status ?? "draft",
      child_id: a.child_id ?? null,
      staff_id: a.staff_id ?? null,
      framework: a.framework ?? null,
      quality_score: typeof a.quality_score === "number" ? a.quality_score : 0,
      evidence_confidence_score: typeof a.evidence_confidence_score === "number" ? a.evidence_confidence_score : 0,
      safeguarding_level: a.safeguarding_level ?? "none",
      created_at: (a.created_at ?? today).toString(),
      submitted_for_review_at: a.submitted_for_review_at ?? null,
      reviewed_at: a.reviewed_at ?? null,
      approved_at: a.approved_at ?? a.reviewed_at ?? null,
      rejected_by: a.rejected_by ?? null,
      has_structured_content: a.structured_content != null && a.structured_content !== "",
      has_plain_text: a.plain_text_content != null && a.plain_text_content !== "",
      source_ids_count: Array.isArray(a.source_ids) ? a.source_ids.length : 0,
    }));

    const result = computeCaraContentQuality({ today, total_staff, total_children, artifacts });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
