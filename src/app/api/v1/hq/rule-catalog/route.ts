// CARA HQ — GET /api/v1/hq/rule-catalog
// The unified governance view of every rule Cara applies across the three rule
// systems (automation / compliance / cara handlers). Read-only introspection —
// it never evaluates a rule. Metadata only; no children's record content.
import { NextResponse, type NextRequest } from "next/server";
import { buildRuleCatalog, summariseRuleCatalog } from "@/lib/rules-catalog/rules-catalog";
import { resolveHqActor, isPlatformAdmin } from "@/lib/hq/hq-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const catalog = buildRuleCatalog();
  const summary = summariseRuleCatalog(catalog);
  return NextResponse.json({ data: { catalog, summary } });
}
