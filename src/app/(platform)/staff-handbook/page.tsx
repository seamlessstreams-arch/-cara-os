"use client";

import { useHomeName } from "@/hooks/use-home-profile";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, ChevronUp, BookOpen, Shield, Clock, Users,
  AlertTriangle, Heart, Phone, FileText, Key, Flame, Pill,
  GraduationCap, MessageSquare, Home, Car, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── types ─────────────────────────────────────────────────────────────────── */

interface HandbookSection {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  lastUpdated: string;
  content: { heading: string; body: string }[];
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── handbook sections ─────────────────────────────────────────────────────── */

const SECTIONS: HandbookSection[] = [
  {
    id: "welcome", title: "Welcome & Introduction", icon: BookOpen, iconColor: "text-blue-600",
    lastUpdated: d(-30),
    content: [
      { heading: "Welcome to Chamberlain House", body: "Welcome to the Chamberlain House team. This handbook provides essential information about your role, responsibilities, and the standards we uphold. Chamberlain House is a 3-bed children's home for young people aged 11-17, registered with Ofsted under the Children's Homes (England) Regulations 2015. Our ethos is built on therapeutic care, relational practice, and ensuring every child feels safe, valued, and heard." },
      { heading: "Our Values", body: "Respect — we treat every child and colleague with dignity. Safety — physical and emotional safety is our first priority. Empowerment — we help young people develop independence and self-belief. Honesty — we are transparent, accountable, and reflective. Collaboration — we work as a team and in partnership with families and professionals." },
      { heading: "Registered Manager", body: "Darren Laville is the Registered Manager (RM). The RM is responsible for the day-to-day running of the home, regulatory compliance, staff supervision, and safeguarding. Ryan serves as Deputy Manager. In Darren's absence, Ryan assumes RM responsibilities." },
    ],
  },
  {
    id: "safeguarding", title: "Safeguarding & Child Protection", icon: Shield, iconColor: "text-red-600",
    lastUpdated: d(-14),
    content: [
      { heading: "Your Safeguarding Duty", body: "Every member of staff has a legal and professional duty to safeguard children. This is non-negotiable. If you have any concern about a child's welfare — no matter how small — you must report it immediately to the Registered Manager or Deputy. If they are unavailable, contact the Local Authority Designated Officer (LADO) or the NSPCC helpline (0808 800 5000). Never assume someone else has reported a concern." },
      { heading: "Types of Abuse", body: "Be aware of the four categories of abuse: Physical abuse, Emotional abuse, Sexual abuse, and Neglect. In a residential setting, you should also be alert to: child sexual exploitation (CSE), child criminal exploitation (CCE), county lines, radicalisation, peer-on-peer abuse, online abuse, and self-harm. All staff must complete Level 3 safeguarding training within their first 3 months." },
      { heading: "Allegations Against Staff", body: "If an allegation is made against you or a colleague, it must be reported to the RM immediately. The RM will contact the LADO. You must not discuss the allegation with the person it is about. The investigation process is managed by the LADO and may involve suspension as a neutral act. Support will be provided to all parties." },
      { heading: "Whistleblowing", body: "If you believe a concern is not being addressed, or the concern involves the RM, you have a duty to whistleblow. You can contact: the Responsible Individual (Richard Holt), Ofsted (0300 123 1231), the NSPCC Whistleblowing Helpline (0800 028 0285), or the police. You are legally protected from detriment for whistleblowing in good faith." },
    ],
  },
  {
    id: "shifts", title: "Shift Patterns & Attendance", icon: Clock, iconColor: "text-amber-600",
    lastUpdated: d(-21),
    content: [
      { heading: "Shift Patterns", body: "Day Shift: 08:00–20:00 (12 hours). Waking Night: 20:00–08:00 (12 hours). Short Shift: 08:00–14:00 or 14:00–20:00 (6 hours). Sleep-In: 22:00–07:00 (paid sleep-in allowance). Rotas are published 4 weeks in advance. Swap requests must be submitted to the Deputy Manager at least 7 days in advance." },
      { heading: "Reporting Absence", body: "If you are unable to attend your shift, you must notify the home by telephone (not text) at least 1 hour before your shift is due to start. Speak to the shift leader or on-call manager. Self-certification covers up to 7 days. A GP fit note is required for absences exceeding 7 calendar days. A return-to-work interview will be conducted after every absence." },
      { heading: "Handover", body: "Every shift begins and ends with a structured handover. You must attend handover at the start of your shift. Handover covers: each child's presentation, medication due, appointments, activities planned, risk updates, and any ongoing concerns. Handover notes must be written and signed." },
      { heading: "Timekeeping", body: "Punctuality is essential. Late arrivals affect the children's routine and put pressure on colleagues. Persistent lateness will be addressed through the disciplinary procedure. If you are going to be late, call the home immediately." },
    ],
  },
  {
    id: "conduct", title: "Professional Conduct & Boundaries", icon: Users, iconColor: "text-purple-600",
    lastUpdated: d(-14),
    content: [
      { heading: "Professional Boundaries", body: "You must maintain professional boundaries with young people at all times. This includes: no personal social media connections with current or former residents, no sharing personal phone numbers, no giving or receiving gifts without RM approval, no physical affection beyond what is agreed in the child's care plan, and no favouritism. Boundaries protect both you and the children." },
      { heading: "Use of Personal Phones", body: "Personal mobile phones must not be used in communal areas or during direct work with young people. Phones should be stored in your locker or pocket (on silent). Staff phones must never be used to photograph young people. If you need to make a personal call, use the office or step away from the young people." },
      { heading: "Social Media", body: "You must not post any information about the home, the children, or your work on social media. This includes vague references that could identify the home. You must not 'friend' or 'follow' current or former residents, their families, or their social workers on any social media platform. Breaches of social media policy are treated as a disciplinary matter." },
      { heading: "Language & Communication", body: "Always use respectful, age-appropriate language. Avoid jargon when speaking with young people. Never use sarcasm, threats, or belittling language. Address young people by their preferred name. Model the communication you want to see." },
    ],
  },
  {
    id: "medication", title: "Medication Administration", icon: Pill, iconColor: "text-green-600",
    lastUpdated: d(-7),
    content: [
      { heading: "Medication Competency", body: "Only staff who have completed Level 3 Medication Training and been assessed as competent may administer medication. New staff must shadow for a minimum of 5 administrations before being assessed. Medication competency is reassessed annually. If your competency lapses, you cannot administer until re-assessed." },
      { heading: "Administration Procedure", body: "Follow the 6 Rights: Right child, Right medication, Right dose, Right time, Right route, Right documentation. Two staff must be present for controlled drugs. All administrations must be recorded immediately in the MAR chart. Never pre-pour medication. If a young person refuses, document and inform the prescriber." },
      { heading: "Storage & Security", body: "All medication is stored in a locked medication cabinet. Controlled drugs are stored in a separate locked cupboard within the main cabinet. Keys are held by the shift leader. Temperature monitoring (fridge and room) must be checked daily and recorded. Stock checks are completed weekly." },
      { heading: "Errors & Near Misses", body: "Any medication error (wrong dose, wrong time, missed dose, wrong child) must be reported immediately to the RM and the prescriber. A medication error form must be completed. Errors are not punitive — they are learning opportunities. However, patterns of error will be addressed through additional training and supervision." },
    ],
  },
  {
    id: "restraint", title: "Physical Intervention (PRICE)", icon: AlertTriangle, iconColor: "text-red-600",
    lastUpdated: d(-14),
    content: [
      { heading: "PRICE Training", body: "All care staff must be PRICE trained (Protecting Rights in a Caring Environment). Level 2 is the minimum for general staff. Senior staff and managers require Level 3. PRICE training is refreshed annually. You must not use physical intervention unless you are currently trained and certified." },
      { heading: "When to Use", body: "Physical intervention is a LAST RESORT. It should only be used when: there is an immediate risk of serious harm to the child or others, all de-escalation techniques have been attempted or are not appropriate, the intervention is proportionate to the risk. Property damage alone is NOT sufficient justification for physical intervention." },
      { heading: "During an Intervention", body: "Use the minimum force necessary. Continuously assess the child's breathing, circulation, and emotional state. Talk to the child throughout — explain what is happening and what they need to do for the hold to end. Two staff should be involved where possible. Time the intervention. Release as soon as it is safe to do so." },
      { heading: "After an Intervention", body: "Complete a body map within 1 hour. Offer the child a medical check. Complete the incident report and PRICE debrief form. Notify: RM, social worker, parents/carers, Ofsted (Reg 35). A post-incident debrief with the child must happen within 24 hours. Staff involved must receive a wellbeing check and reflective supervision within 48 hours." },
    ],
  },
  {
    id: "fire", title: "Fire Safety & Emergency Evacuation", icon: Flame, iconColor: "text-orange-600",
    lastUpdated: d(-30),
    content: [
      { heading: "Fire Alarm Response", body: "If the fire alarm sounds: stop what you are doing, ensure all children are accounted for, evacuate via the nearest safe exit, proceed to the assembly point (front garden by the oak tree), call the fire brigade (999) if not already called, do not re-enter the building until the fire service gives the all-clear." },
      { heading: "Assembly Point", body: "The assembly point is the front garden by the oak tree. The shift leader takes the register using the daily signing-in sheet. All staff and children must be accounted for. If anyone is missing, inform the fire service immediately — do not re-enter." },
      { heading: "Fire Drills", body: "Fire drills are conducted monthly, including at least one waking night drill per quarter. All drills are timed and recorded. Target evacuation time: under 3 minutes. After each drill, a debrief identifies any issues (e.g., children who needed additional support, blocked exits, alarm failures)." },
      { heading: "Your Responsibilities", body: "Know the location of all fire exits, fire extinguishers, and fire blankets. Check fire doors are not propped open. Report any fire hazards immediately. Ensure children's bedroom doors are closed at night. Know each child's Personal Emergency Evacuation Plan (PEEP) — Jordan requires additional support due to sensory processing." },
    ],
  },
  {
    id: "recording", title: "Recording & Documentation", icon: FileText, iconColor: "text-blue-600",
    lastUpdated: d(-7),
    content: [
      { heading: "Daily Logs", body: "Every shift must produce a daily log entry for each child. Logs should be factual, objective, and professional. Use the child's own words where possible (in quotation marks). Avoid assumptions or interpretations — describe what you observed. Logs must be completed before the end of your shift. All entries are signed and dated." },
      { heading: "Quality of Recording", body: "Good recording is: Factual (what happened, not what you think happened), Timely (written as soon as possible after the event), Specific (times, locations, who was present), Child-centred (captures the child's experience and voice), Professional (no slang, abbreviations, or emotional language). Remember: your records may be read by Ofsted, the courts, social workers, and the young person themselves." },
      { heading: "Confidentiality", body: "All records are confidential. You must not share information about children or their families outside of professional need-to-know. Records must be stored securely. Do not leave paperwork unattended. Digital records must be accessed only on secure devices. Breaches of confidentiality are a serious disciplinary matter and may be a criminal offence under GDPR." },
      { heading: "Subject Access Requests", body: "Young people and their families have the right to access their records under GDPR. This means everything you write may be read by the child when they are older. Write with this in mind. Be respectful, factual, and compassionate in all documentation." },
    ],
  },
  {
    id: "wellbeing", title: "Staff Wellbeing & Support", icon: Heart, iconColor: "text-pink-600",
    lastUpdated: d(-14),
    content: [
      { heading: "Supervision", body: "All staff receive formal supervision at minimum monthly (fortnightly during probation). Supervision is your protected time to discuss: your caseload, professional development, wellbeing, and any concerns. Prepare for supervision — bring topics you want to discuss. Supervision notes are confidential between you and your supervisor." },
      { heading: "Wellbeing Support", body: "Working in a children's home can be emotionally demanding. Support is available through: regular supervision, team reflective practice sessions (monthly), Employee Assistance Programme (EAP) — free confidential counselling (24/7 helpline), peer support from colleagues, and management open-door policy. You do not need to struggle alone." },
      { heading: "Vicarious Trauma", body: "Hearing about children's traumatic experiences can affect your own mental health. This is called vicarious trauma or secondary traumatic stress. Signs include: difficulty sleeping, intrusive thoughts about children's experiences, emotional numbness, irritability, or feeling overwhelmed. If you recognise these signs in yourself or a colleague, speak to your supervisor or the RM." },
      { heading: "Self-Care", body: "Look after yourself. Use your breaks. Stay hydrated. Eat properly during shifts. Maintain interests outside of work. Set boundaries between work and home life. Talk to someone if you're struggling. The home cannot function without healthy, resilient staff — your wellbeing matters." },
    ],
  },
  {
    id: "training", title: "Training & Development", icon: GraduationCap, iconColor: "text-indigo-600",
    lastUpdated: d(-21),
    content: [
      { heading: "Mandatory Training", body: "All staff must complete the following within their first 3 months: Safeguarding Level 3, First Aid, PRICE (physical intervention), Fire Safety, Medication Administration (Level 3), Food Hygiene (Level 2), GDPR/Data Protection, Health & Safety, Equality & Diversity, Prevent Duty. Refresher training is required annually for most courses." },
      { heading: "Induction", body: "New staff complete a 12-week induction programme. This includes: shadowing experienced staff, reading all children's care plans and risk assessments, meeting with each child's social worker, attending at least 2 team meetings, completing all mandatory training, and being assessed on medication competency. You will have fortnightly supervision during induction." },
      { heading: "Qualifications", body: "All residential care workers must achieve the Level 3 Diploma in Residential Childcare within 2 years of starting. The home supports study leave and provides a workplace assessor. If you already hold the Level 3, you may wish to progress to Level 5 (management). Discuss your career aspirations in supervision." },
      { heading: "Development Opportunities", body: "We encourage professional growth. Opportunities include: specialist training (CSE, attachment, trauma-informed care), conference attendance, mentoring roles, project leadership, contributing to Reg 45 quality reports, and progressing to senior or deputy roles. Development goals are set in your annual appraisal." },
    ],
  },
  {
    id: "keys", title: "Keys, Security & Access", icon: Key, iconColor: "text-[var(--cs-text-secondary)]",
    lastUpdated: d(-30),
    content: [
      { heading: "Key Responsibilities", body: "Keys are issued at the start of your shift and must be returned at handover. You are personally responsible for all keys in your possession. Lost keys must be reported immediately — this is a security incident that may require lock changes. Never leave keys unattended or accessible to young people." },
      { heading: "Building Security", body: "The front and back doors must be secured at all times (mag-lock system). Visitors must be identified and signed in. Young people's bedroom doors must not be locked from the outside. The medication room and office must be locked when unoccupied. CCTV covers communal areas and external areas only — never bedrooms or bathrooms." },
      { heading: "Night Security", body: "During waking nights: all external doors are locked by 22:00. Night checks are conducted at agreed intervals (see individual check frequencies). The night worker must remain awake and vigilant throughout. All entries/exits after 22:00 must be logged. If a young person attempts to leave, follow the missing from care protocol." },
    ],
  },
  {
    id: "transport", title: "Transport & Driving", icon: Car, iconColor: "text-teal-600",
    lastUpdated: d(-45),
    content: [
      { heading: "Driving Requirements", body: "To drive young people in the home's vehicle or your own car, you must: hold a full UK driving licence, be over 21, have business insurance on your personal vehicle, have your licence checked and recorded by the home, complete the home's driving risk assessment. Never drive if tired, unwell, or under the influence of any substance." },
      { heading: "Vehicle Use", body: "The home vehicle must be booked via the rota. Complete vehicle checks (oil, water, tyres, lights) before each journey. Log all journeys in the vehicle log book. Children must wear seatbelts at all times. Never leave a child unattended in a vehicle. Do not use your mobile phone while driving." },
    ],
  },
  {
    id: "data", title: "Data Protection & GDPR", icon: Lock, iconColor: "text-[var(--cs-text-secondary)]",
    lastUpdated: d(-14),
    content: [
      { heading: "Your Obligations", body: "You have a legal obligation to protect personal data under the UK GDPR and Data Protection Act 2018. This includes: children's records, staff records, family information, and professional contacts. Only access information you need for your role. Never share information without authorisation. Report any data breach immediately." },
      { heading: "Digital Security", body: "Use strong passwords (minimum 12 characters). Do not share passwords. Lock your computer when leaving your desk. Do not use personal email for work communications. Do not photograph children on personal devices. All work devices must be encrypted. Report any suspicious emails or links." },
    ],
  },
  {
    id: "complaints", title: "Complaints & Feedback", icon: MessageSquare, iconColor: "text-amber-600",
    lastUpdated: d(-21),
    content: [
      { heading: "Young People's Complaints", body: "Young people have the right to complain about any aspect of their care. Staff must support children to make complaints — never discourage a complaint. Complaint forms are available in communal areas. Children can also complain to their social worker, advocate, IRO, or Ofsted. All complaints must be recorded and responded to within 20 working days." },
      { heading: "Staff Grievances", body: "If you have a grievance about your working conditions, pay, or treatment, follow the staff grievance procedure. Speak to your supervisor or the RM in the first instance. If unresolved, submit a formal written grievance to the RI. You will not be penalised for raising a legitimate grievance." },
    ],
  },
  {
    id: "leaving", title: "Leaving Chamberlain House", icon: Home, iconColor: "text-[var(--cs-text-secondary)]",
    lastUpdated: d(-60),
    content: [
      { heading: "Notice Period", body: "Your contractual notice period is 4 weeks (or as stated in your contract). Please submit your resignation in writing to the RM. During your notice period, you are expected to maintain the same professional standards. A thorough handover of your key working responsibilities must be completed." },
      { heading: "Exit Arrangements", body: "On your last day: return all keys, ID badge, and equipment. Complete an exit interview with the RM. Your access to digital systems will be revoked. Remember: confidentiality obligations continue after you leave. You must not contact young people directly after leaving employment. DBS clearance transfers with you but must be re-checked by any new employer." },
    ],
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function StaffHandbookPage() {
  const homeName = useHomeName();
  const [expandedId, setExpandedId] = useState<string | null>("welcome");

  return (
    <PageShell
      title="Staff Handbook"
      subtitle={`${homeName} · Essential Information for All Staff`}
      caraContext={{ pageTitle: "Staff Handbook", sourceType: "staff" }}
      actions={<div className="flex items-center gap-2"><PrintButton title="Staff Handbook" /><CaraStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} /></div>}
    >
      <div id="print-area">
        {/* version banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <BookOpen className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800">Staff Handbook — Version 4.2</p>
            <p className="text-blue-700">Last reviewed: {d(-7)} · Next review: {d(90)} · Reviewed by: Darren Laville (RM). All staff must read and confirm understanding. This handbook supplements (but does not replace) the home&apos;s full policy library.</p>
          </div>
        </div>

        {/* table of contents */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contents</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setExpandedId(s.id)}
                  className="text-left text-xs px-2 py-1.5 rounded hover:bg-muted/50 flex items-center gap-2"
                >
                  <span className="text-muted-foreground font-mono">{String(i + 1).padStart(2, "0")}</span>
                  <s.icon className={cn("h-3.5 w-3.5", s.iconColor)} />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* sections */}
        <div className="space-y-3">
          {SECTIONS.map((section, sectionIdx) => {
            const isOpen = expandedId === section.id;
            return (
              <Card key={section.id} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : section.id)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <section.icon className={cn("h-5 w-5", section.iconColor)} />
                      <span className="text-muted-foreground font-mono text-sm mr-1">{String(sectionIdx + 1).padStart(2, "0")}</span>
                      {section.title}
                      <Badge variant="outline" className="bg-muted/30 text-xs">Updated {section.lastUpdated}</Badge>
                    </CardTitle>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4">
                    {section.content.map((item, i) => (
                      <div key={i}>
                        <p className="font-medium text-sm mb-1">{item.heading}</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">{item.body}</p>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* acknowledgement note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Staff Acknowledgement</p>
          <p>All staff must read this handbook in full during their first week of employment and confirm understanding by signing the acknowledgement form. The handbook is reviewed quarterly by the Registered Manager. Significant updates are communicated to all staff via team meetings and individual supervision. This handbook should be read alongside the home&apos;s Statement of Purpose, Children&apos;s Guide, and full policy library. If any content in this handbook conflicts with a specific policy document, the policy document takes precedence.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Staff Handbook — policies, procedures, code of conduct, safeguarding obligations, reporting requirements, lone working, behaviour support, staff rights, HR procedures"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
