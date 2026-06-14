import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const projectId = req.nextUrl.searchParams.get("project_id");
  const resources = projectId
    ? intelligenceDb.generatedResources.findByProject(projectId)
    : intelligenceDb.generatedResources.findAll(homeId);
  return NextResponse.json({
    data: resources,
    meta: { total: resources.length, approved: resources.filter((r) => r.status === "approved" || r.status === "published").length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = intelligenceDb.generatedResources.create({
    home_id: body.home_id ?? "home_oak",
    resource_type: body.resource_type ?? "guidance_note",
    title: body.title ?? "New Resource",
    content: body.content ?? {},
    status: "draft",
    cara_generated: body.cara_generated ?? true,
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
