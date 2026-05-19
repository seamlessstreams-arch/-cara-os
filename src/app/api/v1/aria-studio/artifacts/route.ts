import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";

const HOME_ID = "home_oak";

// GET /api/v1/aria-studio/artifacts
// Query params: status, artifact_type, child_id, home_id, limit, offset
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? HOME_ID;
  const status = searchParams.get("status");
  const artifactType = searchParams.get("artifact_type");
  const childId = searchParams.get("child_id");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  let items = db.ariaArtifacts.findAll(homeId);

  if (status) items = items.filter((a) => a.status === status);
  if (artifactType) items = items.filter((a) => a.artifact_type === artifactType);
  if (childId) items = items.filter((a) => a.child_id === childId);

  // Sort by created_at desc
  items = items.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const paginated = items.slice(offset, offset + limit);

  const stats = db.ariaArtifacts.stats(homeId);

  return NextResponse.json({
    data: paginated,
    meta: {
      offset,
      limit,
      ...stats,
    },
  });
}

// POST /api/v1/aria-studio/artifacts
// Creates a blank draft artifact (without AI generation)
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.artifact_type || !body.title || !body.created_by) {
    return NextResponse.json({ error: "artifact_type, title and created_by are required" }, { status: 400 });
  }

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.generate_drafts",
    homeId: (body.home_id as string) ?? HOME_ID,
    childId: (body.child_id as string) ?? null,
    intent: `create draft ${body.artifact_type}`,
  });
  if (!guard.ok) return guard.response;

  const artifact = db.ariaArtifacts.create({
    artifact_type: body.artifact_type as never,
    title: String(body.title),
    status: "draft",
    child_id: (body.child_id as string) ?? null,
    home_id: (body.home_id as string) ?? HOME_ID,
    staff_id: (body.staff_id as string) ?? null,
    incident_id: (body.incident_id as string) ?? null,
    linked_record_id: (body.linked_record_id as string) ?? null,
    linked_record_type: (body.linked_record_type as string) ?? null,
    framework: (body.framework as never) ?? "none",
    tone: (body.tone as never) ?? "professional",
    creative_mode: (body.creative_mode as never) ?? "balanced",
    generated_content: (body.generated_content as string) ?? "",
    structured_content: null,
    plain_text_content: null,
    quality_score: null,
    evidence_confidence_score: null,
    safeguarding_level: "none",
    regulation_relevance: [],
    source_ids: [],
    created_by: String(body.created_by),
    reviewed_by: null,
    approved_by: null,
    committed_by: null,
    rejected_by: null,
    submitted_for_review_at: null,
    reviewed_at: null,
    approved_at: null,
    committed_at: null,
    rejected_at: null,
    archived_at: null,
    version_number: 1,
    filing_cabinet_path: null,
    official_record_id: null,
    child_voice_present: false,
    quality_checks_passed: false,
    amendment_reason: null,
  });

  db.ariaStudioAuditLog.create({
    home_id: artifact.home_id,
    actor_id: String(body.created_by),
    action_type: "artifact_generated",
    artifact_id: artifact.id,
    source_ids: [],
    prompt_summary: `Manual draft created: ${artifact.title}`,
    model_provider: null,
    model_name: null,
    before_state: null,
    after_state: { status: "draft", id: artifact.id },
    ip_address: null,
  });

  return NextResponse.json({ data: artifact }, { status: 201 });
}
