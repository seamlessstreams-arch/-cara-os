"use client";

import { useState, useMemo } from "react";
import {
  KeyRound, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, XCircle, HelpCircle, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import { useDelegatedAuthority } from "@/hooks/use-delegated-authority";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { DelegatedAuthority, DelegatedAuthorityItem, DelegatedAuthStatus, DelegatedAuthCategory } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── config ──────────────────────────────────────────────────────────── */
const STATUS_COLORS: Record<DelegatedAuthStatus, string> = {
  granted: "bg-green-100 text-green-800", not_granted: "bg-red-100 text-red-800",
  partial: "bg-yellow-100 text-yellow-800", pending: "bg-slate-100 text-[var(--cs-navy)]",
};
const STATUS_LABELS: Record<DelegatedAuthStatus, string> = {
  granted: "Granted", not_granted: "Not Granted",
  partial: "Partial", pending: "Pending",
};

const CAT_LABELS: Record<DelegatedAuthCategory, string> = {
  medical: "Medical Consent", education: "Education Decisions",
  leisure: "Leisure & Activities", overnight_stays: "Overnight Stays",
  travel: "Travel & Holidays", haircut_appearance: "Haircut / Appearance",
  social_media: "Social Media / Phone", religion: "Religion & Culture",
  pocket_money: "Pocket Money / Spending", contact: "Contact Arrangements",
  photography: "Photography / Media", emergency: "Emergency Decisions",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function DelegatedAuthorityPage() {
  const { data: daData, isLoading } = useDelegatedAuthority();
  const records = daData?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const ypIds = ["yp_alex", "yp_jordan", "yp_casey"];

  /* per-child stats */
  const ypStats = records.map((r) => {
    const granted = r.items.filter((i) => i.status === "granted").length;
    const notGranted = r.items.filter((i) => i.status === "not_granted").length;
    const partial = r.items.filter((i) => i.status === "partial").length;
    const pending = r.items.filter((i) => i.status === "pending").length;
    const reviewDue = r.next_review < today;
    return { id: r.child_id, name: getYPName(r.child_id), granted, notGranted, partial, pending, reviewDue, total: r.items.length };
  });

  const totalPending = records.reduce((s, r) => s + r.items.filter((i) => i.status === "pending").length, 0);
  const reviewsDue = records.filter((r) => r.next_review < today).length;

  /* flatten for export */
  const exportData = useMemo(() => {
    return records.flatMap((r) =>
      r.items.map((item) => ({ child_id: r.child_id, last_reviewed: r.last_reviewed, next_review: r.next_review, ...item }))
    );
  }, [records]);

  type ExportRow = DelegatedAuthorityItem & { child_id: string; last_reviewed: string; next_review: string };

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Young Person", accessor: (r: ExportRow) => getYPName(r.child_id) },
    { header: "Category", accessor: (r: ExportRow) => CAT_LABELS[r.category] },
    { header: "Status", accessor: (r: ExportRow) => STATUS_LABELS[r.status] },
    { header: "Detail", accessor: (r: ExportRow) => r.detail },
    { header: "Conditions", accessor: (r: ExportRow) => r.conditions },
    { header: "Granted By", accessor: (r: ExportRow) => r.granted_by },
    { header: "Granted Date", accessor: (r: ExportRow) => r.granted_date },
    { header: "Review Date", accessor: (r: ExportRow) => r.review_date },
    { header: "Last Reviewed", accessor: (r: ExportRow) => r.last_reviewed },
    { header: "Next Review", accessor: (r: ExportRow) => r.next_review },
  ];

  const StatusIcon = ({ status }: { status: DelegatedAuthStatus }) => {
    switch (status) {
      case "granted": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "not_granted": return <XCircle className="h-4 w-4 text-red-600" />;
      case "partial": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "pending": return <HelpCircle className="h-4 w-4 text-[var(--cs-text-muted)]" />;
    }
  };

  return (
    <PageShell
      title="Delegated Authority"
      subtitle="Regulation 20 — decisions the home is authorised to make for each child"
      caraContext={{ pageTitle: "Delegated Authority", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Delegated Authority" />
          <ExportButton data={exportData} columns={exportCols} filename="delegated-authority" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Young People", value: records.length, icon: KeyRound, colour: "text-blue-600" },
            { label: "Pending Decisions", value: totalPending, icon: Clock, colour: totalPending > 0 ? "text-orange-600" : "text-[var(--cs-text-muted)]" },
            { label: "Reviews Due", value: reviewsDue, icon: AlertTriangle, colour: reviewsDue > 0 ? "text-red-600" : "text-green-600" },
            { label: "Total Delegations", value: records.reduce((s, r) => s + r.items.length, 0), icon: CheckCircle2, colour: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── per-child summary ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ypStats.map((yp) => (
            <div key={yp.id} className={cn("rounded-xl border bg-white p-4", yp.reviewDue && "border-orange-300")}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium">{yp.name}</p>
                {yp.reviewDue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Review Due</Badge>}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{yp.granted}</p>
                  <p className="text-[10px] text-muted-foreground">Granted</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">{yp.partial}</p>
                  <p className="text-[10px] text-muted-foreground">Partial</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{yp.notGranted}</p>
                  <p className="text-[10px] text-muted-foreground">Not Granted</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--cs-text-muted)]">{yp.pending}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── per-child detail ──────────────────────────────────── */}
        <div className="space-y-3">
          {records.map((record) => {
            const isExpanded = expanded === record.id;
            const yp = ypStats.find((y) => y.id === record.child_id)!;

            return (
              <div key={record.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : record.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <KeyRound className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(record.child_id)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last reviewed: {record.last_reviewed} · Next: {record.next_review} · {yp.granted}/{yp.total} granted
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {yp.pending > 0 && <Badge variant="outline" className="text-xs bg-slate-50">{yp.pending} pending</Badge>}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-3">
                    {(record.items ?? []).map((item: DelegatedAuthorityItem, idx: number) => (
                      <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                        item.status === "granted" ? "bg-green-50 border-green-200" :
                        item.status === "not_granted" ? "bg-red-50 border-red-200" :
                        item.status === "partial" ? "bg-yellow-50 border-yellow-200" :
                        "bg-white"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon status={item.status} />
                          <span className="font-medium">{CAT_LABELS[item.category]}</span>
                          <Badge className={cn("text-xs ml-auto", STATUS_COLORS[item.status])}>
                            {STATUS_LABELS[item.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{item.detail}</p>
                        {item.conditions && (
                          <p className="text-xs"><strong>Conditions:</strong> {item.conditions}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Granted by: {item.granted_by} · {item.granted_date} · Review: {item.review_date}
                        </p>
                      </div>
                    ))}

                    {record.notes && (
                      <div className="rounded-lg bg-white border p-3 mt-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}
                    <SmartLinkPanel sourceType="delegated_authority" sourceId={record.id} childId={record.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 20:</strong> The placing authority must set out in the placement plan the
          decisions which the registered person is authorised to make on behalf of the child. This must
          be clear, documented, and reviewed regularly. Staff should know what decisions they can and
          cannot make. Delegated authority supports normalised experiences for children in care and
          avoids unnecessary delays in day-to-day decision-making.
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Care Events — Finance"
        category="finance"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Delegated Authority — LA permissions for haircuts, piercings, holidays, activities, medical consent, social media, employment, driving, age-related items per child"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
