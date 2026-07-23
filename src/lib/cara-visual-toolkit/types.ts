// ══════════════════════════════════════════════════════════════════════════════
// CARA VISUAL PRACTICE, QUALITY, WORKFORCE & IMPACT ENGINE — SHARED TYPES
//
// Baseline → Action → Voice → Change → Evidence → Impact
// ══════════════════════════════════════════════════════════════════════════════

// ── Shared enumerations ───────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type SignalColour = "green" | "amber" | "red" | "grey";
export type ProgressStatus =
  | "not_started"
  | "needs_attention"
  | "on_track"
  | "completed"
  | "not_applicable";

export type ActionPriority = "low" | "medium" | "high" | "urgent";
export type ActionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "overdue";

// ── Core action type ──────────────────────────────────────────────────────────

export type ActionRequired = {
  id: string;
  description: string;
  owner: string;
  targetDate: string;
  priority: ActionPriority;
  status: ActionStatus;
  evidenceRequired?: string;
  completionEvidence?: string;
  reviewedBy?: string;
  reviewDate?: string;
};

// ── Visual tool catalogue ─────────────────────────────────────────────────────

export type ToolCategory =
  | "incident_behaviour"
  | "missing_safeguarding"
  | "contextual_exploitation"
  | "child_voice_safety"
  | "behaviour_support"
  | "staff_reflection"
  | "workforce_development"
  | "safer_recruitment"
  | "manager_oversight"
  | "quality_assurance"
  | "lessons_learned"
  | "showing_impact"
  | "inspection_evidence";

export type ToolAudience =
  | "child"
  | "staff"
  | "manager"
  | "senior_leader"
  | "responsible_individual"
  | "inspector"
  | "multi_agency";

export type ToolMode = "digital" | "printable" | "both";
export type ToolStatus = "live" | "coming_soon";

export type ToolCard = {
  id: string;
  title: string;
  subtitle: string;
  category: ToolCategory;
  audience: ToolAudience[];
  mode: ToolMode;
  status: ToolStatus;
  href: string;
  icon: string;
  description: string;
  dataSources: string[];
  regulatoryRef?: string;
};

// ── Incident timing types ─────────────────────────────────────────────────────

export type TimePeriod = "night" | "morning" | "afternoon" | "evening";

export type PeriodCount = {
  period: TimePeriod;
  label: string;
  hours: string;
  count: number;
  severityCounts: Record<string, number>;
  pct: number;
};

export type HourlyBucket = {
  hour: number;
  label: string;
  count: number;
};

export type IncidentTimingAnalysis = {
  totalAnalysed: number;
  periodCounts: PeriodCount[];
  hourlyBuckets: HourlyBucket[];
  peakPeriod: TimePeriod | null;
  peakPeriodLabel: string;
  typeBreakdown: { type: string; label: string; count: number }[];
  severityBreakdown: { severity: string; count: number }[];
  insights: string[];
  preventionWindow: string;
  safeguardingNote: string | null;
};

// ── Workforce risk types ──────────────────────────────────────────────────────

export type WorkforceRiskLevel = "low" | "moderate" | "elevated" | "critical";

export type StaffingIndicator = {
  label: string;
  value: string | number;
  signal: SignalColour;
  note?: string;
};

export type WorkforceRiskAnalysis = {
  overallRisk: WorkforceRiskLevel;
  overallRiskLabel: string;
  staffingIndicators: StaffingIndicator[];
  supervisionIndicators: StaffingIndicator[];
  trainingIndicators: StaffingIndicator[];
  burnoutSignals: string[];
  strengths: string[];
  priorityActions: ActionRequired[];
  teamSignalSummary: string;
  regulatoryNote: string;
};

// ── Lessons learned types ─────────────────────────────────────────────────────

export type LessonSource =
  | "incident"
  | "physical_intervention"
  | "safeguarding"
  | "medication_error"
  | "reg44_visit"
  | "supervision"
  | "debrief"
  | "complaint"
  | "other";

