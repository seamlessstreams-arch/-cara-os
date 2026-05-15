import { NextResponse } from "next/server";
import {
  listChildRadicalisationPrevention,
  createChildRadicalisationPrevention,
} from "@/lib/services/child-radicalisation-prevention-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listChildRadicalisationPrevention(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createChildRadicalisationPrevention(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
