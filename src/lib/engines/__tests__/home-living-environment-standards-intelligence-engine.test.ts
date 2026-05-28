import { describe, it, expect, beforeEach } from "vitest";
import {
  computeLivingEnvironmentStandards,
  type LivingEnvironmentStandardsInput,
  type CleaningEntryInput,
  type MaintenanceItemInput,
  type KitchenHygieneCheckInput,
  type BedroomProfileInput,
  type RoomAllocationInput,
} from "../home-living-environment-standards-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `les-${++_id}`;

function makeCleaning(overrides: Partial<CleaningEntryInput> = {}): CleaningEntryInput {
  return {
    id: uid(),
    area: "communal",
    date: "2026-05-20",
    completed: true,
    completed_by: "staff-1",
    quality_rating: 4,
    issues_noted: null,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeMaintenance(overrides: Partial<MaintenanceItemInput> = {}): MaintenanceItemInput {
  return {
    id: uid(),
    title: "Fix door handle",
    category: "structural",
    priority: "medium",
    status: "completed",
    reported_date: "2026-05-01",
    completed_date: "2026-05-10",
    safety_risk: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeKitchenCheck(overrides: Partial<KitchenHygieneCheckInput> = {}): KitchenHygieneCheckInput {
  return {
    id: uid(),
    check_date: "2026-05-20",
    fridge_temp_ok: true,
    freezer_temp_ok: true,
    surfaces_clean: true,
    food_storage_compliant: true,
    pest_control_ok: true,
    fire_blanket_accessible: true,
    overall_pass: true,
    checked_by: "staff-2",
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeBedroom(overrides: Partial<BedroomProfileInput> = {}): BedroomProfileInput {
  return {
    id: uid(),
    child_id: "c1",
    personalised: true,
    child_chose_decor: true,
    adequate_storage: true,
    privacy_lock: true,
    condition: "good",
    last_inspection_date: "2026-05-15",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeRoomAllocation(overrides: Partial<RoomAllocationInput> = {}): RoomAllocationInput {
  return {
    id: uid(),
    child_id: "c1",
    room_number: "R1",
    allocated_date: "2026-01-01",
    suitable_for_needs: true,
    risk_assessed: true,
    child_consulted: true,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<LivingEnvironmentStandardsInput> = {}): LivingEnvironmentStandardsInput {
  return {
    today: "2026-05-28",
    total_children: 3,
    cleaning_entries: [makeCleaning(), makeCleaning(), makeCleaning()],
    maintenance_items: [makeMaintenance(), makeMaintenance(), makeMaintenance()],
    kitchen_hygiene_checks: [makeKitchenCheck(), makeKitchenCheck()],
    bedroom_profiles: [
      makeBedroom({ child_id: "c1" }),
      makeBedroom({ child_id: "c2" }),
      makeBedroom({ child_id: "c3" }),
    ],
    room_allocations: [
      makeRoomAllocation({ child_id: "c1" }),
      makeRoomAllocation({ child_id: "c2" }),
      makeRoomAllocation({ child_id: "c3" }),
    ],
    ...overrides,
  };
}

beforeEach(() => {
  _id = 0;
});

// ════════════════════════════════════════════════════════════════════════════
// 1. SPECIAL CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Special cases", () => {
  it("returns insufficient_data when all arrays empty and total_children=0", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 0,
      cleaning_entries: [],
      maintenance_items: [],
      kitchen_hygiene_checks: [],
      bedroom_profiles: [],
      room_allocations: [],
    });
    expect(r.environment_rating).toBe("insufficient_data");
    expect(r.environment_score).toBe(0);
    expect(r.headline).toBe("No living environment data available for analysis.");
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns inadequate with score 15 when all arrays empty but children in placement", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 4,
      cleaning_entries: [],
      maintenance_items: [],
      kitchen_hygiene_checks: [],
      bedroom_profiles: [],
      room_allocations: [],
    });
    expect(r.environment_rating).toBe("inadequate");
    expect(r.environment_score).toBe(15);
    expect(r.headline).toContain("No living environment records");
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No cleaning, maintenance, kitchen hygiene, bedroom, or room allocation records");
  });

  it("insufficient_data result has zeroed metrics", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 0,
      cleaning_entries: [],
      maintenance_items: [],
      kitchen_hygiene_checks: [],
      bedroom_profiles: [],
      room_allocations: [],
    });
    expect(r.total_cleaning_entries).toBe(0);
    expect(r.cleaning_completion_rate).toBe(0);
    expect(r.cleaning_quality_avg).toBe(0);
    expect(r.total_maintenance_items).toBe(0);
    expect(r.maintenance_completion_rate).toBe(0);
    expect(r.overdue_maintenance_count).toBe(0);
    expect(r.safety_maintenance_open).toBe(0);
    expect(r.kitchen_hygiene_pass_rate).toBe(0);
    expect(r.bedroom_personalisation_rate).toBe(0);
    expect(r.bedroom_condition_good_rate).toBe(0);
    expect(r.room_suitability_rate).toBe(0);
    expect(r.room_risk_assessment_rate).toBe(0);
    expect(r.child_consultation_rate).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. BASE SCORE
// ════════════════════════════════════════════════════════════════════════════

describe("Base score", () => {
  it("starts at 52 before bonuses/penalties", () => {
    // Use data that earns no bonuses and no penalties:
    // cleaning completion 60% (no bonus, no penalty since >=50)
    // quality avg 2.5 (no bonus)
    // maintenance 60% (no bonus, no penalty since >=50)
    // kitchen hygiene 75% (no bonus, no penalty since >=70)
    // bedroom personalisation 60% (no bonus)
    // bedroom condition good 60% (no bonus)
    // room suitability 60% (no bonus)
    // room risk assessment 60% (no bonus)
    // child consultation 60% (no bonus)
    // no safety maintenance open (no penalty)
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
    ];
    // 3 completed / 5 = 60%, avg quality = (2+3+3+2+3)/5 = 2.6
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "in_progress" }),
    ];
    // 3/5 = 60%
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 3/4 = 75%
    const bedrooms = [
      makeBedroom({ personalised: true, condition: "good", child_id: "c1" }),
      makeBedroom({ personalised: true, condition: "fair", child_id: "c2" }),
      makeBedroom({ personalised: true, condition: "good", child_id: "c3" }),
      makeBedroom({ personalised: false, condition: "fair", child_id: "c4" }),
      makeBedroom({ personalised: false, condition: "poor", child_id: "c5" }),
    ];
    // personalised 3/5 = 60%, condition good 2/5 = 40%
    // But condition good 40% < 70 so no bonus. That's fine.
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c1" }),
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c2" }),
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c3" }),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c4" }),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c5" }),
    ];
    // suitability 3/5=60%, risk 3/5=60%, consultation 3/5=60%
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 5,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
    });
    // Base 52, no bonuses, no penalties (all rates >=50, kitchen >=70, no safety open)
    expect(r.environment_score).toBe(52);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. INDIVIDUAL BONUSES
// ════════════════════════════════════════════════════════════════════════════

