"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
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
  Plus, Filter, ChevronDown, ChevronUp,
  CheckCircle2, Clock, FileText, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useServiceUserAgreementRecords } from "@/hooks/use-service-user-agreement-records";
import type { ServiceUserAgreementRecord, ServiceUserAgreementType, ServiceUserAgreementStatus } from "@/types/extended";
import {
  SERVICE_USER_AGREEMENT_TYPE_LABEL,
  SERVICE_USER_AGREEMENT_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ─────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<ServiceUserAgreementStatus, string> = { active: "bg-green-100 text-green-800", under_review: "bg-amber-100 text-amber-800", expired: "bg-red-100 text-red-800", draft: "bg-blue-100 text-blue-800" };
const BORDER_ST: Record<ServiceUserAgreementStatus, string> = { active: "border-l-green-400", under_review: "border-l-amber-400", expired: "border-l-red-400", draft: "border-l-blue-400" };

/* ── component ────────────────────────────────────────────────────────────── */

export default function ServiceUserAgreementsPage() {
  const { data: records = [], isLoading } = useServiceUserAgreementRecords();
  const [filterChild, setFilterChild] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const childIds = useMemo(() => Array.from(new Set(records.map((r) => r.child_id))), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterChild !== "all" && r.child_id !== filterChild) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [records, filterChild, filterStatus]);

  const active = records.filter((r) => r.status === "active").length;
  const underReview = records.filter((r) => r.status === "under_review").length;
  const allAgreed = records.flatMap((r) => r.rules).filter((r) => r.agreed_by_yp).length;
  const notAgreed = records.flatMap((r) => r.rules).filter((r) => !r.agreed_by_yp).length;

  const exportCols: ExportColumn<ServiceUserAgreementRecord>[] = [
    { header: "Child", accessor: (r) => getYPName(r.child_id) },
    { header: "Agreement", accessor: (r) => SERVICE_USER_AGREEMENT_TYPE_LABEL[r.agreement_type] },
    { header: "Status", accessor: (r) => SERVICE_USER_AGREEMENT_STATUS_LABEL[r.status] },
    { header: "Created", accessor: (r) => r.created_date },
    { header: "Review Due", accessor: (r) => r.review_date },
    { header: "YP Signed", accessor: (r) => r.young_person_signed_date || "Not signed" },
    { header: "YP Views", accessor: (r) => r.young_person_views },
    { header: "Created By", accessor: (r) => getStaffName(r.created_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Young Person Agreements" subtitle="Reg 7 — Children's Wishes & Feelings · Co-Produced Expectations">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Young Person Agreements" subtitle="Reg 7 — Children's Wishes & Feelings · Co-Produced Expectations" actions={<div className="flex items-center gap-2"><PrintButton title="YP Agreements" /><ExportButton data={filtered} columns={exportCols} filename="yp-agreements" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Agreement</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Agreements", value: active, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Under Review", value: underReview, icon: Clock, clr: "text-amber-600" },
            { label: "Rules Agreed by YP", value: allAgreed, icon: FileText, clr: "text-blue-600" },
            { label: "Rules Not Agreed", value: notAgreed, icon: AlertTriangle, clr: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
          <p className="font-semibold text-blue-800">Voice of the Child</p>
          <p className="text-blue-700">All agreements are co-produced with the young person. Their views are recorded even when a rule is imposed for safeguarding reasons. Agreements should feel fair and achievable — not punitive.</p>
        </div>

        <div className="flex gap-3 mb-6">
          <Select value={filterChild} onValueChange={setFilterChild}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Children</SelectItem>{childIds.map((id) => (<SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>))}</SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(SERVICE_USER_AGREEMENT_STATUS_LABEL) as ServiceUserAgreementStatus[]).map((k) => (<SelectItem key={k} value={k}>{SERVICE_USER_AGREEMENT_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
        </div>

        <div className="space-y-4">
          {filtered.map((r) => {
            const open = expanded[r.id];
            const agreedCount = r.rules.filter((rl) => rl.agreed_by_yp).length;
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_ST[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getYPName(r.child_id)} — {SERVICE_USER_AGREEMENT_TYPE_LABEL[r.agreement_type]}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{SERVICE_USER_AGREEMENT_STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline" className="bg-muted/30">{agreedCount}/{r.rules.length} agreed</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Created: {r.created_date} · Review: {r.review_date} · Signed: {r.young_person_signed_date || "Not yet"}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-800 mb-1">Young Person&apos;s Views</p>
                      <p className="text-blue-700 text-xs italic">{r.young_person_views}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Rules & Expectations</p>
                      <div className="space-y-2">
                        {r.rules.map((rl, i) => (
                          <div key={i} className={cn("rounded-lg p-3 border", rl.agreed_by_yp ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                            <div className="flex items-start gap-2">
                              <span className="shrink-0 mt-0.5">{rl.agreed_by_yp ? "✅" : "❌"}</span>
                              <div>
                                <p className="text-xs font-medium">{rl.rule}</p>
                                {rl.notes && <p className="text-xs text-muted-foreground mt-1">{rl.notes}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-amber-50 rounded-lg p-3"><p className="font-medium text-amber-800 mb-1">Consequences</p><p className="text-amber-700 text-xs">{r.consequences}</p></div>
                      <div className="bg-green-50 rounded-lg p-3"><p className="font-medium text-green-800 mb-1">Rewards</p><p className="text-green-700 text-xs">{r.rewards}</p></div>
                    </div>
                    {r.modifications && <div><p className="font-medium mb-1">Modifications & Negotiations</p><p className="text-muted-foreground text-xs">{r.modifications}</p></div>}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Created by: {getStaffName(r.created_by)}</span>
                      <span>SW aware: {r.social_worker_aware ? "Yes" : "No"}</span>
                      <span>Last reviewed: {r.last_reviewed_date}</span>
                    </div>

                    <SmartLinkPanel sourceType="service-user-agreements" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 7 — children&apos;s wishes and feelings must be sought, recorded, and taken into account. Agreements should be co-produced, age-appropriate, and reviewed regularly. Rules imposed for safeguarding reasons are not negotiable but the young person&apos;s views must still be heard and recorded. Agreements are not legally binding — they are tools for building understanding, trust, and predictability.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Agreement</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child…" /></SelectTrigger><SelectContent>{childIds.map((id) => (<SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Agreement Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(SERVICE_USER_AGREEMENT_TYPE_LABEL) as ServiceUserAgreementType[]).map((k) => (<SelectItem key={k} value={k}>{SERVICE_USER_AGREEMENT_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Review Date</Label><Input type="date" /></div>
            <div><Label>Status</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(SERVICE_USER_AGREEMENT_STATUS_LABEL) as ServiceUserAgreementStatus[]).map((k) => (<SelectItem key={k} value={k}>{SERVICE_USER_AGREEMENT_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Young Person&apos;s Views</Label><Textarea rows={2} placeholder="What did the young person say?" /></div>
            <div className="col-span-2"><Label>Rules (one per line)</Label><Textarea rows={4} placeholder="Enter each rule on a new line…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Agreement</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
