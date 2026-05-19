"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ROOM STANDARDS & PERSONALISATION DASHBOARD WIDGET
//
// Displays the 4-layer room standards & personalisation intelligence:
// - Overall score with rating
// - Layer scores: room conditions, personalisation, inspections, staff
// - Child room profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface RoomConditionsData {
  totalRooms: number;
  roomConditionGoodPlusRate: number;
  furnitureGoodPlusRate: number;
  essentialAmenitiesRate: number;
  privacyWindowsRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface PersonalisationData {
  totalRooms: number;
  personalisationGoodPlusRate: number;
  childChosenDecorRate: number;
  highPersonalisationRate: number;
  allPersonalisedRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface InspectionComplianceData {
  totalInspections: number;
  passRate: number;
  issuesScheduledRate: number;
  repairsCompletedRate: number;
  inspectionFrequency: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffRoomReadinessData {
  totalStaff: number;
  roomStandardsRate: number;
  personalisationImportanceRate: number;
  privacyAwarenessRate: number;
  maintenanceReportingRate: number;
  safetyChecksRate: number;
  childParticipationRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildRoomProfileData {
  childId: string;
  childName: string;
  roomCondition: string;
  personalisationLevel: string;
  childChosenDecor: boolean;
  inspectionCount: number;
  lastInspectionOutcome: string | null;
  roomScore: number;
}

interface RoomStandardsData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  roomConditions: RoomConditionsData;
  personalisation: PersonalisationData;
  inspectionCompliance: InspectionComplianceData;
  staffRoomReadiness: StaffRoomReadinessData;
  childRoomProfiles: ChildRoomProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    roomConditionLabels: Record<string, string>;
    personalisationLevelLabels: Record<string, string>;
    inspectionOutcomeLabels: Record<string, string>;
    furnitureConditionLabels: Record<string, string>;
    ratingLabels: Record<string, string>;
    ratingLabel: string;
    roomSummary: { id: string; childName: string; condition: string; personalisation: string; furniture: string }[];
  };
}

// ── Rating Badge ───────────────────────────────────────────────────────────

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

// ── Score Bar ──────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const percentage = Math.round((score / max) * 100);
  const color =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 60
        ? "bg-blue-500"
        : percentage >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  const textColor =
    percentage >= 80
      ? "text-green-700"
      : percentage >= 60
        ? "text-blue-700"
        : percentage >= 40
          ? "text-orange-700"
          : "text-red-700";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-bold ${textColor}`}>{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ── Stat Box ──────────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const bg = color === "green" ? "bg-green-50 text-green-700"
    : color === "blue" ? "bg-blue-50 text-blue-700"
      : color === "red" ? "bg-red-50 text-red-700"
        : color === "orange" ? "bg-orange-50 text-orange-700"
          : "bg-gray-50 text-gray-700";

  return (
    <div className={`rounded-lg p-2.5 text-center ${bg}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Collapsible Section ───────────────────────────────────────────────────

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Child Profile Row ─────────────────────────────────────────────────────

function ChildProfileRow({ profile }: { profile: ChildRoomProfileData }) {
  const scoreColor =
    profile.roomScore >= 8 ? "bg-green-100 text-green-700"
      : profile.roomScore >= 5 ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{profile.childName}</span>
          {profile.childChosenDecor && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Child-chosen decor</span>
          )}
        </div>
        <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
          <span>Condition: {profile.roomCondition}</span>
          <span>Personalisation: {profile.personalisationLevel}</span>
          <span>Inspections: {profile.inspectionCount}</span>
          {profile.lastInspectionOutcome && (
            <span>Last: {profile.lastInspectionOutcome}</span>
          )}
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}>
        {profile.roomScore}/10
      </span>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function RoomStandardsPersonalisationDashboardWidget() {
  const [data, setData] = useState<RoomStandardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/room-standards-personalisation");
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
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Room Standards & Personalisation</h3>
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
            Room Standards & Personalisation
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.roomConditions.totalRooms} rooms | {data.staffRoomReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Layer Score Bars */}
      <div className="space-y-2 mb-4">
        <ScoreBar label="Room Conditions" score={data.roomConditions.score} />
        <ScoreBar label="Personalisation" score={data.personalisation.score} />
        <ScoreBar label="Inspection Compliance" score={data.inspectionCompliance.score} />
        <ScoreBar label="Staff Readiness" score={data.staffRoomReadiness.score} />
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <StatBox label="Condition %" value={`${data.roomConditions.roomConditionGoodPlusRate}%`} color="green" />
        <StatBox label="Personalised %" value={`${data.personalisation.personalisationGoodPlusRate}%`} color="blue" />
        <StatBox label="Child Decor" value={`${data.personalisation.childChosenDecorRate}%`} color="blue" />
        <StatBox label="Pass Rate" value={`${data.inspectionCompliance.passRate}%`} color="green" />
        <StatBox label="Amenities" value={`${data.roomConditions.essentialAmenitiesRate}%`} color="green" />
        <StatBox label="Staff Trained" value={`${data.staffRoomReadiness.roomStandardsRate}%`} color="green" />
      </div>

      {/* Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Actions Required</h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 5).map((action, i) => (
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

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* Room Conditions */}
        <CollapsibleSection title="Room Conditions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBox label="Good+ Condition" value={`${data.roomConditions.roomConditionGoodPlusRate}%`} color="green" />
            <StatBox label="Good+ Furniture" value={`${data.roomConditions.furnitureGoodPlusRate}%`} color="green" />
            <StatBox label="Amenities" value={`${data.roomConditions.essentialAmenitiesRate}%`} color="blue" />
            <StatBox label="Privacy & Windows" value={`${data.roomConditions.privacyWindowsRate}%`} color="blue" />
          </div>
        </CollapsibleSection>

        {/* Personalisation */}
        <CollapsibleSection title="Personalisation">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBox label="Good+ Personal." value={`${data.personalisation.personalisationGoodPlusRate}%`} color="blue" />
            <StatBox label="Child Decor" value={`${data.personalisation.childChosenDecorRate}%`} color="blue" />
            <StatBox label="Highly Personal." value={`${data.personalisation.highPersonalisationRate}%`} color="green" />
            <StatBox label="All Personalised" value={`${data.personalisation.allPersonalisedRate}%`} color="green" />
          </div>
        </CollapsibleSection>

        {/* Inspections */}
        <CollapsibleSection title="Inspection Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBox label="Pass Rate" value={`${data.inspectionCompliance.passRate}%`} color="green" />
            <StatBox label="Issues Scheduled" value={`${data.inspectionCompliance.issuesScheduledRate}%`} color="blue" />
            <StatBox label="Repairs Done" value={`${data.inspectionCompliance.repairsCompletedRate}%`} color="green" />
            <StatBox label="Inspections" value={data.inspectionCompliance.totalInspections} />
          </div>
        </CollapsibleSection>

        {/* Staff */}
        <CollapsibleSection title="Staff Room Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <StatBox label="Room Standards" value={`${data.staffRoomReadiness.roomStandardsRate}%`} color="green" />
            <StatBox label="Personalisation" value={`${data.staffRoomReadiness.personalisationImportanceRate}%`} color="blue" />
            <StatBox label="Privacy" value={`${data.staffRoomReadiness.privacyAwarenessRate}%`} color="blue" />
            <StatBox label="Maintenance" value={`${data.staffRoomReadiness.maintenanceReportingRate}%`} color="green" />
            <StatBox label="Safety Checks" value={`${data.staffRoomReadiness.safetyChecksRate}%`} color="green" />
            <StatBox label="Child Particip." value={`${data.staffRoomReadiness.childParticipationRate}%`} color="blue" />
          </div>
        </CollapsibleSection>

        {/* Child Profiles */}
        <CollapsibleSection title="Child Room Profiles">
          {data.childRoomProfiles.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.childRoomProfiles.map((profile) => (
                <ChildProfileRow key={profile.childId} profile={profile} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">No child room profiles available</p>
          )}
        </CollapsibleSection>

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <CollapsibleSection title="Strengths" defaultOpen>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-700">+ {s}</li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <CollapsibleSection title="Areas for Improvement" defaultOpen>
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-xs text-orange-700">- {a}</li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Regulatory Links */}
        {data.regulatoryLinks.length > 0 && (
          <CollapsibleSection title="Regulatory References">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">{link}</li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
