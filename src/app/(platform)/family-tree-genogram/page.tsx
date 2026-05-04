"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Users,
  Heart,
  Phone,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GenogramEntry {
  id: string;
  youngPerson: string;
  generationsRepresented: string[];
  immediateFamily: { relation: string; name: string; status: "Living" | "Deceased" | "Unknown"; contactStatus: "Active" | "Letterbox only" | "No contact" | "Restricted" | "Indirect"; safeguardingNotes: string }[];
  extendedFamily: { relation: string; name: string; significance: string; contactStatus: string }[];
  importantNonFamilyAdults: { name: string; role: string; significance: string; ongoing: boolean }[];
  significantPlaces: { place: string; significance: string }[];
  pastSiblingRelationships: { sibling: string; relationship: string; currentSituation: string }[];
  estrangedRelationships: string[];
  familyMyths: string;
  childKnowsTheStory: string;
  ageAppropriateSummary: string;
  contactDirectoryLink: string;
  identityImpact: string;
  protectiveRelationships: string[];
  riskRelationships: string[];
  childInputProvided: boolean;
  childAgeWhenCreated: number;
  lastUpdatedDate: string;
  reviewedBy: string;
  sensitiveContent: boolean;
  shareableWith: string[];
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: GenogramEntry[] = [
  {
    id: "ge-001",
    youngPerson: "yp_alex",
    generationsRepresented: ["Maternal grandparents (deceased)", "Mother + Father (separated)", "Maternal aunt/uncle", "Alex + younger sister"],
    immediateFamily: [
      { relation: "Mother", name: "Sarah (referred to as 'Mum')", status: "Living", contactStatus: "Active", safeguardingNotes: "Recovering from complex needs. Contact via phone weekly + supervised visits. Significant relationship for Alex." },
      { relation: "Father", name: "James (estranged)", status: "Living", contactStatus: "No contact", safeguardingNotes: "History of domestic violence. Non-molestation order in place. Alex does not see him. Identifying info shared on need-to-know basis." },
      { relation: "Younger sister", name: "Mia (age 9)", status: "Living", contactStatus: "Indirect", safeguardingNotes: "Lives with Mum. Sibling relationship encouraged. Phone contact and occasional supervised visits." },
      { relation: "Maternal grandmother", name: "Margaret ('Nan')", status: "Living", contactStatus: "Active", safeguardingNotes: "Important figure. Sunday lunches when possible. Loving relationship. Cultural anchor (mixed heritage)." },
      { relation: "Maternal grandfather", name: "Trevor", status: "Deceased", contactStatus: "No contact", safeguardingNotes: "Died when Alex was 6. Positive memories. Photo kept." },
      { relation: "Paternal family", name: "Unknown", status: "Unknown", contactStatus: "No contact", safeguardingNotes: "No contact. Alex does not wish to know more at present." },
    ],
    extendedFamily: [
      { relation: "Maternal aunt", name: "Sharon", significance: "Some contact via Mum. Supportive when she can be.", contactStatus: "Indirect via mother" },
      { relation: "Maternal uncle", name: "Steve", significance: "Limited involvement. Cordial.", contactStatus: "Indirect" },
      { relation: "Maternal cousins (3)", name: "Various", significance: "Met at family events.", contactStatus: "Occasional" },
    ],
    importantNonFamilyAdults: [
      { name: "Anna (key worker)", role: "Key worker, Oak House", significance: "Most consistent adult relationship. Anchor figure.", ongoing: true },
      { name: "Coach James (boxing)", role: "Boxing coach", significance: "Positive male role model. Started age 11.", ongoing: true },
      { name: "Mrs Williams (primary teacher)", role: "Former primary school teacher", significance: "Year 5 teacher who 'saw' Alex. Sometimes sends cards.", ongoing: true },
    ],
    significantPlaces: [
      { place: "Maternal grandmother's house (Sunday lunches)", significance: "Continuity, warmth, family identity" },
      { place: "Original family home (until age 7)", significance: "Mixed memories. Site of DV. Some happy memories from before separation" },
      { place: "Riverside Boxing Gym", significance: "Identity formation, belonging" },
    ],
    pastSiblingRelationships: [
      { sibling: "Mia (younger sister)", relationship: "Protective older brother", currentSituation: "Lives with Mum. Phone contact maintained. Visits when arranged." },
    ],
    estrangedRelationships: [
      "Father — by Alex's choice, supported",
      "Paternal extended family — never known, no current desire to seek",
    ],
    familyMyths: "Family narrative was 'Dad left because of work'. Alex now knows full story (DV). Worked through in therapy and life story sessions.",
    childKnowsTheStory: "Yes — age-appropriately. Knows about DV and why family separated. Knows Mum is recovering. Knows he can ask questions.",
    ageAppropriateSummary: "Alex's family includes Mum (most important), little sister Mia, and Nan. Some family members had hard times that meant they couldn't look after Alex safely. Oak House looks after Alex now while Mum is getting better. Alex sees Mum and Nan, talks to Mia on the phone, and has lots of important grown-ups who care about him.",
    contactDirectoryLink: "/contact-directory",
    identityImpact: "Mixed-heritage identity from Mum's side. DV history shapes view of relationships. Boxing identity is growing source of pride. ADHD diagnosis seen as 'me, not my fault'.",
    protectiveRelationships: ["Mum", "Nan", "Mia (sibling bond)", "Anna", "Coach James"],
    riskRelationships: ["Father (no contact, restricted)", "Some of Mum's old social network if seen with Mum"],
    childInputProvided: true,
    childAgeWhenCreated: 11,
    lastUpdatedDate: d(-30),
    reviewedBy: "staff_anna",
    sensitiveContent: true,
    shareableWith: ["Allocated SW", "IRO", "Therapist (CAMHS)", "School DSL on need-to-know"],
  },
  {
    id: "ge-002",
    youngPerson: "yp_jordan",
    generationsRepresented: ["Maternal grandparents", "Mother (in custody)", "Father (estranged)", "Aunts/uncles + cultural extended family", "Jordan + younger sister Tia"],
    immediateFamily: [
      { relation: "Mother", name: "Janice (currently in HMP)", status: "Living", contactStatus: "Restricted", safeguardingNotes: "In prison until release in ~8 weeks. Phone calls Sundays. Most important relationship for Jordan. Pre-release planning underway." },
      { relation: "Father", name: "Marcus Sr (not on birth certificate)", status: "Living", contactStatus: "No contact", safeguardingNotes: "Long absent. Jordan has no current contact and limited interest. Lives in another county." },
      { relation: "Younger sister", name: "Tia (age 9)", status: "Living", contactStatus: "Active", safeguardingNotes: "In long-term foster care. Strong sibling bond. Monthly contact + birthdays/Christmas. Foster carer supportive of contact." },
      { relation: "Maternal grandmother", name: "Doreen ('Nan-Nan')", status: "Living", contactStatus: "Letterbox only", safeguardingNotes: "Significant cultural figure. Cards exchanged. Could not manage Jordan's behaviour during Mum's earlier custody. Relationship complicated." },
      { relation: "Maternal grandfather", name: "Wesley", status: "Deceased", contactStatus: "No contact", safeguardingNotes: "Died when Jordan was 8. Positive memories. Cultural figure. Photo kept." },
      { relation: "Paternal family", name: "Largely unknown", status: "Unknown", contactStatus: "No contact", safeguardingNotes: "Jordan recently expressed interest in heritage exploration of paternal side." },
    ],
    extendedFamily: [
      { relation: "Maternal aunt", name: "Aunt Joy", significance: "Important figure in childhood. Some contact maintained via cards.", contactStatus: "Letterbox" },
      { relation: "Cousin (close)", name: "Cousin Devon (age 14)", significance: "Like a brother. School-related contact.", contactStatus: "Active (informal)" },
      { relation: "Cultural community", name: "Black-led church / community", significance: "Mum's faith community. Some figures know Jordan from childhood.", contactStatus: "Occasional" },
    ],
    importantNonFamilyAdults: [
      { name: "Chervelle (key worker)", role: "Key worker, Oak House", significance: "Trusted relationship. Cultural connection.", ongoing: true },
      { name: "Coach Mike (football)", role: "Football coach", significance: "Father-figure trust. 2 years.", ongoing: true },
      { name: "Mr Williams (school DSL)", role: "School DSL", significance: "Trusted at school. Knows full story.", ongoing: true },
    ],
    significantPlaces: [
      { place: "Original family home (lost in fire 2017)", significance: "Trauma site + happy memories before. Returns to mind around bonfire night." },
      { place: "Nan-Nan's house", significance: "Cultural anchor. Jordan and Tia stayed there during Mum's first custody." },
      { place: "Riverside Football Club", significance: "Belonging, identity, leadership emergence." },
      { place: "Caribbean church (Mum's)", significance: "Cultural and spiritual touchstone." },
    ],
    pastSiblingRelationships: [
      { sibling: "Tia (younger sister)", relationship: "Protective older brother. Took on parental role when young.", currentSituation: "Long-term foster care. Strong bond maintained." },
      { sibling: "Cousin Devon", relationship: "Like a brother. Closest peer family.", currentSituation: "Lives with own family. School friendship maintained." },
    ],
    estrangedRelationships: [
      "Father — by Jordan's current choice but possibly to be revisited",
      "Some of Mum's pre-prison network — risk-managed",
    ],
    familyMyths: "Strong cultural narrative of resilience and pride. Family struggles framed by Jordan as 'we keep going'. Identity strongly Black British of Caribbean heritage.",
    childKnowsTheStory: "Yes — Jordan is mature about his story. Knows about Mum's offences, prison, hopes for return. Knows about house fire. Cultural identity actively explored.",
    ageAppropriateSummary: "Jordan's family is rooted in Caribbean and West African heritage. Mum is in prison but coming home soon. Sister Tia lives with another family but they're really close. Football coach Mike, church family, Cousin Devon, and Nan-Nan are all part of who Jordan is. Lots of love, lots of complications.",
    contactDirectoryLink: "/contact-directory",
    identityImpact: "Strong cultural identity is protective. Mother's incarceration is part of story without defining him. Football identity provides belonging. Religious heritage increasingly important.",
    protectiveRelationships: ["Mum (despite circumstances)", "Tia", "Coach Mike", "Chervelle", "Cousin Devon", "Cultural community"],
    riskRelationships: ["Some of Mum's previous associates if she resumes them", "Father is unknown quantity"],
    childInputProvided: true,
    childAgeWhenCreated: 12,
    lastUpdatedDate: d(-21),
    reviewedBy: "staff_chervelle",
    sensitiveContent: true,
    shareableWith: ["Allocated SW", "IRO", "Coram Voice advocate", "Prison social worker re Mum"],
  },
  {
    id: "ge-003",
    youngPerson: "yp_casey",
    generationsRepresented: ["Maternal grandparents (limited info)", "Birth parents (full care order)", "Casey (only child known)"],
    immediateFamily: [
      { relation: "Birth mother", name: "Rachel", status: "Living", contactStatus: "Letterbox only", safeguardingNotes: "Removed Casey's care via S31 due to chronic neglect. Letterbox arrangement. Casey opens letters with Anna twice a year. Doesn't want phone contact." },
      { relation: "Birth father", name: "Andrew", status: "Living", contactStatus: "No contact", safeguardingNotes: "Did not contest care order. No current involvement. Casey doesn't wish to know more presently." },
      { relation: "Siblings", name: "None known", status: "Unknown", contactStatus: "No contact", safeguardingNotes: "Casey is only child known to family. Half-sibling possible from father's other relationships — not pursued." },
      { relation: "Maternal grandmother", name: "Limited info", status: "Unknown", contactStatus: "No contact", safeguardingNotes: "Limited information held. Casey doesn't wish to explore at present." },
    ],
    extendedFamily: [
      { relation: "None active", name: "No active extended family contacts", significance: "Family connections lost during early neglect.", contactStatus: "None" },
    ],
    importantNonFamilyAdults: [
      { name: "Anna (key worker)", role: "Key worker, Oak House", significance: "Closest adult relationship. Trust-building over years.", ongoing: true },
      { name: "Sarah (Art Therapist)", role: "Art Therapist", significance: "Therapeutic anchor. Trusted figure.", ongoing: true },
      { name: "Lisa Chen (SW)", role: "Allocated Social Worker", significance: "Long-term. Knows Casey since age 5.", ongoing: true },
      { name: "Ellie (art group friend)", role: "Peer friend", significance: "First sustained peer friendship.", ongoing: true },
    ],
    significantPlaces: [
      { place: "Oak House (since age 10)", significance: "Casey's primary home. Sense of safety here." },
      { place: "Art group community centre", significance: "Belonging, identity, peer connection." },
      { place: "Riverside Library", significance: "Sensory-friendly reading hour. Familiar place." },
    ],
    pastSiblingRelationships: [],
    estrangedRelationships: [
      "Birth parents — by court order, by Casey's preference",
      "Extended birth family — relationships lost early",
    ],
    familyMyths: "Casey's narrative is being authored anew. Past framed as 'I had a hard start. I'm safe now.' Future-oriented. Animals and art carry identity weight more than birth family.",
    childKnowsTheStory: "Yes — age-appropriately. Knows about neglect, removal, court order. Knows letters arrive twice a year. Doesn't want more detail at present.",
    ageAppropriateSummary: "Casey came to Oak House when their first family couldn't look after them safely. Casey gets letters from birth mum twice a year. Anna, Sarah from art therapy, and Lisa the social worker are the most important grown-ups. Friends like Ellie matter too. Animals and nature are family in their own way for Casey.",
    contactDirectoryLink: "/contact-directory",
    identityImpact: "Identity built around art, animals, sensory profile, and close trusted relationships. Family-of-origin less central than for most. Building chosen-family narrative.",
    protectiveRelationships: ["Anna (key worker)", "Sarah (art therapist)", "Lisa (SW)", "Ellie (friend)"],
    riskRelationships: ["Birth family — risk of disregulation if contact escalates without preparation"],
    childInputProvided: true,
    childAgeWhenCreated: 11,
    lastUpdatedDate: d(-14),
    reviewedBy: "staff_anna",
    sensitiveContent: true,
    shareableWith: ["Allocated SW", "IRO", "Art therapist", "School SENCO on need-to-know"],
  },
];

const exportCols: ExportColumn<GenogramEntry>[] = [
  { header: "Young Person", accessor: (r: GenogramEntry) => getYPName(r.youngPerson) },
  { header: "Generations Mapped", accessor: (r: GenogramEntry) => r.generationsRepresented.length.toString() },
  { header: "Active Contacts", accessor: (r: GenogramEntry) => r.immediateFamily.filter((f) => f.contactStatus === "Active").length.toString() },
  { header: "Important Non-Family", accessor: (r: GenogramEntry) => r.importantNonFamilyAdults.length.toString() },
  { header: "Child Input", accessor: (r: GenogramEntry) => r.childInputProvided ? "Yes" : "No" },
  { header: "Last Updated", accessor: (r: GenogramEntry) => r.lastUpdatedDate },
  { header: "Reviewed By", accessor: (r: GenogramEntry) => getStaffName(r.reviewedBy) },
];

const contactColour: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  "Letterbox only": "bg-blue-100 text-blue-800",
  Indirect: "bg-purple-100 text-purple-800",
  Restricted: "bg-amber-100 text-amber-800",
  "No contact": "bg-slate-100 text-slate-800",
};