export type LessonTheme =
  | "safeguarding"
  | "behaviour_support"
  | "medication_management"
  | "staffing_oversight"
  | "communication"
  | "environment_safety"
  | "child_rights_voice"
  | "staff_practice"
  | "other";

export type LessonRecord = {
  id: string;
  date: string;
  source: LessonSource;
  sourceLabel: string;
  theme: LessonTheme;
  themeLabel: string;
  summary: string;
  lessonLearned: string;
  actionRequired: boolean;
  actionDescription: string | null;
  actionStatus: ActionStatus | null;
  actionOwner: string | null;
  actionDueDate: string | null;
  evidenceOfChange: string | null;
  childId: string | null;
  childInitials: string | null;
  sharedWithTeam: boolean;
  managerReviewed: boolean;
};

export type LessonsLearnedAnalysis = {
  totalLessons: number;
  lessonsWithActions: number;
  completedActions: number;
  overdueActions: number;
  openActions: number;
  /** null when no lesson has an action attached — nothing to complete. */
  actionCompletionRate: number | null;
  themeBreakdown: { theme: LessonTheme; label: string; count: number }[];
  sourceBreakdown: { source: LessonSource; label: string; count: number }[];
  lessons: LessonRecord[];
  insights: string[];
  overallSignal: SignalColour;
  regulatoryNote: string;
};

// ── Post-incident reflection types ────────────────────────────────────────────

export type IncidentReflection = {
  incidentId: string;
  incidentRef: string;
  incidentDate: string;
  incidentType: string;
  severity: string;
  hasDebrief: boolean;
  debriefDate: string | null;
  daysToDebrief: number | null;
  whatHappened: string | null;
  whatWorkedWell: string | null;
  whatCouldImprove: string | null;
  staffWellbeing: string | null;
  childPerspective: string | null;
  lessonsLearned: string | null;
  changesNeeded: string | null;
  followUpActions: string[];
};

export type PostIncidentReflectionAnalysis = {
  totalIncidents: number;
  incidentsWithDebrief: number;
  debriefCompletionRate: number;
  avgDaysToDebrief: number | null;
  overdueDebriefs: number;
  reflections: IncidentReflection[];
  insights: string[];
  overallSignal: SignalColour;
  regulatoryNote: string;
};

// ── Missing / absconding types ────────────────────────────────────────────────

export type MissingEpisodeSummary = {
  id: string;
  childId: string;
  childInitials: string;
  dateMissing: string;
  dateReturned: string | null;
  durationHours: number | null;
  riskLevel: string;
  returnInterviewCompleted: boolean;
  reportedToPolice: boolean;
  status: string;
  currentlyMissing: boolean;
};

export type MissingAbscondingAnalysis = {
  totalEpisodes: number;
  currentlyMissing: number;
  highRiskEpisodes: number;
  returnInterviewCompletionRate: number;
  incompleteReturnInterviews: number;
  avgDurationHours: number | null;
  episodes: MissingEpisodeSummary[];
  riskLevelBreakdown: { level: string; label: string; count: number }[];
  insights: string[];
  overallSignal: SignalColour;
  regulatoryNote: string;
};

// ── Contextual exploitation types ─────────────────────────────────────────────

export type ExploitationIndicator = {
  id: string;
  label: string;
  description: string;
  count: number;
  signal: SignalColour;
  sources: string[];
};

export type ContextualExploitationAnalysis = {
  childrenFlagged: number;
  totalChildren: number;
  highRiskMissingEpisodes: number;
  exploitationRiskAssessments: number;
  multipleRiskFactors: number;
  indicators: ExploitationIndicator[];
  insights: string[];
  overallSignal: SignalColour;
  regulatoryNote: string;
};

// ── My Safety Plan types ──────────────────────────────────────────────────────

export type ChildRiskDomain = {
  domain: string;
  level: string;
  trend: string;
  reviewDate: string | null;
  overdueReview: boolean;
};

export type ChildSafetyPlan = {
  childId: string;
  childInitials: string;
  keyWorker: string | null;
  riskDomains: ChildRiskDomain[];
  highRiskDomainCount: number;
  overdueReviewCount: number;
  lastKeyWork: string | null;
  lastRiskAssessment: string | null;
  overallRisk: RiskLevel;
  overallSignal: SignalColour;
};

