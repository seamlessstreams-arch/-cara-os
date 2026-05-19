import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id");
  const data = homeId
    ? db.riGovernanceReports.findByHome(homeId)
    : db.riGovernanceReports.findAll();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.id && db.riGovernanceReports.findById(body.id)) {
    const updated = db.riGovernanceReports.patch(body.id, body);
    return NextResponse.json({ data: updated });
  }
  const record = db.riGovernanceReports.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
