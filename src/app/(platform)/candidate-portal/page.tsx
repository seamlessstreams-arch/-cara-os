"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Upload,
  User,
  FileText,
  Award,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CheckSummary {
  id: string;
  check_type: string;
  label: string;
  status: string;
  status_label: string;
  complete: boolean;
  concern: boolean;
}

interface PortalData {
  candidate: {
    id: string;
    name: string;
    role_applied: string;
    current_stage: string;
    stage_label: string;
    compliance_status: string;
    progress_percent: number;
  };
  checks: CheckSummary[];
  checks_complete: number;
  checks_total: number;
  references_received: number;
  references_total: number;
  values_match: {
    match_percent: number;
    band: string;
    shared_values: string[];
  } | null;
  next_steps: string[];
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useCandidatePortal(candidateId?: string) {
  return useQuery<PortalData>({
    queryKey: ["candidate-portal", candidateId],
    queryFn: async () => {
      const url = `/api/v1/candidate-portal${candidateId ? `?candidateId=${encodeURIComponent(candidateId)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load application");
      const json = await res.json();
      return json.data as PortalData;
    },
    staleTime: 60_000,
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CheckStatusIcon({ check }: { check: CheckSummary }) {
  if (check.concern) return <AlertTriangle className="h-4 w-4 text-[var(--cs-risk)]" />;
  if (check.complete) return <CheckCircle2 className="h-4 w-4 text-[var(--cs-success)]" />;
  if (check.status === "requested" || check.status === "in_progress")
    return <Clock className="h-4 w-4 text-[var(--cs-warning)]" />;
  if (check.status === "not_started")
    return <XCircle className="h-4 w-4 text-[var(--cs-text-muted)]" />;
  return <Clock className="h-4 w-4 text-[var(--cs-info)]" />;
}

function MatchBand({ band }: { band: string }) {
  const colours: Record<string, string> = {
    strong: "success",
    promising: "secondary",
    explore: "secondary",
    limited: "outline",
  };
  return (
    <Badge variant={(colours[band] ?? "outline") as any} className="capitalize text-xs">
      {band.replace("_", " ")}
    </Badge>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CandidatePortalPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useCandidatePortal(selectedCandidate);

  // Demo: candidate switcher (in production the user would be authenticated as a candidate)
  const DEMO_CANDIDATES = [
    { id: "cand_001", label: "Amara Osei" },
    { id: "cand_002", label: "Daniel Wright" },
    { id: "cand_003", label: "Priscilla Mensah" },
  ];

  return (
    <div className="min-h-screen bg-[var(--cs-bg)] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[var(--cs-navy)] flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--cs-navy)]">Your Application</h1>
            <p className="text-xs text-[var(--cs-text-muted)]">Cara · Candidate Self-Service</p>
          </div>
        </div>

        {/* Demo switcher (would be hidden in prod with real auth) */}
        <div className="bg-white rounded-lg border border-[var(--cs-border)] p-3">
          <p className="text-xs text-[var(--cs-text-muted)] mb-2 font-medium">Demo — view as candidate:</p>
          <div className="flex gap-2 flex-wrap">
            {DEMO_CANDIDATES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCandidate(c.id)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  (selectedCandidate ?? "cand_001") === c.id
                    ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                    : "border-[var(--cs-border)] text-[var(--cs-text-secondary)] hover:border-[var(--cs-navy)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-lg border border-[var(--cs-border)] p-8 text-center text-sm text-[var(--cs-text-muted)]">
            Loading your application…
          </div>
        )}

        {error && (
          <div className="bg-white rounded-lg border border-[var(--cs-risk)] p-4 text-sm text-[var(--cs-risk)]">
            Unable to load application. Please try again or contact the recruiting manager.
          </div>
        )}

        {data && (
          <>
            {/* Application summary card */}
            <div className="bg-white rounded-lg border border-[var(--cs-border)] p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-[var(--cs-navy)]">{data.candidate.name}</p>
                  <p className="text-xs text-[var(--cs-text-muted)]">{data.candidate.role_applied}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {data.candidate.stage_label}
                </Badge>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--cs-text-muted)]">Application progress</span>
                  <span className="text-xs font-medium text-[var(--cs-navy)]">{data.candidate.progress_percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--cs-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--cs-teal)] transition-all"
                    style={{ width: `${data.candidate.progress_percent}%` }}
                  />
                </div>
              </div>

              {/* Checks summary */}
              <div className="flex gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cs-success)]" />
                  {data.checks_complete}/{data.checks_total} checks complete
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)]">
                  <FileText className="h-3.5 w-3.5 text-[var(--cs-info)]" />
                  {data.references_received}/{data.references_total} references received
                </div>
              </div>
            </div>

            {/* Values match (if available) */}
            {data.values_match && (
              <div className="bg-white rounded-lg border border-[var(--cs-border)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-[var(--cs-navy)]" />
                  <h2 className="text-sm font-semibold text-[var(--cs-navy)]">Values Alignment</h2>
                  <MatchBand band={data.values_match.band} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl font-bold text-[var(--cs-teal)]">{data.values_match.match_percent}%</div>
                  <div className="text-xs text-[var(--cs-text-muted)]">match with our employer values profile</div>
                </div>
                {data.values_match.shared_values.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--cs-text-muted)] mb-2">Shared values identified:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.values_match.shared_values.map((v) => (
                        <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-[var(--cs-success-bg)] text-[var(--cs-success)]">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-[var(--cs-text-muted)] mt-3 pt-3 border-t border-[var(--cs-border)]">
                  This score is indicative only. Recruitment decisions are always made by the hiring team using professional judgement and safer recruitment standards.
                </p>
              </div>
            )}

            {/* Checks checklist */}
            <div className="bg-white rounded-lg border border-[var(--cs-border)] p-5">
              <h2 className="text-sm font-semibold text-[var(--cs-navy)] mb-3">Safer Recruitment Checklist</h2>
              <div className="divide-y divide-[var(--cs-border)]">
                {data.checks.map((check) => (
                  <div key={check.id} className="flex items-center gap-3 py-2.5">
                    <CheckStatusIcon check={check} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--cs-navy)] truncate">{check.label}</p>
                      <p className="text-[10px] text-[var(--cs-text-muted)]">{check.status_label}</p>
                    </div>
                    {check.concern && (
                      <Badge variant="destructive" className="text-[10px] shrink-0">Under review</Badge>
                    )}
                    {check.complete && !check.concern && (
                      <span className="text-[10px] text-[var(--cs-success)] font-medium shrink-0">Done</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-white rounded-lg border border-[var(--cs-border)] p-5">
              <h2 className="text-sm font-semibold text-[var(--cs-navy)] mb-3">What happens next</h2>
              <ul className="space-y-2">
                {data.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--cs-teal)] mt-0.5 shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Document upload placeholder */}
            <div className="bg-white rounded-lg border border-dashed border-[var(--cs-border)] p-5 text-center">
              <Upload className="h-6 w-6 text-[var(--cs-text-muted)] mx-auto mb-2" />
              <p className="text-sm font-medium text-[var(--cs-navy)]">Upload documents</p>
              <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                Securely send your ID, certificates, and declarations.
                Contact your recruiting manager for the secure upload link.
              </p>
            </div>

            {/* Contact / footer */}
            <div className="text-center text-xs text-[var(--cs-text-muted)] pb-4">
              <p>Questions? Contact your recruiting manager directly.</p>
              <p className="mt-1">This portal is provided by Cara. Information shown reflects the current state of your application at Oak House.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
