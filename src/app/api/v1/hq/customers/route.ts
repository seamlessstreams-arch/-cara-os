// CARA HQ — /api/v1/hq/customers (list + provision)
import { NextResponse, type NextRequest } from "next/server";
import {
  resolveHqActor,
  isPlatformAdmin,
  ProvisionCustomerSchema,
  provisionCustomer,
  listCustomers,
  listHomes,
} from "@/lib/hq/hq-service";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }

  // Reads came from the in-memory store alone until now. The store is
  // per-serverless-instance and re-seeds on a cold start, so a provisioned
  // customer was written to Postgres and then disappeared from this list while
  // still sitting in the table.
  const [customers, homes] = await Promise.all([listCustomers(), listHomes()]);

  // null means the database is connected but did not answer. Returning an empty
  // list here would render as "no customers yet" — a broken read and a genuinely
  // empty platform must not look the same.
  if (customers === null || homes === null) {
    return NextResponse.json(
      { error: "Couldn't read the customer list from the database. Nothing has been changed." },
      { status: 503 },
    );
  }

  return NextResponse.json({ data: { customers, homes } });
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

  const result = await provisionCustomer(parsed.data, actor);
  if (!result.ok) {
    // The home is the part that can genuinely fail to write. Say so plainly
    // rather than return a 201 for a home that exists only in this instance.
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(
    { data: { customer: result.org, home: result.home } },
    { status: 201 },
  );
}
