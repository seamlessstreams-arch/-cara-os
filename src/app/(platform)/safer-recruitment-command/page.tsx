"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFER RECRUITMENT COMMAND CENTRE  (route: /safer-recruitment-command)
//
// One board answering: who is safe to start, who is pending, what needs doing
// next. Traffic light + start-eligibility per candidate, reference chase
// ladder, missing evidence and an Ofsted-ready staff-file index. The system
// chases and evidences; the manager decides — clearance is never automatic.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  ShieldCheck, AlertTriangle, Clock, UserCheck, FileWarning, Siren,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, CircleDashed, Phone, Link2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { useSaferRecruitmentCommand, useIssueReferenceLink, type IssuedReferenceLink } from "@/hooks/use-safer-recruitment-command";
import type {
  CommandCandidate,
  TrafficLight,
  StartEligibility,
} from "@/lib/engines/safer-recruitment-command-engine";

const LIGHT_STYLES: Record<TrafficLight, string> = {
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const ELIGIBILITY_LABELS: Record<StartEligibility, { label: string; cls: string }> = {
  not_eligible: { label: "Not eligible to start", cls: "bg-red-100 text-red-800" },
  conditional: { label: "Conditional — checks in progress", cls: "bg-amber-100 text-amber-800" },
  exceptional_supervised_only: { label: "Exceptional · supervised only", cls: "bg-orange-100 text-orange-800" },
  cleared: { label: "Cleared to start", cls: "bg-emerald-100 text-emerald-800" },
};

const FILE_STATUS_ICON = {
  on_file: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
  pending: <CircleDashed className="h-3.5 w-3.5 text-amber-500" />,
  missing: <XCircle className="h-3.5 w-3.5 text-red-500" />,
} as const;

export default function SaferRecruitmentCommandPage() {
  const { data, isLoading, error } = useSaferRecruitmentCommand();

  return (
    <PageShell
      title="Safer Recruitment Command Centre"
      subtitle="Who is safe to start, who is pending, and what needs doing next — every clearance decision stays with the manager"
      quickCreateContext={{ module: "recruitment" }}
    >
      {isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Building the compliance picture…</p>}
      {error && <p className="text-sm text-red-600">Couldn&rsquo;t load the command centre. Try refreshing.</p>}

      {data && (
        <div className="space-y-6">
          {/* ── Summary strip ── */}
          <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
            <p className="text-sm font-semibold text-[var(--cs-navy)]">{data.summary.headline}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              <SummaryStat label="Active candidates" value={data.summary.total_candidates} Icon={UserCheck} />
              <SummaryStat label="Red" value={data.summary.red} Icon={AlertTriangle} tone="text-red-600" />
              <SummaryStat label="Amber" value={data.summary.amber} Icon={Clock} tone="text-amber-600" />
              <SummaryStat label="Green" value={data.summary.green} Icon={ShieldCheck} tone="text-emerald-600" />
              <SummaryStat label="Cleared to start" value={data.summary.cleared} Icon={CheckCircle2} tone="text-emerald-700" />
              <SummaryStat label="Refs outstanding" value={data.summary.references_outstanding} Icon={Phone} />
              <SummaryStat label="Exceptional starts" value={data.summary.exceptional_active} Icon={Siren} tone="text-orange-600" />
            </div>
          </div>

          {/* ── Candidate cards ── */}
          {data.candidates.length === 0 ? (
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-8 text-center text-sm text-[var(--cs-text-muted)]">
              No active candidates in the recruitment pipeline.
            </div>
          ) : (
            <div className="space-y-4">
              {data.candidates.map((c) => (
                <CandidateCard key={c.candidate_id} c={c} />
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--cs-text-muted)]">
            Cara automates the chasing, tracking and evidence assembly. It never makes the suitability decision —
            final sign-off is always recorded against a named manager, and exceptional starts always mean supervised
            work only, outside staffing ratios, with daily review until every check is complete.
          </p>
        </div>
      )}
    </PageShell>
  );
}

function ReferenceChases({ chases }: { chases: CommandCandidate["reference_chases"] }) {
  const issueLink = useIssueReferenceLink();
  const [issued, setIssued] = useState<Record<string, IssuedReferenceLink>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function issue(referenceId: string) {
    setBusy(referenceId);
    try {
      const link = await issueLink.mutateAsync(referenceId);
      setIssued((m) => ({ ...m, [referenceId]: link }));
    } catch {
      // surfaced via the mutation error below
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {chases.map((r) => (
          <span
            key={r.reference_id}
            title={r.action}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              r.state === "escalate_manager" || r.state === "suggest_alternative"
                ? "border-red-200 bg-red-50 text-red-700"
                : r.state === "awaiting"
                  ? "border-[var(--cs-border)] bg-[var(--cs-bg)] text-[var(--cs-text-secondary)]"
                  : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <Phone className="h-3 w-3" /> {r.referee_name} · {r.days_waiting}d · {r.state.replace(/_/g, " ")}
            <button
              onClick={() => issue(r.reference_id)}
              disabled={busy === r.reference_id}
              title="Issue a secure one-time form link for this referee"
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 font-semibold text-[var(--cs-navy)] ring-1 ring-[var(--cs-border)] hover:bg-white disabled:opacity-50"
            >
              <Link2 className="h-3 w-3" /> {busy === r.reference_id ? "…" : "link"}
            </button>
          </span>
        ))}
      </div>
      {issueLink.isError && <p className="text-xs text-red-600">{issueLink.error.message}</p>}
      {Object.entries(issued).map(([refId, link]) => (
        <div key={refId} className="rounded-lg border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]/40 px-3 py-2">
          <p className="text-[11px] font-semibold text-[var(--cs-navy)]">Secure link for {link.referee_name} — share it yourself; shown once, single use, expires in 7 days:</p>
          <input
            readOnly
            value={link.link}
            onFocus={(e) => e.target.select()}
            className="mt-1 w-full rounded border border-[var(--cs-border)] bg-white px-2 py-1.5 font-mono text-[11px] text-[var(--cs-text)]"
          />
        </div>
      ))}
    </div>
  );
}

function SummaryStat({ label, value, Icon, tone }: { label: string; value: number; Icon: typeof UserCheck; tone?: string }) {
  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${tone ?? "text-[var(--cs-text-muted)]"}`} />
        <span className={`text-lg font-extrabold ${tone ?? "text-[var(--cs-navy)]"}`}>{value}</span>
      </div>
      <p className="mt-0.5 text-[11px] font-medium text-[var(--cs-text-muted)]">{label}</p>
    </div>
  );
}

function CandidateCard({ c }: { c: CommandCandidate }) {
  const [open, setOpen] = useState(false);
  const eligibility = ELIGIBILITY_LABELS[c.start_eligibility];

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-[var(--cs-shadow-card)] ${c.traffic_light === "red" ? "border-red-200" : "border-[var(--cs-border)]"}`}>
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-[var(--cs-navy)]">{c.name}</h3>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${LIGHT_STYLES[c.traffic_light]}`}>{c.traffic_light}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${eligibility.cls}`}>{eligibility.label}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--cs-text-muted)]">
            {c.role_applied} · stage: {c.stage.replace(/_/g, " ")} · day {c.days_since_application} of process · pack {c.compliance_score}% verified
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--cs-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]"
        >
          Staff file {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* One-line status + next action */}
      <p className="mt-3 text-sm text-[var(--cs-text-secondary)]">{c.one_line_status}</p>
      <div className={`mt-3 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${c.next_action.urgency === "urgent" ? "border-red-200 bg-red-50" : c.next_action.urgency === "high" ? "border-amber-200 bg-amber-50" : "border-[var(--cs-border)] bg-[var(--cs-bg)]"}`}>
        <Siren className={`mt-0.5 h-4 w-4 shrink-0 ${c.next_action.urgency === "urgent" ? "text-red-600" : c.next_action.urgency === "high" ? "text-amber-600" : "text-[var(--cs-text-muted)]"}`} />
        <div>
          <p className="text-sm font-semibold text-[var(--cs-navy)]">Next: {c.next_action.label}</p>
          <p className="text-xs text-[var(--cs-text-secondary)]">{c.next_action.detail}</p>
        </div>
      </div>

      {/* Blockers */}
      {c.blockers.length > 0 && (
        <ul className="mt-3 space-y-1">
          {c.blockers.map((b) => (
            <li key={b.code} className="flex items-start gap-2 text-xs text-red-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {b.message}
            </li>
          ))}
        </ul>
      )}

      {/* Reference chase ladder + secure links */}
      {c.reference_chases.length > 0 && <ReferenceChases chases={c.reference_chases} />}

      {/* Exceptional start panel */}
      {c.exceptional_start && (
        <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-xs text-orange-900">
          <p className="font-bold">Exceptional start {c.exceptional_start.active ? "ACTIVE — supervised only, daily review required" : "requested — controls incomplete"}</p>
          {c.exceptional_start.missing.length > 0 && (
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {c.exceptional_start.missing.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
          {c.exceptional_start.active && (
            <p className="mt-1">Approved by {c.exceptional_start.approved_by} · no sole charge · not counted in staffing ratios.</p>
          )}
        </div>
      )}

      {/* Expandable: staff-file index + missing evidence */}
      {open && (
        <div className="mt-4 grid gap-4 border-t border-[var(--cs-border)] pt-4 lg:grid-cols-2">
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><ShieldCheck className="h-3.5 w-3.5" /> Staff file index (Schedule 2)</h4>
            <ul className="mt-2 space-y-1.5">
              {c.staff_file_index.map((f) => (
                <li key={f.key} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5">{FILE_STATUS_ICON[f.status]}</span>
                  <span>
                    <span className="font-semibold text-[var(--cs-navy)]">{f.item}</span>
                    <span className="text-[var(--cs-text-muted)]"> — {f.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><FileWarning className="h-3.5 w-3.5" /> Missing evidence — why it matters</h4>
            {c.missing_evidence.length === 0 ? (
              <p className="mt-2 text-xs text-emerald-700">Nothing missing — the file is inspection-ready.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {c.missing_evidence.map((m, i) => (
                  <li key={i} className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2 text-xs">
                    <p className="font-semibold text-[var(--cs-navy)]">{m.item}</p>
                    <p className="mt-0.5 text-[var(--cs-text-secondary)]">{m.why_it_matters}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
