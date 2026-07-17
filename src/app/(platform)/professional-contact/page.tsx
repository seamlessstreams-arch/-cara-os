"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Users, Search, Phone, Mail, Building2, Shield,
  GraduationCap, Briefcase, UserCheck, Plus,
  ChevronRight,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Static reference data ────────────────────────────────────────────────────

interface ProfessionalContact {
  id: string;
  name: string;
  role: string;
  organisation: string;
  category: "social_work" | "camhs" | "education" | "police" | "health" | "legal" | "advocacy" | "other";
  phone: string;
  email: string;
  linkedYoungPeople: string[];
  isPrimary: boolean;
}

const CATEGORY_META: Record<ProfessionalContact["category"], { label: string; icon: React.ElementType; colour: string }> = {
  social_work:  { label: "Social Work",  icon: UserCheck,      colour: "text-blue-600 bg-blue-50 border-blue-200" },
  camhs:        { label: "CAMHS",        icon: Shield,         colour: "text-purple-600 bg-purple-50 border-purple-200" },
  education:    { label: "Education",    icon: GraduationCap,  colour: "text-amber-600 bg-amber-50 border-amber-200" },
  police:       { label: "Police",       icon: Shield,         colour: "text-slate-600 bg-slate-50 border-slate-200" },
  health:       { label: "Health",       icon: Building2,      colour: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  legal:        { label: "Legal",        icon: Briefcase,      colour: "text-rose-600 bg-rose-50 border-rose-200" },
  advocacy:     { label: "Advocacy",     icon: Users,          colour: "text-sky-600 bg-sky-50 border-sky-200" },
  other:        { label: "Other",        icon: Users,          colour: "text-gray-600 bg-gray-50 border-gray-200" },
};

const DEMO_CONTACTS: ProfessionalContact[] = [
  {
    id: "pc_1",
    name: "Sarah Mitchell",
    role: "Social Worker",
    organisation: "Coventry City Council",
    category: "social_work",
    phone: "024 7683 1000",
    email: "s.mitchell@coventry.gov.uk",
    linkedYoungPeople: ["Alex T.", "Jordan H."],
    isPrimary: true,
  },
  {
    id: "pc_2",
    name: "Dr Anil Patel",
    role: "CAMHS Consultant",
    organisation: "CWPT NHS Trust",
    category: "camhs",
    phone: "024 7696 1000",
    email: "anil.patel@cwpt.nhs.uk",
    linkedYoungPeople: ["Alex T."],
    isPrimary: true,
  },
  {
    id: "pc_3",
    name: "Helen Brooks",
    role: "Virtual School Head",
    organisation: "Coventry Virtual School",
    category: "education",
    phone: "024 7683 2200",
    email: "h.brooks@coventry.gov.uk",
    linkedYoungPeople: ["Jordan H.", "Casey L."],
    isPrimary: false,
  },
  {
    id: "pc_4",
    name: "PC David Okonkwo",
    role: "Youth Liaison Officer",
    organisation: "West Midlands Police",
    category: "police",
    phone: "101",
    email: "david.okonkwo@westmidlands.police.uk",
    linkedYoungPeople: [],
    isPrimary: false,
  },
  {
    id: "pc_5",
    name: "Dr Fiona Gallagher",
    role: "Looked After Children Nurse",
    organisation: "Coventry and Rugby CCG",
    category: "health",
    phone: "024 7696 5500",
    email: "f.gallagher@coventryrugbyccg.nhs.uk",
    linkedYoungPeople: ["Alex T.", "Jordan H.", "Casey L."],
    isPrimary: true,
  },
  {
    id: "pc_6",
    name: "Rachel Warren",
    role: "Children's Advocate",
    organisation: "National Youth Advocacy Service",
    category: "advocacy",
    phone: "0808 808 1001",
    email: "r.warren@nyas.net",
    linkedYoungPeople: ["Casey L."],
    isPrimary: false,
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfessionalContactPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<ProfessionalContact["category"] | "all">("all");

  const filtered = demoSeed(DEMO_CONTACTS).filter((c) => {
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.organisation.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.entries(CATEGORY_META) as [ProfessionalContact["category"], typeof CATEGORY_META[ProfessionalContact["category"]]][];

  return (
    <PageShell
      title="Professional Contacts"
      subtitle="External professionals involved in the care of young people"
      icon={<Users className="h-5 w-5 text-blue-600" />}
      showQuickCreate={false}
      actions={
        <Button size="sm" className="gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white">
          <Plus className="h-3.5 w-3.5" />
          Add Contact
        </Button>
      }
    >
      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, role, or organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterCategory("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
              filterCategory === "all"
                ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
            )}
          >
            All
          </button>
          {categories.map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setFilterCategory(key)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                filterCategory === key
                  ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
              )}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No contacts found</p>
          <p className="text-xs text-slate-400">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((contact) => {
            const meta = CATEGORY_META[contact.category];
            const Icon = meta.icon;
            return (
              <Card key={contact.id} className="hover:bg-[var(--cs-surface)] transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-xl border shrink-0", meta.colour)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{contact.name}</CardTitle>
                        <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">{contact.role}</p>
                        <p className="text-xs text-[var(--cs-text-muted)]">{contact.organisation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {contact.isPrimary && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Primary
                        </Badge>
                      )}
                      <Badge variant="outline" className={cn("text-[10px] border", meta.colour)}>
                        {meta.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span>{contact.email}</span>
                    </div>
                    {contact.linkedYoungPeople.length > 0 && (
                      <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
                        <Users className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                        <span>
                          Linked to: {contact.linkedYoungPeople.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Regulatory note */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory Basis — </span>
        Children&apos;s Homes (England) Regulations 2015: Reg 5 (engaging with wider
        professionals). Care Planning Regulations 2010: multi-agency working and contact
        records. Working Together to Safeguard Children 2023: inter-agency information sharing.
      </div>
    </PageShell>
  );
}
