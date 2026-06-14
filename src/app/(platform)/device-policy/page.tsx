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
  AlertTriangle, CheckCircle2, Clock, Smartphone, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, YOUNG_PEOPLE } from "@/lib/seed-data";
import {
  useDevicePolicyRecords,
  useCreateDevicePolicyRecord,
} from "@/hooks/use-device-policy-records";
import { toast } from "sonner";
import type {
  DevicePolicyRecord,
  DevicePolicyDeviceType,
  DevicePolicyAgreementStatus,
} from "@/types/extended";
import {
  DEVICE_POLICY_DEVICE_TYPE_LABEL,
  DEVICE_POLICY_AGREEMENT_STATUS_LABEL,
} from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const DT_CLR: Record<DevicePolicyDeviceType, string> = { smartphone: "bg-blue-100 text-blue-800", tablet: "bg-indigo-100 text-indigo-800", laptop: "bg-purple-100 text-purple-800", games_console: "bg-green-100 text-green-800", smart_watch: "bg-teal-100 text-teal-800", other: "bg-gray-100 text-gray-800" };
const AS_CLR: Record<DevicePolicyAgreementStatus, string> = { active: "bg-green-100 text-green-800", suspended: "bg-red-100 text-red-800", under_review: "bg-amber-100 text-amber-800", expired: "bg-gray-100 text-gray-800", not_signed: "bg-slate-100 text-[var(--cs-navy)]" };

/* ── component ─────────────────────────────────────────────────────────────── */

