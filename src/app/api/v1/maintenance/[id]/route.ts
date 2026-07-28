import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const updated = await dal.maintenance.update(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
