import { NextRequest, NextResponse } from "next/server";
import { runIncidentIntelligence } from "@/lib/cara/incident-intelligence";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await runIncidentIntelligence(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
