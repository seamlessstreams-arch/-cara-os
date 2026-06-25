// CARA HQ — GET /api/v1/hq/ai-gateway
// The AI Gateway audit ledger: how many AI-eligible requests were answered with
// NO model call, why calls were refused, PII redacted before send, and whether
// any identifiable data reached a model. Metadata only — no record content.
import { NextResponse, type NextRequest } from "next/server";
import { getAiGatewayAuditLog, summariseGatewayAudit } from "@/lib/cara/ai-gateway";
import { resolveHqActor, isPlatformAdmin } from "@/lib/hq/hq-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveHqActor(req);
  if (!isPlatformAdmin(actor)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const log = getAiGatewayAuditLog();
  const now = new Date().toISOString();
  const summary = summariseGatewayAudit(log, now);
  const recent = [...log].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
  return NextResponse.json({ data: { summary, recent } });
}
