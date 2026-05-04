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
  Plus, Search, Filter, ChevronDown, ChevronUp,
  CheckCircle2, Clock, FileText, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type AgreementType = "house_rules" | "device_use" | "bedroom_expectations" | "kitchen_use" | "visitor_expectations" | "community_behaviour" | "chores" | "bedtime" | "rewards_framework" | "individual_boundary";
type AgreementStatus = "active" | "under_review" | "expired" | "draft";

interface AgreementRule {
  rule: string;
  agreedByYP: boolean;
  notes: string;
}

interface ServiceUserAgreement {
  id: string;
  youngPersonId: string;
  agreementType: AgreementType;
  status: AgreementStatus;
  createdDate: string;
  reviewDate: string;
  lastReviewedDate: string;
  createdBy: string;
  youngPersonSignedDate: string | null;
  youngPersonViews: string;
  rules: AgreementRule[];
  consequences: string;
  rewards: string;
  modifications: string;
  socialWorkerAware: boolean;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const AGR_LABEL: Record<AgreementType, string> = {
  house_rules: "House Rules Agreement", device_use: "Device & Phone Agreement",
  bedroom_expectations: "Bedroom Standards", kitchen_use: "Kitchen Use",
  visitor_expectations: "Visitors & Friends", community_behaviour: "Community Behaviour",
  chores: "Chores & Responsibilities", bedtime: "Bedtime Agreement",
  rewards_framework: "Rewards Framework", individual_boundary: "Individual Boundary Plan",
};
const STATUS_LABEL: Record<AgreementStatus, string> = { active: "Active", under_review: "Under Review", expired: "Expired", draft: "Draft" };
const STATUS_CLR: Record<AgreementStatus, string> = { active: "bg-green-100 text-green-800", under_review: "bg-amber-100 text-amber-800", expired: "bg-red-100 text-red-800", draft: "bg-blue-100 text-blue-800" };
const BORDER_ST: Record<AgreementStatus, string> = { active: "border-l-green-400", under_review: "border-l-amber-400", expired: "border-l-red-400", draft: "border-l-blue-400" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: ServiceUserAgreement[] = [
  {
    id: "sua_1", youngPersonId: "yp_alex", agreementType: "house_rules", status: "active",
    createdDate: d(-90), reviewDate: d(90), lastReviewedDate: d(-14), createdBy: "staff_darren",
    youngPersonSignedDate: d(-90), youngPersonViews: "Alex said: 'Most of these are fair. I don't like the phone one but I get why.' Alex was involved in creating the rules and felt his voice was heard.",
    rules: [
      { rule: "Respect other people's bedrooms — knock before entering", agreedByYP: true, notes: "" },
      { rule: "Use kind words — no name-calling, swearing at people, or threats", agreedByYP: true, notes: "Alex requested 'swearing in general is ok, just not at people' — agreed" },
      { rule: "Phone handed in at 9pm on school nights, 10pm on weekends", agreedByYP: true, notes: "Alex negotiated from original 8:30pm. Agreed to trial 9pm." },
      { rule: "Let staff know when leaving the house and where you're going", agreedByYP: true, notes: "" },
      { rule: "Home by 5pm on school days, 7pm on weekends (unless agreed otherwise)", agreedByYP: true, notes: "Alex asked for flexibility for football training — agreed on case-by-case basis" },
      { rule: "Take part in at least one house chore each day", agreedByYP: true, notes: "Alex chose: setting the table and recycling" },
      { rule: "No smoking or vaping in the building or garden", agreedByYP: true, notes: "" },
    ],
    consequences: "If a rule is broken: 1) Conversation about what happened and why. 2) If repeated, key work session to discuss. 3) Natural consequences where appropriate (e.g., phone returned later next evening if not handed in on time). We don't use sanctions that restrict family contact, food, or personal space.",
    rewards: "Weekly rewards chart. Meeting all daily expectations earns a star. 5 stars = choice of activity (cinema, takeaway, game shop visit). Monthly bonus: if all weekly targets met, £10 added to savings or spent. Alex helped design this system.",
    modifications: "Alex requested: football training exempt from 5pm curfew. Agreed — Alex texts when leaving training. Rule added that phone handover can be 15 minutes flexible on weekends if Alex is in the middle of a game — but must be handed in by 10:15pm at the absolute latest.",
    socialWorkerAware: true,
  },
  {
    id: "sua_2", youngPersonId: "yp_jordan", agreementType: "bedtime", status: "active",
    createdDate: d(-60), reviewDate: d(120), lastReviewedDate: d(-7), createdBy: "staff_darren",
    youngPersonSignedDate: d(-60), youngPersonViews: "Jordan used the visual schedule to help create this agreement. Jordan said: 'I like knowing what happens when.' Jordan's ASD means clear, predictable routines are essential.",
    rules: [
      { rule: "Bath/shower time: 7:30pm (can choose bath or shower)", agreedByYP: true, notes: "Jordan prefers bath. Shower only if bath is occupied." },
      { rule: "Pyjamas and teeth brushed by 8:00pm", agreedByYP: true, notes: "" },
      { rule: "iPad use until 8:30pm (calming apps only — no stimulating games after 8pm)", agreedByYP: true, notes: "Jordan chose: drawing app, audiobook app, Calm Kids" },
      { rule: "iPad placed on charging station at 8:30pm (not in bedroom)", agreedByYP: true, notes: "" },
      { rule: "Reading or audiobook in bed from 8:30pm", agreedByYP: true, notes: "Jordan currently listening to a David Walliams audiobook series" },
      { rule: "Lights off at 9:00pm", agreedByYP: true, notes: "Jordan has a nightlight (dim blue) that stays on — helps with anxiety" },
      { rule: "If awake after lights off — can read quietly or listen to audiobook with earbuds", agreedByYP: true, notes: "" },
    ],
    consequences: "This is a supportive agreement, not punitive. If Jordan is struggling to settle, staff will offer: comfort, warm drink, 5-minute calming chat, or sensory tool (weighted blanket). If Jordan breaks the screen time boundary, the visual timer is used as a gentle reminder.",
    rewards: "Jordan earns a 'Good Night' sticker for following the routine without prompts. 5 stickers = 30 extra minutes of Roblox at the weekend. Jordan designed the sticker chart and chose dinosaur stickers.",
    modifications: "Friday and Saturday nights: bedtime extended to 9:30pm. Holiday periods: flexible by 30 minutes. If Jordan is significantly dysregulated, the routine can be adapted — staff should follow Jordan's BSP de-escalation strategies first.",
    socialWorkerAware: true,
  },
  {
    id: "sua_3", youngPersonId: "yp_casey", agreementType: "individual_boundary", status: "under_review",
    createdDate: d(-30), reviewDate: d(0), lastReviewedDate: d(-7), createdBy: "staff_darren",
    youngPersonSignedDate: d(-30), youngPersonViews: "Casey said: 'I know you're trying to keep me safe. Some of this feels like you don't trust me.' Staff reassured Casey that the boundaries are about safety, not trust, and that Casey's voice in creating them is valued.",
    rules: [
      { rule: "Phone checks: weekly (staff will ask, not take without warning)", agreedByYP: true, notes: "Casey negotiated: staff must explain what they're looking for" },
      { rule: "Social media privacy settings reviewed monthly with key worker", agreedByYP: true, notes: "" },
      { rule: "No contact with Marcus until safeguarding assessment complete", agreedByYP: false, notes: "Casey disagrees with this rule but understands the reason. Told staff: 'He's just a friend.' LADO/SW decision — not negotiable." },
      { rule: "If going out, tell staff who with, where, and expected return time", agreedByYP: true, notes: "" },
      { rule: "Night-time: phone stored in office overnight", agreedByYP: true, notes: "Casey initially refused but agreed after discussion about sleep quality improvement" },
      { rule: "Any new friends introduced to staff before meeting outside the home", agreedByYP: false, notes: "Casey said: 'That's embarrassing.' Compromise: Casey shares the friend's name and where they're going, doesn't need to introduce in person." },
    ],
    consequences: "Boundaries are safeguarding measures, not punishments. If Casey breaks a boundary: 1) Calm, non-judgmental conversation. 2) Explore what happened and why. 3) Update risk assessment if needed. 4) Inform social worker if significant boundary breach. 5) Additional direct work session.",
    rewards: "Casey's engagement with boundaries is acknowledged positively. Monthly reward: if Casey follows the safety plan consistently, choice of a pamper evening (face masks, nail painting, favourite film) or a 1:1 outing with key worker.",
    modifications: "Agreement under review due to CSE screening escalation. Additional boundary around Marcus contact added by SW. Casey's views on this were listened to and recorded, even though the decision stands. Next review to consider whether phone checks can reduce to fortnightly if compliance remains positive.",
    socialWorkerAware: true,
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ServiceUserAgreementsPage() {
  const [data] = useState(SEED);
  const [filterChild, setFilterChild] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (filterChild !== "all" && r.youngPersonId !== filterChild) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [data, filterChild, filterStatus]);

  const active = data.filter((r) => r.status === "active").length;
  const underReview = data.filter((r) => r.status === "under_review").length;
  const allAgreed = data.flatMap((r) => r.rules).filter((r) => r.agreedByYP).length;
  const notAgreed = data.flatMap((r) => r.rules).filter((r) => !r.agreedByYP).length;

  const exportCols: ExportColumn<ServiceUserAgreement>[] = [
    { header: "Child", accessor: (r: ServiceUserAgreement) => getYPName(r.youngPersonId) },
    { header: "Agreement", accessor: (r: ServiceUserAgreement) => AGR_LABEL[r.agreementType] },
    { header: "Status", accessor: (r: ServiceUserAgreement) => STATUS_LABEL[r.status] },
    { header: "Created", accessor: (r: ServiceUserAgreement) => r.createdDate },
    { header: "Review Due", accessor: (r: ServiceUserAgreement) => r.reviewDate },
    { header: "YP Signed", accessor: (r: ServiceUserAgreement) => r.youngPersonSignedDate || "Not signed" },
    { header: "YP Views", accessor: (r: ServiceUserAgreement) => r.youngPersonViews },
    { header: "Created By", accessor: (r: ServiceUserAgreement) => getStaffName(r.createdBy) },
  ];

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
          <Select value={filterChild} onValueChange={setFilterChild}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Children</SelectItem><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(STATUS_LABEL) as AgreementStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
        </div>

        <div className="space-y-4">
          {filtered.map((r) => {
            const open = expanded[r.id];
            const agreedCount = r.rules.filter((rl) => rl.agreedByYP).length;
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_ST[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getYPName(r.youngPersonId)} — {AGR_LABEL[r.agreementType]}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline" className="bg-muted/30">{agreedCount}/{r.rules.length} agreed</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Created: {r.createdDate} · Review: {r.reviewDate} · Signed: {r.youngPersonSignedDate || "Not yet"}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-800 mb-1">Young Person&apos;s Views</p>
                      <p className="text-blue-700 text-xs italic">{r.youngPersonViews}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Rules & Expectations</p>
                      <div className="space-y-2">
                        {r.rules.map((rl, i) => (
                          <div key={i} className={cn("rounded-lg p-3 border", rl.agreedByYP ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                            <div className="flex items-start gap-2">
                              <span className="shrink-0 mt-0.5">{rl.agreedByYP ? "✅" : "❌"}</span>
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
                      <span>Created by: {getStaffName(r.createdBy)}</span>
                      <span>SW aware: {r.socialWorkerAware ? "Yes" : "No"}</span>
                      <span>Last reviewed: {r.lastReviewedDate}</span>
                    </div>
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
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child…" /></SelectTrigger><SelectContent><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select></div>
            <div><Label>Agreement Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(AGR_LABEL) as AgreementType[]).map((k) => (<SelectItem key={k} value={k}>{AGR_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Review Date</Label><Input type="date" /></div>
            <div><Label>Status</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(STATUS_LABEL) as AgreementStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Young Person&apos;s Views</Label><Textarea rows={2} placeholder="What did the young person say?" /></div>
            <div className="col-span-2"><Label>Rules (one per line)</Label><Textarea rows={4} placeholder="Enter each rule on a new line…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Agreement</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}