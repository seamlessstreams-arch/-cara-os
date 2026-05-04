"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type RestrictionType = "liberty" | "access" | "contact" | "technology" | "movement" | "medication" | "financial" | "dietary" | "other";
type RestrictionStatus = "active" | "under_review" | "ended" | "appealed";
type AuthorisedBy = "court_order" | "placing_authority" | "care_plan" | "risk_assessment" | "dols";

interface Review {
  date: string;
  reviewer: string;
  outcome: string;
  continued: boolean;
}

interface Restriction {
  id: string;
  youngPersonId: string;
  type: RestrictionType;
  description: string;
  reason: string;
  status: RestrictionStatus;
  authorisedBy: AuthorisedBy;
  authoriserName: string;
  startDate: string;
  endDate: string | null;
  reviewFrequency: string;
  reviews: Review[];
  childView: string;
  proportionality: string;
  leastRestrictive: string;
  impactAssessment: string;
  notifiedParties: string[];
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: Restriction[] = [
  {
    id: "r1", youngPersonId: "yp_jordan", type: "technology",
    description: "Snapchat account suspended and app removed from phone.",
    reason: "Following contact from unknown adult with grooming indicators. Police investigation ongoing. Temporary measure to protect Jordan while investigation progresses.",
    status: "active", authorisedBy: "risk_assessment", authoriserName: "Darren Laville (RM)",
    startDate: d(-7), endDate: null, reviewFrequency: "Weekly",
    reviews: [
      { date: d(-3), reviewer: "staff_darren", outcome: "Police investigation ongoing. Restriction continues. Jordan accepting. Will review again when police provide update.", continued: true },
    ],
    childView: "Jordan understands why Snapchat has been removed but is frustrated about it. Said 'I get it but it's not fair that I can't use it because of what someone else did.' Staff validated this feeling and reassured Jordan the restriction is temporary and will be lifted as soon as it's safe to do so.",
    proportionality: "Restriction is proportionate to the identified risk. Only Snapchat has been restricted — all other apps and internet access remain available. The restriction is the minimum necessary to protect Jordan from the specific identified risk.",
    leastRestrictive: "Considered blocking the specific account only, but Snapchat's architecture means the user could create new accounts. Full app suspension is the least restrictive option that effectively mitigates the risk.",
    impactAssessment: "Limited social impact — Jordan primarily uses WhatsApp for peer contact. Some frustration expressed but Jordan understands the rationale. Play therapy providing additional emotional support during this period.",
    notifiedParties: ["Social Worker (David Osei)", "Police (DI Singh)", "IRO (via social worker)"],
  },
  {
    id: "r2", youngPersonId: "yp_alex", type: "financial",
    description: "Xbox in-game purchases require staff PIN approval.",
    reason: "Alex spent £50 on in-game purchases without realising the cumulative cost. PIN control introduced to support financial awareness and prevent unplanned spending. This is a supportive measure, not a sanction.",
    status: "active", authorisedBy: "care_plan", authoriserName: "Anna Kowalski (Key Worker)",
    startDate: d(-45), endDate: null, reviewFrequency: "Monthly",
    reviews: [
      { date: d(-15), reviewer: "staff_anna", outcome: "Alex has not attempted any unplanned purchases. Engaging well with budgeting as part of independence skills. Restriction continues but with agreed pocket money allocation for gaming — Alex can request up to £10/month for V-Bucks.", continued: true },
    ],
    childView: "Alex initially found this annoying but now says 'I actually think it helps me not waste my money.' He has agreed to continue the PIN control voluntarily and sees it as a learning tool rather than a restriction. Positive reframing successful.",
    proportionality: "Minimal restriction — only affects in-app purchases, not gaming access. Alex can still play all games freely. The PIN is a supportive tool to develop financial literacy.",
    leastRestrictive: "This is the least restrictive option available. Alternatives considered: removing Xbox (disproportionate), blocking all internet on Xbox (too broad), verbal reminders only (previously unsuccessful). PIN control targets only the specific risk.",
    impactAssessment: "Positive impact on Alex's financial awareness. No negative impact on gaming enjoyment or social interaction. Alex has started tracking spending voluntarily.",
    notifiedParties: ["Social Worker (Sarah Hughes)"],
  },
  {
    id: "r3", youngPersonId: "yp_jordan", type: "movement",
    description: "Jordan to be accompanied by staff when visiting the town centre.",
    reason: "Following intelligence about county lines activity in the town centre area. Jordan identified as potentially vulnerable to exploitation. Accompanying measure is to ensure safety during this period of heightened risk.",
    status: "under_review", authorisedBy: "risk_assessment", authoriserName: "Darren Laville (RM)",
    startDate: d(-30), endDate: null, reviewFrequency: "Fortnightly",
    reviews: [
      { date: d(-16), reviewer: "staff_darren", outcome: "Police have confirmed ongoing county lines operation. Restriction continues. Jordan accompanied to town 3 times — no concerns. Jordan frustrated but accepting.", continued: true },
      { date: d(-2), reviewer: "staff_darren", outcome: "Police operation concluded. Reviewing whether restriction can be stepped down. Meeting with SW scheduled to discuss.", continued: true },
    ],
    childView: "Jordan finds this restriction difficult and says 'none of my friends have to have adults with them.' Staff have acknowledged this is frustrating and explained it's about safety, not trust. Jordan has been cooperative but this restriction is impacting their sense of independence.",
    proportionality: "Restriction is proportionate to the assessed risk of criminal exploitation. However, as the police operation concludes, proportionality needs re-assessment. Jordan's independence is being impacted.",
    leastRestrictive: "Alternatives considered: full town centre ban (too restrictive), curfew only (doesn't address daytime risk), GPS tracking (disproportionate and intrusive). Staff accompaniment allows Jordan to still access the community while being protected.",
    impactAssessment: "Some negative impact on Jordan's developing independence and peer relationships. Mitigated by staff being discreet (not 'hovering') and allowing Jordan space during outings. Restriction should be stepped down as soon as risk level permits.",
    notifiedParties: ["Social Worker (David Osei)", "Police (community safety team)", "IRO"],
  },
  {
    id: "r4", youngPersonId: "yp_casey", type: "contact",
    description: "No unsupervised contact with biological father (Mark Morgan).",
    reason: "Court-ordered restriction. Schedule 1 offender. Contact permitted supervised only at local authority contact centre. This is a legal requirement, not a home-imposed restriction.",
    status: "active", authorisedBy: "court_order", authoriserName: "Family Court — Order dated 2023-11-15",
    startDate: "2023-11-15", endDate: null, reviewFrequency: "Per court schedule (annually)",
    reviews: [
      { date: d(-90), reviewer: "staff_darren", outcome: "Court order remains in place. Contact continuing at LA contact centre monthly. Casey's views sought — Casey chooses to attend. No concerns raised by contact supervisor.", continued: true },
    ],
    childView: "Casey understands and accepts the contact arrangement. Has said 'I know why it has to be supervised and I'm okay with it. I still want to see my dad.' Casey's wishes are respected within the legal framework. Advocate involved in court reviews.",
    proportionality: "This is a court-ordered restriction and therefore legally mandated. The home implements it as directed. Contact still takes place — the restriction is on the supervision arrangement, not on contact itself.",
    leastRestrictive: "Court-mandated. The home does not have discretion to modify this restriction. Casey's right to family life is maintained through supervised contact.",
    impactAssessment: "Casey has adjusted well to the supervised arrangement. The restriction does not cause distress. Casey values the contact and the contact centre staff are known and trusted. No additional restrictions are imposed by the home beyond the court order.",
    notifiedParties: ["Social Worker (Jade Morris)", "IRO", "CAFCASS Guardian", "Casey's Advocate"],
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<RestrictionType, string> = {
  liberty: "Liberty", access: "Access", contact: "Contact", technology: "Technology",
  movement: "Movement", medication: "Medication", financial: "Financial", dietary: "Dietary", other: "Other",
};

const STATUS_META: Record<RestrictionStatus, { label: string; colour: string }> = {
  active:       { label: "Active",       colour: "bg-red-100 text-red-700" },
  under_review: { label: "Under Review", colour: "bg-amber-100 text-amber-700" },
  ended:        { label: "Ended",        colour: "bg-green-100 text-green-700" },
  appealed:     { label: "Appealed",     colour: "bg-purple-100 text-purple-700" },
};

const AUTH_LABELS: Record<AuthorisedBy, string> = {
  court_order: "Court Order", placing_authority: "Placing Authority",
  care_plan: "Care Plan", risk_assessment: "Risk Assessment", dols: "DoLS",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function RestrictionsLogPage() {
  const [data] = useState<Restriction[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((r) => r.status === "active").length,
    underReview: data.filter((r) => r.status === "under_review").length,
    ended: data.filter((r) => r.status === "ended").length,
    courtOrdered: data.filter((r) => r.authorisedBy === "court_order").length,
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    if (filterYP !== "all") list = list.filter((r) => r.youngPersonId === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.description.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type":   return TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type]);
        case "status": return Object.keys(STATUS_META).indexOf(a.status) - Object.keys(STATUS_META).indexOf(b.status);
        default:       return b.startDate.localeCompare(a.startDate);
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.map((r) => ({
    youngPerson: getYPName(r.youngPersonId),
    type: TYPE_LABELS[r.type],
    description: r.description,
    reason: r.reason,
    status: STATUS_META[r.status].label,
    authorisedBy: AUTH_LABELS[r.authorisedBy],
    authoriserName: r.authoriserName,
    startDate: r.startDate,
    endDate: r.endDate || "Ongoing",
    reviewFrequency: r.reviewFrequency,
    childView: r.childView,
    proportionality: r.proportionality,
    leastRestrictive: r.leastRestrictive,
    notifiedParties: r.notifiedParties.join("; "),
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",    accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Type",            accessor: (r: typeof exportData[number]) => r.type },
    { header: "Description",     accessor: (r: typeof exportData[number]) => r.description },
    { header: "Reason",          accessor: (r: typeof exportData[number]) => r.reason },
    { header: "Status",          accessor: (r: typeof exportData[number]) => r.status },
    { header: "Authorised By",   accessor: (r: typeof exportData[number]) => r.authorisedBy },
    { header: "Authoriser",      accessor: (r: typeof exportData[number]) => r.authoriserName },
    { header: "Start Date",      accessor: (r: typeof exportData[number]) => r.startDate },
    { header: "End Date",        accessor: (r: typeof exportData[number]) => r.endDate },
    { header: "Review Frequency",accessor: (r: typeof exportData[number]) => r.reviewFrequency },
    { header: "Child View",      accessor: (r: typeof exportData[number]) => r.childView },
    { header: "Proportionality", accessor: (r: typeof exportData[number]) => r.proportionality },
    { header: "Least Restrictive",accessor: (r: typeof exportData[number]) => r.leastRestrictive },
    { header: "Notified Parties",accessor: (r: typeof exportData[number]) => r.notifiedParties },
  ];

  const ypIds = [...new Set(data.map((r) => r.youngPersonId))];

  return (
    <PageShell
      title="Restrictions Log"
      subtitle="Reg 20 — restrictions on liberty, movement, contact and access with proportionality review"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="restrictions-log" />
          <PrintButton title="Restrictions Log" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Log Restriction
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total",        v: stats.total, icon: Lock, c: "text-blue-600" },
            { l: "Active",       v: stats.active, icon: ShieldAlert, c: "text-red-600" },
            { l: "Under Review", v: stats.underReview, icon: Clock, c: "text-amber-600" },
            { l: "Ended",        v: stats.ended, icon: CheckCircle2, c: "text-green-600" },
            { l: "Court Ordered",v: stats.courtOrdered, icon: Lock, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.active > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800"><strong>{stats.active} active restriction{stats.active > 1 ? "s" : ""}</strong> — each must be regularly reviewed for proportionality and necessity.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search restrictions…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
              <option value="date">Start Date</option>
              <option value="type">Type</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {filtered.map((restriction) => (
          <div key={restriction.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === restriction.id ? null : restriction.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-red-500" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{getYPName(restriction.youngPersonId)}</h3>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{TYPE_LABELS[restriction.type]}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[restriction.status].colour)}>{STATUS_META[restriction.status].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{restriction.description} · Since {restriction.startDate}</p>
                </div>
              </div>
              {expanded === restriction.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === restriction.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Authorised By:</span> {AUTH_LABELS[restriction.authorisedBy]}</div>
                  <div><span className="text-muted-foreground">Authoriser:</span> {restriction.authoriserName}</div>
                  <div><span className="text-muted-foreground">Review Frequency:</span> {restriction.reviewFrequency}</div>
                  <div><span className="text-muted-foreground">End Date:</span> {restriction.endDate || "Ongoing"}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Reason for Restriction</h4>
                  <p className="text-sm text-muted-foreground">{restriction.reason}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Proportionality Assessment</h4>
                    <p className="text-sm text-blue-900">{restriction.proportionality}</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-1">Least Restrictive Option</h4>
                    <p className="text-sm text-green-900">{restriction.leastRestrictive}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 p-3">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">Impact Assessment</h4>
                  <p className="text-sm text-amber-900">{restriction.impactAssessment}</p>
                </div>

                <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s View</h4>
                  <p className="text-sm text-pink-900">{restriction.childView}</p>
                </div>

                {restriction.reviews.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Reviews</h4>
                    <div className="space-y-2">
                      {restriction.reviews.map((rv, i) => (
                        <div key={i} className="rounded border p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{rv.date} — {getStaffName(rv.reviewer)}</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", rv.continued ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>{rv.continued ? "Continued" : "Ended"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{rv.outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Notified Parties</h4>
                  <div className="flex flex-wrap gap-1">{restriction.notifiedParties.map((p, i) => <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs">{p}</span>)}</div>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 20 — Restraint and deprivation of liberty</strong> — Any restriction on a child&apos;s liberty must be necessary, proportionate, and the least restrictive option. Restrictions must be regularly reviewed, the child&apos;s views sought, and appropriate parties notified. All restrictions must be recorded and justified.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Restriction</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm"><option value="">Young Person…</option>{ypIds.map((id) => <option key={id} value={id}>{getYPName(id)}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Restriction type…</option>{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input placeholder="Description" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Reason for restriction" rows={3} className="rounded border px-3 py-2 text-sm" />
            <select className="rounded border px-3 py-2 text-sm"><option value="">Authorised by…</option>{Object.entries(AUTH_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input placeholder="Authoriser name" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Proportionality assessment" rows={2} className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Child's view" rows={2} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Log Restriction</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