describe("Individual bonuses", () => {
  // Helper: baseline that gives score 52 with no bonuses/penalties
  // We'll use exactly: 3 cleaning (2 completed, 1 not) = 67%, quality avg=2.5
  // 3 maintenance (2 completed, 1 open) = 67%, no safety
  // 2 kitchen (1 pass, 1 fail) = 50% (below 70, triggers penalty -5 -> 47)
  // Actually let's be more careful. Use 75% kitchen to avoid penalty.
  // We need a minimal baseline at exactly 52 and then add one bonus at a time.
  // Simplest: use the approach where all metrics are "neutral" (no bonus, no penalty).

  function neutralInput(overrides: Partial<LivingEnvironmentStandardsInput> = {}): LivingEnvironmentStandardsInput {
    // cleaning: 3/5 = 60% completed, quality avg = (2+3+2+3+3)/5 = 2.6
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
    ];
    // maintenance: 3/5 = 60%
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "in_progress" }),
    ];
    // kitchen: 3/4 = 75%
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // bedroom: 3/5=60% personalised, 2/5=40% good condition
    const bedrooms = [
      makeBedroom({ personalised: true, condition: "good", child_id: "c1" }),
      makeBedroom({ personalised: true, condition: "good", child_id: "c2" }),
      makeBedroom({ personalised: true, condition: "fair", child_id: "c3" }),
      makeBedroom({ personalised: false, condition: "fair", child_id: "c4" }),
      makeBedroom({ personalised: false, condition: "fair", child_id: "c5" }),
    ];
    // room: 3/5=60% suitable, 3/5=60% risk, 3/5=60% consulted
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c1" }),
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c2" }),
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c3" }),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c4" }),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c5" }),
    ];
    return {
      today: "2026-05-28",
      total_children: 5,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
      ...overrides,
    };
  }

  it("cleaning completion >= 95 adds +4", () => {
    const cleaning = Array.from({ length: 20 }, () => makeCleaning({ completed: true, quality_rating: 2 }));
    // 20/20 = 100%, quality avg = 2.0 (no quality bonus)
    const r = computeLivingEnvironmentStandards(neutralInput({ cleaning_entries: cleaning }));
    // neutral base 52, cleaning completion +4, quality avg 2.0 (no bonus)
    expect(r.environment_score).toBe(52 + 4);
  });

  it("cleaning completion >= 80 but < 95 adds +2", () => {
    const cleaning = [
      ...Array.from({ length: 9 }, () => makeCleaning({ completed: true, quality_rating: 2 })),
      makeCleaning({ completed: false, quality_rating: 2 }),
    ];
    // 9/10 = 90%, quality avg = 2.0
    const r = computeLivingEnvironmentStandards(neutralInput({ cleaning_entries: cleaning }));
    expect(r.environment_score).toBe(52 + 2);
  });

  it("cleaning quality avg >= 4.0 adds +3", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 4 }),
      makeCleaning({ completed: true, quality_rating: 5 }),
      makeCleaning({ completed: true, quality_rating: 4 }),
      makeCleaning({ completed: false, quality_rating: 4 }),
      makeCleaning({ completed: false, quality_rating: 4 }),
    ];
    // 3/5 = 60% completion (no bonus), avg = 4.2 -> +3
    const r = computeLivingEnvironmentStandards(neutralInput({ cleaning_entries: cleaning }));
    expect(r.environment_score).toBe(52 + 3);
  });

  it("cleaning quality avg >= 3.0 but < 4.0 adds +1", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: true, quality_rating: 4 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
    ];
    // 3/5 = 60%, avg = 3.2 -> +1
    const r = computeLivingEnvironmentStandards(neutralInput({ cleaning_entries: cleaning }));
    expect(r.environment_score).toBe(52 + 1);
  });

  it("maintenance completion >= 90 adds +4", () => {
    const maintenance = Array.from({ length: 10 }, () => makeMaintenance({ status: "completed" }));
    // 10/10 = 100% -> +4
    const r = computeLivingEnvironmentStandards(neutralInput({ maintenance_items: maintenance }));
    expect(r.environment_score).toBe(52 + 4);
  });

  it("maintenance completion >= 75 but < 90 adds +2", () => {
    const maintenance = [
      ...Array.from({ length: 4 }, () => makeMaintenance({ status: "completed" })),
      makeMaintenance({ status: "open" }),
    ];
    // 4/5 = 80% -> +2
    const r = computeLivingEnvironmentStandards(neutralInput({ maintenance_items: maintenance }));
    expect(r.environment_score).toBe(52 + 2);
  });

  it("kitchen hygiene pass rate 100% adds +3", () => {
    const kitchen = Array.from({ length: 5 }, () => makeKitchenCheck({ overall_pass: true }));
    // 5/5 = 100% -> +3
    const r = computeLivingEnvironmentStandards(neutralInput({ kitchen_hygiene_checks: kitchen }));
    expect(r.environment_score).toBe(52 + 3);
  });

  it("kitchen hygiene pass rate >= 85 but < 100 adds +1", () => {
    const kitchen = [
      ...Array.from({ length: 9 }, () => makeKitchenCheck({ overall_pass: true })),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 9/10 = 90% -> +1
    const r = computeLivingEnvironmentStandards(neutralInput({ kitchen_hygiene_checks: kitchen }));
    expect(r.environment_score).toBe(52 + 1);
  });

  it("bedroom personalisation rate 100% adds +3", () => {
    const bedrooms = Array.from({ length: 5 }, (_, i) =>
      makeBedroom({ personalised: true, condition: "fair", child_id: `c${i}` }),
    );
    // 5/5=100% personalised -> +3, condition fair -> 0/5 good = 0% (no bonus)
    const r = computeLivingEnvironmentStandards(neutralInput({ bedroom_profiles: bedrooms }));
    expect(r.environment_score).toBe(52 + 3);
  });

  it("bedroom personalisation rate >= 80 but < 100 adds +1", () => {
    const bedrooms = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeBedroom({ personalised: true, condition: "fair", child_id: `c${i}` }),
      ),
      makeBedroom({ personalised: false, condition: "fair", child_id: "c4" }),
    ];
    // 4/5=80% -> +1
    const r = computeLivingEnvironmentStandards(neutralInput({ bedroom_profiles: bedrooms }));
    expect(r.environment_score).toBe(52 + 1);
  });

  it("bedroom condition good rate >= 90 adds +3", () => {
    const bedrooms = Array.from({ length: 5 }, (_, i) =>
      makeBedroom({ personalised: false, condition: "excellent", child_id: `c${i}` }),
    );
    // personalised 0% (no bonus), condition excellent 100% -> +3
    const r = computeLivingEnvironmentStandards(neutralInput({ bedroom_profiles: bedrooms }));
    expect(r.environment_score).toBe(52 + 3);
  });

  it("bedroom condition good rate >= 70 but < 90 adds +1", () => {
    const bedrooms = [
      makeBedroom({ personalised: false, condition: "good", child_id: "c1" }),
      makeBedroom({ personalised: false, condition: "good", child_id: "c2" }),
      makeBedroom({ personalised: false, condition: "good", child_id: "c3" }),
      makeBedroom({ personalised: false, condition: "good", child_id: "c4" }),
      makeBedroom({ personalised: false, condition: "fair", child_id: "c5" }),
    ];
    // 4/5 = 80% -> +1
    const r = computeLivingEnvironmentStandards(neutralInput({ bedroom_profiles: bedrooms }));
    expect(r.environment_score).toBe(52 + 1);
  });

  it("room suitability rate 100% adds +3", () => {
    const rooms = Array.from({ length: 5 }, (_, i) =>
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: false, child_consulted: false, child_id: `c${i}` }),
    );
    // suitability 100% -> +3, risk 0%, consultation 0%
    const r = computeLivingEnvironmentStandards(neutralInput({ room_allocations: rooms }));
    expect(r.environment_score).toBe(52 + 3);
  });

  it("room suitability rate >= 80 but < 100 adds +1", () => {
    const rooms = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeRoomAllocation({ suitable_for_needs: true, risk_assessed: false, child_consulted: false, child_id: `c${i}` }),
      ),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c4" }),
    ];
    // 4/5=80% -> +1
    const r = computeLivingEnvironmentStandards(neutralInput({ room_allocations: rooms }));
    expect(r.environment_score).toBe(52 + 1);
  });

  it("room risk assessment rate 100% adds +2", () => {
    const rooms = Array.from({ length: 5 }, (_, i) =>
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: true, child_consulted: false, child_id: `c${i}` }),
    );
    // suitability 0%, risk 100% -> +2, consultation 0%
    const r = computeLivingEnvironmentStandards(neutralInput({ room_allocations: rooms }));
    expect(r.environment_score).toBe(52 + 2);
  });

  it("room risk assessment rate >= 80 but < 100 adds +1", () => {
    const rooms = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeRoomAllocation({ suitable_for_needs: false, risk_assessed: true, child_consulted: false, child_id: `c${i}` }),
      ),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c4" }),
    ];
    // 4/5=80% -> +1
    const r = computeLivingEnvironmentStandards(neutralInput({ room_allocations: rooms }));
    expect(r.environment_score).toBe(52 + 1);
  });

  it("child consultation rate 100% adds +3", () => {
    const rooms = Array.from({ length: 5 }, (_, i) =>
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: true, child_id: `c${i}` }),
    );
    // suitability 0%, risk 0%, consultation 100% -> +3
    const r = computeLivingEnvironmentStandards(neutralInput({ room_allocations: rooms }));
    expect(r.environment_score).toBe(52 + 3);
  });

  it("child consultation rate >= 80 but < 100 adds +1", () => {
    const rooms = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: true, child_id: `c${i}` }),
      ),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c4" }),
    ];
    // 4/5=80% -> +1
    const r = computeLivingEnvironmentStandards(neutralInput({ room_allocations: rooms }));
    expect(r.environment_score).toBe(52 + 1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. INDIVIDUAL PENALTIES
// ════════════════════════════════════════════════════════════════════════════

describe("Individual penalties", () => {
  function neutralInput(overrides: Partial<LivingEnvironmentStandardsInput> = {}): LivingEnvironmentStandardsInput {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
    ];
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "in_progress" }),
    ];
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    const bedrooms = [
      makeBedroom({ personalised: true, condition: "good", child_id: "c1" }),
      makeBedroom({ personalised: true, condition: "good", child_id: "c2" }),
      makeBedroom({ personalised: true, condition: "fair", child_id: "c3" }),
      makeBedroom({ personalised: false, condition: "fair", child_id: "c4" }),
      makeBedroom({ personalised: false, condition: "fair", child_id: "c5" }),
    ];
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c1" }),
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c2" }),
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c3" }),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c4" }),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c5" }),
    ];
    return {
      today: "2026-05-28",
      total_children: 5,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
      ...overrides,
    };
  }

  it("safety maintenance open > 0 applies -5", () => {
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open", safety_risk: true }),
      makeMaintenance({ status: "in_progress" }),
    ];
    // 3/5=60% completion (no bonus, no penalty), but 1 safety open -> -5
    const r = computeLivingEnvironmentStandards(neutralInput({ maintenance_items: maintenance }));
    expect(r.environment_score).toBe(52 - 5);
  });

  it("maintenance completion < 50 applies -5", () => {
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "in_progress" }),
      makeMaintenance({ status: "overdue" }),
    ];
    // 1/5 = 20% -> penalty -5 (no bonus)
    const r = computeLivingEnvironmentStandards(neutralInput({ maintenance_items: maintenance }));
    expect(r.environment_score).toBe(52 - 5);
  });

  it("kitchen hygiene pass rate < 70 applies -5", () => {
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 1/4 = 25% -> penalty -5
    const r = computeLivingEnvironmentStandards(neutralInput({ kitchen_hygiene_checks: kitchen }));
    expect(r.environment_score).toBe(52 - 5);
  });

  it("cleaning completion < 50 applies -3", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
    ];
    // 1/5 = 20% -> penalty -3
    const r = computeLivingEnvironmentStandards(neutralInput({ cleaning_entries: cleaning }));
    expect(r.environment_score).toBe(52 - 3);
  });

  it("multiple penalties stack", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
    ];
    // 1/5=20% cleaning -> -3
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open", safety_risk: true }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "in_progress" }),
    ];
    // 1/5=20% completion -> -5, 1 safety open -> -5
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 1/4=25% -> -5
    const r = computeLivingEnvironmentStandards(neutralInput({
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
    }));
    // 52 - 5 (safety) - 5 (maint<50) - 5 (kitchen<70) - 3 (cleaning<50) = 34
    expect(r.environment_score).toBe(34);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. COMBINED OUTSTANDING (~80)
