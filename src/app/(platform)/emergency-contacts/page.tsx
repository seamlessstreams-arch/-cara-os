"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY CONTACTS BOARD
// Digital version of the office emergency contacts board. Shows key contacts
// for each child (social worker, IRO, parents, school, GP, dentist, CAMHS)
// and home-level emergency contacts (on-call manager, emergency maintenance,
// police, ambulance, fire, out-of-hours social care, Ofsted, LADO, poison
// information, NHS 111).
// All contacts reviewed monthly — Reg 44 visitor should check accuracy.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Phone, User, Building, Shield, Heart, AlertTriangle,
  Clock, Calendar, Edit2, Plus, Stethoscope, GraduationCap,
  UserCheck, Baby, CheckCircle2, Info,
} from "lucide-react";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContactRole =
  | "social_worker"
  | "iro"
  | "parent_carer"
  | "school"
  | "gp"
  | "dentist"
  | "camhs"
  | "other";

interface ChildContact {
  id: string;
  role: ContactRole;
  name: string;
  organisation?: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  notes?: string;
}

interface ChildContactCard {
  childId: string;
  contacts: ChildContact[];
}

interface HomeContact {
  id: string;
  label: string;
  number: string;
  description: string;
  category: "emergency_999" | "on_call" | "local_service" | "regulatory";
  available: string;
}

interface OnCallEntry {
  day: string;
  date: string;
  managerId: string;
  phone: string;
}

// ── Role config ───────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<ContactRole, { label: string; icon: React.ElementType; colour: string }> = {
  social_worker:  { label: "Social Worker",  icon: Shield,         colour: "bg-blue-100 text-blue-700" },
  iro:            { label: "IRO",            icon: UserCheck,      colour: "bg-purple-100 text-purple-700" },
  parent_carer:   { label: "Parent / Carer", icon: Heart,          colour: "bg-pink-100 text-pink-700" },
  school:         { label: "School",         icon: GraduationCap,  colour: "bg-amber-100 text-amber-700" },
  gp:             { label: "GP",             icon: Stethoscope,    colour: "bg-green-100 text-green-700" },
  dentist:        { label: "Dentist",        icon: Stethoscope,    colour: "bg-cyan-100 text-cyan-700" },
  camhs:          { label: "CAMHS",          icon: Baby,           colour: "bg-rose-100 text-rose-700" },
  other:          { label: "Other",          icon: User,           colour: "bg-slate-100 text-slate-700" },
};

const CATEGORY_COLOURS: Record<HomeContact["category"], string> = {
  emergency_999: "bg-red-600 text-white",
  on_call:       "bg-amber-100 text-amber-800",
  local_service: "bg-blue-100 text-blue-800",
  regulatory:    "bg-slate-100 text-slate-700",
};

// ── Helper ────────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const weekday = (offset: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toLocaleDateString("en-GB", { weekday: "long" });
};

