import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  let items = db.maintenance.findAll();
  if (status) items = items.filter((m) => m.status === status);
  if (priority) items = items.filter((m) => m.priority === priority);

  return NextResponse.json({
    data: items,
    meta: {
      total: items.length,
      open: items.filter((m) => m.status === "open").length,
      scheduled: items.filter((m) => m.status === "scheduled").length,
      completed: items.filter((m) => m.status === "completed").length,
      urgent: items.filter((m) => m.priority === "urgent" && m.status !== "completed").length,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = db.maintenance.create({
    ...body,
    status: "open",
    home_id: "home_oak",
    created_by: body.created_by || "staff_darren",
    updated_by: body.created_by || "staff_darren",
  });
  return NextResponse.json({ data: item }, { status: 201 });
}
