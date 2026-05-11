"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Manager Oversight Inbox  (Milestone 24)
//
// One ranked queue of every item awaiting a manager decision, drawn from the
// existing live engines (manager review, Reg 40, sensitive amendments, Reg 45
// chips, Annex A chips, routing failures). Each card links to the screen
// where the manager actually decides.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Inbox, Shield, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useOversightInbox } from "@/hooks/use-oversight-inbox";
import type {
  OversightItem,
  OversightItemSource,
  OversightPriority,
} from "@/lib/care-events/oversight-inbox";

const HOME_ID = "home_oak";

const PRIORITY_TONE: Record<OversightPriority, string> = {
  critical: "bg-rose-100 text-rose-800 border-rose-300",
  high:     "bg-orange-100 text-orange-800 border-orange-300",
  medium:   "bg-amber-100 text-amber-800 border-amber-300",
  low:      "bg-slate-100 text-slate-700 border-slate-300",
};

const SOURCE_LABEL: Record<OversightItemSource, string> = {
  manager_review:   "Manager review",
  reg40_triage:     "Reg 40 triage",
  amendment:        "Sensitive amendment",
  reg45_chip:       "Reg 45 evidence",
  annex_a_chip:     "Annex A evidence",
  routing_failure:  "Routing failure",
};

const PRIORITY_ORDER: OversightPriority[] = ["critical", "high", "medium", "low"];
const SOURCE_ORDER: OversightItemSource[] = [
  "manager_review", "reg40_triage", "amendment",
  "reg45_chip", "annex_a_chip", "routing_failure",
];

export default function OversightInboxPage() {
  const { data, refetch, isFetching, isLoading } = useOversightInbox(HOME_ID);
  const summary = data?.data;

  return (
    <PageShell
      title="Manager Oversight Inbox"
      subtitle="Every item awaiting a manager decision, ranked. Critical and safeguarding-sensitive items first."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading inbox…</p>}

      {summary && (
        <div className="space-y-6">
          {/* Priority counters */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {PRIORITY_ORDER.map((p) => (
              <Card key={p}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wide text-slate-500">
                    {p}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{summary.by_priority[p]}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Source counters */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SOURCE_ORDER.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {SOURCE_LABEL[s]}: {summary.by_source[s]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          {summary.items.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                <Inbox className="mx-auto mb-2 h-6 w-6" />
                Nothing to action. All clear.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {summary.items.map((item) => (
                <OversightCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

function OversightCard({ item }: { item: OversightItem }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`border ${PRIORITY_TONE[item.priority]}`}>{item.priority}</Badge>
          <Badge variant="outline" className="text-xs">{SOURCE_LABEL[item.source]}</Badge>
          {item.is_safeguarding_sensitive && (
            <Badge className="bg-rose-50 text-rose-700 border border-rose-200">
              <Shield className="mr-1 h-3 w-3" />
              Safeguarding-sensitive
            </Badge>
          )}
        </div>
        <CardTitle className="mt-2 text-base">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-slate-700">{item.detail}</p>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">
            Since {new Date(item.created_at).toLocaleString()}
            {item.child_id && <> · {item.child_id}</>}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={item.link_href}>
              Open <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
