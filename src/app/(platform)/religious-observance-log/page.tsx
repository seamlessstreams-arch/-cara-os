"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  HeartHandshake,
  Calendar,
  BookOpen,
  Utensils,
  Shirt,
  Users,
  HandHeart,
  Leaf,
  PenLine,
  ScrollText,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface PracticeSupported {
  practice: string;
  dateLast: string;
  dateNext: string;
  supportedBy: string;
}

interface FestivalObserved {
  festival: string;
  date: string;
  plansForObservance: string;
  attendingWith: string;
}

interface ObservanceRecord {
  id: string;
  youngPerson: string;
  faithOrBelief: string;
  profileSummary: string;
  regularPractices: string[];
  practicesSupported: PracticeSupported[];
  dietaryNeedsLinked: string;
  dressCode: string;
  festivalsObserved: FestivalObserved[];
  faithLeaders: string[];
  placeOfWorshipPreferences: string;
  spiritualSupport: string[];
  childAuthored: boolean;
  reviewedDate: string;
  reviewedWith: string;
  nextReviewDate: string;
  notes: string;
}

/* ─── seed records ─── */
const records: ObservanceRecord[] = [
  {
    id: "rel_001",
    youngPerson: "yp_alex",
    faithOrBelief: "Christianity (loose family connection)",
    profileSummary:
      "Alex's family identify culturally as Christian (Church of England) but Alex has not been a regular church-goer since early primary school. Alex describes themselves as 'maybe believing in something' but is not actively practising. Alex is comfortable around faith and respects others' beliefs — has friends from a range of faiths at school. Alex has expressed mild interest in attending a carol service at Christmas 'because it's nice' but does not want a formal faith plan imposed.\n\nAlex's wishes: low-key acknowledgement of family Christmas traditions; no pressure to attend services; freedom to ask questions about faith without judgement.",
    regularPractices: [
      "Sunday lunch with grandmother (cultural/family rather than religious)",
      "Christmas observance — tree, presents, family meal",
      "Easter — chocolate eggs, family lunch",
      "Occasional grace before Sunday roast at grandma's",
    ],
    practicesSupported: [
      {
        practice: "Sunday lunch with grandmother",
        dateLast: d(-5),
        dateNext: d(2),
        supportedBy: "staff_darren",
      },
      {
        practice: "Christmas planning conversation",
        dateLast: d(-30),
        dateNext: d(180),
        supportedBy: "staff_anna",
      },
    ],
    dietaryNeedsLinked: "None faith-based. Standard preferences only — see dietary log.",
    dressCode: "None specified.",
    festivalsObserved: [
      {
        festival: "Easter Sunday",
        date: d(-2),
        plansForObservance: "Family lunch at grandmother's. Alex chose to attend. Not attending church service — declined politely when asked.",
        attendingWith: "Family",
      },
      {
        festival: "Christmas Day",
        date: d(235),
        plansForObservance: "To be planned with family. Likely lunch at grandmother's; Alex has expressed possible interest in attending Christmas Eve carol service 'just to listen' — to revisit nearer the time.",
        attendingWith: "Family",
      },
    ],
    faithLeaders: ["None currently. Family pastor available at family request."],
    placeOfWorshipPreferences:
      "No regular place of worship. Grandmother's local C of E church is the family link if Alex chooses to attend in future.",
    spiritualSupport: [
      "Quiet time alone in bedroom when feeling reflective",
      "Conversations with grandmother about family memories",
      "Music — finds certain songs 'spiritual' even if not religious",
    ],
    childAuthored: true,
    reviewedDate: d(-21),
    reviewedWith: "staff_darren",
    nextReviewDate: d(160),
    notes:
      "Alex co-authored this record during a key work session. Alex was clear: 'I don't want anyone making a fuss about religion for me — but I don't want it taken away either if my family wants it.' Position respected and recorded faithfully.",
  },
  {
    id: "rel_002",
    youngPerson: "yp_jordan",
    faithOrBelief: "Christianity — exploring own faith (Black-led church heritage)",
    profileSummary:
      "Jordan is of Black British Caribbean and West African heritage. Jordan's mother and maternal grandmother are practising Christians who attended a Pentecostal/Black-led church before Jordan came into care. Jordan describes themselves as 'still figuring it out' but says faith feels important to who they are and to their cultural identity. Jordan finds gospel music comforting and has asked to attend the family church occasionally on contact weekends.\n\nJordan's wishes: support to explore faith at own pace; access to gospel music; recognition that faith and cultural heritage are linked for Jordan; opportunity to attend church with family during contact; no pressure to commit either way.",
    regularPractices: [
      "Listening to gospel music (most evenings)",
      "Saying a brief prayer before bed (when Jordan chooses — not always)",
      "Attending family church on contact weekends (when contact happens)",
      "Sunday phone call with grandmother who often prays with Jordan",
    ],
    practicesSupported: [
      {
        practice: "Bedtime prayer space — quiet 10 mins before lights out if requested",
        dateLast: d(-1),
        dateNext: d(0),
        supportedBy: "staff_anna",
      },
      {
        practice: "Sunday phone call with grandmother",
        dateLast: d(-4),
        dateNext: d(3),
        supportedBy: "staff_chervelle",
      },
      {
        practice: "Transport to family church on contact weekends",
        dateLast: d(-21),
        dateNext: d(7),
        supportedBy: "staff_darren",
      },
      {
        practice: "Gospel music playlist — Jordan's headphones available",
        dateLast: d(-1),
        dateNext: d(0),
        supportedBy: "staff_mirela",
      },
    ],
    dietaryNeedsLinked:
      "No formal religious dietary restriction. Cultural foods important to identity — Caribbean/West African dishes featured in menu rota (see Dietary Needs Log). Jordan particularly enjoys jollof rice and ackee — sourced through family input.",
    dressCode:
      "Modest dress for church visits (long skirts/trousers, sleeves) — Jordan's own preference, supported. Jordan has church outfit kept clean and ready.",
    festivalsObserved: [
      {
        festival: "Easter Sunday",
        date: d(-2),
        plansForObservance: "Jordan attended family church with mother and grandmother during contact. Staff dropped off and collected. Jordan reported it was 'really good — felt like home.'",
        attendingWith: "Mother and grandmother",
      },
      {
        festival: "Pentecost Sunday",
        date: d(48),
        plansForObservance: "Contact weekend planned to coincide. Jordan to attend family church if contact proceeds. Backup plan: gospel music evening at home with Anna if contact cancelled.",
        attendingWith: "Mother and grandmother (planned)",
      },
      {
        festival: "Christmas Day",
        date: d(235),
        plansForObservance: "To be planned. Jordan has said church on Christmas Eve matters to grandmother — wants to attend if contact arrangements allow.",
        attendingWith: "Family (planned)",
      },
    ],
    faithLeaders: [
      "Pastor at family's Black-led Pentecostal church (contact via grandmother)",
      "School chaplain (available, Jordan has met once)",
    ],
    placeOfWorshipPreferences:
      "Family church (Pentecostal, Black-led) when on contact. Jordan does not wish to attend a different church locally — finds the cultural connection of the family church important. Has declined offer of local church visits.",
    spiritualSupport: [
      "Gospel music — Kirk Franklin, Tasha Cobbs Leonard, family playlists from grandmother",
      "Phone calls with grandmother (often include prayer)",
      "Quiet bedroom space for prayer/reflection",
      "Cultural connection — hair, food, music as part of spiritual identity",
      "Anna (key worker) checks in gently without imposing",
    ],
    childAuthored: true,
    reviewedDate: d(-14),
    reviewedWith: "staff_anna",
    nextReviewDate: d(76),
    notes:
      "Jordan co-authored this record with Anna over two key work sessions. Jordan said: 'It's not just about church — it's about who I am, where I come from. I want both.' Faith, culture and heritage are intertwined for Jordan and the home actively supports all three. Reviewed with grandmother (with Jordan's consent) to ensure accuracy of family practice details.",
  },
  {
    id: "rel_003",
    youngPerson: "yp_casey",
    faithOrBelief: "None / Spiritual nature-connection (non-religious)",
    profileSummary:
      "Casey does not identify with any religion and is clear they are not religious. Casey describes themselves as 'spiritual but not religious' — finds meaning in nature, animals and being outdoors. Casey loves the home's dog walks and has asked to volunteer at a local animal sanctuary as 'something that feels right.' Casey is respectful of others' beliefs but does not want religious content included in their care (e.g., declined chaplain at hospital admission last year).\n\nCasey's wishes: time outdoors, especially near water and trees; access to animal-based activities; freedom from religious content unless specifically requested; respect for their non-religious stance without judgement.",
    regularPractices: [
      "Daily dog walk (when possible) — described as 'my reset'",
      "Weekly volunteer session at local animal sanctuary (Saturdays)",
      "Time alone in the garden — particularly under the oak tree",
      "Journalling about nature observations",
      "Annual visit to grandparents' woodland — meaningful place from childhood",
    ],
    practicesSupported: [
      {
        practice: "Saturday animal sanctuary volunteering — transport and supervision",
        dateLast: d(-2),
        dateNext: d(5),
        supportedBy: "staff_chervelle",
      },
      {
        practice: "Daily dog walk — staff accompany or supervise from window",
        dateLast: d(0),
        dateNext: d(1),
        supportedBy: "staff_mirela",
      },
      {
        practice: "Garden quiet time — privacy respected, staff aware not to interrupt",
        dateLast: d(-1),
        dateNext: d(0),
        supportedBy: "staff_darren",
      },
      {
        practice: "Woodland visit planning (grandparents' woods)",
        dateLast: d(-90),
        dateNext: d(60),
        supportedBy: "staff_chervelle",
      },
    ],
    dietaryNeedsLinked:
      "No religious dietary needs. Casey is moving toward vegetarianism on ethical/animal-welfare grounds — supported in dietary log. Not yet fully vegetarian but eating less meat by choice.",
    dressCode: "None specified. Casey wears practical outdoor clothing for sanctuary work — own choice.",
    festivalsObserved: [
      {
        festival: "Earth Day",
        date: d(-13),
        plansForObservance: "Casey asked to mark this — staff supported a woodland walk at the local nature reserve, picked up litter, planted wildflower seeds in the garden. Casey said 'this matters more than any church service.'",
        attendingWith: "Chervelle (key worker) and Mirela",
      },
      {
        festival: "Summer Solstice",
        date: d(50),
        plansForObservance: "Casey has asked to spend the longest day outdoors — early morning walk planned, evening BBQ in the garden, optional stargazing if clear. No religious framing — just 'a good day to be outside.'",
        attendingWith: "Whole house (optional for others)",
      },
      {
        festival: "Winter Solstice",
        date: d(232),
        plansForObservance: "Casey has asked for a candlelit garden moment — 'just to mark the shortest day.' To be supported respectfully without religious framing.",
        attendingWith: "Chervelle and any peers who want to join",
      },
    ],
    faithLeaders: ["None — Casey does not want a faith leader involved in their care."],
    placeOfWorshipPreferences:
      "No place of worship. Casey identifies the local woodland and the home's garden as their 'meaningful places.' Annual visit to grandparents' woodland is highly significant.",
    spiritualSupport: [
      "Time outdoors — especially with trees and water",
      "Animals — sanctuary volunteering, the home's relationships with neighbouring dogs",
      "Journalling — nature observations, sketches",
      "Solitude — Casey needs uninterrupted alone time to feel grounded",
      "Music — instrumental, ambient, nature sounds",
      "No religious or chaplaincy support requested — actively declines",
    ],
    childAuthored: true,
    reviewedDate: d(-28),
    reviewedWith: "staff_chervelle",
    nextReviewDate: d(62),
    notes:
      "Casey was firm: 'I'm not religious. I don't want to be. But I do believe in being a good person and being kind to animals and the planet.' This record honours that worldview as fully as it would honour a religious one. Casey wrote sections of this themselves and reviewed every word. Casey's right to non-belief is protected equally under Article 9 ECHR / Equality Act 2010.",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<ObservanceRecord>[] = [
  { header: "Young Person", accessor: (r: ObservanceRecord) => getYPName(r.youngPerson) },
  { header: "Faith / Belief", accessor: (r: ObservanceRecord) => r.faithOrBelief },
  { header: "Profile Summary", accessor: (r: ObservanceRecord) => r.profileSummary },
  { header: "Regular Practices", accessor: (r: ObservanceRecord) => r.regularPractices.join("; ") },
  {
    header: "Practices Supported",
    accessor: (r: ObservanceRecord) =>
      r.practicesSupported
        .map((p) => `${p.practice} (last ${p.dateLast}, next ${p.dateNext}, by ${getStaffName(p.supportedBy)})`)
        .join("; "),
  },
  { header: "Dietary Needs Linked", accessor: (r: ObservanceRecord) => r.dietaryNeedsLinked },
  { header: "Dress Code", accessor: (r: ObservanceRecord) => r.dressCode },
  {
    header: "Festivals Observed",
    accessor: (r: ObservanceRecord) =>
      r.festivalsObserved.map((f) => `${f.festival} (${f.date}) — ${f.plansForObservance}`).join("; "),
  },
  { header: "Faith Leaders", accessor: (r: ObservanceRecord) => r.faithLeaders.join("; ") },
  { header: "Place of Worship Preferences", accessor: (r: ObservanceRecord) => r.placeOfWorshipPreferences },
  { header: "Spiritual Support", accessor: (r: ObservanceRecord) => r.spiritualSupport.join("; ") },
  { header: "Child Co-Authored", accessor: (r: ObservanceRecord) => (r.childAuthored ? "Yes" : "No") },
  { header: "Reviewed Date", accessor: (r: ObservanceRecord) => r.reviewedDate },
  { header: "Reviewed With", accessor: (r: ObservanceRecord) => getStaffName(r.reviewedWith) },
  { header: "Next Review", accessor: (r: ObservanceRecord) => r.nextReviewDate },
  { header: "Notes", accessor: (r: ObservanceRecord) => r.notes },
];

/* ─── component ─── */
export default function ReligiousObservanceLogPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterChild, setFilterChild] = useState("all");
  const [sortBy, setSortBy] = useState("review_due");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const in30 = useMemo(() => d(30), []);
  const in90 = useMemo(() => d(90), []);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterChild !== "all") list = list.filter((r) => r.youngPerson === filterChild);
    list.sort((a, b) => {
      switch (sortBy) {
        case "review_due":
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case "name":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "faith":
          return a.faithOrBelief.localeCompare(b.faithOrBelief);
        case "recent_review":
          return b.reviewedDate.localeCompare(a.reviewedDate);
        default:
          return 0;
      }
    });
    return list;
  }, [filterChild, sortBy]);

  const stats = useMemo(() => {
    const activeSupport = records.filter((r) => r.practicesSupported.length > 0).length;
    const beliefs = new Set(records.map((r) => r.faithOrBelief.split(" (")[0].split(" — ")[0].trim())).size;
    const upcomingFestivals = records.reduce((acc, r) => {
      return (
        acc + r.festivalsObserved.filter((f) => f.date >= today && f.date <= in90).length
      );
    }, 0);
    const reviewsDue30 = records.filter((r) => r.nextReviewDate <= in30).length;
    return { activeSupport, beliefs, upcomingFestivals, reviewsDue30 };
  }, [today, in30, in90]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const beliefBadgeColor = (faith: string) => {
    const f = faith.toLowerCase();
    if (f.includes("none") || f.includes("non-religious") || f.includes("nature"))
      return "bg-emerald-100 text-emerald-800";
    if (f.includes("christian")) return "bg-amber-100 text-amber-800";
    if (f.includes("muslim") || f.includes("islam")) return "bg-teal-100 text-teal-800";
    if (f.includes("jew")) return "bg-blue-100 text-blue-800";
    if (f.includes("hindu")) return "bg-orange-100 text-orange-800";
    if (f.includes("sikh")) return "bg-yellow-100 text-yellow-800";
    if (f.includes("buddh")) return "bg-rose-100 text-rose-800";
    if (f.includes("heritage") || f.includes("cultural"))
      return "bg-purple-100 text-purple-800";
    return "bg-slate-100 text-slate-800";
  };

  return (
    <PageShell
      title="Religious & Belief Observance Log"
      subtitle="Recording and supporting each child's religious, spiritual or belief practices — at their pace, on their terms"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={records}
            columns={exportCols}
            filename="religious-observance-log"
          />
          <PrintButton title="Religious & Belief Observance Log" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.activeSupport}</p>
            <p className="text-xs text-muted-foreground">
              Children with Active Practice Support
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.beliefs}</p>
            <p className="text-xs text-muted-foreground">Faiths / Beliefs Represented</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.upcomingFestivals}</p>
            <p className="text-xs text-muted-foreground">Festivals Planned (next 90d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p
              className={cn(
                "text-2xl font-bold",
                stats.reviewsDue30 > 0 ? "text-amber-700" : "text-slate-700",
              )}
            >
              {stats.reviewsDue30}
            </p>
            <p className="text-xs text-muted-foreground">Reviews Due (30d)</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── respect-for-belief banner ─── */}
      <div className="bg-gradient-to-r from-emerald-50 via-amber-50 to-purple-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <HeartHandshake className="h-5 w-5 text-emerald-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900">
              Respect for Every Belief — and the Right to None
            </p>
            <p className="text-xs text-emerald-800 mt-1">
              Oak House supports each child&apos;s religion, spirituality or belief — including
              the right to no religion at all — without pressure, judgement or assumption. We
              follow the child&apos;s lead, draw on family and cultural knowledge with consent,
              and never treat any tradition as more or less valid than another. A child&apos;s
              spiritual life is theirs to shape; our job is to make space for it.
            </p>
          </div>
        </div>
      </div>

      {/* ─── filters / sort ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterChild} onValueChange={setFilterChild}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">Alex</SelectItem>
            <SelectItem value="yp_jordan">Jordan</SelectItem>
            <SelectItem value="yp_casey">Casey</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review_due">Review Due Soonest</SelectItem>
              <SelectItem value="recent_review">Most Recently Reviewed</SelectItem>
              <SelectItem value="name">Child Name</SelectItem>
              <SelectItem value="faith">Faith / Belief</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── record cards ─── */}
      <div className="space-y-3">
        {filtered.map((rec) => {
          const expanded = expandedId === rec.id;
          const reviewSoon = rec.nextReviewDate <= in30;

          return (
            <Card key={rec.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(rec.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(rec.youngPerson)}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={cn("text-xs", beliefBadgeColor(rec.faithOrBelief))}>
                          {rec.faithOrBelief}
                        </Badge>
                        {rec.childAuthored && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <PenLine className="h-3 w-3 mr-0.5" /> Child Co-Authored
                          </Badge>
                        )}
                        {reviewSoon && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            Review Due {rec.nextReviewDate}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  {/* profile summary */}
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <BookOpen className="h-4 w-4" /> Belief Profile
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {rec.profileSummary}
                    </p>
                  </div>

                  {/* regular practices */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-purple-800 flex items-center gap-1 mb-2">
                      <Leaf className="h-4 w-4" /> Regular Practices
                    </p>
                    <ul className="text-sm text-purple-900 space-y-1 list-disc list-inside">
                      {rec.regularPractices.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  {/* practices supported by staff */}
                  {rec.practicesSupported.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <HandHeart className="h-4 w-4" /> Practices Supported by the Home
                      </p>
                      <div className="space-y-1.5">
                        {rec.practicesSupported.map((p, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs bg-muted/30 rounded p-2"
                          >
                            <div className="md:col-span-2 font-medium">{p.practice}</div>
                            <div className="text-muted-foreground">
                              Last: {p.dateLast} · Next: {p.dateNext}
                            </div>
                            <div className="text-muted-foreground">
                              By {getStaffName(p.supportedBy)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* dietary + dress in two columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1">
                        <Utensils className="h-4 w-4" /> Dietary Needs (Linked)
                      </p>
                      <p className="text-sm text-muted-foreground">{rec.dietaryNeedsLinked}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1">
                        <Shirt className="h-4 w-4" /> Dress Code
                      </p>
                      <p className="text-sm text-muted-foreground">{rec.dressCode}</p>
                    </div>
                  </div>

                  {/* festivals */}
                  {rec.festivalsObserved.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Festivals & Special Days
                      </p>
                      <div className="space-y-2">
                        {rec.festivalsObserved.map((f, i) => (
                          <div
                            key={i}
                            className="border rounded-lg p-2.5 bg-amber-50/50 border-amber-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-amber-900">{f.festival}</p>
                              <span className="text-xs text-amber-700">{f.date}</span>
                            </div>
                            <p className="text-xs text-amber-800 mb-1">{f.plansForObservance}</p>
                            <p className="text-xs text-muted-foreground">
                              Attending with: {f.attendingWith}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* faith leaders + place of worship */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1">
                        <Users className="h-4 w-4" /> Faith Leaders
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-0.5 list-disc list-inside">
                        {rec.faithLeaders.map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1">
                        <ScrollText className="h-4 w-4" /> Place of Worship Preferences
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rec.placeOfWorshipPreferences}
                      </p>
                    </div>
                  </div>

                  {/* spiritual support */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-emerald-800 flex items-center gap-1 mb-2">
                      <Sparkles className="h-4 w-4" /> What Helps This Child Spiritually
                    </p>
                    <ul className="text-sm text-emerald-900 space-y-1 list-disc list-inside">
                      {rec.spiritualSupport.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* notes */}
                  {rec.notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground italic">{rec.notes}</p>
                    </div>
                  )}

                  {/* footer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Last Reviewed</p>
                      <p className="text-sm font-medium">{rec.reviewedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reviewed With</p>
                      <p className="text-sm font-medium">{getStaffName(rec.reviewedWith)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Review</p>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          reviewSoon && "text-amber-700",
                        )}
                      >
                        {rec.nextReviewDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Co-Authored</p>
                      <p className="text-sm font-medium">{rec.childAuthored ? "Yes" : "No"}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          UNCRC Article 30 protects every child&apos;s right to enjoy their own culture, profess
          and practise their own religion, or use their own language. Article 14 protects freedom
          of thought, conscience and religion — including the right to none. The Equality Act 2010
          lists religion or belief (including the absence of belief) as a protected characteristic;
          Children&apos;s Homes Regulations 2015 Schedule 1 (Quality Standard 1 — Child-Centred
          Care) and Regulation 6 require care that respects each child&apos;s identity, including
          religion and culture. The Statement of Purpose, placement plans and dietary needs records
          must reflect and support this. Children should never feel pressured to adopt or abandon
          a belief — staff support practice, not promotion.
        </p>
      </div>
    </PageShell>
  );
}
