"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Bell, Shield, Building, Users, Key,
  Globe, Mail, Phone, CheckCircle2, Save, Smartphone,
  Lock, Eye, EyeOff, Database, FileText, Zap, Monitor, User, X,
  Palette, Upload, AlertCircle, ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { HOME } from "@/lib/seed-data";
import { useStaff } from "@/hooks/use-staff";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import {
  useSystemBranding, useOrganisationBranding, useHomeBranding,
  useUpdateSystemBranding, useUpdateOrganisationBranding, useUpdateHomeBranding,
  useUploadBrandingLogo, useBrandingAuditLog,
} from "@/hooks/use-branding";
import { toast } from "sonner";

type SettingsTab = "profile" | "home" | "notifications" | "security" | "roles" | "integrations" | "branding";

const NOTIFICATION_DEFS = [
  { label: "Task assigned to you",           key: "task_assigned",    enabled: true  },
  { label: "Task overdue",                   key: "task_overdue",     enabled: true  },
  { label: "Incident logged",                key: "incident_logged",  enabled: true  },
  { label: "Leave request pending approval", key: "leave_pending",    enabled: true  },
  { label: "Training expiring soon",         key: "training_expiring",enabled: true  },
  { label: "Supervision due",                key: "supervision_due",  enabled: true  },
  { label: "Document requires sign-off",     key: "doc_sign",         enabled: true  },
  { label: "New candidate in pipeline",      key: "recruitment",      enabled: false },
  { label: "Expense claim submitted",        key: "expense",          enabled: false },
  { label: "Open shift published",           key: "open_shift",       enabled: true  },
];

const ROLE_OPTIONS = [
  "registered_manager","responsible_individual","deputy_manager",
  "team_leader","residential_care_worker","bank_staff","admin",
];

const TABS_CFG: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile",       label: "My Profile",   icon: User     },
  { id: "home",          label: "Home Details",  icon: Building },
  { id: "notifications", label: "Notifications", icon: Bell     },
  { id: "security",      label: "Security",      icon: Shield   },
  { id: "roles",         label: "Roles",         icon: Users    },
  { id: "integrations",  label: "Integrations",  icon: Globe    },
  { id: "branding",      label: "Branding",      icon: Palette  },
];

function SavedBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium">
      <CheckCircle2 className="h-4 w-4 shrink-0" />Changes saved successfully.
    </div>
  );
}

function IntegrationsTab() {
  const list = [
    { name: "Supabase",      desc: "Database & authentication backend",        icon: Database },
    { name: "BrightHR",      desc: "Legacy HR data sync via Chrome extension", icon: Zap      },
    { name: "Sage Payroll",  desc: "Payroll export integration",               icon: FileText },
    { name: "DBS Update Service", desc: "Online DBS status checks",            icon: Globe    },
    { name: "Ofsted Portal", desc: "Inspection reporting and notifications",   icon: Shield   },
  ];
  const [statuses, setStatuses] = React.useState<Record<string, "connected" | "not_connected">>({
    Supabase: "connected", BrightHR: "connected",
    "Sage Payroll": "not_connected", "DBS Update Service": "not_connected", "Ofsted Portal": "not_connected",
  });
  const [modal, setModal] = React.useState<string | null>(null);
  const [cfg, setCfg] = React.useState("");

  function save() {
    if (modal) { setStatuses((p) => ({ ...p, [modal]: "connected" })); setModal(null); setCfg(""); }
  }

  return (
    <div className="space-y-4">
      {list.map(({ name, desc, icon: Icon }) => {
        const connected = statuses[name] === "connected";
        return (
          <div key={name} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6 text-slate-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">{name}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
            <Badge className={cn("text-[10px] rounded-full", connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
              {connected ? "Connected" : "Not connected"}
            </Badge>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setModal(name)}>
              {connected ? "Configure" : "Connect"}
            </Button>
          </div>
        );
      })}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-slate-900">{statuses[modal] === "connected" ? "Configure" : "Connect"} {modal}</div>
                <div className="text-xs text-slate-500 mt-0.5">Enter API key for {modal}.</div>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">API Key</label>
              <input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={cfg} onChange={(e) => setCfg(e.target.value)} placeholder="Enter API key…" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={save} disabled={!cfg}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Branding Tab ──────────────────────────────────────────────────────────────

function ColourField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-14 rounded-lg border border-slate-200 p-0.5 cursor-pointer" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm uppercase" maxLength={7} />
      </div>
    </div>
  );
}

function LogoUploadField({ label, currentUrl, onUpload }: { label: string; currentUrl?: string | null; onUpload: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadBrandingLogo();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMutation.mutateAsync(file);
      onUpload(result.url);
      toast.success("Logo uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
    e.target.value = "";
  }

  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="h-12 w-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl} alt="Logo" className="max-h-10 max-w-20 object-contain" />
          </div>
        ) : (
          <div className="h-12 w-24 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs text-slate-400">No logo</div>
        )}
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}>
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {uploadMutation.isPending ? "Uploading…" : "Upload"}
        </Button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleFile} />
      </div>
      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, SVG or WebP · Max 5 MB</p>
    </div>
  );
}

