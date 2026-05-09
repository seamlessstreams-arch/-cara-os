"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  Gift,
  Heart,
  Home,
  CheckCircle2,
  Package,
  Star,
  ArrowUpDown,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface WelcomeItem {
  item: string;
  category: "bedroom" | "toiletries" | "comfort" | "information" | "personal" | "food";
  provided: boolean;
  personalised: boolean;
  notes: string;
}

interface WelcomePack {
  id: string;
  youngPersonId: string;
  preparedBy: string;
  preparedDate: string;
  admissionDate: string;
  status: "delivered" | "preparing" | "template";
  items: WelcomeItem[];
  personalTouches: string[];
  childFeedback: string | null;
  firstNightPlan: string;
  keyWorkerIntro: string;
  notes: string;
}

/* ─── seed data ─── */
const packs: WelcomePack[] = [
  {
    id: "wp_001",
    youngPersonId: "yp_casey",
    preparedBy: "staff_chervelle",
    preparedDate: d(-90),
    admissionDate: d(-88),
    status: "delivered",
    items: [
      { item: "New bedding set (Casey chose dark blue from photos sent in advance)", category: "bedroom", provided: true, personalised: true, notes: "Casey picked this from 3 options sent via social worker before arrival" },
      { item: "Toiletries bag — shower gel, deodorant, toothbrush, shampoo", category: "toiletries", provided: true, personalised: false, notes: "Branded products, not institutional" },
      { item: "Snack box in room — crisps, chocolate, juice, fruit", category: "food", provided: true, personalised: true, notes: "SW told us Casey likes salt & vinegar crisps" },
      { item: "Welcome card signed by all staff", category: "comfort", provided: true, personalised: true, notes: "Handwritten, not printed" },
      { item: "Soft throw blanket", category: "comfort", provided: true, personalised: false, notes: "" },
      { item: "Children's Guide (age-appropriate version)", category: "information", provided: true, personalised: false, notes: "Given on day 2, not day 1 — too much info on arrival" },
      { item: "Photo of key worker (Chervelle) with short intro", category: "information", provided: true, personalised: true, notes: "Sent to Casey 3 days before admission via SW" },
      { item: "Wi-Fi password card", category: "information", provided: true, personalised: false, notes: "First thing Casey asked for!" },
      { item: "Phone charger (spare)", category: "personal", provided: true, personalised: false, notes: "Universal USB-C — Casey's phone type checked in advance" },
      { item: "£10 pocket money advance", category: "personal", provided: true, personalised: false, notes: "So Casey had their own money on day one" },
      { item: "Personalised door sign (Casey's name + chosen design)", category: "bedroom", provided: true, personalised: true, notes: "Casey chose a gaming controller design" },
    ],
    personalTouches: [
      "Room decorated before arrival — fairy lights and posters Casey mentioned liking",
      "Favourite meal cooked for first dinner (burger and chips — info from SW)",
      "Gaming console set up and ready in lounge",
      "Staff wore casual clothes on admission day (less institutional)",
    ],
    childFeedback: "Casey said 'this is actually alright' on the first evening — high praise from Casey. Later told Chervelle 'the snack box was a nice touch. Nobody ever did that before.' Casey kept the welcome card in their bedside drawer.",
    firstNightPlan: "Chervelle (key worker) on shift. Low-key evening — no pressure to socialise. Casey shown around at their pace. Other children introduced briefly but given space. Staff checked in every 30 minutes until Casey settled. Night staff briefed on Casey's background.",
    keyWorkerIntro: "Photo and short letter from Chervelle sent 3 days before admission via SW. Casey knew who to look for on arrival. Chervelle met Casey at the door.",
    notes: "Casey's transition was well-managed. The advance information from SW allowed genuine personalisation. Casey later said the personalised room made them feel 'like someone actually thought about me.' This is exactly the impact we want from welcome packs.",
  },
  {
    id: "wp_002",
    youngPersonId: "yp_jordan",
    preparedBy: "staff_anna",
    preparedDate: d(-200),
    admissionDate: d(-198),
    status: "delivered",
    items: [
      { item: "Weighted blanket (blue, 5kg — OT recommendation)", category: "comfort", provided: true, personalised: true, notes: "Ordered specifically for Jordan based on OT report" },
      { item: "Night light (warm amber, dimmable)", category: "bedroom", provided: true, personalised: true, notes: "Jordan afraid of the dark — essential item" },
      { item: "Sensory kit — fidget toys, stress ball, tangle", category: "comfort", provided: true, personalised: true, notes: "Based on sensory profile from previous placement" },
      { item: "New bedding (soft jersey cotton — sensory friendly)", category: "bedroom", provided: true, personalised: true, notes: "No scratchy materials — sensory need" },
      { item: "Toiletries — unscented products only", category: "toiletries", provided: true, personalised: true, notes: "Strong scents are a sensory trigger" },
      { item: "Welcome card with photos of the home and staff", category: "information", provided: true, personalised: true, notes: "Visual introduction — Jordan is visual learner" },
      { item: "Social story about moving to Oak House", category: "information", provided: true, personalised: true, notes: "Created by Anna specifically for Jordan" },
      { item: "Comfort food box (plain biscuits, juice, banana)", category: "food", provided: true, personalised: true, notes: "Jordan has limited food preferences — no strong flavours" },
      { item: "Tyler's photo in a frame (sibling)", category: "personal", provided: true, personalised: true, notes: "So Jordan had a familiar face in the room immediately" },
      { item: "Audio player with calming sounds pre-loaded", category: "comfort", provided: true, personalised: true, notes: "Rain sounds, ocean waves — used in previous placement" },
    ],
    personalTouches: [
      "Room was made quiet and calm — no bright colours, soft lighting",
      "Anna (key worker) visited Jordan at previous placement before move day",
      "Transition visits: 3 short visits before the actual move-in day",
      "Jordan's favourite stuffed animal placed on bed before arrival",
      "Other children briefed sensitively about Jordan's needs",
    ],
    childFeedback: "Jordan was initially very quiet and went straight to their room. After 2 hours, Jordan came to Anna and said 'the blanket is nice.' By day 3, Jordan said 'I like my room.' This is significant progress for Jordan given their attachment difficulties.",
    firstNightPlan: "Anna on shift (known face from transition visits). Jordan shown room first — allowed to stay there as long as needed. No pressure to meet other children on day 1. Night light on, door ajar (Jordan's preference). Staff checked every 15 minutes. Comfort items within reach. Audio player with rain sounds.",
    keyWorkerIntro: "Anna visited Jordan 3 times at previous placement. Relationship already established. Jordan requested Anna specifically as key worker after visits — granted.",
    notes: "Jordan's transition was carefully planned over 3 weeks with graduated visits. The sensory-informed welcome pack was essential. Every item was chosen with Jordan's specific needs in mind. The investment in pre-admission relationship building with Anna was crucial to a successful placement start.",
  },
  {
    id: "wp_003",
    youngPersonId: "yp_alex",
    preparedBy: "staff_ryan",
    preparedDate: d(-300),
    admissionDate: d(-298),
    status: "delivered",
    items: [
      { item: "New bedding set — space theme (Alex loves astronomy)", category: "bedroom", provided: true, personalised: true, notes: "Info from previous foster carer about Alex's interests" },
      { item: "Toiletries bag with age-appropriate products", category: "toiletries", provided: true, personalised: false, notes: "" },
      { item: "Welcome bear (soft toy — Alex was 12 at admission)", category: "comfort", provided: true, personalised: false, notes: "Alex still has this bear on their bed" },
      { item: "Book — fact book about space", category: "personal", provided: true, personalised: true, notes: "Alex's foster carer said Alex loves learning facts" },
      { item: "Art supplies — sketchbook, pencils, pens", category: "personal", provided: true, personalised: true, notes: "Alex mentioned liking drawing in referral" },
      { item: "Children's Guide (comic-book style version)", category: "information", provided: true, personalised: false, notes: "Age-appropriate format" },
      { item: "Wi-Fi password and tablet available", category: "information", provided: true, personalised: false, notes: "" },
      { item: "Snack box — fruit, chocolate milk, biscuits", category: "food", provided: true, personalised: false, notes: "" },
      { item: "Name plaque for door (stars design)", category: "bedroom", provided: true, personalised: true, notes: "Made by staff before arrival" },
      { item: "Photo album — empty, for Alex to fill", category: "personal", provided: true, personalised: true, notes: "For building new memories — life story approach" },
    ],
    personalTouches: [
      "Glow-in-the-dark stars on bedroom ceiling",
      "Alex's favourite dinner on first night (fish fingers & beans — from foster carer)",
      "Ryan (deputy) did the admission as he'd spoken to Alex on the phone before",
      "Garden shown first — Alex had mentioned wanting outdoor space",
    ],
    childFeedback: "Alex said 'is this really my room?' when shown the star ceiling. Staff noted Alex smiled genuinely. Alex later said to Nan on the phone 'it's actually nice here, they put stars on my ceiling.' Alex slept through the first night without waking — unusual for new placements.",
    firstNightPlan: "Ryan and Anna both on shift (familiar voices from phone calls). Alex shown around at own pace. Met Jordan briefly (Jordan waved from doorway). Low-key evening with choice of activity. Staff available but not hovering. Check at 30-minute intervals until settled.",
    keyWorkerIntro: "Ryan spoke to Alex on the phone twice before admission. Anna allocated as key worker but Ryan did the admission for continuity. Alex met Anna on day 2.",
    notes: "Alex's transition was relatively smooth. Previous foster placement ended amicably (foster carer retiring) so Alex was less traumatised by the move. The personalised room was the standout — Alex talks about the stars on the ceiling regularly. Demonstrates that small gestures make huge impact.",
  },
  {
    id: "wp_004",
    youngPersonId: "yp_alex",
    preparedBy: "staff_darren",
    preparedDate: d(-2),
    admissionDate: d(5),
    status: "preparing",
    items: [
      { item: "New bedding (to be chosen by child from options)", category: "bedroom", provided: false, personalised: true, notes: "Options sent to SW — awaiting child's choice" },
      { item: "Toiletries bag — branded products", category: "toiletries", provided: true, personalised: false, notes: "Standard pack ready" },
      { item: "Snack box (preferences being confirmed)", category: "food", provided: false, personalised: true, notes: "SW asked to confirm dietary needs/preferences" },
      { item: "Welcome card — staff to sign this week", category: "comfort", provided: false, personalised: true, notes: "Will be handwritten" },
      { item: "Children's Guide", category: "information", provided: true, personalised: false, notes: "Ready" },
      { item: "Key worker photo and intro letter", category: "information", provided: false, personalised: true, notes: "Edward allocated — letter being written" },
      { item: "Wi-Fi card and phone charger", category: "information", provided: true, personalised: false, notes: "Ready" },
      { item: "Door name sign (design TBC)", category: "bedroom", provided: false, personalised: true, notes: "Awaiting child's preference" },
      { item: "Comfort item (age-appropriate)", category: "comfort", provided: false, personalised: true, notes: "Asking SW what would be meaningful" },
      { item: "£10 pocket money advance", category: "personal", provided: true, personalised: false, notes: "Ready" },
    ],
    personalTouches: [
      "Room being freshly painted (child asked for a specific colour via SW — sage green)",
      "Edward (key worker) to visit child at current placement this week",
      "First night meal preference being confirmed",
      "Existing children being prepared via house meeting",
    ],
    childFeedback: null,
    firstNightPlan: "Edward and Anna on shift. Gradual introduction plan — child has visited once already and knows the layout. Other children informed and prepared. No major activities planned for admission evening. Quiet, welcoming, no pressure.",
    keyWorkerIntro: "Edward visiting child at current placement this Thursday. Building relationship before admission day.",
    notes: "This is for Child T (pending referral from batch — Placement Impact Assessment approved subject to conditions). Preparation underway. Learning from previous admissions being applied — advance personalisation, relationship building, sensory/preference information gathered early.",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<WelcomePack>[] = [
  { header: "Young Person", accessor: (r: WelcomePack) => getYPName(r.youngPersonId) },
  { header: "Prepared By", accessor: (r: WelcomePack) => getStaffName(r.preparedBy) },
  { header: "Prepared Date", accessor: (r: WelcomePack) => r.preparedDate },
  { header: "Admission Date", accessor: (r: WelcomePack) => r.admissionDate },
  { header: "Status", accessor: (r: WelcomePack) => r.status },
  { header: "Items", accessor: (r: WelcomePack) => r.items.length.toString() },
  { header: "Personalised Items", accessor: (r: WelcomePack) => r.items.filter((i) => i.personalised).length.toString() },
  { header: "Child Feedback", accessor: (r: WelcomePack) => r.childFeedback ?? "N/A" },
];

/* ─── component ─── */
export default function WarmWelcomePacksPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...packs];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.admissionDate.localeCompare(a.admissionDate);
        case "name":
          return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default:
          return 0;
      }
    });
    return list;
  }, [filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = packs.length;
    const delivered = packs.filter((p) => p.status === "delivered").length;
    const preparing = packs.filter((p) => p.status === "preparing").length;
    const avgItems = Math.round(packs.reduce((s, p) => s + p.items.length, 0) / packs.length);
    const personalisedPct = Math.round(
      (packs.reduce((s, p) => s + p.items.filter((i) => i.personalised).length, 0) /
        packs.reduce((s, p) => s + p.items.length, 0)) * 100
    );
    return { total, delivered, preparing, avgItems, personalisedPct };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const statusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case "preparing":
        return <Badge className="bg-amber-100 text-amber-800">Preparing</Badge>;
      case "template":
        return <Badge variant="outline">Template</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case "bedroom": return <Home className="h-3 w-3" />;
      case "comfort": return <Heart className="h-3 w-3" />;
      case "personal": return <Star className="h-3 w-3" />;
      case "food": return <Gift className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  return (
    <PageShell
      title="Warm Welcome Packs"
      subtitle="Personalised admission preparation — making children feel expected, wanted, and valued from day one"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={packs} columns={exportCols} filename="welcome-packs" />
          <PrintButton title="Warm Welcome Packs" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Packs Created</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.preparing}</p>
            <p className="text-xs text-muted-foreground">In Preparation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.avgItems}</p>
            <p className="text-xs text-muted-foreground">Avg Items/Pack</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.personalisedPct}%</p>
            <p className="text-xs text-muted-foreground">Personalised</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── philosophy note ─── */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <Heart className="h-5 w-5 text-pink-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-pink-800">Our Welcome Philosophy</p>
            <p className="text-xs text-pink-700 mt-1">
              Every child arriving at Oak House should feel expected, wanted, and thought about.
              Welcome packs are personalised using advance information — never generic.
              First impressions matter: a child who feels welcomed is more likely to settle,
              attach, and thrive. We ask: &quot;Would a good parent do this for their child?&quot;
            </p>
          </div>
        </div>
      </div>

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="delivered">Delivered</option>
          <option value="preparing">Preparing</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Admission Date</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* ─── pack cards ─── */}
      <div className="space-y-4">
        {filtered.map((pack) => {
          const expanded = expandedId === pack.id;
          const personalisedCount = pack.items.filter((i) => i.personalised).length;

          return (
            <Card key={pack.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(pack.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-pink-100">
                      <Gift className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(pack.youngPersonId)} — {pack.status === "preparing" ? "Upcoming" : "Admission"}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(pack.status)}
                        <span className="text-xs text-muted-foreground">
                          {pack.items.length} items ({personalisedCount} personalised)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pack.admissionDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* items checklist */}
                  <div>
                    <p className="text-sm font-medium mb-2">Pack Contents</p>
                    <div className="space-y-1.5">
                      {pack.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <div className={cn(
                            "mt-0.5 shrink-0",
                            item.provided ? "text-green-600" : "text-gray-300"
                          )}>
                            {item.provided ? <CheckCircle2 className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(!item.provided && "text-muted-foreground")}>{item.item}</span>
                              {item.personalised && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0">
                                  <Star className="h-2.5 w-2.5 mr-0.5" /> Personal
                                </Badge>
                              )}
                            </div>
                            {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* personal touches */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Heart className="h-4 w-4 text-pink-600" /> Personal Touches
                    </p>
                    <ul className="space-y-1">
                      {pack.personalTouches.map((pt, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-pink-400 mt-1.5">♥</span> {pt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* first night plan */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-indigo-800 mb-1">First Night Plan</p>
                    <p className="text-sm text-indigo-700">{pack.firstNightPlan}</p>
                  </div>

                  {/* key worker intro */}
                  <div>
                    <p className="text-sm font-medium mb-1">Key Worker Introduction</p>
                    <p className="text-sm text-muted-foreground">{pack.keyWorkerIntro}</p>
                  </div>

                  {/* child feedback */}
                  {pack.childFeedback && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 mb-1">Child&apos;s Feedback</p>
                      <p className="text-sm text-green-700">{pack.childFeedback}</p>
                    </div>
                  )}

                  {/* notes */}
                  {pack.notes && (
                    <div className="bg-muted/30 rounded-md p-3">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{pack.notes}</p>
                    </div>
                  )}

                  {/* footer */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Prepared By</p>
                      <p className="text-sm font-medium">{getStaffName(pack.preparedBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Prepared</p>
                      <p className="text-sm font-medium">{pack.preparedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Admission</p>
                      <p className="text-sm font-medium">{pack.admissionDate}</p>
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
          Quality Standard 1 (Child-Centred Care) requires that children feel welcome, safe, and
          valued from the point of admission. Regulation 14 (Admissions) requires preparation for
          the child&apos;s arrival. The SCCIF examines whether children feel they &quot;belong&quot;
          and whether the home makes efforts to understand and meet their individual needs from
          day one. Personalised welcome packs demonstrate that the child was expected, thought
          about, and prepared for — not just &quot;placed.&quot;
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
