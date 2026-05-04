"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  BookOpen,
  Heart,
  Shield,
  Users,
  Star,
  CheckCircle,
  Lightbulb,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
interface ChildFriendlyPolicy {
  id: string;
  title: string;
  area: "Safety" | "Behaviour" | "Voice" | "Privacy" | "Health" | "Education" | "Wellbeing" | "Rights";
  parentPolicyName: string;
  parentPolicyVersion: string;
  childFriendlyVersion: string;
  audienceAge: "Under 11" | "11-14" | "15+" | "All ages (visual)";
  format: "Visual + Text" | "Easy Read" | "Standard Text" | "Audio Available" | "Comic/Storybook";
  plainEnglishSummary: string;
  whatThisMeans: string[];
  whatYouCanExpect: string[];
  yourRights: string[];
  yourResponsibilities: string[];
  whoCanHelp: string[];
  childFeedback: string;
  reviewedWithChildrenDate: string;
  lastUpdated: string;
  authoredBy: string;
  approvedBy: string;
  childCoProductionContributors: string[];
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ChildFriendlyPolicy[] = [
  {
    id: "cfp-001",
    title: "How we keep you safe",
    area: "Safety",
    parentPolicyName: "Safeguarding & Child Protection Policy",
    parentPolicyVersion: "v4.2",
    childFriendlyVersion: "v3.0",
    audienceAge: "All ages (visual)",
    format: "Visual + Text",
    plainEnglishSummary: "Keeping you safe is the most important thing we do. This is how we do it — and what to do if you ever feel unsafe or worried.",
    whatThisMeans: [
      "Adults at Oak House are checked carefully before they work here",
      "Someone is awake all night to help if you need anything",
      "Doors and windows are checked, but you're never locked in",
      "We talk about online safety because that matters too",
    ],
    whatYouCanExpect: [
      "We listen to you and believe you",
      "We act quickly if something is wrong",
      "We tell you what we're doing and why",
      "Your private things stay private (unless something's unsafe)",
    ],
    yourRights: [
      "To feel safe in your home",
      "To tell someone if you don't feel safe",
      "To know who to ring if you need help",
      "To have your worries taken seriously",
    ],
    yourResponsibilities: [
      "Tell a grown-up you trust if something feels wrong",
      "Help us look after each other",
      "Be kind in how you treat your housemates",
    ],
    whoCanHelp: [
      "Any staff at Oak House (knock on the office)",
      "Your social worker (number on your fridge magnet)",
      "Childline: 0800 1111",
      "NSPCC: 0808 800 5000",
      "Your independent advocate",
    ],
    childFeedback: "I like the cartoon at the top. It explains things without making me feel small.",
    reviewedWithChildrenDate: d(-30),
    lastUpdated: d(-45),
    authoredBy: "staff_darren",
    approvedBy: "staff_darren",
    childCoProductionContributors: ["yp_alex", "yp_jordan", "yp_casey"],
  },
  {
    id: "cfp-002",
    title: "What happens if there are problems with my behaviour",
    area: "Behaviour",
    parentPolicyName: "Behaviour Management & Positive Handling Policy",
    parentPolicyVersion: "v3.1",
    childFriendlyVersion: "v2.4",
    audienceAge: "11-14",
    format: "Visual + Text",
    plainEnglishSummary: "Sometimes things go wrong and you might do something that needs sorting out. We don't punish you. We help you understand and put things right.",
    whatThisMeans: [
      "We never use sanctions like grounding or losing pocket money as a punishment",
      "We talk about what happened and what was going on for you",
      "If something gets broken, we work out together how to fix it",
      "We never shout at you or tell you off in front of others",
    ],
    whatYouCanExpect: [
      "A calm conversation when you're ready",
      "Questions like 'what was happening?' rather than 'why did you do that?'",
      "Help to repair anything broken (relationships or things)",
      "A chance to say sorry if you want to, but no-one forces you",
    ],
    yourRights: [
      "To be treated with respect even when you've made a mistake",
      "To have your side heard",
      "To say no to talking right now (and come back to it later)",
      "To have an advocate or trusted adult with you for difficult conversations",
    ],
    yourResponsibilities: [
      "Try to be honest about what happened",
      "Help to make things right when you can",
      "Tell us what would help you next time",
    ],
    whoCanHelp: [
      "Your key worker (best person for big chats)",
      "Any staff member you trust",
      "Your advocate if you want someone independent",
    ],
    childFeedback: "I like that it says we don't get punished. The other place I lived gave loads of consequences. This feels different.",
    reviewedWithChildrenDate: d(-20),
    lastUpdated: d(-60),
    authoredBy: "staff_ryan",
    approvedBy: "staff_darren",
    childCoProductionContributors: ["yp_alex", "yp_jordan"],
  },
  {
    id: "cfp-003",
    title: "Your voice — how to speak up",
    area: "Voice",
    parentPolicyName: "Children's Voice & Participation Policy",
    parentPolicyVersion: "v2.8",
    childFriendlyVersion: "v3.0",
    audienceAge: "All ages (visual)",
    format: "Visual + Text",
    plainEnglishSummary: "What you think matters. Here are all the ways we make sure your voice is heard — and what to do if you feel like it isn't.",
    whatThisMeans: [
      "You can tell us what you think about anything — small things or big things",
      "We don't just listen — we act on what you say",
      "If we can't do what you want, we tell you why",
      "There are lots of different ways to share your views",
    ],
    whatYouCanExpect: [
      "Weekly key work time just for you",
      "Children's meetings every two weeks (you don't have to come if you don't want)",
      "Feedback boxes around the home",
      "Your views included in big meetings about you",
    ],
    yourRights: [
      "To say what you think — even if it's a complaint",
      "To choose how you tell us things (talking, writing, drawing, voice notes)",
      "To have help from someone independent (an advocate)",
      "To know your views were heard and considered",
    ],
    yourResponsibilities: [
      "Try to be honest about how you feel",
      "Listen to others when they share too",
      "Tell us if you don't feel heard",
    ],
    whoCanHelp: [
      "Your key worker",
      "Children's Commissioner: 0800 528 0731",
      "Your advocate (we'll arrange this if you want)",
      "Anonymous suggestion box in the hallway",
    ],
    childFeedback: "I asked for later bedtime and they actually listened. They didn't agree but they explained. That's good.",
    reviewedWithChildrenDate: d(-15),
    lastUpdated: d(-30),
    authoredBy: "staff_darren",
    approvedBy: "staff_darren",
    childCoProductionContributors: ["yp_alex", "yp_jordan", "yp_casey"],
  },
  {
    id: "cfp-004",
    title: "Your privacy and your private things",
    area: "Privacy",
    parentPolicyName: "Privacy & Personal Space Policy",
    parentPolicyVersion: "v2.0",
    childFriendlyVersion: "v2.1",
    audienceAge: "All ages (visual)",
    format: "Easy Read",
    plainEnglishSummary: "Your bedroom is your space. Your phone is your phone. Your stuff is your stuff. This is how we respect that — and the few times we might need to look.",
    whatThisMeans: [
      "We knock before entering your bedroom and wait",
      "We don't go through your stuff without a really good reason",
      "Your phone is yours — we don't read your messages",
      "What you tell us in private stays private (unless someone could be unsafe)",
    ],
    whatYouCanExpect: [
      "A 'do not disturb' option for your room when you need quiet",
      "Permission to lock your bedroom from inside (we have an emergency key, only for emergencies)",
      "A drawer or cupboard you can keep private",
      "Confidential chats in private rooms",
    ],
    yourRights: [
      "To privacy in your bedroom and bathroom",
      "To keep your phone private",
      "To share or not share things about your past",
      "To have your medical and personal information kept secure",
    ],
    yourResponsibilities: [
      "Respect other people's privacy too",
      "Tell us if you feel your privacy isn't being respected",
    ],
    whoCanHelp: [
      "Any staff member if your privacy isn't being respected",
      "Your social worker",
      "Information Commissioner's Office (for big concerns)",
    ],
    childFeedback: "I like that they always knock. It feels like a proper home, not somewhere I'm being watched.",
    reviewedWithChildrenDate: d(-10),
    lastUpdated: d(-90),
    authoredBy: "staff_chervelle",
    approvedBy: "staff_darren",
    childCoProductionContributors: ["yp_alex", "yp_casey"],
  },
  {
    id: "cfp-005",
    title: "Looking after your health",
    area: "Health",
    parentPolicyName: "Health, Medication & Wellbeing Policy",
    parentPolicyVersion: "v5.0",
    childFriendlyVersion: "v2.5",
    audienceAge: "11-14",
    format: "Visual + Text",
    plainEnglishSummary: "Your health matters. Here's how we look after you — at GP appointments, with medication, and when you don't feel well.",
    whatThisMeans: [
      "You'll see the GP when you need to (and for check-ups)",
      "We never hide medication in food without your knowledge",
      "You can ask questions about anything to do with your body",
      "Your medical history is private",
    ],
    whatYouCanExpect: [
      "Help getting to all your appointments",
      "A staff member to come with you if you want, or wait outside if you'd rather",
      "Medication explained in a way that makes sense",
      "Healthy food but treats too — life isn't just about kale",
    ],
    yourRights: [
      "To consent to your own treatment when you're old enough (Gillick competence)",
      "To know what your medication is for",
      "To refuse medication (we'll talk about it but won't force you)",
      "To privacy at medical appointments",
    ],
    yourResponsibilities: [
      "Take medicine when it's needed for your health",
      "Tell us if you feel unwell",
      "Ask if you don't understand something about your health",
    ],
    whoCanHelp: [
      "Any staff member",
      "Your GP: Riverside Medical Practice",
      "School nurse",
      "Brook (sexual health & wellbeing): 0808 802 1234",
    ],
    childFeedback: "It explains medication without being scary. I asked about my ADHD pills and they actually showed me what they do.",
    reviewedWithChildrenDate: d(-25),
    lastUpdated: d(-100),
    authoredBy: "staff_anna",
    approvedBy: "staff_darren",
    childCoProductionContributors: ["yp_alex"],
  },
  {
    id: "cfp-006",
    title: "Your rights — what you can expect",
    area: "Rights",
    parentPolicyName: "Children's Rights Charter (UNCRC-aligned)",
    parentPolicyVersion: "v3.0",
    childFriendlyVersion: "v3.2",
    audienceAge: "All ages (visual)",
    format: "Comic/Storybook",
    plainEnglishSummary: "Every child in the world has rights. Here are yours — what they mean, and what to do if you don't think they're being respected.",
    whatThisMeans: [
      "Rights are things you have just because you're a child",
      "No-one can take your rights away from you",
      "The UNCRC is a list of children's rights signed by 196 countries",
      "Your rights apply at home, at school, and everywhere else",
    ],
    whatYouCanExpect: [
      "Your rights are explained in language that makes sense",
      "Your views are taken seriously (Article 12)",
      "You're protected from harm (Article 19)",
      "You can keep your culture, name, and identity (Article 8)",
      "You have a right to an education (Article 28)",
    ],
    yourRights: [
      "Article 3: Your best interests are the most important thing",
      "Article 12: You have a right to be heard",
      "Article 13: You can express your views freely",
      "Article 19: You're protected from harm",
      "Article 31: You have a right to play and rest",
      "And many more — full list in the comic",
    ],
    yourResponsibilities: [
      "Respect other children's rights too",
      "Tell us if you think your rights aren't being respected",
    ],
    whoCanHelp: [
      "Your advocate",
      "Coram Voice: 0808 800 5792",
      "Children's Commissioner",
      "UNICEF UK: childrensrights.org.uk",
    ],
    childFeedback: "I like the comic version. It's not boring like normal policies. Now I know my rights and I can ask for them.",
    reviewedWithChildrenDate: d(-35),
    lastUpdated: d(-50),
    authoredBy: "staff_darren",
    approvedBy: "staff_darren",
    childCoProductionContributors: ["yp_alex", "yp_jordan", "yp_casey"],
  },
  {
    id: "cfp-007",
    title: "School and learning",
    area: "Education",
    parentPolicyName: "Education Engagement & Support Policy",
    parentPolicyVersion: "v2.5",
    childFriendlyVersion: "v2.0",
    audienceAge: "11-14",
    format: "Visual + Text",
    plainEnglishSummary: "School isn't always easy. We're here to help you with learning — at school and at home.",
    whatThisMeans: [
      "Education matters because it opens doors for your future",
      "We don't expect you to be top of the class — we expect you to try",
      "If school isn't working, we'll help find another way",
      "Your PEP (Personal Education Plan) is about your goals, not just exams",
    ],
    whatYouCanExpect: [
      "Help with homework if you want it",
      "Quiet space to study",
      "Someone to come to parents' evenings",
      "Books, equipment, and uniform — never something you have to worry about",
      "Tutors if you need extra help",
    ],
    yourRights: [
      "A right to education (UNCRC Article 28)",
      "A right to support if you have additional needs",
      "A right to be heard in your PEP meeting",
      "A right to challenge if school isn't meeting your needs",
    ],
    yourResponsibilities: [
      "Try your best (whatever your best is)",
      "Tell us when school is hard",
      "Show up — but tell us if you can't and why",
    ],
    whoCanHelp: [
      "Your designated teacher at school",
      "Virtual School (for looked-after children)",
      "Your key worker for emotional support around school",
      "Childline if school feels overwhelming: 0800 1111",
    ],
    childFeedback: "I like that they say 'try your best' not 'get top grades'. School was so hard before. Now I'm in a place where I'm allowed to find it hard.",
    reviewedWithChildrenDate: d(-12),
    lastUpdated: d(-70),
    authoredBy: "staff_edward",
    approvedBy: "staff_darren",
    childCoProductionContributors: ["yp_jordan"],
  },
  {
    id: "cfp-008",
    title: "Looking after how you feel",
    area: "Wellbeing",
    parentPolicyName: "Mental Health & Emotional Wellbeing Policy",
    parentPolicyVersion: "v2.0",
    childFriendlyVersion: "v2.1",
    audienceAge: "11-14",
    format: "Visual + Text",
    plainEnglishSummary: "It's normal to have hard days, big feelings, and wobbly moments. This is what we do to help — and what you can do too.",
    whatThisMeans: [
      "Feelings (even big ones) are not a problem to be fixed",
      "It's okay to not be okay",
      "We notice when you're struggling, even if you don't say anything",
      "Therapy is normal, useful, and on offer if you want it",
    ],
    whatYouCanExpect: [
      "A staff member who notices when something's off",
      "A safe space to feel however you feel",
      "Tools to help (sensory items, breathing techniques, the cool-down zone)",
      "Help to get therapy if you want it",
      "No-one will ever say 'just snap out of it'",
    ],
    yourRights: [
      "To have your feelings taken seriously",
      "To access mental health support",
      "To say no to therapy (it works best when you choose it)",
      "To privacy about what you discuss in therapy",
    ],
    yourResponsibilities: [
      "Try to tell someone when things feel really hard",
      "Be kind to yourself when you're struggling",
      "Use the tools we've worked on together",
    ],
    whoCanHelp: [
      "Your key worker",
      "CAMHS therapist (we'll arrange this)",
      "Childline: 0800 1111",
      "Shout (text 85258) — text-based support",
      "Samaritans: 116 123",
      "YoungMinds: youngminds.org.uk",
    ],
    childFeedback: "I felt embarrassed about therapy at first. The way it's written here makes it sound normal. I'm trying it now.",
    reviewedWithChildrenDate: d(-8),
    lastUpdated: d(-25),
    authoredBy: "staff_anna",
    approvedBy: "staff_darren",
    childCoProductionContributors: ["yp_casey", "yp_alex"],
  },
];

// ── config ──────────────────────────────────────────────────────────────────
const areaIcons: Record<string, typeof BookOpen> = {
  Safety: Shield,
  Behaviour: Heart,
  Voice: Users,
  Privacy: Eye,
  Health: Heart,
  Education: BookOpen,
  Wellbeing: Heart,
  Rights: Star,
};

const areaColour: Record<string, string> = {
  Safety: "bg-red-100 text-red-800",
  Behaviour: "bg-purple-100 text-purple-800",
  Voice: "bg-blue-100 text-blue-800",
  Privacy: "bg-slate-100 text-slate-800",
  Health: "bg-green-100 text-green-800",
  Education: "bg-amber-100 text-amber-800",
  Wellbeing: "bg-pink-100 text-pink-800",
  Rights: "bg-emerald-100 text-emerald-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<ChildFriendlyPolicy>[] = [
  { header: "Title", accessor: (r: ChildFriendlyPolicy) => r.title },
  { header: "Area", accessor: (r: ChildFriendlyPolicy) => r.area },
  { header: "Audience", accessor: (r: ChildFriendlyPolicy) => r.audienceAge },
  { header: "Format", accessor: (r: ChildFriendlyPolicy) => r.format },
  { header: "Parent Policy", accessor: (r: ChildFriendlyPolicy) => r.parentPolicyName },
  { header: "Version", accessor: (r: ChildFriendlyPolicy) => r.childFriendlyVersion },
  { header: "Last Updated", accessor: (r: ChildFriendlyPolicy) => r.lastUpdated },
  { header: "Reviewed With Children", accessor: (r: ChildFriendlyPolicy) => r.reviewedWithChildrenDate },
  { header: "Authored By", accessor: (r: ChildFriendlyPolicy) => getStaffName(r.authoredBy) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ChildFriendlyPoliciesPage() {
  const [filterArea, setFilterArea] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterArea !== "all") items = items.filter((p) => p.area === filterArea);
    if (filterFormat !== "all") items = items.filter((p) => p.format === filterFormat);

    items.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "updated":
          return b.lastUpdated.localeCompare(a.lastUpdated);
        case "area":
          return a.area.localeCompare(b.area);
        default:
          return 0;
      }
    });
    return items;
  }, [filterArea, filterFormat, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalPolicies = data.length;
  const coProduced = data.filter((p) => p.childCoProductionContributors.length > 0).length;
  const reviewedRecently = data.filter((p) => p.reviewedWithChildrenDate >= d(-90)).length;
  const areasCovered = new Set(data.map((p) => p.area)).size;

  return (
    <PageShell
      title="Child-Friendly Policies"
      subtitle="Plain-language, accessible policies — co-produced with children, designed to be read by them"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-friendly-policies" />
          <PrintButton title="Child-Friendly Policies" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalPolicies}</p>
          <p className="text-xs text-muted-foreground">Total Policies</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{coProduced}</p>
          <p className="text-xs text-muted-foreground">Co-Produced</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{reviewedRecently}</p>
          <p className="text-xs text-muted-foreground">Reviewed (90 days)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{areasCovered}</p>
          <p className="text-xs text-muted-foreground">Areas Covered</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          A policy a child can&apos;t read isn&apos;t a policy that protects them. Every parent policy has a
          child-friendly version. They&apos;re displayed around the home, in welcome packs, and reviewed with
          children — never just a box-ticking exercise.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Areas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            <SelectItem value="Safety">Safety</SelectItem>
            <SelectItem value="Behaviour">Behaviour</SelectItem>
            <SelectItem value="Voice">Voice</SelectItem>
            <SelectItem value="Privacy">Privacy</SelectItem>
            <SelectItem value="Health">Health</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Wellbeing">Wellbeing</SelectItem>
            <SelectItem value="Rights">Rights</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterFormat} onValueChange={setFilterFormat}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Formats" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="Visual + Text">Visual + Text</SelectItem>
            <SelectItem value="Easy Read">Easy Read</SelectItem>
            <SelectItem value="Standard Text">Standard Text</SelectItem>
            <SelectItem value="Audio Available">Audio Available</SelectItem>
            <SelectItem value="Comic/Storybook">Comic/Storybook</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="title">By Title</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="area">By Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── policy cards ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No policies match your filters.</div>
        )}
        {filtered.map((policy) => {
          const isExpanded = expandedId === policy.id;
          const AreaIcon = areaIcons[policy.area] || BookOpen;

          return (
            <div key={policy.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : policy.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <AreaIcon className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{policy.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {policy.parentPolicyName} ({policy.parentPolicyVersion}) &middot; {policy.format} &middot; {policy.audienceAge}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", areaColour[policy.area])}>
                    {policy.area}
                  </span>
                  {policy.childCoProductionContributors.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Co-produced</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Plain-English Summary</p>
                    <p className="text-sm text-amber-900">{policy.plainEnglishSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What This Means</p>
                      <ul className="space-y-1">
                        {policy.whatThisMeans.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What You Can Expect</p>
                      <ul className="space-y-1">
                        {policy.whatYouCanExpect.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Your Rights</p>
                      <ul className="space-y-1">
                        {policy.yourRights.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Star className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Your Responsibilities</p>
                      <ul className="space-y-1">
                        {policy.yourResponsibilities.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Who Can Help</p>
                    <ul className="space-y-1">
                      {policy.whoCanHelp.map((h, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Heart className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Children&apos;s Feedback</p>
                    <p className="text-sm text-purple-900 italic">&ldquo;{policy.childFeedback}&rdquo;</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Last updated: {policy.lastUpdated}</span>
                    <span>Reviewed with children: {policy.reviewedWithChildrenDate}</span>
                    <span>Authored: {getStaffName(policy.authoredBy)}</span>
                    <span>Co-produced with: {policy.childCoProductionContributors.length} young {policy.childCoProductionContributors.length === 1 ? "person" : "people"}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Child-friendly policies meet UNCRC Article 12 (right to be heard),
          Article 17 (access to information), and Quality Standard 1 (child-centred care). Policies are
          co-produced with children where possible, displayed around the home, included in welcome packs, and
          reviewed in children&apos;s meetings. Provided in accessible formats per Equality Act 2010.
        </p>
      </div>
    </PageShell>
  );
}
