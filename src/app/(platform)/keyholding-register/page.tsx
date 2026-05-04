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
  AlertTriangle, CheckCircle2, Clock, Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type KeyType = "master" | "room" | "office" | "vehicle" | "safe" | "medication_cabinet" | "external" | "fob" | "gate";
type KStatus = "in_use" | "all_accounted" | "lost" | "replacement_ordered" | "decommissioned";

interface SignOutEntry { staffId: string; signedOut: string; signedIn: string | null; purpose: string }
interface LostIncident { date: string; reportedBy: string; circumstances: string; locksChanged: boolean; resolved: boolean }

interface KeyRecord {
  id: string;
  keyName: string;
  keyType: KeyType;
  keyNumber: string;
  totalCopies: number;
  permanentHolders: { staffId: string; issuedDate: string; returnDate: string | null }[];
  signOutLog: SignOutEntry[];
  restrictedAccess: boolean;
  authorisedStaff: string[];
  location: string;
  lastAudit: string;
  nextAuditDue: string;
  status: KStatus;
  lostKeyIncidents: LostIncident[];
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const KT_LABEL: Record<KeyType, string> = {
  master: "Master Key", room: "Room Key", office: "Office Key", vehicle: "Vehicle Key",
  safe: "Safe Key", medication_cabinet: "Medication Cabinet", external: "External", fob: "Fob", gate: "Gate Key",
};
const KT_CLR: Record<KeyType, string> = {
  master: "bg-purple-100 text-purple-800", room: "bg-blue-100 text-blue-800",
  office: "bg-gray-100 text-gray-800", vehicle: "bg-green-100 text-green-800",
  safe: "bg-red-100 text-red-800", medication_cabinet: "bg-amber-100 text-amber-800",
  external: "bg-teal-100 text-teal-800", fob: "bg-indigo-100 text-indigo-800",
  gate: "bg-emerald-100 text-emerald-800",
};
const KS_LABEL: Record<KStatus, string> = {
  in_use: "In Use", all_accounted: "All Accounted", lost: "Lost",
  replacement_ordered: "Replacement Ordered", decommissioned: "Decommissioned",
};
const KS_CLR: Record<KStatus, string> = {
  in_use: "bg-blue-100 text-blue-800", all_accounted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800", replacement_ordered: "bg-amber-100 text-amber-800",
  decommissioned: "bg-gray-100 text-gray-800",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: KeyRecord[] = [
  {
    id: "k1", keyName: "Front Door Master Key", keyType: "master", keyNumber: "MK-001", totalCopies: 4,
    permanentHolders: [
      { staffId: "staff_darren", issuedDate: d(-365), returnDate: null },
      { staffId: "staff_ryan", issuedDate: d(-300), returnDate: null },
    ],
    signOutLog: [
      { staffId: "staff_anna", signedOut: d(-1) + " 07:00", signedIn: d(-1) + " 19:00", purpose: "Day shift" },
      { staffId: "staff_edward", signedOut: d(0) + " 07:00", signedIn: null, purpose: "Day shift" },
    ],
    restrictedAccess: false, authorisedStaff: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_diane", "staff_lackson", "staff_mirela"],
    location: "Key safe in office", lastAudit: d(-14), nextAuditDue: d(16),
    status: "all_accounted", lostKeyIncidents: [], notes: "All 4 copies checked and verified at last audit.",
  },
  {
    id: "k2", keyName: "Medication Cabinet Key", keyType: "medication_cabinet", keyNumber: "MED-001", totalCopies: 2,
    permanentHolders: [
      { staffId: "staff_darren", issuedDate: d(-365), returnDate: null },
      { staffId: "staff_ryan", issuedDate: d(-300), returnDate: null },
    ],
    signOutLog: [
      { staffId: "staff_anna", signedOut: d(0) + " 20:00", signedIn: d(0) + " 20:30", purpose: "Evening medication round" },
    ],
    restrictedAccess: true, authorisedStaff: ["staff_darren", "staff_ryan"],
    location: "RM office locked drawer", lastAudit: d(-28), nextAuditDue: d(2),
    status: "all_accounted", lostKeyIncidents: [], notes: "Only RM and Deputy authorised for permanent custody. Other staff must sign out and return within 1 hour.",
  },
  {
    id: "k3", keyName: "Office Safe Key", keyType: "safe", keyNumber: "SAFE-001", totalCopies: 2,
    permanentHolders: [
      { staffId: "staff_darren", issuedDate: d(-365), returnDate: null },
    ],
    signOutLog: [],
    restrictedAccess: true, authorisedStaff: ["staff_darren"],
    location: "On RM keyring at all times", lastAudit: d(-7), nextAuditDue: d(23),
    status: "all_accounted", lostKeyIncidents: [], notes: "Spare copy in sealed envelope in medication cabinet. Only to be opened in emergency with witness.",
  },
  {
    id: "k4", keyName: "Vehicle Keys — Ford Transit KY69 ABC", keyType: "vehicle", keyNumber: "VEH-001", totalCopies: 2,
    permanentHolders: [
      { staffId: "staff_darren", issuedDate: d(-365), returnDate: null },
    ],
    signOutLog: [
      { staffId: "staff_anna", signedOut: d(-3) + " 08:30", signedIn: d(-3) + " 16:00", purpose: "School runs" },
      { staffId: "staff_ryan", signedOut: d(-2) + " 13:00", signedIn: d(-2) + " 15:30", purpose: "CAMHS appointment — Jordan" },
      { staffId: "staff_darren", signedOut: d(-1) + " 09:00", signedIn: d(-1) + " 12:00", purpose: "Contact visit — Casey" },
      { staffId: "staff_edward", signedOut: d(0) + " 08:00", signedIn: null, purpose: "School run and cinema trip" },
    ],
    restrictedAccess: false, authorisedStaff: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_diane"],
    location: "Key hook in office (labelled)", lastAudit: d(-14), nextAuditDue: d(16),
    status: "in_use", lostKeyIncidents: [], notes: "All drivers must have valid licence on file. Pre-journey check required.",
  },
  {
    id: "k5", keyName: "Children's Bedroom Master", keyType: "room", keyNumber: "RM-MASTER", totalCopies: 1,
    permanentHolders: [],
    signOutLog: [
      { staffId: "staff_darren", signedOut: d(-10) + " 22:00", signedIn: d(-10) + " 22:15", purpose: "Welfare check — Casey not responding" },
    ],
    restrictedAccess: true, authorisedStaff: ["staff_darren", "staff_ryan"],
    location: "Office safe — emergency use only", lastAudit: d(-7), nextAuditDue: d(23),
    status: "all_accounted", lostKeyIncidents: [], notes: "Emergency use only. Every use must be documented with reason. Children have their own bedroom keys.",
  },
  {
    id: "k6", keyName: "Garden Gate Key", keyType: "gate", keyNumber: "GATE-001", totalCopies: 3,
    permanentHolders: [
      { staffId: "staff_darren", issuedDate: d(-365), returnDate: null },
    ],
    signOutLog: [
      { staffId: "staff_chervelle", signedOut: d(-5) + " 15:00", signedIn: d(-5) + " 17:00", purpose: "Garden activities" },
    ],
    restrictedAccess: false, authorisedStaff: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_diane"],
    location: "Key hook in kitchen", lastAudit: d(-14), nextAuditDue: d(16),
    status: "all_accounted",
    lostKeyIncidents: [
      { date: d(-45), reportedBy: "staff_diane", circumstances: "Key not on hook at end of shift. Searched for 2 hours. Found in jacket pocket next morning.", locksChanged: false, resolved: true },
    ],
    notes: "Previous lost key incident — resolved. No security breach.",
  },
  {
    id: "k7", keyName: "CCTV Room Key", keyType: "office", keyNumber: "OFF-002", totalCopies: 2,
    permanentHolders: [
      { staffId: "staff_darren", issuedDate: d(-365), returnDate: null },
      { staffId: "staff_ryan", issuedDate: d(-300), returnDate: null },
    ],
    signOutLog: [],
    restrictedAccess: true, authorisedStaff: ["staff_darren", "staff_ryan"],
    location: "RM office locked drawer", lastAudit: d(-7), nextAuditDue: d(23),
    status: "all_accounted", lostKeyIncidents: [], notes: "CCTV access restricted to RM and Deputy only. GDPR compliance required.",
  },
  {
    id: "k8", keyName: "Staff Sleep-In Room", keyType: "room", keyNumber: "RM-SLP", totalCopies: 1,
    permanentHolders: [],
    signOutLog: [
      { staffId: "staff_diane", signedOut: d(-1) + " 22:00", signedIn: d(0) + " 07:00", purpose: "Sleep-in shift" },
    ],
    restrictedAccess: false, authorisedStaff: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_diane", "staff_mirela"],
    location: "Hook in office — labelled", lastAudit: d(-14), nextAuditDue: d(16),
    status: "in_use", lostKeyIncidents: [], notes: "Key to be signed out at start of sleep-in and returned at handover.",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function KeyholdingRegisterPage() {
  const [data] = useState<KeyRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = d(0);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => r.keyName.toLowerCase().includes(s) || r.keyNumber.toLowerCase().includes(s)); }
    if (typeFilter !== "all") out = out.filter(r => r.keyType === typeFilter);
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "type": return a.keyType.localeCompare(b.keyType);
        case "audit": return a.nextAuditDue.localeCompare(b.nextAuditDue);
        default: return a.keyName.localeCompare(b.keyName);
      }
    });
    return out;
  }, [data, search, typeFilter, statusFilter, sortBy]);

  const signedOut = data.reduce((s, k) => s + k.signOutLog.filter(e => !e.signedIn).length, 0);
  const lostCount = data.filter(k => k.status === "lost").length;
  const auditOverdue = data.filter(k => k.nextAuditDue < today).length;

  const exportCols: ExportColumn<KeyRecord>[] = useMemo(() => [
    { header: "Key Name", accessor: (r: KeyRecord) => r.keyName },
    { header: "Type", accessor: (r: KeyRecord) => KT_LABEL[r.keyType] },
    { header: "Key Number", accessor: (r: KeyRecord) => r.keyNumber },
    { header: "Copies", accessor: (r: KeyRecord) => String(r.totalCopies) },
    { header: "Restricted", accessor: (r: KeyRecord) => r.restrictedAccess ? "Yes" : "No" },
    { header: "Holders", accessor: (r: KeyRecord) => r.permanentHolders.map(h => getStaffName(h.staffId)).join(", ") || "None" },
    { header: "Location", accessor: (r: KeyRecord) => r.location },
    { header: "Status", accessor: (r: KeyRecord) => KS_LABEL[r.status] },
    { header: "Last Audit", accessor: (r: KeyRecord) => r.lastAudit },
    { header: "Next Audit Due", accessor: (r: KeyRecord) => r.nextAuditDue },
  ], []);

  return (
    <PageShell
      title="Keyholding Register"
      subtitle="Key, fob, and access device tracking — security compliance"
      actions={[
        <PrintButton key="p" title="Keyholding Register" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="keyholding-register" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Key</Button>,
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
            <div className="w-44"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(KT_LABEL) as [KeyType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-40"><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(KS_LABEL) as [KStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">Name</SelectItem><SelectItem value="type">Type</SelectItem><SelectItem value="audit">Audit Due</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* key cards */}
        <div className="space-y-3">
          {filtered.map(k => {
            const open = expanded === k.id;
            const currentlyOut = k.signOutLog.filter(e => !e.signedIn);
            const auditDue = k.nextAuditDue <= today;
            return (
              <Card key={k.id} className={cn(auditDue && "border-amber-300", k.status === "lost" && "border-red-400")}>
                <button className="w-full text-left" onClick={() => toggle(k.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{k.keyName}</CardTitle>
                        <Badge className={cn("text-xs", KT_CLR[k.keyType])}>{KT_LABEL[k.keyType]}</Badge>
                        <Badge className={cn("text-xs", KS_CLR[k.status])}>{KS_LABEL[k.status]}</Badge>
                        {k.restrictedAccess && <Badge className="text-xs bg-red-900 text-white">Restricted</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{k.keyNumber} · {k.totalCopies} copies</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Location:</span> {k.location}</div>
                      <div><span className="text-muted-foreground">Total Copies:</span> {k.totalCopies}</div>
                    </div>

                    {/* permanent holders */}
                    {k.permanentHolders.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Permanent Holders</p>
                        <div className="flex gap-2 flex-wrap">{k.permanentHolders.map((h, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{getStaffName(h.staffId)} — since {h.issuedDate}</Badge>
                        ))}</div>
                      </div>
                    )}

                    {/* authorised staff */}
                    <div>
                      <p className="text-xs font-semibold mb-1">Authorised Staff</p>
                      <div className="flex gap-1 flex-wrap">{k.authorisedStaff.map(s => <Badge key={s} variant="outline" className="text-xs bg-green-50">{getStaffName(s)}</Badge>)}</div>
                    </div>

                    {/* currently signed out */}
                    {currentlyOut.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Currently Signed Out</p>
                        {currentlyOut.map((e, i) => (
                          <p key={i} className="text-sm text-amber-900">{getStaffName(e.staffId)} — {e.purpose} (out: {e.signedOut})</p>
                        ))}
                      </div>
                    )}

                    {/* sign-out log */}
                    {k.signOutLog.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Recent Sign-Out Log</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Staff</th><th className="text-left p-2 font-medium">Out</th><th className="text-left p-2 font-medium">In</th><th className="text-left p-2 font-medium">Purpose</th></tr></thead>
                          <tbody>{k.signOutLog.slice(-5).map((e, i) => (
                            <tr key={i} className={cn("border-t", !e.signedIn && "bg-amber-50")}>
                              <td className="p-2">{getStaffName(e.staffId)}</td>
                              <td className="p-2">{e.signedOut}</td>
                              <td className="p-2">{e.signedIn ?? <span className="text-amber-600 font-medium">Still out</span>}</td>
                              <td className="p-2">{e.purpose}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}

                    {/* lost incidents */}
                    {k.lostKeyIncidents.length > 0 && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-semibold text-red-800 mb-1">Lost Key Incidents</p>
                        {k.lostKeyIncidents.map((inc, i) => (
                          <div key={i} className="text-sm text-red-900 space-y-1">
                            <p><strong>{inc.date}</strong> — Reported by {getStaffName(inc.reportedBy)}</p>
                            <p>{inc.circumstances}</p>
                            <p>Locks changed: {inc.locksChanged ? "Yes" : "No"} · Resolved: {inc.resolved ? <CheckCircle2 className="inline h-4 w-4 text-green-600" /> : <AlertTriangle className="inline h-4 w-4 text-red-600" />}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* audit info */}
                    <div className="flex gap-4 text-sm">
                      <span><strong>Last Audit:</strong> {k.lastAudit}</span>
                      <span className={cn(auditDue && "text-red-600 font-medium")}><strong>Next Due:</strong> {k.nextAuditDue}{auditDue && " (OVERDUE)"}</span>
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
                const due = k.nextAuditDue <= today;
                return (
                  <tr key={k.id} className={cn("border-t", due && "bg-red-50")}>
                    <td className="p-2 font-medium">{k.keyName}</td>
                    <td className="p-2"><Badge className={cn("text-xs", KT_CLR[k.keyType])}>{KT_LABEL[k.keyType]}</Badge></td>
                    <td className="p-2">{k.lastAudit}</td>
                    <td className={cn("p-2", due && "text-red-600 font-medium")}>{k.nextAuditDue}</td>
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
          <div className="space-y-3">
            <div><Label>Key Name</Label><Input placeholder="e.g. Front Door Master Key" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Key Number</Label><Input placeholder="e.g. MK-001" /></div>
              <div><Label>Total Copies</Label><Input type="number" defaultValue={1} /></div>
            </div>
            <div><Label>Key Type</Label><Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{(Object.entries(KT_LABEL) as [KeyType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Storage Location</Label><Input placeholder="Where is this key stored?" /></div>
            <div><Label>Notes</Label><Textarea rows={2} placeholder="Additional notes…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Add Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
