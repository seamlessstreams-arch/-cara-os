"use client";

import { useQuery } from "@tanstack/react-query";

// ── Types ─────────────────────────────────────────────────────────────────────

type IncidentIntensity = "low" | "medium" | "high" | "severe";
type LinkType = "direct_trigger" | "post_contact_window";
type ContactSafeguardingSignal = "concern" | "attention" | "stable";

type ContactLinkedBehaviour = {
  id: string;
  date: string;
  title: string;
  direction: string;
  intensity: IncidentIntensity;
  trigger: string;
  antecedent: string;
  outcome: string;
  linkType: LinkType;
};

type ConcernedContactSession = {
  id: string;
  date: string;
  familyMember: string;
  concerns: string[];
  wasSafe: boolean;
};

type ChildContactSafeguardingProfile = {
  childId: string;
  childName: string;
  signal: ContactSafeguardingSignal;
  contactLinkedBehaviours: ContactLinkedBehaviour[];
  concernedContactSessions: ConcernedContactSession[];
  daysSinceLastContact: number | null;
  dominantPattern: string | null;
  highestSeverity: IncidentIntensity | null;
};

type ContactSafeguardingSummary = {
  totalChildrenInScope: number;
  totalContactLinkedIncidents: number;
  childrenWithConcern: number;
  childrenWithAttention: number;
  overallSignal: ContactSafeguardingSignal;
};

type ContactSafeguardingResponse = {
  profiles: ChildContactSafeguardingProfile[];
  summary: ContactSafeguardingSummary;
};

async function fetchContactSafeguardingIntelligence(): Promise<ContactSafeguardingResponse> {
  const res = await fetch("/api/v1/contact-safeguarding-intelligence");
  if (!res.ok) throw new Error("Failed to fetch contact safeguarding intelligence");
  const json = await res.json();
  return json.data as ContactSafeguardingResponse;
}

// ── Signal helpers ────────────────────────────────────────────────────────────

type Signal = "concern" | "attention" | "stable";

const SIGNAL_STYLES: Record<Signal, string> = {
  concern: "bg-red-100 text-red-800 border border-red-200",
  attention: "bg-amber-100 text-amber-800 border border-amber-200",
  stable: "bg-green-100 text-green-800 border border-green-200",
};

const SIGNAL_LABELS: Record<Signal, string> = {
  concern: "Concern",
  attention: "Attention",
  stable: "Stable",
};

const INTENSITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  severe: "bg-red-100 text-red-700",
};

function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SIGNAL_STYLES[signal]}`}
    >
      {SIGNAL_LABELS[signal]}
    </span>
  );
}

function IntensityBadge({ intensity }: { intensity: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${INTENSITY_STYLES[intensity] ?? "bg-slate-100 text-slate-600"}`}
    >
      {intensity}
    </span>
  );
}

function LinkTypeBadge({ linkType }: { linkType: string }) {
  if (linkType === "direct_trigger") {
    return (
      <span className="text-xs text-rose-600 font-medium">
        Direct trigger
      </span>
    );
  }
  return (
    <span className="text-xs text-amber-600 font-medium">
      Post-contact window
    </span>
  );
}

// ── Behaviour row ─────────────────────────────────────────────────────────────

function BehaviourRow({ b }: { b: ContactLinkedBehaviour }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-slate-800 leading-snug">
          {b.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <IntensityBadge intensity={b.intensity} />
          <LinkTypeBadge linkType={b.linkType} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>{b.date}</span>
        {b.trigger && (
          <>
            <span>·</span>
            <span className="text-slate-600 italic">{b.trigger}</span>
          </>
        )}
      </div>
      {b.antecedent && (
        <p className="text-xs text-slate-600 mt-0.5">
          <span className="font-medium">Antecedent: </span>
          {b.antecedent}
        </p>
      )}
      {b.outcome && (
        <p className="text-xs text-slate-500 mt-0.5">{b.outcome}</p>
      )}
    </div>
  );
}

// ── Session concern row ───────────────────────────────────────────────────────

