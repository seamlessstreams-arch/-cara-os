import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id") ?? undefined;
  return NextResponse.json(db.pocketMoneyTransactions.getAll(childId));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.pocketMoneyTransactions.create(body);
  return NextResponse.json(record, { status: 201 });
}
