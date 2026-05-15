import { NextResponse } from "next/server";
import {
  listChildSubstanceMisuseScreenings,
  createChildSubstanceMisuseScreening,
} from "@/lib/services/child-substance-misuse-screening-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listChildSubstanceMisuseScreenings(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createChildSubstanceMisuseScreening(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
