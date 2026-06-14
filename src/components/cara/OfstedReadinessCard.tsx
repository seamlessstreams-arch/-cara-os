"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";

type Props = {
  homeId: string;
  userId: string;
};

type Snapshot = {
  overall_score: number;
  leadership_score: number;
  care_score: number;
  safeguarding_score: number;
  workforce_score: number;
  child_voice_score: number;
  missing_evidence: string[];
  priority_actions: Array<{ title: string; ownerRole: string; duePriority: string; rationale: string }>;
};

export function OfstedReadinessCard({ homeId, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cara/ofsted-readiness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ homeId }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Failed to generate readiness snapshot.");
      setSnapshot(json.snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-2">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Live Ofsted Readiness</h2>
            <p className="text-sm text-slate-600">Evidence strength, gaps and priority actions.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" /> {loading ? "Checking..." : "Refresh"}
        </button>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {snapshot ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-6">
            <Score label="Overall" value={snapshot.overall_score} large />
            <Score label="Leadership" value={snapshot.leadership_score} />
            <Score label="Care" value={snapshot.care_score} />
            <Score label="Safeguarding" value={snapshot.safeguarding_score} />
            <Score label="Workforce" value={snapshot.workforce_score} />
            <Score label="Child voice" value={snapshot.child_voice_score} />
          </div>

          {snapshot.missing_evidence?.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4" /> Missing or weaker evidence
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
                {snapshot.missing_evidence.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}

          {snapshot.priority_actions?.length > 0 && (
            <div className="rounded-2xl border p-4">
              <h3 className="font-medium">Priority actions</h3>
              <div className="mt-3 space-y-2">
                {snapshot.priority_actions.map((action) => (
                  <div key={action.title} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-slate-600">{action.ownerRole} &middot; {action.duePriority}</p>
                    <p className="mt-1 text-xs text-slate-500">{action.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Generate a snapshot to see how inspection-ready this home is today.
        </p>
      )}
    </section>
  );
}

function Score({ label, value, large = false }: { label: string; value: number; large?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${large ? "md:col-span-1" : ""}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`${large ? "text-3xl" : "text-2xl"} mt-1 font-semibold`}>{Math.round(value)}%</p>
    </div>
  );
}
