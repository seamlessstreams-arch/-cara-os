import { NextRequest, NextResponse } from "next/server";
import { fileCommittedArtifact, listFiledArtifacts, getFilingStructure } from "@/lib/aria-studio/filing-cabinet.service";

export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("mode") ?? "structure";
    const childId = req.nextUrl.searchParams.get("childId") ?? undefined;
    const pathPrefix = req.nextUrl.searchParams.get("path") ?? undefined;

    if (mode === "list" && pathPrefix) {
      const artifacts = await listFiledArtifacts(pathPrefix);
      return NextResponse.json({ artifacts });
    }

    const structure = await getFilingStructure(childId);
    return NextResponse.json({ structure });
  } catch (err) {
    console.error("[api/aria-studio/filing-cabinet] Error:", err);
    return NextResponse.json({ error: "Failed to get filing cabinet" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artifactId } = body;

    if (!artifactId) {
      return NextResponse.json({ error: "artifactId is required" }, { status: 400 });
    }

    const result = await fileCommittedArtifact(artifactId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/aria-studio/filing-cabinet] Error:", err);
    return NextResponse.json({ error: "Failed to file artifact" }, { status: 500 });
  }
}
