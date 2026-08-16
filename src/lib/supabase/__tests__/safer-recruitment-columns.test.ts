import { describe, it, expect } from "vitest";
import { saferRecruitmentColumns } from "@/lib/supabase/queries";

// The barred-list and prohibition checks had no field to live in, which is how
// /workforce/qualifications came to hardcode `barred_list_checked: true` for a
// whole staff team (#939). They have columns now — and a write path, which is
// the part that needs a fence.
//
// A staff_members row also carries salary, role and employment status. The
// screen that records a barred-list check has no business reaching any of it.
// This is the fourth allowlist of this shape: reg44 responses (#936),
// competence columns (#939), reg45 sections (#940), and now this.

describe("saferRecruitmentColumns — what a check may write", () => {
  it("passes the three checks and their dates", () => {
    expect(saferRecruitmentColumns({
      barred_list_checked_date: "2026-03-12",
      barred_list_checked_by: "Olivia Hayes",
    })).toEqual({
      barred_list_checked_date: "2026-03-12",
      barred_list_checked_by: "Olivia Hayes",
    });
  });

  it("passes the DBS fields", () => {
    expect(saferRecruitmentColumns({ dbs_number: "DBS001", dbs_update_service: true }))
      .toEqual({ dbs_number: "DBS001", dbs_update_service: true });
  });

  it("lets an explicit null CLEAR a check — a mistake has to be correctable", () => {
    expect(saferRecruitmentColumns({ prohibition_checked_date: null, prohibition_checked_by: null }))
      .toEqual({ prohibition_checked_date: null, prohibition_checked_by: null });
  });

  it("treats undefined as not supplied, so a partial save leaves the rest alone", () => {
    expect(saferRecruitmentColumns({ barred_list_checked_date: undefined })).toEqual({});
  });
});

describe("saferRecruitmentColumns — what it refuses", () => {
  it("cannot reach pay", () => {
    expect(saferRecruitmentColumns({ annual_salary: 999999, hourly_rate: 100 })).toEqual({});
  });

  it("cannot reach role, status or the home a person belongs to", () => {
    expect(saferRecruitmentColumns({
      role: "registered_manager",
      employment_status: "active",
      home_id: "home_other",
      is_active: true,
    })).toEqual({});
  });

  it("cannot reach identity or audit columns", () => {
    expect(saferRecruitmentColumns({ id: "x", first_name: "Someone", created_by: "x" })).toEqual({});
  });

  it("writes nothing at all for an empty body", () => {
    expect(saferRecruitmentColumns({})).toEqual({});
  });

  it("keeps only the allowlisted keys from a mixed body", () => {
    expect(saferRecruitmentColumns({
      barred_list_checked_date: "2026-03-12",
      annual_salary: 999999,
      role: "registered_manager",
    })).toEqual({ barred_list_checked_date: "2026-03-12" });
  });
});
