// CARA HQ — /api/v1/hq/customers (list + provision)
import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  resolveHqActor,
  isPlatformAdmin,
  ProvisionCustomerSchema,
  provisionCustomer,
} from "@/lib/hq/hq-service";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const store = getStore();
  const customers = [...store.hqOrganisations].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  return NextResponse.json({ data: { customers } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const parsed = ProvisionCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const org = provisionCustomer(parsed.data, actor);
  return NextResponse.json({ data: { customer: org } }, { status: 201 });
}
