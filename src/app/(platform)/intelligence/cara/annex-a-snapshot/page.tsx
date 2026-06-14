"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara ANNEX A LIVE SNAPSHOT
// Point-in-time inspection-readiness snapshot built from verified records.
// Cara drafts; the manager locks. Locked snapshots are immutable.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Award, RefreshCw, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  useAnnexASnapshots,
  useRunAnnexASnapshot,
  useLockAnnexASnapshot,
} from "@/hooks/use-cara-annex-a-snapshot";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToCaraRole } from "@/lib/cara/cara-permissions";
import type {
  CaraAnnexAReadiness,
  CaraAnnexASectionReading,
  CaraAnnexASnapshot,
} from "@/types/cara-studio";

const HOME_ID = "home_oak";

const READINESS_TONE: Record<CaraAnnexAReadiness, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-300",
  amber: "bg-amber-100 text-amber-800 border-amber-300",
  red: "bg-rose-100 text-rose-800 border-rose-300",
};

function SectionCard({ section }: { section: CaraAnnexASectionReading }) {
  return (
    <Card className={`border ${READINESS_TONE[section.readiness]}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">{section.label}</CardTitle>
            <CardDescription className="text-xs">{section.notes}</CardDescription>
          </div>
          <Badge variant="outline" className={`uppercase ${READINESS_TONE[section.readiness]}`}>
            {section.readiness}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex flex-wrap gap-3 text-muted-foreground">
          <span><span className="font-medium text-foreground">{section.record_count}</span> records</span>
          <span><span className="font-medium text-foreground">{section.gap_count}</span> gaps</span>
          {section.stale_count > 0 && (
            <span><span className="font-medium text-foreground">{section.stale_count}</span> stale</span>
          )}
        </div>
        {section.issues.length > 0 && (
          <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
            {section.issues.slice(0, 5).map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
            {section.issues.length > 5 && (
              <li className="italic">+{section.issues.length - 5} more</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SnapshotPanel({
  snapshot,
  onLock,
  isLocking,
}: {
  snapshot: CaraAnnexASnapshot;
  onLock: (id: string) => void;
  isLocking: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Readiness {snapshot.readiness_score}/100
              <Badge variant="outline" className={`uppercase ${READINESS_TONE[snapshot.overall_readiness]}`}>
                {snapshot.overall_readiness}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              {snapshot.period_start} → {snapshot.period_end} · generated{" "}
              {new Date(snapshot.generated_at).toLocaleString()}
              {snapshot.status === "locked" && snapshot.locked_at && (
                <>
                  {" "}· <span className="font-medium text-foreground">locked</span>{" "}
                  by {snapshot.locked_by} on{" "}
                  {new Date(snapshot.locked_at).toLocaleString()}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {snapshot.status === "locked" ? (
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                <Lock className="mr-1 h-3 w-3" /> Locked
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => onLock(snapshot.id)}
                disabled={isLocking}
              >
                <Lock className="mr-1 h-3 w-3" />
                {isLocking ? "Locking…" : "Lock snapshot"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded border bg-emerald-50 p-2 text-emerald-800">
          <div className="font-medium">Sections green</div>
          <div className="text-lg">
            {snapshot.sections.filter((s) => s.readiness === "green").length}
          </div>
        </div>
        <div className="rounded border bg-amber-50 p-2 text-amber-800">
          <div className="font-medium">Sections amber</div>
          <div className="text-lg">
            {snapshot.sections.filter((s) => s.readiness === "amber").length}
          </div>
        </div>
        <div className="rounded border bg-rose-50 p-2 text-rose-800">
          <div className="font-medium">Sections red</div>
          <div className="text-lg">
            {snapshot.sections.filter((s) => s.readiness === "red").length}
          </div>
        </div>
        <div className="rounded border bg-slate-50 p-2 text-slate-700">
          <div className="font-medium">Total gaps</div>
          <div className="text-lg">{snapshot.total_gaps}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnnexASnapshotPage() {
  const { currentUser } = useAuthContext();
  const caraRole = appRoleToCaraRole(currentUser?.role ?? "registered_manager");

  const query = useAnnexASnapshots(HOME_ID);
  const run = useRunAnnexASnapshot();
  const lock = useLockAnnexASnapshot();
  const [showHistory, setShowHistory] = useState(false);

  const snapshots = query.data?.data ?? [];
  const current = snapshots[0];
  const history = snapshots.slice(1);

  const handleRun = () => {
    run.mutate({
      home_id: HOME_ID,
      actor_id: currentUser?.id,
      actor_role: caraRole,
    });
  };

  const handleLock = (id: string) => {
    lock.mutate({
      id,
      actor_id: currentUser?.id,
      actor_role: caraRole,
    });
  };

  return (
    <PageShell
      title="Annex A — Live Snapshot"
      subtitle="Inspection-readiness snapshot built live from verified records. Cara drafts; the manager locks. Locked snapshots are immutable."
      actions={
        <Button onClick={handleRun} disabled={run.isPending}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${run.isPending ? "animate-spin" : ""}`}
          />
          {run.isPending ? "Building…" : "Build snapshot"}
        </Button>
      }
    >
      <div className="space-y-6">
        {!current ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              No snapshot yet. Click "Build snapshot" to draft one from current
              verified records.
            </CardContent>
          </Card>
        ) : (
          <>
            <SnapshotPanel
              snapshot={current}
              onLock={handleLock}
              isLocking={lock.isPending}
            />

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {current.sections.map((s) => (
                <SectionCard key={s.key} section={s} />
              ))}
            </div>

            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4" /> History
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {history.length} earlier snapshot{history.length === 1 ? "" : "s"}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowHistory((v) => !v)}
                    >
                      {showHistory ? "Hide" : "Show"}
                    </Button>
                  </div>
                </CardHeader>
                {showHistory && (
                  <CardContent className="space-y-2 text-xs">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded border p-2"
                      >
                        <div>
                          <div className="font-medium">
                            {h.period_start} → {h.period_end}
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(h.generated_at).toLocaleString()} ·{" "}
                            {h.readiness_score}/100 · {h.total_gaps} gap(s)
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            h.status === "locked"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {h.status === "locked" ? (
                            <>
                              <Lock className="mr-1 h-3 w-3" /> locked
                            </>
                          ) : (
                            "draft"
                          )}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
