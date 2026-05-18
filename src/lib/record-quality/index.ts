export {
  evaluateCompletion,
  evaluateTimeliness,
  evaluateQuality,
  evaluateSignOff,
  evaluateCrossReferencing,
  buildStaffProfiles,
  generateRecordQualityIntelligence,
  getRecordTypeLabel,
  getTimescaleHours,
} from "./record-quality-engine";

export type {
  RecordType,
  RecordStatus,
  RecordEntry,
  RecordExpectation,
  StaffRecordProfile,
  CompletionResult,
  TimelinessResult,
  QualityResult,
  SignOffResult,
  CrossReferenceResult,
  RecordQualityResult,
} from "./record-quality-engine";
