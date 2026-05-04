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

type IncidentCategory = "cyberbullying" | "inappropriate_content" | "contact_risk" | "sharing_images" | "gaming_risk" | "social_media" | "radicalisation" | "financial_scam" | "data_privacy" | "excessive_use";
type Severity = "low" | "medium" | "high" | "critical";
type IncidentStatus = "open" | "monitoring" | "resolved" | "escalated";

interface OnlineIncident {
  id: string;
  youngPersonId: string;
  date: string;
  category: IncidentCategory;
  severity: Severity;
  status: IncidentStatus;
  platform: string;
  summary: string;
  detail: string;
  discoveredBy: string;
  actionsToken: string[];
  safeguardingReferral: boolean;
  parentCarerNotified: boolean;
  childDiscussion: string;
  followUp: string;
}

interface OnlineAgreement {
  youngPersonId: string;
  agreementDate: string;
  reviewDate: string;
  devices: string[];
  allowedPlatforms: string[];
  restrictions: string[];
  wifiCurfew: string;
  parentalControls: string;
  childSignature: boolean;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const INCIDENTS: OnlineIncident[] = [
  {
    id: "os1", youngPersonId: "yp_alex", date: d(-14),
    category: "cyberbullying", severity: "medium", status: "resolved",
    platform: "Instagram",
    summary: "Alex received abusive messages from a peer at college via Instagram DMs.",
    detail: "Alex showed staff a series of messages received over 3 days from a college peer making derogatory comments about Alex being in care. Messages included phrases like 'nobody wants you' and 'care kid'. Alex was visibly upset. Staff screenshotted messages with Alex's consent and blocked the account together.",
    discoveredBy: "staff_anna",
    actionsToken: [
      "Screenshots taken and saved to safeguarding file",
      "Account blocked together with Alex",
      "College safeguarding lead notified — Ref: CSL-2025-034",
      "Key work session focused on Alex's feelings and coping strategies",
      "CEOP reporting discussed with Alex — declined to report",
      "College confirmed disciplinary action against perpetrator",
    ],
    safeguardingReferral: false,
    parentCarerNotified: true,
    childDiscussion: "Alex was upset but handled it well. He said 'it's happened before and it really gets to me but I know it's not true.' Staff validated his feelings and reinforced that being in care is nothing to be ashamed of. Alex agreed to tell staff if it happens again rather than keeping it to himself.",
    followUp: "College resolved matter. Alex reports no further contact from perpetrator. Key work session reviewed online safety strategies. Alex demonstrated good understanding of blocking, reporting, and telling a trusted adult.",
  },
  {
    id: "os2", youngPersonId: "yp_jordan", date: d(-7),
    category: "contact_risk", severity: "high", status: "monitoring",
    platform: "Snapchat",
    summary: "Unknown adult contacted Jordan via Snapchat — possible grooming indicators.",
    detail: "During a routine key work session, Jordan mentioned a 'new friend' on Snapchat who had been sending messages for about a week. When staff explored this sensitively, it emerged the contact was an adult male (claimed age 19) who Jordan had never met in person. The individual had asked Jordan not to tell staff about their conversations and had requested a photo. Jordan had not sent a photo.",
    discoveredBy: "staff_ryan",
    actionsToken: [
      "Immediate safeguarding response — concern form completed",
      "Screenshots taken with Jordan's agreement",
      "Account blocked and reported to Snapchat",
      "CEOP report submitted — Ref: CEOP-2025-UK-88412",
      "Social worker informed immediately",
      "Police contacted via 101 — crime reference obtained: MC-2025-5567",
      "Jordan's online agreement updated — Snapchat temporarily suspended",
      "Additional key work sessions on grooming awareness",
    ],
    safeguardingReferral: true,
    parentCarerNotified: false,
    childDiscussion: "Jordan was initially defensive about the contact but when staff calmly explained the grooming indicators, Jordan became upset and said 'I thought he was just being nice.' Staff reassured Jordan that they did the right thing by mentioning it, and that adults who ask children to keep secrets are not safe. Jordan agreed to the temporary Snapchat suspension and additional support.",
    followUp: "Police investigating. CEOP report acknowledged. Ongoing monitoring. Jordan engaging well with online safety key work sessions. Play therapist informed to support processing. Snapchat remains suspended pending police guidance.",
  },
  {
    id: "os3", youngPersonId: "yp_casey", date: d(-21),
    category: "excessive_use", severity: "low", status: "resolved",
    platform: "TikTok / YouTube",
    summary: "Casey spending excessive time on phone late at night — affecting sleep and college attendance.",
    detail: "Night staff noticed Casey's room light on past 1am for 4 consecutive nights. Morning staff reported Casey being very tired and late for college twice. In discussion, Casey admitted spending 4-5 hours per night on TikTok and YouTube, saying 'I can't sleep so I just watch stuff.' Screen time data confirmed 5.2 hours average nightly use.",
    discoveredBy: "staff_diane",
    actionsToken: [
      "Open conversation with Casey about sleep hygiene and screen time",
      "Reviewed wifi curfew — agreed to voluntary phone-in at 10:30pm",
      "Casey chose to set own screen time limits via phone settings",
      "Sleep hygiene tips discussed and printed for Casey's room",
      "Counsellor informed — explored anxiety as underlying cause",
    ],
    safeguardingReferral: false,
    parentCarerNotified: false,
    childDiscussion: "Casey was honest about the issue and acknowledged it was affecting college. Said 'I know it's bad but when I try to sleep I just think about stuff and the phone distracts me.' Staff explored this gently — Casey identified anxiety about leaving care as the underlying issue. Casey agreed to voluntary phone-in as a temporary measure and set own screen time limits. Framed as self-care, not punishment.",
    followUp: "Casey has been handing phone in voluntarily at 10:30pm for 2 weeks. Sleep has improved. College attendance back to 100%. Counsellor exploring the anxiety component. Casey plans to gradually self-manage without phone-in once sleep pattern is established.",
  },
  {
    id: "os4", youngPersonId: "yp_alex", date: d(-45),
    category: "gaming_risk", severity: "low", status: "resolved",
    platform: "Fortnite / Xbox Live",
    summary: "Alex spent pocket money on in-game purchases without realising cumulative cost.",
    detail: "Alex used birthday money (£30) plus additional pocket money (£20) on V-Bucks in Fortnite over a 2-week period. While not a safeguarding concern, this highlighted a financial literacy gap. Alex was not aware of the total spent until staff reviewed with him.",
    discoveredBy: "staff_edward",
    actionsToken: [
      "Discussed in-game purchase mechanics and real-money costs",
      "Set up purchase approval on Xbox account — requires PIN",
      "Added to independence skills: budgeting and online spending",
      "No further purchases since intervention",
    ],
    safeguardingReferral: false,
    parentCarerNotified: false,
    childDiscussion: "Alex was surprised at the total when it was added up. He said 'it didn't feel like real money.' Staff used this as a positive learning opportunity about online spending. Alex agreed to the PIN control and said it would help him think before buying. Good engagement — no distress.",
    followUp: "No further unplanned purchases. Alex now asks staff before making any online purchase and has started tracking his spending as part of independence skills work.",
  },
];

const AGREEMENTS: OnlineAgreement[] = [
  {
    youngPersonId: "yp_alex", agreementDate: d(-60), reviewDate: d(30),
    devices: ["Personal smartphone (Samsung)", "Shared Xbox (lounge)", "College laptop"],
    allowedPlatforms: ["Instagram", "YouTube", "Snapchat", "WhatsApp", "Spotify", "Fortnite"],
    restrictions: ["No TikTok (Alex's choice — finds it distracting)", "Xbox purchase PIN required", "No sharing of home address or location"],
    wifiCurfew: "Wi-Fi off at 11:00pm, on at 6:30am",
    parentalControls: "Age-appropriate content filter on home WiFi. Xbox parental controls set to 16+. College laptop managed by IT.",
    childSignature: true,
  },
  {
    youngPersonId: "yp_jordan", agreementDate: d(-7), reviewDate: d(23),
    devices: ["Personal smartphone (iPhone SE)", "Shared tablet (home)", "School Chromebook"],
    allowedPlatforms: ["YouTube (supervised)", "Roblox", "WhatsApp (family group only)"],
    restrictions: ["Snapchat suspended pending police investigation", "No social media accounts without staff knowledge", "Phone checked-in overnight (Jordan's agreement)", "No voice chat with strangers in games"],
    wifiCurfew: "Wi-Fi off at 10:00pm, on at 7:00am",
    parentalControls: "Full parental controls on all devices. SafeSearch enforced. App installation requires staff approval. Location sharing on for safety.",
    childSignature: true,
  },
  {
    youngPersonId: "yp_casey", agreementDate: d(-30), reviewDate: d(60),
    devices: ["Personal smartphone (iPhone 13)", "Personal laptop", "College laptop"],
    allowedPlatforms: ["Instagram", "TikTok", "YouTube", "Snapchat", "WhatsApp", "Spotify", "Netflix"],
    restrictions: ["Voluntary phone-in at 10:30pm (temporary)", "No sharing personal information with online contacts", "Age-appropriate content only"],
    wifiCurfew: "Voluntary — Casey self-manages (reviewed monthly)",
    parentalControls: "Minimal — age 16+, Gillick competent. Casey manages own settings. Home WiFi content filter active. Staff available for guidance.",
    childSignature: true,
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const CAT_LABELS: Record<IncidentCategory, string> = {
  cyberbullying: "Cyberbullying", inappropriate_content: "Inappropriate Content",
  contact_risk: "Contact Risk / Grooming", sharing_images: "Sharing Images",
  gaming_risk: "Gaming Risk", social_media: "Social Media Concern",
  radicalisation: "Radicalisation", financial_scam: "Financial Scam",
  data_privacy: "Data / Privacy", excessive_use: "Excessive Use",
};

const SEV_META: Record<Severity, { label: string; colour: string }> = {
  low: { label: "Low", colour: "bg-green-100 text-green-700" },
  medium: { label: "Medium", colour: "bg-amber-100 text-amber-700" },
  high: { label: "High", colour: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", colour: "bg-red-100 text-red-700" },
};

const STATUS_META: Record<IncidentStatus, { label: string; colour: string }> = {
  open: { label: "Open", colour: "bg-blue-100 text-blue-700" },
  monitoring: { label: "Monitoring", colour: "bg-amber-100 text-amber-700" },
  resolved: { label: "Resolved", colour: "bg-green-100 text-green-700" },
  escalated: { label: "Escalated", colour: "bg-red-100 text-red-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function OnlineSafetyPage() {
  const [data] = useState<OnlineIncident[]>(INCIDENTS);
  const [agreements] = useState<OnlineAgreement[]>(AGREEMENTS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);
  const [view, setView] = useState<"incidents" | "agreements">("incidents");

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((i) => i.status === "open" || i.status === "monitoring").length,
    safeguarding: data.filter((i) => i.safeguardingReferral).length,
    resolved: data.filter((i) => i.status === "resolved").length,
    highSev: data.filter((i) => i.severity === "high" || i.severity === "critical").length,
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterCat !== "all") list = list.filter((i) => i.category === filterCat);
    if (filterYP !== "all") list = list.filter((i) => i.youngPersonId === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.summary.toLowerCase().includes(q) || i.platform.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "severity": return Object.keys(SEV_META).indexOf(b.severity) - Object.keys(SEV_META).indexOf(a.severity);
        case "category": return CAT_LABELS[a.category].localeCompare(CAT_LABELS[b.category]);
        default:         return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [data, filterCat, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.map((i) => ({
    youngPerson: getYPName(i.youngPersonId),
    date: i.date,
    category: CAT_LABELS[i.category],
    severity: SEV_META[i.severity].label,
    status: STATUS_META[i.status].label,
    platform: i.platform,
    summary: i.summary,
    discoveredBy: getStaffName(i.discoveredBy),
    safeguardingReferral: i.safeguardingReferral ? "Yes" : "No",
    actions: i.actionsToken.join("; "),
    childDiscussion: i.childDiscussion,
    followUp: i.followUp,
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

  const ypIds = [...new Set(data.map((i) => i.youngPersonId))];

  return (
    <PageShell
      title="Online Safety"
      subtitle="Digital safeguarding — incidents, agreements and monitoring"
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
                  {Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
                        <h3 className="font-semibold">{getYPName(incident.youngPersonId)}</h3>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[incident.status].colour)}>{STATUS_META[incident.status].label}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SEV_META[incident.severity].colour)}>{SEV_META[incident.severity].label}</span>
                        {incident.safeguardingReferral && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Safeguarding</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{CAT_LABELS[incident.category]} · {incident.platform} · {incident.date}</p>
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
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">{incident.actionsToken.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Discovered By:</span> {getStaffName(incident.discoveredBy)}</div>
                      <div><span className="text-muted-foreground">Safeguarding Referral:</span> {incident.safeguardingReferral ? <span className="text-red-600 font-medium">Yes</span> : "No"}</div>
                      <div><span className="text-muted-foreground">Parent/Carer Notified:</span> {incident.parentCarerNotified ? "Yes" : "No"}</div>
                    </div>

                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-sm font-semibold text-pink-800 mb-1">Discussion with Child</h4>
                      <p className="text-sm text-pink-900">{incident.childDiscussion}</p>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">Follow Up</h4>
                      <p className="text-sm text-blue-900">{incident.followUp}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {view === "agreements" && (
          <div className="space-y-4">
            {agreements.map((ag) => (
              <div key={ag.youngPersonId} className="rounded-lg border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-brand" />
                    <h3 className="font-semibold">{getYPName(ag.youngPersonId)}</h3>
                    {ag.childSignature && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Signed</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">Review: {ag.reviewDate}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Devices</h4>
                    <ul className="list-disc list-inside text-sm">{ag.devices.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Allowed Platforms</h4>
                    <div className="flex flex-wrap gap-1">{ag.allowedPlatforms.map((p, i) => <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{p}</span>)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Restrictions</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">{ag.restrictions.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Wi-Fi Curfew:</span> {ag.wifiCurfew}</div>
                  <div><span className="text-muted-foreground">Parental Controls:</span> {ag.parentalControls}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Keeping Children Safe in Education / Reg 12</strong> — Children&apos;s homes must protect children from online harms including grooming, cyberbullying, and inappropriate content. Individual online agreements should reflect each child&apos;s age, understanding, and risk profile. Incidents must be recorded and responded to proportionately.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Online Safety Incident</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm"><option value="">Young Person…</option>{ypIds.map((id) => <option key={id} value={id}>{getYPName(id)}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Category…</option>{Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Severity…</option>{Object.entries(SEV_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            <input placeholder="Platform (e.g. Instagram, Snapchat)" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Summary" rows={2} className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Full detail" rows={3} className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Actions taken" rows={2} className="rounded border px-3 py-2 text-sm" />
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" className="rounded border" /> Safeguarding referral</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" className="rounded border" /> Parent/carer notified</label>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Log Incident</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
