import { NextRequest, NextResponse } from "next/server";
import { scanChildVoice, getChildVoiceSummary } from "@/lib/aria-studio/child-voice.service";

export async function GET(req: NextRequest) {
  try {
    const childId = req.nextUrl.searchParams.get("childId");
    const mode = req.nextUrl.searchParams.get("mode") ?? "scan";

    if (!childId) {
      return NextResponse.json({ error: "childId is required" }, { status: 400 });
    }

    if (mode === "summary") {
      const summary = await getChildVoiceSummary(childId);
      return NextResponse.json(summary);
    }

    const entries = await scanChildVoice(childId);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[api/aria-studio/child-voice] Error:", err);
    return NextResponse.json({ error: "Failed to scan child voice" }, { status: 500 });
  }
}
