"use client";

// ══════════════════════════════════════════════════════════════════════════════
// RI Escalations  (Milestone 52)
//
// Responsible Individual oversight queue: critical trajectory alerts left
// unacknowledged by management long enough to escalate to the RI. RIs can
// acknowledge each escalation with a note. Acknowledging here does NOT
// silence the underlying manager-facing alert.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  useTrajectoryRiEscalations,
  useAckTrajectoryRiEscalation,
} from "@/hooks/use-trajectory-ri-escalations";
import type { TrajectoryRiEscalation } from "@/lib/care-events/inspection-trajectory";
import type { TrajectoryRiEscalationAck } from "@/lib/db/store";

const HOME_ID = "home_oak";

export default function RiEscalationsPage() {
  const q = useTrajectoryRiEscalations(HOME_ID);
  const escalations = q.data?.data.escalations ?? [];
  const acks = q.data?.data.acks_recent ?? [];

  return (
    <PageShell
      title="RI Escalations"
      subtitle="Critical trajectory alerts left unacknowledged by management long enough to require Responsible Individual oversight."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Open RI escalations
              <Badge variant="outline" className="ml-1">{escalations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {q.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
            {!q.isLoading && escalations.length === 0 && (
              <p className="text-sm text-slate-500">
                No open RI escalations. Management is responding to critical
                trajectory alerts within the escalation window.
              </p>
            )}
            <ul className="space-y-2">
              {escalations.map((e) => (
                <EscalationRow key={e.id} escalation={e} />
              ))}
            </ul>
          </CardContent>
        </Card>

        <AckHistoryCard acks={acks} />
      </div>
    </PageShell>
  );
}

function EscalationRow({ escalation }: { escalation: TrajectoryRiEscalation }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const ack = useAckTrajectoryRiEscalation(HOME_ID);
  return (
    <li className="rounded border border-rose-300 bg-rose-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {escalation.alert_kind.replace(/_/g, " ")}{" "}
            <Badge variant="outline" className="ml-1 text-xs">
              critical · {escalation.age_hours}h
            </Badge>
          </p>
          <p className="mt-0.5 text-sm text-slate-700">{escalation.message}</p>
          {escalation.bundle_id && (
            <Link
              href={`/intelligence/care-events/inspection-bundle/${encodeURIComponent(escalation.bundle_id)}`}
              className="text-xs text-blue-700 underline"
            >
              open bundle
            </Link>
          )}
        </div>
        {!open && (
          <button
            type="button"
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
            onClick={() => setOpen(true)}
          >
            Acknowledge
          </button>
        )}
      </div>
      {open && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            ack.mutate({ escalation_id: escalation.id, note: note.trim() }, {
              onSuccess: () => { setOpen(false); setNote(""); },
            });
          }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="RI oversight note: what was discussed with the manager, what's being done, by when…"
            rows={3}
            required
            className="w-full rounded border border-slate-300 bg-white p-2 text-sm"
          />
          <p className="text-xs text-slate-600">
            Note: acknowledging here closes the RI escalation only. Management is
            still expected to acknowledge the underlying trajectory alert on the
            Readiness Trajectory page.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={ack.isPending || !note.trim()}
              className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              {ack.isPending ? "Saving…" : "Submit RI acknowledgement"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setNote(""); }}
              className="rounded border border-slate-300 bg-white px-3 py-1 text-xs"
            >
              Cancel
            </button>
            {ack.isError && (
              <span className="text-xs text-rose-700">Failed — please try again.</span>
            )}
          </div>
        </form>
      )}
    </li>
  );
}

function AckHistoryCard({ acks }: { acks: TrajectoryRiEscalationAck[] }) {
  if (acks.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Recent RI acknowledgements</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-1">Acked at</th>
              <th>Alert kind</th>
              <th>By</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {acks.map((a) => (
              <tr key={a.id} className="border-t border-slate-200">
                <td className="py-1 pr-2 text-slate-600">
                  {new Date(a.acked_at).toLocaleString()}
                </td>
                <td className="pr-2">{a.alert_kind.replace(/_/g, " ")}</td>
                <td className="pr-2">
                  {a.acked_by_user} <span className="text-xs text-slate-500">({a.acked_by_role})</span>
                </td>
                <td>{a.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
