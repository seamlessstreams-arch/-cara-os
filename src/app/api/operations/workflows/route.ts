import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listWorkflows, initiateWorkflow,
  WORKFLOW_TEMPLATES,
} from "@/lib/services/workflow-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");

  // Return available templates (no homeId needed)
  if (searchParams.get("templates") === "true") {
    return NextResponse.json({
      ok: true,
      data: WORKFLOW_TEMPLATES.map((t) => ({
        code: t.code,
        title: t.title,
        description: t.description,
        category: t.category,
        regulation_refs: t.regulation_refs,
        step_count: t.steps.length,
      })),
    });
  }

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listWorkflows(homeId, {
    status: searchParams.get("status") as any ?? undefined,
    template_code: searchParams.get("template") ?? undefined,
    linked_child_id: searchParams.get("childId") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeId, templateCode, title, linked_child_id, linked_incident_id, due_date, metadata, initiated_by } = body;

    if (!homeId || !templateCode || !initiated_by) {
      return NextResponse.json({ error: "homeId, templateCode, and initiated_by are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    const result = await initiateWorkflow({
      homeId, templateCode, title,
      linked_child_id, linked_incident_id, due_date, metadata, initiated_by,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
