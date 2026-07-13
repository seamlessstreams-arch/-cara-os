"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDocumentGovernance } from "@/hooks/use-document-governance";
import type { GovernanceBoard } from "@/hooks/use-document-governance";
import { GOV_DOC_TYPE_LABEL } from "@/lib/doc-governance/doc-governance-engine";
import { FileCheck, AlertTriangle, Clock, CheckCircle2, HelpCircle, Loader2, Info, Database } from "lucide-react";

type Row = GovernanceBoard["rows"][number];

const STATE: Record<Row["state"], { variant: "destructive" | "due" | "success" | "outline"; Icon: typeof Clock; label: string }> = {
  overdue: { variant: "destructive", Icon: AlertTriangle, label: "Overdue" },
  due_soon: { variant: "due", Icon: Clock, label: "Due soon" },
  current: { variant: "success", Icon: CheckCircle2, label: "Current" },
  no_date: { variant: "outline", Icon: HelpCircle, label: "No date" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function daysText(r: Row): string {
  if (r.days_until == null) return "";
  if (r.days_until < 0) return `${Math.abs(r.days_until)}d overdue`;
  if (r.days_until === 0) return "today";
  return `in ${r.days_until}d`;
}

function GovLine({ r }: { r: Row }) {
  const s = STATE[r.state];
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <Link href={r.href} className="text-sm font-medium text-[var(--cs-text)] hover:underline">
          {r.title}
        </Link>
        <p className="text-xs text-[var(--cs-text-muted)]">
          {GOV_DOC_TYPE_LABEL[r.doc_type]}
          {r.version ? ` · ${r.version}` : ""}
          {r.owner ? ` · ${r.owner}` : ""}
          {r.date ? (
            <span className="text-[var(--cs-text-secondary)]">
              {" "}· {r.date_kind === "expiry" ? "expires" : "review"} {fmtDate(r.date)} ({daysText(r)})
            </span>
          ) : null}
        </p>
      </div>
      <Badge variant={s.variant} className="shrink-0 gap-1">
        <s.Icon className="h-3 w-3" />
        {s.label}
      </Badge>
    </div>
  );
}

export default function DocumentGovernancePage() {
  const { data, isLoading } = useDocumentGovernance();
  const board = data?.data;

  return (
    <PageShell
      title="Document Governance"
      description="Every governance document's review and expiry state in one place — home policies, policy reviews, tracked documents and files, projected read-only from their own records."
    >
      <div className="max-w-3xl space-y-4">
        {isLoading || !board ? (
          <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Building the governance board…
            </div>
          </div>
        ) : (
          <>
            {/* Board */}
            <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white p-4", board.summary.overdue > 0 && "border-l-4 border-l-[var(--cs-risk)]")}>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)]">
                <FileCheck className="h-4 w-4" />
                Governance board
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={board.summary.overdue > 0 ? "destructive" : "outline"} className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {board.summary.overdue} overdue
                </Badge>
                <Badge variant={board.summary.due_soon > 0 ? "due" : "outline"} className="gap-1">
                  <Clock className="h-3 w-3" /> {board.summary.due_soon} due soon
                </Badge>
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {board.summary.current} current
                </Badge>
                {board.summary.no_date > 0 ? (
                  <Badge variant="outline" className="gap-1">
                    <HelpCircle className="h-3 w-3" /> {board.summary.no_date} without a date
                  </Badge>
                ) : null}
              </div>

              {board.rows.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--cs-text-muted)]">No governance documents found in the connected sources.</p>
              ) : (
                <div className="mt-2 divide-y divide-[var(--cs-border)] border-t border-[var(--cs-border)]">
                  {board.rows.map((r) => (
                    <GovLine key={`${r.doc_type}:${r.id}`} r={r} />
                  ))}
                </div>
              )}

              {/* The versioning caveat, verbatim from the engine */}
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[var(--cs-text-gentle)]">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                {board.versioning_note}
              </p>
            </div>

            {/* Coverage — honest about what feeds the board */}
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)]">
                <Database className="h-4 w-4" />
                What feeds this board
              </p>
              <div className="mt-2 divide-y divide-[var(--cs-border)]">
                {board.coverage.map((c) => (
                  <div key={c.source} className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--cs-text)]">{c.source}</p>
                      <p className="text-xs text-[var(--cs-text-muted)]">{c.note}</p>
                    </div>
                    <Badge
                      variant={c.status === "included" ? "success" : c.status === "empty" ? "outline" : "secondary"}
                      className="shrink-0"
                    >
                      {c.status === "included" ? `${c.count} included` : c.status === "empty" ? "empty" : "live database only"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
