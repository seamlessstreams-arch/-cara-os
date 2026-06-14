import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

const HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const homeId = searchParams.get("home_id") ?? HOME_ID;

  let jobs = intelligenceDb.docJobs.findAll(homeId);
  if (status) jobs = jobs.filter((j) => j.status === status);

  return NextResponse.json({
    data: jobs,
    meta: {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      classified: jobs.filter((j) => j.status === "classified").length,
      placed: jobs.filter((j) => j.status === "placed").length,
    },
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const job = intelligenceDb.docJobs.create({
    home_id: HOME_ID,
    original_filename: (body.original_filename as string) || "untitled",
    file_size_bytes: (body.file_size_bytes as number) ?? null,
    mime_type: (body.mime_type as string) ?? null,
    extracted_text: (body.extracted_text as string) ?? null,
    status: "pending",
    classification: (body.classification as Record<string, unknown>) ?? null,
    suggested_module: (body.suggested_module as string) ?? null,
    suggested_child_id: (body.suggested_child_id as string) ?? null,
    suggested_form_type: (body.suggested_form_type as string) ?? null,
    suggested_tags: (body.suggested_tags as string[]) ?? [],
    confidence_score: (body.confidence_score as number) ?? null,
    reviewed_by: null,
    reviewed_at: null,
    placed_at: null,
    placement_ref_type: null,
    placement_ref_id: null,
    cara_notes: (body.cara_notes as string) ?? null,
    created_by: (body.created_by as string) ?? "staff_darren",
  });

  return NextResponse.json({ data: job }, { status: 201 });
}
