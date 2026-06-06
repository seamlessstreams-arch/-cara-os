// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING FROM CARE INTELLIGENCE API
//
// Returns aggregated missing from care intelligence for the dashboard card:
// profile stats, recent episodes, push/pull factor analysis, ARIA insights.
//
// GET /api/v1/missing-intelligence?home_id=home_oak
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { computeMissingIntelligence } from "@/lib/engines/missing-from-care-engine";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const episodes = db.missingEpisodes.findAll();

  // Build name lookup from young people (dual-mode: real table when Supabase is on)
  const yps = await dal.youngPeople.findAll();
  const ypMap = new Map(yps.map((yp) => [yp.id, yp.preferred_name ?? yp.first_name]));

  const result = computeMissingIntelligence({
    episodes: episodes.map((ep) => ({
      id: ep.id,
      reference: ep.reference,
      child_id: ep.child_id,
      date_missing: ep.date_missing,
      time_missing: ep.time_missing,
      date_returned: ep.date_returned,
      time_returned: ep.time_returned,
      duration_hours: ep.duration_hours,
      risk_level: ep.risk_level,
      location_last_seen: ep.location_last_seen,
      return_location: ep.return_location,
      reported_to_police: ep.reported_to_police,
      police_reference: ep.police_reference,
      reported_to_la: ep.reported_to_la,
      return_interview_completed: ep.return_interview_completed,
      return_interview_by: ep.return_interview_by,
      return_interview_date: ep.return_interview_date,
      return_interview_notes: ep.return_interview_notes,
      contextual_safeguarding_risk: ep.contextual_safeguarding_risk,
      linked_incident_id: ep.linked_incident_id,
      pattern_notes: ep.pattern_notes,
      status: ep.status,
    })),
    childNameLookup: (id: string) => ypMap.get(id) ?? id.replace("yp_", ""),
  });

  return NextResponse.json({ data: result });
}
