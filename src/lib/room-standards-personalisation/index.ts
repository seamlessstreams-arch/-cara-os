// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Room Standards & Personalisation Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  pct,
  getRating,
  getRoomConditionLabel,
  getPersonalisationLevelLabel,
  getInspectionOutcomeLabel,
  getFurnitureConditionLabel,
  getRatingLabel,
  evaluateRoomConditions,
  evaluatePersonalisation,
  evaluateInspectionCompliance,
  evaluateStaffRoomReadiness,
  buildChildRoomProfiles,
  generateRoomStandardsPersonalisationIntelligence,
} from "./room-standards-personalisation-engine";

export type {
  RoomCondition,
  PersonalisationLevel,
  InspectionOutcome,
  FurnitureCondition,
  Rating,
  RoomRecord,
  RoomInspection,
  RoomPolicy,
  StaffRoomTraining,
  RoomConditionsResult,
  PersonalisationResult,
  InspectionComplianceResult,
  StaffRoomReadinessResult,
  ChildRoomProfile,
  RoomStandardsPersonalisationIntelligence,
} from "./room-standards-personalisation-engine";
