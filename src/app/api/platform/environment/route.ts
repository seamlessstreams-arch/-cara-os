import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { describeEnvironment } from "@/lib/config/environment";

// Read-only practice-vs-live environment status (Phase 1 infra · 2/3), for a UI
// banner / status surface. Requires an authenticated identity (fail-closed when
// Supabase auth is on; demo default identity otherwise) but no special
// permission — every user needs to know which environment they are in. Exposes
// no secrets: just the environment label + banner. Demo-safe: with separation
// inactive (default) it reports { environment: "live", separationActive: false }.
export async function GET(request: NextRequest) {
  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;

  return NextResponse.json(describeEnvironment());
}
