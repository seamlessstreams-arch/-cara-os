// ══════════════════════════════════════════════════════════════════════════════
// API — Reg 44 Visit Evidence Pack  (Milestones 33 + 35)
//
// GET  ?home_id=                       → list previously persisted packs
//                                        (newest first; header rows only)
// POST { home_id, days? }              → generate AND persist a new pack,
//                                        return full payload
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import {
  generateReg44Pack,
  persistReg44Pack,
  listPersistedReg44Packs,
} from "@/lib/care-events/reg44-pack";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";
import { readJsonBody } from "@/lib/http/read-json";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "list Reg 44 visit evidence packs",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: listPersistedReg44Packs(homeId) });
}

export async function POST(req: NextRequest) {
  let body: { home_id?: string; days?: number } = {};
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; } catch { /* allow empty body */ }
  const homeId = body.home_id ?? DEFAULT_HOME_ID;
  const daysRaw = Number(body.days ?? 30);
  const days =
    Number.isFinite(daysRaw) && daysRaw > 0 && daysRaw <= 365 ? daysRaw : 30;

  const guard = requireCaraStudioPermission(
    req,
    body as Record<string, unknown>,
    {
      permission: "cara.commit_to_records",
      homeId,
      intent: "persist Reg 44 visit evidence pack",
      isSafeguardingSensitive: true,
    },
  );
  if (!guard.ok) return guard.response;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const window = {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };

  const pack = generateReg44Pack(homeId, {
    window,
    generatedBy: guard.actor.userId,
  });
  persistReg44Pack(pack);

  appendCaraAudit({
    homeId,
    actorId: guard.actor.userId,
    actionType: "artifact_committed",
    artifactId: pack.id,
    sourceIds: [],
    summary: `Reg 44 visit evidence pack persisted (${days}-day window, ${pack.headline.children_in_residence} children, ${pack.headline.safeguarding_events} safeguarding events)`,
    after: { window: pack.window, headline: pack.headline },
  });

  return NextResponse.json({ data: pack });
}
