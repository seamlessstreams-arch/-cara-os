// ══════════════════════════════════════════════════════════════════════════════
// CARA — DUPLICATE DETECTION API ROUTE
// GET /api/v1/duplicate-detection
//
// The "never duplicate" pillar: projects the store into the canonical event
// stream, then scans for likely duplicate events — same type, same child, within
// 48 hours, near-identical wording — so staff link to the existing record instead
// of creating a second copy. Pure read-only; no external calls, no mutations.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import {
  computeDuplicateDetection,
  type ChildRef,
} from "@/lib/duplicate-detection/duplicate-detection-engine";

// Read a dal collection defensively: a transient query failure degrades to an
// empty list rather than 500-ing the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const store = getStore() as any;

  const stream = buildEventStream(mapStoreToEventInput(store));

  const youngPeople = await safeList(dal.youngPeople.findAll());
  const children: ChildRef[] = youngPeople.map((yp: any) => ({
    id: yp.id,
    first_name: yp.first_name ?? "",
    last_name: yp.last_name ?? "",
    preferred_name: yp.preferred_name ?? null,
  }));

  const result = computeDuplicateDetection({
    events: stream.events,
    children,
    today: new Date().toISOString().slice(0, 10),
  });

  return NextResponse.json({ data: result });
}