function SessionConcernRow({ s }: { s: ConcernedContactSession }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-amber-900">
          {s.familyMember}
        </span>
        <span className="text-xs text-amber-700">{s.date}</span>
      </div>
      {!s.wasSafe && (
        <p className="text-xs font-semibold text-red-700">
          Session recorded as not safe
        </p>
      )}
      {s.concerns.length > 0 && (
        <ul className="list-disc list-inside space-y-0.5 mt-0.5">
          {s.concerns.map((c, i) => (
            <li key={i} className="text-xs text-amber-800">
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildContactCard({ profile }: { profile: ChildContactSafeguardingProfile }) {
  const concerning = profile.contactLinkedBehaviours.filter(
    (b) => b.direction === "concerning"
  );
  const hasBehaviours = profile.contactLinkedBehaviours.length > 0;
  const hasSessions = profile.concernedContactSessions.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">
            {profile.childName}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            {profile.daysSinceLastContact !== null && (
              <span className="text-xs text-slate-500">
                Last contact {profile.daysSinceLastContact === 0
                  ? "today"
                  : `${profile.daysSinceLastContact}d ago`}
              </span>
            )}
            {profile.dominantPattern && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-600 italic">
                  {profile.dominantPattern}
                </span>
              </>
            )}
          </div>
        </div>
        <SignalBadge signal={profile.signal as Signal} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{concerning.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Contact-linked incidents</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">
            {profile.concernedContactSessions.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Sessions with concerns</p>
        </div>
      </div>

      {/* Contact-linked behaviours */}
      {hasBehaviours && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Contact-linked behaviour
          </h4>
          <div className="flex flex-col gap-2">
            {profile.contactLinkedBehaviours
              .filter((b) => b.direction === "concerning")
              .slice(0, 4)
              .map((b) => (
                <BehaviourRow key={b.id} b={b} />
              ))}
          </div>
        </div>
      )}

      {/* Session concerns */}
      {hasSessions && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Session concerns
          </h4>
          <div className="flex flex-col gap-2">
            {profile.concernedContactSessions.map((s) => (
              <SessionConcernRow key={s.id} s={s} />
            ))}
          </div>
        </div>
      )}

      {!hasBehaviours && !hasSessions && (
        <p className="text-sm text-slate-500 italic">
          No contact-linked incidents or session concerns recorded.
        </p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContactSafeguardingIntelligencePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["contact-safeguarding-intelligence"],
    queryFn: fetchContactSafeguardingIntelligence,
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 text-sm">
        Loading contact safeguarding intelligence…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-red-600 text-sm">
        Unable to load contact safeguarding intelligence.
      </div>
    );
  }

  const { profiles, summary } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Contact Safeguarding Intelligence
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cross-references family contact events with post-contact behaviour
            incidents to surface safeguarding patterns and inform contact
            planning.
          </p>
        </div>
        <SignalBadge signal={summary.overallSignal as Signal} />
      </div>

      {/* Regulatory callout */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-1">
        <p className="font-semibold">Regulatory & practice context</p>
        <p>
          CHR 2015 Reg 9 requires contact arrangements to promote children's
          welfare. Working Together 2023 requires practitioners to consider
          whether family contact creates or compounds harm. This intelligence
          supports evidence-based contact review — not contact restriction.
          Contact decisions remain with the allocated social worker and IRO.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-slate-800">
            {summary.totalContactLinkedIncidents}
          </p>
          <p className="text-xs text-slate-500 mt-1">Contact-linked incidents</p>
        </div>
        <div
          className={`rounded-xl border p-4 text-center shadow-sm ${
            summary.childrenWithConcern > 0
              ? "border-red-200 bg-red-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-3xl font-bold ${
              summary.childrenWithConcern > 0 ? "text-red-700" : "text-slate-800"
            }`}
          >
            {summary.childrenWithConcern}
          </p>
          <p className="text-xs text-slate-500 mt-1">Children — concern</p>
        </div>
        <div
          className={`rounded-xl border p-4 text-center shadow-sm ${
            summary.childrenWithAttention > 0
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-3xl font-bold ${
              summary.childrenWithAttention > 0
                ? "text-amber-700"
                : "text-slate-800"
            }`}
          >
            {summary.childrenWithAttention}
          </p>
          <p className="text-xs text-slate-500 mt-1">Children — attention</p>
        </div>
      </div>

      {/* Child cards */}
      <div className="flex flex-col gap-6">
        {profiles.map((profile) => (
          <ChildContactCard key={profile.childId} profile={profile} />
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
          No contact or behaviour data found.
        </div>
      )}
    </div>
  );
}
