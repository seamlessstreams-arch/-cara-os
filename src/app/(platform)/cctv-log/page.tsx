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

/* ── types ─────────────────────────────────────────────────────────────── */

type AccessReason = "incident_review" | "safeguarding" | "police_request" | "complaint_investigation" | "maintenance_check" | "routine_review" | "sar_request" | "staff_investigation" | "other";
type Camera = "front_door" | "rear_garden" | "driveway" | "hallway_ground" | "hallway_first" | "kitchen" | "lounge" | "office_corridor";

interface CCTVAccess {
  id: string;
  date: string;
  timeAccessed: string;
  footageDate: string;
  footageTimeRange: string;
  cameras: Camera[];
  reason: AccessReason;
  detail: string;
  accessedBy: string;
  authorisedBy: string;
  witnessPresent: string | null;
  footageCopied: boolean;
  copiedTo: string;
  externalReference: string;
  outcome: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: CCTVAccess[] = [
  {
    id: "cc1", date: d(-2), timeAccessed: "14:30", footageDate: d(-2), footageTimeRange: "13:45-14:15",
    cameras: ["lounge", "hallway_ground"], reason: "incident_review",
    detail: "Reviewed footage following an incident between two young people in the lounge area. Footage confirmed the sequence of events as described in incident report IR-2025-034. Both young people's accounts were broadly consistent with what was observed.",
    accessedBy: "staff_darren", authorisedBy: "staff_darren", witnessPresent: "staff_ryan",
    footageCopied: false, copiedTo: "", externalReference: "IR-2025-034",
    outcome: "Footage confirmed incident report accuracy. No further action regarding CCTV. Incident managed through normal process.",
  },
  {
    id: "cc2", date: d(-10), timeAccessed: "10:00", footageDate: d(-11), footageTimeRange: "01:00-03:00",
    cameras: ["front_door", "hallway_ground", "hallway_first"], reason: "safeguarding",
    detail: "Reviewed overnight footage following concern raised by day staff that a young person may have left the building during the night. Night check records showed all YP in rooms, but kitchen showed signs of activity. Footage reviewed to verify movements.",
    accessedBy: "staff_darren", authorisedBy: "staff_darren", witnessPresent: "staff_ryan",
    footageCopied: true, copiedTo: "Encrypted USB — stored in secure storage. Labelled CC-2025-002.",
    externalReference: "Whistleblowing concern WB-2025-003",
    outcome: "Footage showed a young person leaving their room at 01:47 and going to the kitchen. Returned to room at 02:15. No staff member was observed checking during this period despite the night check log showing a check at 02:00. Footage supports the whistleblowing concern and has been preserved as evidence.",
  },
  {
    id: "cc3", date: d(-15), timeAccessed: "09:00", footageDate: d(-16), footageTimeRange: "15:00-16:30",
    cameras: ["front_door", "driveway"], reason: "police_request",
    detail: "GMP requested footage of the front of the property following a reported car theft on the adjacent road. No connection to the home — police conducting area-wide enquiries. Data sharing agreement checked before footage released.",
    accessedBy: "staff_darren", authorisedBy: "staff_darren", witnessPresent: null,
    footageCopied: true, copiedTo: "Encrypted USB handed to DC Morris, GMP. Signed receipt obtained. Ref: MC-2025-EV-445.",
    externalReference: "Police crime ref: MC-2025-5521",
    outcome: "Footage provided to police under lawful basis. Receipt on file. No images of young people were included in the provided footage — only driveway and street view.",
  },
  {
    id: "cc4", date: d(-30), timeAccessed: "16:00", footageDate: d(-30), footageTimeRange: "N/A — system check",
    cameras: ["front_door", "rear_garden", "driveway", "hallway_ground", "hallway_first", "kitchen", "lounge", "office_corridor"],
    reason: "maintenance_check",
    detail: "Monthly CCTV system check. Verified all 8 cameras operational, recording quality acceptable, storage capacity sufficient (22% used). Night vision functioning on all exterior cameras. Timestamp accuracy verified against NTP server.",
    accessedBy: "staff_darren", authorisedBy: "staff_darren", witnessPresent: null,
    footageCopied: false, copiedTo: "", externalReference: "Maintenance log ML-2025-04",
    outcome: "All systems operational. No issues identified. Next monthly check due " + d(0) + ".",
  },
  {
    id: "cc5", date: d(-45), timeAccessed: "11:00", footageDate: d(-46), footageTimeRange: "22:00-23:30",
    cameras: ["front_door", "driveway"], reason: "safeguarding",
    detail: "Reviewed footage following report from a young person that an unknown vehicle was parked outside the home in the evening. Young person was anxious about this. Footage reviewed to identify the vehicle and assess any risk.",
    accessedBy: "staff_ryan", authorisedBy: "staff_darren", witnessPresent: null,
    footageCopied: false, copiedTo: "", externalReference: "",
    outcome: "Vehicle identified as a delivery driver checking their phone (Deliveroo logo visible). Vehicle was present for approximately 12 minutes then departed. No risk identified. Young person reassured. No further action needed.",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const REASON_LABELS: Record<AccessReason, string> = {
  incident_review: "Incident Review", safeguarding: "Safeguarding",
  police_request: "Police Request", complaint_investigation: "Complaint Investigation",
  maintenance_check: "Maintenance Check", routine_review: "Routine Review",
  sar_request: "SAR / Data Request", staff_investigation: "Staff Investigation", other: "Other",
};

const CAMERA_LABELS: Record<Camera, string> = {
  front_door: "Front Door", rear_garden: "Rear Garden", driveway: "Driveway",
  hallway_ground: "Ground Floor Hallway", hallway_first: "First Floor Hallway",
  kitchen: "Kitchen", lounge: "Lounge", office_corridor: "Office Corridor",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function CCTVLogPage() {
  const [data] = useState<CCTVAccess[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => ({
    total: data.length,
    copied: data.filter((a) => a.footageCopied).length,
    policeRequests: data.filter((a) => a.reason === "police_request").length,
    safeguarding: data.filter((a) => a.reason === "safeguarding").length,
    thisMonth: data.filter((a) => a.date >= d(-30)).length,
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterReason !== "all") list = list.filter((a) => a.reason === filterReason);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.detail.toLowerCase().includes(q) || a.externalReference.toLowerCase().includes(q));
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
    timeAccessed: a.timeAccessed,
    footageDate: a.footageDate,
    footageTimeRange: a.footageTimeRange,
    cameras: a.cameras.map((c) => CAMERA_LABELS[c]).join(", "),
    reason: REASON_LABELS[a.reason],
    detail: a.detail,
    accessedBy: getStaffName(a.accessedBy),
    authorisedBy: getStaffName(a.authorisedBy),
    witness: a.witnessPresent ? getStaffName(a.witnessPresent) : "None",
    footageCopied: a.footageCopied ? "Yes" : "No",
    copiedTo: a.copiedTo || "N/A",
    externalRef: a.externalReference || "None",
    outcome: a.outcome,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Date",            accessor: (r: typeof exportData[number]) => r.date },
    { header: "Time Accessed",   accessor: (r: typeof exportData[number]) => r.timeAccessed },
    { header: "Footage Date",    accessor: (r: typeof exportData[number]) => r.footageDate },
    { header: "Time Range",      accessor: (r: typeof exportData[number]) => r.footageTimeRange },
    { header: "Cameras",         accessor: (r: typeof exportData[number]) => r.cameras },
    { header: "Reason",          accessor: (r: typeof exportData[number]) => r.reason },
    { header: "Detail",          accessor: (r: typeof exportData[number]) => r.detail },
    { header: "Accessed By",     accessor: (r: typeof exportData[number]) => r.accessedBy },
    { header: "Authorised By",   accessor: (r: typeof exportData[number]) => r.authorisedBy },
    { header: "Witness",         accessor: (r: typeof exportData[number]) => r.witness },
    { header: "Footage Copied",  accessor: (r: typeof exportData[number]) => r.footageCopied },
    { header: "Copied To",       accessor: (r: typeof exportData[number]) => r.copiedTo },
    { header: "External Ref",    accessor: (r: typeof exportData[number]) => r.externalRef },
    { header: "Outcome",         accessor: (r: typeof exportData[number]) => r.outcome },
  ];

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
                    {access.footageCopied && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Footage Copied</span>}
                    {access.externalReference && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{access.externalReference}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{access.date} at {access.timeAccessed} · Footage: {access.footageDate} ({access.footageTimeRange}) · {getStaffName(access.accessedBy)}</p>
                </div>
              </div>
              {expanded === access.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === access.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Accessed By:</span> {getStaffName(access.accessedBy)}</div>
                  <div><span className="text-muted-foreground">Authorised By:</span> {getStaffName(access.authorisedBy)}</div>
                  <div><span className="text-muted-foreground">Witness:</span> {access.witnessPresent ? getStaffName(access.witnessPresent) : "None"}</div>
                  <div><span className="text-muted-foreground">Footage Date:</span> {access.footageDate} ({access.footageTimeRange})</div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Cameras Viewed</h4>
                  <div className="flex flex-wrap gap-1">{access.cameras.map((c) => <span key={c} className="rounded bg-gray-100 px-2 py-0.5 text-xs">{CAMERA_LABELS[c]}</span>)}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Detail</h4>
                  <p className="text-sm text-muted-foreground">{access.detail}</p>
                </div>

                {access.footageCopied && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Footage Copied</h4>
                    <p className="text-sm text-amber-900">{access.copiedTo}</p>
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
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm"><option value="">Access reason…</option>{Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="rounded border px-3 py-2 text-sm" placeholder="Footage date" />
              <input placeholder="Time range (e.g. 14:00-15:30)" className="rounded border px-3 py-2 text-sm" />
            </div>
            <textarea placeholder="Detail / reason for access" rows={3} className="rounded border px-3 py-2 text-sm" />
            <input placeholder="External reference (if applicable)" className="rounded border px-3 py-2 text-sm" />
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" className="rounded border" /> Footage copied</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" className="rounded border" /> Witness present</label>
            </div>
            <textarea placeholder="Outcome" rows={2} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Log Access</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
