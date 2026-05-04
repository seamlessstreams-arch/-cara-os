"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Heart,
  Shield,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Users,
  AlertTriangle,
  BookOpen,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FirstRelationshipRecord {
  id: string;
  youngPerson: string;
  recordDate: string;
  relationshipStatus:
    | "Expressing interest in dating"
    | "First crush identified"
    | "Early relationship — talking stage"
    | "Established first relationship"
    | "Recently ended first relationship"
    | "Not currently interested";
  partnerInfo?: string;
  partnerAge?: string;
  ageGapOk?: boolean;
  howTheyMet?: string;
  childLedDisclosure: boolean;
  rseTopicsCovered: string[];
  consentEducationLevel: "Not yet introduced" | "Foundational" | "Developing" | "Confident";
  exploitationRiskScreen: "No concerns" | "Watch" | "Concerns identified" | "Active concerns — escalated";
  riskFactorsNoted: string[];
  protectiveFactorsNoted: string[];
  supportOffered: string[];
  childVoice: string;
  staffObservation: string;
  parentCarerInvolved?: string;
  socialWorkerNotified: boolean;
  followUpDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: FirstRelationshipRecord[] = [
  {
    id: "rel_001",
    youngPerson: "yp_jordan",
    recordDate: d(-21),
    relationshipStatus: "Established first relationship",
    partnerInfo: "Maya — Year 11 at same school, met through football coaching",
    partnerAge: "16",
    ageGapOk: true,
    howTheyMet: "School and football club — known each other 8 months",
    childLedDisclosure: true,
    rseTopicsCovered: [
      "Healthy vs unhealthy relationships",
      "Consent — ongoing, enthusiastic, reversible",
      "Communication and disagreement",
      "Online safety in relationships",
      "Contraception (signposted to GP)",
    ],
    consentEducationLevel: "Confident",
    exploitationRiskScreen: "No concerns",
    riskFactorsNoted: [],
    protectiveFactorsNoted: [
      "Same age, same school",
      "Open with staff and mentor",
      "Maya has met Darren (RM) informally",
      "Family of Maya know Jordan",
      "Healthy boundaries discussed",
    ],
    supportOffered: [
      "1:1 with Anna — what does respect look like",
      "RSE recap on consent",
      "Signposted to GP for contraception conversation",
      "Discussed managing first arguments",
      "Curfew unchanged — trust-based",
    ],
    childVoice:
      "I really like her. We've talked about going slow. I told her about being in care and she was cool. I want to do this right.",
    staffObservation:
      "Jordan is approaching this maturely. Communicating openly with team. No concerning behaviours observed. Mood stable, school attendance maintained. Appropriate amount of time together — not isolating from other friendships.",
    parentCarerInvolved: "Mum aware and supportive (told her on contact)",
    socialWorkerNotified: true,
    followUpDate: d(14),
    keyWorker: "staff_anna",
  },
  {
    id: "rel_002",
    youngPerson: "yp_alex",
    recordDate: d(-7),
    relationshipStatus: "First crush identified",
    partnerInfo: "Boy in boxing club — name not shared yet",
    partnerAge: "Unknown",
    ageGapOk: undefined,
    howTheyMet: "Boxing gym",
    childLedDisclosure: true,
    rseTopicsCovered: [
      "Sexuality is yours to define on your timeline",
      "Coming out is a choice — yours alone",
      "Crushes are normal and healthy",
      "What healthy attraction looks like",
    ],
    consentEducationLevel: "Developing",
    exploitationRiskScreen: "Watch",
    riskFactorsNoted: [
      "Age and identity of crush unknown — Alex hesitant to share",
      "History of trauma — may struggle to recognise unhealthy dynamics",
      "Not yet out to family",
    ],
    protectiveFactorsNoted: [
      "Confiding in trusted staff",
      "Boxing coach is safeguarding-trained and known to home",
      "Strong relationship with Anna",
      "Engaging with RSE",
    ],
    supportOffered: [
      "Affirming response — sexuality belongs to Alex",
      "No pressure to disclose name or details until ready",
      "RSE on identity and healthy first relationships",
      "Signposted to LGBTQ+ youth group (not pushed)",
      "Reassurance about confidentiality and Alex's pace",
    ],
    childVoice:
      "I think I like him. I'm not ready to say his name. Don't tell my mum. I want to figure it out myself first.",
    staffObservation:
      "Alex disclosed during 1:1 — felt safe enough to share. Visibly nervous. Watch for any sign of older partner or unhealthy dynamic. Will gently check in next session about age. Respect Alex's pace on family disclosure.",
    socialWorkerNotified: false,
    followUpDate: d(7),
    keyWorker: "staff_anna",
  },
  {
    id: "rel_003",
    youngPerson: "yp_casey",
    recordDate: d(-14),
    relationshipStatus: "Not currently interested",
    childLedDisclosure: true,
    rseTopicsCovered: [
      "Asexuality and not being interested is valid",
      "Friendships can be the most important relationships",
      "No timeline for when to be interested",
      "Body autonomy and consent",
    ],
    consentEducationLevel: "Developing",
    exploitationRiskScreen: "No concerns",
    riskFactorsNoted: [],
    protectiveFactorsNoted: [
      "Strong friendship with Ellie",
      "Self-aware about own pace",
      "Engaged with RSE — felt validated by ace content",
      "Open with mentor",
    ],
    supportOffered: [
      "Reassurance — no pressure to date",
      "RSE adapted to include ace/aro identities",
      "Conversation about what makes a 'best person' (friendship)",
      "No follow-up unless Casey raises",
    ],
    childVoice:
      "I don't fancy anyone. I don't think I want to. People at school keep asking and it's annoying. Ellie said it's fine.",
    staffObservation:
      "Casey is comfortable with own position. RSE session affirming — Casey commented 'oh that's a thing then'. No signs of distress. Discussed how to respond to peer pressure at school.",
    socialWorkerNotified: false,
    followUpDate: d(60),
    keyWorker: "staff_anna",
  },
];

const exportCols: ExportColumn<FirstRelationshipRecord>[] = [
  { header: "Young Person", accessor: (r: FirstRelationshipRecord) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: FirstRelationshipRecord) => r.recordDate },
  { header: "Status", accessor: (r: FirstRelationshipRecord) => r.relationshipStatus },
  { header: "Partner", accessor: (r: FirstRelationshipRecord) => r.partnerInfo ?? "—" },
  { header: "Partner Age", accessor: (r: FirstRelationshipRecord) => r.partnerAge ?? "—" },
  { header: "Child-Led", accessor: (r: FirstRelationshipRecord) => (r.childLedDisclosure ? "Yes" : "No") },
  { header: "Consent Education", accessor: (r: FirstRelationshipRecord) => r.consentEducationLevel },
  { header: "Exploitation Screen", accessor: (r: FirstRelationshipRecord) => r.exploitationRiskScreen },
  { header: "Risk Factors", accessor: (r: FirstRelationshipRecord) => r.riskFactorsNoted.join("; ") },
  { header: "Protective Factors", accessor: (r: FirstRelationshipRecord) => r.protectiveFactorsNoted.join("; ") },
  { header: "Support Offered", accessor: (r: FirstRelationshipRecord) => r.supportOffered.join("; ") },
  { header: "Child Voice", accessor: (r: FirstRelationshipRecord) => r.childVoice },
  { header: "SW Notified", accessor: (r: FirstRelationshipRecord) => (r.socialWorkerNotified ? "Yes" : "No") },
  { header: "Follow-up", accessor: (r: FirstRelationshipRecord) => r.followUpDate },
  { header: "Key Worker", accessor: (r: FirstRelationshipRecord) => getStaffName(r.keyWorker) },
];

