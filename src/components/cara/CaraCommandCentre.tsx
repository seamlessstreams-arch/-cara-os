"use client";

import { useMemo, useState } from "react";
import { Brain, ShieldCheck, Sparkles, AlertTriangle, CheckCircle2, FileSearch, Wand2, XCircle } from "lucide-react";
import { useCara } from "@/hooks/useCara";
import type { CaraRoleMode } from "@/lib/cara/types";

type Props = {
  homeId: string;
  childId?: string | null;
  userId: string;
  defaultRoleMode?: CaraRoleMode;
};

const roleModes: { value: CaraRoleMode; label: string }[] = [
  { value: "practitioner", label: "Practitioner" },
  { value: "senior", label: "Senior" },
  { value: "deputy_manager", label: "Deputy Manager" },
  { value: "registered_manager", label: "Registered Manager" },
  { value: "responsible_individual", label: "Responsible Individual" },
  { value: "operations", label: "Operations" },
  { value: "director", label: "Director" },
  { value: "ofsted_mock", label: "Mock Ofsted" },
];

const quickPrompts = [
  "What risks or patterns need management review?",
  "What evidence is missing for Ofsted readiness?",
  "What does the golden thread show for this child?",
  "Create a manager oversight draft based on the evidence.",
  "What key work or therapeutic intervention would help next?",
  "What records may need updating from the latest incidents?",
];

export function CaraCommandCentre({
  homeId,
  childId,
  userId,
  defaultRoleMode = "registered_manager",
}: Props) {
  const [question, setQuestion] = useState(quickPrompts[0]);
  const [roleMode, setRoleMode] = useState<CaraRoleMode>(defaultRoleMode);
  const [includeStaff, setIncludeStaff] = useState(false);
  const { loading, error, output, aiRunId, askCara, reviewCara } = useCara(userId);
  const [reviewing, setReviewing] = useState(false);

  const confidenceLabel = useMemo(() => {
    if (!output) return null;
    if (output.confidence >= 80) return "Strong evidence base";
    if (output.confidence >= 55) return "Moderate evidence base";
    return "Limited evidence base";
  }, [output]);

  async function handleAsk() {
    await askCara({
      homeId,
      childId,
      roleMode,
      featureKey: "cara_command_centre",
      userQuestion: question,
      strictEvidenceMode: true,
      includeTherapeuticLens: true,
      includeOfstedLens: true,
      includeStaffDevelopmentLens: includeStaff,
    });
  }

  async function handleReview(action: "approve" | "reject") {
    if (!aiRunId) return;
    setReviewing(true);
    try {
      await reviewCara({
        homeId,
        aiRunId,
        action,
        notes: action === "approve" ? "Approved from Cara Command Centre." : undefined,
        reason: action === "reject" ? "Rejected from Cara Command Centre." : undefined,
      });
    } finally {
      setReviewing(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-slate-100 p-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Cara Intelligence</h2>
              <p className="text-sm text-slate-600">
                Critical friend, evidence engine and inspection-readiness support.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1">Human approval required</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">Evidence-backed</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">Child voice protected</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl bg-slate-50 p-4">
          <label className="text-sm font-medium">Mode</label>
          <select
            className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm"
            value={roleMode}
            onChange={(e) => setRoleMode(e.target.value as CaraRoleMode)}
          >
            {roleModes.map((mode) => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeStaff}
              onChange={(e) => setIncludeStaff(e.target.checked)}
            />
            Include staff development lens
          </label>

          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium">Fast prompts</p>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuestion(prompt)}
                className="w-full rounded-xl border bg-white px-3 py-2 text-left text-xs hover:bg-slate-100"
              >
                {prompt}
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          <div className="rounded-2xl border p-4">
            <label className="text-sm font-medium">Ask Cara</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-2 min-h-[110px] w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Ask about risk, oversight, Ofsted evidence, key work, staff support or golden thread..."
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Cara drafts only. A manager must review and approve before records are committed.
              </p>
              <button
                type="button"
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <Wand2 className="h-4 w-4" />
                {loading ? "Thinking..." : "Run Cara"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {output && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Brain className="h-4 w-4" /> Confidence
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{output.confidence}%</p>
                  <p className="text-xs text-slate-500">{confidenceLabel}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileSearch className="h-4 w-4" /> Evidence
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{output.evidenceUsed.length}</p>
                  <p className="text-xs text-slate-500">Linked records used</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4" /> Governance
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {output.managementOversightRequired ? "Manager review required" : "Review still required"}
                  </p>
                  <p className="text-xs text-slate-500">AI cannot commit decisions</p>
                </div>
              </div>

              {output.safetyFlags.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 font-medium text-amber-800">
                    <AlertTriangle className="h-4 w-4" /> Safety flags
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
                    {output.safetyFlags.map((flag) => <li key={flag}>{flag}</li>)}
                  </ul>
                </div>
              )}

              <article className="rounded-2xl border p-5">
                <h3 className="font-semibold">Cara draft</h3>
                {output.executiveSummary && (
                  <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                    {output.executiveSummary}
                  </p>
                )}
                <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {output.answer}
                </div>
              </article>

              {output.nextBestActions.length > 0 && (
                <div className="rounded-2xl border p-5">
                  <h3 className="font-semibold">Next best actions</h3>
                  <div className="mt-3 space-y-2">
                    {output.nextBestActions.map((action) => (
                      <div key={`${action.title}-${action.ownerRole}`} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-slate-600">
                          {action.ownerRole} &middot; {action.duePriority.replace("_", " ")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{action.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {output.evidenceUsed.length > 0 && (
                <div className="rounded-2xl border p-5">
                  <h3 className="font-semibold">Show me the evidence</h3>
                  <div className="mt-3 space-y-2">
                    {output.evidenceUsed.slice(0, 10).map((item) => (
                      <details key={`${item.sourceTable}-${item.sourceId}`} className="rounded-xl bg-slate-50 p-3">
                        <summary className="cursor-pointer text-sm font-medium">
                          {item.sourceTitle ?? item.sourceTable} &middot; {item.sourceDate ?? "No date"}
                        </summary>
                        <p className="mt-2 text-xs leading-5 text-slate-600">{item.sourceExcerpt}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {output.practicePrompts.length > 0 && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <h3 className="font-semibold text-green-800">Practice prompts</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-green-800">
                    {output.practicePrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 rounded-2xl border p-4">
                <button
                  type="button"
                  disabled={reviewing || !aiRunId}
                  onClick={() => handleReview("approve")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve draft
                </button>
                <button
                  type="button"
                  disabled={reviewing || !aiRunId}
                  onClick={() => handleReview("reject")}
                  className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
                <p className="w-full text-xs text-slate-500">
                  Approval is recorded in the AI governance audit trail.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
