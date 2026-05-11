"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA EARLY WARNINGS + SAFEGUARDING PATTERNS
// Live scanner output. ARIA detects, manager reviews and decides.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  useSafeguardingPatterns,
  useEarlyWarnings,
  useRunSafeguardingScan,
  useUpdateSafeguardingPattern,
  useUpdateEarlyWarning,
} from "@/hooks/use-aria-safeguarding-patterns";
import { useAuthContext } from "@/contexts/auth-context";
import type {
  AriaPatternSeverity,
  AriaSafeguardingPattern,
  AriaEarlyWarning,
} from "@/types/aria-studio";

const HOME_ID = "home_oak";

const SEVERITY_TONE: Record<AriaPatternSeverity, string> = {
  critical: "bg-rose-50 text-rose-800 border-rose-300",
  high: "bg-orange-50 text-orange-800 border-orange-300",
  medium: "bg-amber-50 text-amber-800 border-amber-300",
  low: "bg-slate-50 text-slate-700 border-slate-300",
};

function PatternCard({
  pattern,
  onAction,
}: {
  pattern: AriaSafeguardingPattern;
  onAction: (id: string, status: "acknowledged" | "actioned" | "dismissed") => void;
}) {
  return (
    <Card className={`border ${SEVERITY_TONE[pattern.severity]}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{pattern.title}</CardTitle>
            <CardDescription>
              {pattern.window_start} → {pattern.window_end} ·{" "}
              {pattern.evidence_refs.length} evidence link
              {pattern.evidence_refs.length === 1 ? "" : "s"} · status:{" "}
              {pattern.status}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-background">
            {pattern.severity.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{pattern.description}</p>
        <div className="rounded border bg-background/60 p-3 text-xs">
          <div className="font-medium mb-1">Reflective prompt</div>
          <div className="text-muted-foreground">{pattern.reflective_prompt}</div>
        </div>
        {pattern.evidence_refs.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Evidence ({pattern.evidence_refs.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {pattern.evidence_refs.map((e, i) => (
                <li key={i} className="text-muted-foreground">
                  · [{e.source_table}#{e.source_id}] {e.date} — {e.excerpt}
                </li>
              ))}
            </ul>
          </details>
        )}
        {pattern.status === "open" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => onAction(pattern.id, "acknowledged")}>
              Acknowledge
            </Button>
            <Button size="sm" onClick={() => onAction(pattern.id, "actioned")}>
              Mark actioned
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAction(pattern.id, "dismissed")}>
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WarningCard({
  warning,
  onAction,
}: {
  warning: AriaEarlyWarning;
  onAction: (id: string, status: "acknowledged" | "escalated" | "closed") => void;
}) {
  return (
    <Card className={`border-2 ${SEVERITY_TONE[warning.severity]}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 mt-0.5" />
            <div>
              <CardTitle className="text-base">{warning.title}</CardTitle>
              <CardDescription>
                {warning.warning_type.replace(/_/g, " ")} · status: {warning.status}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-background">
            {warning.severity.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{warning.rationale}</p>
        <div className="rounded border bg-background/60 p-3 text-xs">
          <div className="font-medium mb-1">Recommended action</div>
          <div className="text-muted-foreground">{warning.recommended_action}</div>
        </div>
        {warning.status === "active" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => onAction(warning.id, "acknowledged")}>
              Acknowledge
            </Button>
            <Button size="sm" onClick={() => onAction(warning.id, "escalated")}>
              Escalate
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAction(warning.id, "closed")}>
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EarlyWarningsPage() {
  const auth = useAuthContext();
  const [showAll, setShowAll] = useState(false);
  const patternsQ = useSafeguardingPatterns(HOME_ID, showAll ? undefined : "open");
  const warningsQ = useEarlyWarnings(HOME_ID, showAll ? undefined : "active");
  const scan = useRunSafeguardingScan();
  const updatePattern = useUpdateSafeguardingPattern();
  const updateWarning = useUpdateEarlyWarning();

  const patterns = patternsQ.data?.data ?? [];
  const warnings = warningsQ.data?.data ?? [];

  const handleScan = () => {
    scan.mutate({
      home_id: HOME_ID,
      actor_id: auth.currentUser?.id,
      actor_role: auth.currentRole,
    });
  };

  return (
    <PageShell
      title="Early Warnings"
      subtitle="ARIA scans live records for safeguarding patterns. Manager review required."
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show open/active only" : "Show all"}
          </Button>
          <Button size="sm" onClick={handleScan} disabled={scan.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${scan.isPending ? "animate-spin" : ""}`} />
            Run scan
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Early warnings */}
        <section>
          <header className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-rose-700" />
            <h2 className="text-lg font-semibold">Early warnings</h2>
            <Badge variant="outline">{warnings.length}</Badge>
          </header>
          {warningsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : warnings.length === 0 ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                No active early warnings.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {warnings.map((w) => (
                <WarningCard
                  key={w.id}
                  warning={w}
                  onAction={(id, status) =>
                    updateWarning.mutate({
                      id,
                      status,
                      actor_id: auth.currentUser?.id,
                      actor_role: auth.currentRole,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Patterns */}
        <section>
          <header className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-semibold">Detected patterns</h2>
            <Badge variant="outline">{patterns.length}</Badge>
          </header>
          {patternsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : patterns.length === 0 ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                No safeguarding patterns currently detected. Run a scan to refresh.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {patterns.map((p) => (
                <PatternCard
                  key={p.id}
                  pattern={p}
                  onAction={(id, status) =>
                    updatePattern.mutate({
                      id,
                      status,
                      actor_id: auth.currentUser?.id,
                      actor_role: auth.currentRole,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