function DocumentPreview({ primaryColour, secondaryColour, companyName, homeName, registeredManagerName, footerText }: {
  primaryColour: string; secondaryColour: string; companyName: string;
  homeName: string; registeredManagerName: string; footerText: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: primaryColour }}>
        <div>
          <div className="text-white font-bold text-sm">{companyName}</div>
          <div className="text-white/70 text-[11px]">{homeName}</div>
        </div>
        <div className="text-right">
          <div className="text-white/80 text-[10px]">Registered Manager</div>
          <div className="text-white text-xs font-medium">{registeredManagerName}</div>
        </div>
      </div>
      <div className="bg-white px-5 py-4">
        <div className="text-xs font-bold text-slate-900 mb-1">SAMPLE DOCUMENT</div>
        <div className="h-2 bg-slate-100 rounded w-3/4 mb-1" />
        <div className="h-2 bg-slate-100 rounded w-full mb-1" />
        <div className="h-2 bg-slate-100 rounded w-5/6" />
      </div>
      <div className="px-5 py-2 flex items-center justify-between" style={{ backgroundColor: secondaryColour + "20", borderTop: `2px solid ${secondaryColour}` }}>
        <div className="text-[10px] text-slate-500">{footerText}</div>
        <div className="text-[10px]" style={{ color: primaryColour }}>Cornerstone</div>
      </div>
    </div>
  );
}

