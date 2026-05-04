"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REGULATION 22 RECORDS (Schedule 3)
// Compliance checklist for the statutory records a children's home must
// maintain under Regulation 22 of the Children's Homes (England)
// Regulations 2015 (Schedule 3). Tracks each record category, audit
// status, storage location, and retention period.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  FileText, CheckCircle2, AlertTriangle, Shield,
  Calendar, Search, ChevronDown, ChevronUp,
  Database, Archive, MapPin, XCircle,
  ClipboardCheck, X,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const fmt = (iso: string) => {
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
};

/* ── types ───────────────────────────────────────────────────────────── */

type ComplianceStatus = "compliant" | "partially_compliant" | "non_compliant";

interface Reg22Record {
  id: string;
  recordCategory: string;
  scheduleRef: string;
  description: string;
  status: ComplianceStatus;
  lastAuditDate: string;
  auditedBy: string;
  whereStored: string;
  retentionPeriod: string;
  notes: string;
}

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; colour: string; icon: typeof CheckCircle2 }> = {
  compliant:           { label: "Compliant",           colour: "bg-green-100 text-green-800",  icon: CheckCircle2   },
  partially_compliant: { label: "Partially Compliant", colour: "bg-amber-100 text-amber-800",  icon: AlertTriangle  },
  non_compliant:       { label: "Non-Compliant",       colour: "bg-red-100 text-red-800",      icon: XCircle        },
};

/* ── seed data ───────────────────────────────────────────────────────── */

