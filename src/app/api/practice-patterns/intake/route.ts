// ══════════════════════════════════════════════════════════════════════════════
// POST /api/practice-patterns/intake — submit a link plus your own note (4c)
//
// Manager-only (approve_learning_resources: registered manager, deputy,
// responsible individual, directors), authenticated, rate-limited per person.
// Cara never fetches the link — a person read it; this records their note.
//
// The child-data gate screens against the home's roster. If the roster cannot
// be read, nothing is stored and the caller is told (503): an unreadable
// roster is not a clean screen.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { readJsonBody } from "@/lib/http/read-json";
import {
  INTAKE_LIMITS,
  isCandidateRecord,
  runIntakePipeline,
  type PatternCandidate,
} from "@/lib/practice-patterns/intake-pipeline";
import {
  candidateStore,
  checkIntakeRateLimit,
  loadChildRoster,
  recordIntakeAudit,
  voiceStore,
} from "@/lib/practice-patterns/intake-store";
import type { TrustedVoice } from "@/lib/practice-patterns/trusted-voices";

// Strict: a body carrying anything else (likes, follower counts, comments)
// is refused outright — the source policy rules that data out.
const SubmissionSchema = z.strictObject({
  url: z.string().max(INTAKE_LIMITS.urlMax),
  author: z.string().max(INTAKE_LIMITS.authorMax),
  note: z.string().max(INTAKE_LIMITS.noteMax),
  published: z.string().max(10).optional(),
  title: z.string().max(INTAKE_LIMITS.titleMax).optional(),
  publicly_available: z.boolean(),
});

export async function POST(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.APPROVE_LEARNING_RESOURCES);
  if (auth instanceof NextResponse) return auth;

  const limit = checkIntakeRateLimit(auth.userId);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions", detail: `Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = await readJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = SubmissionSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid submission",
        issues: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      },
      { status: 400 },
    );
  }

  const roster = await loadChildRoster();
  if (!roster.ok) {
    return NextResponse.json(
      {
        error: "Not stored",
        detail: "The child-data screen could not read the home's roster, so nothing was stored. Try again shortly.",
      },
      { status: 503 },
    );
  }

  let voices: TrustedVoice[];
  let existing: PatternCandidate[];
  try {
    const [v, c] = await Promise.all([voiceStore.findAll(), candidateStore.findAll()]);
    voices = v;
    existing = c.filter(isCandidateRecord);
  } catch {
    return NextResponse.json(
      { error: "Not stored", detail: "The review queue could not be read, so nothing was stored." },
      { status: 503 },
    );
  }

  const result = runIntakePipeline(parsed.data, {
    roster: roster.roster,
    voices,
    existing,
    submittedBy: auth.userId,
    now: new Date().toISOString(),
  });

  if (result.outcome === "rejected") {
    await recordIntakeAudit({
      action: "pattern_candidate_refused_at_intake",
      actorId: auth.userId,
      entityId: null,
      reason: result.reasons.map((r) => r.code).join(","),
    });
    return NextResponse.json({ error: "Not accepted", reasons: result.reasons }, { status: 422 });
  }

  if (result.outcome === "already_decided") {
    return NextResponse.json(
      {
        error: "Already decided",
        detail:
          result.existing.status === "approved"
            ? "This post is already in the practice library."
            : "This post was reviewed and rejected.",
        existing: result.existing,
      },
      { status: 409 },
    );
  }

  try {
    if (result.outcome === "merged") {
      if (!result.added) return NextResponse.json({ data: result.candidate, merged: true, added: false });
      const updated = await candidateStore.update(result.candidate.id, {
        submissions: result.candidate.submissions,
        updated_by: auth.userId,
      });
      if (!updated) {
        return NextResponse.json(
          { error: "Not stored", detail: "The matching candidate is no longer in the queue." },
          { status: 409 },
        );
      }
      await recordIntakeAudit({ action: "pattern_candidate_merged", actorId: auth.userId, entityId: result.candidate.id });
      return NextResponse.json({ data: updated, merged: true, added: true });
    }

    const created = await candidateStore.create({ ...result.candidate, created_by: auth.userId });
    await recordIntakeAudit({
      action: "pattern_candidate_submitted",
      actorId: auth.userId,
      entityId: created.id,
      metadata: { flags: result.candidate.flags, tier: result.candidate.tier },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Not stored", detail: "The candidate could not be saved." }, { status: 500 });
  }
}
