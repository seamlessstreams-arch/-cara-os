import { NextRequest, NextResponse } from "next/server";
import { storageFailure, type StorageQueryError } from "@/lib/http/storage-error";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { careEventsDb } from "@/lib/db";
import { reg45Evidence } from "@/lib/intelligence/fallback-store";
import { intelligenceScope } from "@/lib/intelligence/request-scope";
import { buildReg45EvidenceBank } from "@/lib/reg45/evidence-bank";

// Regulation 45 evidence bank: the categories of record the home has captured,
// each counted with real examples. It used to read a `reg45_evidence` table
// that was never created on the live tenant, so on live every read failed and
// the Reg 45 page showed a storage error with no evidence base.
//
// The evidence already lives on the care-event spine, which is persisted on
// live. We assemble the bank from it (src/lib/reg45/evidence-bank.ts): real
// counts, real example titles, nothing invented. Demo mode keeps its seeded
// bank unchanged.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Live: the session's home, never ?homeId= (see request-scope.ts).
  const scope = await intelligenceScope(request, { homeId: searchParams.get("homeId") });
  if (scope instanceof NextResponse) return scope;
  const { homeId } = scope;

  if (!isSupabaseEnabled()) {
    let rows = [...reg45Evidence];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    return NextResponse.json({ ok: true, evidence: rows, persisted: true });
  }

  try {
    const all = await careEventsDb.careEvents.findAll();
    const events = homeId ? all.filter((e) => e.home_id === homeId) : all;
    const evidence = buildReg45EvidenceBank(events);
    return NextResponse.json({ ok: true, evidence, persisted: true });
  } catch (error) {
    return storageFailure("Regulation 45 evidence", error as StorageQueryError);
  }
}
