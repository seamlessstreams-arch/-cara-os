import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");
  let list = db.behaviourSupportPlans.findAll();
  if (childId) list = list.filter((r) => r.child_id === childId);

  const active = list.filter((r) => r.status === "active").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueReviews = list.filter((r) => r.status === "active" && r.review_date < today).length;

  return NextResponse.json({
    data: list,
    meta: { total: list.length, active, overdue_reviews: overdueReviews },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.child_id) {
    return NextResponse.json({ error: "child_id required" }, { status: 400 });
  }
  const record = db.behaviourSupportPlans.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const updated = db.behaviourSupportPlans.update(id, data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
