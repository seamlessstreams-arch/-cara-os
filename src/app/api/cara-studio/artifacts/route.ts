// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/artifacts — List and create artifacts
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/lib/auth-guard";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(req: NextRequest) {
  try {
    const sb = createServerClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const artifactType = searchParams.get("artifact_type");
    const childId = searchParams.get("child_id");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const offset = (page - 1) * limit;

    if (!sb) {
      // Demo data
      return NextResponse.json({ data: [], total: 0, page, limit });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (sb.from("cara_studio_artifacts") as any)
      .select("*", { count: "exact" })
      .eq("home_id", homeId())
      .neq("status", "deleted_recoverable")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (artifactType) query = query.eq("artifact_type", artifactType);
    if (childId) query = query.eq("child_id", childId);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    console.error("[cara-studio/artifacts] GET error:", err);
    return NextResponse.json({ error: "Failed to list artifacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = createServerClient();
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const userId = getUserIdFromRequest(req);

    if (!body.title || !body.artifact_type) {
      return NextResponse.json({ error: "title and artifact_type are required" }, { status: 400 });
    }

    if (!sb) {
      return NextResponse.json({
        data: { id: crypto.randomUUID(), ...body, status: "draft", created_by: userId, created_at: new Date().toISOString() },
      }, { status: 201 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from("cara_studio_artifacts") as any)
      .insert({
        home_id: homeId(),
        artifact_type: body.artifact_type,
        title: body.title,
        status: "draft",
        child_id: body.child_id ?? null,
        staff_id: body.staff_id ?? null,
        framework: body.framework ?? null,
        tone: body.tone ?? "balanced",
        creative_mode: body.creative_mode ?? "balanced",
        generated_content: body.generated_content ?? null,
        plain_text_content: body.generated_content ?? null,
        created_by: userId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[cara-studio/artifacts] POST error:", err);
    return NextResponse.json({ error: "Failed to create artifact" }, { status: 500 });
  }
}