export default function FamilyTreeGenogramPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((g) => g.youngPerson === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.youngPerson.localeCompare(b.youngPerson);
        case "updated":
          return b.lastUpdatedDate.localeCompare(a.lastUpdatedDate);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy]);

  const total = data.length;
  const allChildInput = data.every((g) => g.childInputProvided);
  const updatedRecently = data.filter((g) => g.lastUpdatedDate >= d(-90)).length;

  return (
    <PageShell
      title="Family Tree / Genogram"
      subtitle="Each child's relational map — family, chosen family, places, identity"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="family-tree-genogram" />
          <PrintButton title="Family Tree / Genogram" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Genograms</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildInput ? "100%" : `${data.filter((g) => g.childInputProvided).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child Co-Authored</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{updatedRecently}</p>
          <p className="text-xs text-muted-foreground">Updated (90d)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">100%</p>
          <p className="text-xs text-muted-foreground">Linked to Life Story</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          A genogram is more than a family tree — it&apos;s the child&apos;s map of who matters. Family,
          chosen family, important places, and identity-shaping relationships. Co-authored with each child,
          held with care, shared on a strict need-to-know basis.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((g) => {
          const isExpanded = expandedId === g.id;

          return (
            <div key={g.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : g.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Users className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(g.youngPerson)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {g.immediateFamily.length} immediate family &middot; {g.importantNonFamilyAdults.length} chosen family &middot; Updated {g.lastUpdatedDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {g.sensitiveContent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />Sensitive
                    </span>
                  )}
                  {g.childInputProvided && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Co-authored</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* sensitive notice */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                    <EyeOff className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-purple-800">
                      <strong>Confidential:</strong> Genogram contains sensitive identity information.
                      Shareable with: {g.shareableWith.join(", ")}. Not for general staff distribution.
                    </p>
                  </div>

                  {/* generations */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Generations Represented</p>
                    <ul className="space-y-1">
                      {g.generationsRepresented.map((gen, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-pink-600 mt-0.5">•</span>
                          <span>{gen}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* immediate family */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Immediate Family</p>
                    <div className="space-y-2">
                      {g.immediateFamily.map((f, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{f.relation}: {f.name}</p>
                            <div className="flex items-center gap-1">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", contactColour[f.contactStatus] ?? "bg-slate-100 text-slate-700")}>
                                {f.contactStatus}
                              </span>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                                f.status === "Living" ? "bg-emerald-50 text-emerald-700" :
                                f.status === "Deceased" ? "bg-slate-100 text-slate-700" :
                                "bg-amber-50 text-amber-700"
                              )}>
                                {f.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{f.safeguardingNotes}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* extended family */}
                  {g.extendedFamily.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Extended Family</p>
                      <div className="space-y-1">
                        {g.extendedFamily.map((f, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p><strong>{f.relation}</strong> {f.name && `(${f.name})`} &middot; <span className="text-muted-foreground">{f.contactStatus}</span></p>
                            <p className="text-xs text-muted-foreground">{f.significance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* chosen family */}
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Chosen Family / Important Non-Family Adults
                    </p>
                    <div className="space-y-1">
                      {g.importantNonFamilyAdults.map((p, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p><strong>{p.name}</strong> ({p.role})</p>
                          <p className="text-xs text-muted-foreground">{p.significance}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* significant places */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Significant Places</p>
                    <ul className="space-y-1">
                      {g.significantPlaces.map((p, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          <span><strong>{p.place}</strong> — {p.significance}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* protective and risk */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Protective Relationships</p>
                      <ul className="space-y-1">
                        {g.protectiveRelationships.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Heart className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Risk Relationships</p>
                      <ul className="space-y-1">
                        {g.riskRelationships.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* family myths and child knowledge */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Family Narratives</p>
                    <p className="text-sm">{g.familyMyths}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">What The Child Knows</p>
                    <p className="text-sm">{g.childKnowsTheStory}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Age-Appropriate Summary (For Child)</p>
                    <p className="text-sm italic">{g.ageAppropriateSummary}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Identity Impact</p>
                    <p className="text-sm">{g.identityImpact}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Eye className="h-3 w-3 inline mr-1" />Created when child was age {g.childAgeWhenCreated}</span>
                    <span>Last updated: {g.lastUpdatedDate}</span>
                    <span>Reviewed by: {getStaffName(g.reviewedBy)}</span>
                    <span><Phone className="h-3 w-3 inline mr-1" />Contact details in Contact Directory</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Genograms support Quality Standard 1 (child-centred care),
          Quality Standard 9 (relationships), UNCRC Article 8 (right to identity), and trauma-informed
          practice. Co-authored with each child, updated annually or when significant changes occur,
          shared on a strict need-to-know basis. Linked to Life Story Work, Personal Passport, Cultural
          Identity, Trauma-Informed Timeline, and Contact Directory.
        </p>
      </div>
    </PageShell>
  );
}
