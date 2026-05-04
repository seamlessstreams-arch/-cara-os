"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HR — SAFER RECRUITMENT GATE (UI)
//
// The manager-facing checklist for safer recruitment. Loads the current
// record for a staff member, evaluates the gate, and surfaces:
//   - Gate outcome and rationale
//   - Per-check satisfied / outstanding state with evidence requirements
//   - Edit controls for each check
//   - Manager sign-off button
//   - Senior risk acceptance entry (RI / RM only)
//
// All writes go through /api/hr/safer-recruitment with audit logging.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ClipboardList,
  Stamp,
  AlertOctagon,
} from "lucide-react";
import type { CheckStatus } from "@/lib/hr/saferRecruitmentGate";

const HR_ROLES = [
  { value: "rm", label: "Registered Manager" },
  { value: "ri", label: "Responsible Individual" },
  { value: "deputy", label: "Deputy Manager" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "hr_caseworker", label: "HR Caseworker" },
];

const CHECK_STATUS_OPTIONS: { value: CheckStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "complete", label: "Complete" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
  { value: "not_required", label: "Not required" },
];

const DBS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "clear", label: "Clear" },
  { value: "flagged", label: "Flagged" },
  { value: "expired", label: "Expired" },
];

interface CheckRowResult {
  key: string;
  label: string;
  satisfied: boolean;
  reason?: string;
  evidenceRequiredIfMissing: string;
}

type GateOutcome =
  | "approved_all_checks_complete"
  | "approved_with_senior_risk_acceptance"
  | "blocked_missing_checks"
  | "blocked_check_failed";

interface Evaluation {
  outcome: GateOutcome;
  approvedForUnsupervised: boolean;
  rows: CheckRowResult[];
  blockingReasons: string[];
  unmetChecks: CheckRowResult[];
  failedChecks: CheckRowResult[];
  ariaLabel: "Aria suggested draft";
  rationaleSummary: string;
  regulatoryLinks: string[];
}

interface RecordShape {
  id: string;
  staffId: string;
  homeId?: string;
  applicationFormComplete: boolean;
  employmentHistoryFull: boolean;
  gapsExplored: boolean;
  gapsExplanation?: string;
  identityCheckStatus: CheckStatus;
  rightToWorkStatus: CheckStatus;
  enhancedDbsStatus: "pending" | "submitted" | "clear" | "flagged" | "expired";
  enhancedDbsNumber?: string;
  enhancedDbsRenewalDue?: string;
  barredListCheckStatus: CheckStatus;
  referencesReceivedCount: number;
  referencesVerifiedCount: number;
  interviewNotesPresent: boolean;
  valuesBasedInterviewDone: boolean;
  qualificationCheckDone: boolean;
  healthDeclarationComplete: boolean;
  recruitmentRiskAssessment?: string;
  inductionPlanPresent: boolean;
  managerSignOff: boolean;
  managerSignedOffBy?: string;
  managerSignedOffAt?: string;
  seniorRiskAcceptance: boolean;
  seniorRiskAcceptanceText?: string;
  seniorRiskAcceptanceBy?: string;
  seniorRiskAcceptanceAt?: string;
  status: "in_progress" | "complete" | "blocked" | "withdrawn";
}

const OUTCOME_COLOUR: Record<GateOutcome, string> = {
  approved_all_checks_complete: "bg-emerald-100 text-emerald-800 border-emerald-200",
  approved_with_senior_risk_acceptance: "bg-amber-100 text-amber-800 border-amber-200",
  blocked_missing_checks: "bg-rose-100 text-rose-800 border-rose-200",
  blocked_check_failed: "bg-red-100 text-red-800 border-red-200",
};

const OUTCOME_LABEL: Record<GateOutcome, string> = {
  approved_all_checks_complete: "Approved (all checks complete)",
  approved_with_senior_risk_acceptance: "Approved (senior risk acceptance)",
  blocked_missing_checks: "Blocked (checks outstanding)",
  blocked_check_failed: "Blocked (check failed)",
};

