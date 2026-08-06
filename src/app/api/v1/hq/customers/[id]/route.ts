// CARA HQ — /api/v1/hq/customers/[id] (detail + status)
import { NextResponse, type NextRequest } from "next/server";
import { dal } from "@/lib/db";
import {
  summariseAiUsage,
  summariseBreakGlass,
  summariseUsage,
} from "@/lib/engines/platform-hq-engine";
import {
  resolveHqActor,
  isPlatformAdmin,
  SetOrgStatusSchema,
  setOrgStatus,
} from "@/lib/hq/hq-service";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const { id } = await params;
  const [hqAiUsageList, hqBreakGlassGrantsList, hqOrganisationsList, hqUsageEventsList] = await Promise.all([dal.hqAiUsage.findAll(), dal.hqBreakGlassGrants.findAll(), dal.hqOrganisations.findAll(), dal.hqUsageEvents.findAll()]);
  const customer = hqOrganisationsList.find((o) => o.id === id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  const now = new Date().toISOString();
  return NextResponse.json({
    data: {
      customer,
      usage: summariseUsage(hqUsageEventsList.filter((e) => e.org_id === id), now),
      ai: summariseAiUsage(hqAiUsageList.filter((r) => r.org_id === id), now),
      break_glass: summariseBreakGlass(
        hqBreakGlassGrantsList.filter((g) => g.org_id === id),
        now,
      ),
    },
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const { id } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const parsed = SetOrgStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const updated = setOrgStatus(id, parsed.data.status, actor);
  if (!updated) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { customer: updated } });
}
