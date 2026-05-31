// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home IT Equipment & Connectivity Intelligence Engine
// Covers WiFi reliability, device availability, printer access, software
// currency, digital access equity, child satisfaction, scoring, strengths,
// concerns, recommendations, and insights.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeItEquipmentConnectivity,
  type ItEquipmentConnectivityInput,
  type WifiRecordInput,
  type DeviceRecordInput,
  type PrinterRecordInput,
  type SoftwareRecordInput,
  type DigitalAccessRecordInput,
} from "../home-it-equipment-connectivity-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-31";

let _id = 0;
function uid(): string {
  return `test_${++_id}`;
}

function makeWifi(overrides: Partial<WifiRecordInput> = {}): WifiRecordInput {
  return {
    id: uid(),
    date: "2026-05-20",
    location: "Living room",
    signal_strength: "excellent",
    speed_mbps_download: 80,
    speed_mbps_upload: 20,
    target_speed_mbps: 50,
    meets_target: true,
    outage_minutes: 0,
    outage_reported: false,
    tested_by: "staff_1",
    password_secured: true,
    content_filter_active: true,
    parental_controls_enabled: true,
    child_accessible: true,
    backup_connection_available: true,
    notes: "",
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeDevice(overrides: Partial<DeviceRecordInput> = {}): DeviceRecordInput {
  return {
    id: uid(),
    device_type: "laptop",
    device_name: "Laptop 1",
    assigned_to: "staff_1",
    child_id: null,
    shared_device: false,
    condition: "good",
    operational: true,
    age_years: 1,
    last_maintenance_date: "2026-05-01",
    maintenance_due: false,
    has_antivirus: true,
    has_content_filter: true,
    meets_educational_needs: true,
    accessible_features_enabled: true,
    charging_equipment_available: true,
    protective_case: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makePrinter(overrides: Partial<PrinterRecordInput> = {}): PrinterRecordInput {
  return {
    id: uid(),
    printer_name: "Office Printer",
    location: "Study room",
    printer_type: "multifunction",
    operational: true,
    ink_toner_level: "full",
    paper_stocked: true,
    accessible_to_children: true,
    child_id: null,
    wifi_enabled: true,
    last_serviced_date: "2026-04-01",
    service_due: false,
    usage_allowed_for_homework: true,
    print_quota_managed: true,
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeSoftware(overrides: Partial<SoftwareRecordInput> = {}): SoftwareRecordInput {
  return {
    id: uid(),
    software_name: "Microsoft Office",
    category: "productivity",
    version_current: "16.0",
    version_latest: "16.0",
    is_up_to_date: true,
    licence_valid: true,
    licence_expiry_date: "2027-01-01",
    installed_on_device_count: 5,
    total_devices_needed: 5,
    auto_update_enabled: true,
    child_appropriate: true,
    accessibility_compliant: true,
    last_update_date: "2026-05-01",
    security_patched: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeDigitalAccess(overrides: Partial<DigitalAccessRecordInput> = {}): DigitalAccessRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-20",
    has_personal_device: true,
    has_shared_device_access: true,
    device_access_hours_per_day: 3,
    internet_access_available: true,
    supervised_access: true,
    educational_software_available: true,
    homework_access_adequate: true,
    digital_skills_assessed: true,
    digital_skills_level: "competent",
    assistive_technology_needed: false,
    assistive_technology_provided: false,
    online_safety_training_completed: true,
    child_satisfaction_rating: 4,
    barriers_identified: [],
    barriers_addressed: false,
    notes: "",
    created_at: "2026-05-20",
    ...overrides,
  };
}

function baseInput(overrides: Partial<ItEquipmentConnectivityInput> = {}): ItEquipmentConnectivityInput {
  return {
    today: TODAY,
    total_children: 3,
    wifi_records: [],
    device_records: [],
    printer_records: [],
    software_records: [],
    digital_access_records: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home IT Equipment & Connectivity Intelligence Engine", () => {
  // ── Output Shape ────────────────────────────────────────────────────────

  describe("Output Shape", () => {
    it("returns correct output shape", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 0 }));
      expect(r).toHaveProperty("it_rating");
      expect(r).toHaveProperty("it_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_wifi_records");
      expect(r).toHaveProperty("total_device_records");
      expect(r).toHaveProperty("total_printer_records");
      expect(r).toHaveProperty("total_software_records");
      expect(r).toHaveProperty("total_digital_access_records");
      expect(r).toHaveProperty("wifi_reliability_rate");
      expect(r).toHaveProperty("device_availability_rate");
      expect(r).toHaveProperty("printer_access_rate");
      expect(r).toHaveProperty("software_currency_rate");
      expect(r).toHaveProperty("digital_access_rate");
      expect(r).toHaveProperty("child_satisfaction_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("returns arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 0 }));
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });

    it("returns numeric score between 0 and 100", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi()],
        device_records: [makeDevice()],
      }));
      expect(r.it_score).toBeGreaterThanOrEqual(0);
      expect(r.it_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Special Case: All Empty, 0 Children ─────────────────────────────────

  describe("Special case — all empty, 0 children", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 0 }));
      expect(r.it_rating).toBe("insufficient_data");
      expect(r.it_score).toBe(0);
    });

    it("returns correct headline for insufficient_data", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("No children on placement");
    });

    it("returns zero counts for all record types", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 0 }));
      expect(r.total_wifi_records).toBe(0);
      expect(r.total_device_records).toBe(0);
      expect(r.total_printer_records).toBe(0);
      expect(r.total_software_records).toBe(0);
      expect(r.total_digital_access_records).toBe(0);
    });

    it("returns zero rates for all metrics", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 0 }));
      expect(r.wifi_reliability_rate).toBe(0);
      expect(r.device_availability_rate).toBe(0);
      expect(r.printer_access_rate).toBe(0);
      expect(r.software_currency_rate).toBe(0);
      expect(r.digital_access_rate).toBe(0);
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("returns empty strengths, concerns, recommendations, insights", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 0 }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  // ── Special Case: All Empty, Children > 0 ──────────────────────────────

  describe("Special case — all empty, children > 0", () => {
    it("returns inadequate with score 15", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 3 }));
      expect(r.it_rating).toBe("inadequate");
      expect(r.it_score).toBe(15);
    });

    it("returns headline mentioning urgent attention", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 3 }));
      expect(r.headline).toContain("urgent attention");
    });

    it("returns exactly 1 concern about no records", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 3 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No WiFi records");
    });

    it("returns 2 recommendations with rank 1 and 2", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 3 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("both recommendations have immediate urgency", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 3 }));
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("returns exactly 1 critical insight", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 3 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("works with total_children = 1", () => {
      const r = computeItEquipmentConnectivity(baseInput({ total_children: 1 }));
      expect(r.it_rating).toBe("inadequate");
      expect(r.it_score).toBe(15);
    });
  });

  // ── Record Counts ────────────────────────────────────────────────────────

  describe("Record counts", () => {
    it("counts wifi records correctly", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi(), makeWifi(), makeWifi()],
      }));
      expect(r.total_wifi_records).toBe(3);
    });

    it("counts device records correctly", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        device_records: [makeDevice(), makeDevice()],
      }));
      expect(r.total_device_records).toBe(2);
    });

    it("counts printer records correctly", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        printer_records: [makePrinter()],
      }));
      expect(r.total_printer_records).toBe(1);
    });

    it("counts software records correctly", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        software_records: [makeSoftware(), makeSoftware(), makeSoftware(), makeSoftware()],
      }));
      expect(r.total_software_records).toBe(4);
    });

    it("counts digital access records correctly", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        digital_access_records: [
          makeDigitalAccess({ child_id: "child_1" }),
          makeDigitalAccess({ child_id: "child_2" }),
        ],
      }));
      expect(r.total_digital_access_records).toBe(2);
    });
  });

  // ── WiFi Reliability Rate ──────────────────────────────────────────────

  describe("WiFi reliability rate", () => {
    it("calculates 100% when all records meet target", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: true }), makeWifi({ meets_target: true })],
      }));
      expect(r.wifi_reliability_rate).toBe(100);
    });

    it("calculates 0% when no records meet target", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false }), makeWifi({ meets_target: false })],
      }));
      expect(r.wifi_reliability_rate).toBe(0);
    });

    it("calculates 50% when half meet target", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: true }), makeWifi({ meets_target: false })],
      }));
      expect(r.wifi_reliability_rate).toBe(50);
    });

    it("returns 0 when no wifi records exist", () => {
      const r = computeItEquipmentConnectivity(baseInput());
      expect(r.wifi_reliability_rate).toBe(0);
    });
  });

  // ── Device Availability Rate ───────────────────────────────────────────

  describe("Device availability rate", () => {
    it("calculates 100% when all devices operational", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        device_records: [makeDevice({ operational: true }), makeDevice({ operational: true })],
      }));
      expect(r.device_availability_rate).toBe(100);
    });

    it("calculates 0% when no devices operational", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        device_records: [makeDevice({ operational: false }), makeDevice({ operational: false })],
      }));
      expect(r.device_availability_rate).toBe(0);
    });

    it("calculates correctly with mixed operational status", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        device_records: [
          makeDevice({ operational: true }),
          makeDevice({ operational: true }),
          makeDevice({ operational: false }),
        ],
      }));
      expect(r.device_availability_rate).toBe(67);
    });
  });

  // ── Printer Access Rate ────────────────────────────────────────────────

  describe("Printer access rate", () => {
    it("calculates 100% when all printers accessible and operational", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        printer_records: [
          makePrinter({ operational: true, accessible_to_children: true }),
          makePrinter({ operational: true, accessible_to_children: true }),
        ],
      }));
      expect(r.printer_access_rate).toBe(100);
    });

    it("calculates 0% when no printers accessible to children", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        printer_records: [
          makePrinter({ operational: true, accessible_to_children: false }),
          makePrinter({ operational: true, accessible_to_children: false }),
        ],
      }));
      expect(r.printer_access_rate).toBe(0);
    });

    it("excludes non-operational printers from access rate", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        printer_records: [
          makePrinter({ operational: false, accessible_to_children: true }),
          makePrinter({ operational: true, accessible_to_children: true }),
        ],
      }));
      expect(r.printer_access_rate).toBe(50);
    });
  });

  // ── Software Currency Rate ─────────────────────────────────────────────

  describe("Software currency rate", () => {
    it("calculates 100% when all software up to date", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        software_records: [
          makeSoftware({ is_up_to_date: true }),
          makeSoftware({ is_up_to_date: true }),
        ],
      }));
      expect(r.software_currency_rate).toBe(100);
    });

    it("calculates 0% when no software up to date", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        software_records: [
          makeSoftware({ is_up_to_date: false }),
          makeSoftware({ is_up_to_date: false }),
        ],
      }));
      expect(r.software_currency_rate).toBe(0);
    });

    it("calculates correct percentage with mixed status", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        software_records: [
          makeSoftware({ is_up_to_date: true }),
          makeSoftware({ is_up_to_date: false }),
          makeSoftware({ is_up_to_date: true }),
          makeSoftware({ is_up_to_date: false }),
        ],
      }));
      expect(r.software_currency_rate).toBe(50);
    });
  });

  // ── Digital Access Rate ────────────────────────────────────────────────

  describe("Digital access rate", () => {
    it("calculates 100% when all children have device access", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", has_personal_device: true }),
          makeDigitalAccess({ child_id: "c2", has_shared_device_access: true }),
        ],
      }));
      expect(r.digital_access_rate).toBe(100);
    });

    it("calculates 0% when no children have device access", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false }),
          makeDigitalAccess({ child_id: "c2", has_personal_device: false, has_shared_device_access: false }),
        ],
      }));
      expect(r.digital_access_rate).toBe(0);
    });

    it("counts children with either personal or shared device access", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", has_personal_device: true, has_shared_device_access: false }),
          makeDigitalAccess({ child_id: "c2", has_personal_device: false, has_shared_device_access: true }),
          makeDigitalAccess({ child_id: "c3", has_personal_device: false, has_shared_device_access: false }),
        ],
      }));
      expect(r.digital_access_rate).toBe(67);
    });
  });

  // ── Child Satisfaction Rate ────────────────────────────────────────────

  describe("Child satisfaction rate", () => {
    it("calculates 100% when all children rate 5/5", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 5 }),
          makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 5 }),
        ],
      }));
      expect(r.child_satisfaction_rate).toBe(100);
    });

    it("calculates 0% when all children rate 1/5", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 1 }),
          makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 1 }),
        ],
      }));
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("calculates 50% when average is 3/5", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 3 }),
          makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 3 }),
        ],
      }));
      expect(r.child_satisfaction_rate).toBe(50);
    });

    it("calculates 75% when average is 4/5", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 4 }),
          makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 4 }),
        ],
      }));
      expect(r.child_satisfaction_rate).toBe(75);
    });

    it("returns 0 when no digital access records exist", () => {
      const r = computeItEquipmentConnectivity(baseInput());
      expect(r.child_satisfaction_rate).toBe(0);
    });
  });

  // ── Scoring ────────────────────────────────────────────────────────────

  describe("Scoring — base score", () => {
    it("starts at base score 52 with minimal data", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false, signal_strength: "fair" })],
      }));
      // With one wifi record that doesn't meet target (0% reliability < 40%), penalty -5 = 47
      expect(r.it_score).toBe(47);
    });
  });

  describe("Scoring — WiFi reliability bonus", () => {
    it("adds +5 when wifi reliability >= 90%", () => {
      const wifis = Array.from({ length: 10 }, () => makeWifi({ meets_target: true }));
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      // Score includes base 52 + wifi bonus 5
      expect(r.it_score).toBeGreaterThanOrEqual(57);
    });

    it("adds +3 when wifi reliability >= 70% but < 90%", () => {
      const wifis = [
        ...Array.from({ length: 7 }, () => makeWifi({ meets_target: true })),
        ...Array.from({ length: 3 }, () => makeWifi({ meets_target: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.it_score).toBeGreaterThanOrEqual(55);
    });
  });

  describe("Scoring — device availability bonus", () => {
    it("adds +5 when device availability >= 95%", () => {
      const devices = Array.from({ length: 20 }, () => makeDevice({ operational: true }));
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.it_score).toBeGreaterThanOrEqual(57);
    });

    it("adds +3 when device availability >= 80% but < 95%", () => {
      const devices = [
        ...Array.from({ length: 8 }, () => makeDevice({ operational: true })),
        ...Array.from({ length: 2 }, () => makeDevice({ operational: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.it_score).toBeGreaterThanOrEqual(55);
    });
  });

  describe("Scoring — software currency bonus", () => {
    it("adds +4 when software currency >= 90%", () => {
      const sw = Array.from({ length: 10 }, () => makeSoftware({ is_up_to_date: true }));
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.it_score).toBeGreaterThanOrEqual(56);
    });

    it("adds +2 when software currency >= 70% but < 90%", () => {
      const sw = [
        ...Array.from({ length: 7 }, () => makeSoftware({ is_up_to_date: true })),
        ...Array.from({ length: 3 }, () => makeSoftware({ is_up_to_date: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.it_score).toBeGreaterThanOrEqual(54);
    });
  });

  describe("Scoring — digital access bonus", () => {
    it("adds +4 when digital access >= 95%", () => {
      const access = Array.from({ length: 20 }, (_, i) =>
        makeDigitalAccess({ child_id: `c${i}`, has_personal_device: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 20,
        digital_access_records: access,
      }));
      expect(r.it_score).toBeGreaterThanOrEqual(56);
    });

    it("adds +2 when digital access >= 80% but < 95%", () => {
      const access = [
        ...Array.from({ length: 8 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, has_personal_device: true })),
        ...Array.from({ length: 2 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, has_personal_device: false, has_shared_device_access: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 10,
        digital_access_records: access,
      }));
      expect(r.it_score).toBeGreaterThanOrEqual(54);
    });
  });

  describe("Scoring — child satisfaction bonus", () => {
    it("adds +3 when satisfaction >= 80%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 5 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 5 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.it_score).toBeGreaterThanOrEqual(55);
    });

    it("adds +1 when satisfaction >= 60% but < 80%", () => {
      // rating 4 -> (4-1)/4*100 = 75%
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 4 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 3 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.it_score).toBeGreaterThanOrEqual(53);
    });
  });

  describe("Scoring — printer access bonus", () => {
    it("adds +3 when printer access >= 90%", () => {
      const printers = Array.from({ length: 10 }, () =>
        makePrinter({ operational: true, accessible_to_children: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ printer_records: printers }));
      expect(r.it_score).toBeGreaterThanOrEqual(55);
    });

    it("adds +1 when printer access >= 70% but < 90%", () => {
      const printers = [
        ...Array.from({ length: 7 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        ...Array.from({ length: 3 }, () => makePrinter({ operational: true, accessible_to_children: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ printer_records: printers }));
      expect(r.it_score).toBeGreaterThanOrEqual(53);
    });
  });

  describe("Scoring — security patch bonus", () => {
    it("adds +2 when security patch rate >= 95%", () => {
      const sw = Array.from({ length: 20 }, () => makeSoftware({ security_patched: true }));
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.it_score).toBeGreaterThanOrEqual(54);
    });

    it("adds +1 when security patch rate >= 80% but < 95%", () => {
      const sw = [
        ...Array.from({ length: 8 }, () => makeSoftware({ security_patched: true })),
        ...Array.from({ length: 2 }, () => makeSoftware({ security_patched: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.it_score).toBeGreaterThanOrEqual(53);
    });
  });

  describe("Scoring — online safety training bonus", () => {
    it("adds +2 when training rate >= 90%", () => {
      const access = Array.from({ length: 10 }, (_, i) =>
        makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.it_score).toBeGreaterThanOrEqual(54);
    });

    it("adds +1 when training rate >= 70% but < 90%", () => {
      const access = [
        ...Array.from({ length: 7 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true })),
        ...Array.from({ length: 3 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, online_safety_training_completed: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.it_score).toBeGreaterThanOrEqual(53);
    });
  });

  // ── Penalties ──────────────────────────────────────────────────────────

  describe("Scoring — penalties", () => {
    it("applies -5 penalty when wifi reliability < 40%", () => {
      const wifis = [
        makeWifi({ meets_target: false }),
        makeWifi({ meets_target: false }),
        makeWifi({ meets_target: true }),
      ];
      // 33% reliability < 40% → -5 penalty → 52 - 5 = 47
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.it_score).toBe(47);
    });

    it("applies -5 penalty when device availability < 50%", () => {
      const devices = [
        makeDevice({ operational: false }),
        makeDevice({ operational: false }),
        makeDevice({ operational: true }),
      ];
      // 33% availability < 50% → -5 penalty → 52 - 5 = 47
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.it_score).toBe(47);
    });

    it("applies -4 penalty when software currency < 40%", () => {
      const sw = [
        makeSoftware({ is_up_to_date: false, security_patched: false }),
        makeSoftware({ is_up_to_date: false, security_patched: false }),
        makeSoftware({ is_up_to_date: true, security_patched: false }),
      ];
      // 33% currency < 40% → -4 penalty; 0% security patched → no bonus → 52 - 4 = 48
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.it_score).toBe(48);
    });

    it("applies -4 penalty when digital access < 50%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false, online_safety_training_completed: false, child_satisfaction_rating: 1 }),
        makeDigitalAccess({ child_id: "c2", has_personal_device: false, has_shared_device_access: false, online_safety_training_completed: false, child_satisfaction_rating: 1 }),
        makeDigitalAccess({ child_id: "c3", has_personal_device: true, online_safety_training_completed: false, child_satisfaction_rating: 1 }),
      ];
      // 33% access < 50% → -4 penalty; no satisfaction/training bonuses → 52 - 4 = 48
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.it_score).toBe(48);
    });

    it("does not apply wifi penalty when there are 0 wifi records", () => {
      // No records → no penalty even though rate is 0
      const r = computeItEquipmentConnectivity(baseInput({
        device_records: [makeDevice()],
      }));
      expect(r.it_score).toBeGreaterThanOrEqual(52);
    });

    it("does not apply device penalty when there are 0 device records", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi()],
      }));
      expect(r.it_score).toBeGreaterThanOrEqual(52);
    });

    it("clamps score to minimum 0", () => {
      // All bad: wifi <40%, device <50%, software <40%, access <50%
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false })],
        device_records: [makeDevice({ operational: false })],
        software_records: [makeSoftware({ is_up_to_date: false })],
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false }),
        ],
      }));
      expect(r.it_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to maximum 100", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: Array.from({ length: 10 }, () => makeWifi({ meets_target: true })),
        device_records: Array.from({ length: 20 }, () => makeDevice({ operational: true })),
        printer_records: Array.from({ length: 10 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        software_records: Array.from({ length: 20 }, () => makeSoftware({ is_up_to_date: true, security_patched: true })),
        digital_access_records: Array.from({ length: 10 }, (_, i) =>
          makeDigitalAccess({ child_id: `c${i}`, child_satisfaction_rating: 5, online_safety_training_completed: true }),
        ),
      }));
      expect(r.it_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Rating Thresholds ──────────────────────────────────────────────────

  describe("Rating thresholds", () => {
    it("rates outstanding when score >= 80", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: Array.from({ length: 10 }, () => makeWifi({ meets_target: true })),
        device_records: Array.from({ length: 20 }, () => makeDevice({ operational: true })),
        printer_records: Array.from({ length: 10 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        software_records: Array.from({ length: 20 }, () => makeSoftware({ is_up_to_date: true, security_patched: true })),
        digital_access_records: Array.from({ length: 10 }, (_, i) =>
          makeDigitalAccess({ child_id: `c${i}`, child_satisfaction_rating: 5, online_safety_training_completed: true }),
        ),
      }));
      expect(r.it_rating).toBe("outstanding");
      expect(r.it_score).toBeGreaterThanOrEqual(80);
    });

    it("rates good when score >= 65 and < 80", () => {
      // Base 52 + wifi bonus 5 + device bonus 5 + software bonus 4 = 66
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: Array.from({ length: 10 }, () => makeWifi({ meets_target: true })),
        device_records: Array.from({ length: 20 }, () => makeDevice({ operational: true })),
        software_records: Array.from({ length: 10 }, () => makeSoftware({ is_up_to_date: true })),
      }));
      expect(r.it_rating).toBe("good");
      expect(r.it_score).toBeGreaterThanOrEqual(65);
      expect(r.it_score).toBeLessThan(80);
    });

    it("rates adequate when score >= 45 and < 65", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: true })],
      }));
      // 52 + wifi bonus 5 (100% reliability) = 57
      expect(r.it_rating).toBe("adequate");
      expect(r.it_score).toBeGreaterThanOrEqual(45);
      expect(r.it_score).toBeLessThan(65);
    });

    it("rates inadequate when score < 45", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false })],
        device_records: [makeDevice({ operational: false })],
        software_records: [makeSoftware({ is_up_to_date: false })],
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false }),
        ],
      }));
      expect(r.it_rating).toBe("inadequate");
      expect(r.it_score).toBeLessThan(45);
    });
  });

  // ── Headline ────────────────────────────────────────────────────────────

  describe("Headlines", () => {
    it("outstanding headline mentions outstanding", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: Array.from({ length: 10 }, () => makeWifi({ meets_target: true })),
        device_records: Array.from({ length: 20 }, () => makeDevice({ operational: true })),
        printer_records: Array.from({ length: 10 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        software_records: Array.from({ length: 20 }, () => makeSoftware({ is_up_to_date: true, security_patched: true })),
        digital_access_records: Array.from({ length: 10 }, (_, i) =>
          makeDigitalAccess({ child_id: `c${i}`, child_satisfaction_rating: 5, online_safety_training_completed: true }),
        ),
      }));
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline mentions strength count", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: Array.from({ length: 10 }, () => makeWifi({ meets_target: true })),
        device_records: Array.from({ length: 20 }, () => makeDevice({ operational: true })),
        software_records: Array.from({ length: 10 }, () => makeSoftware({ is_up_to_date: true })),
      }));
      expect(r.headline).toContain("Good");
      expect(r.headline).toMatch(/strength/);
    });

    it("adequate headline mentions concern count", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: true })],
      }));
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline mentions urgent action", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false })],
        device_records: [makeDevice({ operational: false })],
        software_records: [makeSoftware({ is_up_to_date: false })],
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("adds wifi strength when reliability >= 90%", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: Array.from({ length: 10 }, () => makeWifi({ meets_target: true })),
      }));
      expect(r.strengths.some((s) => s.includes("100% WiFi reliability"))).toBe(true);
    });

    it("adds wifi strength when reliability >= 70% but < 90%", () => {
      const wifis = [
        ...Array.from({ length: 7 }, () => makeWifi({ meets_target: true })),
        ...Array.from({ length: 3 }, () => makeWifi({ meets_target: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.strengths.some((s) => s.includes("WiFi reliability rate"))).toBe(true);
    });

    it("does not add wifi strength when reliability < 70%", () => {
      const wifis = [
        ...Array.from({ length: 6 }, () => makeWifi({ meets_target: true })),
        ...Array.from({ length: 4 }, () => makeWifi({ meets_target: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.strengths.some((s) => s.includes("WiFi reliability"))).toBe(false);
    });

    it("adds device strength when availability >= 95%", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        device_records: Array.from({ length: 20 }, () => makeDevice({ operational: true })),
      }));
      expect(r.strengths.some((s) => s.includes("device availability"))).toBe(true);
    });

    it("adds device strength when availability >= 80% but < 95%", () => {
      const devices = [
        ...Array.from({ length: 8 }, () => makeDevice({ operational: true })),
        ...Array.from({ length: 2 }, () => makeDevice({ operational: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.strengths.some((s) => s.includes("device availability rate"))).toBe(true);
    });

    it("adds printer strength when access >= 90%", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        printer_records: Array.from({ length: 10 }, () =>
          makePrinter({ operational: true, accessible_to_children: true }),
        ),
      }));
      expect(r.strengths.some((s) => s.includes("printer access"))).toBe(true);
    });

    it("adds printer strength when access >= 70% but < 90%", () => {
      const printers = [
        ...Array.from({ length: 7 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        ...Array.from({ length: 3 }, () => makePrinter({ operational: true, accessible_to_children: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ printer_records: printers }));
      expect(r.strengths.some((s) => s.includes("printer access"))).toBe(true);
    });

    it("adds software currency strength when rate >= 90%", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        software_records: Array.from({ length: 10 }, () => makeSoftware({ is_up_to_date: true })),
      }));
      expect(r.strengths.some((s) => s.includes("software currency"))).toBe(true);
    });

    it("adds software currency strength when rate >= 70% but < 90%", () => {
      const sw = [
        ...Array.from({ length: 7 }, () => makeSoftware({ is_up_to_date: true })),
        ...Array.from({ length: 3 }, () => makeSoftware({ is_up_to_date: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.strengths.some((s) => s.includes("software currency rate"))).toBe(true);
    });

    it("adds digital access equity strength when rate >= 95%", () => {
      const access = Array.from({ length: 20 }, (_, i) =>
        makeDigitalAccess({ child_id: `c${i}`, has_personal_device: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.strengths.some((s) => s.includes("digital access equity"))).toBe(true);
    });

    it("adds digital access strength when rate >= 80% but < 95%", () => {
      const access = [
        ...Array.from({ length: 8 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, has_personal_device: true })),
        ...Array.from({ length: 2 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, has_personal_device: false, has_shared_device_access: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.strengths.some((s) => s.includes("digital access rate"))).toBe(true);
    });

    it("adds child satisfaction strength when rate >= 80%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 5 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 5 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.strengths.some((s) => s.includes("child satisfaction"))).toBe(true);
    });

    it("adds child satisfaction strength when rate >= 60% but < 80%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 4 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 4 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.strengths.some((s) => s.includes("child satisfaction rate"))).toBe(true);
    });

    it("adds security patch strength when rate >= 95%", () => {
      const sw = Array.from({ length: 20 }, () => makeSoftware({ security_patched: true }));
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.strengths.some((s) => s.includes("security-patched"))).toBe(true);
    });

    it("adds security patch strength when rate >= 80% but < 95%", () => {
      const sw = [
        ...Array.from({ length: 8 }, () => makeSoftware({ security_patched: true })),
        ...Array.from({ length: 2 }, () => makeSoftware({ security_patched: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.strengths.some((s) => s.includes("security patch rate"))).toBe(true);
    });

    it("adds online safety training strength when rate >= 90%", () => {
      const access = Array.from({ length: 10 }, (_, i) =>
        makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.strengths.some((s) => s.includes("online safety training"))).toBe(true);
    });

    it("adds online safety training strength when rate >= 70% but < 90%", () => {
      const access = [
        ...Array.from({ length: 7 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true })),
        ...Array.from({ length: 3 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, online_safety_training_completed: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.strengths.some((s) => s.includes("online safety training completion"))).toBe(true);
    });

    it("adds content filter strength when rate >= 95%", () => {
      const wifis = Array.from({ length: 20 }, () => makeWifi({ content_filter_active: true }));
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.strengths.some((s) => s.includes("Content filtering"))).toBe(true);
    });

    it("adds parental controls strength when rate >= 95%", () => {
      const wifis = Array.from({ length: 20 }, () => makeWifi({ parental_controls_enabled: true }));
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.strengths.some((s) => s.includes("Parental controls"))).toBe(true);
    });

    it("adds educational needs strength when rate >= 90%", () => {
      const devices = Array.from({ length: 10 }, () =>
        makeDevice({ operational: true, meets_educational_needs: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.strengths.some((s) => s.includes("devices meet educational needs"))).toBe(true);
    });

    it("adds homework access strength when rate >= 90%", () => {
      const access = Array.from({ length: 10 }, (_, i) =>
        makeDigitalAccess({ child_id: `c${i}`, homework_access_adequate: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.strengths.some((s) => s.includes("homework access"))).toBe(true);
    });

    it("adds device child coverage strength when coverage >= 100%", () => {
      const devices = [
        makeDevice({ child_id: "c1" }),
        makeDevice({ child_id: "c2" }),
        makeDevice({ child_id: "c3" }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 3,
        device_records: devices,
      }));
      expect(r.strengths.some((s) => s.includes("Every child has access to a dedicated computing device"))).toBe(true);
    });

    it("adds device child coverage strength when coverage >= 80% but < 100%", () => {
      const devices = [
        makeDevice({ child_id: "c1" }),
        makeDevice({ child_id: "c2" }),
        makeDevice({ child_id: "c3" }),
        makeDevice({ child_id: "c4" }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 5,
        device_records: devices,
      }));
      expect(r.strengths.some((s) => s.includes("assigned device"))).toBe(true);
    });

    it("adds assistive tech strength when all needs met", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", assistive_technology_needed: true, assistive_technology_provided: true }),
        makeDigitalAccess({ child_id: "c2", assistive_technology_needed: true, assistive_technology_provided: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.strengths.some((s) => s.includes("assistive technology"))).toBe(true);
    });

    it("adds barriers addressed strength when rate >= 90%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", barriers_identified: ["cost"], barriers_addressed: true }),
        makeDigitalAccess({ child_id: "c2", barriers_identified: ["access"], barriers_addressed: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.strengths.some((s) => s.includes("barriers"))).toBe(true);
    });

    it("adds device condition strength when rate >= 90%", () => {
      const devices = Array.from({ length: 10 }, () =>
        makeDevice({ condition: "excellent" }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.strengths.some((s) => s.includes("good or excellent condition"))).toBe(true);
    });

    it("adds licence validity strength when rate >= 95%", () => {
      const sw = Array.from({ length: 20 }, () => makeSoftware({ licence_valid: true }));
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.strengths.some((s) => s.includes("software licences valid"))).toBe(true);
    });

    it("adds signal quality strength when rate >= 90%", () => {
      const wifis = Array.from({ length: 10 }, () =>
        makeWifi({ signal_strength: "excellent" }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.strengths.some((s) => s.includes("signal quality"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("flags wifi reliability < 40% as concern", () => {
      const wifis = [
        makeWifi({ meets_target: false }),
        makeWifi({ meets_target: false }),
        makeWifi({ meets_target: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.concerns.some((c) => c.includes("WiFi reliability"))).toBe(true);
    });

    it("flags wifi reliability 40-69% as concern", () => {
      const wifis = [
        ...Array.from({ length: 5 }, () => makeWifi({ meets_target: true })),
        ...Array.from({ length: 5 }, () => makeWifi({ meets_target: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.concerns.some((c) => c.includes("WiFi reliability at 50%"))).toBe(true);
    });

    it("flags device availability < 50% as concern", () => {
      const devices = [
        makeDevice({ operational: false }),
        makeDevice({ operational: false }),
        makeDevice({ operational: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.concerns.some((c) => c.includes("device availability"))).toBe(true);
    });

    it("flags device availability 50-79% as concern", () => {
      const devices = [
        ...Array.from({ length: 6 }, () => makeDevice({ operational: true })),
        ...Array.from({ length: 4 }, () => makeDevice({ operational: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.concerns.some((c) => c.includes("Device availability at 60%"))).toBe(true);
    });

    it("flags software currency < 40% as concern", () => {
      const sw = [
        makeSoftware({ is_up_to_date: false }),
        makeSoftware({ is_up_to_date: false }),
        makeSoftware({ is_up_to_date: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.concerns.some((c) => c.includes("software currency"))).toBe(true);
    });

    it("flags software currency 40-69% as concern", () => {
      const sw = [
        ...Array.from({ length: 5 }, () => makeSoftware({ is_up_to_date: true })),
        ...Array.from({ length: 5 }, () => makeSoftware({ is_up_to_date: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.concerns.some((c) => c.includes("Software currency at 50%"))).toBe(true);
    });

    it("flags digital access < 50% as concern", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false }),
        makeDigitalAccess({ child_id: "c2", has_personal_device: false, has_shared_device_access: false }),
        makeDigitalAccess({ child_id: "c3", has_personal_device: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("digital access equity"))).toBe(true);
    });

    it("flags digital access 50-79% as concern", () => {
      const access = [
        ...Array.from({ length: 6 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, has_personal_device: true })),
        ...Array.from({ length: 4 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, has_personal_device: false, has_shared_device_access: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("Digital access at 60%"))).toBe(true);
    });

    it("flags printer access < 50% as concern", () => {
      const printers = [
        makePrinter({ operational: true, accessible_to_children: false }),
        makePrinter({ operational: true, accessible_to_children: false }),
        makePrinter({ operational: true, accessible_to_children: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ printer_records: printers }));
      expect(r.concerns.some((c) => c.includes("printer access"))).toBe(true);
    });

    it("flags printer access 50-69% as concern", () => {
      const printers = [
        ...Array.from({ length: 6 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        ...Array.from({ length: 4 }, () => makePrinter({ operational: true, accessible_to_children: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ printer_records: printers }));
      expect(r.concerns.some((c) => c.includes("Printer access at 60%"))).toBe(true);
    });

    it("flags child satisfaction < 40% as concern", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 1 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 2 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("Child satisfaction"))).toBe(true);
    });

    it("flags child satisfaction 40-59% as concern", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 3 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 3 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("Child satisfaction at 50%"))).toBe(true);
    });

    it("flags security patch < 50% as concern", () => {
      const sw = [
        makeSoftware({ security_patched: false }),
        makeSoftware({ security_patched: false }),
        makeSoftware({ security_patched: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.concerns.some((c) => c.includes("security-patched") || c.includes("Security patch rate"))).toBe(true);
    });

    it("flags security patch 50-79% as concern", () => {
      const sw = [
        ...Array.from({ length: 6 }, () => makeSoftware({ security_patched: true })),
        ...Array.from({ length: 4 }, () => makeSoftware({ security_patched: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.concerns.some((c) => c.includes("Security patch rate at 60%"))).toBe(true);
    });

    it("flags content filter < 80% as concern", () => {
      const wifis = [
        ...Array.from({ length: 7 }, () => makeWifi({ content_filter_active: true })),
        ...Array.from({ length: 3 }, () => makeWifi({ content_filter_active: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.concerns.some((c) => c.includes("Content filtering"))).toBe(true);
    });

    it("flags parental controls < 80% as concern", () => {
      const wifis = [
        ...Array.from({ length: 7 }, () => makeWifi({ parental_controls_enabled: true })),
        ...Array.from({ length: 3 }, () => makeWifi({ parental_controls_enabled: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.concerns.some((c) => c.includes("Parental controls"))).toBe(true);
    });

    it("flags online safety training < 50% as concern", () => {
      const access = [
        ...Array.from({ length: 4 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true })),
        ...Array.from({ length: 6 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, online_safety_training_completed: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("online safety training"))).toBe(true);
    });

    it("flags online safety training 50-69% as concern", () => {
      const access = [
        ...Array.from({ length: 6 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true })),
        ...Array.from({ length: 4 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, online_safety_training_completed: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("Online safety training at 60%"))).toBe(true);
    });

    it("flags aging devices >= 40% as concern", () => {
      const devices = [
        ...Array.from({ length: 4 }, () => makeDevice({ age_years: 6 })),
        ...Array.from({ length: 6 }, () => makeDevice({ age_years: 2 })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.concerns.some((c) => c.includes("5+ years old"))).toBe(true);
    });

    it("flags maintenance due >= 30% as concern", () => {
      const devices = [
        ...Array.from({ length: 3 }, () => makeDevice({ maintenance_due: true })),
        ...Array.from({ length: 7 }, () => makeDevice({ maintenance_due: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.concerns.some((c) => c.includes("maintenance overdue"))).toBe(true);
    });

    it("flags homework access < 60% as concern", () => {
      const access = [
        ...Array.from({ length: 5 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, homework_access_adequate: true })),
        ...Array.from({ length: 5 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, homework_access_adequate: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("homework access"))).toBe(true);
    });

    it("flags assistive tech < 80% as concern", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", assistive_technology_needed: true, assistive_technology_provided: false }),
        makeDigitalAccess({ child_id: "c2", assistive_technology_needed: true, assistive_technology_provided: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("assistive technology"))).toBe(true);
    });

    it("flags barriers addressed < 50% as concern", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", barriers_identified: ["cost"], barriers_addressed: false }),
        makeDigitalAccess({ child_id: "c2", barriers_identified: ["access"], barriers_addressed: false }),
        makeDigitalAccess({ child_id: "c3", barriers_identified: ["skills"], barriers_addressed: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("barriers"))).toBe(true);
    });

    it("flags licence validity < 70% as concern", () => {
      const sw = [
        ...Array.from({ length: 6 }, () => makeSoftware({ licence_valid: true })),
        ...Array.from({ length: 4 }, () => makeSoftware({ licence_valid: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.concerns.some((c) => c.includes("software licences"))).toBe(true);
    });

    it("flags average outage >= 30 minutes as concern", () => {
      const wifis = [
        makeWifi({ outage_minutes: 60, meets_target: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.concerns.some((c) => c.includes("WiFi outage"))).toBe(true);
    });

    it("flags low access child coverage < 60% as concern", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1" }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 5,
        digital_access_records: access,
      }));
      expect(r.concerns.some((c) => c.includes("digital access records"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("recommends wifi fix when reliability < 40%", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("WiFi infrastructure") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends device repair when availability < 50%", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        device_records: [makeDevice({ operational: false })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("repair or replace") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends digital access when rate < 50%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("digital divide") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends software update when currency < 40%", () => {
      const sw = [makeSoftware({ is_up_to_date: false })];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("software update programme") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends security patches when rate < 50%", () => {
      const sw = [makeSoftware({ security_patched: false })];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("security patches") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends content filtering when rate < 80%", () => {
      const wifis = [
        ...Array.from({ length: 7 }, () => makeWifi({ content_filter_active: true })),
        ...Array.from({ length: 3 }, () => makeWifi({ content_filter_active: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("content filtering"))).toBe(true);
    });

    it("recommends online safety training when rate < 50%", () => {
      const access = [
        ...Array.from({ length: 4 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true })),
        ...Array.from({ length: 6 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, online_safety_training_completed: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("online safety training"))).toBe(true);
    });

    it("recommends assistive tech when rate < 80%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", assistive_technology_needed: true, assistive_technology_provided: false }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("assistive technology"))).toBe(true);
    });

    it("recommends printer access improvement when rate < 50%", () => {
      const printers = [
        makePrinter({ operational: true, accessible_to_children: false }),
        makePrinter({ operational: true, accessible_to_children: false }),
        makePrinter({ operational: true, accessible_to_children: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ printer_records: printers }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("printing facilities") && rec.urgency === "soon")).toBe(true);
    });

    it("recommends child consultation when satisfaction < 40%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 1 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 2 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Consult with children"))).toBe(true);
    });

    it("recommends wifi improvement plan when reliability 40-69%", () => {
      const wifis = [
        ...Array.from({ length: 5 }, () => makeWifi({ meets_target: true })),
        ...Array.from({ length: 5 }, () => makeWifi({ meets_target: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("WiFi improvement plan") && rec.urgency === "soon")).toBe(true);
    });

    it("recommends device maintenance when availability 50-79%", () => {
      const devices = [
        ...Array.from({ length: 6 }, () => makeDevice({ operational: true })),
        ...Array.from({ length: 4 }, () => makeDevice({ operational: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("maintenance and repair") && rec.urgency === "soon")).toBe(true);
    });

    it("recommends device replacement when aging >= 40%", () => {
      const devices = [
        ...Array.from({ length: 4 }, () => makeDevice({ age_years: 6 })),
        ...Array.from({ length: 6 }, () => makeDevice({ age_years: 2 })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("device replacement"))).toBe(true);
    });

    it("recommends software update schedule when currency 40-69%", () => {
      const sw = [
        ...Array.from({ length: 5 }, () => makeSoftware({ is_up_to_date: true })),
        ...Array.from({ length: 5 }, () => makeSoftware({ is_up_to_date: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("software update schedule") && rec.urgency === "planned")).toBe(true);
    });

    it("recommends digital access extension when rate 50-79%", () => {
      const access = [
        ...Array.from({ length: 6 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, has_personal_device: true })),
        ...Array.from({ length: 4 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, has_personal_device: false, has_shared_device_access: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Extend digital access") && rec.urgency === "planned")).toBe(true);
    });

    it("recommends printer access improvement when rate 50-69%", () => {
      const printers = [
        ...Array.from({ length: 6 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        ...Array.from({ length: 4 }, () => makePrinter({ operational: true, accessible_to_children: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ printer_records: printers }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve printer access") && rec.urgency === "planned")).toBe(true);
    });

    it("recommends safety training extension when rate 50-69%", () => {
      const access = [
        ...Array.from({ length: 6 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true })),
        ...Array.from({ length: 4 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, online_safety_training_completed: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Extend online safety training") && rec.urgency === "planned")).toBe(true);
    });

    it("recommends barriers resolution when addressed 50-79%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", barriers_identified: ["cost"], barriers_addressed: true }),
        makeDigitalAccess({ child_id: "c2", barriers_identified: ["access"], barriers_addressed: false }),
        makeDigitalAccess({ child_id: "c3", barriers_identified: ["skills"], barriers_addressed: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Address remaining identified barriers"))).toBe(true);
    });

    it("recommends digital skills assessment when rate < 70%", () => {
      const access = [
        ...Array.from({ length: 6 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, digital_skills_assessed: true })),
        ...Array.from({ length: 4 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, digital_skills_assessed: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Assess digital skills"))).toBe(true);
    });

    it("recommends satisfaction improvement when rate 40-59%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 3 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 3 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Explore ways to improve"))).toBe(true);
    });

    it("recommends complete digital access assessments when coverage < 80%", () => {
      const access = [makeDigitalAccess({ child_id: "c1" })];
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 5,
        digital_access_records: access,
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Complete digital access assessments"))).toBe(true);
    });

    it("recommendations have sequential rank numbers", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false })],
        device_records: [makeDevice({ operational: false })],
        software_records: [makeSoftware({ is_up_to_date: false, security_patched: false })],
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false }),
        ],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("recommendations have valid urgency values", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false })],
        device_records: [makeDevice({ operational: false })],
      }));
      for (const rec of r.recommendations) {
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("recommendations have regulatory_ref", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false })],
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("Insights — critical", () => {
    it("creates critical insight for wifi reliability < 40%", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false })],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("WiFi reliability"))).toBe(true);
    });

    it("creates critical insight for device availability < 50%", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        device_records: [makeDevice({ operational: false })],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("device availability"))).toBe(true);
    });

    it("creates critical insight for software currency < 40%", () => {
      const sw = [makeSoftware({ is_up_to_date: false })];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("software currency"))).toBe(true);
    });

    it("creates critical insight for digital access < 50%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("digital access equity"))).toBe(true);
    });

    it("creates critical insight for security patch < 50%", () => {
      const sw = [makeSoftware({ security_patched: false })];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("security-patched"))).toBe(true);
    });

    it("creates critical insight when no device records but children on placement", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 3,
        wifi_records: [makeWifi()],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No device records"))).toBe(true);
    });

    it("creates critical insight when no digital access records but children on placement", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 3,
        wifi_records: [makeWifi()],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No digital access records"))).toBe(true);
    });
  });

  describe("Insights — warning", () => {
    it("creates warning for wifi reliability 40-69%", () => {
      const wifis = [
        ...Array.from({ length: 5 }, () => makeWifi({ meets_target: true })),
        ...Array.from({ length: 5 }, () => makeWifi({ meets_target: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("WiFi reliability at 50%"))).toBe(true);
    });

    it("creates warning for device availability 50-79%", () => {
      const devices = [
        ...Array.from({ length: 6 }, () => makeDevice({ operational: true })),
        ...Array.from({ length: 4 }, () => makeDevice({ operational: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Device availability at 60%"))).toBe(true);
    });

    it("creates warning for software currency 40-69%", () => {
      const sw = [
        ...Array.from({ length: 5 }, () => makeSoftware({ is_up_to_date: true })),
        ...Array.from({ length: 5 }, () => makeSoftware({ is_up_to_date: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Software currency at 50%"))).toBe(true);
    });

    it("creates warning for digital access 50-79%", () => {
      const access = [
        ...Array.from({ length: 6 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, has_personal_device: true })),
        ...Array.from({ length: 4 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, has_personal_device: false, has_shared_device_access: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Digital access at 60%"))).toBe(true);
    });

    it("creates warning for child satisfaction 40-59%", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 3 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 3 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child satisfaction with IT at 50%"))).toBe(true);
    });

    it("creates warning for printer access 50-69%", () => {
      const printers = [
        ...Array.from({ length: 6 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        ...Array.from({ length: 4 }, () => makePrinter({ operational: true, accessible_to_children: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ printer_records: printers }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Printer access at 60%"))).toBe(true);
    });

    it("creates warning for online safety training 50-69%", () => {
      const access = [
        ...Array.from({ length: 6 }, (_, i) => makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true })),
        ...Array.from({ length: 4 }, (_, i) => makeDigitalAccess({ child_id: `d${i}`, online_safety_training_completed: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Online safety training at 60%"))).toBe(true);
    });

    it("creates warning for maintenance due 20-29%", () => {
      const devices = [
        ...Array.from({ length: 2 }, () => makeDevice({ maintenance_due: true })),
        ...Array.from({ length: 8 }, () => makeDevice({ maintenance_due: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("maintenance overdue"))).toBe(true);
    });

    it("creates warning for licence validity 70-89%", () => {
      const sw = [
        ...Array.from({ length: 8 }, () => makeSoftware({ licence_valid: true })),
        ...Array.from({ length: 2 }, () => makeSoftware({ licence_valid: false })),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Software licence validity at 80%"))).toBe(true);
    });

    it("creates warning for missing software categories when >= 3 missing", () => {
      // Only productivity and security present — missing education, accessibility, communication, creative (4 missing)
      const sw = [
        makeSoftware({ category: "productivity" }),
        makeSoftware({ category: "security" }),
        makeSoftware({ category: "operating_system" }),
        makeSoftware({ category: "other" }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Software provision concentrated"))).toBe(true);
    });
  });

  describe("Insights — positive", () => {
    it("creates positive insight for outstanding rating", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: Array.from({ length: 10 }, () => makeWifi({ meets_target: true })),
        device_records: Array.from({ length: 20 }, () => makeDevice({ operational: true })),
        printer_records: Array.from({ length: 10 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        software_records: Array.from({ length: 20 }, () => makeSoftware({ is_up_to_date: true, security_patched: true })),
        digital_access_records: Array.from({ length: 10 }, (_, i) =>
          makeDigitalAccess({ child_id: `c${i}`, child_satisfaction_rating: 5, online_safety_training_completed: true }),
        ),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("creates positive insight for high wifi + signal quality", () => {
      const wifis = Array.from({ length: 10 }, () =>
        makeWifi({ meets_target: true, signal_strength: "excellent" }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ wifi_records: wifis }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("WiFi reliability") && i.text.includes("signal quality"))).toBe(true);
    });

    it("creates positive insight for high device availability + condition", () => {
      const devices = Array.from({ length: 20 }, () =>
        makeDevice({ operational: true, condition: "excellent" }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ device_records: devices }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("device availability") && i.text.includes("condition"))).toBe(true);
    });

    it("creates positive insight for high software currency + security", () => {
      const sw = Array.from({ length: 20 }, () =>
        makeSoftware({ is_up_to_date: true, security_patched: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ software_records: sw }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("software currency") && i.text.includes("security-patched"))).toBe(true);
    });

    it("creates positive insight for high digital access + homework", () => {
      const access = Array.from({ length: 20 }, (_, i) =>
        makeDigitalAccess({ child_id: `c${i}`, has_personal_device: true, homework_access_adequate: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("digital access equity") && i.text.includes("homework access"))).toBe(true);
    });

    it("creates positive insight for high child satisfaction", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", child_satisfaction_rating: 5 }),
        makeDigitalAccess({ child_id: "c2", child_satisfaction_rating: 5 }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child satisfaction"))).toBe(true);
    });

    it("creates positive insight for comprehensive digital safeguarding", () => {
      const wifis = Array.from({ length: 20 }, () =>
        makeWifi({ content_filter_active: true, parental_controls_enabled: true }),
      );
      const access = Array.from({ length: 10 }, (_, i) =>
        makeDigitalAccess({ child_id: `c${i}`, online_safety_training_completed: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: wifis,
        digital_access_records: access,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Comprehensive digital safeguarding"))).toBe(true);
    });

    it("creates positive insight for full assistive tech provision", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", assistive_technology_needed: true, assistive_technology_provided: true }),
        makeDigitalAccess({ child_id: "c2", assistive_technology_needed: true, assistive_technology_provided: true }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("assistive technology"))).toBe(true);
    });

    it("creates positive insight for barriers addressed >= 90%", () => {
      const access = Array.from({ length: 10 }, (_, i) =>
        makeDigitalAccess({ child_id: `c${i}`, barriers_identified: ["cost"], barriers_addressed: true }),
      );
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("barriers addressed"))).toBe(true);
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────

  describe("Edge cases", () => {
    it("handles single wifi record meeting target", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: true })],
      }));
      expect(r.wifi_reliability_rate).toBe(100);
    });

    it("handles single device record that is non-operational", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        device_records: [makeDevice({ operational: false })],
      }));
      expect(r.device_availability_rate).toBe(0);
    });

    it("handles large number of records", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: Array.from({ length: 100 }, () => makeWifi({ meets_target: true })),
        device_records: Array.from({ length: 100 }, () => makeDevice({ operational: true })),
        printer_records: Array.from({ length: 50 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        software_records: Array.from({ length: 50 }, () => makeSoftware({ is_up_to_date: true, security_patched: true })),
        digital_access_records: Array.from({ length: 50 }, (_, i) =>
          makeDigitalAccess({ child_id: `c${i}`, child_satisfaction_rating: 5, online_safety_training_completed: true }),
        ),
      }));
      expect(r.it_rating).toBe("outstanding");
    });

    it("handles digital access with no personal or shared device", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        digital_access_records: [
          makeDigitalAccess({ child_id: "c1", has_personal_device: false, has_shared_device_access: false }),
        ],
      }));
      expect(r.digital_access_rate).toBe(0);
    });

    it("handles printers with low ink and no paper", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        printer_records: [
          makePrinter({ operational: true, ink_toner_level: "empty", paper_stocked: false }),
        ],
      }));
      expect(r.total_printer_records).toBe(1);
    });

    it("handles software with expired licence", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        software_records: [makeSoftware({ licence_valid: false, licence_expiry_date: "2025-01-01" })],
      }));
      expect(r.total_software_records).toBe(1);
    });

    it("handles mixed record types — only wifi present", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 3,
        wifi_records: [makeWifi()],
      }));
      expect(r.total_wifi_records).toBe(1);
      expect(r.total_device_records).toBe(0);
      expect(r.total_printer_records).toBe(0);
    });

    it("does not trigger allEmpty special case when at least one record type present", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 3,
        wifi_records: [makeWifi()],
      }));
      expect(r.it_rating).not.toBe("insufficient_data");
      expect(r.it_score).not.toBe(15);
    });

    it("handles children with no barriers", () => {
      const access = [
        makeDigitalAccess({ child_id: "c1", barriers_identified: [], barriers_addressed: false }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({ digital_access_records: access }));
      expect(r.concerns.some((c) => c.includes("barriers"))).toBe(false);
    });

    it("handles device with null child_id for device coverage calculation", () => {
      const devices = [
        makeDevice({ child_id: null }),
        makeDevice({ child_id: null }),
      ];
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 3,
        device_records: devices,
      }));
      expect(r.strengths.some((s) => s.includes("Every child has access"))).toBe(false);
    });

    it("handles total_children = 0 with records present (not allEmpty)", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        total_children: 0,
        wifi_records: [makeWifi()],
      }));
      // Not allEmpty, total_children=0, so does not trigger either special case
      expect(r.it_rating).not.toBe("insufficient_data");
    });
  });

  // ── Full Scenario: Outstanding Home ─────────────────────────────────────

  describe("Full scenario — outstanding home", () => {
    function outstandingInput(): ItEquipmentConnectivityInput {
      return baseInput({
        total_children: 5,
        wifi_records: Array.from({ length: 10 }, (_, i) =>
          makeWifi({
            meets_target: true,
            signal_strength: i % 2 === 0 ? "excellent" : "good",
            password_secured: true,
            content_filter_active: true,
            parental_controls_enabled: true,
            child_accessible: true,
            outage_minutes: 0,
          }),
        ),
        device_records: [
          ...Array.from({ length: 5 }, (_, i) =>
            makeDevice({
              child_id: `c${i + 1}`,
              operational: true,
              condition: "excellent",
              has_antivirus: true,
              has_content_filter: true,
              meets_educational_needs: true,
              accessible_features_enabled: true,
              age_years: 1,
              maintenance_due: false,
            }),
          ),
          ...Array.from({ length: 5 }, () =>
            makeDevice({
              operational: true,
              condition: "good",
              has_antivirus: true,
              has_content_filter: true,
              meets_educational_needs: true,
              accessible_features_enabled: true,
              age_years: 2,
              maintenance_due: false,
            }),
          ),
        ],
        printer_records: Array.from({ length: 3 }, () =>
          makePrinter({
            operational: true,
            accessible_to_children: true,
            ink_toner_level: "full",
            paper_stocked: true,
            usage_allowed_for_homework: true,
            wifi_enabled: true,
            service_due: false,
          }),
        ),
        software_records: Array.from({ length: 10 }, (_, i) =>
          makeSoftware({
            is_up_to_date: true,
            licence_valid: true,
            security_patched: true,
            auto_update_enabled: true,
            child_appropriate: true,
            accessibility_compliant: true,
            category: ["education", "productivity", "security", "accessibility", "communication", "creative"][i % 6] as "education" | "productivity" | "security" | "accessibility" | "communication" | "creative",
          }),
        ),
        digital_access_records: Array.from({ length: 5 }, (_, i) =>
          makeDigitalAccess({
            child_id: `c${i + 1}`,
            has_personal_device: true,
            has_shared_device_access: true,
            internet_access_available: true,
            supervised_access: true,
            educational_software_available: true,
            homework_access_adequate: true,
            digital_skills_assessed: true,
            digital_skills_level: "competent",
            online_safety_training_completed: true,
            child_satisfaction_rating: 5,
            barriers_identified: [],
            barriers_addressed: false,
          }),
        ),
      });
    }

    it("rates outstanding", () => {
      const r = computeItEquipmentConnectivity(outstandingInput());
      expect(r.it_rating).toBe("outstanding");
    });

    it("scores >= 80", () => {
      const r = computeItEquipmentConnectivity(outstandingInput());
      expect(r.it_score).toBeGreaterThanOrEqual(80);
    });

    it("has multiple strengths", () => {
      const r = computeItEquipmentConnectivity(outstandingInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(5);
    });

    it("has no concerns", () => {
      const r = computeItEquipmentConnectivity(outstandingInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("has no recommendations", () => {
      const r = computeItEquipmentConnectivity(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("has positive insights", () => {
      const r = computeItEquipmentConnectivity(outstandingInput());
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    });

    it("has no critical insights", () => {
      const r = computeItEquipmentConnectivity(outstandingInput());
      expect(r.insights.some((i) => i.severity === "critical")).toBe(false);
    });
  });

  // ── Full Scenario: Inadequate Home ──────────────────────────────────────

  describe("Full scenario — inadequate home", () => {
    function inadequateInput(): ItEquipmentConnectivityInput {
      return baseInput({
        total_children: 5,
        wifi_records: [
          makeWifi({ meets_target: false, signal_strength: "poor", content_filter_active: false, parental_controls_enabled: false, outage_minutes: 60, outage_reported: false }),
          makeWifi({ meets_target: false, signal_strength: "none", content_filter_active: false, parental_controls_enabled: false, outage_minutes: 90, outage_reported: false }),
          makeWifi({ meets_target: true, signal_strength: "fair", content_filter_active: true, parental_controls_enabled: true, outage_minutes: 0, outage_reported: false }),
        ],
        device_records: [
          makeDevice({ operational: false, condition: "broken", age_years: 7, maintenance_due: true, has_antivirus: false, has_content_filter: false }),
          makeDevice({ operational: false, condition: "poor", age_years: 6, maintenance_due: true, has_antivirus: false, has_content_filter: false }),
          makeDevice({ operational: true, condition: "fair", age_years: 3, maintenance_due: false, meets_educational_needs: false }),
        ],
        printer_records: [
          makePrinter({ operational: false, accessible_to_children: false, ink_toner_level: "empty", paper_stocked: false }),
          makePrinter({ operational: true, accessible_to_children: false }),
        ],
        software_records: [
          makeSoftware({ is_up_to_date: false, licence_valid: false, security_patched: false }),
          makeSoftware({ is_up_to_date: false, licence_valid: false, security_patched: false }),
          makeSoftware({ is_up_to_date: true, licence_valid: true, security_patched: true }),
        ],
        digital_access_records: [
          makeDigitalAccess({
            child_id: "c1",
            has_personal_device: false,
            has_shared_device_access: false,
            homework_access_adequate: false,
            online_safety_training_completed: false,
            child_satisfaction_rating: 1,
            digital_skills_assessed: false,
            assistive_technology_needed: true,
            assistive_technology_provided: false,
            barriers_identified: ["cost", "skills"],
            barriers_addressed: false,
          }),
          makeDigitalAccess({
            child_id: "c2",
            has_personal_device: false,
            has_shared_device_access: false,
            homework_access_adequate: false,
            online_safety_training_completed: false,
            child_satisfaction_rating: 2,
            digital_skills_assessed: false,
          }),
        ],
      });
    }

    it("rates inadequate", () => {
      const r = computeItEquipmentConnectivity(inadequateInput());
      expect(r.it_rating).toBe("inadequate");
    });

    it("scores < 45", () => {
      const r = computeItEquipmentConnectivity(inadequateInput());
      expect(r.it_score).toBeLessThan(45);
    });

    it("has multiple concerns", () => {
      const r = computeItEquipmentConnectivity(inadequateInput());
      expect(r.concerns.length).toBeGreaterThanOrEqual(5);
    });

    it("has multiple recommendations", () => {
      const r = computeItEquipmentConnectivity(inadequateInput());
      expect(r.recommendations.length).toBeGreaterThanOrEqual(5);
    });

    it("has critical insights", () => {
      const r = computeItEquipmentConnectivity(inadequateInput());
      expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    });

    it("has immediate urgency recommendations", () => {
      const r = computeItEquipmentConnectivity(inadequateInput());
      expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
    });

    it("headline mentions inadequate", () => {
      const r = computeItEquipmentConnectivity(inadequateInput());
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Insight Severity Structure ────────────────────────────────────────

  describe("Insight structure", () => {
    it("every insight has text and severity", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: [makeWifi({ meets_target: false })],
        device_records: [makeDevice({ operational: false })],
      }));
      for (const insight of r.insights) {
        expect(insight.text.length).toBeGreaterThan(0);
        expect(["critical", "warning", "positive"]).toContain(insight.severity);
      }
    });
  });

  // ── No False Positives ────────────────────────────────────────────────

  describe("No false positives", () => {
    it("does not add wifi strength when no wifi records exist", () => {
      const r = computeItEquipmentConnectivity(baseInput());
      expect(r.strengths.some((s) => s.includes("WiFi"))).toBe(false);
    });

    it("does not add device strength when no device records exist", () => {
      const r = computeItEquipmentConnectivity(baseInput());
      expect(r.strengths.some((s) => s.includes("device availability"))).toBe(false);
    });

    it("does not add printer strength when no printer records exist", () => {
      const r = computeItEquipmentConnectivity(baseInput());
      expect(r.strengths.some((s) => s.includes("printer"))).toBe(false);
    });

    it("does not add software strength when no software records exist", () => {
      const r = computeItEquipmentConnectivity(baseInput());
      expect(r.strengths.some((s) => s.includes("software"))).toBe(false);
    });

    it("does not add child satisfaction strength when no digital access records", () => {
      const r = computeItEquipmentConnectivity(baseInput());
      expect(r.strengths.some((s) => s.includes("satisfaction"))).toBe(false);
    });

    it("does not add concerns when all metrics are excellent", () => {
      const r = computeItEquipmentConnectivity(baseInput({
        wifi_records: Array.from({ length: 10 }, () => makeWifi({ meets_target: true, content_filter_active: true, parental_controls_enabled: true })),
        device_records: Array.from({ length: 10 }, () => makeDevice({ operational: true, age_years: 1, maintenance_due: false })),
        printer_records: Array.from({ length: 5 }, () => makePrinter({ operational: true, accessible_to_children: true })),
        software_records: Array.from({ length: 10 }, () => makeSoftware({ is_up_to_date: true, security_patched: true, licence_valid: true })),
        digital_access_records: Array.from({ length: 5 }, (_, i) =>
          makeDigitalAccess({
            child_id: `c${i}`,
            child_satisfaction_rating: 5,
            online_safety_training_completed: true,
            homework_access_adequate: true,
          }),
        ),
        total_children: 5,
      }));
      expect(r.concerns).toHaveLength(0);
    });
  });
});
