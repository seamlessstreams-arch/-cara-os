"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Shield, CheckCircle2, Clock, AlertTriangle, User, Users, Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type PlanStatus = "current" | "review_due";

interface SaferCaringPlan {
  id: string;
  staffId: string;
  role: string;
  signedDate: string;
  reviewDate: string;
  status: PlanStatus;
  physicalContactGuidance: string;
  professionalBoundaries: string[];
  socialMediaRules: string;
  loneWorkingProtocol: string;
  giftGiving: string;
  transport: string;
  personalInformation: string;
  childSpecificConsiderations: Record<string, string>;
  acknowledgements: { signedDate: string; witnessedBy: string };
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_LABEL: Record<PlanStatus, string> = { current: "Current", review_due: "Review Due" };
const STATUS_CLR: Record<PlanStatus, string> = { current: "bg-green-100 text-green-800", review_due: "bg-amber-100 text-amber-800" };
const BORDER_STATUS: Record<PlanStatus, string> = { current: "border-l-green-400", review_due: "border-l-amber-400" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SaferCaringPlan[] = [
  {
    id: "sc_1",
    staffId: "staff_darren",
    role: "Registered Manager",
    signedDate: d(-90),
    reviewDate: d(92),
    status: "current",
    physicalContactGuidance: "As RM, physical contact should be minimal and professional. A brief hand on shoulder to reassure is acceptable. High five if initiated by young person. No hugging unless young person clearly initiates during acute distress and another staff member is present or CCTV covers the area. All physical interventions must be recorded regardless of duration.",
    professionalBoundaries: [
      "Maintain clear authority boundary — friendly but not friends",
      "Do not share personal mobile number with young people",
      "Supervisions and 1:1 meetings held in office with door open or window visible",
      "Model appropriate boundaries for the staff team at all times",
      "No favouritism — distribute time and attention equitably across all young people",
      "Professional dress at all times when on shift",
    ],
    socialMediaRules: "No social media contact with any young person, their family, or former residents until 3 years post-placement. No posting of photos that identify the home, staff, or children. Privacy settings on personal accounts must be maximum. Do not accept friend requests from parents/carers of looked-after children.",
    loneWorkingProtocol: "RM may be lone working in the office during daytime — door remains open. Not appropriate to be alone in the home with a single young person for extended periods without clear operational reason. If attending out of hours, notify RI.",
    giftGiving: "Staff must not give personal gifts to young people. Birthday/Christmas gifts purchased from home budget only. No loans of money. If a young person offers a gift, politely decline and explain why — record in daily log.",
    transport: "May transport young people in home vehicle only. Another staff member or young person should be present where possible. If transporting alone, notify home by text on departure and arrival. Vehicle journeys recorded in transport log.",
    personalInformation: "Do not disclose home address, details of own children, relationship status, or financial matters. May share general interests (e.g., football, cooking) to build rapport. First name basis only.",
    childSpecificConsiderations: {
      yp_alex: "Alex tests authority boundaries — maintain consistency. Do not engage in power struggles. Use planned ignoring for low-level attention-seeking. Alex responds well to calm, firm redirection.",
      yp_jordan: "Jordan has trauma responses triggered by raised voices and sudden movements. Always approach from the front with verbal warning. No unexpected physical contact. De-escalation space must be offered before any direct conversation about behaviour.",
      yp_casey: "Casey is prone to forming intense attachments to male authority figures. Maintain warm but boundaried relationship. Avoid 1:1 conversations behind closed doors. Discuss any boundary-pushing in supervision immediately.",
    },
    acknowledgements: { signedDate: d(-90), witnessedBy: "staff_ryan" },
  },
  {
    id: "sc_2",
    staffId: "staff_ryan",
    role: "Deputy Manager",
    signedDate: d(-85),
    reviewDate: d(97),
    status: "current",
    physicalContactGuidance: "High five or fist bump if initiated by young person. Side arm around shoulder acceptable for Jordan during distress — agreed with therapist and documented in care plan. No full-body hugs. If a young person attempts to hug, gently redirect to side-by-side position. Physical interventions only as last resort per PRICE training.",
    professionalBoundaries: [
      "Maintain professional distance — warm and approachable but not a peer",
      "Do not discuss personal relationship matters with young people",
      "When deputising for RM, maintain all RM boundary expectations",
      "Challenge any staff observed crossing professional boundaries — record and escalate",
      "Avoid becoming the 'favourite' staff member — rotate key activities between team",
    ],
    socialMediaRules: "No social media contact with current or recent residents. Do not post anything identifiable about work. No photos of young people on personal devices. If contacted by young person on social media, do not respond — report to RM and block.",
    loneWorkingProtocol: "May work alone in office for admin tasks. Should not be sole staff member with a single young person for extended periods. When on call and attending the home, text RM on arrival and departure. Building checks should involve informing a colleague.",
    giftGiving: "No personal gifts. Facilitate young people buying gifts for family using their own money or placement allowance. Do not accept gifts from young people — if offered, redirect the gesture and record in log.",
    transport: "Approved driver for home vehicle. When transporting Jordan alone, maintain verbal commentary and radio on for comfort. Log all journeys. If Casey requires transport alone, a second staff member must attend where operationally possible.",
    personalInformation: "May share that he has experience in youth work and enjoys football. Do not discuss personal finances, relationships, or home life in detail. First name basis.",
    childSpecificConsiderations: {
      yp_alex: "Alex responds well to Ryan's calm approach. Use sport-based activities to build rapport. If Alex becomes dysregulated, offer outdoor space and time before discussing the incident.",
      yp_jordan: "Primary key worker. Trauma-informed approach — no sudden touch, verbal warnings before entering personal space. Jordan has agreed physical comfort boundary: side shoulder contact only. Review monthly.",
      yp_casey: "Casey may attempt to triangulate Ryan against other staff — maintain consistent team messaging. Any disclosures must be shared in handover immediately.",
    },
    acknowledgements: { signedDate: d(-85), witnessedBy: "staff_darren" },
  },
  {
    id: "sc_3",
    staffId: "staff_anna",
    role: "Senior Residential Care Worker",
    signedDate: d(-75),
    reviewDate: d(107),
    status: "current",
    physicalContactGuidance: "Gentle hand on arm or shoulder acceptable to reassure. May offer a brief hug to Casey if Casey initiates and is visibly distressed — female staff physical comfort is part of Casey's care plan. High fives and fist bumps welcome from all young people. Hair styling/braiding acceptable as part of relationship-building with Casey — agreed in care plan.",
    professionalBoundaries: [
      "Maintain warm, nurturing but professional stance",
      "Do not share details of own family with young people beyond general references",
      "1:1 keywork sessions in communal areas or office with visible window",
      "Do not form exclusive relationships with one young person at the expense of others",
      "Set clear expectations about availability — young people should not depend on one staff member exclusively",
    ],
    socialMediaRules: "No social media contact with young people or families. No work-related posts. If recognised in public by a former resident, respond briefly and warmly but do not exchange contact details.",
    loneWorkingProtocol: "May take young people on 1:1 community outings as per outing risk assessment. Text home on departure and arrival. Hourly check-in for outings over 2 hours. Not appropriate to have young people visit Anna's home or meet Anna's family.",
    giftGiving: "No personal gifts. May help young people make or select gifts for others using home budget. If Casey gives a handmade card or artwork, may accept with thanks and record in log.",
    transport: "Approved driver. Regularly transports Casey for art therapy. Pre-agreed route logged. Music/radio on during journeys. If young person discloses during transport, pull over safely to listen, then report on return.",
    personalInformation: "May share interest in art, cooking, and walking. Has shared that she has a dog. Do not share home address, partner details, or information about own childhood.",
    childSpecificConsiderations: {
      yp_alex: "Alex can be dismissive of female staff — do not take personally. Use indirect communication (activities, car conversations) rather than direct face-to-face discussion when possible.",
      yp_jordan: "Be aware Jordan may struggle with female attachment figures due to early experience. Maintain consistency and predictability. Do not promise things that cannot be delivered.",
      yp_casey: "Key worker. Casey has strong bond with Anna. Monitor for over-dependency. Hair/beauty activities are part of the plan but should not become exclusive — encourage peer relationships too.",
    },
    acknowledgements: { signedDate: d(-75), witnessedBy: "staff_darren" },
  },
  {
    id: "sc_4",
    staffId: "staff_chervelle",
    role: "Residential Care Worker",
    signedDate: d(-60),
    reviewDate: d(122),
    status: "current",
    physicalContactGuidance: "High fives and fist bumps acceptable. Brief side-by-side shoulder contact if young person is upset and initiates closeness. No full hugs. Maintain awareness of body language — step back if young person appears uncomfortable with proximity. PRICE-trained for any required physical intervention.",
    professionalBoundaries: [
      "Friendly and engaging but maintain professional role clarity",
      "Do not use slang or language that blurs adult-child boundary",
      "Avoid discussing personal social life, nights out, or relationships",
      "If a young person asks personal questions, redirect with warmth: 'This time is about you'",
      "Maintain consistent expectations regardless of shift tiredness or personal mood",
    ],
    socialMediaRules: "Strict no-contact policy on all platforms. Privacy settings at maximum. Do not post location data when working. Do not discuss young people in any online forum, even anonymously. If approached online, block and report to RM.",
    loneWorkingProtocol: "Should not be sole staff with any young person unless covering an emergency and senior staff are en route. When waking night or sleep-in, follow lone working assessment protocols. Buddy check with on-call at agreed times.",
    giftGiving: "No gifts to or from young people. If a young person buys or makes a gift, thank them, explain the policy gently, and record in log. Gifts can be kept in the young person's file as a memory item.",
    transport: "Approved driver. Must not transport young people in personal vehicle under any circumstances. Home vehicle only. Log all journeys. Avoid unnecessary detours.",
    personalInformation: "May share cultural background and interests in music and cooking. Do not share home address, partner details, immigration status, or details about own children.",
    childSpecificConsiderations: {
      yp_alex: "Alex may make inappropriate comments about cultural background — address calmly and directly. Log any racist language. Do not react with anger — use planned de-escalation.",
      yp_jordan: "Jordan enjoys cooking with Chervelle — use this as a relationship-building tool. Maintain verbal check-ins during the activity. Avoid standing behind Jordan.",
      yp_casey: "Casey responds well to Chervelle's calm energy. Encourage independence and peer relationships. Avoid becoming a substitute parent figure.",
    },
    acknowledgements: { signedDate: d(-60), witnessedBy: "staff_darren" },
  },
  {
    id: "sc_5",
    staffId: "staff_edward",
    role: "Residential Care Worker",
    signedDate: d(-55),
    reviewDate: d(127),
    status: "current",
    physicalContactGuidance: "As a male staff member, heightened awareness of physical contact required. High fives and fist bumps only. No hugging or extended physical contact. If a young person initiates a hug, gently redirect to a handshake or fist bump. PRICE-trained — physical intervention only as last resort with immediate recording.",
    professionalBoundaries: [
      "Clear professional role — avoid 'older brother' dynamic with Alex",
      "Do not engage in play-fighting, wrestling, or rough physical games",
      "Bedroom door checks: knock, verbal warning, wait for response before entering",
      "Never enter bathroom when occupied by any young person",
      "Maintain visibility at all times — avoid being alone in rooms with closed doors",
      "If driving 1:1 with Casey, a second staff member should be present",
    ],
    socialMediaRules: "Zero tolerance for social media contact. Do not use personal phone to photograph anything work-related. Personal social media must not reference work location, children's names, or any identifying details. Gaming accounts must not connect with any young person.",
    loneWorkingProtocol: "Should not be lone working with Casey at any time — this is a Casey-specific safeguard reflecting her vulnerability around male attachment figures. May work alone with Alex for short activities (football, gaming) provided another staff member is in the building and aware.",
    giftGiving: "No gifts. Do not lend personal items (games, headphones, etc.) to young people. If a young person borrows something, record and ensure it is returned the same shift.",
    transport: "May transport Alex and Jordan in home vehicle. Must not transport Casey alone — second staff always required. Log all journeys. No personal vehicle use.",
    personalInformation: "May share interest in gaming, football, and fitness. Do not share relationship status, home address, or personal social media handles. If asked, explain professional boundaries warmly.",
    childSpecificConsiderations: {
      yp_alex: "Good rapport built through gaming and football. Maintain 'positive male role model' approach but avoid becoming exclusive. Encourage Alex to engage with all staff. Monitor for any idealization/devaluation pattern.",
      yp_jordan: "Jordan may be wary of male staff due to past experiences. Do not take rejection personally. Allow Jordan to set the pace. No physical contact unless Jordan clearly initiates. Approach always from front.",
      yp_casey: "Specific safeguard: never alone with Casey. All interactions in communal spaces with other staff present. If Casey seeks Edward out for 1:1 conversation, redirect to female staff or communal area. Record and discuss in supervision.",
    },
    acknowledgements: { signedDate: d(-55), witnessedBy: "staff_ryan" },
  },
  {
    id: "sc_6",
    staffId: "staff_lackson",
    role: "Residential Care Worker",
    signedDate: d(-50),
    reviewDate: d(132),
    status: "current",
    physicalContactGuidance: "As a male staff member, maintain awareness of touch boundaries. High fives acceptable. Fist bumps with Alex are a regular greeting and rapport tool. No extended physical contact. If Jordan is in distress, offer verbal comfort and proximity but not touch unless Jordan explicitly requests it. Physical intervention only via PRICE.",
    professionalBoundaries: [
      "Maintain professional warmth — avoid overly casual approach",
      "Do not discuss personal financial matters or living arrangements",
      "Night shifts: maintain all physical contact and lone working protocols with heightened awareness",
      "Record any incident involving touch or proximity immediately",
      "Challenge any young person who attempts to blur boundaries (inappropriate questions, gifts, etc.)",
    ],
    socialMediaRules: "No contact with young people or families on any platform. Do not post work schedules or shift patterns online. Gaming online: do not accept friend requests from anyone under 18 unless personally known outside of work.",
    loneWorkingProtocol: "Waking night lone worker — follow lone working risk assessment. Buddy check with on-call at 00:00 and 04:00. Sleep-in colleague always present as backup. Do not enter young people's bedrooms alone at night unless responding to an emergency — knock and announce.",
    giftGiving: "No personal gifts. If young person gives a gift, decline politely, explain the boundary, and log. Christmas and birthday gifts from home budget only.",
    transport: "Approved driver. May transport Alex and Jordan. Should not transport Casey alone — same safeguard as Edward. Log all journeys in transport book.",
    personalInformation: "May share interest in football, gaming, and cooking. Do not share home address, relationship details, or family information. First name only.",
    childSpecificConsiderations: {
      yp_alex: "Alex enjoys late-night gaming conversations with Lackson during waking nights. Keep these in communal areas (lounge). Set clear bedtime expectations. Do not allow Alex to stay up past agreed time even if rapport-building feels positive.",
      yp_jordan: "During waking nights, Jordan occasionally wakes distressed. Approach bedroom door, knock, and speak through the door initially. Only enter if Jordan invites. Offer warm drink and calm conversation in the kitchen. Record night disturbances.",
      yp_casey: "Casey should not be alone with male night staff. If Casey wakes distressed, female sleep-in should be woken to support. Lackson to remain in communal area and support from a distance.",
    },
    acknowledgements: { signedDate: d(-50), witnessedBy: "staff_darren" },
  },
  {
    id: "sc_7",
    staffId: "staff_mirela",
    role: "Residential Care Worker",
    signedDate: d(-20),
    reviewDate: d(162),
    status: "review_due",
    physicalContactGuidance: "Warm and nurturing approach acceptable. May offer a brief hug if young person initiates and is in distress. Side-by-side sitting close together during activities is fine. Hair care and personal care support for Casey as agreed in placement plan. Always ask before any physical contact: 'Would you like a hug or would you prefer some space?'",
    professionalBoundaries: [
      "New to team — maintain strong boundaries while building relationships",
      "Seek supervision proactively if unsure about any boundary decision",
      "Do not make promises to young people that have not been agreed by the team",
      "Avoid being drawn into 'secret' conversations — explain that safety means sharing with the team",
      "Report any boundary concerns about self or others immediately",
    ],
    socialMediaRules: "No social media contact. As newer staff member, ensure all personal accounts are fully locked down. Remove any previous posts that reference working with children. Do not discuss placement at Oak House with friends online, even without names.",
    loneWorkingProtocol: "During induction period (first 3 months), should not be sole staff with any young person. After induction, standard lone working protocols apply. If unsure, always ask senior staff before proceeding.",
    giftGiving: "No personal gifts. Do not bring food from home specifically for one young person — if sharing home-cooked food, bring enough for all. Follow team protocol on birthday/Christmas gifts.",
    transport: "Provisional approval for home vehicle pending completion of driving assessment. Until approved, should not drive young people. May accompany another driver.",
    personalInformation: "May share cultural background, language skills, and interests. Do not share immigration or visa details with young people. Do not disclose home address or family details. Young people may be curious about accent/background — answer general questions only.",
    childSpecificConsiderations: {
      yp_alex: "Building relationship slowly. Alex may test new staff members with boundary-pushing behaviour. Remain calm, consistent, and seek support from senior team when needed.",
      yp_jordan: "Mirela's calm approach is beneficial for Jordan. Take time to build trust — do not rush closeness. Follow Jordan's lead on proximity and physical contact.",
      yp_casey: "Casey may form a quick attachment to new female staff. Monitor intensity of relationship. Encourage Casey to maintain relationships with all staff, not just preferred females.",
    },
    acknowledgements: { signedDate: d(-20), witnessedBy: "staff_anna" },
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function StaffSaferCaringPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return getStaffName(r.staffId).toLowerCase().includes(q) || r.role.toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "name": return getStaffName(a.staffId).localeCompare(getStaffName(b.staffId));
        case "review": return a.reviewDate.localeCompare(b.reviewDate);
        case "role": return a.role.localeCompare(b.role);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterStatus, sortBy]);

  const totalPlans = data.length;
  const currentCount = data.filter((r) => r.status === "current").length;
  const currentPct = Math.round((currentCount / totalPlans) * 100);
  const reviewDueCount = data.filter((r) => r.status === "review_due").length;

  const exportCols: ExportColumn<SaferCaringPlan>[] = [
    { header: "Staff", accessor: (r: SaferCaringPlan) => getStaffName(r.staffId) },
    { header: "Role", accessor: (r: SaferCaringPlan) => r.role },
    { header: "Status", accessor: (r: SaferCaringPlan) => STATUS_LABEL[r.status] },
    { header: "Signed", accessor: (r: SaferCaringPlan) => r.signedDate },
    { header: "Review Due", accessor: (r: SaferCaringPlan) => r.reviewDate },
    { header: "Physical Contact", accessor: (r: SaferCaringPlan) => r.physicalContactGuidance },
    { header: "Boundaries", accessor: (r: SaferCaringPlan) => r.professionalBoundaries.join("; ") },
    { header: "Social Media", accessor: (r: SaferCaringPlan) => r.socialMediaRules },
    { header: "Lone Working", accessor: (r: SaferCaringPlan) => r.loneWorkingProtocol },
    { header: "Gift Giving", accessor: (r: SaferCaringPlan) => r.giftGiving },
    { header: "Transport", accessor: (r: SaferCaringPlan) => r.transport },
    { header: "Personal Info", accessor: (r: SaferCaringPlan) => r.personalInformation },
  ];

  return (
    <PageShell title="Safer Caring Plans" subtitle="Children's Homes (England) Regulations 2015 · Schedule 1 · Safer Recruitment" actions={<div className="flex items-center gap-2"><PrintButton title="Safer Caring Plans" /><ExportButton data={filtered} columns={exportCols} filename="safer-caring-plans" /></div>}>
      <div id="print-area">
        {/* ── summary stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Plans in Place", value: totalPlans, icon: Shield, clr: "text-blue-600" },
            { label: "Current", value: `${currentCount} (${currentPct}%)`, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Review Due", value: reviewDueCount, icon: Clock, clr: "text-amber-600" },
            { label: "Children Covered", value: 3, icon: Users, clr: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {/* ── filters ── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff, role…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="current">Current</SelectItem><SelectItem value="review_due">Review Due</SelectItem></SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">By Name</SelectItem><SelectItem value="review">By Review Date</SelectItem><SelectItem value="role">By Role</SelectItem></SelectContent></Select>
        </div>

        {/* ── plan cards ── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_STATUS[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {getStaffName(r.staffId)} — {r.role}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Signed: {r.signedDate} · Review: {r.reviewDate} · Witnessed by: {getStaffName(r.acknowledgements.witnessedBy)}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* Physical Contact */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-800 mb-1 flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Physical Contact Guidance</p>
                      <p className="text-blue-700 text-xs">{r.physicalContactGuidance}</p>
                    </div>

                    {/* Professional Boundaries */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="font-medium text-green-800 mb-2 flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Professional Boundaries</p>
                      <ul className="space-y-1">{r.professionalBoundaries.map((b, i) => (
                        <li key={i} className="text-xs text-green-700 flex items-start gap-1"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" /> {b}</li>
                      ))}</ul>
                    </div>

                    {/* Social Media */}
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="font-medium text-purple-800 mb-1">Social Media Rules</p>
                      <p className="text-purple-700 text-xs">{r.socialMediaRules}</p>
                    </div>

                    {/* Lone Working */}
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="font-medium text-amber-800 mb-1">Lone Working Protocol</p>
                      <p className="text-amber-700 text-xs">{r.loneWorkingProtocol}</p>
                    </div>

                    {/* Additional policies grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-700 mb-1 text-xs">Gift Giving</p>
                        <p className="text-gray-600 text-xs">{r.giftGiving}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-700 mb-1 text-xs">Transport</p>
                        <p className="text-gray-600 text-xs">{r.transport}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-700 mb-1 text-xs">Personal Information</p>
                        <p className="text-gray-600 text-xs">{r.personalInformation}</p>
                      </div>
                    </div>

                    {/* Child-Specific Considerations */}
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="font-medium text-red-800 mb-2 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Child-Specific Considerations</p>
                      <div className="space-y-2">
                        {Object.entries(r.childSpecificConsiderations).map(([childId, note]) => (
                          <div key={childId} className="text-xs">
                            <span className="font-medium text-red-700">{getYPName(childId)}:</span>{" "}
                            <span className="text-red-600">{note}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Acknowledgement */}
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Plan signed: {r.acknowledgements.signedDate} · Witnessed by: {getStaffName(r.acknowledgements.witnessedBy)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework &amp; Safer Caring Culture</p>
          <p className="mb-2">
            Children&apos;s Homes (England) Regulations 2015, Schedule 1 — all staff must undergo enhanced DBS checks and barred list checks as part of safer recruitment. Safer caring plans are individual documents that protect both children and staff by making explicit the expected behaviours, boundaries, and protocols for each team member relative to the children in placement.
          </p>
          <p className="mb-2">
            Plans are reviewed at least annually, or sooner if: a new child is admitted; a concern or allegation arises; the staff member&apos;s role changes; or following a significant incident. All staff must sign their plan and have it witnessed by a senior colleague.
          </p>
          <p>
            Oak House operates a whistleblowing culture where any staff member can raise concerns about the conduct of a colleague without fear of reprisal. Concerns about professional boundaries, physical contact, or inappropriate relationships must be reported to the Registered Manager or, if the concern involves the RM, directly to the Responsible Individual or Ofsted.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
