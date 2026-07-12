// CARA HQ — /api/v1/hq/customers/[id]/break-glass (record + revoke)
// Records an auditable, time-boxed support-access REQUEST. It does NOT open
// children's records — record-level access needs the DPO-approved process.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  BreakGlassSchema,
  resolveHqActor,
  isPlatformAdmin,
  recordBreakGlass,
  revokeBreakGlass,
} from "@/lib/hq/hq-service";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const { id } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const parsed = BreakGlassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const grant = recordBreakGlass(id, parsed.data, actor);
  if (!grant) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { grant } }, { status: 201 });
}

const RevokeSchema = z.object({ grant_id: z.string().min(1) });

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  await params; // route shape consistency; revocation addresses the grant id
  const __parsed2 = await readJsonBody(req);
  if (!__parsed2.ok) return __parsed2.response;
  const body = __parsed2.data;
  const parsed = RevokeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "grant_id required" }, { status: 400 });
  }
  const grant = revokeBreakGlass(parsed.data.grant_id, actor);
  if (!grant) {
    return NextResponse.json({ error: "Grant not found or already revoked" }, { status: 404 });
  }
  return NextResponse.json({ data: { grant } });
}
