"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { PostIncidentReflectionAnalysis, IncidentReflection, SignalColour } from "@/lib/cara-visual-toolkit/types";

import { EmptyState } from "@/components/ui/empty-state";
async function fetchPostIncidentReflection(): Promise<PostIncidentReflectionAnalysis> {
  const res = await fetch("/api/v1/cara-toolkit/post-incident-reflection");
  if (!res.ok) throw new Error("Failed to fetch post-incident reflection data");
  const json = await res.json();
  return json.data as PostIncidentReflectionAnalysis;
}

function useCaraToolkitPostIncidentReflection() {
  return useQuery({
    queryKey: ["cara-toolkit-post-incident-reflection"],
    queryFn: fetchPostIncidentReflection,
    staleTime: 120_000,
  });
}

const SIGNAL_DOT: Record<SignalColour, string> = {
  green: "bg-green-400",
  amber: "bg-amber-400",
  red:   "bg-red-400",
  grey:  "bg-slate-300",
};

const SEV_PILL: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high:     "bg-orange-100 text-orange-700",
  medium:   "bg-amber-100 text-amber-700",
  low:      "bg-green-100 text-green-700",
  unknown:  "bg-slate-100 text-slate-500",
};

function ReflectionCard({ reflection }: { reflection: IncidentReflection }) {
  const isOverdue = !reflection.hasDebrief;
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 ${
        isOverdue
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-400">{reflection.incidentRef}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEV_PILL[reflection.severity] ?? SEV_PILL.unknown}`}>
          {reflection.severity}
        </span>
        <span className="text-xs text-slate-500 capitalize">{reflection.incidentType.replace(/_/g, " ")}</span>
        <span className="text-xs text-slate-400 ml-auto">{reflection.incidentDate}</span>
      </div>

      {/* Debrief status */}
      {reflection.hasDebrief ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs font-medium text-green-700">
              Debriefed {reflection.debriefDate}
              {reflection.daysToDebrief !== null && ` (${reflection.daysToDebrief}d after incident)`}
            </span>
          </div>

          {reflection.whatHappened && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">What happened</p>
              <p className="text-sm text-slate-700 leading-relaxed">{reflection.whatHappened}</p>
            </div>
          )}
          {reflection.whatWorkedWell && (
            <div className="rounded-lg bg-green-50 border border-green-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-0.5">What worked well</p>
              <p className="text-sm text-green-800 leading-relaxed">{reflection.whatWorkedWell}</p>
            </div>
          )}
          {reflection.whatCouldImprove && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-0.5">What could improve</p>
              <p className="text-sm text-amber-800 leading-relaxed">{reflection.whatCouldImprove}</p>
            </div>
          )}
          {reflection.childPerspective && (
            <div className="rounded-lg bg-sky-50 border border-sky-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 mb-0.5">Child&apos;s perspective</p>
              <p className="text-sm text-sky-800 leading-relaxed">{reflection.childPerspective}</p>
            </div>
          )}
          {reflection.changesNeeded && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Changes needed</p>
              <p className="text-sm text-slate-700 leading-relaxed">{reflection.changesNeeded}</p>
            </div>
          )}
          {reflection.followUpActions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Follow-up actions</p>
              <ul className="flex flex-col gap-1">
                {reflection.followUpActions.map((a, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reflection.staffWellbeing && (
            <div className="rounded-lg bg-violet-50 border border-violet-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 mb-0.5">Staff wellbeing</p>
              <p className="text-sm text-violet-800 leading-relaxed">{reflection.staffWellbeing}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <p className="text-sm text-amber-700">No debrief recorded for this incident.</p>
        </div>
      )}
    </div>
  );
}

export default function PostIncidentReflectionPage() {
  const { data, isLoading, error } = useCaraToolkitPostIncidentReflection();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Loading post-incident reflections…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load post-incident reflection data.</div>;

  const signal = SIGNAL_DOT[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Post-Incident Reflection</span>
      </nav>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2.5 h-2.5 rounded-full ${signal}`} />
          <h1 className="text-2xl font-bold text-slate-900">Post-Incident Reflection Tool</h1>
        </div>
        <p className="text-sm text-slate-600">
          What happened, what can we learn, and what will change? Debriefs support staff wellbeing and organisational learning after every significant incident.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{data.totalIncidents}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total incidents</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className={`text-2xl font-bold ${(data.debriefCompletionRate ?? 0) >= 75 ? "text-green-700" : "text-amber-700"}`}>
            {data.debriefCompletionRate}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Debrief rate</p>
        </div>
        <div className={`rounded-xl border p-3 text-center shadow-sm ${data.overdueDebriefs > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
          <p className={`text-2xl font-bold ${data.overdueDebriefs > 0 ? "text-amber-700" : "text-slate-800"}`}>{data.overdueDebriefs}</p>
          <p className="text-xs text-slate-500 mt-0.5">Overdue debriefs</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">
            {data.avgDaysToDebrief !== null ? `${data.avgDaysToDebrief}d` : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Avg time to debrief</p>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cara insights</h2>
          <div className="flex flex-col gap-3">
            {data.insights.map((insight, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900 mr-2">Cara:</span>
                {insight}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reflections list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Incidents & reflections ({data.totalIncidents})
        </h2>
        {data.reflections.length === 0 ? (
          <EmptyState compact title="No incidents recorded yet." />
        ) : (
          <div className="flex flex-col gap-4">
            {data.reflections.map((r) => (
              <ReflectionCard key={r.incidentId} reflection={r} />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Post-incident reflection supports staff wellbeing and team learning. It does not replace formal investigation or notification obligations. Managers remain professionally accountable for all decisions.
      </div>
    </div>
  );
}
