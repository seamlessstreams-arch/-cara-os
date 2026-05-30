// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME IT EQUIPMENT & CONNECTIVITY INTELLIGENCE ENGINE
// Monitors the home's IT equipment and connectivity including WiFi reliability,
// computer/tablet availability, printer access, software currency, and child
// digital access equity.
// Measures WiFi reliability, device availability, printer access, software
// currency, digital access equity, and child satisfaction.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 8 (Education), Reg 5 (Engaging parents/carers and others).
// SCCIF: "Experiences and progress of children", "Quality of care".
// Store keys: wifiRecords, deviceRecords, printerRecords,
//             softwareRecords, digitalAccessRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface WifiRecordInput {
  id: string;
  date: string;
  location: string;
  signal_strength: "excellent" | "good" | "fair" | "poor" | "none";
  speed_mbps_download: number;
  speed_mbps_upload: number;
  target_speed_mbps: number;
  meets_target: boolean;
  outage_minutes: number;
  outage_reported: boolean;
  tested_by: string;
  password_secured: boolean;
  content_filter_active: boolean;
  parental_controls_enabled: boolean;
  child_accessible: boolean;
  backup_connection_available: boolean;
  notes: string;
  created_at: string;
}

export interface DeviceRecordInput {
  id: string;
  device_type: "desktop" | "laptop" | "tablet" | "chromebook" | "smartphone" | "other";
  device_name: string;
  assigned_to: string | null;
  child_id: string | null;
  shared_device: boolean;
  condition: "excellent" | "good" | "fair" | "poor" | "broken";
  operational: boolean;
  age_years: number;
  last_maintenance_date: string | null;
  maintenance_due: boolean;
  has_antivirus: boolean;
  has_content_filter: boolean;
  meets_educational_needs: boolean;
  accessible_features_enabled: boolean;
  charging_equipment_available: boolean;
  protective_case: boolean;
  notes: string;
  created_at: string;
}

export interface PrinterRecordInput {
  id: string;
  printer_name: string;
  location: string;
  printer_type: "laser" | "inkjet" | "multifunction" | "label" | "other";
  operational: boolean;
  ink_toner_level: "full" | "adequate" | "low" | "empty";
  paper_stocked: boolean;
  accessible_to_children: boolean;
  child_id: string | null;
  wifi_enabled: boolean;
  last_serviced_date: string | null;
  service_due: boolean;
  usage_allowed_for_homework: boolean;
  print_quota_managed: boolean;
  notes: string;
  created_at: string;
}

export interface SoftwareRecordInput {
  id: string;
  software_name: string;
  category: "education" | "productivity" | "security" | "accessibility" | "communication" | "creative" | "operating_system" | "other";
  version_current: string;
  version_latest: string;
  is_up_to_date: boolean;
  licence_valid: boolean;
  licence_expiry_date: string | null;
  installed_on_device_count: number;
  total_devices_needed: number;
  auto_update_enabled: boolean;
  child_appropriate: boolean;
  accessibility_compliant: boolean;
  last_update_date: string | null;
  security_patched: boolean;
  notes: string;
  created_at: string;
}

export interface DigitalAccessRecordInput {
  id: string;
  child_id: string;
  date: string;
  has_personal_device: boolean;
  has_shared_device_access: boolean;
  device_access_hours_per_day: number;
  internet_access_available: boolean;
  supervised_access: boolean;
  educational_software_available: boolean;
  homework_access_adequate: boolean;
  digital_skills_assessed: boolean;
  digital_skills_level: "advanced" | "competent" | "developing" | "beginner" | "none";
  assistive_technology_needed: boolean;
  assistive_technology_provided: boolean;
  online_safety_training_completed: boolean;
  child_satisfaction_rating: number; // 1-5
  barriers_identified: string[];
  barriers_addressed: boolean;
  notes: string;
  created_at: string;
}

