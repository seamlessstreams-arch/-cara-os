import { NextResponse } from "next/server";
import {
  listHomeRadonTesting,
  createHomeRadonTesting,
} from "@/lib/services/home-radon-testing-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listHomeRadonTesting(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createHomeRadonTesting(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
