// CARA HQ — /api/v1/hq/customers/[id]/break-glass (record + revoke)
// Records an auditable, time-boxed support-access REQUEST. It does NOT open
// children's records — record-level access needs the DPO-approved process.
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  BreakGlassSchema,
  hqActorFromHeaders,
  isPlatformAdmin,
  recordBreakGlass,
  revokeBreakGlass,
} from "@/lib/hq/hq-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const actor = hqActorFromHeaders(new Headers(req.headers));
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
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

export async function PATCH(req: Request, { params }: Params) {
  const actor = hqActorFromHeaders(new Headers(req.headers));
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  await params; // route shape consistency; revocation addresses the grant id
  const body = await req.json().catch(() => null);
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