export interface ItEquipmentConnectivityInput {
  today: string;
  total_children: number;
  wifi_records: WifiRecordInput[];
  device_records: DeviceRecordInput[];
  printer_records: PrinterRecordInput[];
  software_records: SoftwareRecordInput[];
  digital_access_records: DigitalAccessRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ItEquipmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ItEquipmentInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ItEquipmentRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ItEquipmentConnectivityResult {
  it_rating: ItEquipmentRating;
  it_score: number;
  headline: string;
  total_wifi_records: number;
  total_device_records: number;
  total_printer_records: number;
  total_software_records: number;
  total_digital_access_records: number;
  wifi_reliability_rate: number;
  device_availability_rate: number;
  printer_access_rate: number;
  software_currency_rate: number;
  digital_access_rate: number;
  child_satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: ItEquipmentRecommendation[];
  insights: ItEquipmentInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ItEquipmentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: ItEquipmentRating,
  score: number,
  headline: string,
): ItEquipmentConnectivityResult {
  return {
    it_rating: rating,
    it_score: score,
    headline,
    total_wifi_records: 0,
    total_device_records: 0,
    total_printer_records: 0,
    total_software_records: 0,
    total_digital_access_records: 0,
    wifi_reliability_rate: 0,
    device_availability_rate: 0,
    printer_access_rate: 0,
    software_currency_rate: 0,
    digital_access_rate: 0,
    child_satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeItEquipmentConnectivity(
  input: ItEquipmentConnectivityInput,
): ItEquipmentConnectivityResult {
  const {
    total_children,
    wifi_records,
    device_records,
    printer_records,
    software_records,
    digital_access_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    wifi_records.length === 0 &&
    device_records.length === 0 &&
    printer_records.length === 0 &&
    software_records.length === 0 &&
    digital_access_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess IT equipment and connectivity.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No IT equipment or connectivity data recorded despite children on placement — digital access and equipment provision require urgent attention.",
      ),
      concerns: [
        "No WiFi records, device records, printer records, software records, or digital access records exist despite children being on placement — the home cannot evidence adequate IT equipment provision or digital access equity for children's education and development.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of WiFi reliability, device availability, printer access, software currency, and individual child digital access to evidence the home's IT equipment provision and digital equity.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 8 — Education",
        },
        {
          rank: 2,
          recommendation:
            "Conduct an immediate audit of all IT equipment, connectivity, and software to establish a baseline of digital resources available to support children's education and personal development.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Experiences and progress of children",
        },
      ],
      insights: [
        {
          text: "The complete absence of IT equipment and connectivity records means the home cannot demonstrate adequate digital provision for children's education, homework, and personal development. Ofsted expects children in care to have equitable access to technology that supports their educational outcomes (CHR 2015 Reg 8).",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- WiFi reliability metrics ---
  const totalWifiRecords = wifi_records.length;
  const wifiMeetsTarget = wifi_records.filter((w) => w.meets_target).length;
  const wifiReliabilityRate = pct(wifiMeetsTarget, totalWifiRecords);

  const wifiSecured = wifi_records.filter((w) => w.password_secured).length;
  const wifiSecuredRate = pct(wifiSecured, totalWifiRecords);

  const contentFilterActive = wifi_records.filter((w) => w.content_filter_active).length;
  const contentFilterRate = pct(contentFilterActive, totalWifiRecords);

  const parentalControlsEnabled = wifi_records.filter((w) => w.parental_controls_enabled).length;
  const parentalControlsRate = pct(parentalControlsEnabled, totalWifiRecords);

  const childAccessibleWifi = wifi_records.filter((w) => w.child_accessible).length;
  const childAccessibleWifiRate = pct(childAccessibleWifi, totalWifiRecords);

  const backupAvailable = wifi_records.filter((w) => w.backup_connection_available).length;
  const backupRate = pct(backupAvailable, totalWifiRecords);

  const totalOutageMinutes = wifi_records.reduce((sum, w) => sum + w.outage_minutes, 0);
  const avgOutageMinutes = totalWifiRecords > 0 ? Math.round(totalOutageMinutes / totalWifiRecords) : 0;

  const outagesReported = wifi_records.filter((w) => w.outage_minutes > 0 && w.outage_reported).length;
  const outagesTotal = wifi_records.filter((w) => w.outage_minutes > 0).length;
  const outageReportingRate = pct(outagesReported, outagesTotal);

  const excellentOrGoodSignal = wifi_records.filter(
    (w) => w.signal_strength === "excellent" || w.signal_strength === "good",
  ).length;
  const signalQualityRate = pct(excellentOrGoodSignal, totalWifiRecords);

  // --- Device availability metrics ---
  const totalDeviceRecords = device_records.length;
  const operationalDevices = device_records.filter((d) => d.operational).length;
  const deviceAvailabilityRate = pct(operationalDevices, totalDeviceRecords);

  const devicesWithAntivirus = device_records.filter((d) => d.operational && d.has_antivirus).length;
  const antivirusRate = pct(devicesWithAntivirus, totalDeviceRecords);

  const devicesWithContentFilter = device_records.filter(
    (d) => d.operational && d.has_content_filter,
  ).length;
  const deviceContentFilterRate = pct(devicesWithContentFilter, totalDeviceRecords);

  const devicesMeetingEdNeeds = device_records.filter(
    (d) => d.operational && d.meets_educational_needs,
  ).length;
  const educationalNeedsRate = pct(devicesMeetingEdNeeds, totalDeviceRecords);

  const devicesMaintenanceDue = device_records.filter((d) => d.maintenance_due).length;
  const maintenanceDueRate = pct(devicesMaintenanceDue, totalDeviceRecords);

  const devicesInGoodCondition = device_records.filter(
    (d) => d.condition === "excellent" || d.condition === "good",
  ).length;
  const deviceConditionRate = pct(devicesInGoodCondition, totalDeviceRecords);

  const agingDevices = device_records.filter((d) => d.age_years >= 5).length;
  const agingDeviceRate = pct(agingDevices, totalDeviceRecords);

  const accessibleDevices = device_records.filter(
    (d) => d.operational && d.accessible_features_enabled,
  ).length;
  const accessibilityRate = pct(accessibleDevices, totalDeviceRecords);

  const childAssignedDevices = device_records.filter((d) => d.child_id !== null).length;
  const uniqueChildrenWithDevice = new Set(
    device_records.filter((d) => d.child_id !== null).map((d) => d.child_id),
  ).size;
  const deviceChildCoverage = total_children > 0 ? pct(uniqueChildrenWithDevice, total_children) : 0;

  // --- Printer access metrics ---
  const totalPrinterRecords = printer_records.length;
  const operationalPrinters = printer_records.filter((p) => p.operational).length;
  const printerOperationalRate = pct(operationalPrinters, totalPrinterRecords);

  const printersAccessibleToChildren = printer_records.filter(
    (p) => p.operational && p.accessible_to_children,
  ).length;
  const printerAccessRate = pct(printersAccessibleToChildren, totalPrinterRecords);

  const printersWithAdequateSupplies = printer_records.filter(
    (p) =>
      p.operational &&
      (p.ink_toner_level === "full" || p.ink_toner_level === "adequate") &&
      p.paper_stocked,
  ).length;
  const printerSuppliesRate = pct(printersWithAdequateSupplies, totalPrinterRecords);

  const homeworkPrinters = printer_records.filter(
    (p) => p.operational && p.usage_allowed_for_homework,
  ).length;
  const homeworkPrinterRate = pct(homeworkPrinters, totalPrinterRecords);

  const printerServiceDue = printer_records.filter((p) => p.service_due).length;
  const printerServiceDueRate = pct(printerServiceDue, totalPrinterRecords);

  const wifiPrinters = printer_records.filter((p) => p.operational && p.wifi_enabled).length;
  const wifiPrinterRate = pct(wifiPrinters, totalPrinterRecords);

  // --- Software currency metrics ---
  const totalSoftwareRecords = software_records.length;
  const upToDateSoftware = software_records.filter((s) => s.is_up_to_date).length;
  const softwareCurrencyRate = pct(upToDateSoftware, totalSoftwareRecords);

  const validLicences = software_records.filter((s) => s.licence_valid).length;
  const licenceValidRate = pct(validLicences, totalSoftwareRecords);

  const securityPatched = software_records.filter((s) => s.security_patched).length;
  const securityPatchRate = pct(securityPatched, totalSoftwareRecords);

  const autoUpdateEnabled = software_records.filter((s) => s.auto_update_enabled).length;
  const autoUpdateRate = pct(autoUpdateEnabled, totalSoftwareRecords);

  const childAppropriateSoftware = software_records.filter((s) => s.child_appropriate).length;
  const childAppropriateRate = pct(childAppropriateSoftware, totalSoftwareRecords);

  const accessibilitySoftware = software_records.filter((s) => s.accessibility_compliant).length;
  const softwareAccessibilityRate = pct(accessibilitySoftware, totalSoftwareRecords);

  const educationalSoftware = software_records.filter((s) => s.category === "education").length;
  const educationalSoftwareRate = pct(educationalSoftware, totalSoftwareRecords);

  // Software deployment coverage
  const totalDevicesNeeded = software_records.reduce((sum, s) => sum + s.total_devices_needed, 0);
  const totalDevicesInstalled = software_records.reduce(
    (sum, s) => sum + s.installed_on_device_count,
    0,
  );
  const deploymentRate = pct(totalDevicesInstalled, totalDevicesNeeded);

  // --- Digital access equity metrics ---
  const totalDigitalAccessRecords = digital_access_records.length;

  const childrenWithAccess = digital_access_records.filter(
    (d) => d.has_personal_device || d.has_shared_device_access,
  ).length;
  const digitalAccessRate = pct(childrenWithAccess, totalDigitalAccessRecords);

  const childrenWithInternet = digital_access_records.filter(
    (d) => d.internet_access_available,
  ).length;
  const internetAccessRate = pct(childrenWithInternet, totalDigitalAccessRecords);

  const homeworkAccessAdequate = digital_access_records.filter(
    (d) => d.homework_access_adequate,
  ).length;
  const homeworkAccessRate = pct(homeworkAccessAdequate, totalDigitalAccessRecords);

  const educationalSwAvailable = digital_access_records.filter(
    (d) => d.educational_software_available,
  ).length;
  const edSoftwareAccessRate = pct(educationalSwAvailable, totalDigitalAccessRecords);

  const onlineSafetyTrained = digital_access_records.filter(
    (d) => d.online_safety_training_completed,
  ).length;
  const onlineSafetyTrainingRate = pct(onlineSafetyTrained, totalDigitalAccessRecords);

  const supervisedAccess = digital_access_records.filter((d) => d.supervised_access).length;
  const supervisedAccessRate = pct(supervisedAccess, totalDigitalAccessRecords);

  const skillsAssessed = digital_access_records.filter(
    (d) => d.digital_skills_assessed,
  ).length;
  const skillsAssessedRate = pct(skillsAssessed, totalDigitalAccessRecords);

  const assistiveTechNeeded = digital_access_records.filter(
    (d) => d.assistive_technology_needed,
  ).length;
  const assistiveTechProvided = digital_access_records.filter(
    (d) => d.assistive_technology_needed && d.assistive_technology_provided,
  ).length;
  const assistiveTechRate = pct(assistiveTechProvided, assistiveTechNeeded);

  const barriersIdentified = digital_access_records.filter(
    (d) => d.barriers_identified.length > 0,
  ).length;
  const barriersAddressed = digital_access_records.filter(
    (d) => d.barriers_identified.length > 0 && d.barriers_addressed,
  ).length;
  const barriersAddressedRate = pct(barriersAddressed, barriersIdentified);

  const uniqueChildrenInAccess = new Set(
    digital_access_records.map((d) => d.child_id),
  ).size;
  const accessChildCoverage = total_children > 0 ? pct(uniqueChildrenInAccess, total_children) : 0;

  // --- Child satisfaction composite ---
  const satisfactionRatings = digital_access_records
    .filter((d) => d.child_satisfaction_rating >= 1 && d.child_satisfaction_rating <= 5);
  const totalSatisfactionSum = satisfactionRatings.reduce(
    (sum, d) => sum + d.child_satisfaction_rating,
    0,
  );
  const avgSatisfaction =
    satisfactionRatings.length > 0
      ? Math.round((totalSatisfactionSum / satisfactionRatings.length) * 100) / 100
      : 0;
  // Convert 1-5 scale to percentage: (avg - 1) / 4 * 100
  const childSatisfactionRate =
    satisfactionRatings.length > 0
      ? Math.round(((avgSatisfaction - 1) / 4) * 100)
      : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: wifiReliabilityRate (>=90: +5, >=70: +3) ---
  if (wifiReliabilityRate >= 90) score += 5;
  else if (wifiReliabilityRate >= 70) score += 3;

  // --- Bonus 2: deviceAvailabilityRate (>=95: +5, >=80: +3) ---
  if (deviceAvailabilityRate >= 95) score += 5;
  else if (deviceAvailabilityRate >= 80) score += 3;

  // --- Bonus 3: softwareCurrencyRate (>=90: +4, >=70: +2) ---
  if (softwareCurrencyRate >= 90) score += 4;
  else if (softwareCurrencyRate >= 70) score += 2;

  // --- Bonus 4: digitalAccessRate (>=95: +4, >=80: +2) ---
  if (digitalAccessRate >= 95) score += 4;
  else if (digitalAccessRate >= 80) score += 2;

  // --- Bonus 5: childSatisfactionRate (>=80: +3, >=60: +1) ---
  if (childSatisfactionRate >= 80) score += 3;
  else if (childSatisfactionRate >= 60) score += 1;

  // --- Bonus 6: printerAccessRate (>=90: +3, >=70: +1) ---
  if (printerAccessRate >= 90) score += 3;
  else if (printerAccessRate >= 70) score += 1;

  // --- Bonus 7: securityPatchRate (>=95: +2, >=80: +1) ---
  if (securityPatchRate >= 95) score += 2;
  else if (securityPatchRate >= 80) score += 1;

  // --- Bonus 8: onlineSafetyTrainingRate (>=90: +2, >=70: +1) ---
  if (onlineSafetyTrainingRate >= 90) score += 2;
  else if (onlineSafetyTrainingRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // wifiReliabilityRate < 40 → -5 (guarded)
  if (wifiReliabilityRate < 40 && totalWifiRecords > 0) score -= 5;

  // deviceAvailabilityRate < 50 → -5 (guarded)
  if (deviceAvailabilityRate < 50 && totalDeviceRecords > 0) score -= 5;

  // softwareCurrencyRate < 40 → -4 (guarded)
  if (softwareCurrencyRate < 40 && totalSoftwareRecords > 0) score -= 4;

  // digitalAccessRate < 50 → -4 (guarded)
  if (digitalAccessRate < 50 && totalDigitalAccessRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const it_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (wifiReliabilityRate >= 90 && totalWifiRecords > 0) {
    strengths.push(
      `${wifiReliabilityRate}% WiFi reliability — the home provides consistently strong, reliable internet connectivity that supports children's education and development.`,
    );
  } else if (wifiReliabilityRate >= 70 && totalWifiRecords > 0) {
    strengths.push(
      `${wifiReliabilityRate}% WiFi reliability rate — the home maintains good internet connectivity for children's educational and personal needs.`,
    );
  }

  if (deviceAvailabilityRate >= 95 && totalDeviceRecords > 0) {
    strengths.push(
      `${deviceAvailabilityRate}% device availability — virtually all computing devices are operational and available for children's use.`,
    );
  } else if (deviceAvailabilityRate >= 80 && totalDeviceRecords > 0) {
    strengths.push(
      `${deviceAvailabilityRate}% device availability rate — good levels of operational computing equipment available to support children.`,
    );
  }

  if (printerAccessRate >= 90 && totalPrinterRecords > 0) {
    strengths.push(
      `${printerAccessRate}% printer access for children — children have excellent access to printing facilities to support homework and personal projects.`,
    );
  } else if (printerAccessRate >= 70 && totalPrinterRecords > 0) {
    strengths.push(
      `${printerAccessRate}% printer access — good availability of printing facilities for children's educational needs.`,
    );
  }

  if (softwareCurrencyRate >= 90 && totalSoftwareRecords > 0) {
    strengths.push(
      `${softwareCurrencyRate}% software currency — software is kept up to date, ensuring children have access to current tools and security protections.`,
    );
  } else if (softwareCurrencyRate >= 70 && totalSoftwareRecords > 0) {
    strengths.push(
      `${softwareCurrencyRate}% software currency rate — the home generally maintains current software versions across its devices.`,
    );
  }

  if (digitalAccessRate >= 95 && totalDigitalAccessRecords > 0) {
    strengths.push(
      `${digitalAccessRate}% digital access equity — virtually all children have equitable access to computing devices and the internet for their education and development.`,
    );
  } else if (digitalAccessRate >= 80 && totalDigitalAccessRecords > 0) {
    strengths.push(
      `${digitalAccessRate}% digital access rate — good levels of equitable digital access across children in the home.`,
    );
  }

  if (childSatisfactionRate >= 80 && satisfactionRatings.length > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction with IT provision — children express high levels of satisfaction with the technology available to them.`,
    );
  } else if (childSatisfactionRate >= 60 && satisfactionRatings.length > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction rate — children are generally positive about the IT equipment and digital access available in the home.`,
    );
  }

  if (securityPatchRate >= 95 && totalSoftwareRecords > 0) {
    strengths.push(
      `${securityPatchRate}% of software security-patched — the home demonstrates excellent cyber security practice, protecting children's data and online safety.`,
    );
  } else if (securityPatchRate >= 80 && totalSoftwareRecords > 0) {
    strengths.push(
      `${securityPatchRate}% security patch rate — good levels of software security maintenance across the home's devices.`,
    );
  }

  if (onlineSafetyTrainingRate >= 90 && totalDigitalAccessRecords > 0) {
    strengths.push(
      `${onlineSafetyTrainingRate}% of children have completed online safety training — the home prioritises children's digital safety awareness.`,
    );
  } else if (onlineSafetyTrainingRate >= 70 && totalDigitalAccessRecords > 0) {
    strengths.push(
      `${onlineSafetyTrainingRate}% online safety training completion — most children have received digital safety training.`,
    );
  }

  if (contentFilterRate >= 95 && totalWifiRecords > 0) {
    strengths.push(
      "Content filtering active across virtually all WiFi access points — strong safeguarding controls are in place to protect children online.",
    );
  }

  if (parentalControlsRate >= 95 && totalWifiRecords > 0) {
    strengths.push(
      "Parental controls enabled across all WiFi access points — age-appropriate internet access controls are comprehensively implemented.",
    );
  }

  if (educationalNeedsRate >= 90 && totalDeviceRecords > 0) {
    strengths.push(
      `${educationalNeedsRate}% of devices meet educational needs — the home's IT equipment is well-suited to supporting children's learning and homework requirements.`,
    );
  }

  if (homeworkAccessRate >= 90 && totalDigitalAccessRecords > 0) {
    strengths.push(
      `${homeworkAccessRate}% of children have adequate homework access — digital resources effectively support children's educational attainment.`,
    );
  }

  if (deviceChildCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has access to a dedicated computing device — digital equity is fully embedded in the home's provision.",
    );
  } else if (deviceChildCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${deviceChildCoverage}% of children have an assigned device — strong device allocation ensuring most children have personal access to technology.`,
    );
  }

  if (assistiveTechRate >= 100 && assistiveTechNeeded > 0) {
    strengths.push(
      "All children requiring assistive technology have been provided with appropriate solutions — the home demonstrates inclusive digital provision.",
    );
  }

  if (barriersAddressedRate >= 90 && barriersIdentified > 0) {
    strengths.push(
      `${barriersAddressedRate}% of identified digital access barriers have been addressed — the home actively works to remove obstacles to children's digital participation.`,
    );
  }

  if (deviceConditionRate >= 90 && totalDeviceRecords > 0) {
    strengths.push(
      `${deviceConditionRate}% of devices in good or excellent condition — IT equipment is well-maintained, providing children with a positive technology experience.`,
    );
  }

  if (licenceValidRate >= 95 && totalSoftwareRecords > 0) {
    strengths.push(
      `${licenceValidRate}% of software licences valid — the home maintains proper software licensing, demonstrating responsible IT governance.`,
    );
  }

  if (signalQualityRate >= 90 && totalWifiRecords > 0) {
    strengths.push(
      `${signalQualityRate}% of WiFi tests show excellent or good signal quality — the home provides reliable wireless coverage throughout.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (wifiReliabilityRate < 40 && totalWifiRecords > 0) {
    concerns.push(
      `Only ${wifiReliabilityRate}% WiFi reliability — the home's internet connectivity is frequently failing to meet targets, directly impacting children's ability to access educational resources and complete homework.`,
    );
  } else if (wifiReliabilityRate < 70 && wifiReliabilityRate >= 40 && totalWifiRecords > 0) {
    concerns.push(
      `WiFi reliability at ${wifiReliabilityRate}% — inconsistent internet connectivity may disrupt children's education, homework, and communication with family and professionals.`,
    );
  }

  if (deviceAvailabilityRate < 50 && totalDeviceRecords > 0) {
    concerns.push(
      `Only ${deviceAvailabilityRate}% device availability — more than half of computing devices are non-operational, creating significant barriers to children's digital access and educational support.`,
    );
  } else if (deviceAvailabilityRate < 80 && deviceAvailabilityRate >= 50 && totalDeviceRecords > 0) {
    concerns.push(
      `Device availability at ${deviceAvailabilityRate}% — a notable proportion of computing devices are non-operational, potentially limiting children's access to technology.`,
    );
  }

  if (softwareCurrencyRate < 40 && totalSoftwareRecords > 0) {
    concerns.push(
      `Only ${softwareCurrencyRate}% software currency — the majority of software is outdated, exposing children to security vulnerabilities and limiting access to current educational tools.`,
    );
  } else if (softwareCurrencyRate < 70 && softwareCurrencyRate >= 40 && totalSoftwareRecords > 0) {
    concerns.push(
      `Software currency at ${softwareCurrencyRate}% — many software applications are not up to date, risking security gaps and compatibility issues.`,
    );
  }

  if (digitalAccessRate < 50 && totalDigitalAccessRecords > 0) {
    concerns.push(
      `Only ${digitalAccessRate}% digital access equity — more than half of children lack adequate access to computing devices, creating a significant digital divide that impacts educational outcomes.`,
    );
  } else if (digitalAccessRate < 80 && digitalAccessRate >= 50 && totalDigitalAccessRecords > 0) {
    concerns.push(
      `Digital access at ${digitalAccessRate}% — not all children have equitable access to computing devices and the internet, risking educational disadvantage.`,
    );
  }

  if (printerAccessRate < 50 && totalPrinterRecords > 0) {
    concerns.push(
      `Only ${printerAccessRate}% printer access for children — limited printing facilities may hinder children's ability to complete homework and school projects.`,
    );
  } else if (printerAccessRate < 70 && printerAccessRate >= 50 && totalPrinterRecords > 0) {
    concerns.push(
      `Printer access at ${printerAccessRate}% — not all printers are accessible to children, potentially limiting their ability to print homework and educational materials.`,
    );
  }

  if (childSatisfactionRate < 40 && satisfactionRatings.length > 0) {
    concerns.push(
      `Child satisfaction with IT provision at only ${childSatisfactionRate}% — children are significantly dissatisfied with the technology available to them, suggesting IT equipment is not meeting their needs.`,
    );
  } else if (childSatisfactionRate < 60 && childSatisfactionRate >= 40 && satisfactionRatings.length > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — children express mixed views about IT provision, indicating areas where equipment or access could be improved.`,
    );
  }

  if (securityPatchRate < 50 && totalSoftwareRecords > 0) {
    concerns.push(
      `Only ${securityPatchRate}% of software security-patched — the majority of software lacks current security patches, leaving children's devices and data vulnerable to cyber threats.`,
    );
  } else if (securityPatchRate < 80 && securityPatchRate >= 50 && totalSoftwareRecords > 0) {
    concerns.push(
      `Security patch rate at ${securityPatchRate}% — some software lacks current security patches, creating potential vulnerabilities.`,
    );
  }

  if (contentFilterRate < 80 && totalWifiRecords > 0) {
    concerns.push(
      `Content filtering active on only ${contentFilterRate}% of WiFi access points — gaps in content filtering compromise children's online safety and safeguarding arrangements.`,
    );
  }

  if (parentalControlsRate < 80 && totalWifiRecords > 0) {
    concerns.push(
      `Parental controls enabled on only ${parentalControlsRate}% of WiFi access points — incomplete parental controls risk children accessing age-inappropriate content.`,
    );
  }

  if (onlineSafetyTrainingRate < 50 && totalDigitalAccessRecords > 0) {
    concerns.push(
      `Only ${onlineSafetyTrainingRate}% of children have completed online safety training — the majority of children lack formal digital safety awareness, undermining safeguarding efforts.`,
    );
  } else if (onlineSafetyTrainingRate < 70 && onlineSafetyTrainingRate >= 50 && totalDigitalAccessRecords > 0) {
    concerns.push(
      `Online safety training at ${onlineSafetyTrainingRate}% — not all children have received digital safety training, leaving gaps in online safeguarding.`,
    );
  }

  if (agingDeviceRate >= 40 && totalDeviceRecords > 0) {
    concerns.push(
      `${agingDeviceRate}% of devices are 5+ years old — aging equipment may not support current software, run slowly, or fail to meet children's educational requirements.`,
    );
  }

  if (maintenanceDueRate >= 30 && totalDeviceRecords > 0) {
    concerns.push(
      `${maintenanceDueRate}% of devices have maintenance overdue — neglected maintenance increases the risk of equipment failure and data loss.`,
    );
  }

  if (homeworkAccessRate < 60 && totalDigitalAccessRecords > 0) {
    concerns.push(
      `Only ${homeworkAccessRate}% of children have adequate homework access — children are unable to access the digital resources they need for their education (Reg 8).`,
    );
  }

  if (assistiveTechRate < 80 && assistiveTechNeeded > 0) {
    concerns.push(
      `Only ${assistiveTechRate}% of children needing assistive technology have been provided with it — unmet assistive technology needs represent a failure in inclusive digital provision.`,
    );
  }

  if (barriersAddressedRate < 50 && barriersIdentified > 0) {
    concerns.push(
      `Only ${barriersAddressedRate}% of identified digital access barriers have been addressed — known obstacles to children's digital participation remain unresolved.`,
    );
  }

  if (licenceValidRate < 70 && totalSoftwareRecords > 0) {
    concerns.push(
      `Only ${licenceValidRate}% of software licences are valid — unlicensed software exposes the home to legal risk and may result in loss of access to critical applications.`,
    );
  }

  if (avgOutageMinutes >= 30 && totalWifiRecords > 0) {
    concerns.push(
      `Average WiFi outage of ${avgOutageMinutes} minutes per test period — frequent or prolonged internet outages disrupt children's education and connectivity.`,
    );
  }

  if (accessChildCoverage < 60 && total_children > 0 && totalDigitalAccessRecords > 0) {
    concerns.push(
      `Only ${accessChildCoverage}% of children have digital access records — many children's digital access needs have not been assessed or documented.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: ItEquipmentRecommendation[] = [];
  let rank = 0;

  if (wifiReliabilityRate < 40 && totalWifiRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review WiFi infrastructure — identify and resolve connectivity issues including dead spots, bandwidth limitations, and equipment failures. Children's education depends on reliable internet access.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (deviceAvailabilityRate < 50 && totalDeviceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately repair or replace non-operational computing devices — more than half of devices are unavailable, creating an unacceptable barrier to children's digital access and educational support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (digitalAccessRate < 50 && totalDigitalAccessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the digital divide urgently — ensure every child has access to a computing device and the internet. Digital exclusion directly impacts educational outcomes and is incompatible with equitable care.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (softwareCurrencyRate < 40 && totalSoftwareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an urgent software update programme — outdated software exposes children to security vulnerabilities and limits access to current educational tools. Enable automatic updates where possible.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (securityPatchRate < 50 && totalSoftwareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Apply critical security patches immediately across all devices — unpatched software is a serious cyber security risk that threatens children's data and the home's digital safety.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
    });
  }

  if (contentFilterRate < 80 && totalWifiRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure content filtering is active on all WiFi access points — gaps in filtering compromise children's online safety. Review and implement filtering across all network access points immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (onlineSafetyTrainingRate < 50 && totalDigitalAccessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Deliver online safety training to all children who have not yet received it — digital safety awareness is essential for safeguarding children who use technology daily.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (assistiveTechRate < 80 && assistiveTechNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide assistive technology to all children who have been assessed as needing it — unmet assistive technology needs create barriers to participation and educational achievement.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (printerAccessRate < 50 && totalPrinterRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve children's access to printing facilities — ensure at least one operational printer is accessible for homework and educational use, with adequate supplies maintained.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (childSatisfactionRate < 40 && satisfactionRatings.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult with children about their IT needs and dissatisfaction — their voice should inform equipment purchasing, software choices, and digital access arrangements.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (
    wifiReliabilityRate >= 40 &&
    wifiReliabilityRate < 70 &&
    totalWifiRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a WiFi improvement plan — investigate signal strength, bandwidth, and outage patterns to improve reliability above 70%. Consider WiFi extenders, mesh systems, or ISP upgrades.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    deviceAvailabilityRate >= 50 &&
    deviceAvailabilityRate < 80 &&
    totalDeviceRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule maintenance and repair for non-operational devices — establish a regular maintenance cycle to prevent device failures and ensure consistent availability.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (agingDeviceRate >= 40 && totalDeviceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a device replacement programme for aging equipment — devices over 5 years old increasingly fail to run current software and meet children's needs. Budget for phased replacement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    softwareCurrencyRate >= 40 &&
    softwareCurrencyRate < 70 &&
    totalSoftwareRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a software update schedule — review all software for currency and enable automatic updates where possible. Assign responsibility for monitoring and maintaining software versions.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    digitalAccessRate >= 50 &&
    digitalAccessRate < 80 &&
    totalDigitalAccessRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend digital access to all children — identify children without adequate device access and develop a plan to provide personal or shared devices that meet their educational and development needs.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (
    printerAccessRate >= 50 &&
    printerAccessRate < 70 &&
    totalPrinterRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve printer access — review printer locations, access arrangements, and supply management to ensure all children can print homework and educational materials when needed.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    onlineSafetyTrainingRate >= 50 &&
    onlineSafetyTrainingRate < 70 &&
    totalDigitalAccessRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend online safety training to reach all children — develop an ongoing digital safety programme that covers current online risks and is refreshed as threats evolve.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (
    barriersAddressedRate >= 50 &&
    barriersAddressedRate < 80 &&
    barriersIdentified > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address remaining identified barriers to digital access — review outstanding barriers and develop targeted solutions to ensure no child is excluded from digital participation.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    skillsAssessedRate < 70 &&
    totalDigitalAccessRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assess digital skills for all children — understanding each child's digital competency level enables targeted support and ensures children develop the skills needed for education and independence.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  if (
    childSatisfactionRate >= 40 &&
    childSatisfactionRate < 60 &&
    satisfactionRatings.length > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore ways to improve children's satisfaction with IT provision — seek specific feedback on what children would like improved and factor their views into equipment and access decisions.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (
    accessChildCoverage < 80 &&
    total_children > 0 &&
    totalDigitalAccessRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete digital access assessments for all children — every child should have a documented assessment of their digital access needs, skills, and any barriers to ensure equitable provision.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 — Education",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: ItEquipmentInsight[] = [];

  // -- Critical insights --

  if (wifiReliabilityRate < 40 && totalWifiRecords > 0) {
    insights.push({
      text: `Only ${wifiReliabilityRate}% WiFi reliability. Unreliable internet connectivity directly undermines children's access to education, homework resources, and communication with family and professionals. Under CHR 2015 Reg 8, the home must support children's education — this includes providing adequate digital infrastructure.`,
      severity: "critical",
    });
  }

  if (deviceAvailabilityRate < 50 && totalDeviceRecords > 0) {
    insights.push({
      text: `Only ${deviceAvailabilityRate}% device availability. More than half of computing devices are non-operational. Children cannot access digital education resources, complete homework effectively, or develop essential digital skills without functioning equipment.`,
      severity: "critical",
    });
  }

  if (softwareCurrencyRate < 40 && totalSoftwareRecords > 0) {
    insights.push({
      text: `Only ${softwareCurrencyRate}% software currency. Outdated software creates security vulnerabilities that could compromise children's personal data and exposes them to online risks. Current software is essential for both safeguarding and educational quality.`,
      severity: "critical",
    });
  }

  if (digitalAccessRate < 50 && totalDigitalAccessRecords > 0) {
    insights.push({
      text: `Only ${digitalAccessRate}% digital access equity. More than half of children lack adequate access to computing devices or the internet. This digital divide creates educational disadvantage and is inconsistent with the home's duty to promote children's achievement and wellbeing (Reg 8).`,
      severity: "critical",
    });
  }

  if (securityPatchRate < 50 && totalSoftwareRecords > 0) {
    insights.push({
      text: `Only ${securityPatchRate}% of software is security-patched. Unpatched devices represent a serious cyber security risk. Children's personal data, educational work, and online safety are compromised when security updates are not applied promptly.`,
      severity: "critical",
    });
  }

  if (totalDeviceRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No device records despite children being on placement. The home cannot evidence what computing equipment is available, whether it is operational, or whether it meets children's educational needs. Device auditing is essential for demonstrating adequate IT provision.",
      severity: "critical",
    });
  }

  if (totalDigitalAccessRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No digital access records despite children being on placement. Without individual digital access assessments, the home cannot demonstrate that each child's technology needs are understood, met, or equitable. This is a gap in evidencing support for children's education (Reg 8).",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    wifiReliabilityRate >= 40 &&
    wifiReliabilityRate < 70 &&
    totalWifiRecords > 0
  ) {
    insights.push({
      text: `WiFi reliability at ${wifiReliabilityRate}% — improving but inconsistent connectivity can still disrupt children's homework, online learning, and communication. Investigating outage patterns and signal weak spots would help target improvements.`,
      severity: "warning",
    });
  }

  if (
    deviceAvailabilityRate >= 50 &&
    deviceAvailabilityRate < 80 &&
    totalDeviceRecords > 0
  ) {
    insights.push({
      text: `Device availability at ${deviceAvailabilityRate}% — some devices are non-operational. A preventive maintenance schedule would help ensure consistent equipment availability for children.`,
      severity: "warning",
    });
  }

  if (
    softwareCurrencyRate >= 40 &&
    softwareCurrencyRate < 70 &&
    totalSoftwareRecords > 0
  ) {
    insights.push({
      text: `Software currency at ${softwareCurrencyRate}% — some applications are outdated. Enabling automatic updates and establishing a regular review cycle would reduce security risks and ensure children have access to current tools.`,
      severity: "warning",
    });
  }

  if (
    digitalAccessRate >= 50 &&
    digitalAccessRate < 80 &&
    totalDigitalAccessRecords > 0
  ) {
    insights.push({
      text: `Digital access at ${digitalAccessRate}% — some children lack adequate device or internet access. Addressing this gap is important for ensuring equitable educational support across all children in the home.`,
      severity: "warning",
    });
  }

  if (
    childSatisfactionRate >= 40 &&
    childSatisfactionRate < 60 &&
    satisfactionRatings.length > 0
  ) {
    insights.push({
      text: `Child satisfaction with IT at ${childSatisfactionRate}% — children's mixed views about technology provision suggest their needs are not fully being met. Consulting children about specific improvements would demonstrate child-centred practice.`,
      severity: "warning",
    });
  }

  if (
    printerAccessRate >= 50 &&
    printerAccessRate < 70 &&
    totalPrinterRecords > 0
  ) {
    insights.push({
      text: `Printer access at ${printerAccessRate}% — not all children can easily access printing facilities. Homework and school project requirements often need printed output, so improving access would directly support educational attainment.`,
      severity: "warning",
    });
  }

  if (
    onlineSafetyTrainingRate >= 50 &&
    onlineSafetyTrainingRate < 70 &&
    totalDigitalAccessRecords > 0
  ) {
    insights.push({
      text: `Online safety training at ${onlineSafetyTrainingRate}% — not all children have completed digital safety awareness. As technology use increases, comprehensive safety training becomes more critical to safeguarding.`,
      severity: "warning",
    });
  }

  if (
    maintenanceDueRate >= 20 &&
    maintenanceDueRate < 30 &&
    totalDeviceRecords > 0
  ) {
    insights.push({
      text: `${maintenanceDueRate}% of devices have maintenance overdue — delayed maintenance increases the risk of unexpected failures. Establishing a regular maintenance cycle would improve device reliability.`,
      severity: "warning",
    });
  }

  if (
    licenceValidRate >= 70 &&
    licenceValidRate < 90 &&
    totalSoftwareRecords > 0
  ) {
    insights.push({
      text: `Software licence validity at ${licenceValidRate}% — some licences have expired or are invalid. Expired licences may result in software deactivation, disrupting children's access to educational tools.`,
      severity: "warning",
    });
  }

  // Identify software category coverage gaps
  const softwareCategories: Record<string, number> = {};
  for (const s of software_records) {
    softwareCategories[s.category] = (softwareCategories[s.category] ?? 0) + 1;
  }
  const allSwCategories = ["education", "productivity", "security", "accessibility", "communication", "creative"];
  const missingSwCategories = allSwCategories.filter(
    (c) => !softwareCategories[c] || softwareCategories[c] === 0,
  );
  if (missingSwCategories.length >= 3 && totalSoftwareRecords > 3) {
    insights.push({
      text: `Software provision concentrated in limited categories — no recorded software in ${missingSwCategories.join(", ")}. A broader software portfolio across educational, creative, accessibility, and communication tools would better support children's diverse needs.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (it_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding IT equipment and connectivity provision — WiFi is reliable, devices are well-maintained and available, software is current, and children have equitable digital access. This contributes positively to children's education, development, and digital skills preparation for independence.",
      severity: "positive",
    });
  }

  if (
    wifiReliabilityRate >= 90 &&
    signalQualityRate >= 90 &&
    totalWifiRecords > 0
  ) {
    insights.push({
      text: `${wifiReliabilityRate}% WiFi reliability with ${signalQualityRate}% excellent/good signal quality — the home provides robust, high-quality internet connectivity that effectively supports children's education, communication, and digital development.`,
      severity: "positive",
    });
  }

  if (
    deviceAvailabilityRate >= 95 &&
    deviceConditionRate >= 90 &&
    totalDeviceRecords > 0
  ) {
    insights.push({
      text: `${deviceAvailabilityRate}% device availability with ${deviceConditionRate}% in good/excellent condition — the home maintains excellent computing equipment that provides children with reliable, quality technology access.`,
      severity: "positive",
    });
  }

  if (
    softwareCurrencyRate >= 90 &&
    securityPatchRate >= 95 &&
    totalSoftwareRecords > 0
  ) {
    insights.push({
      text: `${softwareCurrencyRate}% software currency with ${securityPatchRate}% security-patched — software is well-maintained, current, and secure, protecting children online while providing access to up-to-date educational tools.`,
      severity: "positive",
    });
  }

  if (
    digitalAccessRate >= 95 &&
    homeworkAccessRate >= 90 &&
    totalDigitalAccessRecords > 0
  ) {
    insights.push({
      text: `${digitalAccessRate}% digital access equity with ${homeworkAccessRate}% adequate homework access — the home ensures children have equitable access to technology that directly supports their educational achievement.`,
      severity: "positive",
    });
  }

  if (
    childSatisfactionRate >= 80 &&
    satisfactionRatings.length > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction with IT provision — children's positive views about the technology available to them reflect a child-centred approach to digital provision that listens to and responds to their needs.`,
      severity: "positive",
    });
  }

  if (
    onlineSafetyTrainingRate >= 90 &&
    contentFilterRate >= 95 &&
    parentalControlsRate >= 95 &&
    totalDigitalAccessRecords > 0 &&
    totalWifiRecords > 0
  ) {
    insights.push({
      text: `Comprehensive digital safeguarding — ${onlineSafetyTrainingRate}% online safety training, ${contentFilterRate}% content filtering, and ${parentalControlsRate}% parental controls. The home demonstrates a multi-layered approach to keeping children safe online.`,
      severity: "positive",
    });
  }

  if (
    assistiveTechRate >= 100 &&
    assistiveTechNeeded > 0
  ) {
    insights.push({
      text: "All children requiring assistive technology have been provided with appropriate solutions — the home demonstrates genuinely inclusive digital provision that ensures no child is excluded from technology access due to additional needs.",
      severity: "positive",
    });
  }

  if (
    barriersAddressedRate >= 90 &&
    barriersIdentified > 0
  ) {
    insights.push({
      text: `${barriersAddressedRate}% of identified digital access barriers addressed — the home proactively identifies and resolves obstacles to children's digital participation, demonstrating a commitment to removing disadvantage.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (it_rating === "outstanding") {
    headline =
      "Outstanding IT equipment and connectivity — WiFi is reliable, devices are available and well-maintained, software is current, and children have equitable digital access supporting their education and development.";
  } else if (it_rating === "good") {
    headline = `Good IT equipment and connectivity — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (it_rating === "adequate") {
    headline = `Adequate IT equipment and connectivity — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure reliable connectivity, adequate equipment, and equitable digital access for children.`;
  } else {
    headline = `IT equipment and connectivity is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve WiFi reliability, device availability, software currency, and children's digital access equity.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    it_rating,
    it_score: score,
    headline,
    total_wifi_records: totalWifiRecords,
    total_device_records: totalDeviceRecords,
    total_printer_records: totalPrinterRecords,
    total_software_records: totalSoftwareRecords,
    total_digital_access_records: totalDigitalAccessRecords,
    wifi_reliability_rate: wifiReliabilityRate,
    device_availability_rate: deviceAvailabilityRate,
    printer_access_rate: printerAccessRate,
    software_currency_rate: softwareCurrencyRate,
    digital_access_rate: digitalAccessRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
