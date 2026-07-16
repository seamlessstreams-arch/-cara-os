// CARA — /api/v1/home-profile
//
// The identity of the home this deployment serves: name, address, Ofsted URN.
// One source for every screen that used to hardcode "Chamberlain House".
//
// Demo mode returns the seeded home. Live mode (NEXT_PUBLIC_CARA_MODE=live)
// returns the blanked home — id "" — until it is provisioned; the client shows
// a neutral fallback rather than a stale demo name.
import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

export const dynamic = "force-dynamic";

export async function GET() {
  const home = await dal.home.get();

  // A live tenant before provisioning (blanked home, or no row yet) has no
  // identity to report. Say so explicitly rather than emit an empty name that a
  // caller might render as if it were real.
  const provisioned = Boolean(home && home.id && home.name);

  return NextResponse.json({
    data: {
      provisioned,
      home: provisioned
        ? {
            id: home!.id,
            name: home!.name,
            address: home!.address,
            ofsted_urn: home!.ofsted_urn,
          }
        : null,
    },
  });
}