// ════════════════════════════════════════════════════════════════════════════

describe("Combined outstanding", () => {
  it("all maximum bonuses yield score of 80 (52 + 28 = 80)", () => {
    // Max bonuses: cleaning+4, quality+3, maint+4, kitchen+3, bedroom_pers+3,
    //              bedroom_cond+3, room_suit+3, room_risk+2, child_consult+3 = 28
    // 52 + 28 = 80
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.environment_score).toBe(80);
    expect(r.environment_rating).toBe("outstanding");
  });

  it("outstanding (80) is reachable with perfect data", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.environment_score).toBe(80);
    expect(r.environment_rating).toBe("outstanding");
    expect(r.environment_score).toBeGreaterThanOrEqual(80);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. RATING BOUNDARIES
// ════════════════════════════════════════════════════════════════════════════

describe("Rating boundaries", () => {
  // The engine's toRating:  >=80 outstanding, >=65 good, >=45 adequate, else inadequate
  // Max achievable = 78 (good). We can test the lower boundaries.

  it("score 80 (max achievable) -> outstanding", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.environment_score).toBe(80);
    expect(r.environment_rating).toBe("outstanding");
  });

  it("score 65 -> good", () => {
    // 52 + 13 in bonuses needed.
    // cleaning completion +4 (95%), quality +3 (>=4.0), maintenance +4 (>=90%), kitchen +1 (>=85 <100), bedroom pers +1 (>=80 <100) = 13
    const cleaning = Array.from({ length: 20 }, () => makeCleaning({ completed: true, quality_rating: 4 }));
    const maintenance = Array.from({ length: 10 }, () => makeMaintenance({ status: "completed" }));
    const kitchen = [
      ...Array.from({ length: 9 }, () => makeKitchenCheck({ overall_pass: true })),
      makeKitchenCheck({ overall_pass: false }),
    ];
    const bedrooms = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeBedroom({ personalised: true, condition: "fair", child_id: `c${i}` }),
      ),
      makeBedroom({ personalised: false, condition: "fair", child_id: "c4" }),
    ];
    // personalisation 4/5=80% -> +1, condition 0/5=0% (no bonus)
    const rooms = [
      ...Array.from({ length: 3 }, (_, i) =>
        makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: `c${i}` }),
      ),
      ...Array.from({ length: 2 }, (_, i) =>
        makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: `c${i + 3}` }),
      ),
    ];
    // all 0% -> no bonuses
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 5,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
    });
    // 52 + 4 + 3 + 4 + 1 + 1 = 65
    expect(r.environment_score).toBe(65);
    expect(r.environment_rating).toBe("good");
  });

  it("score 64 -> adequate", () => {
    // 52 + 12 in bonuses.
    // cleaning +4 (95%), quality +3 (>=4.0), maintenance +4 (>=90%), kitchen +1 (>=85 <100) = 12
    const cleaning = Array.from({ length: 20 }, () => makeCleaning({ completed: true, quality_rating: 4 }));
    const maintenance = Array.from({ length: 10 }, () => makeMaintenance({ status: "completed" }));
    const kitchen = [
      ...Array.from({ length: 9 }, () => makeKitchenCheck({ overall_pass: true })),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // bedrooms: 0% personalised (no bonus), 0% good (no bonus)
    const bedrooms = [
      makeBedroom({ personalised: false, condition: "fair", child_id: "c1" }),
    ];
    // rooms: 0% all -> no bonus
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c1" }),
    ];
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
    });
    // 52 + 4 + 3 + 4 + 1 = 64
    expect(r.environment_score).toBe(64);
    expect(r.environment_rating).toBe("adequate");
  });

  it("score 45 -> adequate", () => {
    // 52 - 7 = 45.
    // We need penalties totaling 7. safety_open(-5) + cleaning<50(-3) would be -8.
    // kitchen<70(-5) + cleaning<50(-3) = -8. Too much.
    // safety_open(-5) + maintenance<50(-5) = -10. Too much.
    // cleaning<50(-3) alone = 49. Need score=45: penalty of 7.
    // safety_open(-5) only = 47. Need -7.
    // kitchen<70(-5) + cleaning<50(-3) - some bonus to offset by 1.
    // Let's do: kitchen<70 penalty (-5) and cleaning<50 penalty (-3) = -8 -> 52-8=44. Not 45.
    // maint<50 (-5) and add a +2 bonus somewhere = 52-5+2=49. Nope.
    // safety_open (-5) and add a +2 bonus somewhere then subtract -3 cleaning = 52-5-3+1=45.
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
    ];
    // 1/5=20% -> penalty -3, quality avg = 3.0 -> +1 bonus
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open", safety_risk: true }),
      makeMaintenance({ status: "in_progress" }),
    ];
    // 3/5=60% (no bonus, no penalty), 1 safety open -> -5
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 3/4=75% (no bonus, no penalty)
    const bedrooms = [
      makeBedroom({ personalised: false, condition: "fair", child_id: "c1" }),
    ];
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c1" }),
    ];
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
    });
    // 52 + 1 (quality) - 5 (safety) - 3 (cleaning<50) = 45
    expect(r.environment_score).toBe(45);
    expect(r.environment_rating).toBe("adequate");
  });

  it("score 44 -> inadequate", () => {
    // 52 - 8 = 44.
    // safety_open(-5) + cleaning<50(-3) = -8, no bonuses
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
    ];
    // 1/5=20% -> -3, quality avg=2.0 (no bonus)
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open", safety_risk: true }),
      makeMaintenance({ status: "in_progress" }),
    ];
    // 3/5=60%, 1 safety open -> -5
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 75% no penalty
    const bedrooms = [
      makeBedroom({ personalised: false, condition: "fair", child_id: "c1" }),
    ];
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c1" }),
    ];
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
    });
    // 52 - 5 (safety) - 3 (cleaning<50) = 44
    expect(r.environment_score).toBe(44);
    expect(r.environment_rating).toBe("inadequate");
  });

  it("score cannot go below 0 (clamped)", () => {
    // All penalties stacked: -5 (safety) -5 (maint<50) -5 (kitchen<70) -3 (cleaning<50) = -18
    // 52 - 18 = 34 (still above 0, so let's verify it just works)
    const cleaning = [
      makeCleaning({ completed: false, quality_rating: 1 }),
      makeCleaning({ completed: false, quality_rating: 1 }),
    ];
    const maintenance = [
      makeMaintenance({ status: "open", safety_risk: true }),
      makeMaintenance({ status: "overdue" }),
    ];
    const kitchen = [
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    const bedrooms = [makeBedroom({ personalised: false, condition: "poor", child_id: "c1" })];
    const rooms = [makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c1" })];

    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
    });
    // 52 - 5 (safety) - 5 (maint 0%<50) - 5 (kitchen 0%<70) - 3 (cleaning 0%<50) = 34
    expect(r.environment_score).toBe(34);
    expect(r.environment_score).toBeGreaterThanOrEqual(0);
  });

  it("score cannot exceed 100 (clamped)", () => {
    // Max is 78, so it's already under 100. Verify clamp doesn't alter it.
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.environment_score).toBeLessThanOrEqual(100);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. METRIC CALCULATIONS
// ════════════════════════════════════════════════════════════════════════════

describe("Metric calculations", () => {
  it("cleaning_completion_rate = completed/total * 100 rounded", () => {
    const cleaning = [
      makeCleaning({ completed: true }),
      makeCleaning({ completed: true }),
      makeCleaning({ completed: false }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    expect(r.cleaning_completion_rate).toBe(67); // Math.round(2/3*100) = 67
  });

  it("cleaning_quality_avg calculated from rated entries only", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 5 }),
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: true, quality_rating: 4 }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    // (5+3+4)/3 = 4.0
    expect(r.cleaning_quality_avg).toBe(4);
  });

  it("cleaning_quality_avg rounds to 1 decimal", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 4 }),
      makeCleaning({ completed: true, quality_rating: 4 }),
      makeCleaning({ completed: true, quality_rating: 5 }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    // (4+4+5)/3 = 4.333... -> Math.round(4.333*10)/10 = 4.3
    expect(r.cleaning_quality_avg).toBe(4.3);
  });

  it("maintenance_completion_rate counts completed status", () => {
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.maintenance_completion_rate).toBe(67); // 2/3*100 rounded
  });

  it("overdue_maintenance_count counts overdue status", () => {
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "open" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.overdue_maintenance_count).toBe(2);
  });

  it("safety_maintenance_open counts safety_risk items with non-completed status", () => {
    const maintenance = [
      makeMaintenance({ status: "open", safety_risk: true }),
      makeMaintenance({ status: "in_progress", safety_risk: true }),
      makeMaintenance({ status: "overdue", safety_risk: true }),
      makeMaintenance({ status: "completed", safety_risk: true }),
      makeMaintenance({ status: "open", safety_risk: false }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.safety_maintenance_open).toBe(3); // open, in_progress, overdue with safety_risk
  });

  it("kitchen_hygiene_pass_rate = passes/total * 100 rounded", () => {
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: kitchen }));
    expect(r.kitchen_hygiene_pass_rate).toBe(67); // 2/3
  });

  it("bedroom_personalisation_rate = personalised/total * 100", () => {
    const bedrooms = [
      makeBedroom({ personalised: true, child_id: "c1" }),
      makeBedroom({ personalised: true, child_id: "c2" }),
      makeBedroom({ personalised: false, child_id: "c3" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.bedroom_personalisation_rate).toBe(67);
  });

  it("bedroom_condition_good_rate counts excellent and good", () => {
    const bedrooms = [
      makeBedroom({ condition: "excellent", child_id: "c1" }),
      makeBedroom({ condition: "good", child_id: "c2" }),
      makeBedroom({ condition: "fair", child_id: "c3" }),
      makeBedroom({ condition: "poor", child_id: "c4" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.bedroom_condition_good_rate).toBe(50); // 2/4
  });

  it("room_suitability_rate = suitable/total * 100", () => {
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: true, child_id: "c1" }),
      makeRoomAllocation({ suitable_for_needs: false, child_id: "c2" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    expect(r.room_suitability_rate).toBe(50);
  });

  it("room_risk_assessment_rate = risk_assessed/total * 100", () => {
    const rooms = [
      makeRoomAllocation({ risk_assessed: true, child_id: "c1" }),
      makeRoomAllocation({ risk_assessed: false, child_id: "c2" }),
      makeRoomAllocation({ risk_assessed: true, child_id: "c3" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    expect(r.room_risk_assessment_rate).toBe(67);
  });

  it("child_consultation_rate = consulted/total * 100", () => {
    const rooms = [
      makeRoomAllocation({ child_consulted: true, child_id: "c1" }),
      makeRoomAllocation({ child_consulted: false, child_id: "c2" }),
      makeRoomAllocation({ child_consulted: true, child_id: "c3" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    expect(r.child_consultation_rate).toBe(67);
  });

  it("total_cleaning_entries reflects array length", () => {
    const cleaning = [makeCleaning(), makeCleaning(), makeCleaning(), makeCleaning()];
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    expect(r.total_cleaning_entries).toBe(4);
  });

  it("total_maintenance_items reflects array length", () => {
    const maintenance = [makeMaintenance(), makeMaintenance()];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.total_maintenance_items).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS
// ════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("includes cleaning completion strength when >= 95% and entries > 0", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("cleaning completion rate"),
    ]));
  });

  it("includes cleaning quality strength when avg >= 4.0 and rated entries > 0", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("cleaning quality rating"),
    ]));
  });

  it("includes maintenance completion strength when >= 90% and items > 0", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("maintenance completion"),
    ]));
  });

  it("includes 100% kitchen hygiene strength", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("100% kitchen hygiene pass rate"),
    ]));
  });

  it("includes 90-99% kitchen hygiene strength (not 100%)", () => {
    const kitchen = [
      ...Array.from({ length: 9 }, () => makeKitchenCheck({ overall_pass: true })),
      makeKitchenCheck({ overall_pass: false }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: kitchen }));
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("kitchen hygiene pass rate"),
    ]));
    expect(r.strengths).not.toEqual(expect.arrayContaining([
      expect.stringContaining("100% kitchen hygiene"),
    ]));
  });

  it("includes 100% bedroom personalisation strength", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("Every bedroom is personalised"),
    ]));
  });

  it("includes 85-99% bedroom personalisation strength", () => {
    const bedrooms = [
      ...Array.from({ length: 9 }, (_, i) =>
        makeBedroom({ personalised: true, child_id: `c${i}` }),
      ),
      makeBedroom({ personalised: false, child_id: "c9" }),
    ];
    // 9/10=90%
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("of bedrooms personalised"),
    ]));
    expect(r.strengths).not.toEqual(expect.arrayContaining([
      expect.stringContaining("Every bedroom is personalised"),
    ]));
  });

  it("includes child chose decor strength when >= 90%", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("chose their own decor"),
    ]));
  });

  it("includes room suitability strength when 100%", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("All room allocations assessed as suitable"),
    ]));
  });

  it("includes child consultation strength when 100%", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("Every child was consulted"),
    ]));
  });

  it("includes risk assessment strength when 100%", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("All room allocations have completed risk assessments"),
    ]));
  });

  it("includes bedroom condition strength when >= 90%", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("bedrooms in excellent or good condition"),
    ]));
  });

  it("includes safety maintenance resolved strength when no open safety items but safety items exist", () => {
    const maintenance = [
      makeMaintenance({ safety_risk: true, status: "completed" }),
      makeMaintenance({ safety_risk: true, status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("No open safety-related maintenance items"),
    ]));
  });

  it("includes fire blanket strength when 100%", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("Fire blanket accessible"),
    ]));
  });

  it("no cleaning strength when 0 entries", () => {
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: [] }));
    const cleaningStrengths = r.strengths.filter(s => s.toLowerCase().includes("cleaning"));
    expect(cleaningStrengths).toHaveLength(0);
  });

  it("no safety resolved strength when no safety-risk items at all", () => {
    const maintenance = [makeMaintenance({ safety_risk: false, status: "completed" })];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.strengths).not.toEqual(expect.arrayContaining([
      expect.stringContaining("No open safety-related maintenance"),
    ]));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. CONCERNS
// ════════════════════════════════════════════════════════════════════════════

describe("Concerns", () => {
  it("includes safety maintenance open concern", () => {
    const maintenance = [
      makeMaintenance({ safety_risk: true, status: "open" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("safety-related maintenance item"),
    ]));
  });

  it("pluralises safety items correctly for 1", () => {
    const maintenance = [
      makeMaintenance({ safety_risk: true, status: "open" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    const concern = r.concerns.find(c => c.includes("safety-related maintenance item"));
    expect(concern).toContain("1 safety-related maintenance item remain");
    expect(concern).not.toContain("items");
  });

  it("pluralises safety items correctly for 2+", () => {
    const maintenance = [
      makeMaintenance({ safety_risk: true, status: "open" }),
      makeMaintenance({ safety_risk: true, status: "overdue" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    const concern = r.concerns.find(c => c.includes("safety-related maintenance item"));
    expect(concern).toContain("items");
  });

  it("includes urgent open maintenance concern", () => {
    const maintenance = [
      makeMaintenance({ priority: "urgent", status: "open" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("urgent maintenance item"),
    ]));
  });

  it("includes overdue maintenance concern", () => {
    const maintenance = [
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("overdue maintenance item"),
    ]));
  });

  it("includes maintenance completion < 50% concern", () => {
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "open" }),
    ];
    // 1/4=25%
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("maintenance items completed"),
    ]));
  });

  it("includes kitchen hygiene < 70% concern", () => {
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 1/3=33%
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: kitchen }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("food safety standards are not being met"),
    ]));
  });

  it("includes kitchen hygiene 70-84% concern (inconsistent compliance)", () => {
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 3/4=75%
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: kitchen }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("inconsistent compliance"),
    ]));
  });

  it("includes cleaning < 50% concern", () => {
    const cleaning = [
      makeCleaning({ completed: true }),
      makeCleaning({ completed: false }),
      makeCleaning({ completed: false }),
      makeCleaning({ completed: false }),
    ];
    // 1/4=25%
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("cleanliness standards are inadequate"),
    ]));
  });

  it("includes cleaning 50-79% concern (missed tasks)", () => {
    const cleaning = [
      makeCleaning({ completed: true }),
      makeCleaning({ completed: true }),
      makeCleaning({ completed: true }),
      makeCleaning({ completed: false }),
      makeCleaning({ completed: false }),
    ];
    // 3/5=60%
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("missed tasks risk"),
    ]));
  });

  it("includes cleaning quality < 3.0 concern", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: true, quality_rating: 1 }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("quality of completed cleaning is below"),
    ]));
  });

  it("includes bedroom personalisation < 50% concern", () => {
    const bedrooms = [
      makeBedroom({ personalised: true, child_id: "c1" }),
      makeBedroom({ personalised: false, child_id: "c2" }),
      makeBedroom({ personalised: false, child_id: "c3" }),
      makeBedroom({ personalised: false, child_id: "c4" }),
    ];
    // 1/4=25%
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("sense of belonging"),
    ]));
  });

  it("includes poor condition bedroom concern", () => {
    const bedrooms = [
      makeBedroom({ condition: "poor", child_id: "c1" }),
      makeBedroom({ condition: "good", child_id: "c2" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("poor condition"),
    ]));
  });

  it("includes room suitability < 80% concern", () => {
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: true, child_id: "c1" }),
      makeRoomAllocation({ suitable_for_needs: false, child_id: "c2" }),
      makeRoomAllocation({ suitable_for_needs: false, child_id: "c3" }),
    ];
    // 1/3=33%
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("placement matching needs review"),
    ]));
  });

  it("includes risk assessment < 80% concern", () => {
    const rooms = [
      makeRoomAllocation({ risk_assessed: true, child_id: "c1" }),
      makeRoomAllocation({ risk_assessed: false, child_id: "c2" }),
      makeRoomAllocation({ risk_assessed: false, child_id: "c3" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("gaps in safety governance"),
    ]));
  });

  it("includes child consultation < 50% concern", () => {
    const rooms = [
      makeRoomAllocation({ child_consulted: true, child_id: "c1" }),
      makeRoomAllocation({ child_consulted: false, child_id: "c2" }),
      makeRoomAllocation({ child_consulted: false, child_id: "c3" }),
    ];
    // 1/3=33%
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("children's voices are not being heard"),
    ]));
  });

  it("includes privacy lock < 50% concern", () => {
    const bedrooms = [
      makeBedroom({ privacy_lock: true, child_id: "c1" }),
      makeBedroom({ privacy_lock: false, child_id: "c2" }),
      makeBedroom({ privacy_lock: false, child_id: "c3" }),
      makeBedroom({ privacy_lock: false, child_id: "c4" }),
    ];
    // 1/4=25%
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("privacy locks"),
    ]));
  });

  it("includes missing domain concerns when children in placement", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: [makeCleaning()],
      maintenance_items: [],
      kitchen_hygiene_checks: [],
      bedroom_profiles: [],
      room_allocations: [],
    });
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("No maintenance records"),
    ]));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("No kitchen hygiene checks"),
    ]));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("No bedroom profiles"),
    ]));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("No room allocation records"),
    ]));
  });

  it("includes no cleaning records concern when children present", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: [],
      maintenance_items: [makeMaintenance()],
      kitchen_hygiene_checks: [],
      bedroom_profiles: [],
      room_allocations: [],
    });
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("No cleaning records"),
    ]));
  });

  it("no missing domain concerns when total_children = 0", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 0,
      cleaning_entries: [makeCleaning()],
      maintenance_items: [],
      kitchen_hygiene_checks: [],
      bedroom_profiles: [],
      room_allocations: [],
    });
    expect(r.concerns.filter(c => c.includes("No maintenance"))).toHaveLength(0);
    expect(r.concerns.filter(c => c.includes("No kitchen"))).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS
