import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  makeChildNameMatcher,
  type YoungPersonLite,
} from "@/lib/admission-retro-link/admission-retro-link-engine";
import {
  computeEmergencyFollowUps,
  isEmergencyAdmission,
  type DatedChildRecord,
  type EmergencyMarkers,
} from "@/lib/admission-retro-link/emergency-followups-engine";

export const dynamic = "force-dynamic";

// GET /api/v1/emergency-followups[?child_id=]
// The statutory follow-up board for emergency admissions: which children
// arrived as emergencies (derived from the referral models — never guessed),
// and each deadline's done/due/overdue state read straight off the existing
// record collections. Read-only projection.
export async function GET(req: NextRequest) {
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;

  const childId = req.nextUrl.searchParams.get("child_id");
  if (childId) {
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;
  }

  const store = getStore();
  const youngPeople = store.youngPeople as unknown as (YoungPersonLite & { status?: string })[];
  const markers: EmergencyMarkers = {
    admissionReferrals: store.admissionReferrals as never,
    // Commissioning referrals are Supabase-backed — empty array in demo mode.
    placementReferrals: [],
  };
  const sources = {
    riskAssessments: store.riskAssessments as unknown as DatedChildRecord[],
    welfareChecks: store.welfareChecks as unknown as DatedChildRecord[],
    healthAssessments: store.healthAssessments as unknown as DatedChildRecord[],
    lacReviews: store.lacReviews as unknown as DatedChildRecord[],
  };
  const now = new Date().toISOString();

  const targets = childId ? youngPeople.filter((y) => y.id === childId) : youngPeople;
  const boards = targets
    .map((yp) => {
      const basis = isEmergencyAdmission(
        `${yp.first_name} ${yp.last_name}`,
        makeChildNameMatcher(yp),
        markers,
      );
      if (!basis || !yp.placement_start) return null;
      return computeEmergencyFollowUps(
        {
          id: yp.id,
          name: `${yp.first_name} ${yp.last_name}`.trim(),
          placement_start: yp.placement_start,
          emergency_basis: basis,
        },
        sources,
        now,
      );
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  if (childId) {
    return NextResponse.json({ data: { child_id: childId, board: boards[0] ?? null } });
  }
  return NextResponse.json({
    data: {
      emergency_admissions: boards.length,
      total_overdue: boards.reduce((a, b) => a + b.overdue_count, 0),
      boards,
    },
  });
}