const SEED: Reg22Record[] = [
  {
    id: "r22_001",
    recordCategory: "Individual child records",
    scheduleRef: "Schedule 3, Para 1",
    description: "Records for each child accommodated — care plans, placement plans, risk assessments, health records, education records, and contact records.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system",
    retentionPeriod: "75 years from date of birth or 15 years after death",
    notes: "All three current placements have up-to-date care plans, placement plans, and risk assessments. LAC review actions recorded and tracked.",
  },
  {
    id: "r22_002",
    recordCategory: "Daily log of events",
    scheduleRef: "Schedule 3, Para 2",
    description: "A daily record of the life of the home, including significant events, activities, visitors, and any concerns.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system",
    retentionPeriod: "15 years from date of entry",
    notes: "Daily log maintained in Cornerstone. All shifts completing entries. Handover notes linked to daily log.",
  },
  {
    id: "r22_003",
    recordCategory: "Sanctions and rewards",
    scheduleRef: "Schedule 3, Para 3",
    description: "Records of any measures of control, discipline, or restraint used, and any rewards or incentive schemes.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system",
    retentionPeriod: "15 years from date of entry",
    notes: "Sanctions and rewards logged per child. No sanctions applied in current quarter. Positive reinforcement approach documented in behaviour support plans.",
  },
  {
    id: "r22_004",
    recordCategory: "Restraint records",
    scheduleRef: "Schedule 3, Para 3(b)",
    description: "Detailed records of any use of physical intervention or restraint, including antecedents, description, duration, de-escalation attempts, and post-incident support.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system",
    retentionPeriod: "75 years from child's date of birth",
    notes: "No restraints in current period. All staff trained in Team Teach. Body maps completed where applicable. Ofsted notifications sent within required timescales for any notifiable restraints.",
  },
  {
    id: "r22_005",
    recordCategory: "Medication records",
    scheduleRef: "Schedule 3, Para 4",
    description: "Records of all medication received, stored, administered, and disposed of, including controlled drugs register.",
    status: "compliant",
    lastAuditDate: d(-7),
    auditedBy: "staff_ryan",
    whereStored: "Cornerstone digital system + locked medication cabinet (office)",
    retentionPeriod: "15 years from date of entry",
    notes: "Monthly medication audit completed. MARs reconciled. Stock checks current. Two staff witnessed administration. Controlled drugs register in locked cabinet.",
  },
  {
    id: "r22_006",
    recordCategory: "Fire drill records",
    scheduleRef: "Schedule 3, Para 5",
    description: "Records of fire drills, evacuation practices, fire safety equipment checks, and fire risk assessments.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system + fire log book (office)",
    retentionPeriod: "Duration of home's operation + 3 years",
    notes: "Quarterly drills completed. Last drill included day and evening scenarios. Equipment checks monthly. Fire risk assessment reviewed annually — current version valid.",
  },
  {
    id: "r22_007",
    recordCategory: "Staff recruitment records",
    scheduleRef: "Schedule 3, Para 6(a)",
    description: "Recruitment records including application forms, references, interview notes, DBS checks, right to work evidence, and qualification certificates.",
    status: "compliant",
    lastAuditDate: d(-21),
    auditedBy: "staff_darren",
    whereStored: "Locked filing cabinet, office + Cornerstone digital system",
    retentionPeriod: "Duration of employment + 6 years",
    notes: "All personnel files audited. DBS checks current for all staff. Update Service enrolled for management. Two references obtained for all staff before start date.",
  },
  {
    id: "r22_008",
    recordCategory: "Staff training records",
    scheduleRef: "Schedule 3, Para 6(b)",
    description: "Records of mandatory and specialist training completed by each staff member, including certificates and renewal dates.",
    status: "compliant",
    lastAuditDate: d(-21),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system + staff personnel files",
    retentionPeriod: "Duration of employment + 6 years",
    notes: "Training matrix current. All mandatory training up to date (safeguarding, first aid, Team Teach, fire safety, medication). CPD records maintained for each staff member.",
  },
  {
    id: "r22_009",
    recordCategory: "Supervision and appraisal records",
    scheduleRef: "Schedule 3, Para 6(c)",
    description: "Records of staff supervision sessions and annual appraisals, including agreed actions and development targets.",
    status: "compliant",
    lastAuditDate: d(-21),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system",
    retentionPeriod: "Duration of employment + 6 years",
    notes: "Supervision tracker in Cornerstone. All supervisions within required frequency. Signed records held digitally. Annual appraisals scheduled and tracked.",
  },
  {
    id: "r22_010",
    recordCategory: "Complaints records",
    scheduleRef: "Schedule 3, Para 7",
    description: "Records of complaints received, investigations conducted, outcomes, and lessons learned.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system + complaints file (locked cabinet)",
    retentionPeriod: "15 years from date of complaint",
    notes: "Complaints log maintained. All complaints acknowledged within 24 hours, investigation completed within 28 days. Outcomes shared with complainants. No outstanding complaints.",
  },
  {
    id: "r22_011",
    recordCategory: "Notifiable events",
    scheduleRef: "Schedule 3, Para 8",
    description: "Records of events notifiable to Ofsted, the local authority, police, or other bodies under Regulation 40.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system",
    retentionPeriod: "75 years from child's date of birth",
    notes: "Notification log maintained. All Schedule 5 notifications sent within required timescales. Copies retained on file. Cross-referenced with incident records.",
  },
  {
    id: "r22_012",
    recordCategory: "Missing from care records",
    scheduleRef: "Schedule 3, Para 9",
    description: "Records of all missing from care and absent without authority episodes, including return home interviews.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system",
    retentionPeriod: "75 years from child's date of birth",
    notes: "Missing from care protocol followed. Return home interviews completed within 72 hours. Reports to police and LA made within required timescales. Pattern analysis reviewed monthly.",
  },
  {
    id: "r22_013",
    recordCategory: "Menus and food records",
    scheduleRef: "Schedule 3, Para 10",
    description: "Weekly menus, dietary requirement records, and food hygiene records.",
    status: "compliant",
    lastAuditDate: d(-7),
    auditedBy: "staff_ryan",
    whereStored: "Cornerstone digital system + kitchen noticeboard",
    retentionPeriod: "1 year from date",
    notes: "Weekly menus planned with young people's input. Dietary requirements and allergies clearly displayed. Food hygiene rating 5. Fridge temperature logs maintained daily.",
  },
  {
    id: "r22_014",
    recordCategory: "Visitors' records",
    scheduleRef: "Schedule 3, Para 11",
    description: "Record of all visitors to the home, including name, purpose of visit, time in and out.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_ryan",
    whereStored: "Visitor log book (hallway) + Cornerstone digital system",
    retentionPeriod: "3 years from date of visit",
    notes: "Visitor log book maintained at entrance. All visitors sign in and out. ID checked for unknown visitors. Safeguarding information displayed.",
  },
  {
    id: "r22_015",
    recordCategory: "Risk assessments",
    scheduleRef: "Schedule 3, Para 12",
    description: "Risk assessments for the home environment, individual children, activities, and outings.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system",
    retentionPeriod: "Duration of relevance + 3 years",
    notes: "Environmental risk assessment reviewed quarterly. Individual risk assessments reviewed monthly or after incidents. Activity risk assessments completed before each outing.",
  },
  {
    id: "r22_016",
    recordCategory: "Regulation 44/45 reports",
    scheduleRef: "Schedule 3, Para 13",
    description: "Independent person (Reg 44) visit reports and Reg 45 quality of care review reports.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system + locked filing cabinet, office",
    retentionPeriod: "15 years from date of report",
    notes: "Monthly Reg 44 visits completed by independent visitor. Reg 45 six-monthly review current. Actions tracked and evidenced. Reports shared with Ofsted as required.",
  },
  {
    id: "r22_017",
    recordCategory: "Financial records",
    scheduleRef: "Schedule 3, Para 14",
    description: "Financial records including petty cash, pocket money accounts, receipts, and expenditure records for children and the home.",
    status: "partially_compliant",
    lastAuditDate: d(-7),
    auditedBy: "staff_ryan",
    whereStored: "Cornerstone digital system + petty cash tin (locked office)",
    retentionPeriod: "6 years from end of financial year",
    notes: "Pocket money accounts up to date. Clothing allowance receipts maintained. Petty cash reconciliation overdue by 5 days — to be completed this week. All other financial records current.",
  },
  {
    id: "r22_018",
    recordCategory: "Accident and incident records",
    scheduleRef: "Schedule 3, Para 15",
    description: "Records of all accidents, injuries, and incidents involving children or staff, including RIDDOR-reportable events.",
    status: "compliant",
    lastAuditDate: d(-14),
    auditedBy: "staff_darren",
    whereStored: "Cornerstone digital system + accident book (office)",
    retentionPeriod: "75 years from child's date of birth (children); 3 years (staff)",
    notes: "All incidents logged in Cornerstone within 24 hours. Body maps completed where applicable. Notifications made to relevant authorities within required timescales. Pattern analysis reviewed monthly.",
  },
  {
    id: "r22_019",
    recordCategory: "CCTV records",
    scheduleRef: "Schedule 3, Para 16",
    description: "CCTV recordings, data protection impact assessment, signage records, and subject access request log.",
    status: "compliant",
    lastAuditDate: d(-21),
    auditedBy: "staff_darren",
    whereStored: "CCTV server (locked office) + Cornerstone digital system",
    retentionPeriod: "31 days rolling (footage); DPIA retained for duration of system use",
    notes: "CCTV covers external areas and communal hallways only — no cameras in bedrooms, bathrooms, or private areas. DPIA completed. Signage in place. Children and staff informed. Subject access request procedure documented.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */

export default function Reg22RecordsPage() {
  const [records] = useState<Reg22Record[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ComplianceStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* filtered list */
  const filtered = useMemo(() => {
    let list = [...records];
    if (statusFilter !== "all") list = list.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.recordCategory.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.scheduleRef.toLowerCase().includes(q) ||
        r.whereStored.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, search, statusFilter]);

  /* summary stats */
  const stats = useMemo(() => {
    const total = records.length;
    const compliant = records.filter(r => r.status === "compliant").length;
    const partial = records.filter(r => r.status === "partially_compliant").length;
    const nonCompliant = records.filter(r => r.status === "non_compliant").length;
    const dates = records.map(r => r.lastAuditDate).sort();
    const lastFullAudit = dates[0] || "";
    return { total, compliant, partial, nonCompliant, lastFullAudit };
  }, [records]);

  const hasIssues = stats.partial > 0 || stats.nonCompliant > 0;

  return (
    <PageShell
      title="Regulation 22 Records"
      subtitle="Schedule 3 statutory records — compliance tracker"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Regulation 22 Records" subtitle="Oak House — Schedule 3 Compliance" />
        </div>
      }
    >
      <div className="space-y-6" id="reg22-print">

        {/* ── Summary cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Records",        value: stats.total,        icon: Database,       c: "text-slate-600"  },
            { label: "Compliant",             value: stats.compliant,    icon: CheckCircle2,   c: "text-green-600"  },
            { label: "Partially Compliant",   value: stats.partial,      icon: AlertTriangle,  c: "text-amber-600"  },
            { label: "Non-Compliant",         value: stats.nonCompliant, icon: XCircle,        c: "text-red-600"    },
            { label: "Last Full Audit",       value: fmt(stats.lastFullAudit), icon: Calendar, c: "text-indigo-600" },
          ].map(s => (
            <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5 shrink-0", s.c)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Alert banner ─────────────────────────────────────────────── */}
        {hasIssues && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <p className="font-semibold">Compliance action required</p>
              <p className="mt-0.5">
                {stats.nonCompliant > 0 && (
                  <span><strong>{stats.nonCompliant}</strong> record categor{stats.nonCompliant === 1 ? "y is" : "ies are"} non-compliant. </span>
                )}
                {stats.partial > 0 && (
                  <span><strong>{stats.partial}</strong> record categor{stats.partial === 1 ? "y" : "ies"} partially compliant — review and resolve outstanding actions before next Reg 44 visit or Ofsted inspection.</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {(["all", "compliant", "partially_compliant", "non_compliant"] as const).map(f => {
              const labels: Record<string, string> = {
                all: "All", compliant: "Compliant",
                partially_compliant: "Partial", non_compliant: "Non-Compliant",
              };
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium",
                    statusFilter === f
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} record categor{filtered.length !== 1 ? "ies" : "y"}
        </p>

        {/* ── Record categories ────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No records match your search</p>
            </div>
          )}

          {filtered.map(record => {
            const isOpen = expandedId === record.id;
            const sc = STATUS_CONFIG[record.status];
            const StatusIcon = sc.icon;

            return (
              <div
                key={record.id}
                className={cn(
                  "rounded-lg border bg-card overflow-hidden",
                  record.status === "non_compliant" && "border-red-200",
                  record.status === "partially_compliant" && "border-amber-200",
                )}
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : record.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className={cn("rounded-full p-1.5 shrink-0", sc.colour)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{record.recordCategory}</span>
                      <Badge variant="outline" className={cn("text-xs", sc.colour)}>
                        {sc.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {record.scheduleRef} · Audited {fmt(record.lastAuditDate)} by {getStaffName(record.auditedBy)}
                    </p>
                  </div>
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  }
                </button>

                {isOpen && (
                  <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                      <p className="text-sm">{record.description}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Where Stored
                        </p>
                        <p className="text-sm">{record.whereStored}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                          <Archive className="h-3 w-3" /> Retention Period
                        </p>
                        <p className="text-sm">{record.retentionPeriod}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3" /> Last Audited
                        </p>
                        <p className="text-sm">{fmt(record.lastAuditDate)} — {getStaffName(record.auditedBy)}</p>
                      </div>
                    </div>
                    {record.notes && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Regulatory note ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-dashed p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Regulatory Context</p>
              <p>
                <strong>Regulation 22</strong> of the Children&apos;s Homes (England) Regulations 2015 requires the
                registered person to maintain records specified in <strong>Schedule 3</strong> and ensure they are kept
                up to date. Records must be retained for the period specified in Schedule 3 (typically 15 years for
                operational records, 75 years from date of birth for children&apos;s records). The <strong>Data
                Protection Act 2018</strong> and UK GDPR govern how personal data within these records is processed,
                stored, and shared. Ofsted inspectors routinely check the completeness and quality of Schedule 3 records
                as part of the social care common inspection framework. Failure to maintain required records may result
                in a compliance notice or enforcement action.
              </p>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
