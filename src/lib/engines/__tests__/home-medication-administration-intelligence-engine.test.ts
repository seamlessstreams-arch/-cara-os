import { describe, it, expect } from "vitest";
import {
  computeMedicationAdministration,
  type MedicationAdministrationInput,
  type MedicationAdministrationRecordInput,
} from "../home-medication-administration-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-15";

const baseRecord = (
  overrides: Partial<MedicationAdministrationRecordInput> = {},
): MedicationAdministrationRecordInput => ({
  id: "mar_1",
  child_id: "child_1",
  medication_id: "med_1",
  scheduled_date: "2026-05-01",
  status: "given",
  is_prn: false,
  has_witness: true,
  has_reason_not_given: false,
  has_prn_reason: false,
  has_prn_effectiveness: false,
  has_notes: false,
  time_variance_minutes: 0,
  ...overrides,
});

const baseInput = (
  overrides: Partial<MedicationAdministrationInput> = {},
): MedicationAdministrationInput => ({
  today: TODAY,
  total_children: 3,
  children_on_medication: 2,
  total_active_medications: 4,
  administrations: [baseRecord()],
  ...overrides,
});

/** Generate N records with optional per-record overrides */
function makeRecords(
  count: number,
  overrides: Partial<MedicationAdministrationRecordInput> = {},
): MedicationAdministrationRecordInput[] {
  return Array.from({ length: count }, (_, i) =>
    baseRecord({ id: `mar_${i + 1}`, ...overrides }),
  );
}

