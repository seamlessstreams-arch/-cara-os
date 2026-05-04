import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const body = await req.json();
  const { staff_id } = body as { staff_id: string };
  if (!staff_id) {
    return NextResponse.json({ error: "staff_id is required" }, { status: 400 });
  }
  const receipt = db.documentReadReceipts.upsertSignature(docId, staff_id);
  return NextResponse.json({ data: receipt }, { status: 200 });
}
