import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { staff_id } = body as { staff_id: string };
  if (!staff_id) {
    return NextResponse.json({ error: "staff_id is required" }, { status: 400 });
  }
  const receipt = await dal.documentReadReceipts.upsertSignature(docId, staff_id);
  return NextResponse.json({ data: receipt }, { status: 200 });
}
