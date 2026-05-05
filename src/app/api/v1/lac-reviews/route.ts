import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  let list = db.lacReviews.findAll();
  if (childId) list = list.filter((r) => r.child_id === childId);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = list.filter((r) => r.next_review_date < today).length;
  const nextDue = list
    .filter((r) => r.next_review_date >= today)
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date))[0]?.next_review_date ?? null;

  return NextResponse.json({
    data: list,
    meta: { total: list.length, overdue, next_due_date: nextDue },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.child_id || !body.review_type) {
    return NextResponse.json({ error: "child_id and review_type required" }, { status: 400 });
  }
  const record = db.lacReviews.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const updated = db.lacReviews.update(id, data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
