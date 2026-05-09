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
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Phone, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useSocialWorkerContactRecords } from "@/hooks/use-social-worker-contact-records";
import type {
  SocialWorkerContactRecord,
  SocialWorkerContactType,
  SocialWorkerContactDirection,
  SocialWorkerContactUrgency,
} from "@/types/extended";
import {
  SOCIAL_WORKER_CONTACT_TYPE_LABEL,
  SOCIAL_WORKER_CONTACT_DIRECTION_LABEL,
  SOCIAL_WORKER_CONTACT_URGENCY_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ─────────────────────────────────────────────────────── */

const CT_CLR: Record<SocialWorkerContactType, string> = {
  phone_call: "bg-blue-100 text-blue-800", email: "bg-gray-100 text-gray-800",
  visit: "bg-green-100 text-green-800", lac_review: "bg-purple-100 text-purple-800",
  video_call: "bg-indigo-100 text-indigo-800", text: "bg-slate-100 text-slate-800",
  unplanned: "bg-amber-100 text-amber-800", statutory_visit: "bg-emerald-100 text-emerald-800",
};
const DIR_CLR: Record<SocialWorkerContactDirection, string> = { incoming: "bg-teal-100 text-teal-800", outgoing: "bg-sky-100 text-sky-800" };
const URG_CLR: Record<SocialWorkerContactUrgency, string> = { routine: "bg-gray-100 text-gray-800", urgent: "bg-amber-100 text-amber-800", emergency: "bg-red-100 text-red-800" };

/* social worker directory per child (kept local — not serialisable to store) */
const SW_DIR: Record<string, { name: string; team: string; email: string; phone: string }> = {
  yp_alex: { name: "Karen Holding", team: "Millbrook Children's Services", email: "karen.holding@millbrook.gov.uk", phone: "01onal 778 2341" },
  yp_jordan: { name: "Michael Osei", team: "Fairfield MASH Team", email: "michael.osei@fairfield.gov.uk", phone: "01onal 445 9821" },
  yp_casey: { name: "Fiona Brennan", team: "Southgate Child Protection", email: "fiona.brennan@southgate.gov.uk", phone: "01onal 332 7765" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function SocialWorkerContactPage() {
  const { data: records = [], isLoading } = useSocialWorkerContactRecords();
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const childIds = useMemo(() => Array.from(new Set(records.map((r) => r.child_id))), [records]);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.child_id).toLowerCase().includes(s) || r.social_worker_name.toLowerCase().includes(s) || r.summary.toLowerCase().includes(s)); }
    if (childFilter !== "all") out = out.filter(r => r.child_id === childFilter);
    if (typeFilter !== "all") out = out.filter(r => r.contact_type === typeFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return out;
  }, [records, search, childFilter, typeFilter, sortBy]);

  const today = new Date().toISOString().slice(0, 10);
  const overdueFollowUps = records.filter(r => r.follow_up_required && r.follow_up_date && r.follow_up_date < today && r.action_items.some(a => a.status !== "completed"));
  const statVisits = records.filter(r => r.contact_type === "statutory_visit").length;
  const thisMonth = records.length;

  const exportCols: ExportColumn<SocialWorkerContactRecord>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Time", accessor: (r) => r.time },
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Social Worker", accessor: (r) => r.social_worker_name },
    { header: "Team", accessor: (r) => r.social_worker_team },
    { header: "Type", accessor: (r) => SOCIAL_WORKER_CONTACT_TYPE_LABEL[r.contact_type] },
    { header: "Direction", accessor: (r) => SOCIAL_WORKER_CONTACT_DIRECTION_LABEL[r.direction] },
    { header: "Urgency", accessor: (r) => SOCIAL_WORKER_CONTACT_URGENCY_LABEL[r.urgency] },
    { header: "Staff", accessor: (r) => getStaffName(r.staff_member) },
    { header: "Purpose", accessor: (r) => r.purpose },
    { header: "Summary", accessor: (r) => r.summary },
    { header: "Outcome", accessor: (r) => r.outcome },
  ];

  if (isLoading) {
    return (
      <PageShell title="Social Worker Contact Log" subtitle="Communication record with allocated social workers — Regulation 5">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Social Worker Contact Log"
      subtitle="Communication record with allocated social workers — Regulation 5"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Social Worker Contact Log" />
          <ExportButton data={filtered} columns={exportCols} filename="sw-contact-log" />
          <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Contact</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Contacts This Month", value: thisMonth, icon: Phone, colour: "text-blue-600" },
            { label: "Statutory Visits", value: statVisits, icon: CheckCircle2, colour: "text-emerald-600" },
            { label: "Overdue Follow-Ups", value: overdueFollowUps.length, icon: AlertTriangle, colour: "text-red-600" },
            { label: "Avg Contacts / Week", value: records.length > 0 ? Math.round(records.length / 4 * 10) / 10 : 0, icon: Clock, colour: "text-gray-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* per-child SW cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {childIds.map(cid => {
            const sw = SW_DIR[cid];
            const recs = records.filter(r => r.child_id === cid).sort((a, b) => b.date.localeCompare(a.date));
            const last = recs[0];
            const next = recs.map(r => r.next_scheduled_contact).filter(Boolean).sort()[0];
            const daysSince = last ? Math.round((Date.now() - new Date(last.date).getTime()) / 86400000) : 999;
            const rag = daysSince <= 7 ? "border-green-400" : daysSince <= 21 ? "border-amber-400" : "border-red-400";
            return (
              <Card key={cid} className={cn("border-l-4", rag)}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{getYPName(cid)}</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><strong>SW:</strong> {sw?.name}</p>
                  <p className="text-xs text-muted-foreground">{sw?.team}</p>
                  <p className="text-xs">{sw?.phone} · {sw?.email}</p>
                  <div className="flex justify-between pt-1"><span className="text-muted-foreground">Last Contact</span><span>{last?.date ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Next Scheduled</span><span>{next ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Contacts</span><span className="font-medium">{recs.length}</span></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* alert banner */}
        {overdueFollowUps.length > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{overdueFollowUps.length} overdue follow-up{overdueFollowUps.length > 1 ? "s" : ""}</p>
              <ul className="text-sm text-red-800 mt-1 list-disc list-inside">
                {overdueFollowUps.map(r => <li key={r.id}>{getYPName(r.child_id)} — {r.purpose} (follow-up due {r.follow_up_date})</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* filter bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs">Search</Label>
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Name, SW, summary…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              </div>
              <div className="w-40">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Child</Label>
                <Select value={childFilter} onValueChange={setChildFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Children</SelectItem>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs">Contact Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.keys(SOCIAL_WORKER_CONTACT_TYPE_LABEL) as SocialWorkerContactType[]).map(k => <SelectItem key={k} value={k}>{SOCIAL_WORKER_CONTACT_TYPE_LABEL[k]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* contact cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.child_id)}</CardTitle>
                        <Badge className={cn("text-xs", CT_CLR[r.contact_type])}>{SOCIAL_WORKER_CONTACT_TYPE_LABEL[r.contact_type]}</Badge>
                        <Badge className={cn("text-xs", DIR_CLR[r.direction])}>{SOCIAL_WORKER_CONTACT_DIRECTION_LABEL[r.direction]}</Badge>
                        {r.urgency !== "routine" && <Badge className={cn("text-xs", URG_CLR[r.urgency])}>{SOCIAL_WORKER_CONTACT_URGENCY_LABEL[r.urgency]}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.date} {r.time}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.purpose} · SW: {r.social_worker_name} · Staff: {getStaffName(r.staff_member)}</p>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-sm">{r.summary}</p>

                    {r.key_decisions.length > 0 && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Key Decisions</p>
                        <ol className="list-decimal list-inside text-sm text-blue-900 space-y-0.5">{r.key_decisions.map((kd, i) => <li key={i}>{kd}</li>)}</ol>
                      </div>
                    )}

                    {r.action_items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Action Items</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Action</th><th className="text-left p-2 font-medium">Owner</th><th className="text-left p-2 font-medium">Due</th><th className="text-left p-2 font-medium">Status</th></tr></thead>
                          <tbody>{r.action_items.map((a, i) => {
                            const od = a.status !== "completed" && a.due_date < today;
                            return (
                              <tr key={i} className={cn("border-t", od && "bg-red-50")}>
                                <td className="p-2">{a.action}</td>
                                <td className="p-2">{getStaffName(a.owner)}</td>
                                <td className={cn("p-2", od && "text-red-600 font-medium")}>{a.due_date}{od && " (OVERDUE)"}</td>
                                <td className="p-2"><Badge className={cn("text-xs", a.status === "completed" ? "bg-green-100 text-green-800" : a.status === "overdue" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800")}>{a.status}</Badge></td>
                              </tr>
                            );
                          })}</tbody>
                        </table>
                      </div>
                    )}

                    {r.documents_shared.length > 0 && (
                      <div><p className="text-xs font-semibold mb-1">Documents Shared</p><div className="flex gap-1 flex-wrap">{r.documents_shared.map(dc => <Badge key={dc} variant="outline" className="text-xs">{dc}</Badge>)}</div></div>
                    )}

                    {r.child_views && (
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <p className="text-xs font-semibold text-pink-800 mb-1">Child&apos;s Views {r.child_aware ? <CheckCircle2 className="inline h-3 w-3 text-green-600 ml-1" /> : <span className="text-xs text-muted-foreground ml-1">(not yet informed)</span>}</p>
                        <p className="text-sm text-pink-900">{r.child_views}</p>
                      </div>
                    )}

                    {r.follow_up_required && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">Follow-up required:</span>
                        <span className={cn(r.follow_up_date && r.follow_up_date < today ? "text-red-600 font-medium" : "")}>{r.follow_up_date ?? "TBC"}</span>
                      </div>
                    )}

                    {r.outcome && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">Outcome</p>
                        <p className="text-sm text-green-900">{r.outcome}</p>
                      </div>
                    )}

                    {r.next_scheduled_contact && (
                      <p className="text-xs text-muted-foreground">Next scheduled contact: <strong>{r.next_scheduled_contact}</strong></p>
                    )}

                    <SmartLinkPanel sourceType="social-worker-contact" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No contacts match filters.</p>}
        </div>

        {/* statutory visit tracker */}
        <Card>
          <CardHeader><CardTitle className="text-base">Statutory Visit Tracker</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm border">
              <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Young Person</th><th className="text-left p-2 font-medium">Social Worker</th><th className="text-left p-2 font-medium">Last Statutory Visit</th><th className="text-left p-2 font-medium">Days Since</th><th className="text-left p-2 font-medium">Next Due</th></tr></thead>
              <tbody>
                {childIds.map(cid => {
                  const sv = records.filter(r => r.child_id === cid && r.contact_type === "statutory_visit").sort((a, b) => b.date.localeCompare(a.date))[0];
                  const days = sv ? Math.round((Date.now() - new Date(sv.date).getTime()) / 86400000) : 999;
                  const dFn = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
                  return (
                    <tr key={cid} className="border-t">
                      <td className="p-2 font-medium">{getYPName(cid)}</td>
                      <td className="p-2">{SW_DIR[cid]?.name}</td>
                      <td className="p-2">{sv?.date ?? "No record"}</td>
                      <td className="p-2"><Badge className={cn("text-xs", days <= 28 ? "bg-green-100 text-green-800" : days <= 42 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800")}>{days} days</Badge></td>
                      <td className="p-2">{sv ? dFn(42 - days) : "Overdue"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 5 — Engagement with parents, social workers, and other relevant persons. Statutory visits must occur at intervals set by the IRO (typically every 6 weeks). All contact with allocated social workers must be recorded and available for inspection.</p>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Social Worker Contact</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Date</Label><Input type="date" /></div><div><Label>Time</Label><Input type="time" /></div></div>
            <div><Label>Contact Type</Label><Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{(Object.keys(SOCIAL_WORKER_CONTACT_TYPE_LABEL) as SocialWorkerContactType[]).map(k => <SelectItem key={k} value={k}>{SOCIAL_WORKER_CONTACT_TYPE_LABEL[k]}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Direction</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="incoming">Incoming</SelectItem><SelectItem value="outgoing">Outgoing</SelectItem></SelectContent></Select></div>
            <div><Label>Purpose</Label><Input placeholder="Purpose of contact" /></div>
            <div><Label>Summary</Label><Textarea rows={3} placeholder="Summary of discussion…" /></div>
            <div><Label>Outcome</Label><Textarea rows={2} placeholder="Outcome / agreed actions…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Save Contact</Button>
          </DialogFooter>
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
