import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { withShiftAccess } from "@/lib/permissions/with-shift-access";

export const dynamic = "force-dynamic";

// ── GET /api/v1/missing-episodes/[id] ── (guarded: missing_episode / view) ────

async function getEpisode(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const episode = db.missingEpisodes.findById(id);
  if (!episode) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: episode });
}

export const GET = withShiftAccess("missing_episode", "view", getEpisode);

// ── PATCH /api/v1/missing-episodes/[id] ──────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const existing = db.missingEpisodes.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-calculate duration_hours when marking returned
  let extra: Partial<typeof body> = {};
  if (body.date_returned && body.time_returned && existing.date_missing && existing.time_missing) {
    try {
      const missedAt = new Date(`${existing.date_missing}T${existing.time_missing}`);
      const returnedAt = new Date(`${body.date_returned}T${body.time_returned}`);
      const diffMs = returnedAt.getTime() - missedAt.getTime();
      if (diffMs > 0) {
        extra.duration_hours = Math.round((diffMs / 3600000) * 10) / 10;
      }
    } catch {
      // ignore date parse errors
    }
  }

  const updated = db.missingEpisodes.patch(id, { ...body, ...extra });
  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({ data: updated });
}
