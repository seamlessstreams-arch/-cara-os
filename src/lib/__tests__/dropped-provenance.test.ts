// ══════════════════════════════════════════════════════════════════════════════
// Three places that took an actor and recorded nobody.
//
// Each of these accepted a `submittedBy` / `staffId` argument and then wrote a
// record that could not say who had acted. In every case the siblings around
// them do record it — which is what makes these omissions rather than
// decisions, and what made them findable: the accepted-but-unused parameter was
// the only trace.
//
//   approval-engine.submitForReview — reviewedBy/At and finalisedBy/At were
//     both stored; submission stored nothing.
//
//   linked-updates building-check + vehicle-defect — every sibling handler
//     credits its automation through trackTimeSaved. These two created the task
//     and the notification and credited nothing, so the home's own time-saved
//     figure under-reported the automation it had actually done.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { CaraApprovalEngine } from "@/lib/cara/approval/approval-engine";
import { processBuildingCheckFail, processVehicleDefect } from "@/lib/db/linked-updates";
import { db } from "@/lib/db/store";

// ── Approval submission ─────────────────────────────────────────────────────

describe("submitting a draft for review records who submitted it", () => {
  it("attributes the submission", () => {
    const engine = new CaraApprovalEngine();
    const record = engine.createApprovalRecord(
      {
        id: "task_1",
        taskType: "daily_log_draft",
        model: "claude-sonnet-5",
        provider: "anthropic",
        riskLevel: "low",
        sensitivityLevel: "child_identifiable",
        promptHash: "hash",
        redactionApplied: false,
        generatedAt: "2026-08-21T09:00:00.000Z",
      } as unknown as Parameters<CaraApprovalEngine["createApprovalRecord"]>[0],
      "org_1",
      "home_oak",
    );

    const submitted = engine.submitForReview(record.id, "staff_ryan");

    expect(submitted.status).toBe("pending_review");
    expect(submitted.submittedBy).toBe("staff_ryan");
    expect(submitted.submittedAt).toBeTruthy();
  });
});

// ── Automation credit ───────────────────────────────────────────────────────

// The credit itself cannot be asserted here, and that is worth stating rather
// than faking: trackTimeSaved reaches the store through a lazy
// require("@/lib/db/store") — needed because the store imports this module —
// and that require silently no-ops under vitest. It is wrapped in `catch {}`,
// so nothing surfaces. The EXISTING sibling handlers were checked and behave
// identically (processIncidentCreated records nothing here either), and a
// vi.mock of the store does not reach the require. So this is a pre-existing
// limit of the test environment, not a property of the change.
//
// What these do assert is that the handlers still complete and still perform
// their visible work, which is the regression risk of adding calls to them.

// These handlers are async now: they resolve the assignee from the dal rather
// than naming a seeded person, and write the notification through the dal so it
// survives a restart. With Supabase off the dal falls through to the in-memory
// store, so the assertion below still observes the write — it just has to await
// it first. Calling them without awaiting asserted before the promise settled.
describe("linked-update handlers still do their visible work", () => {
  it("a failed building check still raises a task and a notification", async () => {
    const before = db.notifications.findAll().length;

    await expect(
      processBuildingCheckFail(
        "bchk_x", "fire_safety", "stairwell", "critical",
        "Clear the obstruction and re-check.", "staff_edward", "home_oak",
      ),
    ).resolves.not.toThrow();

    expect(db.notifications.findAll().length).toBe(before + 1);
  });

  it("a vehicle defect still raises a task and a notification", async () => {
    const before = db.notifications.findAll().length;

    await expect(
      processVehicleDefect(
        "veh_x", "AB12 CDE", "Nearside tyre below limit.", "fail",
        "staff_edward", "home_oak",
      ),
    ).resolves.not.toThrow();

    expect(db.notifications.findAll().length).toBe(before + 1);
  });
});
