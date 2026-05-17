// ══════════════════════════════════════════════════════════════════════════════
// ParticipationDashboardWidget — Children's Voice & Advocacy dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ChildStatus {
  childId: string;
  childName: string;
  participationScore: number;
  isCompliant: boolean;
  entriesLast30Days: number;
  viewsActedUponRate: number;
  issues: string[];
}

interface RecentMeeting {
  id: string;
  date: string;
  attendanceRate: number;
  childSuggestedItems: number;
  actionsCompleted: number;
  actionsTotal: number;
}

interface RecentFeedback {
  id: string;
  type: string;
  acknowledged: boolean;
  anonymous: boolean;
  date: string;
}

interface Metrics {
  overallParticipationScore: number;
  advocacyAccessRate: number;
  complaintsAwarenessRate: number;
  rightsExplainedRate: number;
  houseMeetingFrequency: number;
  houseMeetingAttendanceRate: number;
  actionCompletionRate: number;
  childSuggestedItemsRate: number;
  viewsActedUponRate: number;
  feedbackCount30Days: number;
  feedbackAcknowledgedRate: number;
}

interface DashboardData {
  metrics: Metrics;
  children: ChildStatus[];
  recentMeetings: RecentMeeting[];
  recentFeedback: RecentFeedback[];
  complianceIssues: string[];
}

interface Props {
  homeId?: string;
}

export function ParticipationDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/participation?homeId=${homeId}&mode=dashboard`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-36 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, children, recentMeetings, recentFeedback, complianceIssues } = data;

  const scoreColor = metrics.overallParticipationScore >= 80
    ? "text-emerald-600 dark:text-emerald-400"
    : metrics.overallParticipationScore >= 60
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Children&apos;s Voice</h3>
              <p className="text-xs text-muted-foreground">Participation & advocacy</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${scoreColor}`}>
              {metrics.overallParticipationScore}%
            </p>
            <p className="text-[10px] text-muted-foreground">score</p>
          </div>
        </div>
      </div>

      {/* Key rates */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.advocacyAccessRate === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.advocacyAccessRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Advocacy</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.viewsActedUponRate >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.viewsActedUponRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Views heard</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold">{metrics.houseMeetingFrequency}/mo</p>
          <p className="text-[10px] text-muted-foreground">Meetings</p>
        </div>
      </div>

      {/* Child participation scores */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Per Child</p>
        </div>
        <div className="px-4 py-2 space-y-2">
          {children.map(child => (
            <div key={child.childId}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[11px] font-medium">{child.childName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{child.entriesLast30Days} entries</span>
                  {!child.isCompliant && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 font-medium">
                      Issues
                    </span>
                  )}
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    child.participationScore >= 80
                      ? "bg-emerald-500"
                      : child.participationScore >= 60
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${child.participationScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent meetings */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Recent House Meetings</p>
        </div>
        <div className="px-4 py-2 space-y-1.5">
          {recentMeetings.map(meeting => (
            <div key={meeting.id} className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                {new Date(meeting.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {meeting.attendanceRate}% attended
                </span>
                <span className={`font-medium ${meeting.actionsCompleted === meeting.actionsTotal ? "text-emerald-600" : "text-amber-600"}`}>
                  {meeting.actionsCompleted}/{meeting.actionsTotal} actions
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback summary */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Feedback (30 days)</span>
          <span className="font-medium">{metrics.feedbackCount30Days} items</span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Acknowledged</span>
          <span className={`font-medium ${metrics.feedbackAcknowledgedRate >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.feedbackAcknowledgedRate}%
          </span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Rights explained</span>
          <span className={`font-medium ${metrics.rightsExplainedRate === 100 ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.rightsExplainedRate}%
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Complaints process aware</span>
          <span className={`font-medium ${metrics.complaintsAwarenessRate === 100 ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.complaintsAwarenessRate}%
          </span>
        </div>
      </div>

      {/* Compliance issues */}
      {complianceIssues.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50 dark:bg-red-950/20">
          <p className="text-[10px] font-medium text-red-700 dark:text-red-400 mb-1">Compliance Issues</p>
          {complianceIssues.map((issue, i) => (
            <p key={i} className="text-[10px] text-red-600 dark:text-red-400">
              {issue}
            </p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/participation" className="text-xs text-primary font-medium hover:underline">
          View participation records →
        </a>
      </div>
    </div>
  );
}