const statusColour: Record<FirstRelationshipRecord["relationshipStatus"], string> = {
  "Expressing interest in dating": "bg-purple-100 text-purple-800 border-purple-200",
  "First crush identified": "bg-pink-100 text-pink-800 border-pink-200",
  "Early relationship — talking stage": "bg-rose-100 text-rose-800 border-rose-200",
  "Established first relationship": "bg-red-100 text-red-800 border-red-200",
  "Recently ended first relationship": "bg-amber-100 text-amber-800 border-amber-200",
  "Not currently interested": "bg-slate-100 text-slate-800 border-slate-200",
};

const screenColour: Record<FirstRelationshipRecord["exploitationRiskScreen"], string> = {
  "No concerns": "bg-emerald-100 text-emerald-800 border-emerald-200",
  Watch: "bg-amber-100 text-amber-800 border-amber-200",
  "Concerns identified": "bg-orange-100 text-orange-800 border-orange-200",
  "Active concerns — escalated": "bg-red-100 text-red-800 border-red-200",
};

const consentColour: Record<FirstRelationshipRecord["consentEducationLevel"], string> = {
  "Not yet introduced": "bg-slate-100 text-slate-800 border-slate-200",
  Foundational: "bg-amber-100 text-amber-800 border-amber-200",
  Developing: "bg-blue-100 text-blue-800 border-blue-200",
  Confident: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function FirstRelationshipSupportPage() {
  const [search, setSearch] = useState("");
  const [screenFilter, setScreenFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "screen" | "followup">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        rec.relationshipStatus.toLowerCase().includes(search.toLowerCase()) ||
        (rec.partnerInfo ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesScreen = screenFilter === "all" || rec.exploitationRiskScreen === screenFilter;
      return matchesSearch && matchesScreen;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "screen") return a.exploitationRiskScreen.localeCompare(b.exploitationRiskScreen);
      if (sortBy === "followup") return a.followUpDate.localeCompare(b.followUpDate);
      return b.recordDate.localeCompare(a.recordDate);
    });
    return r;
  }, [search, screenFilter, sortBy]);

  const stats = useMemo(() => {
    const inRelationship = records.filter((r) =>
      ["Established first relationship", "Early relationship — talking stage"].includes(r.relationshipStatus)
    ).length;
    const concerns = records.filter(
      (r) => r.exploitationRiskScreen === "Concerns identified" || r.exploitationRiskScreen === "Active concerns — escalated"
    ).length;
    const watching = records.filter((r) => r.exploitationRiskScreen === "Watch").length;
    const followUpsDue = records.filter((r) => r.followUpDate <= d(7)).length;
    return { inRelationship, concerns, watching, followUpsDue };
  }, []);

  return (
    <PageShell
      title="First Relationship Support"
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="first-relationship-support" />
          <PrintButton title="First Relationship Support" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>In a relationship</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.inRelationship}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Shield className="h-4 w-4" />
            <span>Watch</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.watching}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Concerns flagged</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.concerns}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Users className="h-4 w-4" />
            <span>Follow-ups due (7d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.followUpsDue}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, status, partner..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={screenFilter} onValueChange={setScreenFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Exploitation screen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All screens</SelectItem>
            <SelectItem value="No concerns">No concerns</SelectItem>
            <SelectItem value="Watch">Watch</SelectItem>
            <SelectItem value="Concerns identified">Concerns identified</SelectItem>
            <SelectItem value="Active concerns — escalated">Active concerns</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="screen">Risk screen</SelectItem>
            <SelectItem value="followup">Follow-up date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-slate-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{getYPName(r.youngPerson)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", statusColour[r.relationshipStatus])}>
                      {r.relationshipStatus}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", screenColour[r.exploitationRiskScreen])}>
                      {r.exploitationRiskScreen}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", consentColour[r.consentEducationLevel])}>
                      Consent: {r.consentEducationLevel}
                    </span>
                    {r.childLedDisclosure ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                        Child-led
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Recorded {r.recordDate} · Follow-up {r.followUpDate} · {getStaffName(r.keyWorker)}
                  </div>
                  {r.partnerInfo ? (
                    <div className="text-sm text-slate-700 mt-1">{r.partnerInfo}</div>
                  ) : null}
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" /> Child Voice
                      </div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> RSE Topics Covered
                      </div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.rseTopicsCovered.map((t, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-blue-500">·</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Support Offered</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.supportOffered.map((t, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-emerald-500">·</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {r.protectiveFactorsNoted.length ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                        <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Protective Factors</div>
                        <ul className="text-sm text-emerald-900 space-y-1">
                          {r.protectiveFactorsNoted.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span>+</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.riskFactorsNoted.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Risk Factors Noted</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.riskFactorsNoted.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span>!</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Context & Escalation</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {r.partnerAge ? (
                          <div>
                            <span className="text-slate-500">Partner age:</span> <span className="text-slate-800">{r.partnerAge}</span>
                            {typeof r.ageGapOk === "boolean" ? (
                              <span className={cn("ml-2 text-xs", r.ageGapOk ? "text-emerald-700" : "text-red-700")}>
                                {r.ageGapOk ? "Age-appropriate" : "Age gap concern"}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        {r.howTheyMet ? (
                          <div>
                            <span className="text-slate-500">How met:</span> <span className="text-slate-800">{r.howTheyMet}</span>
                          </div>
                        ) : null}
                        {r.parentCarerInvolved ? (
                          <div>
                            <span className="text-slate-500">Family aware:</span>{" "}
                            <span className="text-slate-800">{r.parentCarerInvolved}</span>
                          </div>
                        ) : null}
                        <div>
                          <span className="text-slate-500">SW notified:</span>{" "}
                          <span className="text-slate-800">{r.socialWorkerNotified ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-pink-200 bg-pink-50 p-4 text-sm text-pink-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          First relationships are a healthy, age-appropriate part of adolescence. Support is grounded in Quality Standard 9
          (Protection of Children) and the RSE statutory curriculum. Practice is informed by Working Together 2023,
          KCSIE 2024 (contextual safeguarding and CSE/CCE awareness), and the UNCRC Articles 12 (voice) and 16 (privacy).
          Disclosures are child-led, paced by the young person, and identity-affirming. Exploitation screening uses the
          Brook Traffic Light Tool framework. No information is shared with family or social workers without the young
          person&rsquo;s knowledge unless safeguarding thresholds are met.
        </p>
      </div>
    </PageShell>
  );
}
