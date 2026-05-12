import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listFormSubmissions,
  createFormSubmission,
  listFormTemplates,
} from "@/lib/services/form-governance";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const templateId = searchParams.get("templateId");
  const status = searchParams.get("status");
  const childId = searchParams.get("childId");
  const type = searchParams.get("type"); // "templates" to list templates

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  if (type === "templates") {
    const result = await listFormTemplates(homeId, {
      category: searchParams.get("category") as any ?? undefined,
      active_only: searchParams.get("active_only") !== "false",
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  const result = await listFormSubmissions(homeId, {
    templateId: templateId ?? undefined,
    status: status as any ?? undefined,
    childId: childId ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeId, templateId, versionId, data, linked_child_id, linked_staff_id, due_date, priority, created_by } = body;

    if (!homeId || !templateId || !versionId || !data || !created_by) {
      return NextResponse.json({ error: "homeId, templateId, versionId, data, and created_by are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    const result = await createFormSubmission({
      homeId, templateId, versionId, data,
      linked_child_id, linked_staff_id, due_date, priority, created_by,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
