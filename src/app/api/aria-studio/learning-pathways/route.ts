import { NextRequest, NextResponse } from "next/server";
import { generateStaffPathway, getLearningPathwaySummary } from "@/lib/aria-studio/learning-pathway.service";

export async function GET(req: NextRequest) {
  try {
    const staffId = req.nextUrl.searchParams.get("staffId");

    if (staffId) {
      const pathway = await generateStaffPathway(staffId);
      return NextResponse.json(pathway);
    }

    const summary = await getLearningPathwaySummary();
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[api/aria-studio/learning-pathways] Error:", err);
    return NextResponse.json({ error: "Failed to get learning pathway data" }, { status: 500 });
  }
}
