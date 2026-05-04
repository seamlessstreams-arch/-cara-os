"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
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

type ContactType = "face_to_face" | "video_call" | "phone_call" | "letterbox" | "supervised_community" | "supervised_centre";
type SupervisionLevel = "supervised" | "supported" | "monitored" | "unsupervised";
type ContactOutcome = "positive" | "mixed" | "concerning" | "did_not_attend" | "cancelled_by_family" | "cancelled_by_sw";
type ContactPerson = "birth_mother" | "birth_father" | "sibling" | "grandparent" | "extended_family" | "other";

interface ContactSession {
  id: string;
  youngPersonId: string;
  date: string;
  startTime: string;
  endTime: string;
  contactType: ContactType;
  supervisionLevel: SupervisionLevel;
  contactPerson: ContactPerson;
  contactPersonName: string;
  venue: string;
  supervisingStaff: string;
  outcome: ContactOutcome;
  childPresentationBefore: string;
  childPresentationDuring: string;
  childPresentationAfter: string;
  interactionQuality: string;
  concerns: string[];
  positives: string[];
  safeguardingConcerns: boolean;
  safeguardingDetails: string;
  childViews: string;
  giftsBrought: string;
  agreementBreaches: string[];
  courtOrderRef: string;
  nextContactDate: string;
  socialWorkerNotified: boolean;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABELS: Record<ContactType, string> = {
  face_to_face: "Face to Face", video_call: "Video Call", phone_call: "Phone Call",
  letterbox: "Letterbox", supervised_community: "Supervised (Community)",
  supervised_centre: "Supervised (Contact Centre)",
};

const LEVEL_LABELS: Record<SupervisionLevel, string> = {
  supervised: "Supervised", supported: "Supported", monitored: "Monitored", unsupervised: "Unsupervised",
};

const OUTCOME_LABELS: Record<ContactOutcome, string> = {
  positive: "Positive", mixed: "Mixed", concerning: "Concerning",
  did_not_attend: "Did Not Attend", cancelled_by_family: "Cancelled (Family)",
  cancelled_by_sw: "Cancelled (SW)",
};
const OUTCOME_COLOURS: Record<ContactOutcome, string> = {
  positive: "bg-green-100 text-green-800", mixed: "bg-amber-100 text-amber-800",
  concerning: "bg-red-100 text-red-800", did_not_attend: "bg-gray-100 text-gray-700",
  cancelled_by_family: "bg-orange-100 text-orange-800", cancelled_by_sw: "bg-purple-100 text-purple-800",
};

const PERSON_LABELS: Record<ContactPerson, string> = {
  birth_mother: "Birth Mother", birth_father: "Birth Father", sibling: "Sibling",
  grandparent: "Grandparent", extended_family: "Extended Family", other: "Other",
};

const LEVEL_COLOURS: Record<SupervisionLevel, string> = {
  supervised: "bg-red-100 text-red-800", supported: "bg-amber-100 text-amber-800",
  monitored: "bg-blue-100 text-blue-800", unsupervised: "bg-green-100 text-green-800",
};

const SEED: ContactSession[] = [
  {
    id: "cs1", youngPersonId: "yp_alex", date: d(-3), startTime: "14:00", endTime: "15:30",
    contactType: "supervised_centre", supervisionLevel: "supervised",
    contactPerson: "birth_mother", contactPersonName: "Michelle Thompson",
    venue: "Stockport Family Contact Centre", supervisingStaff: "staff_anna",
    outcome: "positive",
    childPresentationBefore: "Alex was slightly anxious in the car but settled after listening to music. Asked if mum would definitely be there.",
    childPresentationDuring: "Relaxed after initial 5 minutes. Showed mum photos on phone. Talked about college. Good eye contact and physical proximity. Mum initiated hug — Alex reciprocated warmly.",
    childPresentationAfter: "Quiet on the way home but not distressed. Said 'that was alright' — positive for Alex. Ate dinner well and had a good evening.",
    interactionQuality: "Warm and natural interaction. Michelle was well-prepared with college-related questions. Conversation flowed. No tension observed.",
    concerns: [],
    positives: ["Mum arrived on time and was well-presented", "Age-appropriate conversation topics", "Alex initiated sharing photos", "Comfortable physical affection"],
    safeguardingConcerns: false, safeguardingDetails: "",
    childViews: "Alex said it was 'good to see mum — she seems better.' Wants to continue fortnightly contact. Asked if they could go to McDonald's next time instead of the centre.",
    giftsBrought: "Michelle brought a birthday card (early) and £20 — agreed in contact plan.",
    agreementBreaches: [],
    courtOrderRef: "FP-2024-8834", nextContactDate: d(11), socialWorkerNotified: true,
    notes: "Best session in recent months. Consider stepping down to supported supervision at next LAC review.",
  },
  {
    id: "cs2", youngPersonId: "yp_alex", date: d(-17), startTime: "14:00", endTime: "15:00",
    contactType: "supervised_centre", supervisionLevel: "supervised",
    contactPerson: "birth_father", contactPersonName: "Craig Thompson",
    venue: "Stockport Family Contact Centre", supervisingStaff: "staff_edward",
    outcome: "did_not_attend",
    childPresentationBefore: "Alex was reluctant to go. Said 'he probably won't come.' Needed encouragement.",
    childPresentationDuring: "N/A — Craig did not attend. Waited 30 minutes as per protocol.",
    childPresentationAfter: "Alex was quiet and withdrew to bedroom on return. Said 'told you.' Declined snack but accepted a drink. Staff maintained gentle availability.",
    interactionQuality: "N/A",
    concerns: ["Third non-attendance in 4 months", "Impact on Alex's self-worth", "Pattern of unreliability"],
    positives: [],
    safeguardingConcerns: false, safeguardingDetails: "",
    childViews: "Alex said they don't want to keep going if 'he can't be bothered.' Wants to write a letter instead. Feels let down.",
    giftsBrought: "", agreementBreaches: [],
    courtOrderRef: "FP-2024-8834", nextContactDate: d(25), socialWorkerNotified: true,
    notes: "DNA recorded. SW Lisa Chen notified same day. Requested review of father contact arrangements at next professionals meeting. Alex's views to be central to any decision.",
  },
  {
    id: "cs3", youngPersonId: "yp_jordan", date: d(-5), startTime: "10:00", endTime: "11:00",
    contactType: "video_call", supervisionLevel: "monitored",
    contactPerson: "sibling", contactPersonName: "Tyler (brother, age 14)",
    venue: "Oak House — quiet room", supervisingStaff: "staff_chervelle",
    outcome: "positive",
    childPresentationBefore: "Jordan was excited — had prepared artwork to show Tyler. Needed support setting up the tablet.",
    childPresentationDuring: "Bright and animated throughout. Showed artwork and recent school certificates. Tyler was engaged and encouraging. Both laughing at shared jokes. Jordan used age-appropriate language and turn-taking in conversation.",
    childPresentationAfter: "Happy and energised. Talked about Tyler throughout lunch. Asked when next call would be.",
    interactionQuality: "Excellent sibling bond evident. Tyler takes a caring older brother role. Both clearly enjoy the connection.",
    concerns: [],
    positives: ["Strong sibling bond", "Jordan's communication excellent in this context", "Tyler very encouraging of Jordan's art", "Natural, relaxed interaction"],
    safeguardingConcerns: false, safeguardingDetails: "",
    childViews: "Jordan said Tyler is 'the best brother ever' and wants to see him in person. Asked if Tyler could visit Oak House.",
    giftsBrought: "", agreementBreaches: [],
    courtOrderRef: "", nextContactDate: d(9), socialWorkerNotified: false,
    notes: "Video contact working very well for sibling relationship. Explore possibility of face-to-face sibling contact at Oak House — discuss with SW.",
  },
  {
    id: "cs4", youngPersonId: "yp_casey", date: d(-7), startTime: "11:00", endTime: "12:00",
    contactType: "face_to_face", supervisionLevel: "supported",
    contactPerson: "birth_mother", contactPersonName: "Sarah Williams",
    venue: "Local park (Bramhall Park)", supervisingStaff: "staff_anna",
    outcome: "mixed",
    childPresentationBefore: "Casey was excited and had chosen an outfit specially. Kept asking how long until they see mum.",
    childPresentationDuring: "Initial joy and running to mum for hug. Played in the park together for 20 minutes — good interaction. Second half: mum became distracted by phone. Casey tried to get attention by becoming louder and more boisterous. Some boundary-pushing (climbing too high).",
    childPresentationAfter: "Tearful in the car. Didn't want to leave. Settled after 30 minutes back at Oak House with key worker support. Comfort-ate at dinner.",
    interactionQuality: "Started well but dipped when mum became preoccupied. Mum's attention inconsistency is confusing for Casey.",
    concerns: ["Mum's phone use during contact", "Casey's heightened behaviour as bid for attention", "Emotional regulation difficulties post-contact"],
    positives: ["Genuine excitement and affection between Casey and mum", "Good initial play interaction", "Casey's attachment to mum is evident"],
    safeguardingConcerns: false, safeguardingDetails: "",
    childViews: "Casey said 'mum was on her phone again.' Wants mum to 'just play with me and not look at her phone.' Also said 'I love seeing mummy.'",
    giftsBrought: "Sarah brought a small stuffed toy — checked against contact agreement.",
    agreementBreaches: ["Excessive phone use — gentle reminder given by supervising staff"],
    courtOrderRef: "FP-2025-1122", nextContactDate: d(7), socialWorkerNotified: true,
    notes: "Phone use pattern needs addressing with SW. Consider contact agreement amendment to explicitly address phone use. Casey needs consistent post-contact support routine.",
  },
  {
    id: "cs5", youngPersonId: "yp_casey", date: d(-1), startTime: "16:00", endTime: "16:30",
    contactType: "phone_call", supervisionLevel: "monitored",
    contactPerson: "grandparent", contactPersonName: "Margaret Williams (maternal gran)",
    venue: "Oak House — lounge", supervisingStaff: "staff_anna",
    outcome: "positive",
    childPresentationBefore: "Looking forward to the call. Had things to tell gran about school.",
    childPresentationDuring: "Chatty and happy. Told gran about school project and new friend. Gran asked about meals and whether Casey was eating well. Warm, nurturing conversation.",
    childPresentationAfter: "Content and settled. Good evening routine.",
    interactionQuality: "Warm, consistent relationship. Margaret provides emotional stability.",
    concerns: [],
    positives: ["Stable, nurturing relationship", "Casey comfortable and open", "Margaret appropriate and supportive"],
    safeguardingConcerns: false, safeguardingDetails: "",
    childViews: "Casey loves talking to gran. Said 'she always asks me nice questions.'",
    giftsBrought: "", agreementBreaches: [],
    courtOrderRef: "", nextContactDate: d(6), socialWorkerNotified: false,
    notes: "Consistent positive contact. Gran is an important protective factor for Casey.",
  },
];

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; date: string; time: string; contactType: string;
  supervisionLevel: string; contactPerson: string; contactName: string;
  venue: string; supervisedBy: string; outcome: string;
  concerns: string; positives: string; childViews: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",     accessor: (r: FlatRow) => r.youngPerson },
  { header: "Date",             accessor: (r: FlatRow) => r.date },
  { header: "Time",             accessor: (r: FlatRow) => r.time },
  { header: "Type",             accessor: (r: FlatRow) => r.contactType },
  { header: "Supervision",      accessor: (r: FlatRow) => r.supervisionLevel },
  { header: "Contact Person",   accessor: (r: FlatRow) => r.contactPerson },
  { header: "Contact Name",     accessor: (r: FlatRow) => r.contactName },
  { header: "Venue",            accessor: (r: FlatRow) => r.venue },
  { header: "Supervised By",    accessor: (r: FlatRow) => r.supervisedBy },
  { header: "Outcome",          accessor: (r: FlatRow) => r.outcome },
  { header: "Concerns",         accessor: (r: FlatRow) => r.concerns },
  { header: "Positives",        accessor: (r: FlatRow) => r.positives },
  { header: "Child Views",      accessor: (r: FlatRow) => r.childViews },
  { header: "Notes",            accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function ContactSupervisionPage() {
  const [data] = useState<ContactSession[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = data.length;
    const positive = data.filter((s) => s.outcome === "positive").length;
    const dna = data.filter((s) => s.outcome === "did_not_attend").length;
    const safeguarding = data.filter((s) => s.safeguardingConcerns).length;
    return { total, positive, dna, safeguarding };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        getYPName(s.youngPersonId).toLowerCase().includes(q) ||
        s.contactPersonName.toLowerCase().includes(q)
      );
    }
    if (filterOutcome !== "all") list = list.filter((s) => s.outcome === filterOutcome);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "child": out.sort((a, b) => getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId))); break;
      case "outcome": out.sort((a, b) => a.outcome.localeCompare(b.outcome)); break;
    }
    return out;
  }, [data, search, filterOutcome, sortBy]);

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    data.map((s) => ({
      youngPerson: getYPName(s.youngPersonId),
      date: s.date,
      time: `${s.startTime}–${s.endTime}`,
      contactType: TYPE_LABELS[s.contactType],
      supervisionLevel: LEVEL_LABELS[s.supervisionLevel],
      contactPerson: PERSON_LABELS[s.contactPerson],
      contactName: s.contactPersonName,
      venue: s.venue,
      supervisedBy: getStaffName(s.supervisingStaff),
      outcome: OUTCOME_LABELS[s.outcome],
      concerns: s.concerns.join("; "),
      positives: s.positives.join("; "),
      childViews: s.childViews,
      notes: s.notes,
    })), [data]);

  return (
    <PageShell
      title="Contact Supervision"
      subtitle="Supervised and supported contact session records — family, siblings and significant others"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Contact Supervision Records" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="contact-supervision" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Record Session
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Sessions", value: stats.total, icon: Users, colour: "text-blue-600" },
          { label: "Positive", value: stats.positive, icon: CheckCircle2, colour: "text-green-600" },
          { label: "Did Not Attend", value: stats.dna, icon: Clock, colour: stats.dna > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Safeguarding Flags", value: stats.safeguarding, icon: AlertTriangle, colour: stats.safeguarding > 0 ? "text-red-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── per-child summary ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {["yp_alex", "yp_jordan", "yp_casey"].map((ypId) => {
          const sessions = data.filter((s) => s.youngPersonId === ypId);
          const pos = sessions.filter((s) => s.outcome === "positive").length;
          const nextDate = sessions.map((s) => s.nextContactDate).filter(Boolean).sort()[0];
          return (
            <div key={ypId} className="rounded-lg border bg-white p-4">
              <h3 className="font-semibold">{getYPName(ypId)}</h3>
              <p className="text-xs text-gray-500 mt-1">{sessions.length} sessions recorded</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Positive:</span> <span className="font-medium text-green-600">{pos}/{sessions.length}</span></div>
                <div><span className="text-gray-500">Next:</span> <span className="font-medium">{nextDate ?? "—"}</span></div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {[...new Set(sessions.map((s) => s.contactPersonName))].map((name) => (
                  <span key={name} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{name}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="sessions-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children or contacts…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterOutcome} onValueChange={setFilterOutcome}>
          <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            {Object.entries(OUTCOME_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="outcome">Outcome</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((s) => {
          const open = expanded[s.id] ?? false;
          return (
            <div key={s.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(s.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(s.youngPersonId)} — {s.contactPersonName}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", OUTCOME_COLOURS[s.outcome])}>{OUTCOME_LABELS[s.outcome]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", LEVEL_COLOURS[s.supervisionLevel])}>{LEVEL_LABELS[s.supervisionLevel]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.date} · {s.startTime}–{s.endTime} · {TYPE_LABELS[s.contactType]} · {s.venue}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* key details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{PERSON_LABELS[s.contactPerson]}</span></div>
                    <div><span className="text-gray-500">Supervised by:</span> <span className="font-medium">{getStaffName(s.supervisingStaff)}</span></div>
                    {s.courtOrderRef && <div><span className="text-gray-500">Court Ref:</span> <span className="font-medium">{s.courtOrderRef}</span></div>}
                    <div><span className="text-gray-500">Next Contact:</span> <span className="font-medium">{s.nextContactDate}</span></div>
                  </div>

                  {/* child presentation — before/during/after */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Child Presentation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">Before</p>
                        <p className="text-sm">{s.childPresentationBefore}</p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">During</p>
                        <p className="text-sm">{s.childPresentationDuring}</p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">After</p>
                        <p className="text-sm">{s.childPresentationAfter}</p>
                      </div>
                    </div>
                  </div>

                  {/* interaction quality */}
                  {s.interactionQuality && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Interaction Quality</h4>
                      <p className="text-sm">{s.interactionQuality}</p>
                    </div>
                  )}

                  {/* positives / concerns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {s.positives.length > 0 && (
                      <div className="rounded-md bg-green-50 p-3">
                        <h4 className="text-xs font-semibold text-green-700 mb-1">Positives</h4>
                        <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                          {s.positives.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                    {s.concerns.length > 0 && (
                      <div className="rounded-md bg-amber-50 p-3">
                        <h4 className="text-xs font-semibold text-amber-700 mb-1">Concerns</h4>
                        <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                          {s.concerns.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* safeguarding */}
                  {s.safeguardingConcerns && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Safeguarding Concern Raised</h4>
                      <p className="text-sm text-red-800">{s.safeguardingDetails}</p>
                    </div>
                  )}

                  {/* agreement breaches */}
                  {s.agreementBreaches.length > 0 && (
                    <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
                      <h4 className="text-xs font-semibold text-orange-700 mb-1">Contact Agreement Breaches</h4>
                      <ul className="list-disc list-inside text-sm text-orange-800 space-y-0.5">
                        {s.agreementBreaches.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* gifts */}
                  {s.giftsBrought && (
                    <div className="text-sm"><span className="text-gray-500 font-medium">Gifts/Items Brought:</span> {s.giftsBrought}</div>
                  )}

                  {/* child's view */}
                  {s.childViews && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Views</h4>
                      <p className="text-sm text-pink-800">{s.childViews}</p>
                    </div>
                  )}

                  {/* notes */}
                  {s.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{s.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Contact &amp; Supervision:</strong> Reg 8 requires that children are supported to maintain relationships with family and significant people, consistent with their safety and welfare. Contact arrangements must follow court orders and care plans. Supervised contact sessions must record child presentation before, during and after contact, interaction quality, and any safeguarding concerns. The child&apos;s voice must be central to all contact decisions.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Record Contact Session</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Young Person</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Contact Type</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Contact Person Name</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Michelle Thompson" />
              </div>
              <div>
                <label className="text-sm font-medium">Relationship</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(PERSON_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Venue</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Contact Centre, Oak House" />
            </div>
            <div>
              <label className="text-sm font-medium">Outcome</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(OUTCOME_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Session observations…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Save Session</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
