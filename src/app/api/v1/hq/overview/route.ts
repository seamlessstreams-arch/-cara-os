// CARA HQ — GET /api/v1/hq/overview (platform-owner cockpit)
import { NextResponse, type NextRequest } from "next/server";
import { dal } from "@/lib/db";
import { computeHqOverview } from "@/lib/engines/platform-hq-engine";
import { resolveHqActor, isPlatformAdmin } from "@/lib/hq/hq-service";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { getCaraProviderConfig } from "@/lib/cara/cara-provider";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const [hqAiUsageList, hqApiCallsList, hqBreakGlassGrantsList, hqDecisionsList, hqOrganisationsList, hqUsageEventsList] = await Promise.all([dal.hqAiUsage.findAll(), dal.hqApiCalls.findAll(), dal.hqBreakGlassGrants.findAll(), dal.hqDecisions.findAll(), dal.hqOrganisations.findAll(), dal.hqUsageEvents.findAll()]);
  const overview = computeHqOverview({
    organisations: hqOrganisationsList,
    usageEvents: hqUsageEventsList,
    aiUsage: hqAiUsageList,
    apiCalls: hqApiCallsList,
    decisions: hqDecisionsList,
    breakGlass: hqBreakGlassGrantsList,
    now: new Date().toISOString(),
  });
  return NextResponse.json({
    data: {
      overview,
      mode: {
        durable: isSupabaseEnabled(),
        ai_configured: getCaraProviderConfig().configured,
      },
    },
  });
}
