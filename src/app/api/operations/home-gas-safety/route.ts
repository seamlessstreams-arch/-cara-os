import { NextResponse } from "next/server";
import {
  listHomeGasSafety,
  createHomeGasSafety,
} from "@/lib/services/home-gas-safety-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listHomeGasSafety(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createHomeGasSafety(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
