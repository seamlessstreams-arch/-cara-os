// CARA HQ — GET /api/v1/hq/ai-usage (cost dashboard, 30 days)
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { summariseAiUsage } from "@/lib/engines/platform-hq-engine";
import { hqActorFromHeaders, isPlatformAdmin } from "@/lib/hq/hq-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const actor = hqActorFromHeaders(new Headers(req.headers));
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const store = getStore();
  const now = new Date().toISOString();
  const summary = summariseAiUsage(store.hqAiUsage, now);
  const orgNames = Object.fromEntries(store.hqOrganisations.map((o) => [o.id, o.name]));
  const recent = [...store.hqAiUsage]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 30);
  return NextResponse.json({ data: { summary, org_names: orgNames, recent } });
}