export type MySafetyPlanAnalysis = {
  totalChildren: number;
  childrenWithHighRisk: number;
  overdueRiskReviews: number;
  childrenWithRecentKeyWork: number;
  childPlans: ChildSafetyPlan[];
  insights: string[];
  overallSignal: SignalColour;
  regulatoryNote: string;
};

// ── Behaviour support plan types ──────────────────────────────────────────────

export type BehaviourTrigger = {
  trigger: string;
  count: number;
};

export type BehaviourStrategy = {
  strategy: string;
  count: number;
  positiveOutcomes: number;
  effectivenessRate: number;
};

export type ChildBehaviourProfile = {
  childId: string;
  childInitials: string;
  totalEntries: number;
  highIntensityCount: number;
  topTriggers: BehaviourTrigger[];
  topStrategies: BehaviourStrategy[];
  linkedIncidents: number;
  mostRecentEntry: string | null;
  signal: SignalColour;
};

export type BehaviourSupportAnalysis = {
  totalEntries: number;
  highIntensityEntries: number;
  topTriggers: BehaviourTrigger[];
  topStrategies: BehaviourStrategy[];
  childProfiles: ChildBehaviourProfile[];
  insights: string[];
  overallSignal: SignalColour;
  regulatoryNote: string;
};

// ── Staff skills & confidence types ───────────────────────────────────────────

export type StaffSkillProfile = {
  staffId: string;
  staffName: string;
  role: string;
  mandatoryTotal: number;
  mandatoryCompliant: number;
  /** null when no mandatory training is recorded for this staff member. */
  complianceRate: number | null;
  overdueTraining: string[];
  supervisionScore: number | null;
  confidenceLevel: string | null;
  lastSupervision: string | null;
  developmentAreas: string[];
  signal: SignalColour;
};

export type StaffSkillsAnalysis = {
  totalStaff: number;
  fullCompliance: number;
  avgComplianceRate: number | null;
  overdueTrainingCount: number;
  lowConfidenceCount: number;
  staffProfiles: StaffSkillProfile[];
  insights: string[];
  overallSignal: SignalColour;
  regulatoryNote: string;
};

// ── Quality of care evaluation types ─────────────────────────────────────────

export type QualityDimension = {
  id: string;
  label: string;
  /** null when the dimension has no records to score against. */
  score: number | null;
  signal: SignalColour;
  evidence: string[];
  gaps: string[];
};

export type QualityOfCareAnalysis = {
  /** Mean of the measured dimensions only; null when none are measured. */
  overallScore: number | null;
  overallSignal: SignalColour;
  dimensions: QualityDimension[];
  strengths: string[];
  areasForImprovement: string[];
  insights: string[];
  regulatoryNote: string;
};

// ── Showing impact types ──────────────────────────────────────────────────────

export type ChildImpactSummary = {
  childId: string;
  childInitials: string;
  keyWorkCount: number;
  incidentTrend: "improving" | "stable" | "worsening" | "insufficient_data";
  voiceRecorded: boolean;
  riskTrend: string | null;
  recentOutcomes: string[];
  overallSignal: SignalColour;
};

export type ShowingImpactAnalysis = {
  totalChildren: number;
  childrenWithVoice: number;
  childrenWithKeyWork: number;
  childrenImproving: number;
  childSummaries: ChildImpactSummary[];
  insights: string[];
  overallSignal: SignalColour;
  regulatoryNote: string;
};

// ── Inspection evidence pack types ───────────────────────────────────────────

export type EvidenceSection = {
  id: string;
  title: string;
  regulatoryRef: string;
  signal: SignalColour;
  keyFindings: string[];
  evidenceStrengths: string[];
  gaps: string[];
};

export type InspectionEvidenceAnalysis = {
  overallReadiness: SignalColour;
  readinessLabel: string;
  greenSections: number;
  amberSections: number;
  redSections: number;
  sections: EvidenceSection[];
  priorityActions: string[];
  regulatoryNote: string;
};
