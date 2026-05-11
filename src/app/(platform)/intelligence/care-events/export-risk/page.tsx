"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Export Abuse / Risk page  (Milestone 40)
//
// Surfaces flagged export activity over the immutable export history. CLAUDE.md
// observability + safeguarding mandate: managers must see if sensitive
// content is leaving the home in unusual patterns.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, ShieldAlert, Clock, MessageCircle } from "lucide-react";
import { useExportAbuse } from "@/hooks/use-export-abuse";
import type {
  ExportAbuseFlag,
  ExportAbuseFlagKind,
  ExportAbuseSeverity,
} from "@/lib/care-events/export-abuse";

const HOME_ID = "home_oak";

const KIND_LABEL: Record<ExportAbuseFlagKind, string> = {
  high_volume_24h:      "High volume (24h)",
  sensitive_burst_24h:  "Sensitive burst (24h)",
  off_hours_sensitive:  "Off-hours sensitive",
  unreasoned_sensitive: "Unreasoned sensitive",
};

const KIND_ICON: Record<ExportAbuseFlagKind, React.ComponentType<{ className?: string }>> = {
  high_volume_24h:      AlertTriangle,
  sensitive_burst_24h:  ShieldAlert,
  off_hours_sensitive:  Clock,
  unreasoned_sensitive: MessageCircle,
};

const SEVERITY_BADGE: Record<ExportAbuseSeverity, string> = {
  critical: "border border-rose-300 bg-rose-100 text-rose-800",
  warning:  "border border-amber-300 bg-amber-100 text-amber-800",
  info:     "border border-slate-200 bg-slate-100 text-slate-700",
};

export default function ExportAbusePage() {
  const { data, refetch, isFetching, isLoading } = useExportAbuse(HOME_ID);
  const r = data?.data;

  return (
    <PageShell
      title="Export Risk"
      subtitle="Unusual export activity over the immutable export history. Inspector-grade oversight."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {r && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Total flags</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-semibold">{r.total_flags}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-rose-700">{r.by_severity.critical}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Warning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-amber-700">{r.by_severity.warning}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Sensitive bursts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{r.by_kind.sensitive_burst_24h}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Flags</CardTitle></CardHeader>
            <CardContent>
              {r.flags.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No export risk flags detected. Every recorded export is within normal
                  thresholds, has a recorded reason, and was performed during home hours.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {r.flags.map((f) => <Row key={f.id} flag={f} />)}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function Row({ flag }: { flag: ExportAbuseFlag }) {
  const Icon = KIND_ICON[flag.kind];
  return (
    <li className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 h-5 w-5 text-slate-500" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`text-xs ${SEVERITY_BADGE[flag.severity]}`}>{flag.severity}</Badge>
          <Badge variant="outline" className="text-xs">{KIND_LABEL[flag.kind]}</Badge>
          <span className="text-xs font-mono text-slate-500">{flag.user_id}</span>
          <span className="text-xs text-slate-400">({flag.user_role})</span>
        </div>
        <p className="mt-1 text-slate-700">{flag.message}</p>
        {flag.entries.length > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            {flag.entries.length} contributing export{flag.entries.length === 1 ? "" : "s"}.
            Most recent: {new Date(flag.entries[0].exported_at).toLocaleString()}
          </p>
        )}
      </div>
    </li>
  );
}
