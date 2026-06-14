"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, Gift, CheckCircle2, ArrowRight, ArrowLeft, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { toast } from "sonner";
import type {
  GiftRecord, GiftDirection, GiftRecipientType, GiftSource, GiftApprovalStatus,
} from "@/types/extended";
import {
  GIFT_DIRECTION_LABEL, GIFT_RECIPIENT_TYPE_LABEL, GIFT_SOURCE_LABEL, GIFT_APPROVAL_STATUS_LABEL,
} from "@/types/extended";
import { useGiftRecords, useCreateGiftRecord } from "@/hooks/use-gift-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local styling maps ───────────────────────────────────────────────────── */

const DIR_CLR: Record<GiftDirection, string> = { received: "bg-green-100 text-green-800", given: "bg-blue-100 text-blue-800" };
const STATUS_CLR: Record<GiftApprovalStatus, string> = { approved: "bg-green-100 text-green-800", declined: "bg-red-100 text-red-800", pending: "bg-amber-100 text-amber-800", returned: "bg-slate-100 text-[var(--cs-navy)]" };
const BORDER_DIR: Record<GiftDirection, string> = { received: "border-l-green-400", given: "border-l-blue-400" };

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function GiftsRegisterPage() {
  const { data: queryData, isLoading } = useGiftRecords();
  const createMutation = useCreateGiftRecord();
  const data = queryData?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterDirection, setFilterDirection] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<Partial<GiftRecord>>({});

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterDirection !== "all" && r.direction !== filterDirection) return false;
      if (filterStatus !== "all" && r.approval_status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.recipient_name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.source_name.toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "value": return b.estimated_value - a.estimated_value;
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterDirection, filterStatus, sortBy]);

  const totalGifts = data.length;
  const received = data.filter((r) => r.direction === "received").length;
  const declined = data.filter((r) => r.approval_status === "declined" || r.approval_status === "returned").length;
  const safeguardingFlags = data.filter((r) => r.safeguarding_concerns).length;
  const totalValue = data.filter((r) => r.approval_status === "approved").reduce((sum, r) => sum + r.estimated_value, 0);

  const exportCols: ExportColumn<GiftRecord>[] = [
    { header: "Date", accessor: (r: GiftRecord) => r.date },
    { header: "Direction", accessor: (r: GiftRecord) => GIFT_DIRECTION_LABEL[r.direction] },
    { header: "Recipient", accessor: (r: GiftRecord) => r.recipient_name },
    { header: "Source", accessor: (r: GiftRecord) => r.source_name },
    { header: "Description", accessor: (r: GiftRecord) => r.description },
    { header: "Est. Value (£)", accessor: (r: GiftRecord) => String(r.estimated_value) },
    { header: "Status", accessor: (r: GiftRecord) => GIFT_APPROVAL_STATUS_LABEL[r.approval_status] },
    { header: "Safeguarding", accessor: (r: GiftRecord) => r.safeguarding_concerns ? "Yes" : "No" },
    { header: "Reason", accessor: (r: GiftRecord) => r.reason },
    { header: "Recorded By", accessor: (r: GiftRecord) => getStaffName(r.recorded_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Gifts & Hospitality Register" subtitle="Anti-Bribery Policy · Safeguarding · Reg 12 · Delegated Authority">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Gifts & Hospitality Register" subtitle="Anti-Bribery Policy · Safeguarding · Reg 12 · Delegated Authority" 
      caraContext={{ pageTitle: "Gifts & Hospitality Register", sourceType: "child_record" }}
      actions={<div className="flex items-center gap-2"><PrintButton title="Gifts Register" /><ExportButton data={filtered} columns={exportCols} filename="gifts-register" /><CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Gift</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Entries", value: totalGifts, icon: Gift, clr: "text-blue-600" },
            { label: "Received", value: received, icon: ArrowLeft, clr: "text-green-600" },
            { label: "Declined / Returned", value: declined, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Safeguarding Flags", value: safeguardingFlags, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "Total Value (Approved)", value: `£${totalValue}`, icon: CheckCircle2, clr: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {safeguardingFlags > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-red-800">{safeguardingFlags} gift(s) flagged with safeguarding concerns</p><p className="text-red-700">Unexplained or inappropriate gifts can be indicators of grooming or exploitation. All flagged gifts have been reported to the relevant social worker.</p></div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search recipient, item, source…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterDirection} onValueChange={setFilterDirection}><SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="received">Received</SelectItem><SelectItem value="given">Given</SelectItem></SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(GIFT_APPROVAL_STATUS_LABEL) as GiftApprovalStatus[]).map((k) => (<SelectItem key={k} value={k}>{GIFT_APPROVAL_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="value">By Value</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_DIR[r.direction])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.direction === "received" ? <ArrowLeft className="h-4 w-4 text-green-600" /> : <ArrowRight className="h-4 w-4 text-blue-600" />}
                        {r.description}
                        <Badge variant="outline" className={DIR_CLR[r.direction]}>{GIFT_DIRECTION_LABEL[r.direction]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.approval_status]}>{GIFT_APPROVAL_STATUS_LABEL[r.approval_status]}</Badge>
                        {r.safeguarding_concerns && <Badge variant="destructive">⚠ Safeguarding</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.direction === "received" ? `From: ${r.source_name} → To: ${r.recipient_name}` : `From: Home → To: ${r.recipient_name}`} · {r.date} · Est. value: £{r.estimated_value}
                      </p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><p className="font-medium mb-1">Reason / Decision</p><p className="text-muted-foreground">{r.reason}</p></div>
                      <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground">{r.notes}</p></div>
                    </div>
                    {r.safeguarding_concerns && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="font-medium text-red-800 mb-1">Safeguarding Notes</p>
                        <p className="text-red-700 text-xs">{r.safeguarding_notes}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Recorded by: {getStaffName(r.recorded_by)}</span>
                      <span>Source: {GIFT_SOURCE_LABEL[r.source]}</span>
                      <span>{r.approved_by ? `Approved by: ${getStaffName(r.approved_by)}` : "Pending approval"}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Gifts to/from children in care must be recorded and approved by the Registered Manager. Unexplained or inappropriate gifts may indicate grooming or exploitation and must be assessed as a safeguarding concern. Staff gifts above £20 must be declared. All gifts recorded and available for inspection (Reg 44, Reg 45). Delegated authority provisions apply — check placement plan for specific gift approval thresholds for each child.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Gift</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" value={draft.date ?? ""} onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))} /></div>
            <div><Label>Direction</Label><Select value={draft.direction ?? ""} onValueChange={(v) => setDraft((p) => ({ ...p, direction: v as GiftDirection }))}><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent><SelectItem value="received">Received</SelectItem><SelectItem value="given">Given</SelectItem></SelectContent></Select></div>
            <div><Label>Recipient</Label><Input placeholder="Who received the gift?" value={draft.recipient_name ?? ""} onChange={(e) => setDraft((p) => ({ ...p, recipient_name: e.target.value }))} /></div>
            <div><Label>Source / From</Label><Input placeholder="Who gave the gift?" value={draft.source_name ?? ""} onChange={(e) => setDraft((p) => ({ ...p, source_name: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Description</Label><Input placeholder="What was the gift?" value={draft.description ?? ""} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Estimated Value (£)</Label><Input type="number" placeholder="0" value={draft.estimated_value ?? ""} onChange={(e) => setDraft((p) => ({ ...p, estimated_value: Number(e.target.value) || 0 }))} /></div>
            <div><Label>Approval Status</Label><Select value={draft.approval_status ?? ""} onValueChange={(v) => setDraft((p) => ({ ...p, approval_status: v as GiftApprovalStatus }))}><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(GIFT_APPROVAL_STATUS_LABEL) as GiftApprovalStatus[]).map((k) => (<SelectItem key={k} value={k}>{GIFT_APPROVAL_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Reason / Decision</Label><Textarea rows={2} placeholder="Why approved/declined?" value={draft.reason ?? ""} onChange={(e) => setDraft((p) => ({ ...p, reason: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button disabled={createMutation.isPending} onClick={() => createMutation.mutate(draft, { onSuccess: () => { toast.success("Gift recorded"); setShowNew(false); setDraft({}); } })}>{createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Gifts & Hospitality Register — gifts to staff, gifts to children, hospitality, transparency, conflicts of interest, professional boundaries, Reg 35 notifications"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}