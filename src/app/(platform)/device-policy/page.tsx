"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
  AlertTriangle, CheckCircle2, Clock, Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type DeviceType = "smartphone" | "tablet" | "laptop" | "games_console" | "smart_watch" | "other";
type AgreementStatus = "active" | "suspended" | "under_review" | "expired" | "not_signed";

interface ScreenTimeRule { day: "weekday" | "weekend"; maxHours: number; startTime: string; endTime: string }
interface UsageLog { date: string; actualHours: number; compliant: boolean; notes: string }
interface Incident { date: string; description: string; actionTaken: string; restrictionApplied: boolean }

interface DeviceRecord {
  id: string;
  youngPersonId: string;
  deviceType: DeviceType;
  deviceName: string;
  ownedBy: "child" | "home" | "family";
  serialNumber: string;
  parentalControlsEnabled: boolean;
  parentalControlSoftware: string;
  wifiAccess: boolean;
  simCard: boolean;
  agreementSigned: boolean;
  agreementDate: string | null;
  agreementStatus: AgreementStatus;
  screenTimeRules: ScreenTimeRule[];
  usageLog: UsageLog[];
  incidents: Incident[];
  restrictions: string[];
  socialMediaPermission: boolean;
  socialMediaPlatforms: string[];
  socialWorkerApproval: boolean;
  nighttimeStorage: string;
  reviewDate: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const DT_LABEL: Record<DeviceType, string> = { smartphone: "Smartphone", tablet: "Tablet", laptop: "Laptop", games_console: "Games Console", smart_watch: "Smart Watch", other: "Other" };
const DT_CLR: Record<DeviceType, string> = { smartphone: "bg-blue-100 text-blue-800", tablet: "bg-indigo-100 text-indigo-800", laptop: "bg-purple-100 text-purple-800", games_console: "bg-green-100 text-green-800", smart_watch: "bg-teal-100 text-teal-800", other: "bg-gray-100 text-gray-800" };
const AS_LABEL: Record<AgreementStatus, string> = { active: "Active", suspended: "Suspended", under_review: "Under Review", expired: "Expired", not_signed: "Not Signed" };
const AS_CLR: Record<AgreementStatus, string> = { active: "bg-green-100 text-green-800", suspended: "bg-red-100 text-red-800", under_review: "bg-amber-100 text-amber-800", expired: "bg-gray-100 text-gray-800", not_signed: "bg-slate-100 text-slate-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: DeviceRecord[] = [
  {
    id: "dp1", youngPersonId: "yp_alex", deviceType: "smartphone", deviceName: "iPhone SE",
    ownedBy: "child", serialNumber: "APLSE-44821", parentalControlsEnabled: true,
    parentalControlSoftware: "Apple Screen Time + Bark monitoring", wifiAccess: true, simCard: true,
    agreementSigned: true, agreementDate: d(-60), agreementStatus: "active",
    screenTimeRules: [
      { day: "weekday", maxHours: 2, startTime: "16:00", endTime: "21:00" },
      { day: "weekend", maxHours: 3, startTime: "10:00", endTime: "21:00" },
    ],
    usageLog: [
      { date: d(-1), actualHours: 1.5, compliant: true, notes: "Good compliance. Used for YouTube and messaging friends." },
      { date: d(-2), actualHours: 2.5, compliant: false, notes: "Exceeded weekday limit by 30 mins. Reminder given." },
      { date: d(-3), actualHours: 1, compliant: true, notes: "" },
    ],
    incidents: [
      { date: d(-20), description: "Attempted to disable Screen Time restrictions by guessing passcode.", actionTaken: "Passcode changed. Discussion about trust and online safety. Written warning added to agreement.", restrictionApplied: false },
    ],
    restrictions: ["No TikTok (age-inappropriate content flagged)", "No messaging after 21:00"],
    socialMediaPermission: true, socialMediaPlatforms: ["Instagram (private)", "YouTube"],
    socialWorkerApproval: true, nighttimeStorage: "Phone handed in at 21:00 — stored in office locked drawer",
    reviewDate: d(14), notes: "Overall good compliance. One incident of trying to bypass controls. Social worker approved Instagram.",
  },
  {
    id: "dp2", youngPersonId: "yp_alex", deviceType: "games_console", deviceName: "PlayStation 5",
    ownedBy: "child", serialNumber: "PS5-88192", parentalControlsEnabled: true,
    parentalControlSoftware: "PlayStation Family Management", wifiAccess: true, simCard: false,
    agreementSigned: true, agreementDate: d(-60), agreementStatus: "active",
    screenTimeRules: [
      { day: "weekday", maxHours: 1, startTime: "17:00", endTime: "20:00" },
      { day: "weekend", maxHours: 2, startTime: "10:00", endTime: "20:00" },
    ],
    usageLog: [
      { date: d(-1), actualHours: 1, compliant: true, notes: "Played FIFA with Jordan." },
    ],
    incidents: [],
    restrictions: ["No 18-rated games", "No online chat with strangers", "No in-game purchases without permission"],
    socialMediaPermission: false, socialMediaPlatforms: [],
    socialWorkerApproval: true, nighttimeStorage: "In Alex's room — console in bedroom is permitted",
    reviewDate: d(14), notes: "Good compliance with gaming limits. Positive social activity — plays with Jordan.",
  },
  {
    id: "dp3", youngPersonId: "yp_jordan", deviceType: "tablet", deviceName: "iPad Air",
    ownedBy: "home", serialNumber: "IPAD-OH-003", parentalControlsEnabled: true,
    parentalControlSoftware: "Apple Screen Time (managed by home)", wifiAccess: true, simCard: false,
    agreementSigned: true, agreementDate: d(-45), agreementStatus: "active",
    screenTimeRules: [
      { day: "weekday", maxHours: 1.5, startTime: "16:00", endTime: "20:00" },
      { day: "weekend", maxHours: 2.5, startTime: "09:00", endTime: "20:00" },
    ],
    usageLog: [
      { date: d(-1), actualHours: 1, compliant: true, notes: "Used for art app and Minecraft. Very engaged." },
      { date: d(-2), actualHours: 1.5, compliant: true, notes: "Watched nature documentaries." },
    ],
    incidents: [],
    restrictions: ["No social media (age + safeguarding)", "No YouTube unsupervised", "Art apps and Minecraft encouraged"],
    socialMediaPermission: false, socialMediaPlatforms: [],
    socialWorkerApproval: true, nighttimeStorage: "iPad returned to office at 20:00 — home-owned device",
    reviewDate: d(21), notes: "Jordan uses the iPad constructively — art, building games, education. No concerns.",
  },
  {
    id: "dp4", youngPersonId: "yp_casey", deviceType: "smartphone", deviceName: "Samsung Galaxy A15",
    ownedBy: "family", serialNumber: "SAM-A15-7721", parentalControlsEnabled: true,
    parentalControlSoftware: "Google Family Link + Bark monitoring", wifiAccess: true, simCard: true,
    agreementSigned: true, agreementDate: d(-30), agreementStatus: "under_review",
    screenTimeRules: [
      { day: "weekday", maxHours: 1.5, startTime: "16:00", endTime: "20:30" },
      { day: "weekend", maxHours: 2, startTime: "10:00", endTime: "20:30" },
    ],
    usageLog: [
      { date: d(-1), actualHours: 3, compliant: false, notes: "Significantly over limit. Found using phone at 23:00 under covers." },
      { date: d(-2), actualHours: 2, compliant: false, notes: "Over weekday limit. Reluctant to hand phone in." },
      { date: d(-3), actualHours: 1.5, compliant: true, notes: "" },
    ],
    incidents: [
      { date: d(-1), description: "Casey found using phone at 23:00 during night check. Phone should have been handed in at 20:30. Casey became distressed when asked to hand it over — was messaging grandmother.", actionTaken: "Sensitive discussion. Agreed Casey can have 10-minute goodnight call with grandmother, then phone is handed in. Agreement to be updated.", restrictionApplied: false },
      { date: d(-15), description: "Bark alert: Casey searching for birth mother on Facebook. Contacted birth mother via private message.", actionTaken: "Safeguarding discussion with Casey. Social worker informed. Facebook access restricted. Casey upset but understood the concerns.", restrictionApplied: true },
    ],
    restrictions: ["No Facebook (safeguarding — birth mother contact)", "No messaging after 20:30 (except goodnight call)", "Location sharing enabled"],
    socialMediaPermission: true, socialMediaPlatforms: ["Snapchat (private, monitored)", "TikTok (view only, no posting)"],
    socialWorkerApproval: true, nighttimeStorage: "Phone handed in at 20:30 after goodnight call — office locked drawer",
    reviewDate: d(3), notes: "Agreement under review following nighttime use and Facebook contact with birth mother. SW aware. Need to balance safety with Casey's need for family connection.",
  },
  {
    id: "dp5", youngPersonId: "yp_casey", deviceType: "laptop", deviceName: "Chromebook (Home-owned)",
    ownedBy: "home", serialNumber: "CB-OH-007", parentalControlsEnabled: true,
    parentalControlSoftware: "Google Admin + GoGuardian", wifiAccess: true, simCard: false,
    agreementSigned: true, agreementDate: d(-30), agreementStatus: "active",
    screenTimeRules: [
      { day: "weekday", maxHours: 2, startTime: "16:00", endTime: "20:00" },
      { day: "weekend", maxHours: 2, startTime: "10:00", endTime: "20:00" },
    ],
    usageLog: [
      { date: d(-1), actualHours: 1, compliant: true, notes: "College homework." },
    ],
    incidents: [],
    restrictions: ["Education use prioritised", "No social media via browser"],
    socialMediaPermission: false, socialMediaPlatforms: [],
    socialWorkerApproval: true, nighttimeStorage: "Returned to office at 20:00",
    reviewDate: d(30), notes: "Used primarily for college work. No concerns.",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function DevicePolicyPage() {
  const [data] = useState<DeviceRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("child");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = d(0);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.youngPersonId).toLowerCase().includes(s) || r.deviceName.toLowerCase().includes(s)); }
    if (childFilter !== "all") out = out.filter(r => r.youngPersonId === childFilter);
    if (statusFilter !== "all") out = out.filter(r => r.agreementStatus === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "device": return a.deviceName.localeCompare(b.deviceName);
        case "review": return a.reviewDate.localeCompare(b.reviewDate);
        default: return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
      }
    });
    return out;
  }, [data, search, childFilter, statusFilter, sortBy]);

  const childIds = ["yp_alex", "yp_jordan", "yp_casey"];
  const totalDevices = data.length;
  const activeAgreements = data.filter(r => r.agreementStatus === "active").length;
  const underReview = data.filter(r => r.agreementStatus === "under_review").length;
  const recentIncidents = data.reduce((s, r) => s + r.incidents.filter(i => i.date >= d(-30)).length, 0);

  const exportCols: ExportColumn<DeviceRecord>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: DeviceRecord) => getYPName(r.youngPersonId) },
    { header: "Device", accessor: (r: DeviceRecord) => r.deviceName },
    { header: "Type", accessor: (r: DeviceRecord) => DT_LABEL[r.deviceType] },
    { header: "Owned By", accessor: (r: DeviceRecord) => r.ownedBy },
    { header: "Agreement", accessor: (r: DeviceRecord) => AS_LABEL[r.agreementStatus] },
    { header: "Parental Controls", accessor: (r: DeviceRecord) => r.parentalControlsEnabled ? r.parentalControlSoftware : "None" },
    { header: "Screen Time (Weekday)", accessor: (r: DeviceRecord) => { const h = r.screenTimeRules.find(s => s.day === "weekday")?.maxHours; return h != null ? h + "h" : "—"; } },
    { header: "Screen Time (Weekend)", accessor: (r: DeviceRecord) => { const h = r.screenTimeRules.find(s => s.day === "weekend")?.maxHours; return h != null ? h + "h" : "—"; } },
    { header: "Social Media", accessor: (r: DeviceRecord) => r.socialMediaPermission ? r.socialMediaPlatforms.join(", ") : "No" },
    { header: "Nighttime Storage", accessor: (r: DeviceRecord) => r.nighttimeStorage },
    { header: "Incidents", accessor: (r: DeviceRecord) => String(r.incidents.length) },
    { header: "Review Date", accessor: (r: DeviceRecord) => r.reviewDate },
  ], []);

  return (
    <PageShell
      title="Device & Phone Policy"
      subtitle="Screen time agreements, device usage monitoring, and online safety — Reg 12"
      actions={[
        <PrintButton key="p" title="Device & Phone Policy" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="device-policy" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Device</Button>,
      ]}
    >
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
            const devices = data.filter(r => r.youngPersonId === cid);
            const incidents = devices.reduce((s, r) => s + r.incidents.length, 0);
            const nonCompliant = devices.reduce((s, r) => s + r.usageLog.filter(u => !u.compliant).length, 0);
            return (
              <Card key={cid}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{getYPName(cid)}</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Devices</span><span className="font-medium">{devices.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Incidents</span><Badge className={cn("text-xs", incidents > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>{incidents}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Non-Compliant Days</span><Badge className={cn("text-xs", nonCompliant > 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>{nonCompliant}</Badge></div>
                  <div className="flex gap-1 flex-wrap">{devices.map(dev => <Badge key={dev.id} className={cn("text-xs", DT_CLR[dev.deviceType])}>{DT_LABEL[dev.deviceType]}</Badge>)}</div>
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
            <div className="w-40"><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(AS_LABEL) as [AgreementStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="child">Child</SelectItem><SelectItem value="device">Device</SelectItem><SelectItem value="review">Review Due</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* device cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const reviewDue = r.reviewDate <= today;
            return (
              <Card key={r.id} className={cn(reviewDue && "border-amber-300")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{getYPName(r.youngPersonId)}</CardTitle>
                        <span className="text-sm text-muted-foreground">— {r.deviceName}</span>
                        <Badge className={cn("text-xs", DT_CLR[r.deviceType])}>{DT_LABEL[r.deviceType]}</Badge>
                        <Badge className={cn("text-xs", AS_CLR[r.agreementStatus])}>{AS_LABEL[r.agreementStatus]}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.parentalControlsEnabled && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Owned by:</span> {r.ownedBy}</div>
                      <div><span className="text-muted-foreground">Serial:</span> {r.serialNumber}</div>
                      <div><span className="text-muted-foreground">WiFi:</span> {r.wifiAccess ? "Yes" : "No"}</div>
                      <div><span className="text-muted-foreground">SIM:</span> {r.simCard ? "Yes" : "No"}</div>
                    </div>

                    {/* parental controls */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Parental Controls</p>
                      <p className="text-sm text-blue-900">{r.parentalControlsEnabled ? r.parentalControlSoftware : "Not enabled — action required"}</p>
                    </div>

                    {/* screen time rules */}
                    <div>
                      <p className="text-xs font-semibold mb-2">Screen Time Rules</p>
                      <div className="grid grid-cols-2 gap-2">
                        {r.screenTimeRules.map((st, i) => (
                          <div key={i} className="rounded border p-2 text-sm">
                            <p className="font-medium capitalize">{st.day}</p>
                            <p className="text-muted-foreground">{st.maxHours}h max · {st.startTime}–{st.endTime}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* recent usage */}
                    {r.usageLog.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Recent Usage</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Date</th><th className="text-left p-2 font-medium">Hours</th><th className="text-left p-2 font-medium">Compliant</th><th className="text-left p-2 font-medium">Notes</th></tr></thead>
                          <tbody>{r.usageLog.map((u, i) => (
                            <tr key={i} className={cn("border-t", !u.compliant && "bg-red-50")}>
                              <td className="p-2">{u.date}</td><td className="p-2">{u.actualHours}h</td>
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
                      {r.socialMediaPermission ? (
                        <div className="flex gap-1">{r.socialMediaPlatforms.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}</div>
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
                            <p className="text-xs mt-1"><strong>Action:</strong> {inc.actionTaken}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Nighttime: {r.nighttimeStorage}</span>
                      <span>SW Approval: {r.socialWorkerApproval ? <CheckCircle2 className="inline h-3 w-3 text-green-500" /> : "Pending"}</span>
                      <span className={cn(reviewDue && "text-red-600 font-medium")}>Review: {r.reviewDate}{reviewDue && " (DUE)"}</span>
                    </div>
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

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Device Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Device Name</Label><Input placeholder="e.g. iPhone SE" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Device Type</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(DT_LABEL) as [DeviceType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Owned By</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="child">Child</SelectItem><SelectItem value="home">Home</SelectItem><SelectItem value="family">Family</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Serial Number</Label><Input placeholder="Device serial/IMEI" /></div>
            <div><Label>Nighttime Storage</Label><Input placeholder="Where is device stored at night?" /></div>
            <div><Label>Notes</Label><Textarea rows={2} placeholder="Additional notes…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Add Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
