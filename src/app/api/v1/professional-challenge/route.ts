// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROFESSIONAL CHALLENGE (§5.15 / doctrine 1.11)
//
// GET   /api/v1/professional-challenge            → all challenges + detections
// GET   /api/v1/professional-challenge?child_id=… → one child's challenges
// POST                                             → open a challenge
// PATCH                                            → log a communication, move a
//                                                    rung, or close a challenge
//
// The OUTWARD counterpart to whistleblowing (inward). Reads + detections always
// on; writes gated behind professional_challenge_write (opt-in, default OFF).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import {
  summariseProfessionalChallenges,
  validateClose,
  CHALLENGE_LADDER,
  type ProfessionalChallenge,
  type ChallengeCommunication,
  type ChallengeRung,
  type ChallengeStatus,
} from "@/lib/professional-challenge/professional-challenge-engine";

export const dynamic = "force-dynamic";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const STATUSES: ChallengeStatus[] = ["open", "resolved_child_improved", "resolved_no_change", "withdrawn"];
const METHODS: ChallengeCommunication["method"][] = ["call", "email", "meeting", "letter", "other"];
const rung = (v: unknown): ChallengeRung | null =>
  (CHALLENGE_LADDER as readonly string[]).includes(str(v)) ? (v as ChallengeRung) : null;

export async function GET(req: NextRequest) {
  try {
    const childId = new URL(req.url).searchParams.get("child_id");
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    const rows = (getStore().professionalChallenges ?? []).filter((c) => !childId || c.child_id === childId);
    const summary = summariseProfessionalChallenges(rows, new Date());
    return NextResponse.json({
      data: { ...summary, ladder: CHALLENGE_LADDER, writeEnabled: isFeatureEnabled("professional_challenge_write") },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Open a new challenge. */
export async function POST(req: NextRequest) {
  try {
    if (!isFeatureEnabled("professional_challenge_write")) {
      return NextResponse.json({ error: "Professional challenge writing is not enabled (professional_challenge_write)." }, { status: 403 });
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    if (!body?.child_id || !str(body.decision_challenged).trim()) {
      return NextResponse.json({ error: "child_id and decision_challenged are required" }, { status: 400 });
    }
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, String(body.child_id));
    if (denied) return denied;

    const store = getStore();
    const now = new Date().toISOString();
    const challenge: ProfessionalChallenge = {
      id: generateId("chal"),
      child_id: String(body.child_id),
      home_id: String(body.home_id ?? store.home.id ?? ""),
      decision_challenged: str(body.decision_challenged).trim(),
      decision_maker_name: str(body.decision_maker_name),
      decision_maker_role: str(body.decision_maker_role),
      agency: str(body.agency),
      decision_date: str(body.decision_date),
      reason: str(body.reason),
      evidence: str(body.evidence),
      threshold_basis: str(body.threshold_basis),
      current_risk: str(body.current_risk),
      desired_resolution: str(body.desired_resolution),
      current_rung: "professional",
      communications: [],
      next_action_due: body.next_action_due ? String(body.next_action_due) : null,
      status: "open",
      child_situation_outcome: "",
      closed_at: null,
      management_review: str(body.management_review),
      created_at: now,
      updated_at: now,
      created_by: identity.userId,
      updated_by: identity.userId,
    };
    store.professionalChallenges.push(challenge);
    return NextResponse.json({ data: challenge }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Log a communication, move up a rung, or close a challenge. */
export async function PATCH(req: NextRequest) {
  try {
    if (!isFeatureEnabled("professional_challenge_write")) {
      return NextResponse.json({ error: "Professional challenge writing is not enabled (professional_challenge_write)." }, { status: 403 });
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const store = getStore();
    const c = (store.professionalChallenges ?? []).find((x) => x.id === String(body.id));
    if (!c) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    const denied = assertChildHomeAccess(identity, c.child_id);
    if (denied) return denied;

    const now = new Date().toISOString();

    // Log a communication (with its rung) — the written-trail discipline.
    if (body.communication) {
      const cm = body.communication as Record<string, unknown>;
      const r = rung(cm.rung) ?? c.current_rung;
      c.communications.push({
        id: generateId("cc"),
        at: now,
        rung: r,
        person_name: str(cm.person_name),
        person_role: str(cm.person_role),
        agency: str(cm.agency),
        method: (METHODS as string[]).includes(str(cm.method)) ? (cm.method as ChallengeCommunication["method"]) : "other",
        summary: str(cm.summary),
        written_followup: cm.written_followup === true,
      });
      // Logging at a higher rung advances the ladder.
      if (CHALLENGE_LADDER.indexOf(r) > CHALLENGE_LADDER.indexOf(c.current_rung)) c.current_rung = r;
    }

    // Move to a rung explicitly (must be forward on the ladder).
    const toRung = rung(body.to_rung);
    if (toRung && CHALLENGE_LADDER.indexOf(toRung) > CHALLENGE_LADDER.indexOf(c.current_rung)) {
      c.current_rung = toRung;
    }

    if (body.next_action_due !== undefined) c.next_action_due = body.next_action_due ? String(body.next_action_due) : null;
    if (body.management_review !== undefined) c.management_review = str(body.management_review);

    // Close — the doctrine's guard: closing as improved needs the child outcome.
    if (body.status && (STATUSES as string[]).includes(str(body.status))) {
      const status = body.status as ChallengeStatus;
      const outcome = body.child_situation_outcome === undefined ? c.child_situation_outcome : str(body.child_situation_outcome);
      const invalid = validateClose(status, outcome);
      if (invalid) return NextResponse.json({ error: invalid }, { status: 422 });
      c.status = status;
      c.child_situation_outcome = outcome;
      c.closed_at = status === "open" ? null : now;
    }

    c.updated_at = now;
    c.updated_by = identity.userId;
    return NextResponse.json({ data: c });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
