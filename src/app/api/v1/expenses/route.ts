import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const submittedBy = searchParams.get("submitted_by");

  let expenses = db.expenses.findAll();
  if (status) expenses = expenses.filter((e) => e.status === status);
  if (submittedBy) expenses = expenses.filter((e) => e.submitted_by === submittedBy);

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const pending = expenses.filter((e) => e.status === "submitted");

  return NextResponse.json({
    data: expenses,
    meta: {
      total_count: expenses.length,
      pending_count: pending.length,
      total_amount: total,
      pending_amount: pending.reduce((a, e) => a + e.amount, 0),
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const expense = db.expenses.create({ ...body, status: "draft", home_id: "home_oak" });
  return NextResponse.json({ data: expense }, { status: 201 });
}
