// CARA HQ — GET /api/v1/hq/ai-usage (cost dashboard, 30 days)
import { NextResponse, type NextRequest } from "next/server";
import { dal } from "@/lib/db";
import { summariseAiUsage } from "@/lib/engines/platform-hq-engine";
import { resolveHqActor, isPlatformAdmin } from "@/lib/hq/hq-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const [hqAiUsageList, hqOrganisationsList] = await Promise.all([dal.hqAiUsage.findAll(), dal.hqOrganisations.findAll()]);
  const now = new Date().toISOString();
  const summary = summariseAiUsage(hqAiUsageList, now);
  const orgNames = Object.fromEntries(hqOrganisationsList.map((o) => [o.id, o.name]));
  const recent = [...hqAiUsageList]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 30);
  return NextResponse.json({ data: { summary, org_names: orgNames, recent } });
}
