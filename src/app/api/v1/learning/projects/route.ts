import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const projects = intelligenceDb.learningProjects.findAll(homeId);
  return NextResponse.json({
    data: projects,
    meta: { total: projects.length, active: projects.filter((p) => p.status === "active").length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = intelligenceDb.learningProjects.create({
    home_id: body.home_id ?? "home_oak",
    project_name: body.project_name ?? "New Project",
    pathway: body.pathway ?? "staff",
    topic: body.topic ?? "",
    risk_level: body.risk_level ?? "low",
    reading_level: body.reading_level ?? "standard",
    tone: body.tone ?? "professional",
    status: "active",
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
