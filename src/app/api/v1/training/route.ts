import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let records = db.training.findAll();

  if (staffId) records = records.filter((r) => r.staff_id === staffId);
  if (status) records = records.filter((r) => r.status === status);
  if (category) records = records.filter((r) => r.category === category);

  const total = records.length;
  const compliant = records.filter((r) => r.status === "compliant").length;
  const expiring = records.filter((r) => r.status === "expiring_soon").length;
  const expired = records.filter((r) => r.status === "expired").length;
  const notStarted = records.filter((r) => r.status === "not_started").length;

  return NextResponse.json({
    data: records.sort((a, b) => {
      const statusOrder = { expired: 0, expiring_soon: 1, not_started: 2, compliant: 3 };
      return (statusOrder[a.status as keyof typeof statusOrder] ?? 4) -
             (statusOrder[b.status as keyof typeof statusOrder] ?? 4);
    }),
    meta: {
      total,
      compliant,
      expiring,
      expired,
      not_started: notStarted,
      rate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();

  // Auto-derive status from dates if not explicitly supplied
  let status = body.status ?? "not_started";
  if (body.completed_date && body.expiry_date) {
    const expiry = new Date(body.expiry_date);
    const today = new Date();
    const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil < 0) status = "expired";
    else if (daysUntil <= 90) status = "expiring_soon";
    else status = "compliant";
  } else if (body.completed_date && !body.expiry_date) {
    status = "compliant";
  }

  const record = {
    ...body,
    id: generateId("trn"),
    status,
    created_at: now,
    updated_at: now,
  };

  db.training.create(record);
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updated = db.training.patch(id, { ...updates, updated_at: new Date().toISOString() });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
