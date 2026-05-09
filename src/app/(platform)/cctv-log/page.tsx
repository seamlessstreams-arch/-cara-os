"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Video,
  Plus,
  ArrowUpDown,
  Search,
  Clock,
  Eye,
  Shield,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCCTVAccesses, useCreateCCTVAccess } from "@/hooks/use-cctv-accesses";
import { toast } from "sonner";
import type { CCTVAccess, CCTVAccessReason, CCTVCamera } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const REASON_LABELS: Record<CCTVAccessReason, string> = {
  incident_review: "Incident Review", safeguarding: "Safeguarding",
  police_request: "Police Request", complaint_investigation: "Complaint Investigation",
  maintenance_check: "Maintenance Check", routine_review: "Routine Review",
  sar_request: "SAR / Data Request", staff_investigation: "Staff Investigation", other: "Other",
};

const CAMERA_LABELS: Record<CCTVCamera, string> = {
  front_door: "Front Door", rear_garden: "Rear Garden", driveway: "Driveway",
  hallway_ground: "Ground Floor Hallway", hallway_first: "First Floor Hallway",
  kitchen: "Kitchen", lounge: "Lounge", office_corridor: "Office Corridor",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function CCTVLogPage() {
  const { data: ccData, isLoading } = useCCTVAccesses();
  const data = ccData?.data ?? [];
  const createAccess = useCreateCCTVAccess();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = (() => { const dt = new Date(); dt.setDate(dt.getDate() - 30); return dt.toISOString().slice(0, 10); })();

  const stats = useMemo(() => ({
    total: data.length,
    copied: data.filter((a) => a.footage_copied).length,
    policeRequests: data.filter((a) => a.reason === "police_request").length,
    safeguarding: data.filter((a) => a.reason === "safeguarding").length,
    thisMonth: data.filter((a) => a.date >= thirtyDaysAgo).length,
  }), [data, thirtyDaysAgo]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterReason !== "all") list = list.filter((a) => a.reason === filterReason);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.detail.toLowerCase().includes(q) || a.external_reference.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "reason": return REASON_LABELS[a.reason].localeCompare(REASON_LABELS[b.reason]);
        default:       return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [data, filterReason, search, sortBy]);

  const exportData = useMemo(() => data.map((a) => ({
    date: a.date,
    time_accessed: a.time_accessed,
    footage_date: a.footage_date,
    footage_time_range: a.footage_time_range,
    cameras: a.cameras.map((c) => CAMERA_LABELS[c]).join(", "),
    reason: REASON_LABELS[a.reason],
    detail: a.detail,
    accessed_by: getStaffName(a.accessed_by),
    authorised_by: getStaffName(a.authorised_by),
    witness: a.witness_present ? getStaffName(a.witness_present) : "None",
    footage_copied: a.footage_copied ? "Yes" : "No",
    copied_to: a.copied_to || "N/A",
    external_ref: a.external_reference || "None",
    outcome: a.outcome,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Date",            accessor: (r: typeof exportData[number]) => r.date },
    { header: "Time Accessed",   accessor: (r: typeof exportData[number]) => r.time_accessed },
    { header: "Footage Date",    accessor: (r: typeof exportData[number]) => r.footage_date },
    { header: "Time Range",      accessor: (r: typeof exportData[number]) => r.footage_time_range },
    { header: "Cameras",         accessor: (r: typeof exportData[number]) => r.cameras },
    { header: "Reason",          accessor: (r: typeof exportData[number]) => r.reason },
    { header: "Detail",          accessor: (r: typeof exportData[number]) => r.detail },
    { header: "Accessed By",     accessor: (r: typeof exportData[number]) => r.accessed_by },
    { header: "Authorised By",   accessor: (r: typeof exportData[number]) => r.authorised_by },
    { header: "Witness",         accessor: (r: typeof exportData[number]) => r.witness },
    { header: "Footage Copied",  accessor: (r: typeof exportData[number]) => r.footage_copied },
    { header: "Copied To",       accessor: (r: typeof exportData[number]) => r.copied_to },
    { header: "External Ref",    accessor: (r: typeof exportData[number]) => r.external_ref },
    { header: "Outcome",         accessor: (r: typeof exportData[number]) => r.outcome },
  ];

  if (isLoading) {
    return (
      <PageShell title="CCTV Usage Log" subtitle="Footage access register — data protection compliance and audit trail">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="CCTV Usage Log"
      subtitle="Footage access register — data protection compliance and audit trail"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="cctv-log" />
          <PrintButton title="CCTV Usage Log" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Log Access
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Accesses", v: stats.total, icon: Video, c: "text-blue-600" },
            { l: "Footage Copied", v: stats.copied, icon: Eye, c: "text-amber-600" },
            { l: "Police Requests",v: stats.policeRequests, icon: Shield, c: "text-purple-600" },
            { l: "Safeguarding",   v: stats.safeguarding, icon: Shield, c: "text-red-600" },
            { l: "This Month",     v: stats.thisMonth, icon: Clock, c: "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search log…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {Object.entries(REASON_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Date</option>
              <option value="reason">Reason</option>
            </select>
          </div>
        </div>

        {filtered.map((access) => (
          <div key={access.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === access.id ? null : access.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{REASON_LABELS[access.reason]}</h3>
                    {access.footage_copied && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Footage Copied</span>}
                    {access.external_reference && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{access.external_reference}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{access.date} at {access.time_accessed} · Footage: {access.footage_date} ({access.footage_time_range}) · {getStaffName(access.accessed_by)}</p>
                </div>
              </div>
              {expanded === access.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === access.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Accessed By:</span> {getStaffName(access.accessed_by)}</div>
                  <div><span className="text-muted-foreground">Authorised By:</span> {getStaffName(access.authorised_by)}</div>
                  <div><span className="text-muted-foreground">Witness:</span> {access.witness_present ? getStaffName(access.witness_present) : "None"}</div>
                  <div><span className="text-muted-foreground">Footage Date:</span> {access.footage_date} ({access.footage_time_range})</div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Cameras Viewed</h4>
                  <div className="flex flex-wrap gap-1">{access.cameras.map((c) => <span key={c} className="rounded bg-gray-100 px-2 py-0.5 text-xs">{CAMERA_LABELS[c]}</span>)}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Detail</h4>
                  <p className="text-sm text-muted-foreground">{access.detail}</p>
                </div>

                {access.footage_copied && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Footage Copied</h4>
                    <p className="text-sm text-amber-900">{access.copied_to}</p>
                  </div>
                )}

                <div className="rounded-lg bg-blue-50 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Outcome</h4>
                  <p className="text-sm text-blue-900">{access.outcome}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>GDPR / ICO CCTV Code of Practice / Reg 24</strong> — CCTV usage must comply with data protection legislation. Access to footage must be logged, justified, and proportionate. Footage shared with third parties requires lawful basis. Young people and staff must be informed that CCTV is in operation. Regular system checks ensure compliance.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log CCTV Access</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            createAccess.mutate({
              date: today,
              time_accessed: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              reason: fd.get("reason") as CCTVAccessReason,
              footage_date: fd.get("footage_date") as string,
              footage_time_range: fd.get("footage_time_range") as string,
              cameras: [] as CCTVCamera[],
              detail: fd.get("detail") as string,
              external_reference: fd.get("external_reference") as string || "",
              footage_copied: fd.get("footage_copied") === "on",
              copied_to: "",
              witness_present: fd.get("witness_present") === "on" ? "staff_ryan" : null,
              accessed_by: "staff_darren",
              authorised_by: "staff_darren",
              outcome: fd.get("outcome") as string || "",
            } as Partial<CCTVAccess>, {
              onSuccess: () => { toast.success("CCTV access logged"); setShowDialog(false); },
              onError: () => toast.error("Failed to save"),
            });
          }} className="grid gap-3 py-2">
            <select name="reason" required className="rounded border px-3 py-2 text-sm">
              <option value="">Access reason…</option>
              {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" name="footage_date" className="rounded border px-3 py-2 text-sm" defaultValue={today} />
              <input name="footage_time_range" placeholder="Time range (e.g. 14:00-15:30)" className="rounded border px-3 py-2 text-sm" />
            </div>
            <textarea name="detail" placeholder="Detail / reason for access" rows={3} className="rounded border px-3 py-2 text-sm" required />
            <input name="external_reference" placeholder="External reference (if applicable)" className="rounded border px-3 py-2 text-sm" />
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="footage_copied" className="rounded border" /> Footage copied</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="witness_present" className="rounded border" /> Witness present</label>
            </div>
            <textarea name="outcome" placeholder="Outcome" rows={2} className="rounded border px-3 py-2 text-sm" />
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createAccess.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">
                {createAccess.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1 inline" />Saving…</> : "Log Access"}
              </button>
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
