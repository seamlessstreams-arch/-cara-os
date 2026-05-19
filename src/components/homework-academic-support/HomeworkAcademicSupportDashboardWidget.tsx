"use client";

// ==============================================================================
// HOMEWORK & ACADEMIC SUPPORT DASHBOARD WIDGET
//
// Displays the 4-layer homework/academic support intelligence:
// - Overall score with rating
// - Layer scores: homework completion, interventions, resources, staff
// - Child academic profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ==============================================================================

import { useState, useEffect } from "react";

// -- Local interfaces (mirrors API shape) -------------------------------------

interface HomeworkCompletion {
  totalRecords: number;
  completionRate: number;
  supportProvidedRate: number;
  schoolFeedbackRate: number;
  subjectsCovered: number;
  totalSubjects: number;
  subjectCoverageRate: number;
  completionBreakdown: Record<string, number>;
  subjectBreakdown: Record<string, number>;
  averageTimeMinutes: number;
  difficultyRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface AcademicInterventions {
  totalInterventions: number;
  averageAttendanceRate: number;
  progressRate: number;
  pepLinkedRate: number;
  interventionTypesUsed: number;
  interventionVarietyRate: number;
  progressBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ResourceProvision {
  totalResources: number;
  availabilityRate: number;
  adequacyRate: number;
  resourceTypesPresent: number;
  totalResourceTypes: number;
  resourceVarietyRate: number;
  resourceBreakdown: Record<string, { available: boolean; adequate: boolean }>;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffEducationReadiness {
  totalStaff: number;
  homeworkSupportRate: number;
  pepAwarenessRate: number;
  senAwarenessRate: number;
  educationAdvocacyRate: number;
  examSupportRate: number;
  attachmentAwareRate: number;
  fullyTrainedRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildProfile {
  childId: string;
  childName: string;
  homeworkRecords: number;
  completionRate: number;
  supportReceived: boolean;
  difficultyRate: number;
  interventionCount: number;
  bestProgress: string | null;
  educationScore: number;
}

interface HomeworkAcademicData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  homeworkCompletion: HomeworkCompletion;
  academicInterventions: AcademicInterventions;
  resourceProvision: ResourceProvision;
  staffEducationReadiness: StaffEducationReadiness;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    homeworkSummary: { id: string; childName: string; date: string; subject: string; status: string }[];
    interventionSummary: { id: string; childName: string; type: string; progress: string }[];
    ratingLabel: string;
  };
}

// -- Rating Badge -------------------------------------------------------------

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const label =
    rating === "outstanding" ? "Outstanding"
      : rating === "good" ? "Good"
        : rating === "requires_improvement" ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// -- Layer Score Card ---------------------------------------------------------

function LayerScoreCard({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = Math.round((score / max) * 100);
  const color =
    pctVal >= 80 ? "text-green-700 bg-green-50 border-green-200"
      : pctVal >= 60 ? "text-blue-700 bg-blue-50 border-blue-200"
        : pctVal >= 40 ? "text-orange-700 bg-orange-50 border-orange-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{score}<span className="text-sm font-normal">/{max}</span></div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

// -- Compliance Gauge ---------------------------------------------------------

function ComplianceGauge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? "text-green-700 bg-green-100"
      : value >= 70 ? "text-yellow-700 bg-yellow-100"
        : "text-red-700 bg-red-100";

  return (
    <div className={`rounded-lg p-2.5 text-center ${color}`}>
      <div className="text-xl font-bold">{value}%</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// -- Child Profile Row --------------------------------------------------------

function ChildProfileRow({ profile }: { profile: ChildProfile }) {
  const scoreColor =
    profile.educationScore >= 8 ? "bg-green-100 text-green-700"
      : profile.educationScore >= 5 ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  const progressLabel: Record<string, string> = {
    above_expected: "Above",
    at_expected: "At Expected",
    below_expected: "Below",
    significantly_below: "Sig. Below",
    not_assessed: "N/A",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{profile.childName}</span>
          {profile.completionRate < 50 && profile.homeworkRecords > 0 && (
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Low completion</span>
          )}
          {profile.bestProgress === "significantly_below" && (
            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Sig. below</span>
          )}
        </div>
        <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
          <span>HW: {profile.completionRate}%</span>
          {profile.interventionCount > 0 && (
            <span>Interventions: {profile.interventionCount}</span>
          )}
          {profile.bestProgress && (
            <span>Progress: {progressLabel[profile.bestProgress] ?? profile.bestProgress}</span>
          )}
          {profile.supportReceived && <span>Support received</span>}
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}>
        {profile.educationScore}/10
      </span>
    </div>
  );
}

// -- Resource Status Row ------------------------------------------------------

function ResourceStatusRow({ type, status }: { type: string; status: { available: boolean; adequate: boolean } }) {
  const resourceLabels: Record<string, string> = {
    quiet_study_area: "Quiet Study Area",
    computer_access: "Computer Access",
    books_library: "Books / Library",
    stationery: "Stationery",
    internet_access: "Internet Access",
    specialist_software: "Specialist Software",
    tutor_access: "Tutor Access",
  };

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm">{resourceLabels[type] ?? type}</span>
      <div className="flex gap-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {status.available ? "Available" : "Unavailable"}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.adequate ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
          {status.adequate ? "Adequate" : "Inadequate"}
        </span>
      </div>
    </div>
  );
}

// -- Main Widget --------------------------------------------------------------

export function HomeworkAcademicSupportDashboardWidget() {
  const [data, setData] = useState<HomeworkAcademicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"homework" | "interventions" | "resources" | "staff" | "children">("homework");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/homework-academic-support");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Homework & Academic Support</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Homework & Academic Support
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.homeworkCompletion.totalRecords} records | {data.academicInterventions.totalInterventions} interventions | {data.staffEducationReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Layer Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <LayerScoreCard label="Homework" score={data.homeworkCompletion.score} max={25} />
        <LayerScoreCard label="Interventions" score={data.academicInterventions.score} max={25} />
        <LayerScoreCard label="Resources" score={data.resourceProvision.score} max={25} />
        <LayerScoreCard label="Staff Readiness" score={data.staffEducationReadiness.score} max={25} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <ComplianceGauge label="HW Completion" value={data.homeworkCompletion.completionRate} />
        <ComplianceGauge label="Support Rate" value={data.homeworkCompletion.supportProvidedRate} />
        <ComplianceGauge label="Attendance" value={data.academicInterventions.averageAttendanceRate} />
        <ComplianceGauge label="PEP Linked" value={data.academicInterventions.pepLinkedRate} />
        <ComplianceGauge label="Resources" value={data.resourceProvision.availabilityRate} />
        <ComplianceGauge label="Staff Trained" value={data.staffEducationReadiness.fullyTrainedRate} />
      </div>

      {/* Urgent Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Actions Required</h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 4).map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : action.startsWith("HIGH") ? "○" : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable Detail Tabs */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed breakdown"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-gray-200">
            {([
              ["homework", "Homework"],
              ["interventions", "Interventions"],
              ["resources", "Resources"],
              ["staff", "Staff"],
              ["children", "Children"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === key
                    ? "bg-white border border-b-white border-gray-200 text-gray-900 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Homework Tab */}
          {activeTab === "homework" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Completion" value={data.homeworkCompletion.completionRate} />
                <ComplianceGauge label="Support" value={data.homeworkCompletion.supportProvidedRate} />
                <ComplianceGauge label="School Feedback" value={data.homeworkCompletion.schoolFeedbackRate} />
                <ComplianceGauge label="Subject Coverage" value={data.homeworkCompletion.subjectCoverageRate} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.homeworkCompletion.totalRecords}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total Records</div>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-700">{data.homeworkCompletion.averageTimeMinutes}m</div>
                  <div className="text-[10px] text-gray-500 uppercase">Avg Time</div>
                </div>
                <div className={`p-2 rounded ${data.homeworkCompletion.difficultyRate > 50 ? "bg-red-50" : "bg-green-50"}`}>
                  <div className={`text-lg font-bold ${data.homeworkCompletion.difficultyRate > 50 ? "text-red-700" : "text-green-700"}`}>
                    {data.homeworkCompletion.difficultyRate}%
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Difficulty</div>
                </div>
              </div>
              {data.meta?.homeworkSummary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  {data.meta.homeworkSummary.map((hw) => (
                    <div key={hw.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{hw.childName}</span>
                        <span className="text-xs text-gray-400">{hw.subject}</span>
                        <span className="text-xs text-gray-400">{hw.date}</span>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">{hw.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interventions Tab */}
          {activeTab === "interventions" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Attendance" value={data.academicInterventions.averageAttendanceRate} />
                <ComplianceGauge label="Progress" value={data.academicInterventions.progressRate} />
                <ComplianceGauge label="PEP Linked" value={data.academicInterventions.pepLinkedRate} />
                <div className="rounded-lg p-2.5 text-center bg-gray-100 text-gray-700">
                  <div className="text-xl font-bold">{data.academicInterventions.interventionTypesUsed}</div>
                  <div className="text-[10px] font-medium mt-0.5">Types Used</div>
                </div>
              </div>
              {data.academicInterventions.progressBreakdown.significantly_below > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <span className="text-xs text-red-700 font-medium">
                    {data.academicInterventions.progressBreakdown.significantly_below} intervention(s) significantly below expected progress
                  </span>
                </div>
              )}
              {data.meta?.interventionSummary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  {data.meta.interventionSummary.map((iv) => (
                    <div key={iv.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{iv.childName}</span>
                        <span className="text-xs text-gray-400">{iv.type}</span>
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">{iv.progress}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === "resources" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <ComplianceGauge label="Availability" value={data.resourceProvision.availabilityRate} />
                <ComplianceGauge label="Adequacy" value={data.resourceProvision.adequacyRate} />
                <div className="rounded-lg p-2.5 text-center bg-gray-100 text-gray-700">
                  <div className="text-xl font-bold">{data.resourceProvision.resourceTypesPresent}/{data.resourceProvision.totalResourceTypes}</div>
                  <div className="text-[10px] font-medium mt-0.5">Resource Types</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                {Object.entries(data.resourceProvision.resourceBreakdown).map(([type, status]) => (
                  <ResourceStatusRow key={type} type={type} status={status} />
                ))}
              </div>
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === "staff" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <ComplianceGauge label="HW Support" value={data.staffEducationReadiness.homeworkSupportRate} />
                <ComplianceGauge label="PEP Aware" value={data.staffEducationReadiness.pepAwarenessRate} />
                <ComplianceGauge label="SEN Aware" value={data.staffEducationReadiness.senAwarenessRate} />
                <ComplianceGauge label="Advocacy" value={data.staffEducationReadiness.educationAdvocacyRate} />
                <ComplianceGauge label="Exam Support" value={data.staffEducationReadiness.examSupportRate} />
                <ComplianceGauge label="Attachment" value={data.staffEducationReadiness.attachmentAwareRate} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-700">{data.staffEducationReadiness.totalStaff}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total Staff</div>
                </div>
                <div className={`p-2 rounded ${data.staffEducationReadiness.fullyTrainedRate >= 80 ? "bg-green-50" : "bg-orange-50"}`}>
                  <div className={`text-lg font-bold ${data.staffEducationReadiness.fullyTrainedRate >= 80 ? "text-green-700" : "text-orange-700"}`}>
                    {data.staffEducationReadiness.fullyTrainedRate}%
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Fully Trained</div>
                </div>
              </div>
            </div>
          )}

          {/* Children Tab */}
          {activeTab === "children" && (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.childProfiles.length > 0 ? (
                data.childProfiles.map((profile) => (
                  <ChildProfileRow key={profile.childId} profile={profile} />
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No child profiles available</p>
              )}
            </div>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">+ {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="text-xs text-orange-700">- {a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory References</h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
