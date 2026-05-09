"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wifi,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useOnlineSafetyIncidents, useCreateOnlineSafetyIncident } from "@/hooks/use-online-safety-incidents";
import { useOnlineSafetyAgreements } from "@/hooks/use-online-safety-agreements";
import type {
  OnlineSafetyIncident,
  OnlineSafetyAgreement,
  OnlineSafetyIncidentCategory,
  OnlineSafetySeverity,
  OnlineSafetyIncidentStatus,
} from "@/types/extended";
import { ONLINE_SAFETY_INCIDENT_CATEGORY_LABEL, ONLINE_SAFETY_SEVERITY_LABEL, ONLINE_SAFETY_INCIDENT_STATUS_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── display maps ─────────────────────────────────────────────────────── */

const SEV_META: Record<OnlineSafetySeverity, { label: string; colour: string }> = {
  low: { label: "Low", colour: "bg-green-100 text-green-700" },
  medium: { label: "Medium", colour: "bg-amber-100 text-amber-700" },
  high: { label: "High", colour: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", colour: "bg-red-100 text-red-700" },
};

const STATUS_META: Record<OnlineSafetyIncidentStatus, { label: string; colour: string }> = {
  open: { label: "Open", colour: "bg-blue-100 text-blue-700" },
  monitoring: { label: "Monitoring", colour: "bg-amber-100 text-amber-700" },
  resolved: { label: "Resolved", colour: "bg-green-100 text-green-700" },
  escalated: { label: "Escalated", colour: "bg-red-100 text-red-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function OnlineSafetyPage() {
  const { data: incRes, isLoading: incLoading } = useOnlineSafetyIncidents();
  const createIncident = useCreateOnlineSafetyIncident();
  const { data: agRes, isLoading: agLoading } = useOnlineSafetyAgreements();
  const data: OnlineSafetyIncident[] = incRes?.data ?? [];
  const agreements: OnlineSafetyAgreement[] = agRes?.data ?? [];
  const isLoading = incLoading || agLoading;

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);
  const [view, setView] = useState<"incidents" | "agreements">("incidents");

  const [osForm, setOsForm] = useState({
    child_id: "",
    category: "" as OnlineSafetyIncidentCategory | "",
    severity: "" as OnlineSafetySeverity | "",
    platform: "",
    summary: "",
    detail: "",
    actions_taken: "",
    safeguarding_referral: false,
    parent_carer_notified: false,
    discovered_by: "staff_darren",
  });
  const setOSF = (k: keyof typeof osForm, v: string | boolean) => setOsForm((p) => ({ ...p, [k]: v }));

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osForm.child_id || !osForm.category || !osForm.severity || !osForm.summary.trim()) {
      toast.error("Young person, category, severity and summary are required.");
      return;
    }
    await createIncident.mutateAsync({
      child_id: osForm.child_id,
      date: new Date().toISOString().slice(0, 10),
      category: osForm.category as OnlineSafetyIncidentCategory,
      severity: osForm.severity as OnlineSafetySeverity,
      status: "open" as OnlineSafetyIncidentStatus,
      platform: osForm.platform,
      summary: osForm.summary.trim(),
      detail: osForm.detail,
      discovered_by: osForm.discovered_by,
      actions_taken: osForm.actions_taken.split("\n").map((a) => a.trim()).filter(Boolean),
      safeguarding_referral: osForm.safeguarding_referral,
      parent_carer_notified: osForm.parent_carer_notified,
      child_discussion: "",
      follow_up: "",
      created_at: new Date().toISOString(),
    });
    toast.success("Online safety incident logged.");
    setOsForm({ child_id: "", category: "", severity: "", platform: "", summary: "", detail: "", actions_taken: "", safeguarding_referral: false, parent_carer_notified: false, discovered_by: "staff_darren" });
    setShowDialog(false);
  };

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((i) => i.status === "open" || i.status === "monitoring").length,
    safeguarding: data.filter((i) => i.safeguarding_referral).length,
    resolved: data.filter((i) => i.status === "resolved").length,
    highSev: data.filter((i) => i.severity === "high" || i.severity === "critical").length,
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterCat !== "all") list = list.filter((i) => i.category === filterCat);
    if (filterYP !== "all") list = list.filter((i) => i.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.summary.toLowerCase().includes(q) || i.platform.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "severity": return Object.keys(SEV_META).indexOf(b.severity) - Object.keys(SEV_META).indexOf(a.severity);
        case "category": return ONLINE_SAFETY_INCIDENT_CATEGORY_LABEL[a.category].localeCompare(ONLINE_SAFETY_INCIDENT_CATEGORY_LABEL[b.category]);
        default:         return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [data, filterCat, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.map((i) => ({
    youngPerson: getYPName(i.child_id),
    date: i.date,
    category: ONLINE_SAFETY_INCIDENT_CATEGORY_LABEL[i.category],
    severity: SEV_META[i.severity].label,
    status: STATUS_META[i.status].label,
    platform: i.platform,
    summary: i.summary,
    discoveredBy: getStaffName(i.discovered_by),
    safeguardingReferral: i.safeguarding_referral ? "Yes" : "No",
    actions: i.actions_taken.join("; "),
    childDiscussion: i.child_discussion,
    followUp: i.follow_up,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",  accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Date",          accessor: (r: typeof exportData[number]) => r.date },
    { header: "Category",      accessor: (r: typeof exportData[number]) => r.category },
    { header: "Severity",      accessor: (r: typeof exportData[number]) => r.severity },
    { header: "Status",        accessor: (r: typeof exportData[number]) => r.status },
    { header: "Platform",      accessor: (r: typeof exportData[number]) => r.platform },
    { header: "Summary",       accessor: (r: typeof exportData[number]) => r.summary },
    { header: "Discovered By", accessor: (r: typeof exportData[number]) => r.discoveredBy },
    { header: "Safeguarding",  accessor: (r: typeof exportData[number]) => r.safeguardingReferral },
    { header: "Actions Taken", accessor: (r: typeof exportData[number]) => r.actions },
    { header: "Child Discussion", accessor: (r: typeof exportData[number]) => r.childDiscussion },
    { header: "Follow Up",    accessor: (r: typeof exportData[number]) => r.followUp },
  ];

  const ypIds = [...new Set(data.map((i) => i.child_id))];

  if (isLoading) return <PageShell title="Online Safety" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Online Safety"
      subtitle="Digital safeguarding — incidents, agreements and monitoring"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="online-safety" />
          <PrintButton title="Online Safety" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Log Incident
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Incidents", v: stats.total, icon: Shield, c: "text-blue-600" },
            { l: "Active",          v: stats.active, icon: Clock, c: "text-amber-600" },
            { l: "High / Critical", v: stats.highSev, icon: AlertTriangle, c: stats.highSev > 0 ? "text-red-600" : "text-gray-400" },
            { l: "Safeguarding",    v: stats.safeguarding, icon: Shield, c: "text-red-600" },
            { l: "Resolved",        v: stats.resolved, icon: CheckCircle2, c: "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.active > 0 && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800"><strong>{stats.active} incident{stats.active > 1 ? "s" : ""}</strong> currently active or being monitored.</p>
          </div>
        )}

        {/* view toggle */}
        <div className="flex gap-2">
          <button onClick={() => setView("incidents")} className={cn("rounded-md px-4 py-2 text-sm font-medium", view === "incidents" ? "bg-brand text-white" : "border hover:bg-gray-50")}>Incidents</button>
          <button onClick={() => setView("agreements")} className={cn("rounded-md px-4 py-2 text-sm font-medium", view === "agreements" ? "bg-brand text-white" : "border hover:bg-gray-50")}>Online Agreements</button>
        </div>

        {view === "incidents" && (
          <>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
              </div>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(ONLINE_SAFETY_INCIDENT_CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterYP} onValueChange={setFilterYP}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Children</SelectItem>
                  {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 text-sm">
                <ArrowUpDown className="h-4 w-4" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
                  <option value="date">Date</option>
                  <option value="severity">Severity</option>
                  <option value="category">Category</option>
                </select>
              </div>
            </div>

            {filtered.map((incident) => (
              <div key={incident.id} className="rounded-lg border bg-white overflow-hidden">
                <button onClick={() => setExpanded(expanded === incident.id ? null : incident.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-brand" />
                    <div className="text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{getYPName(incident.child_id)}</h3>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[incident.status].colour)}>{STATUS_META[incident.status].label}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SEV_META[incident.severity].colour)}>{SEV_META[incident.severity].label}</span>
                        {incident.safeguarding_referral && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Safeguarding</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{ONLINE_SAFETY_INCIDENT_CATEGORY_LABEL[incident.category]} · {incident.platform} · {incident.date}</p>
                    </div>
                  </div>
                  {expanded === incident.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {expanded === incident.id && (
                  <div className="border-t p-4 space-y-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <h4 className="text-sm font-semibold mb-1">Detail</h4>
                      <p className="text-sm text-muted-foreground">{incident.detail}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-1">Actions Taken</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">{incident.actions_taken.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Discovered By:</span> {getStaffName(incident.discovered_by)}</div>
                      <div><span className="text-muted-foreground">Safeguarding Referral:</span> {incident.safeguarding_referral ? <span className="text-red-600 font-medium">Yes</span> : "No"}</div>
                      <div><span className="text-muted-foreground">Parent/Carer Notified:</span> {incident.parent_carer_notified ? "Yes" : "No"}</div>
                    </div>

                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-sm font-semibold text-pink-800 mb-1">Discussion with Child</h4>
                      <p className="text-sm text-pink-900">{incident.child_discussion}</p>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">Follow Up</h4>
                      <p className="text-sm text-blue-900">{incident.follow_up}</p>
                    </div>

                    <SmartLinkPanel sourceType="online_safety_incident" sourceId={incident.id} childId={incident.child_id} compact />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {view === "agreements" && (
          <div className="space-y-4">
            {agreements.map((ag) => (
              <div key={ag.id} className="rounded-lg border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-brand" />
                    <h3 className="font-semibold">{getYPName(ag.child_id)}</h3>
                    {ag.child_signature && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Signed</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">Review: {ag.review_date}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Devices</h4>
                    <ul className="list-disc list-inside text-sm">{ag.devices.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Allowed Platforms</h4>
                    <div className="flex flex-wrap gap-1">{ag.allowed_platforms.map((p, i) => <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{p}</span>)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Restrictions</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">{ag.restrictions.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Wi-Fi Curfew:</span> {ag.wifi_curfew}</div>
                  <div><span className="text-muted-foreground">Parental Controls:</span> {ag.parental_controls}</div>
                </div>

                <SmartLinkPanel sourceType="online_safety_agreement" sourceId={ag.id} childId={ag.child_id} compact />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Keeping Children Safe in Education / Reg 12</strong> — Children&apos;s homes must protect children from online harms including grooming, cyberbullying, and inappropriate content. Individual online agreements should reflect each child&apos;s age, understanding, and risk profile. Incidents must be recorded and responded to proportionately.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Online Safety Incident</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateIncident} className="grid gap-3 py-2">
            <Select value={osForm.child_id} onValueChange={(v) => setOSF("child_id", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Young Person…" /></SelectTrigger>
              <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.first_name} {y.last_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={osForm.category} onValueChange={(v) => setOSF("category", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Category…" /></SelectTrigger>
              <SelectContent>{Object.entries(ONLINE_SAFETY_INCIDENT_CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={osForm.severity} onValueChange={(v) => setOSF("severity", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Severity…" /></SelectTrigger>
              <SelectContent>{Object.entries(SEV_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Discovered By</label>
              <Select value={osForm.discovered_by} onValueChange={(v) => setOSF("discovered_by", v)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <input required placeholder="Platform (e.g. Instagram, Snapchat)" className="rounded border px-3 py-2 text-sm" value={osForm.platform} onChange={(e) => setOSF("platform", e.target.value)} />
            <textarea required placeholder="Summary *" rows={2} className="rounded border px-3 py-2 text-sm" value={osForm.summary} onChange={(e) => setOSF("summary", e.target.value)} />
            <textarea placeholder="Full detail" rows={3} className="rounded border px-3 py-2 text-sm" value={osForm.detail} onChange={(e) => setOSF("detail", e.target.value)} />
            <textarea placeholder="Actions taken (one per line)" rows={2} className="rounded border px-3 py-2 text-sm" value={osForm.actions_taken} onChange={(e) => setOSF("actions_taken", e.target.value)} />
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" className="rounded border" checked={osForm.safeguarding_referral} onChange={(e) => setOSF("safeguarding_referral", e.target.checked)} /> Safeguarding referral</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" className="rounded border" checked={osForm.parent_carer_notified} onChange={(e) => setOSF("parent_carer_notified", e.target.checked)} /> Parent/carer notified</label>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createIncident.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90 disabled:opacity-50">{createIncident.isPending ? "Logging…" : "Log Incident"}</button>
            </DialogFooter>
          </form>
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
