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
  AlertTriangle, Gift, CheckCircle2, ArrowRight, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type Direction = "received" | "given";
type RecipientType = "child" | "staff" | "home";
type GiftSource = "family" | "social_worker" | "advocate" | "charity" | "staff_personal" | "home_purchase" | "community" | "unknown" | "other";
type ApprovalStatus = "approved" | "declined" | "pending" | "returned";

interface GiftRecord {
  id: string;
  date: string;
  direction: Direction;
  recipientType: RecipientType;
  recipientId: string | null;
  recipientName: string;
  source: GiftSource;
  sourceName: string;
  description: string;
  estimatedValue: number;
  approvalStatus: ApprovalStatus;
  approvedBy: string | null;
  reason: string;
  safeguardingConcerns: boolean;
  safeguardingNotes: string;
  recordedBy: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const DIR_LABEL: Record<Direction, string> = { received: "Received", given: "Given" };
const DIR_CLR: Record<Direction, string> = { received: "bg-green-100 text-green-800", given: "bg-blue-100 text-blue-800" };
const SOURCE_LABEL: Record<GiftSource, string> = { family: "Family", social_worker: "Social Worker", advocate: "Advocate", charity: "Charity", staff_personal: "Staff (Personal)", home_purchase: "Home Purchase", community: "Community", unknown: "Unknown", other: "Other" };
const STATUS_LABEL: Record<ApprovalStatus, string> = { approved: "Approved", declined: "Declined", pending: "Pending", returned: "Returned to Sender" };
const STATUS_CLR: Record<ApprovalStatus, string> = { approved: "bg-green-100 text-green-800", declined: "bg-red-100 text-red-800", pending: "bg-amber-100 text-amber-800", returned: "bg-slate-100 text-slate-800" };
const BORDER_DIR: Record<Direction, string> = { received: "border-l-green-400", given: "border-l-blue-400" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: GiftRecord[] = [
  {
    id: "gift_1", date: d(-3), direction: "received", recipientType: "child", recipientId: "yp_alex", recipientName: "Alex",
    source: "family", sourceName: "Alex's birth father (Mark)",
    description: "Football boots — Nike Phantom, size 5",
    estimatedValue: 85, approvalStatus: "approved", approvedBy: "staff_darren",
    reason: "Birthday gift from birth father. Discussed with SW — age-appropriate and no concerns.",
    safeguardingConcerns: false, safeguardingNotes: "",
    recordedBy: "staff_anna", notes: "Alex delighted with the gift. Father had asked beforehand via SW. Boots appropriate for Alex's football training.",
  },
  {
    id: "gift_2", date: d(-10), direction: "received", recipientType: "child", recipientId: "yp_casey", recipientName: "Casey",
    source: "unknown", sourceName: "Unknown — left at front door",
    description: "Box of chocolates with handwritten card saying 'To Casey, from a friend'",
    estimatedValue: 15, approvalStatus: "declined", approvedBy: "staff_darren",
    reason: "Source unknown. Handwritten card with no sender details. Could not verify who left the package. Given current CSE screening, unexplained gifts are a safeguarding concern.",
    safeguardingConcerns: true, safeguardingNotes: "Reported to Fiona Brennan (SW). Discussed at team meeting. Gift stored securely in case needed as evidence. Possible link to Marcus (exploitation screening concern). Police informed via existing Operation Encompass contact.",
    recordedBy: "staff_darren", notes: "Casey was not told the specific reason for declining — told that gifts from unknown sources cannot be accepted for safety reasons. Casey did not seem overly concerned.",
  },
  {
    id: "gift_3", date: d(-14), direction: "received", recipientType: "child", recipientId: "yp_jordan", recipientName: "Jordan",
    source: "charity", sourceName: "Children in Need — local branch",
    description: "Voucher for £50 towards birthday activity of Jordan's choice",
    estimatedValue: 50, approvalStatus: "approved", approvedBy: "staff_darren",
    reason: "Annual birthday voucher from registered charity. Standard provision — approved.",
    safeguardingConcerns: false, safeguardingNotes: "",
    recordedBy: "staff_ryan", notes: "Jordan chose to use the voucher for a Lego set from Smyths Toys. Receipt retained.",
  },
  {
    id: "gift_4", date: d(-21), direction: "given", recipientType: "child", recipientId: "yp_alex", recipientName: "Alex",
    source: "home_purchase", sourceName: "Oak House — from petty cash",
    description: "Art supplies set — watercolour paints, brushes, sketchbook",
    estimatedValue: 22, approvalStatus: "approved", approvedBy: "staff_darren",
    reason: "Positive reinforcement — Alex achieved all weekly targets for 4 consecutive weeks. Reward agreed in key work session.",
    safeguardingConcerns: false, safeguardingNotes: "",
    recordedBy: "staff_darren", notes: "Part of agreed reward scheme. Receipt filed with petty cash records.",
  },
  {
    id: "gift_5", date: d(-30), direction: "received", recipientType: "staff", recipientId: "staff_anna", recipientName: "Anna",
    source: "family", sourceName: "Alex's grandmother (Dorothy)",
    description: "Box of biscuits and thank-you card",
    estimatedValue: 8, approvalStatus: "approved", approvedBy: "staff_darren",
    reason: "Small thank-you gesture from family. Low value. No concerns. Policy allows gifts under £20 to be accepted if shared with the team.",
    safeguardingConcerns: false, safeguardingNotes: "",
    recordedBy: "staff_anna", notes: "Biscuits shared in the staff room. Card displayed. Anna thanked Dorothy by phone.",
  },
  {
    id: "gift_6", date: d(-5), direction: "received", recipientType: "child", recipientId: "yp_casey", recipientName: "Casey",
    source: "family", sourceName: "Casey's grandmother (Margaret)",
    description: "Handmade quilt for Casey's bed",
    estimatedValue: 0, approvalStatus: "approved", approvedBy: "staff_darren",
    reason: "Handmade item from grandmother — strong relationship, regular contact. Sentimental value. No concerns.",
    safeguardingConcerns: false, safeguardingNotes: "",
    recordedBy: "staff_chervelle", notes: "Casey was visibly moved by the gift. Margaret had spent several weeks making it. Casey placed it on the bed immediately. Lovely moment captured in daily log.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function GiftsRegisterPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterDirection, setFilterDirection] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterDirection !== "all" && r.direction !== filterDirection) return false;
      if (filterStatus !== "all" && r.approvalStatus !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.recipientName.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.sourceName.toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "value": return b.estimatedValue - a.estimatedValue;
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterDirection, filterStatus, sortBy]);

  const totalGifts = data.length;
  const received = data.filter((r) => r.direction === "received").length;
  const declined = data.filter((r) => r.approvalStatus === "declined" || r.approvalStatus === "returned").length;
  const safeguardingFlags = data.filter((r) => r.safeguardingConcerns).length;
  const totalValue = data.filter((r) => r.approvalStatus === "approved").reduce((sum, r) => sum + r.estimatedValue, 0);

  const exportCols: ExportColumn<GiftRecord>[] = [
    { header: "Date", accessor: (r: GiftRecord) => r.date },
    { header: "Direction", accessor: (r: GiftRecord) => DIR_LABEL[r.direction] },
    { header: "Recipient", accessor: (r: GiftRecord) => r.recipientName },
    { header: "Source", accessor: (r: GiftRecord) => r.sourceName },
    { header: "Description", accessor: (r: GiftRecord) => r.description },
    { header: "Est. Value (£)", accessor: (r: GiftRecord) => String(r.estimatedValue) },
    { header: "Status", accessor: (r: GiftRecord) => STATUS_LABEL[r.approvalStatus] },
    { header: "Safeguarding", accessor: (r: GiftRecord) => r.safeguardingConcerns ? "Yes" : "No" },
    { header: "Reason", accessor: (r: GiftRecord) => r.reason },
    { header: "Recorded By", accessor: (r: GiftRecord) => getStaffName(r.recordedBy) },
  ];

  return (
    <PageShell title="Gifts & Hospitality Register" subtitle="Anti-Bribery Policy · Safeguarding · Reg 12 · Delegated Authority" actions={<div className="flex items-center gap-2"><PrintButton title="Gifts Register" /><ExportButton data={filtered} columns={exportCols} filename="gifts-register" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Gift</Button></div>}>
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
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(STATUS_LABEL) as ApprovalStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
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
                        <Badge variant="outline" className={DIR_CLR[r.direction]}>{DIR_LABEL[r.direction]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.approvalStatus]}>{STATUS_LABEL[r.approvalStatus]}</Badge>
                        {r.safeguardingConcerns && <Badge variant="destructive">⚠ Safeguarding</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.direction === "received" ? `From: ${r.sourceName} → To: ${r.recipientName}` : `From: Home → To: ${r.recipientName}`} · {r.date} · Est. value: £{r.estimatedValue}
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
                    {r.safeguardingConcerns && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="font-medium text-red-800 mb-1">Safeguarding Notes</p>
                        <p className="text-red-700 text-xs">{r.safeguardingNotes}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Recorded by: {getStaffName(r.recordedBy)}</span>
                      <span>Source: {SOURCE_LABEL[r.source]}</span>
                      <span>{r.approvedBy ? `Approved by: ${getStaffName(r.approvedBy)}` : "Pending approval"}</span>
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
            <div><Label>Date</Label><Input type="date" /></div>
            <div><Label>Direction</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent><SelectItem value="received">Received</SelectItem><SelectItem value="given">Given</SelectItem></SelectContent></Select></div>
            <div><Label>Recipient</Label><Input placeholder="Who received the gift?" /></div>
            <div><Label>Source / From</Label><Input placeholder="Who gave the gift?" /></div>
            <div className="col-span-2"><Label>Description</Label><Input placeholder="What was the gift?" /></div>
            <div><Label>Estimated Value (£)</Label><Input type="number" placeholder="0" /></div>
            <div><Label>Approval Status</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(STATUS_LABEL) as ApprovalStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Reason / Decision</Label><Textarea rows={2} placeholder="Why approved/declined?" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}