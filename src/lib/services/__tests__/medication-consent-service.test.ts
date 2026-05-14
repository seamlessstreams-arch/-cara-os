import { describe, it, expect } from "vitest";
import { _testing, type MedicationConsentRecord } from "../medication-consent-service";

const { computeMedicationConsentMetrics, identifyMedicationConsentAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<MedicationConsentRecord>): MedicationConsentRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    consent_type: overrides?.consent_type ?? "parental_consent",
    consent_status: overrides?.consent_status ?? "active",
    medication_type: overrides?.medication_type ?? "prescribed_regular",
    consent_given_by: overrides?.consent_given_by ?? "parent_mother",
    consent_date: overrides?.consent_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    medication_name: overrides?.medication_name ?? "Paracetamol",
    consent_documented: overrides?.consent_documented ?? true,
    capacity_assessed: overrides?.capacity_assessed ?? true,
    child_informed: overrides?.child_informed ?? true,
    side_effects_explained: overrides?.side_effects_explained ?? true,
    alternatives_discussed: overrides?.alternatives_discussed ?? true,
    review_date_set: overrides?.review_date_set ?? true,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    gp_consulted: overrides?.gp_consulted ?? true,
    restrictions_noted: overrides?.restrictions_noted ?? true,
    self_admin_assessed: overrides?.self_admin_assessed ?? true,
    storage_confirmed: overrides?.storage_confirmed ?? true,
    disposal_arranged: overrides?.disposal_arranged ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    recorded_by: overrides?.recorded_by ?? "Manager A",
    review_date: "review_date" in (overrides ?? {}) ? (overrides!.review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("medication-consent-service", () => {
  describe("computeMedicationConsentMetrics", () => {
    it("returns zeros for empty", () => { const m = computeMedicationConsentMetrics([]); expect(m.total_consents).toBe(0); expect(m.active_count).toBe(0); expect(m.expired_count).toBe(0); expect(m.withdrawn_count).toBe(0); expect(m.refused_count).toBe(0); expect(m.consent_documented_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeMedicationConsentMetrics([]); expect(m.by_consent_type).toEqual({}); expect(m.by_consent_status).toEqual({}); expect(m.by_medication_type).toEqual({}); expect(m.by_consent_given_by).toEqual({}); });
    it("counts active", () => { expect(computeMedicationConsentMetrics([makeRecord()]).active_count).toBe(1); });
    it("counts expired", () => { expect(computeMedicationConsentMetrics([makeRecord({ consent_status: "expired" })]).expired_count).toBe(1); });
    it("counts withdrawn", () => { expect(computeMedicationConsentMetrics([makeRecord({ consent_status: "withdrawn" })]).withdrawn_count).toBe(1); });
    it("counts refused", () => { expect(computeMedicationConsentMetrics([makeRecord({ consent_status: "refused" })]).refused_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeMedicationConsentMetrics([makeRecord()]); expect(m.consent_documented_rate).toBe(100); expect(m.capacity_assessed_rate).toBe(100); expect(m.child_informed_rate).toBe(100); expect(m.side_effects_explained_rate).toBe(100); expect(m.alternatives_discussed_rate).toBe(100); expect(m.review_date_set_rate).toBe(100); expect(m.social_worker_notified_rate).toBe(100); expect(m.gp_consulted_rate).toBe(100); expect(m.restrictions_noted_rate).toBe(100); expect(m.self_admin_assessed_rate).toBe(100); expect(m.storage_confirmed_rate).toBe(100); expect(m.disposal_arranged_rate).toBe(100); });
    it("consent_documented_rate 0 when false", () => { expect(computeMedicationConsentMetrics([makeRecord({ consent_documented: false })]).consent_documented_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeMedicationConsentMetrics([makeRecord({ consent_documented: true }), makeRecord({ consent_documented: false }), makeRecord({ consent_documented: true })]); expect(m.consent_documented_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeMedicationConsentMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 consent types", () => { const types = ["parental_consent","local_authority_consent","gillick_competence","court_order","emergency_authorisation","prn_consent","self_administration","over_the_counter","homely_remedy","other"] as const; const records = types.map(t => makeRecord({ consent_type: t })); const m = computeMedicationConsentMetrics(records); for (const t of types) expect(m.by_consent_type[t]).toBe(1); });
    it("counts all 5 consent statuses", () => { const statuses = ["active","expired","withdrawn","pending_review","refused"] as const; const records = statuses.map(s => makeRecord({ consent_status: s })); const m = computeMedicationConsentMetrics(records); for (const s of statuses) expect(m.by_consent_status[s]).toBe(1); });
    it("counts all 10 medication types", () => { const types = ["prescribed_regular","prescribed_prn","over_the_counter","homely_remedy","controlled_drug","supplement","topical","inhaler","injectable","other"] as const; const records = types.map(t => makeRecord({ medication_type: t })); const m = computeMedicationConsentMetrics(records); for (const t of types) expect(m.by_medication_type[t]).toBe(1); });
    it("counts all 10 consent given by", () => { const bys = ["parent_mother","parent_father","local_authority","young_person","court","foster_carer","social_worker","doctor","independent_advocate","other"] as const; const records = bys.map(b => makeRecord({ consent_given_by: b })); const m = computeMedicationConsentMetrics(records); for (const b of bys) expect(m.by_consent_given_by[b]).toBe(1); });
    it("total_consents counts all", () => { expect(computeMedicationConsentMetrics([makeRecord(), makeRecord(), makeRecord()]).total_consents).toBe(3); });
    it("multiple statuses counted correctly", () => { const m = computeMedicationConsentMetrics([makeRecord({ consent_status: "active" }), makeRecord({ consent_status: "active" }), makeRecord({ consent_status: "expired" })]); expect(m.active_count).toBe(2); expect(m.expired_count).toBe(1); });
  });

  describe("identifyMedicationConsentAlerts", () => {
    it("returns empty for clean", () => { expect(identifyMedicationConsentAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyMedicationConsentAlerts([])).toEqual([]); });
    it("fires controlled_drug_no_consent", () => { const a = identifyMedicationConsentAlerts([makeRecord({ medication_type: "controlled_drug", consent_documented: false, child_name: "Jo", medication_name: "Ritalin" })]); expect(a[0].type).toBe("controlled_drug_no_consent"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); expect(a[0].message).toContain("Ritalin"); });
    it("controlled_drug_no_consent per-record", () => { const a = identifyMedicationConsentAlerts([makeRecord({ id: "a-1", medication_type: "controlled_drug", consent_documented: false }), makeRecord({ id: "a-2", medication_type: "controlled_drug", consent_documented: false })]); expect(a.filter(x => x.type === "controlled_drug_no_consent")).toHaveLength(2); });
    it("no alert if controlled_drug with consent", () => { expect(identifyMedicationConsentAlerts([makeRecord({ medication_type: "controlled_drug", consent_documented: true })]).filter(x => x.type === "controlled_drug_no_consent")).toHaveLength(0); });
    it("fires expired_consent singular", () => { const a = identifyMedicationConsentAlerts([makeRecord({ consent_status: "expired" })]); const f = a.find(x => x.type === "expired_consent"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 medication consent has"); });
    it("expired_consent plural", () => { const a = identifyMedicationConsentAlerts([makeRecord({ consent_status: "expired" }), makeRecord({ consent_status: "expired" })]); const f = a.find(x => x.type === "expired_consent"); expect(f!.message).toContain("2 medication consents have"); });
    it("fires child_not_informed singular", () => { const a = identifyMedicationConsentAlerts([makeRecord({ child_informed: false })]); const f = a.find(x => x.type === "child_not_informed"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 consent has"); });
    it("child_not_informed plural", () => { const a = identifyMedicationConsentAlerts([makeRecord({ child_informed: false }), makeRecord({ child_informed: false })]); const f = a.find(x => x.type === "child_not_informed"); expect(f!.message).toContain("2 consents have"); });
    it("side_effects_not_explained not for 1", () => { expect(identifyMedicationConsentAlerts([makeRecord({ side_effects_explained: false })]).find(x => x.type === "side_effects_not_explained")).toBeUndefined(); });
    it("side_effects_not_explained fires for 2", () => { const a = identifyMedicationConsentAlerts([makeRecord({ side_effects_explained: false }), makeRecord({ side_effects_explained: false })]); expect(a.find(x => x.type === "side_effects_not_explained")).toBeDefined(); });
    it("no_review_date not for 1", () => { expect(identifyMedicationConsentAlerts([makeRecord({ review_date_set: false })]).find(x => x.type === "no_review_date")).toBeUndefined(); });
    it("no_review_date fires for 2", () => { const a = identifyMedicationConsentAlerts([makeRecord({ review_date_set: false }), makeRecord({ review_date_set: false })]); expect(a.find(x => x.type === "no_review_date")).toBeDefined(); });
    it("fires all applicable", () => { const a = identifyMedicationConsentAlerts([makeRecord({ medication_type: "controlled_drug", consent_documented: false, consent_status: "expired", child_informed: false, side_effects_explained: false, review_date_set: false }), makeRecord({ side_effects_explained: false, review_date_set: false })]); const types = a.map(x => x.type); expect(types).toContain("controlled_drug_no_consent"); expect(types).toContain("expired_consent"); expect(types).toContain("child_not_informed"); expect(types).toContain("side_effects_not_explained"); expect(types).toContain("no_review_date"); });
  });
});
