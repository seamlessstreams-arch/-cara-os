// ══════════════════════════════════════════════════════════════════════════════
// Four places that took an actor and recorded nobody.
//
// Each of these accepted a `removedBy` / `submittedBy` / `staffId` argument and
// then wrote a record that could not say who had acted. In every case the
// siblings around them do record it — which is what makes these omissions
// rather than decisions, and what made them findable: the accepted-but-unused
// parameter was the only trace.
//
//   retention-engine.removeHold — every other transition on FiledDocument
//     records a By and an At (filedBy, destroyedBy, destructionApprovedBy,
//     holdPlacedBy). Only lifting a legal hold recorded neither. A hold is what
//     stops a document being destroyed, so who released it is exactly what an
//     inspector or a court asks about afterwards.
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
import { removeHold, placeHold, type FiledDocument } from "@/lib/filing-cabinet/retention-engine";
import { CaraApprovalEngine } from "@/lib/cara/approval/approval-engine";
import { processBuildingCheckFail, processVehicleDefect } from "@/lib/db/linked-updates";
import { db } from "@/lib/db/store";

// ── Legal holds ─────────────────────────────────────────────────────────────

function heldDocument(): FiledDocument {
  const base = {
    id: "doc_1",
    title: "Safeguarding chronology",
    category: "safeguarding" as FiledDocument["category"],
    childId: "yp_alex",
    filedBy: "staff_darren",
    filedAt: "2026-01-04T09:00:00.000Z",
    retentionExpiresAt: "2050-01-04",
    status: "active" as FiledDocument["status"],
  } as FiledDocument;

  const held = placeHold(base, "Ongoing LADO enquiry", "staff_darren", "registered_manager");
  expect(held.success, "fixture: the hold must be placed").toBe(true);
  return held.document as FiledDocument;
}

describe("removing a legal hold records who removed it", () => {
  it("attributes the removal", () => {
    const result = removeHold(heldDocument(), "staff_chervelle", "registered_manager");

    expect(result.success).toBe(true);
    expect(result.document?.holdRemovedBy).toBe("staff_chervelle");
    expect(result.document?.holdRemovedAt).toBeTruthy();
  });

  it("still clears the hold itself", () => {
    const result = removeHold(heldDocument(), "staff_chervelle", "registered_manager");

    expect(result.document?.status).toBe("archived");
    expect(result.document?.holdReason).toBeUndefined();
    expect(result.document?.holdPlacedBy).toBeUndefined();
  });

  it("records nobody when the removal is refused", () => {
    const result = removeHold(heldDocument(), "staff_new", "rsw");

    expect(result.success).toBe(false);
    expect(result.document).toBeUndefined();
  });
});

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

describe("linked-update handlers still do their visible work", () => {
  it("a failed building check still raises a task and a notification", () => {
    const before = db.notifications.findAll().length;

    expect(() =>
      processBuildingCheckFail(
        "bchk_x", "fire_safety", "stairwell", "critical",
        "Clear the obstruction and re-check.", "staff_edward", "home_oak",
      ),
    ).not.toThrow();

    expect(db.notifications.findAll().length).toBe(before + 1);
  });

  it("a vehicle defect still raises a task and a notification", () => {
    const before = db.notifications.findAll().length;

    expect(() =>
      processVehicleDefect(
        "veh_x", "AB12 CDE", "Nearside tyre below limit.", "fail",
        "staff_edward", "home_oak",
      ),
    ).not.toThrow();

    expect(db.notifications.findAll().length).toBe(before + 1);
  });
});
