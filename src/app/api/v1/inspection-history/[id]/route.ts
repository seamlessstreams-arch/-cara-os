import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// PATCH /api/v1/inspection-history/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = db.inspectionHistory.update(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
