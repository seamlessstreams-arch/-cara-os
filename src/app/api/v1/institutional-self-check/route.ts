// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSTITUTIONAL SELF-CHECK (doctrine 2.2.10, lens from 1.13)
//
// GET /api/v1/institutional-self-check → our own response pattern, from where
//                                        a child sits
//
// Cara auditing Cara's home. It composes three engines that already exist —
// escalation-quality, repair-cycle, voice-follow-through — and derives nothing
// itself, so a finding here is always traceable to a record those engines own.
//
// Read-only, and it will stay that way: this is a prompt to look, not a
// workflow. There is nothing to write.
//
// Manager-facing. Not because the findings are secret — they are about the
// organisation, not any person — but because they are the manager's to act on,
// and a half-read self-check is worse than none.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { assessEscalationQuality } from "@/lib/risk-escalation/escalation-quality-engine";
import { buildRepairCycleIntelligence } from "@/lib/repair-cycle-intelligence/repair-cycle-engine";
import { computeVoiceFollowThrough } from "@/lib/voice-of-child/voice-follow-through-engine";
import { buildInstitutionalSelfCheck } from "@/lib/theory-lens/institutional-self-check-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    if (
      identity.role !== "registered_manager" &&
      identity.role !== "deputy_manager" &&
      identity.role !== "responsible_individual"
    ) {
      return NextResponse.json(
        { error: "The home's self-check is a manager's view." },
        { status: 403 },
      );
    }

    const store = getStore();
    const now = new Date();

    // Each source is wrapped: if one engine has nothing to say, that strand goes
    // UNLIT rather than silently passing. Never let a failed read read as health.
    const escalation = (() => {
      try {
        return assessEscalationQuality(store.escalationDecisions ?? [], now);
      } catch {
        return null;
      }
    })();
    const repair = (() => {
      try {
        return buildRepairCycleIntelligence(store);
      } catch {
        return null;
      }
    })();
    const voice = (() => {
      try {
        return computeVoiceFollowThrough(store.voiceConcernLoops ?? [], now);
      } catch {
        return null;
      }
    })();

    const check = buildInstitutionalSelfCheck({ escalation, repair, voice });

    return NextResponse.json({
      data: {
        ...check,
        // Where each strand's detail lives, so a finding is one click from the
        // records behind it.
        sources: {
          responding: "/intelligence/cara/escalation-quality",
          repairing: "/intelligence/cara/repair-cycle",
          answering: "/intelligence/cara/voice-follow-through",
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
