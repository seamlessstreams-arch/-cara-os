import { readJsonBody } from "@/lib/http/read-json";
import { enumParam } from "@/lib/http/enum-param";
import { FORM_CATEGORY_VALUES, FORM_SUBMISSION_STATUS_VALUES } from "@/types/operations";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listFormSubmissions,
  createFormSubmission,
  listFormTemplates,
} from "@/lib/services/form-governance";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const categoryParam = enumParam("category", searchParams.get("category"), FORM_CATEGORY_VALUES);
  if (!categoryParam.ok) return categoryParam.response;
  const homeId = searchParams.get("homeId");
  const templateId = searchParams.get("templateId");
  const statusParam = enumParam("status", searchParams.get("status"), FORM_SUBMISSION_STATUS_VALUES);
  if (!statusParam.ok) return statusParam.response;
  const childId = searchParams.get("childId");
  const type = searchParams.get("type"); // "templates" to list templates

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  if (type === "templates") {
    const result = await listFormTemplates(homeId, {
      category: categoryParam.value,
      active_only: searchParams.get("active_only") !== "false",
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  const result = await listFormSubmissions(homeId, {
    templateId: templateId ?? undefined,
    status: statusParam.value,
    childId: childId ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
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