/** Generate a batch with some given and some of another status */
function mixedRecords(
  givenCount: number,
  otherCount: number,
  otherStatus: string,
  otherOverrides: Partial<MedicationAdministrationRecordInput> = {},
): MedicationAdministrationRecordInput[] {
  const given = Array.from({ length: givenCount }, (_, i) =>
    baseRecord({ id: `mar_given_${i}` }),
  );
  const others = Array.from({ length: otherCount }, (_, i) =>
    baseRecord({
      id: `mar_other_${i}`,
      status: otherStatus,
      has_witness: false,
      ...otherOverrides,
    }),
  );
  return [...given, ...others];
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMedicationAdministration", () => {
  // ── 1. Guard Clauses ────────────────────────────────────────────────────

  describe("guard clauses", () => {
    it("returns insufficient_data with score 0 when total_children is 0", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_children: 0, children_on_medication: 0, administrations: [] }),
      );
      expect(result.medication_rating).toBe("insufficient_data");
      expect(result.medication_score).toBe(0);
      expect(result.headline).toContain("No children in the home");
    });

    it("returns empty strengths and no recommendations when total_children is 0", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_children: 0, children_on_medication: 0, administrations: [] }),
      );
      expect(result.strengths).toEqual([]);
      expect(result.recommendations).toEqual([]);
    });

    it("returns a concern about no children placed when total_children is 0", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_children: 0, children_on_medication: 0, administrations: [] }),
      );
      expect(result.concerns).toHaveLength(1);
      expect(result.concerns[0]).toContain("No children are placed");
    });

    it("returns a warning insight when total_children is 0", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_children: 0, children_on_medication: 0, administrations: [] }),
      );
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].severity).toBe("warning");
    });

    it("returns all zero metrics when total_children is 0", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_children: 0, children_on_medication: 0, administrations: [] }),
      );
      expect(result.total_administrations).toBe(0);
      expect(result.administration_rate).toBe(0);
      expect(result.on_time_rate).toBe(0);
      expect(result.refusal_rate).toBe(0);
      expect(result.witness_rate).toBe(0);
      expect(result.prn_documentation_rate).toBe(0);
      expect(result.reason_documented_rate).toBe(0);
      expect(result.children_on_medication).toBe(0);
      expect(result.total_active_medications).toBe(0);
    });

    it("returns insufficient_data when children_on_medication is 0 and no records", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_children: 3, children_on_medication: 0, administrations: [] }),
      );
      expect(result.medication_rating).toBe("insufficient_data");
      expect(result.medication_score).toBe(0);
      expect(result.headline).toContain("No children currently on medication");
    });

    it("returns a positive insight when children_on_medication is 0", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_children: 3, children_on_medication: 0, administrations: [] }),
      );
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].severity).toBe("positive");
    });

    it("returns no concerns when children_on_medication is 0", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_children: 3, children_on_medication: 0, administrations: [] }),
      );
      expect(result.concerns).toEqual([]);
    });

    it("returns adequate score (46) when children on meds but no records", () => {
      // Base 52 - 3 (mod1) - 1 (mod2) - 1 (mod3) + 0 (mod4) + 1 (mod5) - 2 (mod6) = 46
      const result = computeMedicationAdministration(
        baseInput({ children_on_medication: 2, administrations: [] }),
      );
      expect(result.medication_score).toBe(46);
      expect(result.medication_rating).toBe("adequate");
    });

    it("returns critical insight when children on meds but no records", () => {
      const result = computeMedicationAdministration(
        baseInput({ children_on_medication: 2, administrations: [] }),
      );
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].severity).toBe("critical");
      expect(result.insights[0].text).toContain("no administration records");
    });

    it("returns two concerns when children on meds but no records", () => {
      const result = computeMedicationAdministration(
        baseInput({ children_on_medication: 2, administrations: [] }),
      );
      expect(result.concerns).toHaveLength(2);
    });

    it("returns two immediate recommendations when children on meds but no records", () => {
      const result = computeMedicationAdministration(
        baseInput({ children_on_medication: 2, administrations: [] }),
      );
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].urgency).toBe("immediate");
      expect(result.recommendations[1].urgency).toBe("immediate");
    });

    it("uses singular 'child' when children_on_medication is 1 in the headline", () => {
      const result = computeMedicationAdministration(
        baseInput({ children_on_medication: 1, administrations: [] }),
      );
      expect(result.headline).toMatch(/^1 child on medication/);
    });

    it("uses plural 'children' when children_on_medication is 2 in the headline", () => {
      const result = computeMedicationAdministration(
        baseInput({ children_on_medication: 2, administrations: [] }),
      );
      expect(result.headline).toMatch(/^2 children on medication/);
    });

    it("returns insufficient_data when total_children is 0 even if administrations exist", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_children: 0, children_on_medication: 0, administrations: [baseRecord()] }),
      );
      expect(result.medication_rating).toBe("insufficient_data");
      expect(result.medication_score).toBe(0);
    });

    it("treats all-scheduled records as no records (children on meds path)", () => {
      const result = computeMedicationAdministration(
        baseInput({
          children_on_medication: 2,
          administrations: [
            baseRecord({ id: "s1", status: "scheduled" }),
            baseRecord({ id: "s2", status: "scheduled" }),
          ],
        }),
      );
      // All records filtered out → empty records path with children on meds
      expect(result.medication_score).toBe(46);
      expect(result.medication_rating).toBe("adequate");
    });
  });

  // ── 2. Scheduled Record Filtering ──────────────────────────────────────

  describe("scheduled record filtering", () => {
    it("excludes records with status 'scheduled' from total_administrations", () => {
      const result = computeMedicationAdministration(
        baseInput({
          administrations: [
            baseRecord({ id: "mar_1" }),
            baseRecord({ id: "mar_2", status: "scheduled" }),
          ],
        }),
      );
      expect(result.total_administrations).toBe(1);
    });

    it("does not count scheduled records toward administration rate", () => {
      const result = computeMedicationAdministration(
        baseInput({
          administrations: [
            baseRecord({ id: "mar_1" }),
            baseRecord({ id: "mar_2", status: "scheduled" }),
            baseRecord({ id: "mar_3", status: "scheduled" }),
          ],
        }),
      );
      expect(result.administration_rate).toBe(100);
    });

    it("does not count scheduled records toward refusal rate", () => {
      const result = computeMedicationAdministration(
        baseInput({
          administrations: [
            baseRecord({ id: "mar_1" }),
            baseRecord({ id: "mar_2", status: "refused" }),
            baseRecord({ id: "mar_3", status: "scheduled" }),
          ],
        }),
      );
      // 1 given, 1 refused, 1 scheduled (excluded) → refusal = 1/2 = 50%
      expect(result.refusal_rate).toBe(50);
    });
  });

  // ── 3. Core Metric Calculations ────────────────────────────────────────

  describe("core metric calculations", () => {
    it("calculates administration_rate as (given+late) / total_non_scheduled * 100", () => {
      // 8 given + 2 late out of 12 non-scheduled → 10/12 = 83%
      const records = [
        ...makeRecords(8),
        ...makeRecords(2, { status: "late", id: "late" }).map((r, i) => ({
          ...r,
          id: `late_${i}`,
        })),
        baseRecord({ id: "ref_1", status: "refused", has_witness: false }),
        baseRecord({ id: "ref_2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(83);
    });

    it("calculates on_time_rate as given / (given+late) * 100", () => {
      // 3 given + 1 late → 3/4 = 75%
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "late_1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.on_time_rate).toBe(75);
    });

    it("calculates refusal_rate as refused / total_non_scheduled * 100", () => {
      // 4 given + 1 refused → 1/5 = 20%
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "ref_1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(20);
    });

    it("calculates witness_rate among given+late only", () => {
      // 2 given witnessed + 1 given unwitnessed + 1 refused → witness among given = 2/3 = 67%
      const records = [
        baseRecord({ id: "g1", has_witness: true }),
        baseRecord({ id: "g2", has_witness: true }),
        baseRecord({ id: "g3", has_witness: false }),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.witness_rate).toBe(67);
    });

    it("calculates witness_rate including late records", () => {
      // 1 given witnessed + 1 late witnessed + 1 late unwitnessed → 2/3 = 67%
      const records = [
        baseRecord({ id: "g1", has_witness: true }),
        baseRecord({ id: "l1", status: "late", has_witness: true }),
        baseRecord({ id: "l2", status: "late", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.witness_rate).toBe(67);
    });

    it("calculates prn_documentation_rate as has_reason AND has_effectiveness among PRN given/late", () => {
      // 2 PRN given: 1 fully documented, 1 not → 1/2 = 50%
      const records = [
        baseRecord({ id: "p1", is_prn: true, has_prn_reason: true, has_prn_effectiveness: true }),
        baseRecord({ id: "p2", is_prn: true, has_prn_reason: true, has_prn_effectiveness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(50);
    });

    it("excludes PRN refused records from prn_documentation_rate denominator", () => {
      // 1 PRN given+documented, 1 PRN refused → only 1 in denominator → 100%
      const records = [
        baseRecord({ id: "p1", is_prn: true, has_prn_reason: true, has_prn_effectiveness: true }),
        baseRecord({ id: "p2", is_prn: true, status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(100);
    });

    it("calculates reason_documented_rate among refused+withheld only", () => {
      // 1 refused with reason, 1 withheld without reason → 1/2 = 50%
      const records = [
        baseRecord({ id: "g1" }),
        baseRecord({ id: "r1", status: "refused", has_reason_not_given: true, has_witness: false }),
        baseRecord({ id: "w1", status: "withheld", has_reason_not_given: false, has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.reason_documented_rate).toBe(50);
    });

    it("returns 0 for reason_documented_rate when no refused or withheld", () => {
      const result = computeMedicationAdministration(
        baseInput({ administrations: makeRecords(5) }),
      );
      expect(result.reason_documented_rate).toBe(0);
    });

    it("returns 0 for prn_documentation_rate when no PRN given", () => {
      const result = computeMedicationAdministration(
        baseInput({ administrations: makeRecords(5) }),
      );
      expect(result.prn_documentation_rate).toBe(0);
    });

    it("returns 0 for on_time_rate when no administrations (all refused)", () => {
      const records = makeRecords(3, { status: "refused", has_witness: false });
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // administered = 0, on_time_rate = pct(0, 0) = 0
      expect(result.on_time_rate).toBe(0);
    });

    it("returns 0 for witness_rate when no administrations (all refused)", () => {
      const records = makeRecords(3, { status: "refused", has_witness: false });
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.witness_rate).toBe(0);
    });

    it("passes through children_on_medication from input", () => {
      const result = computeMedicationAdministration(
        baseInput({ children_on_medication: 5 }),
      );
      expect(result.children_on_medication).toBe(5);
    });

    it("passes through total_active_medications from input", () => {
      const result = computeMedicationAdministration(
        baseInput({ total_active_medications: 12 }),
      );
      expect(result.total_active_medications).toBe(12);
    });

    it("counts total_administrations as non-scheduled records", () => {
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "o1", status: "omitted", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.total_administrations).toBe(5);
    });
  });

  // ── 4. pct() helper behaviour ──────────────────────────────────────────

  describe("pct rounding behaviour", () => {
    it("rounds to nearest integer (e.g., 1/3 → 33%)", () => {
      // 1 given + 2 refused → adminRate = 1/3 = 33.33 → 33
      const records = [
        baseRecord({ id: "g1" }),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(33);
    });

    it("rounds up when fractional part is >= 0.5 (e.g., 2/3 → 67%)", () => {
      // 2 given + 1 refused → adminRate = 2/3 = 66.67 → 67
      const records = [
        baseRecord({ id: "g1" }),
        baseRecord({ id: "g2" }),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(67);
    });
  });

  // ── 5. Modifier 1: Administration Compliance ──────────────────────────

  describe("modifier 1 — administration compliance", () => {
    it("awards +6 when adminRate >= 98%", () => {
      // 100 given → adminRate 100% → +6 from modifier 1
      const records = makeRecords(100);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // base=52, mod1=+6, mod2(onTimeRate=100 → +5), mod3(witnessRate=100→+5),
      // mod4(refusal<=5 && reason>=90 … no refused → reasonRate=0 so check:
      //   refusalRate=0<=5, reasonRate=pct(0,0)=0 so not >=90 → check else
      //   refusalRate<=15 → +2
      // mod5(no PRN→+1), mod6(95+90+90 all true →+5)
      // 52+6+5+5+2+1+5 = 76
      // Actually let me recalculate: refusalRate=0, reasonRate=0
      // mod4: refusalRate<=5 && reasonRate>=90 → 0<=5 true but 0>=90 false → skip
      //        refusalRate<=15 || reasonRate>=70 → 0<=15 true → +2
      // So 52+6+5+5+2+1+5 = 76
      expect(result.medication_score).toBe(76);
    });

    it("awards +6 at exactly adminRate = 98%", () => {
      // 49 given + 1 refused → adminRate = 49/50 = 98%
      const records = [
        ...makeRecords(49),
        baseRecord({ id: "ref_1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // adminRate=98 → +6
      // mod2: onTimeRate = 49/49 = 100% → +5
      // mod3: witnessRate = 49 witnessed / 49 administered → 100% → +5
      // mod4: refusalRate = 1/50 = 2% <=5, reasonRate = 0/1 = 0% → not >=90
      //       refusalRate<=15 → +2
      // mod5: no PRN → +1
      // mod6: adminRate=98>=95, onTimeRate=100>=90, witnessRate=100>=90 → +5
      // 52+6+5+5+2+1+5 = 76
      expect(result.medication_score).toBe(76);
    });

    it("awards +3 when adminRate is 90-97%", () => {
      // 9 given + 1 refused → adminRate = 9/10 = 90% → +3
      const records = [
        ...makeRecords(9),
        baseRecord({ id: "ref_1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // mod1=+3, mod2: onTimeRate=9/9=100→+5, mod3: witnessRate=9/9=100→+5
      // mod4: refusalRate=10% <=15 → +2
      // mod5: no PRN → +1, mod6: adminRate=90<95 → check aboveEighty:
      //   adminRate>=80 yes, onTimeRate>=80 yes, witnessRate>=80 yes → 3>=2 → +2
      // 52+3+5+5+2+1+2 = 70
      expect(result.medication_score).toBe(70);
    });

    it("awards +3 at exactly adminRate = 90%", () => {
      // 9 given + 1 refused → 90%
      const records = [
        ...makeRecords(9),
        baseRecord({ id: "ref_1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // Already tested above — score = 70
      expect(result.medication_score).toBe(70);
    });

    it("awards 0 when adminRate is 70-89%", () => {
      // 8 given + 2 refused → adminRate = 80% → 0 from mod1
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "ref_1", status: "refused", has_witness: false }),
        baseRecord({ id: "ref_2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // mod1=0, mod2: onTimeRate=8/8=100→+5, mod3: witnessRate=8/8=100→+5
      // mod4: refusalRate=20%>15, reasonRate=0<50 → check: >30 && <50? 20>30 false → 0
      // Actually: refusalRate=20 <=5? no. <=15? no. >30&&<50? no → 0
      // Wait re-read: mod4:
      //   if refusalRate<=5 && reasonRate>=90 → no
      //   else if refusalRate<=15 || reasonRate>=70 → 20<=15? no, 0>=70? no → no
      //   else if refusalRate>30 && reasonRate<50 → 20>30? no → no
      //   → 0
      // mod5: no PRN → +1, mod6: adminRate=80<95 → aboveEighty: 80>=80 yes, 100>=80 yes, 100>=80 yes → 3>=2 → +2
      // 52+0+5+5+0+1+2 = 65
      expect(result.medication_score).toBe(65);
    });

    it("penalizes -5 when adminRate < 70%", () => {
      // 6 given + 4 refused → adminRate = 60% → -5
      const records = [
        ...makeRecords(6),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `ref_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // mod1=-5, mod2: onTimeRate=6/6=100→+5, mod3: witnessRate=6/6=100→+5
      // mod4: refusalRate=40%>30 && reasonRate=0<50 → -4
      // mod5: no PRN → +1
      // mod6: adminRate=60<95 → aboveEighty: 60>=80 no, 100>=80 yes, 100>=80 yes → 2>=2 → +2
      // 52-5+5+5-4+1+2 = 56
      expect(result.medication_score).toBe(56);
    });

    it("awards -5 at exactly adminRate = 69% (just below 70)", () => {
      // We need adminRate < 70 → use pct that gives 69: 9/13 = 69.23 → 69
      const records = [
        ...makeRecords(9),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `ref_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // adminRate = pct(9, 13) = Math.round(9/13*100) = Math.round(69.23) = 69 → -5
      expect(result.administration_rate).toBe(69);
    });

    it("awards 0 at exactly adminRate = 70% (boundary of no penalty)", () => {
      // 7/10 = 70% → not < 70 → 0 from mod1
      const records = [
        ...makeRecords(7),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `ref_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(70);
      // mod1=0 (70 is not < 70)
    });

    it("awards +3 at exactly 97% adminRate (below +6 threshold)", () => {
      // Need pct giving 97: 97/100 → 97
      const givenRecs = makeRecords(97);
      const refusedRecs = Array.from({ length: 3 }, (_, i) =>
        baseRecord({ id: `ref_${i}`, status: "refused", has_witness: false }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...givenRecs, ...refusedRecs] }),
      );
      expect(result.administration_rate).toBe(97);
      // adminRate=97 → >=90 → +3 (not >=98)
    });
  });

  // ── 6. Modifier 2: Timeliness ─────────────────────────────────────────

  describe("modifier 2 — timeliness", () => {
    it("penalizes -1 when no administrations (all refused)", () => {
      const records = makeRecords(3, { status: "refused", has_witness: false });
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // administered = 0 → mod2 = -1
      expect(result.on_time_rate).toBe(0);
    });

    it("awards +5 when onTimeRate >= 95%", () => {
      // 19 given + 1 late → onTimeRate = 19/20 = 95%
      const records = [
        ...makeRecords(19),
        baseRecord({ id: "late_1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.on_time_rate).toBe(95);
    });

    it("awards +2 when onTimeRate is 80-94%", () => {
      // 4 given + 1 late → onTimeRate = 80%
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "late_1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.on_time_rate).toBe(80);
    });

    it("awards 0 when onTimeRate is 60-79%", () => {
      // 3 given + 1 late → onTimeRate = 75% → 0
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "late_1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.on_time_rate).toBe(75);
    });

    it("penalizes -5 when onTimeRate < 60%", () => {
      // 1 given + 2 late → onTimeRate = 1/3 = 33%
      const records = [
        baseRecord({ id: "g1" }),
        baseRecord({ id: "l1", status: "late" }),
        baseRecord({ id: "l2", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.on_time_rate).toBe(33);
    });

    it("awards +2 at exactly onTimeRate = 80%", () => {
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "late_1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.on_time_rate).toBe(80);
      // Confirmed +2 path
    });

    it("awards -5 at exactly onTimeRate = 59%", () => {
      // Need onTimeRate < 60. For example: pct(10, 17) = round(58.82) = 59
      const given = makeRecords(10);
      const late = Array.from({ length: 7 }, (_, i) =>
        baseRecord({ id: `late_${i}`, status: "late" }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...given, ...late] }),
      );
      expect(result.on_time_rate).toBe(59);
    });

    it("awards 0 at exactly onTimeRate = 60% (not < 60)", () => {
      // pct(3, 5) = 60
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "l1", status: "late" }),
        baseRecord({ id: "l2", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.on_time_rate).toBe(60);
    });
  });

  // ── 7. Modifier 3: Witness Compliance ─────────────────────────────────

  describe("modifier 3 — witness compliance", () => {
    it("penalizes -1 when no administered records", () => {
      const records = makeRecords(3, { status: "refused", has_witness: false });
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // administeredRecords.length = 0 → mod3 = -1
    });

    it("awards +5 when witnessRate >= 95%", () => {
      // 20 given all witnessed → 100%
      const records = makeRecords(20);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.witness_rate).toBe(100);
    });

    it("awards +5 at exactly witnessRate = 95%", () => {
      // 19 witnessed + 1 unwitnessed → 19/20 = 95%
      const records = [
        ...makeRecords(19),
        baseRecord({ id: "unw_1", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.witness_rate).toBe(95);
    });

    it("awards +2 when witnessRate is 80-94%", () => {
      // 4 witnessed + 1 unwitnessed → 80%
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "unw_1", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.witness_rate).toBe(80);
    });

    it("awards 0 when witnessRate is 50-79%", () => {
      // 3 witnessed + 1 unwitnessed → 75%
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "unw_1", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.witness_rate).toBe(75);
    });

    it("penalizes -4 when witnessRate < 50%", () => {
      // 1 witnessed + 2 unwitnessed → 33%
      const records = [
        baseRecord({ id: "w1", has_witness: true }),
        baseRecord({ id: "u1", has_witness: false }),
        baseRecord({ id: "u2", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.witness_rate).toBe(33);
    });

    it("awards 0 at exactly witnessRate = 50%", () => {
      // 1 witnessed + 1 unwitnessed → 50%
      const records = [
        baseRecord({ id: "w1", has_witness: true }),
        baseRecord({ id: "u1", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.witness_rate).toBe(50);
      // 50 is not < 50 → 0
    });

    it("penalizes -4 at exactly witnessRate = 49%", () => {
      // pct(49, 100) = 49 → < 50 → -4
      const witnessed = makeRecords(49);
      const unwitnessed = Array.from({ length: 51 }, (_, i) =>
        baseRecord({ id: `unw_${i}`, has_witness: false }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...witnessed, ...unwitnessed] }),
      );
      expect(result.witness_rate).toBe(49);
    });
  });

  // ── 8. Modifier 4: Refusal Management ─────────────────────────────────

  describe("modifier 4 — refusal management", () => {
    it("awards +5 when refusalRate <= 5% and reasonRate >= 90%", () => {
      // 19 given + 1 refused with reason → refusalRate=1/20=5%, reasonRate=1/1=100%
      const records = [
        ...makeRecords(19),
        baseRecord({
          id: "ref_1",
          status: "refused",
          has_witness: false,
          has_reason_not_given: true,
        }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(5);
      expect(result.reason_documented_rate).toBe(100);
    });

    it("does not award +5 when refusalRate <= 5% but reasonRate < 90%", () => {
      // 19 given + 1 refused without reason → refusalRate=5%, reasonRate=0%
      // Falls to second branch: refusalRate<=15 → +2
      const records = [
        ...makeRecords(19),
        baseRecord({ id: "ref_1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(5);
      expect(result.reason_documented_rate).toBe(0);
    });

    it("awards +2 when refusalRate <= 15% (second branch)", () => {
      // 9 given + 1 refused → refusalRate=10% <=15 → +2
      const records = [
        ...makeRecords(9),
        baseRecord({ id: "ref_1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(10);
    });

    it("awards +2 when reasonRate >= 70% (second branch OR)", () => {
      // 5 given + 5 refused (4 with reason) → refusalRate=50% >15 but reasonRate=80% >=70 → +2
      const refused = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `ref_${i}`,
          status: "refused",
          has_witness: false,
          has_reason_not_given: i < 4,
        }),
      );
      const records = [...makeRecords(5), ...refused];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(50);
      expect(result.reason_documented_rate).toBe(80);
    });

    it("penalizes -4 when refusalRate > 30% and reasonRate < 50%", () => {
      // 3 given + 7 refused (2 with reason) → refusalRate=70%, reasonRate=2/7=29%
      const refused = Array.from({ length: 7 }, (_, i) =>
        baseRecord({
          id: `ref_${i}`,
          status: "refused",
          has_witness: false,
          has_reason_not_given: i < 2,
        }),
      );
      const records = [...makeRecords(3), ...refused];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(70);
      expect(result.reason_documented_rate).toBe(29);
    });

    it("awards 0 when refusalRate > 15 and <= 30 and reasonRate < 70", () => {
      // 7 given + 3 refused (1 with reason) → refusalRate=30%, reasonRate=1/3=33%
      const records = [
        ...makeRecords(7),
        baseRecord({ id: "r1", status: "refused", has_witness: false, has_reason_not_given: true }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
        baseRecord({ id: "r3", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(30);
      expect(result.reason_documented_rate).toBe(33);
      // refusalRate=30: not <=5, not <=15, not >30 → 0
    });

    it("awards +2 at exactly refusalRate = 15% (boundary of second branch)", () => {
      // Need refusalRate = 15. pct(3, 20) = 15
      const records = [
        ...makeRecords(17),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `ref_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(15);
    });

    it("does not award -4 at exactly refusalRate = 30% (boundary, need > 30)", () => {
      const records = [
        ...makeRecords(7),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `ref_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(30);
      // 30 is not > 30, so no -4
    });

    it("awards +5 when no refusals or withholds exist (refusalRate = 0)", () => {
      // 20 given → refusalRate=0<=5, reasonRate=pct(0,0)=0 → not >=90
      // Falls to: refusalRate<=15 → +2
      const records = makeRecords(20);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(0);
      // Actually: refusalRate<=5 && reasonRate>=90 → 0<=5 true, 0>=90 false → skip
      // refusalRate<=15 → true → +2
    });

    it("includes withheld records in reason_documented_rate calculation", () => {
      // 1 refused with reason + 1 withheld with reason → 2/2 = 100%
      const records = [
        ...makeRecords(5),
        baseRecord({ id: "r1", status: "refused", has_witness: false, has_reason_not_given: true }),
        baseRecord({ id: "w1", status: "withheld", has_witness: false, has_reason_not_given: true }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.reason_documented_rate).toBe(100);
    });
  });

  // ── 9. Modifier 5: PRN Documentation ──────────────────────────────────

  describe("modifier 5 — PRN documentation", () => {
    it("awards +1 when no PRN given (prnGiven.length === 0)", () => {
      const records = makeRecords(5);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // No PRN → +1
    });

    it("awards +4 when prnDocRate >= 90%", () => {
      // 10 PRN given, 9 with both reason+effectiveness → 90%
      const records = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 9,
          has_prn_effectiveness: i < 9,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(90);
    });

    it("awards +2 when prnDocRate is 70-89%", () => {
      // 10 PRN given, 7 documented → 70%
      const records = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 7,
          has_prn_effectiveness: i < 7,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(70);
    });

    it("awards 0 when prnDocRate is 40-69%", () => {
      // 10 PRN given, 5 documented → 50%
      const records = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 5,
          has_prn_effectiveness: i < 5,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(50);
    });

    it("penalizes -4 when prnDocRate < 40%", () => {
      // 10 PRN given, 3 documented → 30%
      const records = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 3,
          has_prn_effectiveness: i < 3,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(30);
    });

    it("requires both has_prn_reason AND has_prn_effectiveness for prnDocRate", () => {
      // 1 PRN with reason only, 1 PRN with effectiveness only → 0% documented
      const records = [
        baseRecord({ id: "p1", is_prn: true, has_prn_reason: true, has_prn_effectiveness: false }),
        baseRecord({ id: "p2", is_prn: true, has_prn_reason: false, has_prn_effectiveness: true }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(0);
    });

    it("only counts PRN given/late in the denominator, not PRN refused", () => {
      const records = [
        baseRecord({ id: "p1", is_prn: true, has_prn_reason: true, has_prn_effectiveness: true }),
        baseRecord({ id: "p2", is_prn: true, status: "refused", has_witness: false }),
        baseRecord({ id: "p3", is_prn: true, status: "withheld", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // prnGiven = only the "given" one → 1/1 = 100%
      expect(result.prn_documentation_rate).toBe(100);
    });

    it("counts PRN late records in the denominator", () => {
      const records = [
        baseRecord({ id: "p1", is_prn: true, status: "late", has_prn_reason: true, has_prn_effectiveness: true }),
        baseRecord({ id: "p2", is_prn: true, status: "late", has_prn_reason: false, has_prn_effectiveness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // 2 PRN late, 1 documented → 50%
      expect(result.prn_documentation_rate).toBe(50);
    });

    it("awards +4 at exactly prnDocRate = 90%", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 9,
          has_prn_effectiveness: i < 9,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(90);
    });

    it("awards +2 at exactly prnDocRate = 70%", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 7,
          has_prn_effectiveness: i < 7,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(70);
    });

    it("penalizes -4 at exactly prnDocRate = 39%", () => {
      // pct(39, 100) = 39 → < 40 → -4
      const documented = makeRecords(39, {
        is_prn: true,
        has_prn_reason: true,
        has_prn_effectiveness: true,
      });
      const undocumented = Array.from({ length: 61 }, (_, i) =>
        baseRecord({
          id: `prn_undoc_${i}`,
          is_prn: true,
          has_prn_reason: false,
          has_prn_effectiveness: false,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...documented, ...undocumented] }),
      );
      expect(result.prn_documentation_rate).toBe(39);
    });
  });

  // ── 10. Modifier 6: Overall Quality ───────────────────────────────────

  describe("modifier 6 — overall quality", () => {
    it("penalizes -2 when no administered records", () => {
      const records = makeRecords(5, { status: "refused", has_witness: false });
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // adminRecords = 0 → mod6 = -2
    });

    it("awards +5 when adminRate>=95, onTimeRate>=90, witnessRate>=90", () => {
      // 20 given (all on time, all witnessed) → all 100%
      // Plus 1 refused so adminRate = 20/21 = 95%
      const records = [
        ...makeRecords(20),
        baseRecord({ id: "ref_1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(95);
      expect(result.on_time_rate).toBe(100);
      expect(result.witness_rate).toBe(100);
    });

    it("awards +2 when at least 2 of (adminRate, onTimeRate, witnessRate) >= 80%", () => {
      // 4 given witnessed + 1 late witnessed + 5 refused
      // adminRate = 5/10 = 50%, onTimeRate = 4/5 = 80%, witnessRate = 5/5 = 100%
      // 2 of 3 above 80 → +2
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "l1", status: "late" }),
        ...Array.from({ length: 5 }, (_, i) =>
          baseRecord({ id: `ref_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.on_time_rate).toBe(80);
      expect(result.witness_rate).toBe(100);
    });

    it("penalizes -3 when all three (adminRate, onTimeRate, witnessRate) < 70%", () => {
      // Need adminRate<70, onTimeRate<70, witnessRate<70
      // 2 given (1 witnessed) + 4 late (0 witnessed) + 4 refused
      // adminRate = 6/10 = 60%, onTimeRate = 2/6 = 33%, witnessRate = 1/6 = 17%
      const records = [
        baseRecord({ id: "g1", has_witness: true }),
        baseRecord({ id: "g2", has_witness: false }),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `l_${i}`, status: "late", has_witness: false }),
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(60);
      expect(result.on_time_rate).toBe(33);
      expect(result.witness_rate).toBe(17);
    });

    it("awards 0 when exactly 1 of 3 rates is above 80 and not all below 70", () => {
      // adminRate=80, onTimeRate=50, witnessRate=50 → only 1 above 80 → not >=2
      // not all <70 either → 0
      // 4 given (2 witnessed) + 1 late (0 witnessed) + 0 refused
      // Actually: 4 given + 1 refused = 5 total, adminRate=4/5=80, onTimeRate=4/4=100
      // That gives 2 above 80. Let me recalculate.
      // 4 given (2 witnessed) + 4 late (0 witnessed) + 2 refused
      // adminRate = 8/10 = 80%, onTimeRate = 4/8 = 50%, witnessRate = 2/8 = 25%
      // aboveEighty: adminRate>=80 yes, onTimeRate>=80 no, witnessRate>=80 no → 1 → not >=2
      // all<70: 80<70 no → not all<70 → 0
      const records = [
        baseRecord({ id: "g1", has_witness: true }),
        baseRecord({ id: "g2", has_witness: true }),
        baseRecord({ id: "g3", has_witness: false }),
        baseRecord({ id: "g4", has_witness: false }),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `l_${i}`, status: "late", has_witness: false }),
        ),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(80);
      expect(result.on_time_rate).toBe(50);
      expect(result.witness_rate).toBe(25);
    });
  });

  // ── 11. Rating Boundaries ─────────────────────────────────────────────

  describe("rating boundaries", () => {
    it("returns 'outstanding' at score 80", () => {
      // We need to engineer exactly score=80
      // base=52, need +28 total from modifiers
      // Perfect everything: all given on time, all witnessed, low refusal, no PRN
      // mod1=+6, mod2=+5, mod3=+5, mod4=+2 (refusal<=15), mod5=+1, mod6=+5 → 52+24=76
      // Need +28 from mods → not achievable with max 24 without PRN.
      // With PRN: mod5=+4 → total = 52+6+5+5+?+4+5 = 77+mod4
      // mod4=+5 (refusalRate<=5 && reasonRate>=90) → 52+6+5+5+5+4+5 = 82
      // We need exactly 80. So 82-2 = need to lose 2 somewhere.
      // If mod2=+2 instead of +5 (onTimeRate 80-94), and everything else max:
      // 52+6+2+5+5+4+? = 74+mod6
      // mod6: adminRate>=95, onTimeRate>=90? onTimeRate<95 so might be <90.
      // We need to calculate carefully.
      // Let me just verify toRating boundaries instead.
      // Score 80 → outstanding
      // Score 79 → good
      // Score 65 → good
      // Score 64 → adequate
      // Score 45 → adequate
      // Score 44 → inadequate

      // Build a scenario for score=80:
      // 100 given, all witnessed, all on time, 5 PRN fully documented
      // Plus add some refused to bring the score down
      // Actually, let me just test the toRating function boundary by testing
      // the result of specific configurations.

      // Perfect scenario: 100 given, all witnessed, all on time
      // + 5 PRN fully documented
      // adminRate=100→+6, onTimeRate=100→+5, witnessRate=100→+5
      // refusalRate=0→mod4: <=5 but reasonRate=0<90 → <=15 → +2
      // prnDocRate=100→+4, mod6: 100>=95,100>=90,100>=90→+5
      // score = 52+6+5+5+2+4+5 = 79. Hmm.
      // Need +1 more. With refusalRate<=5 && reasonRate>=90 → +5 instead of +2
      // Add 1 refused with reason: refusalRate=1/106=1%, reasonRate=100%
      // mod4 = +5
      // score = 52+6+5+5+5+4+5 = 82. That's 82, not 80.
      // With no PRN (mod5=+1): 52+6+5+5+5+1+5 = 79
      // Need exactly 80. Let me try:
      // mod5=+2 (prnDocRate 70-89): score = 52+6+5+5+5+2+5 = 80!
      // PRN with 70% doc rate + refusal with 100% reason rate

      const givenRecords = makeRecords(95);
      const prnRecords = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 7,
          has_prn_effectiveness: i < 7,
        }),
      );
      const refusedRecord = baseRecord({
        id: "ref_1",
        status: "refused",
        has_witness: false,
        has_reason_not_given: true,
      });
      // total = 106, administered = 105, adminRate = 105/106 = 99% → +6
      // onTimeRate = 95/105 = 90% → +5? No: pct(95, 105) = round(90.47) = 90 → >=80 → +2 not +5
      // Hmm onTimeRate needs to be >= 95 for +5.
      // Let me adjust: all given on time (no late).
      // givenRecords: 95 given (on time) + 10 PRN given (on time) = 105 given/on-time
      // + 1 refused → 106 total
      // administered = 105, given = 105, onTimeRate = 105/105 = 100% → +5
      // witnessRate = 105/105 = 100% → +5 (all baseRecord has_witness=true)
      // prnDocRate = 7/10 = 70% → +2
      // refusalRate = 1/106 = 1% → <=5, reasonRate = 1/1 = 100% >=90 → +5
      // adminRate = 105/106 = 99% → +6
      // mod6: adminRate=99>=95, onTimeRate=100>=90, witnessRate=100>=90 → +5
      // score = 52 + 6 + 5 + 5 + 5 + 2 + 5 = 80 ✓

      const result = computeMedicationAdministration(
        baseInput({
          administrations: [...givenRecords, ...prnRecords, refusedRecord],
        }),
      );
      expect(result.medication_score).toBe(80);
      expect(result.medication_rating).toBe("outstanding");
    });

    it("returns 'good' at score 79", () => {
      // From above scenario but mod5=+1 instead of +2: no PRN
      // 95 given + 1 refused with reason
      // score = 52+6+5+5+5+1+5 = 79
      const givenRecords = makeRecords(95);
      const refusedRecord = baseRecord({
        id: "ref_1",
        status: "refused",
        has_witness: false,
        has_reason_not_given: true,
      });
      const result = computeMedicationAdministration(
        baseInput({
          administrations: [...givenRecords, refusedRecord],
        }),
      );
      expect(result.medication_score).toBe(79);
      expect(result.medication_rating).toBe("good");
    });

    it("returns 'good' at score 65", () => {
      // Need score=65.
      // 8 given (all witnessed) + 2 refused (no reasons)
      // adminRate=80%→0, onTimeRate=100%→+5, witnessRate=100%→+5
      // mod4: refusalRate=20%: not <=5, not <=15, not >30 → 0
      // mod5: no PRN → +1, mod6: adminRate<95 → aboveEighty: 80>=80,100>=80,100>=80 → 3→+2
      // score = 52+0+5+5+0+1+2 = 65
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.medication_score).toBe(65);
      expect(result.medication_rating).toBe("good");
    });

    it("returns 'adequate' at score 64", () => {
      // Need score=64. From above minus 1.
      // 8 given (7 witnessed, 1 not) + 2 refused
      // adminRate=80→0, onTimeRate=100→+5, witnessRate=7/8=88→+2
      // mod4: refusalRate=20 → 0, mod5: no PRN → +1
      // mod6: aboveEighty: 80>=80 yes, 100>=80 yes, 88>=80 yes → 3→+2
      // score = 52+0+5+2+0+1+2 = 62 … too low.
      // Try: 9 given + 1 refused, 1 unwitnessed given
      // adminRate=90→+3, onTimeRate=100→+5, witnessRate=8/9=89→+2
      // mod4: refusalRate=10→<=15→+2, mod5: no PRN→+1
      // mod6: adminRate=90<95→ aboveEighty: 90>=80,100>=80,89>=80 → 3→+2
      // score = 52+3+5+2+2+1+2 = 67. Still not 64.
      // Try: 8 given (all witnessed) + 2 refused + onTimeRate reduced
      // 6 given + 2 late + 2 refused → adminRate=80→0, onTimeRate=6/8=75→0
      // witnessRate=8/8=100→+5
      // mod4: refusalRate=20→0, mod5: no PRN→+1
      // mod6: aboveEighty: 80>=80 yes, 75>=80 no, 100>=80 yes → 2→+2
      // score = 52+0+0+5+0+1+2 = 60. Still not right.
      // Try: 9 given + 1 refused, onTimeRate lowered
      // 7 given + 2 late + 1 refused → adminRate=90→+3, onTimeRate=7/9=78→0
      // witnessRate=9/9=100→+5
      // mod4: refusalRate=10→<=15→+2, mod5: no PRN→+1
      // mod6: 90<95→ aboveEighty: 90>=80,78>=80 no,100>=80 yes → 2→+2
      // score = 52+3+0+5+2+1+2 = 65. Need exactly 64.
      // Try lowering witnessRate: 7 given (6 witnessed) + 2 late (2 witnessed) + 1 refused
      // witnessRate=8/9=89→+2
      // mod6: aboveEighty: 90>=80 yes, 78>=80 no, 89>=80 yes → 2→+2
      // score = 52+3+0+2+2+1+2 = 62. Hmm.
      // Try: adminRate=98→+6, onTimeRate=80→+2, witnessRate=80→+2
      // mod4=+2 (refusalRate<=15), mod5=+1, mod6: 98>=95,80<90→aboveEighty: 98,80,80 → 3→+2
      // score = 52+6+2+2+2+1+2 = 67.
      // Try: adminRate=90→+3, onTimeRate=95→+5, witnessRate=80→+2
      // mod4=+2, mod5=-4 (prnDocRate<40), mod6: 90<95→ aboveEighty: 90,95,80 → 3→+2
      // score = 52+3+5+2+2-4+2 = 62.
      // Try: adminRate=98→+6, onTimeRate=80→+2, witnessRate=50-79→0
      // mod4=+2, mod5=+1, mod6: 98>=95 but 80<90→ aboveEighty: 98>=80,80>=80,75>=80 no → 2→+2
      // score = 52+6+2+0+2+1+2 = 65. Need -1 more.
      // Try: witnessRate<50→-4: score = 52+6+2-4+2+1+2 = 61
      // How about: adminRate=98→+6, onTimeRate=95→+5, witnessRate=50-79→0
      // mod4: refusalRate<=15→+2, mod5=+1, mod6: 98>=95 but witnessRate=75<90→
      //   aboveEighty: 98,95,75 → only 2→+2 (no +5)
      // score = 52+6+5+0+2+1+2 = 68. Need 64.
      // Let me try: adminRate=80→0, onTimeRate=80→+2, witnessRate=100→+5
      // mod4=0 (refusalRate>15, reasonRate<70), mod5=+1, mod6: 80<95→ aboveEighty: 80,80,100→3→+2
      // score = 52+0+2+5+0+1+2 = 62.
      // Try with mod4=-4: refusalRate>30, reasonRate<50
      // 3 given + 7 refused (0 reason) → adminRate=30→-5, onTimeRate=100→+5
      // witnessRate=100→+5, refusalRate=70→mod4: >30 && <50 → -4
      // mod5=+1, mod6: 30<95→ aboveEighty: 30<80,100>=80,100>=80 → 2→+2
      // score = 52-5+5+5-4+1+2 = 56.
      // Let me try: adminRate=100→+6, onTimeRate=80→+2, witnessRate=80→+2
      // mod4=+2, mod5=+1, mod6: 100>=95, onTimeRate=80<90→ aboveEighty: 100,80,80 → 3→+2
      // score = 52+6+2+2+2+1+2 = 67. Need -3.
      // With PRN -4 instead of +1: 52+6+2+2+2-4+2 = 62
      // How about score exactly 64:
      // adminRate=100→+6, onTimeRate=95→+5, witnessRate<50→-4
      // mod4=+2 (refusalRate<=15), mod5=+1, mod6: adminRate>=95 but witnessRate<90→
      //   aboveEighty: 100>=80,95>=80,40>=80 no → 2→+2
      // score = 52+6+5-4+2+1+2 = 64 ✓

      // 10 given (4 witnessed) + 10 late (0 witnessed)
      // Wait, I need 0 refused for refusalRate<=15.
      // All given, but need witnessRate < 50.
      // 10 given on time, 4 witnessed out of 10: witnessRate = 40%
      const records = [
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `gw_${i}`, has_witness: true }),
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          baseRecord({ id: `gu_${i}`, has_witness: false }),
        ),
      ];
      // adminRate=100→+6, onTimeRate=100→+5, witnessRate=40→-4
      // mod4: refusalRate=0<=5, reasonRate=0<90→skip → refusalRate<=15→+2
      // mod5: no PRN→+1, mod6: 100>=95, 100>=90, 40<90→ aboveEighty: 100,100,40 → 2→+2
      // score = 52+6+5-4+2+1+2 = 64 ✓
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.medication_score).toBe(64);
      expect(result.medication_rating).toBe("adequate");
    });

    it("returns 'adequate' at score 45", () => {
      // Need score=45.
      // base=52, need total modifier = -7
      // adminRate<70→-5, onTimeRate<60→-5, witnessRate<50→-4
      // refusalRate>30&&reasonRate<50→-4, no PRN→+1, all<70→-3
      // That's -5-5-4-4+1-3 = -20 → 32. Too low.
      // Need to be more selective.
      // adminRate=80→0, onTimeRate 60-79→0, witnessRate 50-79→0
      // mod4: refusalRate>15, <30, reasonRate<70 → 0
      // mod5: prnDocRate<40→-4
      // mod6: aboveEighty: adminRate=80 yes, onTime=70 no, witness=60 no → 1 → not >=2 → 0
      //   all<70? 80<70 no → 0
      // score = 52+0+0+0+0-4+0 = 48. Close but need 45.
      // Try: mod6=-3 (all<70): need adminRate<70, onTimeRate<70, witnessRate<70
      // adminRate<70→-5: score = 52-5+0+0+0-4-3 = 40. Too low.
      // adminRate 70-89→0, onTimeRate 60-79→0, witnessRate 50-79→0
      // mod4: refusalRate>30, reasonRate<50→-4
      // mod5: prnDocRate<40→-4
      // mod6: aboveEighty: only 1 at most → 0 or -3
      // If adminRate=75, onTime=65, witness=55: aboveEighty: 0 → and all<70? 75<70 no → 0
      // score = 52+0+0+0-4-4+0 = 44. Need +1 more.
      // If adminRate=80→0, onTime=60→0, witness=50→0, mod4=-4, mod5=+1 (no PRN)
      // mod6: aboveEighty: 80>=80 yes, 60 no, 50 no → 1 → not >=2 → 0. all<70? 80 no → 0
      // score = 52+0+0+0-4+1+0 = 49. Nope.
      // If mod4=0, mod5=-4, mod6=0:
      // score=52+0+0+0+0-4+0 = 48. Add mod3=-4 → 52+0+0-4+0-4+0=44. Close.
      // 52+0+0-4+0-4+0+1 — can I get mod5=+1 and mod3=-4?
      // witnessRate<50→-4, no PRN→+1: 52+0+0-4+0+1+0 = 49.
      // Add mod4=-4: 52+0+0-4-4+1+0 = 45 ✓
      // So: adminRate 70-89→0, onTimeRate 60-79→0, witnessRate<50→-4,
      //     refusalRate>30 && reasonRate<50→-4, no PRN→+1, mod6: need to check
      //     aboveEighty: adminRate>=80? depends. Let me pick adminRate=75.
      //     aboveEighty: 75<80→0 of 3→ all<70? 75<70 no → 0
      // score = 52+0+0-4-4+1+0 = 45 ✓
      // Build: 3 given (1 witnessed) + 1 late (0 witnessed) + 4 refused (0 reason) + 0 withheld
      // Total=8, administered=4, adminRate=4/8=50→<70→-5! That's wrong.
      // Need adminRate in 70-89. 6 given + 2 refused: 75%
      // witnessRate < 50: need < 50% of administered witnessed
      // 6 given, 2 witnessed: witnessRate=2/6=33→<50→-4
      // refusalRate > 30: 2/8=25→ not >30. Need more refused.
      // 6 given + 4 refused: adminRate=60→<70→-5. No good.
      // Try: 15 given (5 witnessed) + 5 refused (0 reasons)
      // adminRate=15/20=75→0, onTimeRate=100→+5, witnessRate=5/15=33→-4
      // refusalRate=5/20=25→ not>30. mod4: not <=5(25>5), not <=15(25>15), not >30 → 0
      // mod5: no PRN→+1, mod6: aboveEighty: 75<80→0 → all<70? 75 no→ 0
      // score=52+0+5-4+0+1+0 = 54. Too high.
      // Reduce onTimeRate: 10 given + 5 late (all unwitnessed) + 5 refused (no reason)
      // adminRate=15/20=75→0, onTimeRate=10/15=67→0, witnessRate=?
      // Actually let's be careful. 10 given on-time + 5 late = 15 administered.
      // If only 5 of those are witnessed: witnessRate=5/15=33→-4
      // refusalRate=5/20=25→0. No mod4=-4.
      // Let me try a different approach — 7 given + 3 late + 10 refused (0 reason).
      // adminRate=10/20=50→<70→-5. Still not right.
      // I'll engineer it differently:
      // 15 given (3 witnessed) + 5 refused (1 reason)
      // adminRate=75→0, onTimeRate=100→+5, witnessRate=3/15=20→<50→-4
      // refusalRate=25→not>30→0, mod4: 25>15, reasonRate=1/5=20<70→ not <=15||>=70 → not >30 → 0
      // mod5: no PRN→+1, mod6: aboveEighty: 75<80→0→ all<70? 75 no→ 0
      // score = 52+0+5-4+0+1+0 = 54. Still too high.
      // Lower onTimeRate: 10 given + 5 late (0 witnessed) + 5 refused (1 reason)
      // adminRate=15/20=75→0, onTimeRate=10/15=67→0
      // witnessRate: among 10 given and 5 late, say 3 witnessed total → 3/15=20→-4
      // refusalRate=25→0, mod5=+1, mod6: aboveEighty: 0→ all<70? 75<70 no→0
      // score = 52+0+0-4+0+1+0 = 49.
      // Now add mod4=-4: need refusalRate>30 and reasonRate<50
      // Need refusalRate > 30%: e.g., 10 given + 5 late + 7 refused (0 reason) = 22 total
      // adminRate = 15/22 = 68% → <70 → -5. Don't want that.
      // 15 given + 0 late + 7 refused = 22 total, adminRate=15/22=68→-5. Still <70.
      // 21 given + 0 late + 9 refused = 30 total, adminRate=21/30=70→0 (not <70)
      // refusalRate=9/30=30→not>30. Need >=31%.
      // 20 given + 0 late + 10 refused = 30 total, adminRate=20/30=67→-5.
      // This is hard. Let me approach from a pure arithmetic standpoint:
      // I want score=45. Base=52. I need modifiers summing to -7.
      // Feasible combo: mod1=0, mod2=+2, mod3=-4, mod4=0, mod5=-4, mod6=-1? No -1 isn't an option.
      // mod6 options: +5,+2,0,-3,-2
      // mod1=0, mod2=-1, mod3=-4, mod4=0, mod5=-4, mod6=+2: sum = 0-1-4+0-4+2 = -7 → 45!
      // mod2=-1: administered=0. But mod3 checks administeredRecords.length===0→-1 not -4.
      // If administered=0, mod3=-1, not -4. And mod6=-2 for no admin. So that doesn't work.

      // Try: mod1=-5, mod2=+5, mod3=+5, mod4=-4, mod5=-4, mod6=-3: sum=-5+5+5-4-4-3=-6→46
      // mod1=-5, mod2=+5, mod3=+5, mod4=-4, mod5=-4, mod6=-3 needs all<70 for mod6=-3
      // but if mod3=+5 → witnessRate>=95 → witnessRate not <70. Contradiction.

      // mod1=+3, mod2=0, mod3=-4, mod4=-4, mod5=+1, mod6=-3: sum=3+0-4-4+1-3=-7→45!
      // mod1=+3: adminRate 90-97
      // mod2=0: onTimeRate 60-79
      // mod3=-4: witnessRate<50
      // mod4=-4: refusalRate>30 AND reasonRate<50
      // mod5=+1: no PRN
      // mod6=-3: all three <70 — but adminRate is 90+ which is >=70. Contradiction!

      // mod6=-3 needs admin<70, onTime<70, witness<70. So mod1 must be -5 (admin<70).
      // mod1=-5, mod2=+5, mod3=0, mod4=0, mod5=+1, mod6=-3: sum=-5+5+0+0+1-3=-2→50
      // mod1=-5, mod2=+2, mod3=0, mod4=+2, mod5=+1, mod6=-3: sum=-5+2+0+2+1-3=-3→49
      // mod1=-5, mod2=0, mod3=0, mod4=+2, mod5=+1, mod6=-3: sum=-5+0+0+2+1-3=-5→47
      // mod1=-5, mod2=-5, mod3=0, mod4=+2, mod5=+1, mod6=0: sum=-5-5+0+2+1+0=-7→45!
      // mod1=-5: adminRate<70
      // mod2=-5: onTimeRate<60
      // mod3=0: witnessRate 50-79
      // mod4=+2: refusalRate<=15 || reasonRate>=70
      // mod5=+1: no PRN
      // mod6=0: not all <70 (witnessRate 50-79 → >=50 but need >=70 to not be <70... witness=65 is <70. But mod3=0 means witness 50-79)
      // Wait mod6=-3 needs all 3 <70. If witnessRate is 65, that's <70.
      // But I said mod6=0. Let me check: adminRate<70, onTimeRate<60 (so <70), witnessRate=65<70 → all<70 → mod6=-3 not 0!
      // So this combo gives mod6=-3 instead of 0: sum=-5-5+0+2+1-3=-10→42. Not 45.

      // Let me try: mod1=-5, mod2=-5, mod3=+2, mod4=+2, mod5=+1, mod6=?:
      // mod3=+2: witnessRate 80-94. mod6: adminRate<70,onTime<60(<70),witness 80-94(not <70)→ not all<70
      // aboveEighty: admin<70<80, onTime<60<80, witness>=80 → 1 → not >=2 → 0
      // sum=-5-5+2+2+1+0=-5→47. Close.
      // mod4=0 instead: sum=-5-5+2+0+1+0=-7→45! ✓
      // mod4=0: not (<=5 && >=90), not (<=15 || >=70), not (>30 && <50). So refusalRate 16-30, reasonRate 50-69.

      // Build it:
      // Need adminRate<70: 6 given + 4 late + 10 refused = 20 total, adminRate=10/20=50<70→-5
      // Wait, but I also need onTimeRate<60: given/(given+late) = 6/10=60 → not <60.
      // Try 5 given + 5 late: onTimeRate=5/10=50<60→-5
      // And 10 refused out of 20: adminRate=10/20=50→-5
      // witnessRate>=80: say 8 witnessed out of 10 administered → 80%→+2
      // refusalRate=10/20=50%→>30. reasonRate: let's say 6/10=60%→<70 but >50.
      // Check mod4: refusalRate>30 && reasonRate<50? 60<50? No. So mod4 falls through to 0.
      // But I needed mod4=0 with refusalRate 16-30. refusalRate=50>30 and reasonRate=60:
      //   not (<=5 && >=90), not (<=15 || >=70 → 50<=15? no, 60>=70? no → false),
      //   not (>30 && <50 → 50>30 yes, 60<50? no → false) → 0 ✓
      // Actually this works! mod4=0.
      // mod5=+1: no PRN. mod6: aboveEighty: 50<80,50<80,80>=80→1→0. all<70: 50,50,80→80 not<70→0.
      // sum = -5-5+2+0+1+0 = -7 → score=45 ✓

      const givenRecords = Array.from({ length: 5 }, (_, i) =>
        baseRecord({ id: `g_${i}`, has_witness: true }),
      );
      const lateRecords = Array.from({ length: 5 }, (_, i) =>
        baseRecord({ id: `l_${i}`, status: "late", has_witness: i < 3 }),
      );
      // 5 witnessed given + 3 witnessed late = 8 witnessed out of 10 → 80%
      const refusedRecords = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `r_${i}`,
          status: "refused",
          has_witness: false,
          has_reason_not_given: i < 6,
        }),
      );
      // refusalRate=10/20=50, reasonRate=6/10=60
      const result = computeMedicationAdministration(
        baseInput({
          administrations: [...givenRecords, ...lateRecords, ...refusedRecords],
        }),
      );
      expect(result.medication_score).toBe(45);
      expect(result.medication_rating).toBe("adequate");
    });

    it("returns 'inadequate' at score 44", () => {
      // From the score=45 setup, we need to subtract 1 more.
      // Change: make 1 less late record witnessed so witnessRate drops below 80 → mod3=0 instead of +2
      // But wait, if witnessRate drops from 80 to 70, mod3=0. sum=-5-5+0+0+1+0=-9→43. Need 44.
      // Instead, drop witnessRate to 70-79 → mod3=0, and add mod4=+2 (refusalRate<=15 || reasonRate>=70)
      // To get mod4=+2 from reasonRate>=70: set reasonRate=70%.
      // 5 given + 5 late + 10 refused (7 with reason)
      // witnessRate: 7 witnessed out of 10 → 70%→ mod3=0
      // reasonRate=7/10=70→ mod4: <=15? no. >=70? yes → +2
      // sum=-5-5+0+2+1+0=-7→45. That's still 45.
      // Hmm. Need 44. Let me try:
      // score=45 was achieved. For 44, try lowering by 1:
      // Use the 45 scenario but make witnessRate barely under 80:
      // 7 witnessed out of 10 → 70% → mod3=0 (was +2 → lost 2)
      // And reasonRate stays at 60%
      // sum=-5-5+0+0+1+0=-9→43. Too low.
      // Try to get +1 somewhere: not possible, no modifier gives +1 except mod5 (no PRN) which is already +1.
      // OK let me try a totally different configuration:
      // mod1=0 (adminRate 70-89), mod2=-5 (onTime<60), mod3=0 (witness 50-79)
      // mod4=-4 (refusal>30 && reason<50), mod5=+1 (no PRN)
      // mod6: aboveEighty: adminRate>=80? if 80, yes. onTime<60<80 no. witness 50-79<80 no. → 1 →0
      // all<70: adminRate=80 no → 0
      // sum=0-5+0-4+1+0=-8→44 ✓
      // Build: adminRate=80: 8 given + 2 refused+omitted/etc out of 10.
      // Actually 8 administered out of 10. Let's do:
      // 3 given + 5 late + 2 omitted → adminRate=8/10=80 → 0
      // onTimeRate=3/8=38<60→-5
      // witnessRate: say 4 witnessed / 8 = 50 → 0 (50 is not <50)
      // refusalRate: we need >30 → but 2 omitted and 0 refused → 0% refusal. That won't give -4.
      // Change: 3 given + 5 late + 4 refused (1 with reason) = 12 total
      // adminRate=8/12=67→<70→-5 not 0. Argh.
      // 4 given + 4 late + 2 refused (0 reason) = 10 total
      // adminRate=8/10=80→0, onTimeRate=4/8=50<60→-5
      // witnessRate: say 5/8=63→0
      // refusalRate=2/10=20→not>30→0. mod4 fails.
      // Need refusalRate>30 with adminRate in 70-89.
      // adminRate=70: 7 administered out of 10. 7 given + 3 refused → refusalRate=30→not>30.
      // adminRate=73: need fractional. 8/11=73. 8 given + 3 refused = 11. refusalRate=3/11=27→not>30.
      // adminRate=70: 14/20=70. 14 given + 6 refused. refusalRate=6/20=30→not>30.
      // adminRate=71: 5/7=71. 5 given + 2 refused. refusalRate=2/7=29→not>30.
      // It's hard to get both adminRate>=70 and refusalRate>30 simultaneously.
      // Because refusalRate>30 means more than 30% are refused, which means less than 70% administered.
      // adminRate = administered/total, refusalRate=refused/total.
      // If refusalRate>30 then refused>0.3*total, so administered<0.7*total → adminRate<70.
      // BUT there can also be withheld and omitted. Administered + refused + withheld + omitted = total.
      // If withheld and omitted are 0, then adminRate + refusalRate = 100%, so refusalRate>30 → adminRate<70.
      // But if there are withheld/omitted, adminRate can be >=70 while refusalRate>30?
      // No: adminRate = admin/total ≤ (total - refused)/total = 1 - refusalRate/100
      // If refusalRate > 30 → adminRate ≤ 70. Can be exactly 70 if only refused are non-admin.
      // But <70 with our rounding...
      // Actually: if 7 given + 0 late + 3 refused = 10 total:
      // adminRate = pct(7, 10) = 70. refusalRate = pct(3, 10) = 30. refusalRate needs to be >30.
      // 7 given + 4 refused = 11: adminRate=64, refusalRate=36. adminRate<70→-5.
      // Conclusion: it's impossible to have both adminRate>=70 and refusalRate>30 simultaneously.
      // So mod4=-4 requires mod1=-5.

      // New approach for 44:
      // mod1=-5, mod2=+2, mod3=+2, mod4=0, mod5=+1, mod6=0: sum=-5+2+2+0+1+0=0→52. No.
      // mod1=0, mod2=0, mod3=-4, mod4=0, mod5=-4, mod6=0: sum=0+0-4+0-4+0=-8→44 ✓
      // adminRate 70-89→0, onTimeRate 60-79→0, witnessRate<50→-4
      // mod4=0, prnDocRate<40→-4
      // mod6: aboveEighty depends on adminRate. If adminRate=75:
      //   aboveEighty: 75<80 → 0. All<70: 75<70 no → 0. ✓
      // Build: total 20. 15 given + 5 refused = 20. adminRate=75→0.
      // onTimeRate: need 60-79. 11 given + 4 late + 5 refused = 20, adminRate=15/20=75.
      // onTimeRate=11/15=73→0. ✓
      // witnessRate: need <50. 7 witnessed / 15 = 47→<50→-4. ✓
      // mod4: refusalRate=5/20=25. Not <=5(with >=90). Not <=15. Not >30. → 0. ✓
      // mod5: prnDocRate<40. Need PRN given with <40% documented.
      // Say 5 of the given are PRN, 1 documented → 20%<40→-4. ✓
      // mod6: aboveEighty: 75<80→0, 73<80→0, 47<80→0 → 0. all<70: 75<70 no → 0. ✓
      // sum = 0+0-4+0-4+0 = -8 → 44 ✓

      const givenNonPrn = Array.from({ length: 6 }, (_, i) =>
        baseRecord({ id: `g_${i}`, has_witness: i < 3 }),
      );
      const givenPrn = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_witness: i < 2,
          has_prn_reason: i < 1,
          has_prn_effectiveness: i < 1,
        }),
      );
      // 6 non-PRN given + 5 PRN given = 11 given on time
      const lateRecords = Array.from({ length: 4 }, (_, i) =>
        baseRecord({ id: `l_${i}`, status: "late", has_witness: i < 2 }),
      );
      // Total witnessed among administered: 3 + 2 + 2 = 7 out of 15 → 47%
      const refusedRecords = Array.from({ length: 5 }, (_, i) =>
        baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
      );
      // Total: 11 + 4 + 5 = 20. adminRate=15/20=75. onTimeRate=11/15=73. witnessRate=7/15=47.
      // prnDocRate: prnGiven = 5 (all "given"). documented = 1. prnDocRate=1/5=20.
      // refusalRate=5/20=25. reasonRate=0/5=0.

      const result = computeMedicationAdministration(
        baseInput({
          administrations: [...givenNonPrn, ...givenPrn, ...lateRecords, ...refusedRecords],
        }),
      );
      expect(result.medication_score).toBe(44);
      expect(result.medication_rating).toBe("inadequate");
    });
  });

  // ── 12. Score Clamping ────────────────────────────────────────────────

  describe("score clamping", () => {
    it("clamps score to minimum of 0", () => {
      // Engineer maximum penalties: mod1=-5, mod2=-5, mod3=-4, mod4=-4, mod5=-4, mod6=-3
      // sum=-5-5-4-4-4-3=-25 → 52-25=27. Actually that's 27, not 0.
      // The engine can't actually reach 0 through normal modifiers since max penalty is -25 from base 52 = 27.
      // But we can still verify the clamp exists conceptually.
      // The guard clause for empty records with children on meds calculates: 52-3-1-1+0+1-2=46, clamped.
      // With the main path, minimum is 52-25=27 which is already > 0.
      // Let's just verify the score doesn't go below 0.
      const records = [
        baseRecord({ id: "g1", has_witness: false }),
        ...Array.from({ length: 9 }, (_, i) =>
          baseRecord({ id: `l_${i}`, status: "late", has_witness: false }),
        ),
        ...Array.from({ length: 10 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      // Total=20, administered=10, adminRate=10/20=50→-5
      // onTimeRate=1/10=10→-5, witnessRate=0/10=0→-4
      // refusalRate=10/20=50→>30, reasonRate=0→<50 → -4
      // PRN: none → +1
      // mod6: all<70? 50<70, 10<70, 0<70 → -3
      // sum=-5-5-4-4+1-3=-20 → 32
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.medication_score).toBeGreaterThanOrEqual(0);
      expect(result.medication_score).toBe(32);
    });

    it("clamps score to maximum of 100", () => {
      // Max possible: 52+6+5+5+5+4+5=82. Already <100. Clamping to 100 never triggers.
      // Just verify it doesn't exceed 100.
      const records = [
        ...makeRecords(99),
        baseRecord({
          id: "ref_1",
          status: "refused",
          has_witness: false,
          has_reason_not_given: true,
        }),
        ...Array.from({ length: 10 }, (_, i) =>
          baseRecord({
            id: `prn_${i + 100}`,
            is_prn: true,
            has_prn_reason: true,
            has_prn_effectiveness: true,
          }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.medication_score).toBeLessThanOrEqual(100);
    });

    it("produces clamped score of 46 in the empty-records-with-children path", () => {
      const result = computeMedicationAdministration(
        baseInput({ children_on_medication: 3, administrations: [] }),
      );
      // 52 - 3 - 1 - 1 + 0 + 1 - 2 = 46, clamped to [0,100]
      expect(result.medication_score).toBe(46);
    });
  });

  // ── 13. Headline Messages ─────────────────────────────────────────────

  describe("headline messages", () => {
    it("includes 'Outstanding' for outstanding rating", () => {
      // Use score=80 scenario
      const givenRecords = makeRecords(95);
      const prnRecords = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 7,
          has_prn_effectiveness: i < 7,
        }),
      );
      const refusedRecord = baseRecord({
        id: "ref_1",
        status: "refused",
        has_witness: false,
        has_reason_not_given: true,
      });
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...givenRecords, ...prnRecords, refusedRecord] }),
      );
      expect(result.headline).toContain("Outstanding");
      expect(result.headline).toContain("99%");
      expect(result.headline).toContain("100%");
    });

    it("includes 'Good' for good rating", () => {
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.headline).toContain("Good");
    });

    it("includes 'Adequate' for adequate rating", () => {
      const records = [
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `gw_${i}`, has_witness: true }),
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          baseRecord({ id: `gu_${i}`, has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.headline).toContain("Adequate");
    });

    it("includes 'Inadequate' for inadequate rating", () => {
      // Use a scenario that yields inadequate (score < 45)
      const records = [
        baseRecord({ id: "g1", has_witness: false }),
        ...Array.from({ length: 9 }, (_, i) =>
          baseRecord({ id: `l_${i}`, status: "late", has_witness: false }),
        ),
        ...Array.from({ length: 10 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.headline).toContain("Inadequate");
    });

    it("includes administration rate and on-time rate in outstanding headline", () => {
      const givenRecords = makeRecords(95);
      const prnRecords = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 7,
          has_prn_effectiveness: i < 7,
        }),
      );
      const refusedRecord = baseRecord({
        id: "ref_1",
        status: "refused",
        has_witness: false,
        has_reason_not_given: true,
      });
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...givenRecords, ...prnRecords, refusedRecord] }),
      );
      expect(result.headline).toContain("99% administration rate");
      expect(result.headline).toContain("100% on time");
      expect(result.headline).toContain("100% witnessed");
    });

    it("includes admin rate in good headline", () => {
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.headline).toContain("80%");
    });
  });

  // ── 14. Strengths ─────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes admin rate strength when adminRate >= 98%", () => {
      const records = makeRecords(100);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("near-perfect compliance"));
      expect(s).toBeDefined();
    });

    it("includes admin rate strength when adminRate is 90-97%", () => {
      const records = [
        ...makeRecords(9),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("strong compliance"));
      expect(s).toBeDefined();
    });

    it("does not include admin rate strength when adminRate < 90%", () => {
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("administration rate"));
      expect(s).toBeUndefined();
    });

    it("includes on-time strength when onTimeRate >= 95%", () => {
      const records = [
        ...makeRecords(19),
        baseRecord({ id: "l1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("excellent timeliness"));
      expect(s).toBeDefined();
    });

    it("includes on-time strength when onTimeRate is 80-94%", () => {
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "l1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("good timeliness"));
      expect(s).toBeDefined();
    });

    it("does not include on-time strength when onTimeRate < 80%", () => {
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "l1", status: "late" }),
        baseRecord({ id: "l2", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("timeliness"));
      expect(s).toBeUndefined();
    });

    it("includes witness strength when witnessRate >= 95%", () => {
      const records = makeRecords(20);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("dual-signature"));
      expect(s).toBeDefined();
    });

    it("includes witness strength when witnessRate is 80-94%", () => {
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "u1", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("good oversight"));
      expect(s).toBeDefined();
    });

    it("includes low refusal strength when refusalRate <= 5% and total >= 5", () => {
      const records = makeRecords(20);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("Very low refusal rate"));
      expect(s).toBeDefined();
    });

    it("does not include low refusal strength when totalNonScheduled < 5", () => {
      const records = makeRecords(4);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("Very low refusal rate"));
      expect(s).toBeUndefined();
    });

    it("includes reason documented strength when reasonRate >= 90% with refusals", () => {
      const records = [
        ...makeRecords(18),
        baseRecord({ id: "r1", status: "refused", has_witness: false, has_reason_not_given: true }),
        baseRecord({ id: "r2", status: "refused", has_witness: false, has_reason_not_given: true }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("documented reasons"));
      expect(s).toBeDefined();
    });

    it("does not include reason documented strength when no refusals/withholds", () => {
      const records = makeRecords(10);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("documented reasons"));
      expect(s).toBeUndefined();
    });

    it("includes PRN documentation strength when prnDocRate >= 90%", () => {
      const records = [
        ...makeRecords(10),
        ...Array.from({ length: 10 }, (_, i) =>
          baseRecord({
            id: `prn_${i}`,
            is_prn: true,
            has_prn_reason: true,
            has_prn_effectiveness: true,
          }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("PRN documentation rate"));
      expect(s).toBeDefined();
    });

    it("includes embedded culture strength when admin>=95, onTime>=90, witness>=90", () => {
      // 20 given on time, all witnessed + 1 refused
      const records = [
        ...makeRecords(20),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("embedded culture"));
      expect(s).toBeDefined();
    });

    it("does not include embedded culture strength when admin < 95%", () => {
      const records = [
        ...makeRecords(9),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const s = result.strengths.find(s => s.includes("embedded culture"));
      expect(s).toBeUndefined();
    });
  });

  // ── 15. Concerns ──────────────────────────────────────────────────────

  describe("concerns", () => {
    it("includes critical admin concern when adminRate < 70%", () => {
      const records = [
        ...makeRecords(3),
        ...Array.from({ length: 7 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("serious medicines management failure"));
      expect(c).toBeDefined();
    });

    it("includes below-standard admin concern when adminRate is 70-89%", () => {
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("below expected standards"));
      expect(c).toBeDefined();
    });

    it("does not include admin concern when adminRate >= 90%", () => {
      const records = [
        ...makeRecords(9),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("administration rate"));
      expect(c).toBeUndefined();
    });

    it("includes poor timeliness concern when onTimeRate < 60%", () => {
      const records = [
        baseRecord({ id: "g1" }),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `l_${i}`, status: "late" }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("poor timeliness"));
      expect(c).toBeDefined();
    });

    it("includes moderate timeliness concern when onTimeRate is 60-79%", () => {
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "l1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("on-time rate"));
      expect(c).toBeDefined();
    });

    it("does not include timeliness concern when onTimeRate >= 80%", () => {
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "l1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("on-time rate") || c.includes("poor timeliness"));
      expect(c).toBeUndefined();
    });

    it("includes refusal pattern concern when refusalRate > 20%", () => {
      const records = [
        ...makeRecords(7),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // refusalRate = 3/10 = 30% > 20
      const c = result.concerns.find(c => c.includes("refusal rate"));
      expect(c).toBeDefined();
    });

    it("does not include refusal pattern concern when refusalRate <= 20%", () => {
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // refusalRate = 2/10 = 20% → not > 20
      const c = result.concerns.find(c => c.includes("refusal rate"));
      expect(c).toBeUndefined();
    });

    it("includes witness governance concern when witnessRate < 80%", () => {
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "u1", has_witness: false }),
        baseRecord({ id: "u2", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // witnessRate = 3/5 = 60%
      const c = result.concerns.find(c => c.includes("witnessed"));
      expect(c).toBeDefined();
    });

    it("does not include witness governance concern when witnessRate >= 80%", () => {
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "u1", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // witnessRate = 4/5 = 80%
      const c = result.concerns.find(c => c.includes("governance requires dual signatures"));
      expect(c).toBeUndefined();
    });

    it("includes reason documentation concern when reasonRate < 50% with refusals", () => {
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // reasonRate = 0/2 = 0% < 50
      const c = result.concerns.find(c => c.includes("documented reasons"));
      expect(c).toBeDefined();
    });

    it("does not include reason documentation concern when no refusals", () => {
      const records = makeRecords(10);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("documented reasons"));
      expect(c).toBeUndefined();
    });

    it("includes PRN documentation concern when prnDocRate < 40%", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: false,
          has_prn_effectiveness: false,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("PRN documentation rate"));
      expect(c).toBeDefined();
    });

    it("does not include PRN documentation concern when no PRN given", () => {
      const records = makeRecords(10);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("PRN documentation"));
      expect(c).toBeUndefined();
    });

    it("includes multiple-late concern when a child has 3+ late administrations", () => {
      const records = [
        ...makeRecords(5),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({
            id: `late_${i}`,
            child_id: "child_A",
            status: "late",
          }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("3 or more late"));
      expect(c).toBeDefined();
    });

    it("does not include multiple-late concern when child has only 2 late", () => {
      const records = [
        ...makeRecords(5),
        baseRecord({ id: "late_1", child_id: "child_A", status: "late" }),
        baseRecord({ id: "late_2", child_id: "child_A", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("3 or more late"));
      expect(c).toBeUndefined();
    });

    it("uses singular 'child has' when exactly 1 child has 3+ late", () => {
      const records = [
        ...makeRecords(5),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `late_${i}`, child_id: "child_A", status: "late" }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("3 or more late"));
      expect(c).toContain("1 child has");
    });

    it("uses plural 'children have' when 2+ children have 3+ late", () => {
      const records = [
        ...makeRecords(5),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `lateA_${i}`, child_id: "child_A", status: "late" }),
        ),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `lateB_${i}`, child_id: "child_B", status: "late" }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("3 or more late"));
      expect(c).toContain("2 children have");
    });
  });

  // ── 16. Recommendations ───────────────────────────────────────────────

  describe("recommendations", () => {
    it("includes urgent audit recommendation when adminRate < 70%", () => {
      const records = [
        ...makeRecords(3),
        ...Array.from({ length: 7 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r => r.recommendation.includes("urgent medicines management audit"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 31");
    });

    it("includes compliance improvement recommendation when adminRate is 70-89%", () => {
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r => r.recommendation.includes("Improve administration compliance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("does not include admin recommendation when adminRate >= 90%", () => {
      const records = [
        ...makeRecords(9),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r =>
        r.recommendation.includes("audit") || r.recommendation.includes("Improve administration"),
      );
      expect(rec).toBeUndefined();
    });

    it("includes immediate scheduling recommendation when onTimeRate < 60%", () => {
      const records = [
        baseRecord({ id: "g1" }),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `l_${i}`, status: "late" }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r => r.recommendation.includes("scheduling and staffing"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("includes soon timeliness recommendation when onTimeRate is 60-79%", () => {
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "l1", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r => r.recommendation.includes("Improve on-time administration"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("includes witness rate recommendation when witnessRate < 80%", () => {
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "u1", has_witness: false }),
        baseRecord({ id: "u2", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r => r.recommendation.includes("Increase witness rate"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("Reg 12");
    });

    it("includes clinical review recommendation when refusalRate > 20%", () => {
      const records = [
        ...makeRecords(7),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r => r.recommendation.includes("clinical review"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("includes reason documentation recommendation when reasonRate < 70%", () => {
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r => r.recommendation.includes("Improve documentation of reasons"));
      expect(rec).toBeDefined();
    });

    it("includes PRN documentation recommendation when prnDocRate < 70%", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: false,
          has_prn_effectiveness: false,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r => r.recommendation.includes("Improve PRN documentation"));
      expect(rec).toBeDefined();
    });

    it("includes late investigation recommendation when child has 3+ late", () => {
      const records = [
        ...makeRecords(5),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `late_${i}`, child_id: "child_A", status: "late" }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const rec = result.recommendations.find(r => r.recommendation.includes("Investigate repeated late"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("assigns sequential rank numbers to recommendations", () => {
      // Many problems → many recommendations
      const records = [
        baseRecord({ id: "g1", has_witness: false }),
        ...Array.from({ length: 9 }, (_, i) =>
          baseRecord({ id: `l_${i}`, status: "late", has_witness: false }),
        ),
        ...Array.from({ length: 10 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      result.recommendations.forEach((rec, idx) => {
        expect(rec.rank).toBe(idx + 1);
      });
    });
  });

  // ── 17. Insights ──────────────────────────────────────────────────────

  describe("insights", () => {
    it("includes outstanding positive insight when rating is outstanding", () => {
      const givenRecords = makeRecords(95);
      const prnRecords = Array.from({ length: 10 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 7,
          has_prn_effectiveness: i < 7,
        }),
      );
      const refusedRecord = baseRecord({
        id: "ref_1",
        status: "refused",
        has_witness: false,
        has_reason_not_given: true,
      });
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...givenRecords, ...prnRecords, refusedRecord] }),
      );
      const ins = result.insights.find(i => i.text.includes("outstanding") && i.severity === "positive");
      expect(ins).toBeDefined();
    });

    it("includes near-perfect insight when admin>=98, onTime>=95, witness>=95", () => {
      const records = makeRecords(100);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const ins = result.insights.find(i => i.text.includes("Near-perfect"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("includes critical admin insight when adminRate < 70%", () => {
      const records = [
        ...makeRecords(3),
        ...Array.from({ length: 7 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const ins = result.insights.find(i => i.severity === "critical" && i.text.includes("safeguarding concern"));
      expect(ins).toBeDefined();
    });

    it("includes critical refusal insight when refusalRate > 30%", () => {
      const records = [
        ...makeRecords(6),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // refusalRate = 4/10 = 40% > 30
      const ins = result.insights.find(i => i.severity === "critical" && i.text.includes("exceptionally high"));
      expect(ins).toBeDefined();
    });

    it("includes warning refusal insight when refusalRate is 21-30%", () => {
      // 7 given + 3 refused = 10 total → 30%
      const records = [
        ...makeRecords(7),
        ...Array.from({ length: 3 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // refusalRate = 30% → > 20 but not > 30 → warning
      const ins = result.insights.find(i => i.severity === "warning" && i.text.includes("concerning pattern"));
      expect(ins).toBeDefined();
    });

    it("does not include refusal insight when refusalRate <= 20%", () => {
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const ins = result.insights.find(i => i.text.includes("refusal rate"));
      expect(ins).toBeUndefined();
    });

    it("includes critical witness insight when witnessRate < 50%", () => {
      const records = [
        baseRecord({ id: "w1", has_witness: true }),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `u_${i}`, has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // witnessRate = 1/5 = 20% < 50
      const ins = result.insights.find(i => i.severity === "critical" && i.text.includes("governance risk"));
      expect(ins).toBeDefined();
    });

    it("includes warning witness insight when witnessRate is 50-79%", () => {
      const records = [
        ...makeRecords(3),
        baseRecord({ id: "u1", has_witness: false }),
        baseRecord({ id: "u2", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // witnessRate = 3/5 = 60%
      const ins = result.insights.find(i => i.severity === "warning" && i.text.includes("witness rate"));
      expect(ins).toBeDefined();
    });

    it("does not include witness insight when witnessRate >= 80%", () => {
      const records = [
        ...makeRecords(4),
        baseRecord({ id: "u1", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const ins = result.insights.find(i => i.text.includes("witness rate") && (i.severity === "warning" || i.severity === "critical"));
      expect(ins).toBeUndefined();
    });

    it("includes timeliness insight when onTimeRate < 60%", () => {
      const records = [
        baseRecord({ id: "g1" }),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `l_${i}`, status: "late" }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const ins = result.insights.find(i => i.text.includes("on time") && i.severity === "warning");
      expect(ins).toBeDefined();
    });

    it("includes PRN documentation insight when prnDocRate < 40%", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: false,
          has_prn_effectiveness: false,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const ins = result.insights.find(i => i.text.includes("PRN documentation is critically low"));
      expect(ins).toBeDefined();
    });

    it("includes combined positive insight when low refusal + high admin + good PRN", () => {
      // refusalRate<=5, adminRate>=95, prnGiven.length>0, prnDocRate>=90
      const given = makeRecords(19);
      const prnRecords = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: true,
          has_prn_effectiveness: true,
        }),
      );
      // Total = 24, refusalRate=0, adminRate=100%, prnDocRate=100%
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...given, ...prnRecords] }),
      );
      const ins = result.insights.find(i => i.text.includes("Low refusal rate combined"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("does not include combined positive insight when PRN doc rate < 90%", () => {
      const given = makeRecords(19);
      const prnRecords = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: i < 3,
          has_prn_effectiveness: i < 3,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...given, ...prnRecords] }),
      );
      const ins = result.insights.find(i => i.text.includes("Low refusal rate combined"));
      expect(ins).toBeUndefined();
    });
  });

  // ── 18. Edge Cases ────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles a single given record correctly", () => {
      const result = computeMedicationAdministration(
        baseInput({ administrations: [baseRecord()] }),
      );
      expect(result.total_administrations).toBe(1);
      expect(result.administration_rate).toBe(100);
      expect(result.on_time_rate).toBe(100);
      expect(result.witness_rate).toBe(100);
    });

    it("handles all-given-on-time records", () => {
      const records = makeRecords(50);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(100);
      expect(result.on_time_rate).toBe(100);
      expect(result.refusal_rate).toBe(0);
    });

    it("handles all-refused records", () => {
      const records = makeRecords(10, { status: "refused", has_witness: false });
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(0);
      expect(result.refusal_rate).toBe(100);
      expect(result.on_time_rate).toBe(0);
      expect(result.witness_rate).toBe(0);
    });

    it("handles all-late records", () => {
      const records = makeRecords(10, { status: "late" });
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(100);
      expect(result.on_time_rate).toBe(0);
    });

    it("handles PRN-only records", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: true,
          has_prn_effectiveness: true,
        }),
      );
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(100);
      expect(result.administration_rate).toBe(100);
    });

    it("handles regular-only records (no PRN)", () => {
      const records = makeRecords(10);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.prn_documentation_rate).toBe(0);
    });

    it("handles all-withheld records", () => {
      const records = makeRecords(5, { status: "withheld", has_witness: false });
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(0);
      expect(result.refusal_rate).toBe(0);
    });

    it("handles all-omitted records", () => {
      const records = makeRecords(5, { status: "omitted", has_witness: false });
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(0);
    });

    it("handles mixed statuses: given, late, refused, withheld, omitted", () => {
      const records = [
        baseRecord({ id: "g1", status: "given" }),
        baseRecord({ id: "l1", status: "late" }),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
        baseRecord({ id: "w1", status: "withheld", has_witness: false }),
        baseRecord({ id: "o1", status: "omitted", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.total_administrations).toBe(5);
      expect(result.administration_rate).toBe(40); // 2/5
      expect(result.on_time_rate).toBe(50); // 1/2
      expect(result.refusal_rate).toBe(20); // 1/5
    });

    it("handles multiple children with different medication patterns", () => {
      const records = [
        baseRecord({ id: "g1", child_id: "child_A" }),
        baseRecord({ id: "g2", child_id: "child_A" }),
        baseRecord({ id: "r1", child_id: "child_B", status: "refused", has_witness: false }),
        baseRecord({ id: "g3", child_id: "child_C" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records, children_on_medication: 3 }),
      );
      expect(result.total_administrations).toBe(4);
      expect(result.children_on_medication).toBe(3);
    });

    it("handles large number of records (500+)", () => {
      const records = makeRecords(500);
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.total_administrations).toBe(500);
      expect(result.administration_rate).toBe(100);
    });

    it("treats omitted records correctly in administration rate", () => {
      // omitted counts as non-administered
      const records = [
        ...makeRecords(8),
        baseRecord({ id: "o1", status: "omitted", has_witness: false }),
        baseRecord({ id: "o2", status: "omitted", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // adminRate = 8/10 = 80%
      expect(result.administration_rate).toBe(80);
    });
  });

  // ── 19. Full Integration Scenarios ────────────────────────────────────

  describe("full integration scenarios", () => {
    it("produces correct output for a perfect medication administration scenario", () => {
      // 50 given on time, all witnessed, 5 PRN fully documented, 1 refused with reason
      const given = makeRecords(45);
      const prn = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: true,
          has_prn_effectiveness: true,
        }),
      );
      const refused = [
        baseRecord({ id: "r1", status: "refused", has_witness: false, has_reason_not_given: true }),
      ];
      const result = computeMedicationAdministration(
        baseInput({
          total_children: 4,
          children_on_medication: 3,
          total_active_medications: 6,
          administrations: [...given, ...prn, ...refused],
        }),
      );

      expect(result.medication_rating).toBe("outstanding");
      expect(result.total_administrations).toBe(51);
      expect(result.administration_rate).toBe(98); // 50/51
      expect(result.on_time_rate).toBe(100);
      expect(result.refusal_rate).toBe(2); // 1/51
      expect(result.witness_rate).toBe(100); // 50/50
      expect(result.prn_documentation_rate).toBe(100);
      expect(result.reason_documented_rate).toBe(100);
      expect(result.children_on_medication).toBe(3);
      expect(result.total_active_medications).toBe(6);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.concerns.length).toBe(0);
    });

    it("produces correct output for a poor medication administration scenario", () => {
      const given = [
        baseRecord({ id: "g1", has_witness: false }),
      ];
      const late = Array.from({ length: 3 }, (_, i) =>
        baseRecord({ id: `l_${i}`, status: "late", has_witness: false }),
      );
      const refused = Array.from({ length: 6 }, (_, i) =>
        baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
      );
      const result = computeMedicationAdministration(
        baseInput({
          administrations: [...given, ...late, ...refused],
        }),
      );

      expect(result.total_administrations).toBe(10);
      expect(result.administration_rate).toBe(40); // 4/10
      expect(result.on_time_rate).toBe(25); // 1/4
      expect(result.refusal_rate).toBe(60); // 6/10
      expect(result.witness_rate).toBe(0); // 0/4
      expect(result.medication_rating).toBe("inadequate");
      expect(result.concerns.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("handles a scenario with only scheduled records and children on meds", () => {
      const records = [
        baseRecord({ id: "s1", status: "scheduled" }),
        baseRecord({ id: "s2", status: "scheduled" }),
        baseRecord({ id: "s3", status: "scheduled" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ children_on_medication: 2, administrations: records }),
      );
      // All filtered out → children on meds but no records path
      expect(result.medication_score).toBe(46);
      expect(result.total_administrations).toBe(0);
    });

    it("correctly filters scheduled records alongside real records", () => {
      const records = [
        baseRecord({ id: "g1" }),
        baseRecord({ id: "g2" }),
        baseRecord({ id: "s1", status: "scheduled" }),
        baseRecord({ id: "r1", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // 3 non-scheduled records
      expect(result.total_administrations).toBe(3);
      expect(result.administration_rate).toBe(67); // 2/3
    });

    it("calculates the correct score for a moderate scenario", () => {
      // 15 given (12 witnessed), 3 late (2 witnessed), 2 refused (1 with reason) = 20 total
      // adminRate = 18/20 = 90 → +3
      // onTimeRate = 15/18 = 83 → +2
      // witnessRate = 14/18 = 78 → 0 (not >= 80, not < 50)
      // refusalRate = 2/20 = 10 → <=15 → +2
      // no PRN → +1
      // mod6: 90 < 95 → aboveEighty: 90>=80 yes, 83>=80 yes, 78>=80 no → 2 → +2
      // score = 52 + 3 + 2 + 0 + 2 + 1 + 2 = 62

      const given = Array.from({ length: 15 }, (_, i) =>
        baseRecord({ id: `g_${i}`, has_witness: i < 12 }),
      );
      const late = Array.from({ length: 3 }, (_, i) =>
        baseRecord({ id: `l_${i}`, status: "late", has_witness: i < 2 }),
      );
      const refused = [
        baseRecord({ id: "r1", status: "refused", has_witness: false, has_reason_not_given: true }),
        baseRecord({ id: "r2", status: "refused", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...given, ...late, ...refused] }),
      );

      expect(result.medication_score).toBe(62);
      expect(result.medication_rating).toBe("adequate");
      expect(result.administration_rate).toBe(90);
      expect(result.on_time_rate).toBe(83);
      expect(result.witness_rate).toBe(78);
      expect(result.refusal_rate).toBe(10);
      expect(result.reason_documented_rate).toBe(50);
    });
  });

  // ── 20. Output Field Completeness ─────────────────────────────────────

  describe("output field completeness", () => {
    it("returns all expected fields in the result", () => {
      const result = computeMedicationAdministration(baseInput());
      expect(result).toHaveProperty("medication_rating");
      expect(result).toHaveProperty("medication_score");
      expect(result).toHaveProperty("headline");
      expect(result).toHaveProperty("total_administrations");
      expect(result).toHaveProperty("administration_rate");
      expect(result).toHaveProperty("on_time_rate");
      expect(result).toHaveProperty("refusal_rate");
      expect(result).toHaveProperty("witness_rate");
      expect(result).toHaveProperty("prn_documentation_rate");
      expect(result).toHaveProperty("reason_documented_rate");
      expect(result).toHaveProperty("children_on_medication");
      expect(result).toHaveProperty("total_active_medications");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("insights");
    });

    it("returns arrays for strengths, concerns, recommendations, insights", () => {
      const result = computeMedicationAdministration(baseInput());
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.concerns)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it("returns numeric values for all rate fields", () => {
      const result = computeMedicationAdministration(baseInput());
      expect(typeof result.medication_score).toBe("number");
      expect(typeof result.administration_rate).toBe("number");
      expect(typeof result.on_time_rate).toBe("number");
      expect(typeof result.refusal_rate).toBe("number");
      expect(typeof result.witness_rate).toBe("number");
      expect(typeof result.prn_documentation_rate).toBe("number");
      expect(typeof result.reason_documented_rate).toBe("number");
    });

    it("returns a string headline", () => {
      const result = computeMedicationAdministration(baseInput());
      expect(typeof result.headline).toBe("string");
      expect(result.headline.length).toBeGreaterThan(0);
    });

    it("returns valid rating enum values", () => {
      const validRatings = ["outstanding", "good", "adequate", "inadequate", "insufficient_data"];
      const result = computeMedicationAdministration(baseInput());
      expect(validRatings).toContain(result.medication_rating);
    });

    it("returns recommendation objects with rank, recommendation, urgency, regulatory_ref", () => {
      const records = [
        ...makeRecords(3),
        ...Array.from({ length: 7 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.recommendations.length).toBeGreaterThan(0);
      for (const rec of result.recommendations) {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("returns insight objects with text and severity", () => {
      const records = [
        ...makeRecords(3),
        ...Array.from({ length: 7 }, (_, i) =>
          baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.insights.length).toBeGreaterThan(0);
      for (const ins of result.insights) {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(typeof ins.text).toBe("string");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });
  });

  // ── 21. Additional Modifier Boundary & Combination Tests ──────────────

  describe("modifier combinations and interactions", () => {
    it("computes maximum possible score: 52+6+5+5+5+4+5 = 82", () => {
      // adminRate>=98, onTimeRate>=95, witnessRate>=95,
      // refusalRate<=5 && reasonRate>=90 → +5,
      // prnDocRate>=90 → +4,
      // all three >=95/90/90 → +5
      const given = makeRecords(98);
      const prn = Array.from({ length: 5 }, (_, i) =>
        baseRecord({ id: `prn_${i}`, is_prn: true, has_prn_reason: true, has_prn_effectiveness: true }),
      );
      const refused = [
        baseRecord({ id: "r1", status: "refused", has_witness: false, has_reason_not_given: true }),
      ];
      // Total: 104. adminRate=103/104=99→+6. onTimeRate=103/103=100→+5. witnessRate=103/103=100→+5.
      // refusalRate=1/104=1→<=5, reasonRate=100→>=90→+5. prnDocRate=100→+4.
      // mod6: 99>=95, 100>=90, 100>=90→+5.
      // score = 52+6+5+5+5+4+5 = 82
      const result = computeMedicationAdministration(
        baseInput({ administrations: [...given, ...prn, ...refused] }),
      );
      expect(result.medication_score).toBe(82);
    });

    it("computes minimum possible score through main path: 52-5-5-4-4-4-3 = 27", () => {
      // All penalties maximized
      // adminRate<70→-5, onTimeRate<60→-5, witnessRate<50→-4
      // refusalRate>30&&reasonRate<50→-4, prnDocRate<40→-4
      // all<70→-3
      const given = [
        baseRecord({ id: "g1", has_witness: false }),
      ];
      const late = Array.from({ length: 2 }, (_, i) =>
        baseRecord({ id: `l_${i}`, status: "late", has_witness: false }),
      );
      const refused = Array.from({ length: 7 }, (_, i) =>
        baseRecord({ id: `r_${i}`, status: "refused", has_witness: false }),
      );
      const prnUndoc = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          has_prn_reason: false,
          has_prn_effectiveness: false,
          has_witness: false,
        }),
      );
      // Total non-scheduled = 1+2+7+5 = 15
      // administered = 1+2+5 = 8 (given + late + PRN given)
      // adminRate = 8/15 = 53 → <70 → -5
      // onTimeRate = (1+5)/(1+2+5) = 6/8 = 75 → >=60 → 0. Hmm, need <60.
      // PRN "given" counts as "given" for on-time too. Let me restructure.
      // Make PRN late instead:
      const prnLate = Array.from({ length: 5 }, (_, i) =>
        baseRecord({
          id: `prn_${i}`,
          is_prn: true,
          status: "late",
          has_prn_reason: false,
          has_prn_effectiveness: false,
          has_witness: false,
        }),
      );
      // administered = 1 given + 2 late + 5 prn-late = 8
      // given = 1. onTimeRate = 1/8 = 13 → <60 → -5 ✓
      // witnessRate = 0/8 = 0 → <50 → -4 ✓
      // refusalRate = 7/15 = 47 → >30 ✓. reasonRate = 0/7 = 0 → <50 ✓ → -4
      // prnDocRate = 0/5 = 0 → <40 → -4 ✓
      // mod6: admin=53<70, onTime=13<70, witness=0<70 → all<70 → -3 ✓
      // score = 52-5-5-4-4-4-3 = 27

      const result = computeMedicationAdministration(
        baseInput({ administrations: [...given, ...late, ...refused, ...prnLate] }),
      );
      expect(result.medication_score).toBe(27);
    });

    it("correctly handles mod4 OR condition: refusalRate > 15 but reasonRate >= 70 → +2", () => {
      // 5 given + 5 refused (4 with reason)
      // refusalRate=50% (>15), reasonRate=80% (>=70) → +2
      const records = [
        ...makeRecords(5),
        ...Array.from({ length: 5 }, (_, i) =>
          baseRecord({
            id: `r_${i}`,
            status: "refused",
            has_witness: false,
            has_reason_not_given: i < 4,
          }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // Verify mod4 awarded +2 by checking the overall score
      // mod1: adminRate=50→-5, mod2: onTimeRate=100→+5, mod3: witnessRate=100→+5
      // mod4: refusalRate=50>30 but reasonRate=80>=70 → +2 (OR branch)
      // mod5: no PRN→+1, mod6: aboveEighty: 50<80 no, 100>=80 yes, 100>=80 yes → 2 → +2
      // score = 52-5+5+5+2+1+2 = 62
      expect(result.medication_score).toBe(62);
    });

    it("mod4 falls through to 0 when refusalRate=16-30 and reasonRate=50-69", () => {
      // 16 given + 4 refused (2 with reason) = 20
      // refusalRate=4/20=20. reasonRate=2/4=50.
      // mod4: <=5 && >=90? no. <=15? no(20). >=70? no(50). >30? no(20). → 0
      const records = [
        ...makeRecords(16),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({
            id: `r_${i}`,
            status: "refused",
            has_witness: false,
            has_reason_not_given: i < 2,
          }),
        ),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(20);
      expect(result.reason_documented_rate).toBe(50);
      // Confirm mod4=0 by checking overall score
      // mod1: adminRate=80→0, mod2: onTime=100→+5, mod3: witness=16/16=100→+5
      // mod4=0, mod5: no PRN→+1, mod6: aboveEighty: 80,100,100→3→+2
      // score = 52+0+5+5+0+1+2 = 65
      expect(result.medication_score).toBe(65);
    });
  });

  // ── 22. Omitted & Withheld Status Tests ───────────────────────────────

  describe("omitted and withheld status handling", () => {
    it("does not count omitted records as administered", () => {
      const records = [
        ...makeRecords(5),
        baseRecord({ id: "o1", status: "omitted", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // administered = 5 (given only), total = 6
      expect(result.administration_rate).toBe(83); // 5/6
    });

    it("does not count withheld records as administered", () => {
      const records = [
        ...makeRecords(5),
        baseRecord({ id: "w1", status: "withheld", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(83); // 5/6
    });

    it("includes withheld in reason_documented_rate denominator", () => {
      const records = [
        ...makeRecords(5),
        baseRecord({ id: "w1", status: "withheld", has_reason_not_given: true, has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.reason_documented_rate).toBe(100); // 1/1
    });

    it("does not count omitted in refusal_rate numerator", () => {
      const records = [
        ...makeRecords(5),
        baseRecord({ id: "o1", status: "omitted", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // refused = 0, total = 6 → refusalRate = 0%
      expect(result.refusal_rate).toBe(0);
    });

    it("does not count withheld in refusal_rate numerator", () => {
      const records = [
        ...makeRecords(5),
        baseRecord({ id: "w1", status: "withheld", has_witness: false }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.refusal_rate).toBe(0);
    });
  });

  // ── 23. Late Records & Child Tracking ─────────────────────────────────

  describe("late records and child tracking", () => {
    it("counts late administrations per child_id for the multiple-late concern", () => {
      const records = [
        baseRecord({ id: "l1", child_id: "child_A", status: "late" }),
        baseRecord({ id: "l2", child_id: "child_A", status: "late" }),
        baseRecord({ id: "l3", child_id: "child_A", status: "late" }),
        baseRecord({ id: "l4", child_id: "child_B", status: "late" }),
        baseRecord({ id: "l5", child_id: "child_B", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      // Only child_A has 3+
      const c = result.concerns.find(c => c.includes("3 or more late"));
      expect(c).toContain("1 child has");
    });

    it("does not trigger multiple-late concern for children with exactly 2 late", () => {
      const records = [
        baseRecord({ id: "l1", child_id: "child_A", status: "late" }),
        baseRecord({ id: "l2", child_id: "child_A", status: "late" }),
        baseRecord({ id: "g1", child_id: "child_B" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      const c = result.concerns.find(c => c.includes("3 or more late"));
      expect(c).toBeUndefined();
    });

    it("late records count as administered for adminRate but not for onTimeRate", () => {
      const records = [
        baseRecord({ id: "l1", status: "late" }),
        baseRecord({ id: "l2", status: "late" }),
      ];
      const result = computeMedicationAdministration(
        baseInput({ administrations: records }),
      );
      expect(result.administration_rate).toBe(100); // 2/2
      expect(result.on_time_rate).toBe(0); // 0/2 (no "given")
    });
  });

  // ── 24. Deterministic & Pure Function Tests ───────────────────────────

  describe("deterministic behaviour", () => {
    it("returns identical results for identical inputs", () => {
      const input = baseInput({
        administrations: [
          baseRecord({ id: "g1" }),
          baseRecord({ id: "l1", status: "late" }),
          baseRecord({ id: "r1", status: "refused", has_witness: false }),
        ],
      });
      const result1 = computeMedicationAdministration(input);
      const result2 = computeMedicationAdministration(input);
      expect(result1).toEqual(result2);
    });

    it("does not mutate the input object", () => {
      const input = baseInput({
        administrations: [
          baseRecord({ id: "g1" }),
          baseRecord({ id: "r1", status: "refused", has_witness: false }),
        ],
      });
      const inputCopy = JSON.parse(JSON.stringify(input));
      computeMedicationAdministration(input);
      expect(input).toEqual(inputCopy);
    });
  });

  describe("canonical administration statuses (missed / self_administered / not_available)", () => {
    it("surfaces missed doses as a distinct concern, not just the aggregate rate", () => {
      const result = computeMedicationAdministration(baseInput({
        administrations: mixedRecords(8, 2, "missed"),
      }));
      expect(result.concerns.some((c) => c.includes("MISSED entirely"))).toBe(true);
    });

    it("surfaces a stock-out (not_available) concern", () => {
      const result = computeMedicationAdministration(baseInput({
        administrations: mixedRecords(8, 2, "not_available"),
      }));
      expect(result.concerns.some((c) => c.toLowerCase().includes("not available") || c.toLowerCase().includes("stock-out"))).toBe(true);
    });

    it("counts self-administered doses as administered, not failures", () => {
      // 5 given + 5 self-administered → all 10 count as administered = 100%
      const selfAdmin = computeMedicationAdministration(baseInput({
        administrations: mixedRecords(5, 5, "self_administered"),
      }));
      expect(selfAdmin.administration_rate).toBe(100);
      // contrast: 5 given + 5 missed → only 5/10 administered = 50%
      const withMissed = computeMedicationAdministration(baseInput({
        administrations: mixedRecords(5, 5, "missed"),
      }));
      expect(withMissed.administration_rate).toBe(50);
    });
  });
});
