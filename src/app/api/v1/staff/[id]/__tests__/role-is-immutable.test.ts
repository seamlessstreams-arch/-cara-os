// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/staff/[id] CANNOT CHANGE A ROLE
//
// The create route now caps the role a caller may assign at their own standing.
// That ceiling is worth nothing if the same person can create a care worker and
// then PATCH them to super_admin, so this route needs checking too.
//
// It does not need its own ceiling: PATCH writes through
// dal.staff.updateSaferRecruitment, which passes every input through
// saferRecruitmentColumns — a strict allowlist of DBS and right-to-work fields,
// applied on BOTH the Supabase and in-memory branches. `role` is not on it.
//
// That is a property of the allowlist, not of the handler, so it could be
// undone by a well-meaning addition to SAFER_RECRUITMENT_COLUMNS. These pin it
// at both levels rather than leaving it resting on a reading of the code.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { saferRecruitmentColumns } from "@/lib/supabase/queries";

describe("the safer-recruitment allowlist", () => {
  it("drops role, however it is supplied", () => {
    const out = saferRecruitmentColumns({
      role: "super_admin",
      dbs_number: "123456",
    });
    expect(out).not.toHaveProperty("role");
    expect(out).toHaveProperty("dbs_number", "123456");
  });

  it("drops the other escalation levers too", () => {
    const out = saferRecruitmentColumns({
      auth_user_id: "00000000-0000-0000-0000-00000000dead",
      home_id: "somewhere_else",
      is_active: true,
      employment_status: "active",
      dbs_number: "123456",
    });
    expect(Object.keys(out)).toEqual(["dbs_number"]);
  });

  it("keeps only allowlisted fields, and nothing else survives", () => {
    const out = saferRecruitmentColumns({
      role: "super_admin",
      full_name: "Mallory Malice",
      wizard: true,
    });
    expect(out).toEqual({});
  });

  it("an explicit null still clears an allowlisted check", () => {
    // Recording a check in error must be correctable; clearing is different
    // from never having recorded.
    const out = saferRecruitmentColumns({ dbs_number: null, role: "super_admin" });
    expect(out).toEqual({ dbs_number: null });
  });
});
