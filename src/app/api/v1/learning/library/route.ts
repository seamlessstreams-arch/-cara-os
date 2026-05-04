import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const entries = intelligenceDb.resourceLibrary.findAll(homeId);
  return NextResponse.json({
    data: entries,
    meta: { total: entries.length, approved: entries.filter((e) => e.is_approved).length, pinned: entries.filter((e) => e.is_pinned).length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = intelligenceDb.resourceLibrary.create({
    home_id: body.home_id ?? "home_oak",
    resource_id: body.resource_id ?? "",
    resource_type: body.resource_type ?? "guidance_note",
    title: body.title ?? "Resource",
    is_approved: body.is_approved ?? false,
    is_pinned: body.is_pinned ?? false,
    usage_count: 0,
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
