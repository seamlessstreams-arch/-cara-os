"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChildComplaintsSummary {
  childId: string;
  childName: string;
  totalComplaints: number;
  resolvedCount: number;
  advocacyAccessed: boolean;
  satisfactionPositive: boolean;
  overallScore: number;
}

interface ComplaintsData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  complaintsHandling: {
    overallScore: number;
    totalComplaints: number;
    resolvedRate: number;
    resolvedWithinTimescaleRate: number;
    advocacyOfferedRate: number;
    satisfactionRate: number;
    averageDaysToResolve: number;
  };
  advocacyAccess: {
    overallScore: number;
    totalReferrals: number;
    contactMadeRate: number;
    independentRate: number;
    childInformedRate: number;
    timelyAccessRate: number;
    ongoingSupportRate: number;
  };
  resolutionQuality: {
    overallScore: number;
    policyCurrent: boolean;
    childFriendlyVersion: boolean;
    displayedInHome: boolean;
    advocacyInfoDisplayed: boolean;
    formAccessible: boolean;
    externalContacts: boolean;
    reviewedWithChildren: boolean;
  };
  staffComplaintsReadiness: {
    overallScore: number;
    totalStaff: number;
    complaintsProcedureRate: number;
    advocacyReferralRate: number;
    childRightsRate: number;
    conflictResolutionRate: number;
    recordKeepingRate: number;
    escalationRate: number;
  };
  childSummaries: ChildComplaintsSummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ratingColour(r: string) {
  if (r === "outstanding") return "text-green-700 bg-green-50 border-green-200";
  if (r === "good") return "text-blue-700 bg-blue-50 border-blue-200";
  if (r === "requires_improvement") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function ratingLabel(r: string) {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function boolBadge(val: boolean) {
  return val
    ? "text-green-700 bg-green-50"
    : "text-red-700 bg-red-50";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ScoreBar({ label, score, max = 25 }: { label: string; score: number; max?: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const fill =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Section({
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
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
      >
        <span className="font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

export default function ComplaintsAdvocacyAccessDashboardWidget() {
  const [data, setData] = useState<ComplaintsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/complaints-advocacy-access")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-bold text-red-800 mb-2">Complaints & Advocacy Access</h2>
        <p className="text-red-600 text-sm">Failed to load data: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const rc = ratingColour(data.rating);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Complaints & Advocacy Access</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.periodStart} — {data.periodEnd}
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${rc}`}>
          <span className="text-xl font-bold">{data.overallScore}</span>
          <span>/100</span>
          <span className="ml-1">{ratingLabel(data.rating)}</span>
        </div>
      </div>

      {/* ---- Score bars ---- */}
      <div className="mb-6">
        <ScoreBar label="Complaints Handling" score={data.complaintsHandling.overallScore} />
        <ScoreBar label="Advocacy Access" score={data.advocacyAccess.overallScore} />
        <ScoreBar label="Resolution Quality" score={data.resolutionQuality.overallScore} />
        <ScoreBar label="Staff Readiness" score={data.staffComplaintsReadiness.overallScore} />
      </div>

      {/* ---- Complaints Handling detail ---- */}
      <Section title="Complaints Handling" defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Complaints" value={data.complaintsHandling.totalComplaints} />
          <Stat label="Resolved Rate" value={`${data.complaintsHandling.resolvedRate}%`} />
          <Stat label="Within Timescale" value={`${data.complaintsHandling.resolvedWithinTimescaleRate}%`} />
          <Stat label="Advocacy Offered" value={`${data.complaintsHandling.advocacyOfferedRate}%`} />
          <Stat label="Satisfaction" value={`${data.complaintsHandling.satisfactionRate}%`} />
          <Stat label="Avg Days to Resolve" value={data.complaintsHandling.averageDaysToResolve} />
        </div>
      </Section>

      {/* ---- Advocacy Access detail ---- */}
      <Section title="Advocacy Access">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Referrals" value={data.advocacyAccess.totalReferrals} />
          <Stat label="Contact Made" value={`${data.advocacyAccess.contactMadeRate}%`} />
          <Stat label="Independent" value={`${data.advocacyAccess.independentRate}%`} />
          <Stat label="Child Informed" value={`${data.advocacyAccess.childInformedRate}%`} />
          <Stat label="Timely Access" value={`${data.advocacyAccess.timelyAccessRate}%`} />
          <Stat label="Ongoing Support" value={`${data.advocacyAccess.ongoingSupportRate}%`} />
        </div>
      </Section>

      {/* ---- Resolution Quality detail ---- */}
      <Section title="Resolution Quality (Policy)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Policy Current", val: data.resolutionQuality.policyCurrent },
            { label: "Child-Friendly", val: data.resolutionQuality.childFriendlyVersion },
            { label: "Displayed in Home", val: data.resolutionQuality.displayedInHome },
            { label: "Advocacy Info", val: data.resolutionQuality.advocacyInfoDisplayed },
            { label: "Form Accessible", val: data.resolutionQuality.formAccessible },
            { label: "External Contacts", val: data.resolutionQuality.externalContacts },
            { label: "Reviewed w/ Children", val: data.resolutionQuality.reviewedWithChildren },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
              <div className={`text-sm font-bold px-2 py-0.5 rounded-full ${boolBadge(item.val)}`}>
                {item.val ? "Yes" : "No"}
              </div>
              <div className="text-xs text-gray-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Staff Readiness detail ---- */}
      <Section title="Staff Complaints Readiness">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total Staff" value={data.staffComplaintsReadiness.totalStaff} />
          <Stat label="Procedure" value={`${data.staffComplaintsReadiness.complaintsProcedureRate}%`} />
          <Stat label="Advocacy Referral" value={`${data.staffComplaintsReadiness.advocacyReferralRate}%`} />
          <Stat label="Child Rights" value={`${data.staffComplaintsReadiness.childRightsRate}%`} />
          <Stat label="Conflict Resolution" value={`${data.staffComplaintsReadiness.conflictResolutionRate}%`} />
          <Stat label="Record Keeping" value={`${data.staffComplaintsReadiness.recordKeepingRate}%`} />
          <Stat label="Escalation" value={`${data.staffComplaintsReadiness.escalationRate}%`} />
        </div>
      </Section>

      {/* ---- Child Profiles ---- */}
      {data.childSummaries.length > 0 && (
        <Section title="Child Complaints Profiles">
          <div className="space-y-3">
            {data.childSummaries.map((cs) => (
              <div key={cs.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-800">{cs.childName}</span>
                  <span className="text-sm font-semibold text-gray-600">{cs.overallScore}/10</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                  <span>Complaints: {cs.totalComplaints}</span>
                  <span>Resolved: {cs.resolvedCount}</span>
                  <span>Advocacy: {cs.advocacyAccessed ? "Yes" : "No"}</span>
                  <span>Satisfied: {cs.satisfactionPositive ? "Yes" : "No"}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---- Strengths ---- */}
      {data.strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-800 flex gap-2">
                <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Areas for improvement ---- */}
      {data.areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement">
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-sm text-amber-800 flex gap-2">
                <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Actions ---- */}
      {data.actions.length > 0 && (
        <Section title="Actions" defaultOpen>
          <ul className="space-y-1">
            {data.actions.map((a, i) => (
              <li
                key={i}
                className={`text-sm flex gap-2 ${
                  a.startsWith("URGENT") ? "text-red-800 font-semibold" : "text-gray-700"
                }`}
              >
                <span
                  className={`shrink-0 mt-1 h-1.5 w-1.5 rounded-full ${
                    a.startsWith("URGENT") ? "bg-red-500" : "bg-gray-400"
                  }`}
                />
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Regulatory Links ---- */}
      <Section title="Regulatory Links">
        <ul className="space-y-1">
          {data.regulatoryLinks.map((l, i) => (
            <li key={i} className="text-sm text-gray-600 flex gap-2">
              <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
              {l}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
