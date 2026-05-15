import { NextResponse } from "next/server";
import {
  listEmotionalWellbeingOutcomes,
  createEmotionalWellbeingOutcome,
} from "@/lib/services/emotional-wellbeing-outcome-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listEmotionalWellbeingOutcomes(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createEmotionalWellbeingOutcome(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
