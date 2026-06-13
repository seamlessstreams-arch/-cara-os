// CARA — /api/v1/calendar/[id]/invite
//
// GET  → downloadable .ics for the meeting (open in any calendar / attach to email)
// POST → mark invite sent + notify internal staff in-app + return a mailto link
//
// No external email is sent from the server — the organiser sends it themselves
// via the mailto/.ics. This is the honest boundary: we prepare the invite, the
// human dispatches it.
import { NextResponse } from "next/server";
import { db, getStore } from "@/lib/db/store";
import { buildICS, buildInviteMailto } from "@/lib/calendar/ics";
import { markInviteSent } from "@/lib/calendar/calendar-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function resolveNames(childId: string | null, organiserId: string) {
  const store = getStore();
  const yp = childId ? store.youngPeople.find((y) => y.id === childId) : null;
  const staff = store.staff.find((m) => m.id === organiserId);
  return {
    childName: yp ? yp.preferred_name || yp.first_name : null,
    organiserName: staff ? staff.full_name : "Cara",
  };
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const event = db.calendarEvents.findById(id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { childName, organiserName } = resolveNames(event.child_id, event.organiser_id);
  const ics = buildICS(event, {
    dtstamp: new Date().toISOString(),
    organiserName,
    childName,
  });

  const safeName = event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40) || "invite";
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${safeName}.ics"`,
    },
  });
}

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = markInviteSent(id);
  if (!result) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { childName } = resolveNames(result.event.child_id, result.event.organiser_id);
  const mailto = buildInviteMailto(result.event, { childName });
  return NextResponse.json({
    data: {
      event: result.event,
      notified_staff: result.notified,
      mailto,
      ics_url: `/api/v1/calendar/${id}/invite`,
    },
  });
}
