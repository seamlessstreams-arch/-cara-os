// CARA HQ — GET /api/v1/hq/overview (platform-owner cockpit)
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeHqOverview } from "@/lib/engines/platform-hq-engine";
import { hqActorFromHeaders, isPlatformAdmin } from "@/lib/hq/hq-service";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { getAriaProviderConfig } from "@/lib/aria/aria-provider";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const actor = hqActorFromHeaders(new Headers(req.headers));
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const store = getStore();
  const overview = computeHqOverview({
    organisations: store.hqOrganisations,
    usageEvents: store.hqUsageEvents,
    aiUsage: store.hqAiUsage,
    breakGlass: store.hqBreakGlassGrants,
    now: new Date().toISOString(),
  });
  return NextResponse.json({
    data: {
      overview,
      mode: {
        durable: isSupabaseEnabled(),
        ai_configured: getAriaProviderConfig().configured,
      },
    },
  });
}
