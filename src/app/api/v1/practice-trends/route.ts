// CARA — GET /api/v1/practice-trends
// Recording-quality trend (PACE stance + child-readable recording) over the
// last 8 weeks, from metadata-only analysis history. Cara advises; managers
// decide. Deterministic.
import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { summarisePracticeTrends } from "@/lib/practice-history/practice-trends-engine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_DASHBOARD);
  if (auth instanceof NextResponse) return auth;
  const [caraPaceAnalysesList, caraWritingReviewsList] = await Promise.all([dal.caraPaceAnalyses.findAll(), dal.caraWritingReviews.findAll()]);
  const data = summarisePracticeTrends({
    paceAnalyses: caraPaceAnalysesList ?? [],
    writingReviews: caraWritingReviewsList ?? [],
    today: new Date().toISOString(),
  });
  return NextResponse.json({ data });
}
