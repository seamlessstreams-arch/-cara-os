"use client";

import { formatRate, formatRateLoose } from "@/lib/metrics/rate";
import { useEffect, useState } from "react";

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div>
      <div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>;
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded mb-3">
      <button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>
      {open && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}

function ratingBadge(rating: string) {
  const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function GovernanceIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/governance")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading governance intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const sopCompliance = d.sopCompliance as Record<string, unknown>;
  const accuracy = sopCompliance.accuracy as Record<string, boolean>;
  const childrenGuide = sopCompliance.childrenGuide as Record<string, unknown>;
  const reg45 = d.reg45Compliance as Record<string, unknown>;
  const overdueReports = (reg45.overdueReports ?? []) as string[];
  const policyCompliance = d.policyCompliance as Record<string, unknown>;
  const overdueByCategory = (policyCompliance.overdueByCategory ?? []) as Record<string, unknown>[];
  const policiesNearingReview = (policyCompliance.policiesNearingReview ?? []) as Record<string, unknown>[];
  const notificationCompliance = d.notificationCompliance as Record<string, unknown>;
  const typeBreakdown = (notificationCompliance.typeBreakdown ?? []) as Record<string, unknown>[];
  const devPlan = d.developmentPlan as Record<string, unknown>;
  const devCategories = (devPlan.categories ?? []) as Record<string, unknown>[];
  const meetingCompliance = d.meetingCompliance as Record<string, number>;
  const mgmtPresence = d.managementPresence as Record<string, number>;
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForDevelopment ?? []) as string[];
  const actions = (d.immediateActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Governance Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Policies" value={policyCompliance.totalPolicies as number} />
        <Stat label="Reg 45 Reports" value={`${reg45.completed}/${reg45.totalExpected}`} />
        <Stat label="Notifications" value={notificationCompliance.totalNotifications as number} />
      </div>

      <Section title="Statement of Purpose" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Reviewed" value={sopCompliance.isReviewed ? "Yes" : "No"} />
          <Stat label="Overdue" value={sopCompliance.isOverdue ? "Yes" : "No"} />
          <Stat label="Days Since Review" value={sopCompliance.daysSinceReview as number} />
          <Stat label="Shared with Ofsted" value={sopCompliance.sharedWithOfsted ? "Yes" : "No"} />
          <Stat label="Accuracy Rate" value={`${formatRateLoose(sopCompliance.accuracyRate)}`} />
          <Stat label="Children's Guide" value={childrenGuide.available ? "Available" : "Missing"} />
        </div>
        <ul className="text-sm space-y-1 mt-2">
          <li className="flex items-center gap-2"><span className={accuracy.childrenCount ? "text-green-600" : "text-red-500"}>{accuracy.childrenCount ? "Yes" : "No"}</span>Accurate Children Count</li>
          <li className="flex items-center gap-2"><span className={accuracy.staffDetails ? "text-green-600" : "text-red-500"}>{accuracy.staffDetails ? "Yes" : "No"}</span>Accurate Staff Details</li>
          <li className="flex items-center gap-2"><span className={accuracy.serviceDescription ? "text-green-600" : "text-red-500"}>{accuracy.serviceDescription ? "Yes" : "No"}</span>Accurate Service Description</li>
        </ul>
      </Section>

      <Section title="Reg 45 Monitoring">
        <ScoreBar label="Completion" value={reg45.completionRate as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Completed" value={`${reg45.completed}/${reg45.totalExpected}`} />
          <Stat label="Ofsted Submission" value={`${formatRateLoose(reg45.ofstedSubmissionRate)}`} />
          <Stat label="Action Completion" value={`${formatRateLoose(reg45.actionCompletionRate)}`} />
          <Stat label="Children Consulted" value={`${formatRateLoose(reg45.childrenConsultedRate)}`} />
          <Stat label="Staff Consulted" value={`${formatRateLoose(reg45.staffConsultedRate)}`} />
          <Stat label="Avg Actions/Report" value={reg45.averageActionsIdentified as number} />
        </div>
        {overdueReports.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-red-600 font-medium">Overdue Reports: {overdueReports.join(", ")}</p>
          </div>
        )}
      </Section>

      <Section title="Policy Compliance">
        <ScoreBar label="Compliance" value={policyCompliance.complianceRate as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Up to Date" value={policyCompliance.upToDate as number} />
          <Stat label="Overdue" value={policyCompliance.overdue as number} />
          <Stat label="Total Policies" value={policyCompliance.totalPolicies as number} />
          <Stat label="Staff Acknowledgement" value={`${formatRateLoose(policyCompliance.averageStaffAcknowledgementRate)}`} />
        </div>
        {overdueByCategory.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-red-600 mb-1">Overdue by Category:</p>
            <ul className="text-xs text-gray-600 space-y-0.5">{overdueByCategory.map((o, i) => <li key={i}>{(o.category as string).replace(/_/g, " ")} ({o.count as number})</li>)}</ul>
          </div>
        )}
        {policiesNearingReview.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-orange-600 mb-1">Nearing Review ({policiesNearingReview.length}):</p>
            <ul className="text-xs text-gray-600 space-y-0.5">{policiesNearingReview.map((p, i) => <li key={i}>{p.policyName as string} — due {p.nextReviewDue as string}</li>)}</ul>
          </div>
        )}
      </Section>

      <Section title="Notification Compliance">
        <ScoreBar label="Timeliness" value={notificationCompliance.timelinesRate as number} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total" value={notificationCompliance.totalNotifications as number} />
          <Stat label="Within Timescale" value={notificationCompliance.withinTimescale as number} />
          <Stat label="Outside Timescale" value={notificationCompliance.outsideTimescale as number} />
          <Stat label="Avg Response (hrs)" value={notificationCompliance.averageResponseHours as number} />
          <Stat label="Ofsted Notifications" value={notificationCompliance.ofstedNotifications as number} />
        </div>
        {typeBreakdown.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium mb-1">By Type:</p>
            <ul className="text-xs text-gray-600 space-y-0.5">{typeBreakdown.map((t, i) => <li key={i}>{(t.notificationType as string).replace(/_/g, " ")} ({t.count as number})</li>)}</ul>
          </div>
        )}
      </Section>

      <Section title="Development Plan">
        <ScoreBar label="Completion" value={devPlan.completionRate as number} max={100} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          <Stat label="Total Objectives" value={devPlan.totalObjectives as number} />
          <Stat label="Completed" value={devPlan.completed as number} />
          <Stat label="In Progress" value={devPlan.inProgress as number} />
          <Stat label="Overdue" value={devPlan.overdue as number} />
          <Stat label="Not Started" value={devPlan.notStarted as number} />
          <Stat label="Avg Progress" value={`${devPlan.averageProgress}%`} />
        </div>
        {devCategories.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium mb-1">By Category:</p>
            <ul className="text-xs text-gray-600 space-y-0.5">{devCategories.map((c, i) => <li key={i}>{c.category as string} — {c.count as number} objectives, {c.avgProgress as number}% avg progress</li>)}</ul>
          </div>
        )}
      </Section>

      <Section title="Meeting Compliance">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Total Meetings" value={meetingCompliance.totalMeetings} />
          <Stat label="Staff Meetings" value={meetingCompliance.staffMeetings} />
          <Stat label="Attendance Rate" value={`${formatRateLoose(meetingCompliance.averageAttendanceRate)}`} />
          <Stat label="Minutes Recorded" value={`${formatRate(meetingCompliance.minutesRecordedRate)}`} />
          <Stat label="Avg Actions/Meeting" value={meetingCompliance.averageActionsPerMeeting} />
          <Stat label="Action Completion" value={`${formatRate(meetingCompliance.actionCompletionRate)}`} />
          <Stat label="Meetings/Month" value={meetingCompliance.meetingsPerMonth} />
        </div>
      </Section>

      <Section title="Management Presence">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="RM Avg Hours in Home" value={mgmtPresence.averageRmHoursInHome} />
          <Stat label="RM Presence Rate" value={`${formatRate(mgmtPresence.averageRmPresenceRate)}`} />
          <Stat label="DRM Avg Hours in Home" value={mgmtPresence.averageDrmHoursInHome} />
          <Stat label="Avg Child Interactions" value={mgmtPresence.averageChildInteractions} />
          <Stat label="Weeks Low Presence" value={mgmtPresence.weeksWithLowPresence} />
          <Stat label="Weeks Tracked" value={mgmtPresence.totalWeeksTracked} />
        </div>
      </Section>

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">+ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Development"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">! {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Immediate Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
