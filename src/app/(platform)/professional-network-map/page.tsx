"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  Users,
  AlertTriangle,
  Clock,
  Network,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName }    from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

interface ProfessionalContact {
  id: string;
  youngPerson: string;
  role: string;
  name: string;
  organisation: string;
  phone: string;
  email: string;
  lastContact: string;
  contactFrequency: "Weekly" | "Fortnightly" | "Monthly" | "Termly" | "Quarterly" | "Annually";
  keyResponsibilities: string[];
  notes: string;
  isActive: boolean;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: ProfessionalContact[] = [
  {
    id: "pn1", youngPerson: "yp_alex", role: "Social Worker",
    name: "Sarah Mitchell", organisation: "Westshire County Council",
    phone: "01onal 555 2301", email: "s.mitchell@westshire.gov.uk",
    lastContact: d(-5), contactFrequency: "Fortnightly",
    keyResponsibilities: ["Care planning and statutory reviews", "Placement stability oversight", "Contact arrangements with birth family", "Pathway planning coordination"],
    notes: "Allocated SW since January 2025. Good working relationship with Alex. Responsive to calls.",
    isActive: true,
  },
  {
    id: "pn2", youngPerson: "yp_alex", role: "IRO",
    name: "David Kowalski", organisation: "Westshire County Council",
    phone: "01onal 555 2450", email: "d.kowalski@westshire.gov.uk",
    lastContact: d(-35), contactFrequency: "Quarterly",
    keyResponsibilities: ["Chair LAC reviews", "Monitor care plan implementation", "Ensure child's voice is heard", "Escalate concerns via dispute resolution"],
    notes: "Has chaired Alex's last three reviews. Alex reports feeling comfortable with David.",
    isActive: true,
  },
  {
    id: "pn3", youngPerson: "yp_alex", role: "CAMHS Therapist",
    name: "Dr Amira Hassan", organisation: "NHS Westshire CAMHS",
    phone: "01onal 555 8800", email: "amira.hassan@nhs.net",
    lastContact: d(-10), contactFrequency: "Weekly",
    keyResponsibilities: ["Individual therapy sessions", "Trauma-informed interventions", "Consultation to residential staff", "Contribute to care planning"],
    notes: "Alex attends weekly sessions. Therapist has provided helpful strategies for the team around emotional regulation.",
    isActive: true,
  },
  {
    id: "pn4", youngPerson: "yp_alex", role: "GP",
    name: "Dr Robert Chen", organisation: "Riverside Medical Practice",
    phone: "01onal 555 1100", email: "reception@riverside-gp.nhs.uk",
    lastContact: d(-60), contactFrequency: "Quarterly",
    keyResponsibilities: ["Primary healthcare", "Medication reviews", "Health assessments", "Referrals to specialist services"],
    notes: "Alex registered since placement. Annual health assessment completed March 2026.",
    isActive: true,
  },
  {
    id: "pn5", youngPerson: "yp_jordan", role: "Social Worker",
    name: "Karen Osei", organisation: "Westshire County Council",
    phone: "01onal 555 2310", email: "k.osei@westshire.gov.uk",
    lastContact: d(-3), contactFrequency: "Weekly",
    keyResponsibilities: ["Care planning", "Risk assessment and management", "Police liaison regarding online safety incident", "Multi-agency coordination"],
    notes: "Increased contact frequency following recent safeguarding concerns. Very proactive.",
    isActive: true,
  },
  {
    id: "pn6", youngPerson: "yp_jordan", role: "IRO",
    name: "Patricia Langley", organisation: "Westshire County Council",
    phone: "01onal 555 2455", email: "p.langley@westshire.gov.uk",
    lastContact: d(-50), contactFrequency: "Quarterly",
    keyResponsibilities: ["Chair LAC reviews", "Monitor care plan progress", "Oversight of restriction of liberty", "Ensure proportionality of risk measures"],
    notes: "Reviewed Jordan's Snapchat restriction at last review and confirmed proportionality.",
    isActive: true,
  },
  {
    id: "pn7", youngPerson: "yp_jordan", role: "School SENCO",
    name: "Mark Thompson", organisation: "Westshire Academy",
    phone: "01onal 555 6000", email: "m.thompson@westshire-academy.sch.uk",
    lastContact: d(-20), contactFrequency: "Monthly",
    keyResponsibilities: ["EHCP coordination", "Learning support planning", "PEP attendance", "Liaison with Virtual School"],
    notes: "Positive relationship. Jordan making progress with additional literacy support.",
    isActive: true,
  },
  {
    id: "pn8", youngPerson: "yp_jordan", role: "YOT Worker",
    name: "Jason Briggs", organisation: "Westshire Youth Offending Team",
    phone: "01onal 555 7700", email: "j.briggs@westshire-yot.gov.uk",
    lastContact: d(-8), contactFrequency: "Fortnightly",
    keyResponsibilities: ["Supervision of community order", "Offending behaviour work", "Restorative justice coordination", "Risk management liaison"],
    notes: "Jordan engaging well with sessions. Next court review in 6 weeks.",
    isActive: true,
  },
  {
    id: "pn9", youngPerson: "yp_jordan", role: "Virtual School Head",
    name: "Claire Donovan", organisation: "Westshire Virtual School",
    phone: "01onal 555 4500", email: "c.donovan@westshire.gov.uk",
    lastContact: d(-40), contactFrequency: "Termly",
    keyResponsibilities: ["Oversight of education for looked after children", "Pupil Premium Plus allocation", "PEP quality assurance", "School placement stability"],
    notes: "Approved additional tuition funding for Jordan via PP+.",
    isActive: true,
  },
  {
    id: "pn10", youngPerson: "yp_casey", role: "Social Worker",
    name: "Liam Gallagher", organisation: "Westshire County Council",
    phone: "01onal 555 2320", email: "l.gallagher@westshire.gov.uk",
    lastContact: d(-12), contactFrequency: "Fortnightly",
    keyResponsibilities: ["Pathway planning for leaving care", "Accommodation sourcing", "Financial entitlements coordination", "PA allocation oversight"],
    notes: "Working closely with Casey on transition plan. Good rapport established.",
    isActive: true,
  },
  {
    id: "pn11", youngPerson: "yp_casey", role: "Advocate",
    name: "Helen Watts", organisation: "Coram Children's Legal Centre",
    phone: "020 7713 0089", email: "h.watts@coramclc.org.uk",
    lastContact: d(-10), contactFrequency: "Monthly",
    keyResponsibilities: ["Legal advocacy for leaving care rights", "Challenge LA decisions if needed", "Ensure entitlements are met", "Empower Casey to self-advocate"],
    notes: "Casey values Helen's input. Has clarified leaving care financial entitlements.",
    isActive: true,
  },
  {
    id: "pn12", youngPerson: "yp_casey", role: "GP",
    name: "Dr Fiona Patel", organisation: "Hillside Surgery",
    phone: "01onal 555 1200", email: "reception@hillside-surgery.nhs.uk",
    lastContact: d(-90), contactFrequency: "Quarterly",
    keyResponsibilities: ["Primary healthcare", "Sexual health advice", "Mental health screening", "Health passport for leaving care"],
    notes: "Health passport needs completing before Casey turns 18. Appointment booked.",
    isActive: true,
  },
  {
    id: "pn13", youngPerson: "yp_casey", role: "CAMHS Therapist",
    name: "Dr Nina Okafor", organisation: "NHS Westshire CAMHS",
    phone: "01onal 555 8810", email: "nina.okafor@nhs.net",
    lastContact: d(-28), contactFrequency: "Fortnightly",
    keyResponsibilities: ["Therapeutic support around identity and transition", "Anxiety management strategies", "Consultation to keyworker", "Transition to adult services planning"],
    notes: "Transition to adult mental health services being planned for Casey's 18th birthday.",
    isActive: true,
  },
  {
    id: "pn14", youngPerson: "yp_alex", role: "Advocate",
    name: "Marcus Brown", organisation: "NYAS",
    phone: "0808 808 1001", email: "m.brown@nyas.net",
    lastContact: d(-14), contactFrequency: "Monthly",
    keyResponsibilities: ["Independent advocacy at LAC reviews", "Support Alex's voice in meetings", "Help Alex understand rights", "Challenge decisions on Alex's behalf if requested"],
    notes: "Alex has a strong relationship with Marcus. Attendance at reviews has improved Alex's confidence.",
    isActive: true,
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const ROLES = [...new Set(SEED.map((r) => r.role))].sort();

const FREQUENCY_DAYS: Record<string, number> = {
  Weekly: 7,
  Fortnightly: 14,
  Monthly: 30,
  Quarterly: 90,
  Termly: 120,
  Annually: 365,
};

function getContactFreshness(lastContact: string, frequency: string): "green" | "amber" | "red" {
  const daysSince = Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
  const expected = FREQUENCY_DAYS[frequency] ?? 30;
  if (daysSince <= expected) return "green";
  if (daysSince <= expected * 1.5) return "amber";
  return "red";
}

const FRESHNESS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  green: { bg: "bg-green-100", text: "text-green-700", label: "Up to date" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", label: "Due" },
  red:   { bg: "bg-red-100",   text: "text-red-700",   label: "Overdue" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function ProfessionalNetworkMapPage() {
  const [data] = useState<ProfessionalContact[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("yp");

  /* ── stats ── */
  const stats = useMemo(() => {
    const active = data.filter((r) => r.isActive);
    const overdue = active.filter((r) => getContactFreshness(r.lastContact, r.contactFrequency) === "red").length;
    const ypSet = new Set(active.map((r) => r.youngPerson));
    const avgNetwork = ypSet.size > 0 ? Math.round(active.length / ypSet.size) : 0;
    const activeReferrals = active.filter((r) => r.role === "Advocate" || r.role === "CAMHS Therapist" || r.role === "YOT Worker").length;
    return { total: active.length, overdue, avgNetwork, activeReferrals };
  }, [data]);

  /* ── filtered + sorted ── */
  const filtered = useMemo(() => {
    let list = [...data];
    if (filterYP !== "all") list = list.filter((r) => r.youngPerson === filterYP);
    if (filterRole !== "all") list = list.filter((r) => r.role === filterRole);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.organisation.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "role": return a.role.localeCompare(b.role);
        case "lastContact": return b.lastContact.localeCompare(a.lastContact);
        case "name": return a.name.localeCompare(b.name);
        default: return a.youngPerson.localeCompare(b.youngPerson);
      }
    });
    return list;
  }, [data, filterYP, filterRole, search, sortBy]);

  /* ── grouped by YP ── */
  const grouped = useMemo(() => {
    const map = new Map<string, ProfessionalContact[]>();
    for (const item of filtered) {
      const existing = map.get(item.youngPerson) || [];
      existing.push(item);
      map.set(item.youngPerson, existing);
    }
    return map;
  }, [filtered]);

  /* ── export ── */
  const exportCols: ExportColumn<ProfessionalContact>[] = [
    { header: "Young Person",        accessor: (r: ProfessionalContact) => getYPName(r.youngPerson) },
    { header: "Role",                accessor: (r: ProfessionalContact) => r.role },
    { header: "Name",                accessor: (r: ProfessionalContact) => r.name },
    { header: "Organisation",        accessor: (r: ProfessionalContact) => r.organisation },
    { header: "Phone",               accessor: (r: ProfessionalContact) => r.phone },
    { header: "Email",               accessor: (r: ProfessionalContact) => r.email },
    { header: "Last Contact",        accessor: (r: ProfessionalContact) => r.lastContact },
    { header: "Contact Frequency",   accessor: (r: ProfessionalContact) => r.contactFrequency },
    { header: "Key Responsibilities", accessor: (r: ProfessionalContact) => r.keyResponsibilities.join("; ") },
    { header: "Notes",               accessor: (r: ProfessionalContact) => r.notes },
    { header: "Active",              accessor: (r: ProfessionalContact) => r.isActive ? "Yes" : "No" },
  ];

  const ypIds = [...new Set(data.map((r) => r.youngPerson))];

  return (
    <PageShell
      title="Professional Network Map"
      subtitle="Quality Standard 1 — Multi-agency professional contacts for each child"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton<ProfessionalContact> data={data} columns={exportCols} filename="professional-network-map" />
          <PrintButton title="Professional Network Map" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Total Professionals", v: stats.total, icon: Users, c: "text-blue-600" },
            { l: "Contacts Overdue",    v: stats.overdue, icon: AlertTriangle, c: "text-red-600" },
            { l: "Avg Network Size",    v: stats.avgNetwork, icon: Network, c: "text-purple-600" },
            { l: "Active Referrals",    v: stats.activeReferrals, icon: Clock, c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── filters / sort ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search professionals…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="yp">Young Person</option>
              <option value="role">Role</option>
              <option value="name">Name</option>
              <option value="lastContact">Last Contact</option>
            </select>
          </div>
        </div>

        {/* ── grouped cards ── */}
        {[...grouped.entries()].map(([ypId, contacts]) => (
          <div key={ypId} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {getYPName(ypId)} — {contacts.length} professional{contacts.length !== 1 ? "s" : ""}
            </h2>

            {contacts.map((rec) => {
              const freshness = getContactFreshness(rec.lastContact, rec.contactFrequency);
              const style = FRESHNESS_STYLES[freshness];

              return (
                <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
                  <button onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-brand" />
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{rec.name}</h3>
                          <span className="text-sm text-muted-foreground">— {rec.role}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", style.bg, style.text)}>
                            {style.label}
                          </span>
                          {!rec.isActive && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.organisation} · Last contact: {rec.lastContact} · {rec.contactFrequency}</p>
                      </div>
                    </div>
                    {expandedId === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>

                  {expandedId === rec.id && (
                    <div className="border-t p-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Phone:</span> {rec.phone}</div>
                        <div><span className="text-muted-foreground">Email:</span> {rec.email}</div>
                        <div><span className="text-muted-foreground">Frequency:</span> {rec.contactFrequency}</div>
                        <div><span className="text-muted-foreground">Last Contact:</span> {rec.lastContact}</div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-1">Key Responsibilities</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {rec.keyResponsibilities.map((resp, idx) => <li key={idx}>{resp}</li>)}
                        </ul>
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
              );
            })}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No professionals match the current filters.</div>
        )}

        {/* ── regulatory note ── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Quality Standard 1 — Child-centred care</strong> — Each child&apos;s professional network must be clearly documented and kept up to date. Effective multi-agency working requires that all professionals involved in a child&apos;s care are known to staff, that contact is maintained at the agreed frequency, and that roles and responsibilities are clearly understood by the whole team.
        </div>
      </div>
    </PageShell>
  );
}
