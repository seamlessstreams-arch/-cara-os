import { NextRequest, NextResponse } from "next/server";
import { generateRoleVersion, generateAllRoleVersions, getAvailableRoles } from "@/lib/cara-studio/role-output.service";
import type { OutputRole } from "@/lib/cara-studio/role-output.service";
import type { CaraStudioArtifact } from "@/types/cara-studio";

export async function GET(req: NextRequest) {
  try {
    const artifactType = req.nextUrl.searchParams.get("artifactType");

    if (!artifactType) {
      return NextResponse.json({ error: "artifactType is required" }, { status: 400 });
    }

    const roles = getAvailableRoles(artifactType);
    return NextResponse.json({ roles });
  } catch (err) {
    console.error("[api/cara-studio/role-output] Error:", err);
    return NextResponse.json({ error: "Failed to get available roles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artifact, role, roles } = body as {
      artifact: CaraStudioArtifact;
      role?: OutputRole;
      roles?: OutputRole[];
    };

    if (!artifact) {
      return NextResponse.json({ error: "artifact is required" }, { status: 400 });
    }

    if (role) {
      const version = generateRoleVersion(artifact, role);
      return NextResponse.json(version);
    }

    const versions = generateAllRoleVersions(artifact, roles);
    return NextResponse.json({ versions });
  } catch (err) {
    console.error("[api/cara-studio/role-output] Error:", err);
    return NextResponse.json({ error: "Failed to generate role output" }, { status: 500 });
  }
}