const shortDate = (offset: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// ── Seed: Home-level contacts ─────────────────────────────────────────────────

const HOME_CONTACTS: HomeContact[] = [
  { id: "hc_001", label: "Police / Ambulance / Fire", number: "999",                description: "All life-threatening emergencies",                         category: "emergency_999", available: "24/7" },
  { id: "hc_002", label: "NHS 111",                   number: "111",                description: "Urgent medical advice (non-life-threatening)",             category: "emergency_999", available: "24/7" },
  { id: "hc_003", label: "On-Call Manager",            number: "07XXX XXXXXX",       description: "Acacia on-call manager — all escalations outside hours",   category: "on_call",       available: "24/7" },
  { id: "hc_004", label: "Emergency Maintenance",      number: "07XXX XXXXXX",       description: "Boiler, flooding, lock-out, structural issues",            category: "on_call",       available: "24/7" },
  { id: "hc_005", label: "Out-of-Hours Social Care",   number: "01332 786 968",      description: "Derby City EDT — safeguarding referrals outside hours",    category: "local_service", available: "Evenings, weekends, bank holidays" },
  { id: "hc_006", label: "MASH",                       number: "01332 641 172",      description: "Multi-Agency Safeguarding Hub — office hours referrals",   category: "local_service", available: "Mon–Fri 9am–5pm" },
  { id: "hc_007", label: "Police Non-Emergency",       number: "101",                description: "Non-urgent police reports, missing persons follow-up",     category: "local_service", available: "24/7" },
  { id: "hc_008", label: "Ofsted",                     number: "0300 123 1231",      description: "Notifiable events, regulatory queries, complaints",        category: "regulatory",    available: "Mon–Fri 8am–6pm" },
  { id: "hc_009", label: "LADO (Derby)",               number: "01332 642 376",      description: "Allegations against staff — Local Authority Designated Officer", category: "regulatory", available: "Mon–Fri 9am–5pm" },
  { id: "hc_010", label: "National Poisons Information", number: "0344 892 0111",    description: "TOXBASE — suspected poisoning or overdose advice",         category: "local_service", available: "24/7" },
  { id: "hc_011", label: "Gas Emergency",              number: "0800 111 999",       description: "Gas leak or carbon monoxide concern",                      category: "emergency_999", available: "24/7" },
  { id: "hc_012", label: "Childline",                  number: "0800 1111",          description: "Confidential helpline for children — display for YP",      category: "local_service", available: "24/7" },
];

// ── Seed: Per-child contacts ──────────────────────────────────────────────────

const CHILD_CONTACTS: ChildContactCard[] = [
  {
    childId: "yp_alex",
    contacts: [
      { id: "cc_a1", role: "social_worker",  name: "Karen Holding",     organisation: "Derby City Council",     phone: "01332 641 700", email: "karen.holding@derby.gov.uk", notes: "Available Mon–Fri 9–5. Out of hours: EDT." },
      { id: "cc_a2", role: "iro",            name: "David Peters",      organisation: "Derby City Council",     phone: "01332 641 800", email: "david.peters@derby.gov.uk" },
      { id: "cc_a3", role: "parent_carer",   name: "Mark (Birth Father)", organisation: "",                     phone: "07XXX XXXXXX", notes: "Supervised contact only — see contact plan" },
      { id: "cc_a4", role: "school",         name: "Oakfield Academy",  organisation: "DSL: Mrs Patterson",     phone: "01332 600 200", email: "office@oakfield.derby.sch.uk", notes: "DSL: Mrs Patterson — direct line 01332 600 201" },
      { id: "cc_a5", role: "gp",             name: "Dr Mehta",          organisation: "Elm Street Surgery",     phone: "01332 500 100" },
      { id: "cc_a6", role: "dentist",        name: "Mr Singh",          organisation: "High Street Dental",     phone: "01332 550 200" },
    ],
  },
  {
    childId: "yp_jordan",
    contacts: [
      { id: "cc_j1", role: "social_worker",  name: "Michael Osei",        organisation: "Nottinghamshire CC",     phone: "0115 977 3100", email: "michael.osei@nottscc.gov.uk", notes: "Prefers email contact initially" },
      { id: "cc_j2", role: "iro",            name: "Sarah Williams",      organisation: "Nottinghamshire CC",     phone: "0115 977 3200", email: "sarah.williams@nottscc.gov.uk" },
      { id: "cc_j3", role: "parent_carer",   name: "Mother",              organisation: "",                       phone: "—",             notes: "Contact via SW only — no direct contact with home" },
      { id: "cc_j4", role: "school",         name: "Oakfield Academy",    organisation: "DSL: Mrs Patterson",     phone: "01332 600 200", email: "office@oakfield.derby.sch.uk" },
      { id: "cc_j5", role: "gp",             name: "Dr Mehta",            organisation: "Elm Street Surgery",     phone: "01332 500 100", notes: "Penicillin allergy on file" },
      { id: "cc_j6", role: "dentist",        name: "Mr Singh",            organisation: "High Street Dental",     phone: "01332 550 200" },
      { id: "cc_j7", role: "camhs",          name: "Dr Amara Okonkwo",    organisation: "Derby CAMHS",            phone: "01332 623 700", email: "a.okonkwo@derbycamhs.nhs.uk", notes: "Fortnightly sessions — next review in 4 weeks" },
    ],
  },
  {
    childId: "yp_casey",
    contacts: [
      { id: "cc_c1", role: "social_worker",  name: "Fiona Brennan",       organisation: "Derbyshire CC",          phone: "01629 533 190", email: "fiona.brennan@derbyshire.gov.uk" },
      { id: "cc_c2", role: "iro",            name: "James Cooper",        organisation: "Derbyshire CC",          phone: "01629 533 200", email: "james.cooper@derbyshire.gov.uk" },
      { id: "cc_c3", role: "parent_carer",   name: "Margaret (Grandmother)", organisation: "",                    phone: "07XXX XXXXXX", notes: "Approved family contact — unsupervised visits agreed" },
      { id: "cc_c4", role: "school",         name: "City College",        organisation: "DSL: Mr Ahmed",          phone: "01332 600 400", email: "office@citycollege.derby.sch.uk" },
      { id: "cc_c5", role: "gp",             name: "Dr Mehta",            organisation: "Elm Street Surgery",     phone: "01332 500 100", notes: "Manages medication reviews — nut allergy on file" },
      { id: "cc_c6", role: "dentist",        name: "Overdue",             organisation: "Community Dental Referral", phone: "01332 340 131", notes: "Awaiting community dental referral — chase monthly" },
      { id: "cc_c7", role: "camhs",          name: "Dr Patterson",        organisation: "Derby CAMHS",            phone: "01332 623 700", email: "r.patterson@derbycamhs.nhs.uk", notes: "Managing anxiety — 6-weekly reviews" },
    ],
  },
];

// ── Seed: On-call rota ────────────────────────────────────────────────────────

const ON_CALL_ROTA: OnCallEntry[] = [
  { day: weekday(0), date: shortDate(0), managerId: "staff_darren", phone: "07XXX XXXXXX" },
  { day: weekday(1), date: shortDate(1), managerId: "staff_ryan",   phone: "07XXX XXXXXX" },
  { day: weekday(2), date: shortDate(2), managerId: "staff_darren", phone: "07XXX XXXXXX" },
  { day: weekday(3), date: shortDate(3), managerId: "staff_ryan",   phone: "07XXX XXXXXX" },
  { day: weekday(4), date: shortDate(4), managerId: "staff_darren", phone: "07XXX XXXXXX" },
  { day: weekday(5), date: shortDate(5), managerId: "staff_ryan",   phone: "07XXX XXXXXX" },
  { day: weekday(6), date: shortDate(6), managerId: "staff_darren", phone: "07XXX XXXXXX" },
];

// ── Metadata ──────────────────────────────────────────────────────────────────

const LAST_REVIEWED = d(-12);
const NEXT_REVIEW   = d(18);

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function EmergencyContactsPage() {
  const [editingContact, setEditingContact] = useState<ChildContact | null>(null);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [addingForChild, setAddingForChild] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for add/edit dialog
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<ContactRole>("other");
  const [formOrg, setFormOrg] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const isToday = (entry: OnCallEntry) => entry.date === shortDate(0);

  // ── Dialog handlers ─────────────────────────────────────────────────────────

  function openEditDialog(contact: ChildContact, childId: string) {
    setEditingContact(contact);
    setEditingChildId(childId);
    setAddingForChild(null);
    setFormName(contact.name);
    setFormRole(contact.role);
    setFormOrg(contact.organisation || "");
    setFormPhone(contact.phone);
    setFormEmail(contact.email || "");
    setFormNotes(contact.notes || "");
    setDialogOpen(true);
  }

  function openAddDialog(childId: string) {
    setEditingContact(null);
    setEditingChildId(null);
    setAddingForChild(childId);
    setFormName("");
    setFormRole("other");
    setFormOrg("");
    setFormPhone("");
    setFormEmail("");
    setFormNotes("");
    setDialogOpen(true);
  }

  function handleSave() {
    // In production this would persist — for now just close
    setDialogOpen(false);
    setEditingContact(null);
    setEditingChildId(null);
    setAddingForChild(null);
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderContactRow(c: ChildContact, childId: string) {
    const cfg = ROLE_CONFIG[c.role];
    const Icon = cfg.icon;
    const isDentistOverdue = c.role === "dentist" && c.name.toLowerCase() === "overdue";

    return (
      <div
        key={c.id}
        className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0 group"
      >
        <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", cfg.colour)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{cfg.label}</span>
            {isDentistOverdue && (
              <Badge variant="warning" className="text-[10px] py-0">Overdue</Badge>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug">
            {c.name}
            {c.organisation && (
              <span className="font-normal text-slate-500"> — {c.organisation}</span>
            )}
          </p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
              <Phone className="h-3 w-3" />
              {c.phone}
            </span>
            {c.email && (
              <span className="text-xs text-slate-500 truncate">{c.email}</span>
            )}
          </div>
          {c.notes && (
            <p className="text-xs text-slate-500 mt-0.5 italic">{c.notes}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100 shrink-0 mt-1"
          onClick={() => openEditDialog(c, childId)}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <PageShell
      title="Emergency Contacts Board"
      subtitle="Key contacts for Oak House — print and display in office"
      actions={
        <PrintButton title="Emergency Contacts Board" subtitle="Oak House" targetId="emergency-board" />
      }
      showQuickCreate={false}
    >
      <div id="emergency-board" className="space-y-8">

        {/* ── Review status banner ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Last reviewed: <strong className="text-slate-900">{formatDate(LAST_REVIEWED)}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Next review due: <strong className="text-slate-900">{formatDate(NEXT_REVIEW)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="gap-1">
              <Info className="h-3 w-3" />
              Reviewed monthly — Reg 44 visitor should check accuracy
            </Badge>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1 — Home-Level Emergency Contacts                          */}
        {/* ════════════════════════════════════════════════════════════════════ */}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Home Emergency Contacts</h2>
          </div>

          {/* 999 / critical — large cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {HOME_CONTACTS.filter((c) => c.category === "emergency_999").map((c) => (
              <Card key={c.id} className="border-red-200 bg-red-50 print:bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-red-600 tracking-wide">{c.label}</p>
                      <p className="text-2xl font-black text-red-700 tracking-tight mt-0.5">{c.number}</p>
                      <p className="text-xs text-red-600/80 mt-1">{c.description}</p>
                    </div>
                    <Badge className={cn("shrink-0 text-[10px]", CATEGORY_COLOURS[c.category])}>
                      {c.available}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* On-call + maintenance — amber cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {HOME_CONTACTS.filter((c) => c.category === "on_call").map((c) => (
              <Card key={c.id} className="border-amber-200 bg-amber-50 print:bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-amber-700 tracking-wide">{c.label}</p>
                      <p className="text-xl font-bold text-amber-800 mt-0.5">{c.number}</p>
                      <p className="text-xs text-amber-700/80 mt-1">{c.description}</p>
                    </div>
                    <Badge className={cn("shrink-0 text-[10px]", CATEGORY_COLOURS[c.category])}>
                      {c.available}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Local services + regulatory — compact rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {HOME_CONTACTS.filter((c) => c.category === "local_service" || c.category === "regulatory").map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">{c.number}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                    </div>
                    <Badge variant={c.category === "regulatory" ? "secondary" : "info"} className="shrink-0 text-[10px]">
                      {c.available}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2 — Per-Child Contact Cards                                */}
        {/* ════════════════════════════════════════════════════════════════════ */}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Young People — Key Contacts</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {CHILD_CONTACTS.map((child) => {
              const name = getYPName(child.childId);
              return (
                <Card key={child.childId} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                          {name.charAt(0)}
                        </div>
                        {name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openAddDialog(child.childId)}
                        title="Add contact"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0">
                    <div className="divide-y divide-slate-100">
                      {child.contacts.map((c) => renderContactRow(c, child.childId))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3 — Staff On-Call Rota (Current Week)                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">On-Call Rota — Current Week</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-2.5 text-left font-medium text-slate-500 text-xs uppercase tracking-wide">Day</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-500 text-xs uppercase tracking-wide">Date</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-500 text-xs uppercase tracking-wide">On-Call Manager</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-500 text-xs uppercase tracking-wide">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ON_CALL_ROTA.map((entry, i) => (
                      <tr
                        key={i}
                        className={cn(
                          "border-b border-slate-100 last:border-0",
                          isToday(entry) && "bg-amber-50 font-medium"
                        )}
                      >
                        <td className="px-4 py-2.5 text-slate-900">
                          <div className="flex items-center gap-2">
                            {entry.day}
                            {isToday(entry) && (
                              <Badge variant="warning" className="text-[10px] py-0">Today</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{entry.date}</td>
                        <td className="px-4 py-2.5 text-slate-900 font-medium">{getStaffName(entry.managerId)}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Phone className="h-3 w-3" />
                            {entry.phone}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Regulatory note ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 flex items-start gap-2 print:border-slate-300">
          <Shield className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-slate-700">Regulatory requirement</p>
            <p>
              All emergency contacts must be reviewed monthly and kept accurate at all times.
              The Reg 44 independent visitor should verify the accuracy of this board during each visit.
              Any changes to key contacts should be updated immediately and the review date recorded.
              Last updated by {getStaffName("staff_darren")} on {formatDate(LAST_REVIEWED)}.
            </p>
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* DIALOG — Add / Edit Contact                                            */}
      {/* ════════════════════════════════════════════════════════════════════════ */}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "Add Contact"}
              {(editingChildId || addingForChild) && (
                <span className="font-normal text-slate-500">
                  {" "}— {getYPName(editingChildId || addingForChild || "")}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Contact Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Dr Smith"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Role</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(ROLE_CONFIG) as ContactRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormRole(role)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                      formRole === role
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {ROLE_CONFIG[role].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Organisation</label>
                <Input
                  value={formOrg}
                  onChange={(e) => setFormOrg(e.target.value)}
                  placeholder="e.g. Derby City Council"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Phone</label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="07XXX XXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Email</label>
              <Input
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Notes</label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any additional notes (availability, restrictions, etc.)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingContact ? "Save Changes" : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
