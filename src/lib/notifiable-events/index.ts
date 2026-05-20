export {
  generateNotifiableEventsIntelligence,
  evaluateNotifiableEventsQuality,
  evaluateNotifiableEventsCompliance,
  evaluateNotifiableEventsPolicy,
  evaluateStaffNotifiableEventsReadiness,
  buildChildNotifiableEventsProfiles,
  pct,
  getRating,
  getNotifiableEventsCategoryLabel,
  getNotifiableEventsOutcomeLabel,
  getRatingLabel,
} from "./notifiable-events-intelligence-engine";

export type {
  NotifiableEventsCategory,
  NotifiableEventsOutcome,
  Rating,
  NotifiableEventsRecord,
  NotifiableEventsPolicy,
  StaffNotifiableEventsTraining,
  NotifiableEventsQualityResult,
  NotifiableEventsComplianceResult,
  NotifiableEventsPolicyResult,
  StaffNotifiableEventsReadinessResult,
  ChildNotifiableEventsProfile,
  NotifiableEventsIntelligence,
  GenerateNotifiableEventsIntelligenceInput,
} from "./notifiable-events-intelligence-engine";

// Legacy re-exports from notifiable-events-engine
export {
  evaluateNotificationCompliance,
  calculateNotifiableEventsMetrics,
  buildNotificationTimeline,
  getRequiredNotifications,
  getCategoryLabel,
  getRecipientLabel,
  getUrgencyLabel,
  getCategoryUrgency,
} from "./notifiable-events-engine";

export type {
  NotifiableEventCategory,
  NotificationStatus,
  NotificationRecipient,
  Urgency,
  NotifiableEvent,
  NotificationEntry,
  NotificationComplianceResult,
  NotifiableEventsMetrics,
  NotificationTimeline,
} from "./notifiable-events-engine";