export default function SaferRecruitmentPage() {
  const [actorUserId, setActorUserId] = useState("manager_demo_user");
  const [actorRole, setActorRole] = useState("rm");
  const [staffId, setStaffId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<RecordShape | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const [savingPatch, setSavingPatch] = useState(false);
  const [signingOff, setSigningOff] = useState(false);
  const [risk, setRisk] = useState({ open: false, text: "" });

  const completedCount = useMemo(
    () => evaluation?.rows.filter((r) => r.satisfied).length ?? 0,
    [evaluation],
  );
  const totalCount = evaluation?.rows.length ?? 0;
  const canSubmit = staffId.trim().length > 0;

  async function load() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setRecord(null);
    setEvaluation(null);
    try {
      const url = new URL("/api/hr/safer-recruitment", window.location.origin);
      url.searchParams.set("staffId", staffId.trim());
      url.searchParams.set("actorUserId", actorUserId);
      url.searchParams.set("actorRole", actorRole);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load record");
      } else if (!data.data?.exists) {
        setError(
          "No safer recruitment record exists for this staff id yet. Use 'Update a check' below to begin a record.",
        );
      } else {
        setRecord(data.data.record);
        setEvaluation(data.data.evaluation);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function patchField(payload: Record<string, unknown>) {
    setSavingPatch(true);
    setError(null);
    try {
      const res = await fetch("/api/hr/safer-recruitment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: record?.id,
          staffId: record ? undefined : staffId.trim(),
          actorUserId,
          actorRole,
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed");
      } else {
        setRecord(data.data.record);
        setEvaluation(data.data.evaluation);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingPatch(false);
    }
  }

  async function signOff(action: "manager_sign_off" | "senior_risk_acceptance", text?: string) {
    if (!record) return;
    setSigningOff(true);
    setError(null);
    try {
      const res = await fetch("/api/hr/safer-recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          recordId: record.id,
          actorUserId,
          actorRole,
          text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-off failed");
      } else {
        setRecord(data.data.record);
        setEvaluation(data.data.evaluation);
        if (action === "senior_risk_acceptance") setRisk({ open: false, text: "" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSigningOff(false);
    }
  }

  // Re-load whenever the actor changes after an initial load.
  useEffect(() => {
    if (record) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorUserId, actorRole]);

  return (
    <PageShell title="HR — Safer Recruitment Gate">
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
        <ShieldCheck className="h-5 w-5 mt-0.5 text-violet-600" />
        <div>
          <div className="font-semibold">Aria suggested draft, never final</div>
          <p className="text-violet-800">
            The Safer Recruitment Gate decides whether a worker can be marked
            <em> approved for unsupervised work</em>. Every mandatory check
            must be complete, or a senior risk acceptance must be on file with
            a written rationale. The gate enforcement happens server-side. The
            UI surfaces the rationale and the outstanding items.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-violet-600" /> Look up a record
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Acting as</label>
              <Select value={actorRole} onValueChange={setActorRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HR_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Actor user id</label>
              <Input value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Staff id</label>
              <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="e.g. staff_123" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={load} disabled={!canSubmit || loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
              {loading ? "Loading" : "Load record"}
            </Button>
          </div>
          {error ? (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {evaluation && record ? (
        <>
          {/* Headline */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">Gate outcome</div>
                <Badge className={cn("border", OUTCOME_COLOUR[evaluation.outcome])}>
                  {OUTCOME_LABEL[evaluation.outcome]}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">Checks complete</div>
                <div className="text-3xl font-semibold text-slate-900">
                  {completedCount}<span className="text-base text-slate-500">/{totalCount}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">Approved for unsupervised</div>
                <div className="text-sm">
                  {evaluation.approvedForUnsupervised ? (
                    <span className="text-emerald-700 font-medium">Yes</span>
                  ) : (
                    <span className="text-rose-700 font-medium">No</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">Manager sign-off</div>
                <div className="text-sm">
                  {record.managerSignOff ? (
                    <span className="text-emerald-700 font-medium">Recorded</span>
                  ) : (
                    <span className="text-amber-700 font-medium">Pending</span>
                  )}
                </div>
                {record.managerSignedOffAt ? (
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(record.managerSignedOffAt).toLocaleDateString()} by {record.managerSignedOffBy}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Gate rationale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-800">{evaluation.rationaleSummary}</p>
              {evaluation.blockingReasons.length > 0 ? (
                <ul className="mt-3 text-sm text-rose-900 space-y-1">
                  {evaluation.blockingReasons.map((b, i) => (
                    <li key={i} className="flex gap-2"><AlertOctagon className="h-3.5 w-3.5 mt-0.5 text-rose-500" /><span>{b}</span></li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          {/* Per-check checklist */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Mandatory checks</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100">
              {evaluation.rows.map((row) => (
                <CheckRow
                  key={row.key}
                  row={row}
                  record={record}
                  saving={savingPatch}
                  onPatch={patchField}
                />
              ))}
            </CardContent>
          </Card>

          {/* Sign-off + senior risk acceptance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Stamp className="h-4 w-4 text-violet-600" /> Sign-off
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-700">
                The Registered Manager signs off when all mandatory checks
                are satisfied. Where checks remain outstanding, an RI may
                record a senior risk acceptance with a written rationale to
                allow the worker to proceed; outstanding checks must still
                be closed.
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => signOff("manager_sign_off")}
                  disabled={signingOff || !record}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  {signingOff ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stamp className="h-4 w-4" />}
                  Manager sign-off
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRisk((r) => ({ ...r, open: !r.open }))}
                  className="gap-1.5"
                >
                  <AlertOctagon className="h-4 w-4" />
                  {risk.open ? "Cancel senior risk acceptance" : "Senior risk acceptance"}
                </Button>
              </div>

              {risk.open ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <div className="text-sm text-amber-900">
                    Record the rationale for accepting outstanding checks. Minimum 30 characters.
                  </div>
                  <Textarea
                    value={risk.text}
                    onChange={(e) => setRisk((r) => ({ ...r, text: e.target.value }))}
                    placeholder="As Responsible Individual, I have considered the outstanding checks on this file and accept the residual risk because..."
                    className="min-h-[100px] text-sm"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => signOff("senior_risk_acceptance", risk.text)}
                      disabled={signingOff || risk.text.trim().length < 30}
                      className="gap-1.5"
                    >
                      {signingOff ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stamp className="h-4 w-4" />}
                      Record acceptance
                    </Button>
                  </div>
                  {record.seniorRiskAcceptance ? (
                    <div className="text-xs text-slate-600 mt-2 pt-2 border-t border-amber-200">
                      Existing acceptance on file
                      {record.seniorRiskAcceptanceAt
                        ? ` (${new Date(record.seniorRiskAcceptanceAt).toLocaleDateString()})`
                        : ""}
                      {record.seniorRiskAcceptanceBy ? ` by ${record.seniorRiskAcceptanceBy}` : ""}.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Regulatory framework</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-slate-600 space-y-1">
                {evaluation.regulatoryLinks.map((s, i) => (
                  <li key={i}>· {s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : null}
    </PageShell>
  );
}

// ─── Per-check row with editing controls ───────────────────────────────────

function CheckRow({
  row,
  record,
  saving,
  onPatch,
}: {
  row: CheckRowResult;
  record: RecordShape;
  saving: boolean;
  onPatch: (payload: Record<string, unknown>) => void;
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2">
          {row.satisfied ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-500 mt-0.5" />
          )}
          <div>
            <div className="text-sm font-medium text-slate-800">{row.label}</div>
            {row.reason ? <div className="text-xs text-rose-700 mt-0.5">{row.reason}</div> : null}
            {!row.satisfied ? (
              <div className="text-xs text-slate-500 mt-0.5 italic">
                Evidence required: {row.evidenceRequiredIfMissing}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RowEditor row={row} record={record} saving={saving} onPatch={onPatch} />
        </div>
      </div>
    </div>
  );
}

function RowEditor({
  row,
  record,
  saving,
  onPatch,
}: {
  row: CheckRowResult;
  record: RecordShape;
  saving: boolean;
  onPatch: (payload: Record<string, unknown>) => void;
}) {
  // Rough mapping from check key to an in-place editor.
  switch (row.key) {
    case "application_form_complete":
    case "employment_history_full":
    case "gaps_explored":
    case "interview_notes":
    case "values_based_interview":
    case "qualification_check":
    case "health_declaration":
    case "induction_plan":
    case "manager_sign_off":
      return (
        <Toggle
          on={row.satisfied}
          disabled={saving || row.key === "manager_sign_off"}
          onToggle={(v) => {
            const map: Record<string, string> = {
              application_form_complete: "applicationFormComplete",
              employment_history_full: "employmentHistoryFull",
              gaps_explored: "gapsExplored",
              interview_notes: "interviewNotesPresent",
              values_based_interview: "valuesBasedInterviewDone",
              qualification_check: "qualificationCheckDone",
              health_declaration: "healthDeclarationComplete",
              induction_plan: "inductionPlanPresent",
            };
            const field = map[row.key];
            if (field) onPatch({ [field]: v });
          }}
        />
      );
    case "identity_check":
    case "right_to_work":
    case "barred_list":
      return (
        <StatusSelect
          value={
            row.key === "identity_check"
              ? record.identityCheckStatus
              : row.key === "right_to_work"
                ? record.rightToWorkStatus
                : record.barredListCheckStatus
          }
          options={CHECK_STATUS_OPTIONS}
          disabled={saving}
          onChange={(v) => {
            const field =
              row.key === "identity_check"
                ? "identityCheckStatus"
                : row.key === "right_to_work"
                  ? "rightToWorkStatus"
                  : "barredListCheckStatus";
            onPatch({ [field]: v });
          }}
        />
      );
    case "enhanced_dbs":
      return (
        <StatusSelect
          value={record.enhancedDbsStatus}
          options={DBS_OPTIONS as { value: string; label: string }[]}
          disabled={saving}
          onChange={(v) => onPatch({ enhancedDbsStatus: v })}
        />
      );
    case "references":
      return (
        <div className="flex items-center gap-2">
          <NumberPair
            label="Received"
            value={record.referencesReceivedCount}
            onChange={(v) => onPatch({ referencesReceivedCount: v })}
            disabled={saving}
          />
          <NumberPair
            label="Verified"
            value={record.referencesVerifiedCount}
            onChange={(v) => onPatch({ referencesVerifiedCount: v })}
            disabled={saving}
          />
        </div>
      );
    default:
      return null;
  }
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Button
      variant={on ? "default" : "outline"}
      size="sm"
      onClick={() => onToggle(!on)}
      disabled={disabled}
      className={cn("h-8 gap-1.5", on ? "bg-emerald-600 hover:bg-emerald-700" : "")}
    >
      {on ? "Complete" : "Mark complete"}
    </Button>
  );
}

function StatusSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NumberPair({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <Input
        type="number"
        min={0}
        max={6}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || "0", 10)))}
        className="h-8 w-14 text-sm"
      />
    </div>
  );
}
