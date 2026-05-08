import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  return NextResponse.json({ data: db.foodBudgetWeekRecords.findAll() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.id) {
    const updated = db.foodBudgetWeekRecords.update(body.id, body);
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(db.foodBudgetWeekRecords.create(body), { status: 201 });
}
