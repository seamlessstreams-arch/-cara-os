// ══════════════════════════════════════════════════════════════════════════════
// CARA — WHO HOLDS A ROLE AT THIS HOME
//
// The linked-updates engine assigns the tasks it generates and addresses the
// notifications it sends. It used to do that with literals:
//
//   assigned_to:  "staff_darren",  assigned_role: "registered_manager"
//   recipient_id: "staff_darren",
//   sendPushToUser("staff_darren", ...)
//
// The role beside each one says what was meant — "the RM", "the deputy" — so
// the intent was never in doubt; the lookup was simply never written.
//
// It has to read the DATABASE, not the in-memory store. store.ts:11740 empties
// every seeded array when NEXT_PUBLIC_CARA_MODE=live, and nothing rehydrates
// it: the only `store.staff.push` is db.staff.create. So on a live tenant
// db.staff.findAll() is [] and every role lookup against it returns null
// forever — which is why this reads through the dal instead.
//
// ── When nobody holds the role ───────────────────────────────────────────────
//
// Returns null, and the caller leaves the field empty. A task that says
// assigned_role: "registered_manager" with no assignee is visibly unassigned
// and can be picked up; a task assigned to somebody who does not work at the
// home looks handled and is not. The second is how work disappears.
//
// Oak House had no registered_manager at all until it was set, which is the
// state this has to degrade gracefully into rather than paper over.
// ══════════════════════════════════════════════════════════════════════════════

import { dal } from "@/lib/db/dal";

type Staffish = { id: string; role?: string | null; is_active?: boolean | null };

async function activeWithRole(...roles: string[]): Promise<string | null> {
  try {
    const staff = (await dal.staff.findAll()) as unknown as Staffish[];
    for (const role of roles) {
      const hit = staff.find((s) => s.role === role && s.is_active !== false);
      if (hit?.id) return hit.id;
    }
    return null;
  } catch {
    // A failed staff read must not take down the record that triggered it.
    return null;
  }
}

/** The home's Registered Manager, or null if the post is vacant. */
export function registeredManagerId(): Promise<string | null> {
  return activeWithRole("registered_manager");
}

/** The deputy, falling back to a team leader and then the RM — the same chain
 *  resolveNotificationRecipient() in automation/action-executor.ts uses for
 *  "notify_senior", kept identical on purpose so two parts of the app do not
 *  disagree about who the senior on duty is. */
export function deputyOrSeniorId(): Promise<string | null> {
  return activeWithRole("deputy_manager", "team_leader", "registered_manager");
}