export default function DevicePolicyPage() {
  const { data: raw, isLoading } = useDevicePolicyRecords();
  const records = raw?.data ?? [];

  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("child");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const createDevice = useCreateDevicePolicyRecord();
  const [dvForm, setDvForm] = useState({ child_id: "", device_name: "", device_type: "smartphone" as DevicePolicyDeviceType, owned_by: "child" as "child" | "home" | "family", serial_number: "", nighttime_storage: "", notes: "" });
  const setDV = (k: string, v: unknown) => setDvForm((p) => ({ ...p, [k]: v }));

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dvForm.child_id) { toast.error("Please select a young person."); return; }
    if (!dvForm.device_name.trim()) { toast.error("Device name is required."); return; }
    await createDevice.mutateAsync({ child_id: dvForm.child_id, device_type: dvForm.device_type, device_name: dvForm.device_name.trim(), owned_by: dvForm.owned_by, serial_number: dvForm.serial_number.trim(), parental_controls_enabled: false, parental_control_software: "", wifi_access: true, sim_card: false, agreement_signed: false, agreement_date: null, agreement_status: "not_signed", screen_time_rules: [], usage_log: [], incidents: [], restrictions: [], social_media_permission: false, social_media_platforms: [], social_worker_approval: false, nighttime_storage: dvForm.nighttime_storage.trim(), review_date: "", notes: dvForm.notes.trim(), created_at: new Date().toISOString() });
    toast.success("Device record added.");
    setDvForm({ child_id: "", device_name: "", device_type: "smartphone", owned_by: "child", serial_number: "", nighttime_storage: "", notes: "" });
    setDialogOpen(false);
  };

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.child_id).toLowerCase().includes(s) || r.device_name.toLowerCase().includes(s)); }
    if (childFilter !== "all") out = out.filter(r => r.child_id === childFilter);
    if (statusFilter !== "all") out = out.filter(r => r.agreement_status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "device": return a.device_name.localeCompare(b.device_name);
        case "review": return a.review_date.localeCompare(b.review_date);
        default: return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      }
    });
    return out;
  }, [records, search, childFilter, statusFilter, sortBy]);

  const childIds = [...new Set(records.map(r => r.child_id))];
  const totalDevices = records.length;
  const activeAgreements = records.filter(r => r.agreement_status === "active").length;
  const underReview = records.filter(r => r.agreement_status === "under_review").length;
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
  const recentIncidents = records.reduce((s, r) => s + r.incidents.filter(i => i.date >= thirtyDaysAgoStr).length, 0);

  const exportCols: ExportColumn<DevicePolicyRecord>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: DevicePolicyRecord) => getYPName(r.child_id) },
    { header: "Device", accessor: (r: DevicePolicyRecord) => r.device_name },
    { header: "Type", accessor: (r: DevicePolicyRecord) => DEVICE_POLICY_DEVICE_TYPE_LABEL[r.device_type] },
    { header: "Owned By", accessor: (r: DevicePolicyRecord) => r.owned_by },
    { header: "Agreement", accessor: (r: DevicePolicyRecord) => DEVICE_POLICY_AGREEMENT_STATUS_LABEL[r.agreement_status] },
    { header: "Parental Controls", accessor: (r: DevicePolicyRecord) => r.parental_controls_enabled ? r.parental_control_software : "None" },
    { header: "Screen Time (Weekday)", accessor: (r: DevicePolicyRecord) => { const h = r.screen_time_rules.find(s => s.day === "weekday")?.max_hours; return h != null ? h + "h" : "—"; } },
    { header: "Screen Time (Weekend)", accessor: (r: DevicePolicyRecord) => { const h = r.screen_time_rules.find(s => s.day === "weekend")?.max_hours; return h != null ? h + "h" : "—"; } },
    { header: "Social Media", accessor: (r: DevicePolicyRecord) => r.social_media_permission ? r.social_media_platforms.join(", ") : "No" },
    { header: "Nighttime Storage", accessor: (r: DevicePolicyRecord) => r.nighttime_storage },
    { header: "Incidents", accessor: (r: DevicePolicyRecord) => String(r.incidents.length) },
    { header: "Review Date", accessor: (r: DevicePolicyRecord) => r.review_date },
  ], []);

  return (
    <PageShell
      title="Device & Phone Policy"
      subtitle="Screen time agreements, device usage monitoring, and online safety — Reg 12"
      caraContext={{ pageTitle: "Device & Phone Policy", sourceType: "document" }}
      actions={[
        <PrintButton key="p" title="Device & Phone Policy" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="device-policy" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Device</Button>,
        <CaraStudioQuickActionButton key="a" context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />,
      ]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Devices", value: totalDevices, icon: Smartphone, colour: "text-blue-600" },
            { label: "Active Agreements", value: activeAgreements, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Under Review", value: underReview, icon: Clock, colour: "text-amber-600" },
            { label: "Incidents (30d)", value: recentIncidents, icon: AlertTriangle, colour: "text-red-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {/* per-child summary */}
        <div className="grid md:grid-cols-3 gap-4">
          {childIds.map(cid => {
            const devices = records.filter(r => r.child_id === cid);
            const incidents = devices.reduce((s, r) => s + r.incidents.length, 0);
            const nonCompliant = devices.reduce((s, r) => s + r.usage_log.filter(u => !u.compliant).length, 0);
            return (
              <Card key={cid}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{getYPName(cid)}</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Devices</span><span className="font-medium">{devices.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Incidents</span><Badge className={cn("text-xs", incidents > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>{incidents}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Non-Compliant Days</span><Badge className={cn("text-xs", nonCompliant > 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>{nonCompliant}</Badge></div>
                  <div className="flex gap-1 flex-wrap">{devices.map(dev => <Badge key={dev.id} className={cn("text-xs", DT_CLR[dev.device_type])}>{DEVICE_POLICY_DEVICE_TYPE_LABEL[dev.device_type]}</Badge>)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* filter */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Name, device…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-40"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Child</Label><Select value={childFilter} onValueChange={setChildFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-40"><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(DEVICE_POLICY_AGREEMENT_STATUS_LABEL) as [DevicePolicyAgreementStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="child">Child</SelectItem><SelectItem value="device">Device</SelectItem><SelectItem value="review">Review Due</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* device cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const reviewDue = r.review_date <= today;
            return (
              <Card key={r.id} className={cn(reviewDue && "border-amber-300")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{getYPName(r.child_id)}</CardTitle>
                        <span className="text-sm text-muted-foreground">— {r.device_name}</span>
                        <Badge className={cn("text-xs", DT_CLR[r.device_type])}>{DEVICE_POLICY_DEVICE_TYPE_LABEL[r.device_type]}</Badge>
                        <Badge className={cn("text-xs", AS_CLR[r.agreement_status])}>{DEVICE_POLICY_AGREEMENT_STATUS_LABEL[r.agreement_status]}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.parental_controls_enabled && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Owned by:</span> {r.owned_by}</div>
                      <div><span className="text-muted-foreground">Serial:</span> {r.serial_number}</div>
                      <div><span className="text-muted-foreground">WiFi:</span> {r.wifi_access ? "Yes" : "No"}</div>
                      <div><span className="text-muted-foreground">SIM:</span> {r.sim_card ? "Yes" : "No"}</div>
                    </div>

                    {/* parental controls */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Parental Controls</p>
                      <p className="text-sm text-blue-900">{r.parental_controls_enabled ? r.parental_control_software : "Not enabled — action required"}</p>
                    </div>

                    {/* screen time rules */}
                    <div>
                      <p className="text-xs font-semibold mb-2">Screen Time Rules</p>
                      <div className="grid grid-cols-2 gap-2">
                        {r.screen_time_rules.map((st, i) => (
                          <div key={i} className="rounded border p-2 text-sm">
                            <p className="font-medium capitalize">{st.day}</p>
                            <p className="text-muted-foreground">{st.max_hours}h max · {st.start_time}–{st.end_time}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* recent usage */}
                    {r.usage_log.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Recent Usage</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Date</th><th className="text-left p-2 font-medium">Hours</th><th className="text-left p-2 font-medium">Compliant</th><th className="text-left p-2 font-medium">Notes</th></tr></thead>
                          <tbody>{r.usage_log.map((u, i) => (
                            <tr key={i} className={cn("border-t", !u.compliant && "bg-red-50")}>
                              <td className="p-2">{u.date}</td><td className="p-2">{u.actual_hours}h</td>
                              <td className="p-2">{u.compliant ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}</td>
                              <td className="p-2 text-xs">{u.notes}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}

                    {/* restrictions */}
                    {r.restrictions.length > 0 && (
                      <div><p className="text-xs font-semibold mb-1">Restrictions</p><div className="flex gap-1 flex-wrap">{r.restrictions.map(rs => <Badge key={rs} className="text-xs bg-red-50 text-red-800 border border-red-200">{rs}</Badge>)}</div></div>
                    )}

                    {/* social media */}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">Social Media:</span>
                      {r.social_media_permission ? (
                        <div className="flex gap-1">{r.social_media_platforms.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}</div>
                      ) : (
                        <Badge className="text-xs bg-gray-100 text-gray-800">Not permitted</Badge>
                      )}
                    </div>

                    {/* incidents */}
                    {r.incidents.length > 0 && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-semibold text-red-800 mb-2">Incidents</p>
                        {r.incidents.map((inc, i) => (
                          <div key={i} className="text-sm text-red-900 mb-2 last:mb-0">
                            <p className="font-medium">{inc.date}</p>
                            <p>{inc.description}</p>
                            <p className="text-xs mt-1"><strong>Action:</strong> {inc.action_taken}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Nighttime: {r.nighttime_storage}</span>
                      <span>SW Approval: {r.social_worker_approval ? <CheckCircle2 className="inline h-3 w-3 text-green-500" /> : "Pending"}</span>
                      <span className={cn(reviewDue && "text-red-600 font-medium")}>Review: {r.review_date}{reviewDue && " (DUE)"}</span>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="device_policy" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Online Safety & Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 12 — Protection of children. Device usage agreements must be in place for all personal and home-owned devices. Parental controls and monitoring software are required. Social media access requires social worker approval. Nighttime device storage in secure location is mandatory. All incidents must be recorded and reviewed.</p>
        </div>
      </div>
      )}

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Device Record</DialogTitle></DialogHeader>
          <form onSubmit={handleAddDevice} className="space-y-3">
            <div><Label>Young Person *</Label><Select value={dvForm.child_id} onValueChange={(v) => setDV("child_id", v)}><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Device Name *</Label><Input placeholder="e.g. iPhone SE" value={dvForm.device_name} onChange={(e) => setDV("device_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Device Type</Label><Select value={dvForm.device_type} onValueChange={(v) => setDV("device_type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(DEVICE_POLICY_DEVICE_TYPE_LABEL) as [DevicePolicyDeviceType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Owned By</Label><Select value={dvForm.owned_by} onValueChange={(v) => setDV("owned_by", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="child">Child</SelectItem><SelectItem value="home">Home</SelectItem><SelectItem value="family">Family</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Serial Number</Label><Input placeholder="Device serial/IMEI" value={dvForm.serial_number} onChange={(e) => setDV("serial_number", e.target.value)} /></div>
            <div><Label>Nighttime Storage</Label><Input placeholder="Where is device stored at night?" value={dvForm.nighttime_storage} onChange={(e) => setDV("nighttime_storage", e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea rows={2} placeholder="Additional notes…" value={dvForm.notes} onChange={(e) => setDV("notes", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createDevice.isPending}>{createDevice.isPending ? "Saving…" : "Add Device"}</Button>
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
        pageContext="Device & Phone Policy — mobile phones, tablets, internet access, social media rules, safe use agreements, device allocation, confiscation, online safety, policy evidence, Reg 44"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
