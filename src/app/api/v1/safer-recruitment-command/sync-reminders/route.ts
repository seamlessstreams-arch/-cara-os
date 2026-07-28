// ══════════════════════════════════════════════════════════════════════════════
// CARA — SYNC RECRUITMENT CHASE REMINDERS → TASK SYSTEM
//
// Manager-triggered, idempotent. Derives due reminders from the Command
// Centre's computed state (chase ladder, urgent reviews, sign-off,
// exceptional-start daily review) and creates any that aren't already open
// as tasks. Keys embedded as [auto:…] markers make repeat syncs no-ops.
// Creates reminders to act — never decisions.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { dal } from "@/lib/db/dal";
import { createRecruitmentAuditRecord } from "@/lib/supabase/recruitment-persist";
import { createTaskRecord } from "@/lib/supabase/care-records";
import { computeSaferRecruitmentCommand } from "@/lib/engines/safer-recruitment-command-engine";
import { deriveReminderSpecs, planReminderSync } from "@/lib/engines/recruitment-reminder-engine";
import { assembleCommandCandidates } from "@/lib/safer-recruitment/command-data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const today = new Date().toISOString().slice(0, 10);
  const actor = req.headers.get("x-user-id") ?? "staff_darren";

  const command = computeSaferRecruitmentCommand({ today, candidates: assembleCommandCandidates() });
  const specs = deriveReminderSpecs(command);
  // dal.tasks.findActive on live filters to status="not_started" only, but the
  // in-memory equivalent returns everything not-completed/not-cancelled (incl.
  // in_progress/paused). Preserve exact dedupe behavior with a client-side filter
  // over findAll() instead of accepting the narrower live semantics.
  const allTasks = await dal.tasks.findAll();
  const openDescriptions = allTasks
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .map((t) => t.description);
  const plan = planReminderSync(specs, openDescriptions);

  // Pre-fetch candidate profiles for the reminders we're about to create + index
  // by id, so the createTaskRecord .map() stays sync.
  const profilesById = new Map(
    await Promise.all(
      plan.to_create.map(async (s) => [s.candidate_id, await dal.candidateProfiles.findById(s.candidate_id)] as const),
    ),
  );

  const created = plan.to_create.map((s) => {
    const profile = profilesById.get(s.candidate_id);
    return createTaskRecord({
      title: s.title,
      description: s.description,
      category: s.category,
      priority: s.priority,
      status: "not_started",
      due_date: s.due_date,
      assigned_to: s.assigned_role ? null : profile?.assigned_manager_id ?? null,
      assigned_role: s.assigned_role,
      home_id: profile?.home_id ?? "home_oak",
      created_by: actor,
    });
  });

  if (created.length > 0) {
    createRecruitmentAuditRecord({
      candidate_id: null,
      actor_id: actor,
      event_type: "chase_reminders_synced",
      entity_type: "task",
      entity_id: null,
      before_state: null,
      after_state: { created: created.length, skipped_existing: plan.skipped_existing.length },
      notes: `Safer-recruitment chase reminders synced to the task system: ${created.length} created, ${plan.skipped_existing.length} already open.`,
    });
  }

  return NextResponse.json({
    data: {
      created: created.length,
      skipped_existing: plan.skipped_existing.length,
      tasks: created.map((t) => ({ id: t.id, title: t.title, priority: t.priority })),
    },
  });
}
