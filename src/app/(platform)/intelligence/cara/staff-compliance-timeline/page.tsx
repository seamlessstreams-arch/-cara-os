"use client";

import {
  useStaffComplianceTimelineIntelligence,
  type StaffComplianceProfile,
  type StaffComplianceSignal,
} from "@/hooks/use-staff-compliance-timeline-intelligence";

const SIGNAL_CONFIG: Record<
  StaffComplianceSignal,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  urgent: {
    label: "Urgent",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  attention: {
    label: "Attention",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  due_soon: {
    label: "Due soon",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  good: {
    label: "Good",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
  },
};

const HOME_SIGNAL_BG: Record<StaffComplianceSignal, string> = {
  urgent: "bg-red-50 border-red-300",
  attention: "bg-amber-50 border-amber-300",
  due_soon: "bg-blue-50 border-blue-300",
  good: "bg-green-50 border-green-300",
};

const HOME_SIGNAL_TEXT: Record<StaffComplianceSignal, string> = {
  urgent: "text-red-800",
  attention: "text-amber-800",
  due_soon: "text-blue-800",
  good: "text-green-800",
};

const HOME_SIGNAL_LABEL: Record<StaffComplianceSignal, string> = {
  urgent: "Urgent compliance gaps",
  attention: "Compliance attention needed",
  due_soon: "Actions due soon",
  good: "All compliance up to date",
};

function DbsChip({ ageMonths, hasUpdateService, renewalDue, renewalOverdue }: {
  ageMonths: number;
  hasUpdateService: boolean;
  renewalDue: boolean;
  renewalOverdue: boolean;
}) {
  if (hasUpdateService) {
    return (
      <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
        DBS {ageMonths}m · Update Service ✓
      </span>
    );
  }
  if (renewalOverdue) {
    return (
      <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 font-semibold">
        DBS {ageMonths}m · Renewal overdue
      </span>
    );
  }
  if (renewalDue) {
    return (
      <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-medium">
        DBS {ageMonths}m · Renewal approaching
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
      DBS {ageMonths}m
    </span>
  );
}

function StatusRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${highlight ? "text-red-700" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}

function StaffCard({ profile }: { profile: StaffComplianceProfile }) {
  const cfg = SIGNAL_CONFIG[profile.signal];
  const { supervision, appraisal, probation, dbs } = profile;

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{profile.name}</p>
          <p className="text-xs text-gray-500">{profile.jobTitle}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text} flex items-center gap-1 whitespace-nowrap`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      <div className="space-y-1">
        <DbsChip
          ageMonths={dbs.ageMonths}
          hasUpdateService={dbs.hasUpdateService}
          renewalDue={dbs.renewalDue}
          renewalOverdue={dbs.renewalOverdue}
        />
      </div>

      <div className="space-y-1 border-t border-gray-200 pt-2">
        <StatusRow
          label="Supervision due"
          value={
            supervision.overdue
              ? `Overdue by ${Math.abs(supervision.daysUntilDue ?? 0)}d`
              : supervision.nextDue
              ? `In ${supervision.daysUntilDue}d (${supervision.nextDue})`
              : "Not scheduled"
          }
          highlight={supervision.overdue || !supervision.nextDue}
        />
        <StatusRow
          label="Appraisal due"
          value={
            appraisal.overdue
              ? `Overdue by ${Math.abs(appraisal.daysUntilDue ?? 0)}d`
              : appraisal.notScheduled
              ? profile.employmentType === "bank" ? "N/A (bank)" : "Not scheduled"
              : `In ${appraisal.daysUntilDue}d (${appraisal.nextDue})`
          }
          highlight={appraisal.overdue || (appraisal.notScheduled && profile.employmentType !== "bank")}
        />
        {probation.onProbation && (
          <StatusRow
            label="Probation ends"
            value={`${probation.daysRemaining}d (${probation.endDate})`}
            highlight={probation.endingSoon}
          />
        )}
      </div>

      {profile.issues.length > 0 && (
        <div className="space-y-1 border-t border-gray-200 pt-2">
          {profile.issues.map((issue, i) => {
            const isUrgent = issue.startsWith("URGENT");
            const isAttention = issue.startsWith("ATTENTION");
            const text = issue.replace(/^(URGENT|ATTENTION|DUE):\s*/, "");
            return (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <span className={`mt-0.5 ${isUrgent ? "text-red-500" : isAttention ? "text-amber-500" : "text-blue-500"}`}>●</span>
                <span className={isUrgent ? "text-red-700 font-medium" : isAttention ? "text-amber-700" : "text-blue-700"}>
                  {text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StaffComplianceTimelinePage() {
  const { data, isLoading, error } = useStaffComplianceTimelineIntelligence();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-72 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="p-6 text-red-600">Failed to load staff compliance timeline.</div>
    );
  }

  const { staff, summary } = data.data;
  const needsAction = staff.filter((s) => s.signal !== "good");
  const goodStanding = staff.filter((s) => s.signal === "good");

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Compliance Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          DBS renewal, supervision schedule, appraisal deadlines, and probation milestones
          across the whole team.
        </p>
      </div>

      {/* Home summary banner */}
      <div className={`rounded-lg border px-5 py-4 ${HOME_SIGNAL_BG[summary.signal]}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className={`font-semibold ${HOME_SIGNAL_TEXT[summary.signal]}`}>
              {HOME_SIGNAL_LABEL[summary.signal]}
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              {summary.totalActiveStaff} active staff members tracked
            </p>
          </div>
          <div className="flex gap-5 text-sm">
            <div className="text-center">
              <p className={`font-bold text-xl ${summary.supervisionOverdue > 0 ? "text-red-700" : "text-gray-900"}`}>
                {summary.supervisionOverdue}
              </p>
              <p className="text-gray-500 text-xs">Supervision overdue</p>
            </div>
            <div className="text-center">
              <p className={`font-bold text-xl ${summary.appraisalOverdue > 0 ? "text-amber-700" : "text-gray-900"}`}>
                {summary.appraisalOverdue}
              </p>
              <p className="text-gray-500 text-xs">Appraisal overdue</p>
            </div>
            <div className="text-center">
              <p className={`font-bold text-xl ${summary.dbsRenewalDue > 0 ? "text-amber-700" : "text-gray-900"}`}>
                {summary.dbsRenewalDue}
              </p>
              <p className="text-gray-500 text-xs">DBS renewal due</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-gray-900">{summary.onProbation}</p>
              <p className="text-gray-500 text-xs">On probation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff needing action */}
      {needsAction.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Requires action ({needsAction.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {needsAction.map((profile) => (
              <StaffCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        </section>
      )}

      {/* Good standing */}
      {goodStanding.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Good standing ({goodStanding.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {goodStanding.map((profile) => (
              <StaffCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        </section>
      )}

      {/* Regulatory note */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-xs text-gray-600 space-y-1">
        <p className="font-semibold text-gray-700">Regulatory basis</p>
        <p>
          <strong>CHR 2015 Reg 33:</strong> The registered person must ensure every member of
          staff receives regular, recorded supervision from a person with appropriate experience.
          Frequency should reflect role and experience — at least monthly for residential care workers.
        </p>
        <p>
          <strong>CHR 2015 Reg 34:</strong> All staff must have an annual appraisal covering
          performance, training needs, and development goals.
        </p>
        <p>
          <strong>Safer Recruitment:</strong> DBS certificates without the Update Service should
          be renewed every 3 years. Those on the Update Service are valid indefinitely subject to
          annual status checks.
        </p>
      </div>
    </div>
  );
}
