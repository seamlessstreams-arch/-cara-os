// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/quality-check — Run quality checks on an artifact
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { runQualityCheck } from "@/lib/cara-studio/quality-check.service";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.artifact_id) {
      return NextResponse.json({ error: "artifact_id is required" }, { status: 400 });
    }

    // Get artifact content
    let content = body.content ?? "";
    if (!content) {
      const sb = createServerClient();
      if (sb) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (sb.from("cara_studio_artifacts") as any)
          .select("generated_content").eq("id", body.artifact_id).single();
        content = data?.generated_content ?? "";
      }
    }

    const result = await runQualityCheck(body.artifact_id, content);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[cara-studio/quality-check] Error:", err);
    return NextResponse.json({ error: "Failed to run quality check" }, { status: 500 });
  }
}
