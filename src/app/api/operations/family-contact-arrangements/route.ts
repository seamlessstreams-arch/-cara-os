import { readJsonBody } from "@/lib/http/read-json";
import { NextResponse } from "next/server";
import {
  listFamilyContactArrangements,
  createFamilyContactArrangement,
} from "@/lib/services/family-contact-arrangements-service";

const HOME = process.env.SUPABASE_HOME_ID ?? "00000000-0000-0000-0000-000000000001";

export async function GET() {
  const result = await listFamilyContactArrangements(HOME);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const result = await createFamilyContactArrangement({ ...body, homeId: HOME });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.data, { status: 201 });
}