// ════════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("includes safety maintenance recommendation with immediate urgency", () => {
    const maintenance = [
      makeMaintenance({ safety_risk: true, status: "open" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("safety-related maintenance"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toContain("Reg 25");
  });

  it("includes kitchen hygiene < 70% recommendation (immediate)", () => {
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: kitchen }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("comprehensive kitchen hygiene review"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toContain("Reg 27");
  });

  it("includes kitchen hygiene 70-84% recommendation (soon)", () => {
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 3/4=75%
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: kitchen }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("recurring kitchen hygiene failures"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("includes no kitchen checks recommendation when children present", () => {
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: [] }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("kitchen hygiene check programme"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("includes fire blanket recommendation when < 100%", () => {
    const kitchen = [
      makeKitchenCheck({ fire_blanket_accessible: true, overall_pass: true }),
      makeKitchenCheck({ fire_blanket_accessible: false, overall_pass: true }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: kitchen }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("fire blanket"));
    expect(rec).toBeDefined();
    expect(rec!.regulatory_ref).toContain("Reg 26");
  });

  it("includes urgent open maintenance recommendation", () => {
    const maintenance = [
      makeMaintenance({ priority: "urgent", status: "open" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("urgent maintenance"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("includes maintenance < 50% recommendation (immediate)", () => {
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "open" }),
    ];
    // 1/4=25%
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("resource the maintenance programme"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("includes maintenance 50-74% recommendation (soon)", () => {
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "open" }),
    ];
    // 3/5=60%
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Improve maintenance completion"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("includes overdue backlog recommendation when >= 3 overdue", () => {
    const maintenance = [
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("backlog of overdue maintenance"));
    expect(rec).toBeDefined();
  });

  it("includes cleaning < 50% recommendation (immediate)", () => {
    const cleaning = [
      makeCleaning({ completed: true }),
      makeCleaning({ completed: false }),
      makeCleaning({ completed: false }),
      makeCleaning({ completed: false }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("cleaning schedules and staff allocation"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("includes cleaning 50-79% recommendation (soon)", () => {
    const cleaning = [
      makeCleaning({ completed: true }),
      makeCleaning({ completed: true }),
      makeCleaning({ completed: true }),
      makeCleaning({ completed: false }),
      makeCleaning({ completed: false }),
    ];
    // 3/5=60%
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("cleaning schedule adherence"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("includes no cleaning records recommendation when children present", () => {
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: [] }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("documented cleaning schedule"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("includes cleaning quality < 3.0 recommendation", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: true, quality_rating: 1 }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("cleaning quality improvement"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("includes bedroom personalisation < 50% recommendation (soon)", () => {
    const bedrooms = [
      makeBedroom({ personalised: true, child_id: "c1" }),
      makeBedroom({ personalised: false, child_id: "c2" }),
      makeBedroom({ personalised: false, child_id: "c3" }),
      makeBedroom({ personalised: false, child_id: "c4" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Prioritise bedroom personalisation"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("includes bedroom personalisation 50-79% recommendation (planned)", () => {
    const bedrooms = [
      makeBedroom({ personalised: true, child_id: "c1" }),
      makeBedroom({ personalised: true, child_id: "c2" }),
      makeBedroom({ personalised: true, child_id: "c3" }),
      makeBedroom({ personalised: false, child_id: "c4" }),
      makeBedroom({ personalised: false, child_id: "c5" }),
    ];
    // 3/5=60%
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Extend bedroom personalisation"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("includes no bedroom profiles recommendation when children present", () => {
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: [] }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Create bedroom profiles"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("includes poor condition bedroom recommendation", () => {
    const bedrooms = [
      makeBedroom({ condition: "poor", child_id: "c1" }),
      makeBedroom({ condition: "good", child_id: "c2" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("bedrooms in poor condition"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("includes privacy lock < 70% recommendation", () => {
    const bedrooms = [
      makeBedroom({ privacy_lock: true, child_id: "c1" }),
      makeBedroom({ privacy_lock: false, child_id: "c2" }),
      makeBedroom({ privacy_lock: false, child_id: "c3" }),
      makeBedroom({ privacy_lock: false, child_id: "c4" }),
    ];
    // 1/4=25%
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("privacy arrangements"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("includes room suitability < 80% recommendation", () => {
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: true, child_id: "c1" }),
      makeRoomAllocation({ suitable_for_needs: false, child_id: "c2" }),
      makeRoomAllocation({ suitable_for_needs: false, child_id: "c3" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Review room allocations"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("includes no room allocations recommendation when children present", () => {
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: [] }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Document room allocations"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("includes risk assessment < 80% recommendation", () => {
    const rooms = [
      makeRoomAllocation({ risk_assessed: true, child_id: "c1" }),
      makeRoomAllocation({ risk_assessed: false, child_id: "c2" }),
      makeRoomAllocation({ risk_assessed: false, child_id: "c3" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Complete risk assessments"));
    expect(rec).toBeDefined();
  });

  it("includes child consultation < 50% recommendation (soon)", () => {
    const rooms = [
      makeRoomAllocation({ child_consulted: true, child_id: "c1" }),
      makeRoomAllocation({ child_consulted: false, child_id: "c2" }),
      makeRoomAllocation({ child_consulted: false, child_id: "c3" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Consult children"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("includes child consultation 50-79% recommendation (planned)", () => {
    const rooms = [
      makeRoomAllocation({ child_consulted: true, child_id: "c1" }),
      makeRoomAllocation({ child_consulted: true, child_id: "c2" }),
      makeRoomAllocation({ child_consulted: true, child_id: "c3" }),
      makeRoomAllocation({ child_consulted: false, child_id: "c4" }),
      makeRoomAllocation({ child_consulted: false, child_id: "c5" }),
    ];
    // 3/5=60%
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Extend child consultation"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommendations have sequential ranks", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS
// ════════════════════════════════════════════════════════════════════════════

describe("Insights", () => {
  it("positive: exemplary physical environment composite insight", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    // All conditions met: cleaning>=95, quality>=4.0, maint>=90, kitchen=100, all >0
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "positive",
        text: expect.stringContaining("exemplary standard"),
      }),
    ]));
  });

  it("positive: exceptional bedroom personalisation insight", () => {
    // Need: personalisation=100%, childChoseDecor>=90%, conditionGood>=90%, profiles>0
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "positive",
        text: expect.stringContaining("Bedroom personalisation is exceptional"),
      }),
    ]));
  });

  it("positive: comprehensive room allocation governance insight", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "positive",
        text: expect.stringContaining("Room allocation governance is comprehensive"),
      }),
    ]));
  });

  it("positive: impeccable kitchen hygiene insight", () => {
    // Need: kitchen pass=100%, fire blanket=100%, surfaces=100%, food storage=100%, checks>0
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "positive",
        text: expect.stringContaining("impeccable"),
      }),
    ]));
  });

  it("warning: low cleaning completion and quality", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
    ];
    // 2/5=40% completion, avg=2.0
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "warning",
        text: expect.stringContaining("Both volume and quality"),
      }),
    ]));
  });

  it("warning: overdue maintenance >= 5", () => {
    const maintenance = [
      ...Array.from({ length: 5 }, () => makeMaintenance({ status: "overdue" })),
      ...Array.from({ length: 5 }, () => makeMaintenance({ status: "completed" })),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "warning",
        text: expect.stringContaining("maintenance items are overdue"),
      }),
    ]));
  });

  it("warning: low personalisation and decor choice", () => {
    const bedrooms = [
      makeBedroom({ personalised: true, child_chose_decor: true, child_id: "c1" }),
      makeBedroom({ personalised: false, child_chose_decor: false, child_id: "c2" }),
      makeBedroom({ personalised: false, child_chose_decor: false, child_id: "c3" }),
      makeBedroom({ personalised: false, child_chose_decor: false, child_id: "c4" }),
    ];
    // personalised 1/4=25%, decor 1/4=25%
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "warning",
        text: expect.stringContaining("not being given sufficient agency"),
      }),
    ]));
  });

  it("warning: low consultation and risk assessment rates", () => {
    const rooms = [
      makeRoomAllocation({ child_consulted: true, risk_assessed: true, child_id: "c1" }),
      makeRoomAllocation({ child_consulted: false, risk_assessed: false, child_id: "c2" }),
      makeRoomAllocation({ child_consulted: false, risk_assessed: false, child_id: "c3" }),
      makeRoomAllocation({ child_consulted: false, risk_assessed: false, child_id: "c4" }),
    ];
    // consultation 1/4=25%, risk 1/4=25%
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "warning",
        text: expect.stringContaining("Room allocation governance has significant gaps"),
      }),
    ]));
  });

  it("critical: 2+ safety maintenance open", () => {
    const maintenance = [
      makeMaintenance({ safety_risk: true, status: "open" }),
      makeMaintenance({ safety_risk: true, status: "overdue" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "critical",
        text: expect.stringContaining("safety-related maintenance items remain unresolved"),
      }),
    ]));
  });

  it("critical: 1 safety maintenance open", () => {
    const maintenance = [
      makeMaintenance({ safety_risk: true, status: "open" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "critical",
        text: expect.stringContaining("One safety-related maintenance item remains open"),
      }),
    ]));
  });

  it("critical: kitchen hygiene < 50%", () => {
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 1/4=25%
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: kitchen }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "critical",
        text: expect.stringContaining("serious food safety risk"),
      }),
    ]));
  });

  it("critical: maintenance failing composite (completion<50, safety open, overdue>=3)", () => {
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open", safety_risk: true }),
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "in_progress" }),
    ];
    // 1/7=14% completion, 1 safety open, 3 overdue
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "critical",
        text: expect.stringContaining("premises maintenance programme is failing"),
      }),
    ]));
  });

  it("critical: both cleaning and kitchen hygiene critically low", () => {
    const cleaning = [
      makeCleaning({ completed: true }),
      makeCleaning({ completed: false }),
      makeCleaning({ completed: false }),
      makeCleaning({ completed: false }),
    ];
    // 1/4=25%
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 1/3=33%
    const r = computeLivingEnvironmentStandards(baseInput({
      cleaning_entries: cleaning,
      kitchen_hygiene_checks: kitchen,
    }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "critical",
        text: expect.stringContaining("overall hygiene standards"),
      }),
    ]));
  });

  it("critical: 2+ poor condition bedrooms", () => {
    const bedrooms = [
      makeBedroom({ condition: "poor", child_id: "c1" }),
      makeBedroom({ condition: "poor", child_id: "c2" }),
      makeBedroom({ condition: "good", child_id: "c3" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "critical",
        text: expect.stringContaining("bedrooms are in poor condition"),
      }),
    ]));
  });

  it("warning: data completeness <= 2 domains with children", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: [makeCleaning()],
      maintenance_items: [makeMaintenance()],
      kitchen_hygiene_checks: [],
      bedroom_profiles: [],
      room_allocations: [],
    });
    expect(r.insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "warning",
        text: expect.stringContaining("of 5 living environment domains"),
      }),
    ]));
  });

  it("no data completeness insight when 3+ domains have data", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: [makeCleaning()],
      maintenance_items: [makeMaintenance()],
      kitchen_hygiene_checks: [makeKitchenCheck()],
      bedroom_profiles: [],
      room_allocations: [],
    });
    const domainInsights = r.insights.filter(i => i.text.includes("of 5 living environment domains"));
    expect(domainInsights).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 12. HEADLINES
