"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Star,
  Heart,
  Users,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  ShieldCheck,
  Award,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MentorRecord {
  id: string;
  youngPerson: string;
  mentorName: string;
  mentorRole:
    | "Imam"
    | "Pandit"
    | "Rabbi"
    | "Pastor / minister"
    | "Cultural elder"
    | "Community leader"
    | "Heritage language teacher"
    | "Faith-aware therapist"
    | "Diaspora mentor"
    | "Other";
  faithCulture: string;
  matchedDate: string;
  introductionMethod: string;
  contactFrequency: "Weekly" | "Fortnightly" | "Monthly" | "As needed" | "Annual events";
  contactSettings: string[];
  rolePlayed: string[];
  safeguardingChecksDone: { check: string; date: string; outcome: string }[];
  homeAwareness: string;
  parentSwAware: boolean;
  meetingsRecord: { date: string; topic: string; outcome: string }[];
  childRelationshipQuality: "Building" | "Settled" | "Strong" | "Central figure";
  challengesNoted: string[];
  childVoice: string;
  staffObservation: string;
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: MentorRecord[] = [
  {
    id: "men_001",
    youngPerson: "yp_jordan",
    mentorName: "Imam Yusuf Rahman",
    mentorRole: "Imam",
    faithCulture: "Islam — Sunni; Pakistani-British heritage shared",
    matchedDate: d(-1460),
    introductionMethod:
      "Pre-care continuity — Jordan attended this mosque with mum from age 8. Relationship preserved into placement (a deliberate care planning decision).",
    contactFrequency: "Weekly",
    contactSettings: [
      "Friday Jumu'ah prayer at mosque",
      "Quarterly 1:1 mentoring session at mosque office (door open, not closed)",
      "Eid celebrations and milestone events",
      "Phone or WhatsApp where Jordan needs counsel between meetings",
    ],
    rolePlayed: [
      "Faith identity anchor — particularly during early-placement instability",
      "Code-switching guide between cultures (school British / mosque Pakistani-British / home mixed)",
      "Spiritual significance of mum's recipes and food traditions",
      "Brother-in-Pakistan support — Yusuf calls his network there to check on Jordan's brother",
      "Eid leadership grooming — Yusuf trusts Jordan with junior welcoming role",
      "Reference letter for college portfolio",
    ],
    safeguardingChecksDone: [
      { check: "DBS Enhanced", date: d(-200), outcome: "Clear — supplied by mosque safeguarding lead" },
      { check: "Mosque safeguarding policy verified", date: d(-200), outcome: "BPCA-aligned, child-protection clear" },
      { check: "Reference from local authority Faith Liaison Officer", date: d(-90), outcome: "Positive — Yusuf is a known and respected leader" },
      { check: "Open-door policy confirmed for 1:1s", date: d(-1460), outcome: "Always door open in mosque office during 1:1" },
    ],
    homeAwareness:
      "Anna and Darren both attended Jumu'ah once at Yusuf's invitation to meet him in his setting (with Jordan's consent). Yusuf has visited the home twice for milestone events.",
    parentSwAware: true,
    meetingsRecord: [
      { date: d(-21), topic: "Eid al-Adha planning + brother in Pakistan", outcome: "Charity portion confirmed; Yusuf's network arranging visit to brother's family" },
      { date: d(-60), topic: "Coaching wages and Zakat — first earned-money charity", outcome: "Jordan made first formal Zakat contribution; spiritual growth noted" },
      { date: d(-120), topic: "College choices and Islamic identity", outcome: "Yusuf supportive of any pathway; reminded Jordan that football is halal and good when intentions are pure" },
    ],
    childRelationshipQuality: "Central figure",
    challengesNoted: [],
    childVoice:
      "Yusuf has known me since I was eight. He doesn't treat me like 'a kid in care'. He treats me like a young Muslim man finding his way. That matters.",
    staffObservation:
      "Yusuf is an extraordinary protective factor for Jordan. The continuity from pre-care to placement was a deliberate care planning win. The relationship is dignified, faith-respectful, safeguarding-checked, and central to Jordan's identity stability.",
    reviewDate: d(120),
    keyWorker: "staff_anna",
  },
];

const exportCols: ExportColumn<MentorRecord>[] = [
  { header: "Young Person", accessor: (r: MentorRecord) => getYPName(r.youngPerson) },
  { header: "Mentor", accessor: (r: MentorRecord) => r.mentorName },
  { header: "Role", accessor: (r: MentorRecord) => r.mentorRole },
  { header: "Faith / Culture", accessor: (r: MentorRecord) => r.faithCulture },
  { header: "Matched", accessor: (r: MentorRecord) => r.matchedDate },
  { header: "Frequency", accessor: (r: MentorRecord) => r.contactFrequency },
  { header: "Quality", accessor: (r: MentorRecord) => r.childRelationshipQuality },
  { header: "Settings", accessor: (r: MentorRecord) => r.contactSettings.join("; ") },
  { header: "Role Played", accessor: (r: MentorRecord) => r.rolePlayed.join("; ") },
  { header: "Safeguarding Checks", accessor: (r: MentorRecord) => r.safeguardingChecksDone.map((c) => `${c.check} (${c.date} — ${c.outcome})`).join("; ") },
  { header: "Parent / SW Aware", accessor: (r: MentorRecord) => (r.parentSwAware ? "Yes" : "No") },
  { header: "Child Voice", accessor: (r: MentorRecord) => r.childVoice },
  { header: "Review", accessor: (r: MentorRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: MentorRecord) => getStaffName(r.keyWorker) },
];

const qualityColour: Record<MentorRecord["childRelationshipQuality"], string> = {
  Building: "bg-blue-100 text-blue-800 border-blue-200",
  Settled: "bg-sky-100 text-sky-800 border-sky-200",
  Strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Central figure": "bg-purple-100 text-purple-800 border-purple-200",
};

const roleColour: Record<MentorRecord["mentorRole"], string> = {
  Imam: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Pandit: "bg-amber-100 text-amber-800 border-amber-200",
  Rabbi: "bg-blue-100 text-blue-800 border-blue-200",
  "Pastor / minister": "bg-red-100 text-red-800 border-red-200",
  "Cultural elder": "bg-orange-100 text-orange-800 border-orange-200",
  "Community leader": "bg-violet-100 text-violet-800 border-violet-200",
  "Heritage language teacher": "bg-teal-100 text-teal-800 border-teal-200",
  "Faith-aware therapist": "bg-purple-100 text-purple-800 border-purple-200",
  "Diaspora mentor": "bg-pink-100 text-pink-800 border-pink-200",
  Other: "bg-slate-100 text-slate-800 border-slate-200",
};

export default function ChildCulturalReligiousMentorPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"matched" | "name" | "quality" | "review">("matched");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        rec.mentorName.toLowerCase().includes(search.toLowerCase()) ||
        rec.faithCulture.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || rec.mentorRole === roleFilter;
      return matchesSearch && matchesRole;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "quality") return a.childRelationshipQuality.localeCompare(b.childRelationshipQuality);
      if (sortBy === "review") return a.reviewDate.localeCompare(b.reviewDate);
      return b.matchedDate.localeCompare(a.matchedDate);
    });
    return r;
  }, [search, roleFilter, sortBy]);

  const stats = useMemo(() => {
    const matched = records.length;
    const central = records.filter((r) => r.childRelationshipQuality === "Central figure" || r.childRelationshipQuality === "Strong").length;
    const safeguardingChecked = records.filter((r) => r.safeguardingChecksDone.length > 0).length;
    const reviewsDue = records.filter((r) => r.reviewDate <= d(90)).length;
    return { matched, central, safeguardingChecked, reviewsDue };
  }, []);

  return (
    <PageShell
      title="Cultural & Religious Mentors"
      subtitle="Per-child community-based cultural or religious mentor matching — when staff don't share a child's heritage, identifying an Imam, Pandit, Rabbi, Pastor, elder or community leader for spiritual or cultural guidance. Co-produced with the child, dignifying, never imposed. Distinct from chosen-family-tracker."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-cultural-religious-mentor" />
          <PrintButton title="Cultural & Religious Mentors" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Users className="h-4 w-4" />
            <span>Mentors matched</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.matched}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Star className="h-4 w-4" />
            <span>Central / strong</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.central}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Safeguarding checked</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.safeguardingChecked}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>Reviews due (90d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.reviewsDue}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, mentor, faith / culture..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Mentor role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="Imam">Imam</SelectItem>
            <SelectItem value="Pandit">Pandit</SelectItem>
            <SelectItem value="Rabbi">Rabbi</SelectItem>
            <SelectItem value="Pastor / minister">Pastor / minister</SelectItem>
            <SelectItem value="Cultural elder">Cultural elder</SelectItem>
            <SelectItem value="Community leader">Community leader</SelectItem>
            <SelectItem value="Heritage language teacher">Heritage language teacher</SelectItem>
            <SelectItem value="Faith-aware therapist">Faith-aware therapist</SelectItem>
            <SelectItem value="Diaspora mentor">Diaspora mentor</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="matched">Matched recently</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
            <SelectItem value="review">Review date</SelectItem>
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
                    <span className="text-slate-700">— {r.mentorName}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", roleColour[r.mentorRole])}>
                      {r.mentorRole}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", qualityColour[r.childRelationshipQuality])}>
                      {r.childRelationshipQuality}
                    </span>
                    {r.safeguardingChecksDone.length ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                        Safeguarded
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    {r.faithCulture} · {r.contactFrequency} · {getStaffName(r.keyWorker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-amber-700 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-amber-900 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">How matched</div>
                      <p className="text-sm text-slate-700">{r.introductionMethod}</p>
                      <div className="text-xs text-slate-500 mt-2">Matched {r.matchedDate}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Contact settings</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.contactSettings.map((s, i) => (
                          <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Role played</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.rolePlayed.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>+</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Safeguarding checks</div>
                      <ul className="text-sm text-slate-700 space-y-1.5">
                        {r.safeguardingChecksDone.map((c, i) => (
                          <li key={i} className="flex gap-2 justify-between">
                            <span>{c.check}</span>
                            <span className="text-xs text-slate-500">{c.date} · {c.outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Recent meetings</div>
                      <ul className="text-sm text-slate-700 space-y-1.5">
                        {r.meetingsRecord.map((m, i) => (
                          <li key={i}>
                            <div className="text-xs text-slate-500">{m.date}</div>
                            <div><span className="font-medium">{m.topic}</span> — {m.outcome}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Home awareness</div>
                      <p className="text-sm text-slate-700">{r.homeAwareness}</p>
                      <div className="text-xs text-slate-500 mt-2">Parent / SW aware: {r.parentSwAware ? "Yes" : "No"}</div>
                    </div>
                    {r.challengesNoted.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Challenges noted</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.challengesNoted.map((c, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{c}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Mentor matching is co-produced with the child and never imposed. Practice is grounded in Children&rsquo;s
          Homes Regulations Quality Standards 6 (Enjoyment & Achievement) and 7 (Positive Relationships), the
          Equality Act 2010 (religion or belief), Working Together 2023, NSPCC Faith and Spirituality safeguarding
          guidance, and UNCRC Articles 8 (identity), 14 (thought / conscience / religion), and 30 (cultural
          identity). All mentors hold appropriate safeguarding clearance proportionate to contact, with open-door
          policies for 1:1 meetings.
        </p>
      </div>
    </PageShell>
  );
}
