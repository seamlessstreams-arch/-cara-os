import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  buildOriginStory,
  type AdmissionReferralLite,
  type MatchingReferralLite,
  type YoungPersonLite,
} from "@/lib/admission-retro-link/admission-retro-link-engine";

export const dynamic = "force-dynamic";

// GET /api/v1/admission-retro-link?child_id=yp_alex
//   → that child's consolidated pre-placement origin story (referral + matching),
//     retro-linked by name/DOB. Read-only.
// GET /api/v1/admission-retro-link  (no child_id)
//   → origin stories for every current young person that has a matchable referral.
export async function GET(req: NextRequest) {
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;

  const childId = req.nextUrl.searchParams.get("child_id");
  if (childId) {
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;
  }

  const store = getStore();
  const admissionReferrals = store.admissionReferrals as unknown as AdmissionReferralLite[];
  const matchingReferrals = store.matchingReferrals as unknown as MatchingReferralLite[];
  const youngPeople = store.youngPeople as unknown as YoungPersonLite[];

  if (childId) {
    const yp = youngPeople.find((y) => y.id === childId);
    if (!yp) return NextResponse.json({ error: "Young person not found" }, { status: 404 });
    const story = buildOriginStory(yp, admissionReferrals, matchingReferrals);
    return NextResponse.json({ data: { child_id: childId, origin: story } });
  }

  const stories = youngPeople
    .map((yp) => buildOriginStory(yp, admissionReferrals, matchingReferrals))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return NextResponse.json({
    data: {
      linked: stories.length,
      young_people_total: youngPeople.length,
      stories,
    },
  });
}