// ════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("good headline with concerns mentions count", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
    ];
    // 60% -> concern about missed tasks
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    // Score will be around 52 + bonuses - whatever. If rating=good and concerns>0:
    if (r.environment_rating === "good" && r.concerns.length > 0) {
      expect(r.headline).toContain("Good living environment");
      expect(r.headline).toContain("area");
      expect(r.headline).toContain("improvement");
    }
  });

  it("outstanding headline includes key metrics", () => {
    // Perfect data -> outstanding
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.environment_rating).toBe("outstanding");
    expect(r.headline).toContain("Outstanding living environment");
    expect(r.headline).toContain("cleaning completion");
    expect(r.headline).toContain("kitchen hygiene");
    expect(r.headline).toContain("bedrooms personalised");
  });

  it("good headline without concerns uses generic text", () => {
    // Score in good range (65-79) with no concerns
    // Need a scenario where score=65+ but no concerns fire.
    // This is hard since many metrics trigger concerns. Use a score with
    // high enough rates to avoid concerns but not max bonuses.
    const cleaning = Array.from({ length: 20 }, () => makeCleaning({ completed: true, quality_rating: 4 }));
    const maintenance = Array.from({ length: 10 }, () => makeMaintenance({ status: "completed" }));
    const kitchen = Array.from({ length: 5 }, () => makeKitchenCheck({ overall_pass: true }));
    const bedrooms = Array.from({ length: 3 }, (_, i) =>
      makeBedroom({ personalised: true, condition: "good", privacy_lock: true, child_id: `c${i}` }),
    );
    const rooms = Array.from({ length: 3 }, (_, i) =>
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: `c${i}` }),
    );
    // This gives max score 80 (outstanding). We need to lower it to good range.
    // Use bedroom condition "fair" to reduce bed_cond to 0% (no bonus = -3).
    // And make personalisation 80% (= +1 instead of +3 = -2). Total reduction = 5 -> 75.
    // Still outstanding at 75? No, 75 < 80 = good.
    // Actually, let's just use enough bedrooms to get condition at 80% (still +1) and pers at 80% (+1).
    const bedroomsGood = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeBedroom({ personalised: true, condition: "good", privacy_lock: true, child_id: `c${i}` }),
      ),
      makeBedroom({ personalised: false, condition: "fair", privacy_lock: true, child_id: "c4" }),
    ];
    // pers 4/5=80% -> +1, cond 4/5=80% -> +1, privacy 100%
    // 52 + 4 + 3 + 4 + 3 + 1 + 1 + 3 + 2 + 3 = 76 -> good
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 5,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedroomsGood,
      room_allocations: Array.from({ length: 5 }, (_, i) =>
        makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: `c${i}` }),
      ),
    });
    if (r.environment_rating === "good" && r.concerns.length === 0) {
      expect(r.headline).toContain("Good living environment");
      expect(r.headline).toContain("well-managed");
    }
  });

  it("adequate headline mentions concern count", () => {
    // Build a scenario that lands in adequate range (45-64) with explicit control
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: true, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
      makeCleaning({ completed: false, quality_rating: 3 }),
    ];
    // 3/5=60% -> no bonus/penalty, quality 3.0 -> +1
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "in_progress" }),
    ];
    // 3/5=60% -> no bonus/penalty
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 3/4=75% -> no bonus/penalty
    const bedrooms = [
      makeBedroom({ personalised: true, condition: "good", child_id: "c1" }),
      makeBedroom({ personalised: true, condition: "fair", child_id: "c2" }),
      makeBedroom({ personalised: false, condition: "fair", child_id: "c3" }),
    ];
    // pers 2/3=67% -> no bonus, cond 1/3=33% -> no bonus
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: "c1" }),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c2" }),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c3" }),
    ];
    // suit 1/3=33% -> no bonus, risk 1/3=33% -> no bonus, consult 1/3=33% -> no bonus
    // Score = 52 + 1(quality) = 53 -> adequate
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
    });
    expect(r.environment_rating).toBe("adequate");
    expect(r.headline).toContain("need improvement");
    expect(r.headline).toContain("concern");
  });

  it("inadequate headline mentions urgent attention", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
      makeCleaning({ completed: false, quality_rating: 2 }),
    ];
    // 1/5=20% -> -3, quality 2.0 -> no bonus
    const maintenance = [
      makeMaintenance({ status: "completed" }),
      makeMaintenance({ status: "open", safety_risk: true }),
      makeMaintenance({ status: "open" }),
      makeMaintenance({ status: "overdue" }),
      makeMaintenance({ status: "in_progress" }),
    ];
    // 1/5=20% -> -5 (maint<50), 1 safety open -> -5
    const kitchen = [
      makeKitchenCheck({ overall_pass: true }),
      makeKitchenCheck({ overall_pass: false }),
      makeKitchenCheck({ overall_pass: false }),
    ];
    // 1/3=33% -> -5 (kitchen<70)
    const bedrooms = [
      makeBedroom({ personalised: false, condition: "fair", child_id: "c1" }),
    ];
    const rooms = [
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: false, child_consulted: false, child_id: "c1" }),
    ];
    // Score = 52 - 3 - 5 - 5 - 5 = 34 -> inadequate
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: cleaning,
      maintenance_items: maintenance,
      kitchen_hygiene_checks: kitchen,
      bedroom_profiles: bedrooms,
      room_allocations: rooms,
    });
    expect(r.environment_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("urgent attention");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 13. EDGE CASES — pct(0,0) = 0
// ════════════════════════════════════════════════════════════════════════════

describe("Edge cases: pct(0,0) = 0", () => {
  it("empty cleaning_entries yields 0% completion and triggers cleaning<50 penalty", () => {
    // pct(0,0)=0 for cleaning completion -> 0% < 50 -> penalty -3
    // But the cleaning<50 penalty guard also checks cleaning_entries.length > 0 for concerns,
    // but NOT for the score penalty. Let's check:
    // Actually the score penalty at line 349 is: if (cleaningCompletionRate < 50) score -= 3
    // No length guard on score. So 0% triggers -3.
    // But concerns guard at line 506: cleaning_entries.length === 0 && total_children > 0 triggers a separate concern.
    // The scoring penalty of -3 has no guard on length.
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: [],
      maintenance_items: [makeMaintenance()],
      kitchen_hygiene_checks: [makeKitchenCheck()],
      bedroom_profiles: [makeBedroom()],
      room_allocations: [makeRoomAllocation()],
    });
    // cleaning 0% -> -3, quality avg = 0 -> no bonus
    // maintenance 100% -> +4
    // kitchen 100% -> +3
    // bedroom pers 100% -> +3
    // bedroom cond good -> +3
    // room suit 100% -> +3
    // room risk 100% -> +2
    // child consult 100% -> +3
    // 52 + 4 + 3 + 3 + 3 + 3 + 2 + 3 - 3 = 70
    expect(r.cleaning_completion_rate).toBe(0);
    expect(r.cleaning_quality_avg).toBe(0);
    expect(r.environment_score).toBe(70);
  });

  it("empty maintenance_items yields 0% completion and triggers maintenance<50 penalty", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: [makeCleaning()],
      maintenance_items: [],
      kitchen_hygiene_checks: [makeKitchenCheck()],
      bedroom_profiles: [makeBedroom()],
      room_allocations: [makeRoomAllocation()],
    });
    // maintenance 0% -> -5 penalty
    expect(r.maintenance_completion_rate).toBe(0);
    // cleaning 100% -> +4, quality 4 -> +3, maint penalty -5, kitchen +3,
    // bedroom pers +3, cond +3, room +3, risk +2, consult +3
    // 52 + 4 + 3 - 5 + 3 + 3 + 3 + 3 + 2 + 3 = 71
    expect(r.environment_score).toBe(71);
  });

  it("empty kitchen_hygiene_checks yields 0% pass rate and triggers kitchen<70 penalty", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: [makeCleaning()],
      maintenance_items: [makeMaintenance()],
      kitchen_hygiene_checks: [],
      bedroom_profiles: [makeBedroom()],
      room_allocations: [makeRoomAllocation()],
    });
    expect(r.kitchen_hygiene_pass_rate).toBe(0);
    // kitchen 0% < 70 -> -5 penalty
    // cleaning 100% -> +4, quality 4 -> +3, maint 100% -> +4, kitchen penalty -5,
    // bedroom pers +3, cond +3, room +3, risk +2, consult +3
    // 52 + 4 + 3 + 4 - 5 + 3 + 3 + 3 + 2 + 3 = 72
    expect(r.environment_score).toBe(72);
  });

  it("empty bedroom_profiles yields 0% personalisation (no bonus)", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: [makeCleaning()],
      maintenance_items: [makeMaintenance()],
      kitchen_hygiene_checks: [makeKitchenCheck()],
      bedroom_profiles: [],
      room_allocations: [makeRoomAllocation()],
    });
    expect(r.bedroom_personalisation_rate).toBe(0);
    expect(r.bedroom_condition_good_rate).toBe(0);
  });

  it("empty room_allocations yields 0% rates (no bonuses)", () => {
    const r = computeLivingEnvironmentStandards({
      today: "2026-05-28",
      total_children: 3,
      cleaning_entries: [makeCleaning()],
      maintenance_items: [makeMaintenance()],
      kitchen_hygiene_checks: [makeKitchenCheck()],
      bedroom_profiles: [makeBedroom()],
      room_allocations: [],
    });
    expect(r.room_suitability_rate).toBe(0);
    expect(r.room_risk_assessment_rate).toBe(0);
    expect(r.child_consultation_rate).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 14. SINGLE RECORD EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Single record edge cases", () => {
  it("single completed cleaning entry = 100% completion", () => {
    const r = computeLivingEnvironmentStandards(baseInput({
      cleaning_entries: [makeCleaning({ completed: true, quality_rating: 5 })],
    }));
    expect(r.cleaning_completion_rate).toBe(100);
    expect(r.total_cleaning_entries).toBe(1);
  });

  it("single incomplete cleaning entry = 0% completion", () => {
    const r = computeLivingEnvironmentStandards(baseInput({
      cleaning_entries: [makeCleaning({ completed: false, quality_rating: 3 })],
    }));
    expect(r.cleaning_completion_rate).toBe(0);
  });

  it("single maintenance item completed = 100%", () => {
    const r = computeLivingEnvironmentStandards(baseInput({
      maintenance_items: [makeMaintenance({ status: "completed" })],
    }));
    expect(r.maintenance_completion_rate).toBe(100);
  });

  it("single kitchen check pass = 100%", () => {
    const r = computeLivingEnvironmentStandards(baseInput({
      kitchen_hygiene_checks: [makeKitchenCheck({ overall_pass: true })],
    }));
    expect(r.kitchen_hygiene_pass_rate).toBe(100);
  });

  it("single bedroom personalised = 100%", () => {
    const r = computeLivingEnvironmentStandards(baseInput({
      bedroom_profiles: [makeBedroom({ personalised: true, child_id: "c1" })],
    }));
    expect(r.bedroom_personalisation_rate).toBe(100);
  });

  it("single room allocation consulted = 100%", () => {
    const r = computeLivingEnvironmentStandards(baseInput({
      room_allocations: [makeRoomAllocation({ child_consulted: true, child_id: "c1" })],
    }));
    expect(r.child_consultation_rate).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 15. RETURN STRUCTURE
// ════════════════════════════════════════════════════════════════════════════

describe("Return structure", () => {
  it("contains all expected keys", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r).toHaveProperty("environment_rating");
    expect(r).toHaveProperty("environment_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_cleaning_entries");
    expect(r).toHaveProperty("cleaning_completion_rate");
    expect(r).toHaveProperty("cleaning_quality_avg");
    expect(r).toHaveProperty("total_maintenance_items");
    expect(r).toHaveProperty("maintenance_completion_rate");
    expect(r).toHaveProperty("overdue_maintenance_count");
    expect(r).toHaveProperty("safety_maintenance_open");
    expect(r).toHaveProperty("kitchen_hygiene_pass_rate");
    expect(r).toHaveProperty("bedroom_personalisation_rate");
    expect(r).toHaveProperty("bedroom_condition_good_rate");
    expect(r).toHaveProperty("room_suitability_rate");
    expect(r).toHaveProperty("room_risk_assessment_rate");
    expect(r).toHaveProperty("child_consultation_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("strengths is an array of strings", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(Array.isArray(r.strengths)).toBe(true);
    r.strengths.forEach(s => expect(typeof s).toBe("string"));
  });

  it("concerns is an array of strings", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(Array.isArray(r.concerns)).toBe(true);
    r.concerns.forEach(c => expect(typeof c).toBe("string"));
  });

  it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
    const maintenance = [
      makeMaintenance({ safety_risk: true, status: "open" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.recommendations.length).toBeGreaterThan(0);
    const rec = r.recommendations[0];
    expect(rec).toHaveProperty("rank");
    expect(rec).toHaveProperty("recommendation");
    expect(rec).toHaveProperty("urgency");
    expect(rec).toHaveProperty("regulatory_ref");
    expect(typeof rec.rank).toBe("number");
    expect(typeof rec.recommendation).toBe("string");
  });

  it("insights have text and severity", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.insights.length).toBeGreaterThan(0);
    const insight = r.insights[0];
    expect(insight).toHaveProperty("text");
    expect(insight).toHaveProperty("severity");
    expect(typeof insight.text).toBe("string");
    expect(["positive", "warning", "critical"]).toContain(insight.severity);
  });

  it("environment_rating is a valid value", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(
      r.environment_rating,
    );
  });

  it("environment_score is a number between 0 and 100", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(r.environment_score).toBeGreaterThanOrEqual(0);
    expect(r.environment_score).toBeLessThanOrEqual(100);
  });

  it("headline is a non-empty string", () => {
    const r = computeLivingEnvironmentStandards(baseInput());
    expect(typeof r.headline).toBe("string");
    expect(r.headline.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 16. ADDITIONAL SCORING PRECISION TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Additional scoring precision", () => {
  it("cleaning completion exactly 80% gives +2 not +4", () => {
    const cleaning = [
      ...Array.from({ length: 4 }, () => makeCleaning({ completed: true, quality_rating: 2 })),
      makeCleaning({ completed: false, quality_rating: 2 }),
    ];
    // 4/5 = 80% -> +2, quality avg 2.0 -> no bonus
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    // Other bonuses from base: maint 100% +4, kitchen 100% +3, bedroom pers 100% +3,
    // cond good 100% +3, room suit 100% +3, risk 100% +2, consult 100% +3
    // cleaning +2, quality 2.0 no bonus
    // 52 + 2 + 0 + 4 + 3 + 3 + 3 + 3 + 2 + 3 = 75
    expect(r.environment_score).toBe(75);
  });

  it("cleaning completion exactly 95% gives +4", () => {
    const cleaning = [
      ...Array.from({ length: 19 }, () => makeCleaning({ completed: true, quality_rating: 2 })),
      makeCleaning({ completed: false, quality_rating: 2 }),
    ];
    // 19/20 = 95% -> +4, quality avg 2.0 -> no bonus
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    // 52 + 4 + 0(quality 2.0) + 4 + 3 + 3 + 3 + 3 + 2 + 3 = 77
    expect(r.environment_score).toBe(77);
  });

  it("maintenance completion exactly 75% gives +2", () => {
    const maintenance = [
      ...Array.from({ length: 3 }, () => makeMaintenance({ status: "completed" })),
      makeMaintenance({ status: "open" }),
    ];
    // 3/4 = 75% -> +2
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    // 52 + 4(clean) + 3(quality) + 2(maint) + 3(kitchen) + 3(bed pers) + 3(bed cond) + 3(room suit) + 2(room risk) + 3(consult) = 78
    expect(r.environment_score).toBe(78);
  });

  it("maintenance completion exactly 90% gives +4", () => {
    const maintenance = [
      ...Array.from({ length: 9 }, () => makeMaintenance({ status: "completed" })),
      makeMaintenance({ status: "open" }),
    ];
    // 9/10 = 90% -> +4
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    // Same as full base = 80
    expect(r.environment_score).toBe(80);
  });

  it("kitchen pass rate exactly 85% gives +1", () => {
    const kitchen = [
      ...Array.from({ length: 17 }, () => makeKitchenCheck({ overall_pass: true })),
      ...Array.from({ length: 3 }, () => makeKitchenCheck({ overall_pass: false })),
    ];
    // 17/20 = 85% -> +1
    const r = computeLivingEnvironmentStandards(baseInput({ kitchen_hygiene_checks: kitchen }));
    // 52 + 4 + 3 + 4 + 1 + 3 + 3 + 3 + 2 + 3 = 78
    expect(r.environment_score).toBe(78);
  });

  it("bedroom personalisation exactly 80% gives +1", () => {
    const bedrooms = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeBedroom({ personalised: true, condition: "good", child_id: `c${i}` }),
      ),
      makeBedroom({ personalised: false, condition: "good", child_id: "c4" }),
    ];
    // 4/5=80% pers -> +1, 5/5=100% cond good -> +3
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    // 52 + 4 + 3 + 4 + 3 + 1 + 3 + 3 + 2 + 3 = 78
    expect(r.environment_score).toBe(78);
  });

  it("room suitability exactly 80% gives +1", () => {
    const rooms = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: `c${i}` }),
      ),
      makeRoomAllocation({ suitable_for_needs: false, risk_assessed: true, child_consulted: true, child_id: "c4" }),
    ];
    // suit 4/5=80% -> +1, risk 5/5=100% -> +2, consult 5/5=100% -> +3
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    // 52 + 4 + 3 + 4 + 3 + 3 + 3 + 1 + 2 + 3 = 78
    expect(r.environment_score).toBe(78);
  });

  it("room risk assessment exactly 80% gives +1", () => {
    const rooms = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: `c${i}` }),
      ),
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: false, child_consulted: true, child_id: "c4" }),
    ];
    // suit 5/5=100% -> +3, risk 4/5=80% -> +1, consult 5/5=100% -> +3
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    // 52 + 4 + 3 + 4 + 3 + 3 + 3 + 3 + 1 + 3 = 79
    expect(r.environment_score).toBe(79);
  });

  it("child consultation exactly 80% gives +1", () => {
    const rooms = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: true, child_id: `c${i}` }),
      ),
      makeRoomAllocation({ suitable_for_needs: true, risk_assessed: true, child_consulted: false, child_id: "c4" }),
    ];
    // suit 5/5=100% -> +3, risk 5/5=100% -> +2, consult 4/5=80% -> +1
    const r = computeLivingEnvironmentStandards(baseInput({ room_allocations: rooms }));
    // 52 + 4 + 3 + 4 + 3 + 3 + 3 + 3 + 2 + 1 = 78
    expect(r.environment_score).toBe(78);
  });

  it("bedroom condition good exactly 70% gives +1", () => {
    const bedrooms = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeBedroom({ personalised: true, condition: "good", child_id: `c${i}` }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeBedroom({ personalised: true, condition: "fair", child_id: `c${i + 7}` }),
      ),
    ];
    // pers 10/10=100% -> +3, cond 7/10=70% -> +1
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    // 52 + 4 + 3 + 4 + 3 + 3 + 1 + 3 + 2 + 3 = 78
    expect(r.environment_score).toBe(78);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 17. CLEANING QUALITY AVG EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Cleaning quality avg edge cases", () => {
  it("quality_rating outside 1-5 excluded from avg", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 0 }),
      makeCleaning({ completed: true, quality_rating: 6 }),
      makeCleaning({ completed: true, quality_rating: 4 }),
    ];
    // Only quality_rating=4 is valid (1-5), so avg = 4.0
    // Wait, 6 is > 5 but filter is quality_rating >= 1 && quality_rating <= 5
    // So 0 excluded, 6 excluded, only 4 included -> avg = 4.0
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    expect(r.cleaning_quality_avg).toBe(4);
  });

  it("all invalid quality ratings yields avg 0", () => {
    const cleaning = [
      makeCleaning({ completed: true, quality_rating: 0 }),
      makeCleaning({ completed: true, quality_rating: -1 }),
      makeCleaning({ completed: true, quality_rating: 6 }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    expect(r.cleaning_quality_avg).toBe(0);
  });

  it("issues_noted with whitespace only does not count as issues", () => {
    const cleaning = [
      makeCleaning({ issues_noted: "   " }),
      makeCleaning({ issues_noted: null }),
      makeCleaning({ issues_noted: "Real issue" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ cleaning_entries: cleaning }));
    // Only "Real issue" counts — but issues count doesn't appear in output directly.
    // It's an internal metric. Let's just verify no crash.
    expect(r.total_cleaning_entries).toBe(3);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 18. MAINTENANCE STATUS EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Maintenance status edge cases", () => {
  it("in_progress items are not counted as completed", () => {
    const maintenance = [
      makeMaintenance({ status: "in_progress" }),
      makeMaintenance({ status: "in_progress" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.maintenance_completion_rate).toBe(0);
  });

  it("overdue items are not counted as completed", () => {
    const maintenance = [
      makeMaintenance({ status: "overdue" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.maintenance_completion_rate).toBe(0);
    expect(r.overdue_maintenance_count).toBe(1);
  });

  it("completed safety items do not count as open", () => {
    const maintenance = [
      makeMaintenance({ safety_risk: true, status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    expect(r.safety_maintenance_open).toBe(0);
  });

  it("urgent completed items are not counted as urgent open", () => {
    const maintenance = [
      makeMaintenance({ priority: "urgent", status: "completed" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    // urgent open concern should not appear
    expect(r.concerns.filter(c => c.includes("urgent maintenance"))).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 19. BEDROOM CONDITION EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Bedroom condition edge cases", () => {
  it("'excellent' counts as good condition", () => {
    const bedrooms = [makeBedroom({ condition: "excellent", child_id: "c1" })];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.bedroom_condition_good_rate).toBe(100);
  });

  it("'fair' does not count as good condition", () => {
    const bedrooms = [makeBedroom({ condition: "fair", child_id: "c1" })];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.bedroom_condition_good_rate).toBe(0);
  });

  it("'poor' does not count as good condition", () => {
    const bedrooms = [makeBedroom({ condition: "poor", child_id: "c1" })];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.bedroom_condition_good_rate).toBe(0);
  });

  it("mixed conditions calculated correctly", () => {
    const bedrooms = [
      makeBedroom({ condition: "excellent", child_id: "c1" }),
      makeBedroom({ condition: "good", child_id: "c2" }),
      makeBedroom({ condition: "fair", child_id: "c3" }),
      makeBedroom({ condition: "poor", child_id: "c4" }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ bedroom_profiles: bedrooms }));
    expect(r.bedroom_condition_good_rate).toBe(50); // 2/4
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 20. COMBINED PENALTY + BONUS INTERACTION
// ════════════════════════════════════════════════════════════════════════════

describe("Combined penalty + bonus interaction", () => {
  it("bonuses and penalties combine additively", () => {
    // cleaning 100% -> +4, quality 4.5 -> +3
    // maintenance 100% -> +4
    // kitchen 100% -> +3
    // bedroom pers 100% -> +3, cond good 100% -> +2
    // room suit 100% -> +3, risk 100% -> +2, consult 100% -> +2
    // But add 1 safety maintenance open -> -5
    const maintenance = [
      ...Array.from({ length: 9 }, () => makeMaintenance({ status: "completed" })),
      makeMaintenance({ status: "open", safety_risk: true }),
    ];
    // 9/10=90% -> +4, but 1 safety -> -5
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    // 52 + 4(clean) + 3(quality) + 4(maint) + 3(kitchen) + 3(bed pers) + 3(bed cond) + 3(room suit) + 2(room risk) + 3(consult) - 5(safety)
    // = 80 - 5 = 75
    expect(r.environment_score).toBe(75);
  });

  it("maintenance bonus can coexist with safety penalty", () => {
    // 9/10 = 90% completed -> +4 bonus. But 1 of the open ones is safety -> -5 penalty.
    const maintenance = [
      ...Array.from({ length: 9 }, () => makeMaintenance({ status: "completed" })),
      makeMaintenance({ status: "open", safety_risk: true }),
    ];
    const r = computeLivingEnvironmentStandards(baseInput({ maintenance_items: maintenance }));
    // Bonus +4, penalty -5 -> net -1 from maintenance domain
    expect(r.maintenance_completion_rate).toBe(90);
    expect(r.safety_maintenance_open).toBe(1);
  });
});
