// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME IT EQUIPMENT & CONNECTIVITY INTELLIGENCE API ROUTE
// GET /api/v1/home-it-equipment-connectivity-intelligence
// Cross-domain composite: wifiRecords + deviceRecords + printerRecords +
// softwareRecords + digitalAccessRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeItEquipmentConnectivity,
  type WifiRecordInput,
  type DeviceRecordInput,
  type PrinterRecordInput,
  type SoftwareRecordInput,
  type DigitalAccessRecordInput,
} from "@/lib/engines/home-it-equipment-connectivity-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawWifi = (store.wifiRecords ?? []) as any[];
    const wifi_records: WifiRecordInput[] = rawWifi.map((w: any) => ({
      id: w.id ?? "",
      date: (w.date ?? today).toString(),
      location: w.location ?? "",
      signal_strength: w.signal_strength ?? "good",
      speed_mbps_download: w.speed_mbps_download ?? 0,
      speed_mbps_upload: w.speed_mbps_upload ?? 0,
      target_speed_mbps: w.target_speed_mbps ?? 0,
      meets_target: !!w.meets_target,
      outage_minutes: w.outage_minutes ?? 0,
      outage_reported: !!w.outage_reported,
      tested_by: w.tested_by ?? "",
      password_secured: !!w.password_secured,
      content_filter_active: !!w.content_filter_active,
      parental_controls_enabled: !!w.parental_controls_enabled,
      child_accessible: !!w.child_accessible,
      backup_connection_available: !!w.backup_connection_available,
      notes: w.notes ?? "",
      created_at: (w.created_at ?? today).toString(),
    }));

    const rawDevices = (store.deviceRecords ?? []) as any[];
    const device_records: DeviceRecordInput[] = rawDevices.map((d: any) => ({
      id: d.id ?? "",
      device_type: d.device_type ?? "laptop",
      device_name: d.device_name ?? "",
      assigned_to: d.assigned_to ?? null,
      child_id: d.child_id ?? null,
      shared_device: !!d.shared_device,
      condition: d.condition ?? "good",
      operational: !!d.operational,
      age_years: d.age_years ?? 0,
      last_maintenance_date: d.last_maintenance_date ?? null,
      maintenance_due: !!d.maintenance_due,
      has_antivirus: !!d.has_antivirus,
      has_content_filter: !!d.has_content_filter,
      meets_educational_needs: !!d.meets_educational_needs,
      accessible_features_enabled: !!d.accessible_features_enabled,
      charging_equipment_available: !!d.charging_equipment_available,
      protective_case: !!d.protective_case,
      notes: d.notes ?? "",
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawPrinters = (store.printerRecords ?? []) as any[];
    const printer_records: PrinterRecordInput[] = rawPrinters.map((p: any) => ({
      id: p.id ?? "",
      printer_name: p.printer_name ?? "",
      location: p.location ?? "",
      printer_type: p.printer_type ?? "inkjet",
      operational: !!p.operational,
      ink_toner_level: p.ink_toner_level ?? "adequate",
      paper_stocked: !!p.paper_stocked,
      accessible_to_children: !!p.accessible_to_children,
      child_id: p.child_id ?? null,
      wifi_enabled: !!p.wifi_enabled,
      last_serviced_date: p.last_serviced_date ?? null,
      service_due: !!p.service_due,
      usage_allowed_for_homework: !!p.usage_allowed_for_homework,
      print_quota_managed: !!p.print_quota_managed,
      notes: p.notes ?? "",
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawSoftware = (store.softwareRecords ?? []) as any[];
    const software_records: SoftwareRecordInput[] = rawSoftware.map((s: any) => ({
      id: s.id ?? "",
      software_name: s.software_name ?? "",
      category: s.category ?? "other",
      version_current: s.version_current ?? "",
      version_latest: s.version_latest ?? "",
      is_up_to_date: !!s.is_up_to_date,
      licence_valid: !!s.licence_valid,
      licence_expiry_date: s.licence_expiry_date ?? null,
      installed_on_device_count: s.installed_on_device_count ?? 0,
      total_devices_needed: s.total_devices_needed ?? 0,
      auto_update_enabled: !!s.auto_update_enabled,
      child_appropriate: !!s.child_appropriate,
      accessibility_compliant: !!s.accessibility_compliant,
      last_update_date: s.last_update_date ?? null,
      security_patched: !!s.security_patched,
      notes: s.notes ?? "",
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawDigitalAccess = (store.digitalAccessRecords ?? []) as any[];
    const digital_access_records: DigitalAccessRecordInput[] = rawDigitalAccess.map((d: any) => ({
      id: d.id ?? "",
      child_id: d.child_id ?? "",
      date: (d.date ?? today).toString(),
      has_personal_device: !!d.has_personal_device,
      has_shared_device_access: !!d.has_shared_device_access,
      device_access_hours_per_day: d.device_access_hours_per_day ?? 0,
      internet_access_available: !!d.internet_access_available,
      supervised_access: !!d.supervised_access,
      educational_software_available: !!d.educational_software_available,
      homework_access_adequate: !!d.homework_access_adequate,
      digital_skills_assessed: !!d.digital_skills_assessed,
      digital_skills_level: d.digital_skills_level ?? "developing",
      assistive_technology_needed: !!d.assistive_technology_needed,
      assistive_technology_provided: !!d.assistive_technology_provided,
      online_safety_training_completed: !!d.online_safety_training_completed,
      child_satisfaction_rating: d.child_satisfaction_rating ?? 3,
      barriers_identified: Array.isArray(d.barriers_identified) ? d.barriers_identified : [],
      barriers_addressed: !!d.barriers_addressed,
      notes: d.notes ?? "",
      created_at: (d.created_at ?? today).toString(),
    }));

    const result = computeItEquipmentConnectivity({
      today,
      total_children,
      wifi_records,
      device_records,
      printer_records,
      software_records,
      digital_access_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
