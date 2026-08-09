// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/recruitment/export?type=<audit|time-to-appoint|scr>
//
// Returns a text/csv download for the requested report. Wired to the three
// disabled buttons on Recruitment > Reports (audit bundle, time-to-appoint,
// SCR) so a manager can pull an Ofsted-shaped file today, before any ATS
// integration is in place.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { candidateAuditCsv, timeToAppointCsv, scrCsv } from "@/lib/recruitment/csv-export";
import type { CandidateProfile, CandidateCheck } from "@/types/recruitment";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function safeList<T>(p: Promise<unknown>): Promise<T[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? (r as T[]) : [];
  } catch {
    return [];
  }
}

function csv(name: string, body: string): NextResponse {
  const today = todayStr();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}-${today}.csv"`,
      "cache-control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  const candidates = await safeList<CandidateProfile>(dal.candidateProfiles.findAll());

  if (type === "audit") {
    return csv("recruitment-audit", candidateAuditCsv(candidates));
  }

  if (type === "time-to-appoint") {
    return csv("time-to-appoint", timeToAppointCsv(candidates));
  }

  if (type === "scr") {
    // Fetch checks per candidate in parallel. This is O(n) queries — fine for
    // the current recruitment scale (dozens of candidates), and simpler than
    // adding a bulk findByHome accessor for a report that runs on demand.
    const entries = await Promise.all(
      candidates.map(async (c) => {
        const checks = await safeList<CandidateCheck>(dal.candidateChecks.findByCandidate(c.id));
        return [c.id, checks] as const;
      }),
    );
    const map = new Map(entries);
    return csv("scr", scrCsv(candidates, map));
  }

  return NextResponse.json(
    { error: "Unknown export type. Use ?type=audit | time-to-appoint | scr" },
    { status: 400 },
  );
}
