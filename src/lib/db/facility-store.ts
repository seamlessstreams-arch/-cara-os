// ══════════════════════════════════════════════════════════════════════════════
// CARA — FACILITY MANAGEMENT STORE
//
// This module re-exports all facility-related operations from the main store:
//   - Buildings (residential, office, outbuilding)
//   - Building Checks (H&S, compliance, maintenance tracking)
//   - Vehicles (fleet management, compliance tracking)
//   - Vehicle Checks (daily safety, defect tracking, maintenance)
//
// During the gradual store split (Phase 1), facility-specific code should
// import from this module while the actual collections remain in store.ts.
// This maintains backward compatibility and enables clean separation later.
//
// Usage:
//   import { facilityStore } from "@/lib/db/facility-store"
//   const buildings = await facilityStore.buildings.findAll()
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "./store";
import type {
  Building, BuildingCheck, Vehicle, VehicleCheck,
} from "@/types/extended";

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORTED FACILITY STORE — Lazy-coupled to main store
// ─────────────────────────────────────────────────────────────────────────────

export const facilityStore = {
  // Buildings — residential, office, or outbuilding structures
  buildings: db.buildings,

  // Building Checks — H&S, compliance, maintenance tracking
  buildingChecks: db.buildingChecks,

  // Vehicles — fleet management, compliance, insurance & MOT tracking
  vehicles: db.vehicles,

  // Vehicle Checks — daily safety, defect tracking, incident/damage records
  vehicleChecks: db.vehicleChecks,
};

// Re-export types for convenience
export type { Building, BuildingCheck, Vehicle, VehicleCheck };
