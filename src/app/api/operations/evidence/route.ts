import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listEvidence, createEvidenceItem, verifyEvidence,
  linkEvidence, getEvidenceLinks,
  getRegulationMappings,
  runInspectionReadinessScan, getLatestReadinessScan,
} from "@/lib/services/evidence-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  // Regulation mappings — no homeId needed
  if (type === "regulations") {
    const framework = searchParams.get("framework") as any ?? undefined;
    const result = await getRegulationMappings(framework);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // Inspection readiness
  if (type === "readiness") {
    const result = await getLatestReadinessScan(homeId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Evidence links for an entity
  if (type === "links") {
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
    }
    const result = await getEvidenceLinks(entityType, entityId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List evidence items
  const result = await listEvidence(homeId, {
    type: searchParams.get("evidenceType") as any ?? undefined,
    childId: searchParams.get("childId") ?? undefined,
    staffId: searchParams.get("staffId") ?? undefined,
    regulation_ref: searchParams.get("regulation") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    // Link evidence
    if (action === "link") {
      const { evidenceId, entityType, entityId, linkType, createdBy } = body;
      if (!evidenceId || !entityType || !entityId || !createdBy) {
        return NextResponse.json({ error: "evidenceId, entityType, entityId, createdBy required" }, { status: 400 });
      }
      const result = await linkEvidence(evidenceId, entityType, entityId, linkType ?? "supports", createdBy);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    // Verify evidence
    if (action === "verify") {
      const { evidenceId, verifiedBy, qualityScore, qualityNotes } = body;
      if (!evidenceId || !verifiedBy) {
        return NextResponse.json({ error: "evidenceId and verifiedBy required" }, { status: 400 });
      }
      const result = await verifyEvidence(evidenceId, verifiedBy, qualityScore, qualityNotes);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Run readiness scan
    if (action === "scan") {
      const { homeId, scanType, initiatedBy } = body;
      if (!homeId || !initiatedBy) {
        return NextResponse.json({ error: "homeId and initiatedBy required" }, { status: 400 });
      }
      const result = await runInspectionReadinessScan(homeId, scanType ?? "full", initiatedBy);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    // Create evidence item
    const { homeId, title, evidence_type, uploaded_by, ...rest } = body;
    if (!homeId || !title || !evidence_type || !uploaded_by) {
      return NextResponse.json({ error: "homeId, title, evidence_type, uploaded_by required" }, { status: 400 });
    }
    const result = await createEvidenceItem({ homeId, title, evidence_type, uploaded_by, ...rest });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
