// ══════════════════════════════════════════════════════════════════════════════
// CARA — QUALITY-GATE ENFORCEMENT TESTS
//
// Pins: each gate BLOCKS the finalising transition when its requirement is absent
// and ALLOWS it when present; routine (non-finalising) edits are never gated; the
// board lists blocked records blocked-first; every block cites a statutory basis.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  buildGateBoard,
  checkIncidentClose,
  evaluateTransition,
  type TransitionInput,
} from "../quality-gate-engine";
import type { GateBoardInput } from "../types";

describe("incident close gate", () => {
  const inc = { id: "inc_1", status: "open", requires_oversight: true, has_oversight: false, child_id: "yp_alex" };

  it("BLOCKS closing an oversight-required incident with no oversight", () => {
    const d = evaluateTransition({ recordType: "incidents", targetStatus: "closed", incident: inc });
    expect(d.gate).toBe("incident_close");
    expect(d.allowed).toBe(false);
    expect(d.blocks[0].statutoryBasis).toMatch(/Reg 13/);
  });

  it("ALLOWS closing once oversight is recorded", () => {
    const d = evaluateTransition({ recordType: "incidents", targetStatus: "closed", incident: { ...inc, has_oversight: true } });
    expect(d.allowed).toBe(true);
    expect(d.blocks).toEqual([]);
  });

  it("does NOT gate a routine edit (not a closing transition)", () => {
    const d = evaluateTransition({ recordType: "incidents", targetStatus: "in_review", incident: inc });
    expect(d.gate).toBeNull();
    expect(d.allowed).toBe(true);
  });

  it("does NOT block an incident that never required oversight", () => {
    expect(checkIncidentClose({ id: "x", status: "open", requires_oversight: false, has_oversight: false })).toEqual([]);
  });
});

describe("restraint review gate", () => {
  it("BLOCKS signing off a review with no child debrief", () => {
    const d = evaluateTransition({ recordType: "restraints", targetStatus: "reviewed", restraint: { id: "rst_1", review_status: "pending", child_debriefed: false } });
    expect(d.gate).toBe("restraint_review");
    expect(d.allowed).toBe(false);
    expect(d.blocks[0].statutoryBasis).toMatch(/Reg 20/);
  });

  it("ALLOWS review once the child is debriefed", () => {
    const d = evaluateTransition({ recordType: "restraints", targetStatus: "reviewed", restraint: { id: "rst_1", review_status: "pending", child_debriefed: true } });
    expect(d.allowed).toBe(true);
  });
});

describe("missing episode close gate", () => {
  it("BLOCKS closing without a return home interview", () => {
    const d = evaluateTransition({ recordType: "missingEpisodes", targetStatus: "closed", missingEpisode: { id: "m_1", status: "active", has_return_interview: false } });
    expect(d.gate).toBe("missing_episode_close");
    expect(d.allowed).toBe(false);
    expect(d.blocks[0].statutoryBasis).toMatch(/return interview/i);
  });

  it("ALLOWS closing once the interview is recorded", () => {
    const d = evaluateTransition({ recordType: "missingEpisodes", targetStatus: "closed", missingEpisode: { id: "m_1", status: "active", has_return_interview: true } });
    expect(d.allowed).toBe(true);
  });
});

describe("task sign-off gate", () => {
  it("BLOCKS completing a sign-off task without sign-off", () => {
    const d = evaluateTransition({ recordType: "tasks", targetStatus: "completed", task: { id: "t_1", status: "in_progress", requires_sign_off: true, signed_off: false } });
    expect(d.gate).toBe("task_complete");
    expect(d.allowed).toBe(false);
  });

  it("does NOT gate a task that needs no sign-off", () => {
    const d = evaluateTransition({ recordType: "tasks", targetStatus: "completed", task: { id: "t_2", status: "in_progress", requires_sign_off: false, signed_off: false } });
    expect(d.allowed).toBe(true);
  });
});

describe("gate board", () => {
  const input: GateBoardInput = {
    homeId: "home_oak",
    asOf: "2026-07-05",
    incidents: [
      { id: "inc_open_gap", status: "open", requires_oversight: true, has_oversight: false },
      { id: "inc_open_ok", status: "open", requires_oversight: true, has_oversight: true },
      { id: "inc_closed", status: "closed", requires_oversight: true, has_oversight: false }, // already closed → excluded
    ],
    restraints: [{ id: "rst_gap", review_status: "pending", child_debriefed: false }],
    missingEpisodes: [{ id: "m_ok", status: "active", has_return_interview: true }],
    tasks: [
      { id: "t_gap", status: "in_progress", requires_sign_off: true, signed_off: false },
      { id: "t_plain", status: "in_progress", requires_sign_off: false, signed_off: false }, // not gated → excluded
    ],
  };

  const board = buildGateBoard(input);

  it("excludes already-closed records and un-gated tasks", () => {
    expect(board.entries.some((e) => e.recordId === "inc_closed")).toBe(false);
    expect(board.entries.some((e) => e.recordId === "t_plain")).toBe(false);
  });

  it("counts the blocked records and lists them blocked-first", () => {
    expect(board.summary.blocked).toBe(3); // inc_open_gap, rst_gap, t_gap
    expect(board.entries[0].blocked).toBe(true);
  });

  it("marks a fully-evidenced record as not blocked (can proceed)", () => {
    const ok = board.entries.find((e) => e.recordId === "inc_open_ok");
    expect(ok).toBeTruthy();
    expect(ok!.blocked).toBe(false);
  });
});