function BrandingTab() {
  const { currentUser } = useAuthContext();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const systemQ = useSystemBranding();
  const orgQ = useOrganisationBranding("org_oak");
  const homeQ = useHomeBranding("home_oak");
  const auditQ = useBrandingAuditLog();

  const updateSystem = useUpdateSystemBranding();
  const updateOrg    = useUpdateOrganisationBranding();
  const updateHome   = useUpdateHomeBranding();

  const [sysForm, setSysForm] = useState({ primary_colour: "#1e3a5f", secondary_colour: "#2dd4bf", accent_colour: "#3b82f6", default_footer_text: "Generated securely through Cornerstone", support_email: "support@cornerstone.care" });
  const [orgForm, setOrgForm] = useState({ company_name: "", trading_name: "", registered_provider_name: "", company_registration_number: "", ofsted_provider_reference: "", address: "", phone: "", email: "", website: "", responsible_individual_name: "", primary_colour: "", secondary_colour: "", logo_url: "", document_logo_url: "", confidentiality_notice: "" });
  const [homeForm2, setHomeForm2] = useState({ home_name: "", home_address: "", ofsted_urn: "", registered_manager_name: "", responsible_individual_name: "", emergency_contact: "", safeguarding_contact: "", lado_contact: "", local_authority_contact: "", police_contact: "", logo_override_url: "" });
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => { if (systemQ.data) setSysForm({ primary_colour: systemQ.data.primary_colour, secondary_colour: systemQ.data.secondary_colour, accent_colour: systemQ.data.accent_colour, default_footer_text: systemQ.data.default_footer_text, support_email: systemQ.data.support_email }); }, [systemQ.data]);
  useEffect(() => { if (orgQ.data) setOrgForm({ company_name: orgQ.data.company_name ?? "", trading_name: orgQ.data.trading_name ?? "", registered_provider_name: orgQ.data.registered_provider_name ?? "", company_registration_number: orgQ.data.company_registration_number ?? "", ofsted_provider_reference: orgQ.data.ofsted_provider_reference ?? "", address: orgQ.data.address ?? "", phone: orgQ.data.phone ?? "", email: orgQ.data.email ?? "", website: orgQ.data.website ?? "", responsible_individual_name: orgQ.data.responsible_individual_name ?? "", primary_colour: orgQ.data.primary_colour ?? "", secondary_colour: orgQ.data.secondary_colour ?? "", logo_url: orgQ.data.logo_url ?? "", document_logo_url: orgQ.data.document_logo_url ?? "", confidentiality_notice: orgQ.data.confidentiality_notice ?? "" }); }, [orgQ.data]);
  useEffect(() => { if (homeQ.data) setHomeForm2({ home_name: homeQ.data.home_name ?? "", home_address: homeQ.data.home_address ?? "", ofsted_urn: homeQ.data.ofsted_urn ?? "", registered_manager_name: homeQ.data.registered_manager_name ?? "", responsible_individual_name: homeQ.data.responsible_individual_name ?? "", emergency_contact: homeQ.data.emergency_contact ?? "", safeguarding_contact: homeQ.data.safeguarding_contact ?? "", lado_contact: homeQ.data.lado_contact ?? "", local_authority_contact: homeQ.data.local_authority_contact ?? "", police_contact: homeQ.data.police_contact ?? "", logo_override_url: homeQ.data.logo_override_url ?? "" }); }, [homeQ.data]);

  async function saveSystem() { try { await updateSystem.mutateAsync({ ...sysForm, updated_by: currentUser?.id }); toast.success("System branding saved"); } catch { toast.error("Failed to save system branding"); } }
  async function saveOrg() { try { await updateOrg.mutateAsync({ ...orgForm, organisation_id: "org_oak", updated_by: currentUser?.id }); toast.success("Organisation branding saved"); } catch { toast.error("Failed to save organisation branding"); } }
  async function saveHome() { try { await updateHome.mutateAsync({ ...homeForm2, home_id: "home_oak", organisation_id: "org_oak", updated_by: currentUser?.id }); toast.success("Home branding saved"); } catch { toast.error("Failed to save home branding"); } }

  const previewPrimary = orgForm.primary_colour || sysForm.primary_colour;
  const previewSecondary = orgForm.secondary_colour || sysForm.secondary_colour;

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <Card>
        <CardHeader><CardTitle>Document Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="max-w-lg">
            <DocumentPreview
              primaryColour={previewPrimary}
              secondaryColour={previewSecondary}
              companyName={orgForm.company_name || "Your Organisation"}
              homeName={homeForm2.home_name || "Home Name"}
              registeredManagerName={homeForm2.registered_manager_name || "Manager Name"}
              footerText={orgForm.company_name ? `Generated securely through Cornerstone on behalf of ${orgForm.company_name}` : sysForm.default_footer_text}
            />
          </div>
          <p className="text-xs text-slate-400 mt-3">Preview updates as you edit branding settings below.</p>
        </CardContent>
      </Card>

      {/* Organisation branding */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-4 w-4" />Organisation Branding</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {([
              { label: "Company name (legal)", key: "company_name" },
              { label: "Trading name", key: "trading_name" },
              { label: "Registered provider name", key: "registered_provider_name" },
              { label: "Company registration number", key: "company_registration_number" },
              { label: "Ofsted provider reference", key: "ofsted_provider_reference" },
              { label: "Address", key: "address" },
              { label: "Phone", key: "phone" },
              { label: "Email", key: "email" },
              { label: "Website", key: "website" },
              { label: "Responsible Individual name", key: "responsible_individual_name" },
            ] as { label: string; key: keyof typeof orgForm }[]).map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
                <Input value={orgForm[key]} onChange={(e) => setOrgForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColourField label="Primary colour" value={orgForm.primary_colour} onChange={(v) => setOrgForm((f) => ({ ...f, primary_colour: v }))} />
            <ColourField label="Secondary colour" value={orgForm.secondary_colour} onChange={(v) => setOrgForm((f) => ({ ...f, secondary_colour: v }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LogoUploadField label="Main logo (app/web)" currentUrl={orgForm.logo_url} onUpload={(url) => setOrgForm((f) => ({ ...f, logo_url: url }))} />
            <LogoUploadField label="Document logo (PDF header)" currentUrl={orgForm.document_logo_url} onUpload={(url) => setOrgForm((f) => ({ ...f, document_logo_url: url }))} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Confidentiality notice (document footer)</label>
            <textarea rows={3} value={orgForm.confidentiality_notice} onChange={(e) => setOrgForm((f) => ({ ...f, confidentiality_notice: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <Button onClick={saveOrg} disabled={updateOrg.isPending}>
            <Save className="h-4 w-4 mr-2" />{updateOrg.isPending ? "Saving…" : "Save Organisation Branding"}
          </Button>
        </CardContent>
      </Card>

      {/* Home branding */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-4 w-4 text-blue-600" />Home Details &amp; Contacts</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {([
              { label: "Home name", key: "home_name" },
              { label: "Home address", key: "home_address" },
              { label: "Ofsted URN", key: "ofsted_urn" },
              { label: "Registered Manager name", key: "registered_manager_name" },
              { label: "Responsible Individual name", key: "responsible_individual_name" },
              { label: "Emergency contact", key: "emergency_contact" },
              { label: "Safeguarding contact", key: "safeguarding_contact" },
              { label: "LADO contact", key: "lado_contact" },
              { label: "Local Authority contact", key: "local_authority_contact" },
              { label: "Police contact", key: "police_contact" },
            ] as { label: string; key: keyof typeof homeForm2 }[]).map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
                <Input value={homeForm2[key]} onChange={(e) => setHomeForm2((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <LogoUploadField label="Home logo override (replaces org logo on home-specific documents)" currentUrl={homeForm2.logo_override_url} onUpload={(url) => setHomeForm2((f) => ({ ...f, logo_override_url: url }))} />

          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Ofsted URN, safeguarding contact and Responsible Individual name are required for Regulation 45 and Annex A documents. Missing details are flagged on document export.</span>
          </div>

          <Button onClick={saveHome} disabled={updateHome.isPending}>
            <Save className="h-4 w-4 mr-2" />{updateHome.isPending ? "Saving…" : "Save Home Branding"}
          </Button>
        </CardContent>
      </Card>

      {/* System branding — super admin only */}
      {isSuperAdmin && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4 text-purple-600" />Cornerstone System Branding <Badge className="text-[9px] bg-purple-100 text-purple-700 rounded-full ml-1">Super Admin</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <ColourField label="System primary" value={sysForm.primary_colour} onChange={(v) => setSysForm((f) => ({ ...f, primary_colour: v }))} />
              <ColourField label="System secondary" value={sysForm.secondary_colour} onChange={(v) => setSysForm((f) => ({ ...f, secondary_colour: v }))} />
              <ColourField label="System accent" value={sysForm.accent_colour} onChange={(v) => setSysForm((f) => ({ ...f, accent_colour: v }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Default footer text</label>
              <Input value={sysForm.default_footer_text} onChange={(e) => setSysForm((f) => ({ ...f, default_footer_text: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Support email</label>
              <Input type="email" value={sysForm.support_email} onChange={(e) => setSysForm((f) => ({ ...f, support_email: e.target.value }))} />
            </div>
            <Button onClick={saveSystem} disabled={updateSystem.isPending}>
              <Save className="h-4 w-4 mr-2" />{updateSystem.isPending ? "Saving…" : "Save System Branding"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Branding audit log */}
      <Card>
        <CardHeader>
          <button className="flex w-full items-center justify-between text-left" onClick={() => setShowAudit((v) => !v)}>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" />Branding Change Log</CardTitle>
            {showAudit ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
        </CardHeader>
        {showAudit && (
          <CardContent>
            {auditQ.isLoading ? (
              <div className="text-sm text-slate-400">Loading…</div>
            ) : !auditQ.data?.length ? (
              <div className="text-sm text-slate-400">No changes recorded yet.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {auditQ.data.map((entry) => (
                  <div key={entry.id} className="rounded-xl bg-slate-50 px-4 py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{entry.field_name}</span>
                      <span className="text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      <Badge className="text-[9px] rounded-full bg-slate-100 text-slate-600 capitalize">{entry.target_type}</Badge>
                      <span className="text-slate-500">{entry.previous_value ?? "—"} → {entry.new_value ?? "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { currentUser } = useAuthContext();
  const staffQ = useStaff();
  const allStaff = (staffQ.data?.data ?? []).filter((s) => s.is_active);
  const me = allStaff.find((s) => s.id === (currentUser?.id ?? "staff_darren")) ?? allStaff[0];

  const [tab, setTab] = useState<SettingsTab>("profile");
  const [profile, setProfile] = useState({ first_name: "", last_name: "", email: "", phone: "", payroll_id: "" });
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (me) setProfile({ first_name: me.first_name ?? "", last_name: me.last_name ?? "", email: me.email ?? "", phone: me.phone ?? "", payroll_id: me.payroll_id ?? "" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  const [homeForm, setHomeForm] = useState({
    name: HOME.name ?? "", ofsted_urn: HOME.ofsted_urn ?? "", address: HOME.address ?? "",
    phone: HOME.phone ?? "", max_beds: String(HOME.max_beds ?? ""),
    last_inspection_date: HOME.last_inspection_date ?? "", last_inspection_grade: HOME.last_inspection_grade ?? "",
  });
  const [homeSaved, setHomeSaved] = useState(false);

  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_DEFS.map((n) => [n.key, n.enabled])),
  );
  const [notifSaved, setNotifSaved] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);
  const [signedOut, setSignedOut] = useState<Set<string>>(new Set());

  const [roles, setRoles] = useState<Record<string, string>>({});
  const [rolesSaved, setRolesSaved] = useState(false);

  function flash(setter: (v: boolean) => void) { setter(true); setTimeout(() => setter(false), 3500); }
  const handleSaveProfile = () => flash(setProfileSaved);
  const handleSaveHome    = () => flash(setHomeSaved);
  const handleSaveNotifs  = () => flash(setNotifSaved);
  const handleSaveRoles   = () => flash(setRolesSaved);

  function handleUpdatePw() {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwError("All fields required."); return; }
    if (pwForm.next.length < 8) { setPwError("Min 8 characters."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords don't match."); return; }
    setPwError(null); setPwForm({ current: "", next: "", confirm: "" }); flash(setPwSaved);
  }

  return (
    <PageShell title="Settings" subtitle="Account, home configuration, and preferences" ariaContext={{ pageTitle: "Settings", sourceType: "general" }} showQuickCreate={false} actions={<AriaStudioQuickActionButton context={{ record_type: "uploaded_document", record_id: "home_oak", home_id: "home_oak" }} />}>
      <div className="flex gap-6">
        <aside className="w-52 shrink-0">
          <nav className="space-y-0.5">
            {TABS_CFG.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={cn("w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors text-left", tab === id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                <Icon className="h-4 w-4 shrink-0" />{label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 space-y-5">

          {tab === "profile" && me && (
            <Card>
              <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-5">
                  <Avatar name={me.full_name} size="xl" />
                  <div>
                    <div className="text-lg font-bold text-slate-900">{me.full_name}</div>
                    <div className="text-sm text-slate-500">{me.job_title}</div>
                    <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" disabled>Change photo</Button>
                  </div>
                </div>
                <SavedBanner show={profileSaved} />
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "First name", key: "first_name" as const },
                    { label: "Last name",  key: "last_name"  as const },
                    { label: "Email",      key: "email"      as const },
                    { label: "Phone",      key: "phone"      as const },
                    { label: "Payroll ID", key: "payroll_id" as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
                      <Input value={profile[key]} onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Role</label>
                    <Input value={me.job_title} disabled className="bg-slate-50" />
                  </div>
                </div>
                <Button className="w-full" onClick={handleSaveProfile}><Save className="h-4 w-4 mr-2" />Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {tab === "home" && (
            <Card>
              <CardHeader><CardTitle>Home Details — {HOME.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SavedBanner show={homeSaved} />
                <div className="grid grid-cols-2 gap-4">
                  {([ { label: "Home name", key: "name" }, { label: "Ofsted URN", key: "ofsted_urn" }, { label: "Address", key: "address" }, { label: "Phone", key: "phone" }, { label: "Max beds", key: "max_beds" }, { label: "Last inspection", key: "last_inspection_date" }, { label: "Last grade", key: "last_inspection_grade" } ] as { label: string; key: keyof typeof homeForm }[]).map(({ label, key }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
                      <Input value={homeForm[key]} onChange={(e) => setHomeForm((f) => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveHome}><Save className="h-4 w-4 mr-2" />Save Home Details</Button>
              </CardContent>
            </Card>
          )}

          {tab === "notifications" && (
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <SavedBanner show={notifSaved} />
                {NOTIFICATION_DEFS.map((n) => (
                  <div key={n.key} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-700">{n.label}</span>
                    <button onClick={() => setNotifications((p) => ({ ...p, [n.key]: !p[n.key] }))} className={cn("relative h-6 w-10 rounded-full transition-colors", notifications[n.key] ? "bg-blue-600" : "bg-slate-200")}>
                      <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", notifications[n.key] ? "translate-x-4" : "translate-x-0.5")} />
                    </button>
                  </div>
                ))}
                <Button className="w-full mt-2" onClick={handleSaveNotifs}><Save className="h-4 w-4 mr-2" />Save Preferences</Button>
              </CardContent>
            </Card>
          )}

          {tab === "security" && (
            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SavedBanner show={pwSaved} />
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Current password</label>
                    <div className="relative">
                      <Input type={showPw ? "text" : "password"} placeholder="••••••••" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} />
                      <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">New password</label>
                    <Input type="password" placeholder="••••••••" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm new password</label>
                    <Input type="password" placeholder="••••••••" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} />
                  </div>
                  {pwError && <p className="text-xs text-red-600 font-medium">{pwError}</p>}
                  <Button onClick={handleUpdatePw}><Lock className="h-4 w-4 mr-2" />Update Password</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { device: "MacBook Pro — Derby",   last: "Now (this session)", icon: Monitor,    current: true,  key: "macbook" },
                      { device: "iPhone 15 Pro — Mobile",last: "2 hours ago",        icon: Smartphone, current: false, key: "iphone"  },
                    ].map(({ device, last, icon: Icon, current, key }) => (
                      <div key={key} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                        <Icon className="h-5 w-5 text-slate-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">{device}</div>
                          <div className="text-xs text-slate-400">{signedOut.has(key) ? "Signed out" : last}</div>
                        </div>
                        {current ? (
                          <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700">Current</Badge>
                        ) : signedOut.has(key) ? (
                          <Badge className="text-[9px] rounded-full bg-slate-100 text-slate-500">Signed out</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={() => setSignedOut((p) => new Set([...p, key]))}>Sign out</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "roles" && (
            <Card>
              <CardHeader><CardTitle>Roles &amp; Permissions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <SavedBanner show={rolesSaved} />
                {allStaff.map((staff) => (
                  <div key={staff.id} className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
                    <Avatar name={staff.full_name} size="sm" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">{staff.full_name}</div>
                      <div className="text-xs text-slate-400">{staff.email}</div>
                    </div>
                    <select value={roles[staff.id] ?? staff.role} onChange={(e) => setRoles((r) => ({ ...r, [staff.id]: e.target.value }))} disabled={staff.id === (currentUser?.id ?? "staff_darren")} className="h-8 rounded-xl border border-slate-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100">
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                ))}
                <Button className="mt-1" onClick={handleSaveRoles}><Key className="h-4 w-4 mr-2" />Save Role Changes</Button>
              </CardContent>
            </Card>
          )}

          {tab === "integrations" && <IntegrationsTab />}

          {tab === "branding" && <BrandingTab />}

        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Settings — home configuration, account settings, user preferences, notification settings, branding, integration settings, system administration"
        recordType="uploaded_document"
        className="mt-6"
      />
    </PageShell>
  );
}
