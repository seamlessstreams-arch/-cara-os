import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// GET /api/v1/daily-log/:id — return a single daily log entry by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = db.dailyLog.findAll().find((e) => e.id === id);
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  return NextResponse.json({ data: entry });
}
