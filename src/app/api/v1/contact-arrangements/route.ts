import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import type { ContactArrangement, ContactPerson } from "@/types/extended";

/** An arrangement as GET returns it: the stored row plus its contact-person join. */
export type ContactArrangementEnriched = ContactArrangement & {
  contact_person: ContactPerson | null;
};

export type ContactArrangementsResponse = {
  data: ContactArrangementEnriched[];
  meta: { total: number };
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId   = searchParams.get("home_id");
  const childId  = searchParams.get("child_id");

  let records;
  if (childId) {
    records = intelligenceDb.contactArrangements.findByChild(childId);
  } else if (homeId) {
    records = intelligenceDb.contactArrangements.findAll(homeId);
  } else {
    return NextResponse.json({ error: "home_id or child_id required" }, { status: 400 });
  }

  // Enrich with contact person details
  const enriched: ContactArrangementEnriched[] = records.map((arr) => ({
    ...arr,
    contact_person: intelligenceDb.contactPersons.findById(arr.contact_person_id),
  }));

  return NextResponse.json({ data: enriched, meta: { total: enriched.length } });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const record = intelligenceDb.contactArrangements.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
