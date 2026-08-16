import { describe, it, expect } from "vitest";
import { competenceColumns } from "@/app/api/intelligence/competence/route";

// The competence upsert used to supply EVERY column with a default:
//   dbs_status: fields.dbsStatus ?? "not_started"
//   right_to_work: fields.rightToWork ?? false
//   restrictions: fields.restrictions ?? []
//
// On INSERT those defaults are harmless. On the conflict path — which is the
// path the page's "Approve Competency" button takes for any staff member who
// already has a record — they are an update that writes over columns the
// caller never mentioned. One click sending only `mandatoryTrainingComplete`
// reset that staff member's DBS status to "not started", their right to work
// and references to false, and emptied restrictions, compliments and
// performance concerns. It reported success.
//
// The rule these tests hold: a field that was not supplied must not be
// written. Absent means "not supplied", never "supplied as nothing" — the
// fabricate-on-empty prohibition applied to a write path.

describe("competenceColumns — a partial update stays partial", () => {
  it("writes only the field that was supplied", () => {
    expect(competenceColumns({ mandatoryTrainingComplete: true })).toEqual({
      mandatory_training_complete: true,
    });
  });

  it("does NOT reset DBS, right-to-work or restrictions when approving competency", () => {
    const cols = competenceColumns({ mandatoryTrainingComplete: true });
    expect(cols).not.toHaveProperty("dbs_status");
    expect(cols).not.toHaveProperty("right_to_work");
    expect(cols).not.toHaveProperty("references_received");
    expect(cols).not.toHaveProperty("restrictions");
    expect(cols).not.toHaveProperty("compliments");
    expect(cols).not.toHaveProperty("performance_concerns");
  });

  it("maps camelCase to the snake_case column", () => {
    expect(competenceColumns({ dbsStatus: "valid", canLoneWork: true })).toEqual({
      dbs_status: "valid",
      can_lone_work: true,
    });
  });

  it("writes an explicit false, an explicit empty array and an explicit zero", () => {
    // Deliberately supplied emptiness IS a value and must reach the record —
    // this is what separates "not supplied" from "supplied as nothing".
    expect(competenceColumns({ canLoneWork: false })).toEqual({ can_lone_work: false });
    expect(competenceColumns({ restrictions: [] })).toEqual({ restrictions: [] });
    expect(competenceColumns({ referenceCount: 0 })).toEqual({ reference_count: 0 });
  });

  it("treats an explicitly undefined field as not supplied", () => {
    expect(competenceColumns({ dbsStatus: undefined })).toEqual({});
  });

  it("ignores keys that are not competence columns", () => {
    expect(competenceColumns({ staffId: "s1", homeId: "h1", nonsense: 1 })).toEqual({});
  });

  it("an empty body writes nothing at all", () => {
    expect(competenceColumns({})).toEqual({});
  });

  it("carries a full record through unchanged when every field IS supplied", () => {
    const cols = competenceColumns({
      dbsStatus: "valid",
      rightToWork: true,
      restrictions: [{ restriction: "No lone working", reason: "Pending review" }],
      performanceConcerns: ["Late three times"],
    });
    expect(cols).toEqual({
      dbs_status: "valid",
      right_to_work: true,
      restrictions: [{ restriction: "No lone working", reason: "Pending review" }],
      performance_concerns: ["Late three times"],
    });
  });
});
