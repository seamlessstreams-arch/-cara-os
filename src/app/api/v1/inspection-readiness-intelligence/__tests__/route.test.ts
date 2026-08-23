import { describe, it, expect } from "vitest";
import { GET } from "../route";
import { getStore } from "@/lib/db/store";

// Typing the dal let tsc see that this route compared enum fields against
// values their unions do not contain (TS2367). Two of them decided headline
// Ofsted-readiness numbers, and both reported a flat zero for every home:
//
//   TrainingRecord.status is compliant|expiring_soon|expired|not_started; the
//   filter asked for "completed"|"current", so training compliance read 0%.
//
//   EducationRecordType spells it "pep_meeting"; the filter asked for "pep",
//   so no PEP was ever found. Isolated against this fixture, that one alone
//   moved "Education & Learning" from 67% to 0%, the "Overall Experiences and
//   Progress of Children" judgment area from 69 to 35, and the home's overall
//   readiness score from 55 to 43.
//
// Both assertions compute the expected figure from the store rather than
// hard-coding it, so they survive seed changes, and each pins the zero.

const matrixRow = (body: { compliance_matrix: { area: string; rate: number; detail: string }[] }, area: string) =>
  body.compliance_matrix.find((r) => r.area === area);

describe("GET /api/v1/inspection-readiness-intelligence", () => {
  it("rates training against the status the records actually carry", async () => {
    const store = getStore();
    const mandatory = store.trainingRecords.filter((t) => t.is_mandatory);
    const compliant = mandatory.filter((t) => t.status === "compliant").length;

    // Non-vacuity: with no compliant mandatory training in the fixture, a
    // broken route would agree with a broken expectation at zero.
    expect(mandatory.length).toBeGreaterThan(0);
    expect(compliant).toBeGreaterThan(0);

    const body = (await (await GET()).json()).data;
    const training = matrixRow(body, "Training");

    expect(training?.rate).toBe(Math.round((compliant / mandatory.length) * 100));
    expect(training?.rate).toBeGreaterThan(0); // it used to be 0 for every home
  });

  it("counts overdue training as the mandatory records that actually expired", async () => {
    const store = getStore();
    const expired = store.trainingRecords.filter((t) => t.is_mandatory && t.status === "expired").length;
    expect(expired).toBeGreaterThan(0);

    const body = (await (await GET()).json()).data;
    expect(matrixRow(body, "Training")?.detail).toContain(String(expired));
  });

  it("finds PEP records under the record_type EducationRecordType defines", async () => {
    const store = getStore();
    const peps = (store.educationRecords ?? []).filter((r) => r.record_type === "pep_meeting");
    const current = store.youngPeople.filter((c) => c.status === "current");
    const withPep = current.filter((c) => peps.some((p) => p.child_id === c.id));

    // Non-vacuity: the fixture must actually have PEPs for current children,
    // or "education is not at 0%" would prove nothing.
    expect(withPep.length).toBeGreaterThan(0);

    const body = (await (await GET()).json()).data;
    const experiences = body.judgment_areas.find(
      (a: { area: string }) => a.area === "overall_experiences",
    );
    const educationGap = experiences.gaps.find((g: string) => g.startsWith("Education & Learning compliance"));

    expect(educationGap).not.toContain("at 0%");
  });
});
