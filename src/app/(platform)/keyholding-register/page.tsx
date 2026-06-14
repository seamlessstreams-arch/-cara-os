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
  AlertTriangle, CheckCircle2, Clock, Key, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { toast } from "sonner";
import { useKeyRecords, useCreateKeyRecord } from "@/hooks/use-key-records";
import type { KeyRecord, KeyType, KeyholdingStatus } from "@/types/extended";
import { KEY_TYPE_LABEL, KEYHOLDING_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── colour maps ──────────────────────────────────────────────────────── */

const KT_CLR: Record<KeyType, string> = {
  master: "bg-purple-100 text-purple-800", room: "bg-blue-100 text-blue-800",
  office: "bg-gray-100 text-gray-800", vehicle: "bg-green-100 text-green-800",
  safe: "bg-red-100 text-red-800", medication_cabinet: "bg-amber-100 text-amber-800",
  external: "bg-teal-100 text-teal-800", fob: "bg-indigo-100 text-indigo-800",
  gate: "bg-emerald-100 text-emerald-800",
};

const KS_CLR: Record<KeyholdingStatus, string> = {
  in_use: "bg-blue-100 text-blue-800", all_accounted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800", replacement_ordered: "bg-amber-100 text-amber-800",
  decommissioned: "bg-gray-100 text-gray-800",
};

export default function KeyholdingRegisterPage() {
  const { data: res, isLoading } = useKeyRecords();
  const data: KeyRecord[] = res?.data ?? [];
  const createItem = useCreateKeyRecord();
  const [krForm, setKrForm] = useState({ key_name: "", key_number: "", total_copies: "1", key_type: "master" as KeyType, location: "", notes: "" });
  const setKR = (k: string, v: unknown) => setKrForm((p) => ({ ...p, [k]: v }));

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!krForm.key_name.trim()) { toast.error("Key name is required."); return; }
    const today = new Date().toISOString().slice(0, 10);
    await createItem.mutateAsync({ key_name: krForm.key_name.trim(), key_type: krForm.key_type, key_number: krForm.key_number.trim(), total_copies: parseInt(krForm.total_copies) || 1, permanent_holders: [], sign_out_log: [], restricted_access: false, authorised_staff: [], location: krForm.location.trim(), last_audit: today, next_audit_due: "", status: "in_use", lost_key_incidents: [], notes: krForm.notes.trim(), created_at: new Date().toISOString() });
    toast.success("Key record added.");
    setKrForm({ key_name: "", key_number: "", total_copies: "1", key_type: "master", location: "", notes: "" });
    setDialogOpen(false);
  };

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => r.key_name.toLowerCase().includes(s) || r.key_number.toLowerCase().includes(s)); }
    if (typeFilter !== "all") out = out.filter(r => r.key_type === typeFilter);
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "type": return a.key_type.localeCompare(b.key_type);
        case "audit": return a.next_audit_due.localeCompare(b.next_audit_due);
        default: return a.key_name.localeCompare(b.key_name);
      }
    });
    return out;
  }, [data, search, typeFilter, statusFilter, sortBy]);

  const signedOut = data.reduce((s, k) => s + k.sign_out_log.filter(e => !e.signed_in).length, 0);
  const lostCount = data.filter(k => k.status === "lost").length;
  const auditOverdue = data.filter(k => k.next_audit_due < today).length;

  const exportCols: ExportColumn<KeyRecord>[] = useMemo(() => [
    { header: "Key Name", accessor: (r: KeyRecord) => r.key_name },
    { header: "Type", accessor: (r: KeyRecord) => KEY_TYPE_LABEL[r.key_type] },
    { header: "Key Number", accessor: (r: KeyRecord) => r.key_number },
    { header: "Copies", accessor: (r: KeyRecord) => String(r.total_copies) },
    { header: "Restricted", accessor: (r: KeyRecord) => r.restricted_access ? "Yes" : "No" },
    { header: "Holders", accessor: (r: KeyRecord) => r.permanent_holders.map(h => getStaffName(h.staff_id)).join(", ") || "None" },
    { header: "Location", accessor: (r: KeyRecord) => r.location },
    { header: "Status", accessor: (r: KeyRecord) => KEYHOLDING_STATUS_LABEL[r.status] },
    { header: "Last Audit", accessor: (r: KeyRecord) => r.last_audit },
    { header: "Next Audit Due", accessor: (r: KeyRecord) => r.next_audit_due },
  ], []);

  if (isLoading) return <PageShell title="Keyholding Register" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Keyholding Register"
      subtitle="Key, fob, and access device tracking — security compliance"
      caraContext={{ pageTitle: "Keyholding Register", sourceType: "home_check" }}
      actions={[
        <PrintButton key="p" title="Keyholding Register" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="keyholding-register" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Key</Button>,
        <CaraStudioQuickActionButton key="a" context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Keys Tracked", value: data.length, icon: Key, colour: "text-blue-600" },
            { label: "Currently Signed Out", value: signedOut, icon: Clock, colour: "text-amber-600" },
            { label: "Lost / Missing", value: lostCount, icon: AlertTriangle, colour: "text-red-600" },
            { label: "Audit Overdue", value: auditOverdue, icon: AlertTriangle, colour: "text-orange-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {/* alerts */}
        {(lostCount > 0 || auditOverdue > 0) && (
          <div className={cn("rounded-lg border p-4 flex items-start gap-3", lostCount > 0 ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50")}>
            <AlertTriangle className={cn("h-5 w-5 mt-0.5", lostCount > 0 ? "text-red-600" : "text-amber-600")} />
            <div>
              {lostCount > 0 && <p className="font-semibold text-red-900">{lostCount} key(s) reported lost</p>}
              {auditOverdue > 0 && <p className="font-semibold text-amber-900">{auditOverdue} key audit(s) overdue</p>}
            </div>
          </div>
        )}

        {/* filter */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Key name, number…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-44"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(KEY_TYPE_LABEL) as [KeyType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-40"><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(KEYHOLDING_STATUS_LABEL) as [KeyholdingStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">Name</SelectItem><SelectItem value="type">Type</SelectItem><SelectItem value="audit">Audit Due</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* key cards */}
        <div className="space-y-3">
          {filtered.map(k => {
            const open = expanded === k.id;
            const currentlyOut = k.sign_out_log.filter(e => !e.signed_in);
            const auditDue = k.next_audit_due <= today;
            return (
              <Card key={k.id} className={cn(auditDue && "border-amber-300", k.status === "lost" && "border-red-400")}>
                <button className="w-full text-left" onClick={() => toggle(k.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{k.key_name}</CardTitle>
                        <Badge className={cn("text-xs", KT_CLR[k.key_type])}>{KEY_TYPE_LABEL[k.key_type]}</Badge>
                        <Badge className={cn("text-xs", KS_CLR[k.status])}>{KEYHOLDING_STATUS_LABEL[k.status]}</Badge>
                        {k.restricted_access && <Badge className="text-xs bg-red-900 text-white">Restricted</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{k.key_number} · {k.total_copies} copies</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Location:</span> {k.location}</div>
                      <div><span className="text-muted-foreground">Total Copies:</span> {k.total_copies}</div>
                    </div>

                    {k.permanent_holders.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Permanent Holders</p>
                        <div className="flex gap-2 flex-wrap">{k.permanent_holders.map((h, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{getStaffName(h.staff_id)} — since {h.issued_date}</Badge>
                        ))}</div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold mb-1">Authorised Staff</p>
                      <div className="flex gap-1 flex-wrap">{k.authorised_staff.map(s => <Badge key={s} variant="outline" className="text-xs bg-green-50">{getStaffName(s)}</Badge>)}</div>
                    </div>

                    {currentlyOut.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Currently Signed Out</p>
                        {currentlyOut.map((e, i) => (
                          <p key={i} className="text-sm text-amber-900">{getStaffName(e.staff_id)} — {e.purpose} (out: {e.signed_out})</p>
                        ))}
                      </div>
                    )}

                    {k.sign_out_log.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Recent Sign-Out Log</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Staff</th><th className="text-left p-2 font-medium">Out</th><th className="text-left p-2 font-medium">In</th><th className="text-left p-2 font-medium">Purpose</th></tr></thead>
                          <tbody>{k.sign_out_log.slice(-5).map((e, i) => (
                            <tr key={i} className={cn("border-t", !e.signed_in && "bg-amber-50")}>
                              <td className="p-2">{getStaffName(e.staff_id)}</td>
                              <td className="p-2">{e.signed_out}</td>
                              <td className="p-2">{e.signed_in ?? <span className="text-amber-600 font-medium">Still out</span>}</td>
                              <td className="p-2">{e.purpose}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}

                    {k.lost_key_incidents.length > 0 && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-semibold text-red-800 mb-1">Lost Key Incidents</p>
                        {k.lost_key_incidents.map((inc, i) => (
                          <div key={i} className="text-sm text-red-900 space-y-1">
                            <p><strong>{inc.date}</strong> — Reported by {getStaffName(inc.reported_by)}</p>
                            <p>{inc.circumstances}</p>
                            <p>Locks changed: {inc.locks_changed ? "Yes" : "No"} · Resolved: {inc.resolved ? <CheckCircle2 className="inline h-4 w-4 text-green-600" /> : <AlertTriangle className="inline h-4 w-4 text-red-600" />}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-4 text-sm">
                      <span><strong>Last Audit:</strong> {k.last_audit}</span>
                      <span className={cn(auditDue && "text-red-600 font-medium")}><strong>Next Due:</strong> {k.next_audit_due}{auditDue && " (OVERDUE)"}</span>
                    </div>

                    {k.notes && <p className="text-xs text-muted-foreground italic">{k.notes}</p>}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* audit summary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Key Audit Schedule</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm border">
              <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Key</th><th className="text-left p-2 font-medium">Type</th><th className="text-left p-2 font-medium">Last Audit</th><th className="text-left p-2 font-medium">Next Due</th><th className="text-left p-2 font-medium">Status</th></tr></thead>
              <tbody>{data.map(k => {
                const due = k.next_audit_due <= today;
                return (
                  <tr key={k.id} className={cn("border-t", due && "bg-red-50")}>
                    <td className="p-2 font-medium">{k.key_name}</td>
                    <td className="p-2"><Badge className={cn("text-xs", KT_CLR[k.key_type])}>{KEY_TYPE_LABEL[k.key_type]}</Badge></td>
                    <td className="p-2">{k.last_audit}</td>
                    <td className={cn("p-2", due && "text-red-600 font-medium")}>{k.next_audit_due}</td>
                    <td className="p-2">{due ? <Badge className="bg-red-100 text-red-800 text-xs">Overdue</Badge> : <Badge className="bg-green-100 text-green-800 text-xs">On Track</Badge>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </CardContent>
        </Card>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Security & Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 12 — Protection of children. All keys must be accounted for and audited regularly. Restricted keys (medication, CCTV, safe) require authorised access only. Lost keys must be reported immediately and locks changed where a security risk exists. Key records must be available for Ofsted inspection.</p>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Key Record</DialogTitle></DialogHeader>
          <form onSubmit={handleAddKey} className="space-y-3">
            <div><Label>Key Name *</Label><Input placeholder="e.g. Front Door Master Key" value={krForm.key_name} onChange={(e) => setKR("key_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Key Number</Label><Input placeholder="e.g. MK-001" value={krForm.key_number} onChange={(e) => setKR("key_number", e.target.value)} /></div>
              <div><Label>Total Copies</Label><Input type="number" value={krForm.total_copies} onChange={(e) => setKR("total_copies", e.target.value)} /></div>
            </div>
            <div><Label>Key Type</Label><Select value={krForm.key_type} onValueChange={(v) => setKR("key_type", v)}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{(Object.entries(KEY_TYPE_LABEL) as [KeyType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Storage Location</Label><Input placeholder="Where is this key stored?" value={krForm.location} onChange={(e) => setKR("location", e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea rows={2} placeholder="Additional notes…" value={krForm.notes} onChange={(e) => setKR("notes", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createItem.isPending}>{createItem.isPending ? "Saving…" : "Add Key"}</Button>
            </DialogFooter>
          </form>
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
        pageContext="Keyholding Register — key allocation, master keys, bedroom keys, vehicle keys, key audit, security, handover checks, lost keys, replacement, Reg 31, Ofsted evidence"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
