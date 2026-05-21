"use client";
import { useEffect, useState } from "react";

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded">
        <div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{String(value)}</p>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded mb-3">
      <button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>
        {title}<span>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}

function ratingBadge(rating: string) {
  const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function RoomStandardsPersonalisationIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/room-standards-personalisation")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading room standards &amp; personalisation intelligence: {error}</div>;
  if (!data) return null;

  const overallScore = data.overallScore as number;
  const rating = data.rating as string;
  const roomConditions = data.roomConditions as Record<string, unknown>;
  const personalisation = data.personalisation as Record<string, unknown>;
  const inspectionCompliance = data.inspectionCompliance as Record<string, unknown>;
  const staffRoomReadiness = data.staffRoomReadiness as Record<string, unknown>;
  const childRoomProfiles = (data.childRoomProfiles ?? []) as Record<string, unknown>[];
  const strengths = (data.strengths ?? []) as string[];
  const areasForImprovement = (data.areasForImprovement ?? []) as string[];
  const actions = (data.actions ?? []) as string[];
  const regulatoryLinks = (data.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Room Standards &amp; Personalisation Intelligence</h2>
        {ratingBadge(rating)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Overall Score" value={`${overallScore}/100`} />
        <Stat label="Rooms" value={roomConditions.totalRooms as number} />
        <Stat label="Good+ Condition" value={`${roomConditions.roomConditionGoodPlusRate}%`} />
        <Stat label="Personalised" value={`${personalisation.personalisationGoodPlusRate}%`} />
      </div>

      <Section title="Room Conditions" defaultOpen>
        <ScoreBar label="Conditions Score" value={roomConditions.score as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <Stat label="Good+ Condition" value={`${roomConditions.roomConditionGoodPlusRate}%`} />
          <Stat label="Good+ Furniture" value={`${roomConditions.furnitureGoodPlusRate}%`} />
          <Stat label="Essential Amenities" value={`${roomConditions.essentialAmenitiesRate}%`} />
          <Stat label="Privacy & Windows" value={`${roomConditions.privacyWindowsRate}%`} />
        </div>
      </Section>

      <Section title="Personalisation">
        <ScoreBar label="Personalisation Score" value={personalisation.score as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <Stat label="Good+ Personalisation" value={`${personalisation.personalisationGoodPlusRate}%`} />
          <Stat label="Child Chosen Decor" value={`${personalisation.childChosenDecorRate}%`} />
          <Stat label="Highly Personalised" value={`${personalisation.highPersonalisationRate}%`} />
          <Stat label="All Personalised" value={`${personalisation.allPersonalisedRate}%`} />
        </div>
      </Section>

      <Section title="Inspection Compliance">
        <ScoreBar label="Inspection Score" value={inspectionCompliance.score as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <Stat label="Pass Rate" value={`${inspectionCompliance.passRate}%`} />
          <Stat label="Issues Scheduled" value={`${inspectionCompliance.issuesScheduledRate}%`} />
          <Stat label="Repairs Completed" value={`${inspectionCompliance.repairsCompletedRate}%`} />
          <Stat label="Total Inspections" value={inspectionCompliance.totalInspections as number} />
        </div>
      </Section>

      <Section title="Staff Room Readiness">
        <ScoreBar label="Readiness Score" value={staffRoomReadiness.score as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <Stat label="Room Standards" value={`${staffRoomReadiness.roomStandardsRate}%`} />
          <Stat label="Personalisation" value={`${staffRoomReadiness.personalisationImportanceRate}%`} />
          <Stat label="Privacy Awareness" value={`${staffRoomReadiness.privacyAwarenessRate}%`} />
          <Stat label="Safety Checks" value={`${staffRoomReadiness.safetyChecksRate}%`} />
        </div>
      </Section>

      {childRoomProfiles.length > 0 && (
        <Section title="Child Room Profiles">
          <div className="space-y-2">
            {childRoomProfiles.map((cp) => (
              <div key={cp.childId as string} className="border rounded p-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>{cp.childName as string}</span>
                  <span>{cp.roomScore as number}/10</span>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-xs text-gray-600">
                  <span>Condition: {(cp.roomCondition as string).replace(/_/g, " ")}</span>
                  <span>Personalisation: {(cp.personalisationLevel as string).replace(/_/g, " ")}</span>
                  <span>Inspections: {cp.inspectionCount as number}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="text-sm space-y-1 list-disc list-inside">{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </Section>
      )}

      {areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement">
          <ul className="text-sm space-y-1 list-disc list-inside">{areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </Section>
      )}

      {actions.length > 0 && (
        <Section title="Actions">
          <ul className="text-sm space-y-1 list-disc list-inside">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </Section>
      )}

      {regulatoryLinks.length > 0 && (
        <Section title="Regulatory Links">
          <ul className="text-sm space-y-1 list-disc list-inside">{regulatoryLinks.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}
