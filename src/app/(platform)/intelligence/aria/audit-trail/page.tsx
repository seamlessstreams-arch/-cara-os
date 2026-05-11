"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA STUDIO AUDIT TRAIL (Live Tail) — Milestone 11
// Append-only timeline of every ARIA Studio action: drafts generated,
// edits, approvals, rejections, commits, denied attempts. Refreshes
// every 15s. Filterable by actor and action type.
// ══════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  Filter,
  RefreshCcw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileSignature,
  Pencil,
  Sparkles,
} from "lucide-react";
import {
  useAuditActors,
  useAuditTrail,
} from "@/hooks/use-aria-audit-trail";
import { ARIA_AUDIT_ACTION_LABELS } from "@/lib/aria/aria-audit-trail";
import type { AriaAuditAction, AriaStudioAuditLog } from "@/types/aria-studio";

const HOME_ID = "home_oak";

const ACTION_VALUES: AriaAuditAction[] = [
  "source_indexed",
  "artifact_generated",
  "artifact_edited",
  "artifact_submitted",
  "artifact_reviewed",
  "changes_requested",
  "artifact_approved",
  "artifact_rejected",
  "artifact_committed",
  "artifact_archived",
  "artifact_deleted",
  "artifact_recovered",
  "task_created",
  "quality_check_completed",
  "safeguarding_alert_created",
  "evidence_gap_detected",
  "contradiction_detected",
];

const ACTION_TONE: Partial<Record<AriaAuditAction, string>> = {
  artifact_generated: "bg-sky-100 text-sky-800",
  artifact_edited: "bg-amber-100 text-amber-800",
  artifact_submitted: "bg-indigo-100 text-indigo-800",
  artifact_approved: "bg-emerald-100 text-emerald-800",
  artifact_committed: "bg-emerald-200 text-emerald-900",
  artifact_rejected: "bg-rose-100 text-rose-800",
  changes_requested: "bg-amber-100 text-amber-800",
  safeguarding_alert_created: "bg-rose-200 text-rose-900",
  evidence_gap_detected: "bg-orange-100 text-orange-800",
  contradiction_detected: "bg-orange-100 text-orange-800",
};

function actionIcon(a: AriaAuditAction) {
  switch (a) {
    case "artifact_generated":
      return <Sparkles className="h-4 w-4" />;
    case "artifact_edited":
      return <Pencil className="h-4 w-4" />;
    case "artifact_committed":
      return <FileSignature className="h-4 w-4" />;
    case "artifact_approved":
      return <CheckCircle2 className="h-4 w-4" />;
    case "artifact_rejected":
      return <XCircle className="h-4 w-4" />;
    case "safeguarding_alert_created":
      return <ShieldAlert className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function isDenied(entry: AriaStudioAuditLog): boolean {
  return (entry.prompt_summary ?? "").startsWith("DENIED ");
}

export default function AriaAuditTrailPage() {
  const [actor, setActor] = useState<string>("");
  const [action, setAction] = useState<AriaAuditAction | "">("");
  const [showDeniedOnly, setShowDeniedOnly] = useState(false);

  const actors = useAuditActors(HOME_ID);
  const trail = useAuditTrail(HOME_ID, {
    actorId: actor || undefined,
    actionType: action || undefined,
    limit: 200,
  });

  const entries = useMemo(() => {
    const rows = trail.data?.data ?? [];
    return showDeniedOnly ? rows.filter(isDenied) : rows;
  }, [trail.data, showDeniedOnly]);

  return (
    <PageShell
      title="ARIA audit trail"
      subtitle="Append-only live tail of every ARIA Studio action — generations, edits, approvals, rejections, commits, denied attempts."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => trail.refetch()}
          disabled={trail.isFetching}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
          <CardDescription className="text-xs">
            Live tail polls every 15 seconds. Append-only — entries can never be
            edited or deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Actor
            </label>
            <select
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            >
              <option value="">All actors</option>
              {(actors.data?.data ?? []).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as AriaAuditAction | "")}
              className="rounded border px-2 py-1 text-sm"
            >
              <option value="">All actions</option>
              {ACTION_VALUES.map((a) => (
                <option key={a} value={a}>
                  {ARIA_AUDIT_ACTION_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={showDeniedOnly}
              onChange={(e) => setShowDeniedOnly(e.target.checked)}
            />
            Denied attempts only
          </label>
          <div className="ml-auto text-xs text-muted-foreground">
            {entries.length} entries
          </div>
        </CardContent>
      </Card>

      {trail.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading live tail…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No audit entries match your filters yet. Trigger an action elsewhere
          in ARIA Studio (e.g. propose or commit a suggested record) and it
          will appear here within 15 seconds.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const denied = isDenied(entry);
            return (
              <Card key={entry.id} className={denied ? "border-rose-300" : ""}>
                <CardContent className="flex items-start gap-3 py-3 text-sm">
                  <div className="mt-0.5 text-muted-foreground">
                    {actionIcon(entry.action_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={ACTION_TONE[entry.action_type] ?? "bg-slate-100 text-slate-700"}
                      >
                        {ARIA_AUDIT_ACTION_LABELS[entry.action_type]}
                      </Badge>
                      {denied && (
                        <Badge variant="outline" className="bg-rose-100 text-rose-800">
                          DENIED
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {entry.actor_id}
                      </span>
                      {entry.artifact_id && (
                        <span className="text-xs text-muted-foreground">
                          · artifact {entry.artifact_id}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{entry.prompt_summary}</p>
                    {(entry.before_state || entry.after_state) && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          State diff
                        </summary>
                        <div className="mt-1 grid gap-2 text-xs sm:grid-cols-2">
                          <pre className="overflow-x-auto rounded bg-rose-50 p-2 text-rose-900">
                            before: {JSON.stringify(entry.before_state, null, 2)}
                          </pre>
                          <pre className="overflow-x-auto rounded bg-emerald-50 p-2 text-emerald-900">
                            after: {JSON.stringify(entry.after_state, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
