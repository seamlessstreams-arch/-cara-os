"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Megaphone,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
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

type AdvocacyType = "independent" | "issue_based" | "peer" | "legal" | "complaints";
type AdvocacyStatus = "active" | "completed" | "pending_referral" | "declined_by_yp";

interface Visit {
  date: string;
  type: "face_to_face" | "phone" | "virtual";
  summary: string;
  private: boolean;
  actionsRaised: string[];
}

interface AdvocacyRecord {
  id: string;
  youngPersonId: string;
  type: AdvocacyType;
  status: AdvocacyStatus;
  provider: string;
  advocateName: string;
  referralDate: string;
  startDate: string | null;
  reason: string;
  issuesRaised: string[];
  visits: Visit[];
  childView: string;
  homeResponse: string;
  reviewDate: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: AdvocacyRecord[] = [
  {
    id: "adv1", youngPersonId: "yp_alex", type: "independent",
    status: "active", provider: "National Youth Advocacy Service (NYAS)",
    advocateName: "Marcus Brown", referralDate: d(-120), startDate: d(-110),
    reason: "Alex requested an advocate to help express his views at LAC reviews. He felt his opinions were not always heard and wanted independent support.",
    issuesRaised: [
      "Contact with mother — Alex wanted more frequent contact than SW was arranging",
      "Education — Alex felt he should have input into college course choices",
      "Bedroom decoration — Alex wanted to personalise his room more",
    ],
    visits: [
      { date: d(-14), type: "face_to_face", summary: "Marcus visited Alex at Oak House. They discussed Alex's preparation for the upcoming LAC review. Alex identified three key things he wanted to raise: more contact with mum, his progress at college, and wanting to learn to drive. Marcus helped Alex write bullet points for the review.", private: true, actionsRaised: ["Advocate to attend LAC review and support Alex's contributions"] },
      { date: d(-45), type: "phone", summary: "Phone call check-in. Alex confirmed he is happy with how the bedroom decoration issue was resolved. Still wants more contact with mum. Marcus acknowledged and will raise at next review.", private: true, actionsRaised: [] },
      { date: d(-90), type: "face_to_face", summary: "Initial meeting. Built rapport with Alex. Discussed role of advocate — independent, confidential, Alex-led. Alex identified bedroom decoration as first issue. Marcus noted contact concerns for future discussion.", private: true, actionsRaised: ["Home to support Alex in choosing room decoration within budget"] },
    ],
    childView: "I like having Marcus. He listens to me properly and helps me say what I want to say in meetings. I feel like people take me more seriously when Marcus is there.",
    homeResponse: "The home fully supports Alex's advocacy relationship. Bedroom decoration was addressed within two weeks of the issue being raised — Alex chose paint colours and posters. Contact issue has been escalated via SW. The home ensures Marcus has private space to meet with Alex.",
    reviewDate: d(30),
    notes: "Positive advocacy relationship. Alex is more confident in meetings since Marcus started attending. The home provides a private room for visits and ensures Alex has full access to his advocate.",
  },
  {
    id: "adv2", youngPersonId: "yp_jordan", type: "issue_based",
    status: "active", provider: "Coram Voice",
    advocateName: "Priya Sharma", referralDate: d(-30), startDate: d(-21),
    reason: "Jordan referred by RM following the online safety incident and subsequent Snapchat restriction. Jordan expressed frustration about the restriction and wanted independent support to understand their rights and ensure the restriction was fair.",
    issuesRaised: [
      "Snapchat restriction — Jordan wanted to understand if this was proportionate",
      "Right to privacy online — Jordan felt staff were being too controlling",
      "Wanting to understand the police process and what happens next",
    ],
    visits: [
      { date: d(-7), type: "face_to_face", summary: "Priya met with Jordan privately. Explained the role of advocacy and that she was independent from the home. Jordan was initially reserved but opened up about feeling frustrated. Priya explained Jordan's right to challenge decisions and that she would review the restriction with Jordan.", private: true, actionsRaised: ["Advocate to review restriction documentation and proportionality assessment with Jordan"] },
      { date: d(-3), type: "face_to_face", summary: "Follow-up visit. Priya reviewed the restriction log with Jordan (with Jordan's consent). Priya explained that the restriction appeared proportionate given the police investigation but helped Jordan identify questions to ask about when it would be reviewed and lifted. Jordan felt more empowered.", private: true, actionsRaised: ["Jordan to ask RM directly about restriction review date — advocate will support if needed"] },
    ],
    childView: "Priya explained things to me in a way I understand. I still don't like not having Snapchat but I understand why now. She said I can ask questions and that's my right.",
    homeResponse: "The home welcomes Jordan having advocacy support. The restriction was already regularly reviewed and documented. The advocate's involvement has helped Jordan feel heard and understand the process. Staff are cooperating fully with Priya's visits.",
    reviewDate: d(14),
    notes: "Issue-based advocacy related to a specific concern. Priya's involvement has reduced Jordan's frustration and improved Jordan's understanding of the process. The home views this as positive.",
  },
  {
    id: "adv3", youngPersonId: "yp_casey", type: "legal",
    status: "active", provider: "Coram Children's Legal Centre",
    advocateName: "Helen Watts (Solicitor)", referralDate: d(-60), startDate: d(-50),
    reason: "Casey approaching 18 and has questions about leaving care entitlements, housing rights, and the local authority's legal obligations. Casey wants independent legal advice to ensure they receive everything they are entitled to.",
    issuesRaised: [
      "Leaving care grant amount and what it should cover",
      "Local authority duty to provide suitable accommodation",
      "Right to PA support until age 25",
      "Education funding entitlements post-18",
    ],
    visits: [
      { date: d(-10), type: "virtual", summary: "Helen provided Casey with a clear summary of leaving care rights under the Children (Leaving Care) Act 2000 and subsequent amendments. Covered: setting up home allowance, education bursary, PA support duration, and the LA's duty to assess needs. Casey asked excellent questions.", private: true, actionsRaised: ["Helen to write to LA requesting confirmation of Casey's leaving care financial package"] },
      { date: d(-40), type: "face_to_face", summary: "Initial consultation. Helen assessed Casey's situation and confirmed Casey is eligible for full leaving care support. Discussed timeline and what Casey should expect from the LA. Casey felt reassured.", private: true, actionsRaised: ["Casey to request a copy of their Pathway Plan from SW"] },
    ],
    childView: "Helen knows the law inside out. I didn't know I was entitled to so much. I feel much more confident about leaving care now because I know my rights. If the council doesn't give me what I'm entitled to, I know I can challenge it.",
    homeResponse: "The home fully supports Casey's access to legal advocacy. Key worker has supported Casey in understanding the advice provided. The home is working with Casey's PA to ensure all entitlements are claimed. This advocacy has been empowering for Casey.",
    reviewDate: d(20),
    notes: "Legal advocacy supporting Casey's transition to independence. Helen's involvement has clarified entitlements and given Casey confidence. The home is ensuring all information is shared with Casey's PA for follow-through.",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<AdvocacyType, string> = {
  independent: "Independent Advocacy", issue_based: "Issue-Based Advocacy",
  peer: "Peer Advocacy", legal: "Legal Advocacy", complaints: "Complaints Advocacy",
};

const STATUS_META: Record<AdvocacyStatus, { label: string; colour: string }> = {
  active:          { label: "Active",      colour: "bg-green-100 text-green-700" },
  completed:       { label: "Completed",   colour: "bg-gray-100 text-gray-700" },
  pending_referral:{ label: "Pending",     colour: "bg-amber-100 text-amber-700" },
  declined_by_yp:  { label: "Declined",    colour: "bg-red-100 text-red-700" },
};

const VISIT_LABELS: Record<string, string> = {
  face_to_face: "Face to Face", phone: "Phone", virtual: "Virtual",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function AdvocacyPage() {
  const [data] = useState<AdvocacyRecord[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((r) => r.status === "active").length,
    visits: data.reduce((s, r) => s + r.visits.length, 0),
    issuesRaised: data.reduce((s, r) => s + r.issuesRaised.length, 0),
    ypWithAdvocacy: new Set(data.filter((r) => r.status === "active").map((r) => r.youngPersonId)).size,
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    if (filterYP !== "all") list = list.filter((r) => r.youngPersonId === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.advocateName.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type": return TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type]);
        case "yp":   return a.youngPersonId.localeCompare(b.youngPersonId);
        default:     return b.referralDate.localeCompare(a.referralDate);
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.map((r) => ({
    youngPerson: getYPName(r.youngPersonId),
    type: TYPE_LABELS[r.type],
    status: STATUS_META[r.status].label,
    provider: r.provider,
    advocate: r.advocateName,
    referralDate: r.referralDate,
    startDate: r.startDate || "Pending",
    reason: r.reason,
    issuesRaised: r.issuesRaised.join("; "),
    visits: r.visits.length,
    childView: r.childView,
    homeResponse: r.homeResponse,
    reviewDate: r.reviewDate,
    notes: r.notes,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",  accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Type",          accessor: (r: typeof exportData[number]) => r.type },
    { header: "Status",        accessor: (r: typeof exportData[number]) => r.status },
    { header: "Provider",      accessor: (r: typeof exportData[number]) => r.provider },
    { header: "Advocate",      accessor: (r: typeof exportData[number]) => r.advocate },
    { header: "Referral Date", accessor: (r: typeof exportData[number]) => r.referralDate },
    { header: "Start Date",    accessor: (r: typeof exportData[number]) => r.startDate },
    { header: "Reason",        accessor: (r: typeof exportData[number]) => r.reason },
    { header: "Issues Raised", accessor: (r: typeof exportData[number]) => r.issuesRaised },
    { header: "Visits",        accessor: (r: typeof exportData[number]) => String(r.visits) },
    { header: "Child View",    accessor: (r: typeof exportData[number]) => r.childView },
    { header: "Home Response", accessor: (r: typeof exportData[number]) => r.homeResponse },
    { header: "Review Date",   accessor: (r: typeof exportData[number]) => r.reviewDate },
    { header: "Notes",         accessor: (r: typeof exportData[number]) => r.notes },
  ];

  const ypIds = [...new Set(data.map((r) => r.youngPersonId))];

  return (
    <PageShell
      title="Advocacy Tracker"
      subtitle="Reg 7 — Independent advocacy, children's rights and representation"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="advocacy" />
          <PrintButton title="Advocacy Tracker" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Referral
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Referrals", v: stats.total, icon: Megaphone, c: "text-blue-600" },
            { l: "Active",          v: stats.active, icon: CheckCircle2, c: "text-green-600" },
            { l: "YP with Advocacy",v: stats.ypWithAdvocacy, icon: Megaphone, c: "text-purple-600" },
            { l: "Total Visits",    v: stats.visits, icon: Clock, c: "text-amber-600" },
            { l: "Issues Raised",   v: stats.issuesRaised, icon: AlertTriangle, c: "text-red-600" },
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search advocacy…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
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
              <option value="date">Referral Date</option>
              <option value="type">Type</option>
              <option value="yp">Young Person</option>
            </select>
          </div>
        </div>

        {filtered.map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{getYPName(rec.youngPersonId)}</h3>
                    <span className="text-sm text-muted-foreground">— {TYPE_LABELS[rec.type]}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[rec.status].colour)}>{STATUS_META[rec.status].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.advocateName} · {rec.provider} · {rec.visits.length} visits</p>
                </div>
              </div>
              {expanded === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === rec.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Referred:</span> {rec.referralDate}</div>
                  <div><span className="text-muted-foreground">Started:</span> {rec.startDate || "Pending"}</div>
                  <div><span className="text-muted-foreground">Review:</span> {rec.reviewDate}</div>
                  <div><span className="text-muted-foreground">Provider:</span> {rec.provider}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Reason for Advocacy</h4>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">Issues Raised</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">{rec.issuesRaised.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
                </div>

                {rec.visits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Visits</h4>
                    <div className="space-y-3">
                      {rec.visits.map((v, i) => (
                        <div key={i} className="rounded border p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{v.date}</span>
                              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{VISIT_LABELS[v.type]}</span>
                              {v.private && <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Private</span>}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{v.summary}</p>
                          {v.actionsRaised.length > 0 && (
                            <div className="mt-2 rounded bg-blue-50 p-2">
                              <p className="text-xs font-semibold text-blue-800 mb-1">Actions</p>
                              <ul className="list-disc list-inside text-xs text-blue-900">{v.actionsRaised.map((a, j) => <li key={j}>{a}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s View</h4>
                  <p className="text-sm text-pink-900 italic">&ldquo;{rec.childView}&rdquo;</p>
                </div>

                <div className="rounded-lg bg-green-50 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Home Response</h4>
                  <p className="text-sm text-green-900">{rec.homeResponse}</p>
                </div>

                {rec.notes && (
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <h4 className="text-sm font-semibold mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">{rec.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 7 — Children&apos;s Guide / Advocacy</strong> — Every child must be informed of their right to advocacy and supported to access it. Advocates must be able to visit privately and the home must cooperate fully with advocacy services. Children should feel empowered to raise issues through their advocate.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Advocacy Referral</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm"><option value="">Young Person…</option>{ypIds.map((id) => <option key={id} value={id}>{getYPName(id)}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Advocacy type…</option>{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input placeholder="Provider organisation" className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Advocate name" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Reason for referral" rows={3} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Submit Referral</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
