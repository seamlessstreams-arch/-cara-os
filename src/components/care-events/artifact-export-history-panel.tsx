"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ArtifactExportHistoryPanel  (Milestone 38)
//
// Inline card that lists every recorded export of a single persisted artifact
// (Inspection Snapshot or Reg 44 Pack). Lets a manager see at a glance
// whether the record has already left the home, and to whom / when / why.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, AlertTriangle } from "lucide-react";
import { useArtifactExportHistory } from "@/hooks/use-export-history";

interface Props {
  homeId: string;
  artifactId: string | null;
}

export function ArtifactExportHistoryPanel({ homeId, artifactId }: Props) {
  const { data, isLoading } = useArtifactExportHistory(homeId, artifactId);
  if (!artifactId) return null;
  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Share2 className="h-4 w-4 text-slate-500" />
          Export history for this artifact
          <Badge variant="outline" className="text-xs">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-slate-500">
            This artifact has not been exported yet. The export history is immutable —
            every export will be recorded here.
          </p>
        )}
        {rows.length > 0 && (
          <ul className="divide-y divide-slate-100 text-sm">
            {rows.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">{e.format}</Badge>
                    {e.is_safeguarding_sensitive && (
                      <Badge className="border border-rose-300 bg-rose-100 text-xs text-rose-800">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Safeguarding-sensitive
                      </Badge>
                    )}
                  </div>
                  {e.reason && <p className="mt-1 text-slate-700">Reason: {e.reason}</p>}
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{new Date(e.exported_at).toLocaleString()}</p>
                  <p>by {e.exported_by} <span className="text-slate-400">({e.exported_by_role})</span></p>
                  <p>{e.byte_size.toLocaleString()} bytes</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
