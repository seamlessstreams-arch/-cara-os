// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOMES ENDPOINT
//
// GET /api/v1/homes
// Returns all active homes with summary statistics per home.
//
// TO CONNECT SUPABASE: replace the registry lookup with a Supabase query
// joining homes, children, staff, incidents, and tasks tables.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getActiveHomes, type CornerstoneHome } from "@/lib/homes/home-registry";

export const dynamic = "force-dynamic";

// ── Demo summary stats (replace with real aggregations) ──────────────────────

interface HomeSummary extends CornerstoneHome {
  compliance_score: number;
  open_incidents: number;
  overdue_tasks: number;
  staff_count: number;
}

const DEMO_STATS: Record<string, Omit<HomeSummary, keyof CornerstoneHome>> = {
  home_oak: {
    compliance_score: 94,
    open_incidents: 1,
    overdue_tasks: 2,
    staff_count: 12,
  },
  home_willow: {
    compliance_score: 87,
    open_incidents: 3,
    overdue_tasks: 5,
    staff_count: 9,
  },
  home_cedar: {
    compliance_score: 72,
    open_incidents: 5,
    overdue_tasks: 11,
    staff_count: 16,
  },
};

export async function GET() {
  const homes = getActiveHomes();

  const data: HomeSummary[] = homes.map((home) => {
    const stats = DEMO_STATS[home.id] ?? {
      compliance_score: 0,
      open_incidents: 0,
      overdue_tasks: 0,
      staff_count: 0,
    };
    return { ...home, ...stats };
  });

  const totalChildren = data.reduce((n, h) => n + h.current_occupancy, 0);
  const totalStaff = data.reduce((n, h) => n + h.staff_count, 0);
  const avgCompliance =
    data.length > 0
      ? Math.round(
          data.reduce((n, h) => n + h.compliance_score, 0) / data.length,
        )
      : 0;

  return NextResponse.json({
    data,
    meta: {
      total_homes: data.length,
      total_children: totalChildren,
      total_staff: totalStaff,
      average_compliance: avgCompliance,
    },
  });
}
