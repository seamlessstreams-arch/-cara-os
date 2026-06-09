// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Record Quality & Timeliness Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateCompletion,
  evaluateTimeliness,
  evaluateQuality,
  evaluateSignOff,
  evaluateCrossReferencing,
  buildStaffProfiles,
  generateRecordQualityIntelligence,
  getRecordTypeLabel,
  getTimescaleHours,
} from "../record-quality-engine";
import type { RecordEntry, RecordExpectation } from "../record-quality-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-01-31";

// ── Helper Factories ─────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<RecordEntry> & { id: string; recordType: RecordEntry["recordType"] }): RecordEntry {
  return {
    date: "2025-01-10",
    createdAt: "2025-01-10T10:00:00Z",
    createdBy: "staff-sarah",
    createdByName: "Sarah Johnson",
    status: "signed_off",
    mandatoryFieldsTotal: 10,
    mandatoryFieldsCompleted: 10,
    wordCount: 120,
    crossReferencedRecords: [],
    childIds: ["child-alex"],
    ...overrides,
  };
}

function makeExpectation(overrides: Partial<RecordExpectation> & { recordType: RecordExpectation["recordType"] }): RecordExpectation {
  return {
    date: "2025-01-10",
    fulfilled: true,
    ...overrides,
  };
}

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────
// Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (RSW), Darren Laville (RM)
// Children: Alex (14), Jordan (13), Morgan (15)

const demoRecords: RecordEntry[] = [
  // Daily logs — 14 records across the period (2 per sample day, 7 days)
  // Morning shift ends ~14:00, evening shift ends ~22:00. Logs written at end of shift (within 4h timescale).
  makeRecord({ id: "dl-01", recordType: "daily_log", date: "2025-01-02T11:00:00Z", createdAt: "2025-01-02T14:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 180, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-03T09:00:00Z" }),
  makeRecord({ id: "dl-02", recordType: "daily_log", date: "2025-01-02T19:00:00Z", createdAt: "2025-01-02T22:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 150, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-03T09:00:00Z" }),
  makeRecord({ id: "dl-03", recordType: "daily_log", date: "2025-01-05T11:00:00Z", createdAt: "2025-01-05T14:30:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 160, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-06T08:00:00Z" }),
  makeRecord({ id: "dl-04", recordType: "daily_log", date: "2025-01-05T19:00:00Z", createdAt: "2025-01-05T22:30:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 140, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-06T08:00:00Z" }),
  makeRecord({ id: "dl-05", recordType: "daily_log", date: "2025-01-08T11:00:00Z", createdAt: "2025-01-08T14:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 200, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: ["inc-01"], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-09T09:00:00Z" }),
  makeRecord({ id: "dl-06", recordType: "daily_log", date: "2025-01-08T19:00:00Z", createdAt: "2025-01-08T22:00:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 170, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-09T09:00:00Z" }),
  makeRecord({ id: "dl-07", recordType: "daily_log", date: "2025-01-12T11:00:00Z", createdAt: "2025-01-12T14:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 130, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-13T08:00:00Z" }),
  makeRecord({ id: "dl-08", recordType: "daily_log", date: "2025-01-12T19:00:00Z", createdAt: "2025-01-12T22:00:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 155, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "completed" }),
  makeRecord({ id: "dl-09", recordType: "daily_log", date: "2025-01-15T11:00:00Z", createdAt: "2025-01-15T14:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 190, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-16T09:00:00Z" }),
  makeRecord({ id: "dl-10", recordType: "daily_log", date: "2025-01-15T19:00:00Z", createdAt: "2025-01-15T22:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 145, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-16T09:00:00Z" }),
  makeRecord({ id: "dl-11", recordType: "daily_log", date: "2025-01-20T11:00:00Z", createdAt: "2025-01-20T14:00:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 175, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-21T08:00:00Z" }),
  makeRecord({ id: "dl-12", recordType: "daily_log", date: "2025-01-20T19:00:00Z", createdAt: "2025-01-20T22:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 135, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-21T08:00:00Z" }),
  makeRecord({ id: "dl-13", recordType: "daily_log", date: "2025-01-25T11:00:00Z", createdAt: "2025-01-25T14:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 185, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-26T09:00:00Z" }),
  makeRecord({ id: "dl-14", recordType: "daily_log", date: "2025-01-25T19:00:00Z", createdAt: "2025-01-25T22:30:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 160, childIds: ["child-alex", "child-jordan", "child-morgan"], crossReferencedRecords: [], status: "completed" }),

  // Incident records — 3 incidents
  makeRecord({ id: "inc-01", recordType: "incident", date: "2025-01-08T16:30:00Z", createdAt: "2025-01-08T18:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 280, mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 12, childIds: ["child-alex"], crossReferencedRecords: ["dl-05"], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-09T10:00:00Z" }),
  makeRecord({ id: "inc-02", recordType: "incident", date: "2025-01-14T19:00:00Z", createdAt: "2025-01-15T08:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 210, mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 11, childIds: ["child-jordan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-15T14:00:00Z" }),
  makeRecord({ id: "inc-03", recordType: "incident", date: "2025-01-22T11:00:00Z", createdAt: "2025-01-22T14:00:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 250, mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 12, childIds: ["child-morgan"], crossReferencedRecords: ["dl-11"], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-23T09:00:00Z" }),

  // Restraint record — 1 (linked to incident inc-01)
  makeRecord({ id: "rst-01", recordType: "restraint", date: "2025-01-08T16:30:00Z", createdAt: "2025-01-08T19:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 350, mandatoryFieldsTotal: 15, mandatoryFieldsCompleted: 15, childIds: ["child-alex"], crossReferencedRecords: ["inc-01", "dl-05"], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-09T10:00:00Z" }),

  // Key-work sessions — 6 (2 per child). Session at ~15:00, record written same day or next morning (within 48h)
  makeRecord({ id: "kw-01", recordType: "key_work", date: "2025-01-06T15:00:00Z", createdAt: "2025-01-06T17:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 320, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, childIds: ["child-alex"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-07T09:00:00Z" }),
  makeRecord({ id: "kw-02", recordType: "key_work", date: "2025-01-20T15:00:00Z", createdAt: "2025-01-21T10:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 290, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, childIds: ["child-alex"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-22T09:00:00Z" }),
  makeRecord({ id: "kw-03", recordType: "key_work", date: "2025-01-07T14:00:00Z", createdAt: "2025-01-07T16:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 260, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 7, childIds: ["child-jordan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-08T08:00:00Z" }),
  makeRecord({ id: "kw-04", recordType: "key_work", date: "2025-01-21T15:00:00Z", createdAt: "2025-01-22T09:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 240, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, childIds: ["child-jordan"], crossReferencedRecords: [], status: "completed" }),
  makeRecord({ id: "kw-05", recordType: "key_work", date: "2025-01-09T15:00:00Z", createdAt: "2025-01-09T17:00:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 310, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, childIds: ["child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-10T08:00:00Z" }),
  makeRecord({ id: "kw-06", recordType: "key_work", date: "2025-01-23T15:00:00Z", createdAt: "2025-01-24T10:00:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 280, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, childIds: ["child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-25T08:00:00Z" }),

  // Medication records — 6
  makeRecord({ id: "med-01", recordType: "medication", date: "2025-01-05T08:00:00Z", createdAt: "2025-01-05T08:05:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 25, mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, childIds: ["child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-05T14:00:00Z" }),
  makeRecord({ id: "med-02", recordType: "medication", date: "2025-01-05T21:00:00Z", createdAt: "2025-01-05T21:05:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 22, mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, childIds: ["child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-06T08:00:00Z" }),
  makeRecord({ id: "med-03", recordType: "medication", date: "2025-01-10T08:00:00Z", createdAt: "2025-01-10T08:10:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 28, mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, childIds: ["child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-10T14:00:00Z" }),
  makeRecord({ id: "med-04", recordType: "medication", date: "2025-01-10T21:00:00Z", createdAt: "2025-01-10T21:10:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 24, mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, childIds: ["child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-11T09:00:00Z" }),
  makeRecord({ id: "med-05", recordType: "medication", date: "2025-01-15T08:00:00Z", createdAt: "2025-01-15T08:15:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 30, mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, childIds: ["child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-15T14:00:00Z" }),
  makeRecord({ id: "med-06", recordType: "medication", date: "2025-01-20T08:00:00Z", createdAt: "2025-01-20T08:05:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 26, mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, childIds: ["child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-20T14:00:00Z" }),

  // Care plan reviews — 3 (one per child). Review meeting at ~10:00, written within 5 working days (120h)
  makeRecord({ id: "cpr-01", recordType: "care_plan_review", date: "2025-01-10T10:00:00Z", createdAt: "2025-01-13T09:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 450, mandatoryFieldsTotal: 14, mandatoryFieldsCompleted: 14, childIds: ["child-alex"], crossReferencedRecords: ["kw-01"], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-14T09:00:00Z" }),
  makeRecord({ id: "cpr-02", recordType: "care_plan_review", date: "2025-01-12T10:00:00Z", createdAt: "2025-01-15T10:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 380, mandatoryFieldsTotal: 14, mandatoryFieldsCompleted: 13, childIds: ["child-jordan"], crossReferencedRecords: ["kw-03"], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-16T09:00:00Z" }),
  makeRecord({ id: "cpr-03", recordType: "care_plan_review", date: "2025-01-14T10:00:00Z", createdAt: "2025-01-16T11:00:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 420, mandatoryFieldsTotal: 14, mandatoryFieldsCompleted: 14, childIds: ["child-morgan"], crossReferencedRecords: ["kw-05"], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-17T09:00:00Z" }),

  // Contact records — 4
  makeRecord({ id: "con-01", recordType: "contact_record", date: "2025-01-03T10:00:00Z", createdAt: "2025-01-03T12:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 95, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, childIds: ["child-alex"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-04T09:00:00Z" }),
  makeRecord({ id: "con-02", recordType: "contact_record", date: "2025-01-10T14:00:00Z", createdAt: "2025-01-10T16:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 85, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, childIds: ["child-jordan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-11T08:00:00Z" }),
  makeRecord({ id: "con-03", recordType: "contact_record", date: "2025-01-17T11:00:00Z", createdAt: "2025-01-17T15:00:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 110, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, childIds: ["child-morgan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-18T09:00:00Z" }),
  makeRecord({ id: "con-04", recordType: "contact_record", date: "2025-01-24T09:00:00Z", createdAt: "2025-01-24T11:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 100, mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, childIds: ["child-alex"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-25T09:00:00Z" }),

  // Supervision records — 2. Session at 14:00, written next morning (within 72h)
  makeRecord({ id: "sup-01", recordType: "supervision", date: "2025-01-07T14:00:00Z", createdAt: "2025-01-08T10:00:00Z", createdBy: "staff-darren", createdByName: "Darren Laville", wordCount: 250, mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, childIds: [], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-08T14:00:00Z" }),
  makeRecord({ id: "sup-02", recordType: "supervision", date: "2025-01-21T14:00:00Z", createdAt: "2025-01-22T10:00:00Z", createdBy: "staff-darren", createdByName: "Darren Laville", wordCount: 280, mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, childIds: [], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-22T14:00:00Z" }),

  // Risk assessment — 1. Assessment at 10:00, written within 5 working days (120h)
  makeRecord({ id: "ra-01", recordType: "risk_assessment", date: "2025-01-15T10:00:00Z", createdAt: "2025-01-17T09:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 400, mandatoryFieldsTotal: 16, mandatoryFieldsCompleted: 16, childIds: ["child-alex"], crossReferencedRecords: ["inc-01", "rst-01"], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-18T09:00:00Z" }),

  // Missing child record — 1 (Alex went missing briefly)
  makeRecord({ id: "mc-01", recordType: "missing_child", date: "2025-01-18T17:30:00Z", createdAt: "2025-01-18T18:00:00Z", createdBy: "staff-tom", createdByName: "Tom Richards", wordCount: 180, mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, childIds: ["child-alex"], crossReferencedRecords: ["sg-01"], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-18T21:00:00Z" }),

  // Safeguarding referral — 1 (following missing child)
  makeRecord({ id: "sg-01", recordType: "safeguarding_referral", date: "2025-01-18T18:00:00Z", createdAt: "2025-01-18T19:00:00Z", createdBy: "staff-sarah", createdByName: "Sarah Johnson", wordCount: 320, mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 12, childIds: ["child-alex"], crossReferencedRecords: ["mc-01"], status: "signed_off", signedOffBy: "staff-darren", signedOffAt: "2025-01-19T09:00:00Z" }),

  // Health assessment — 1. Assessment at 10:00, written within 5 working days (120h)
  makeRecord({ id: "ha-01", recordType: "health_assessment", date: "2025-01-10T10:00:00Z", createdAt: "2025-01-13T10:00:00Z", createdBy: "staff-lisa", createdByName: "Lisa Williams", wordCount: 350, mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 12, childIds: ["child-jordan"], crossReferencedRecords: [], status: "signed_off", signedOffBy: "staff-sarah", signedOffAt: "2025-01-14T08:00:00Z" }),
];

// Total: 14 daily_log + 3 incident + 1 restraint + 6 key_work + 6 medication +
//        3 care_plan_review + 4 contact_record + 2 supervision + 1 risk_assessment +
//        1 missing_child + 1 safeguarding_referral + 1 health_assessment = 43 records

const demoExpectations: RecordExpectation[] = [
  // Daily logs expected: 14 per 7 sample days (2 per day)
  ...Array.from({ length: 14 }, (_, i) =>
    makeExpectation({ recordType: "daily_log", date: `2025-01-${String((i < 2 ? 2 : i < 4 ? 5 : i < 6 ? 8 : i < 8 ? 12 : i < 10 ? 15 : i < 12 ? 20 : 25)).padStart(2, "0")}`, fulfilled: true, recordId: `dl-${String(i + 1).padStart(2, "0")}` }),
  ),
  // 2 daily logs missing (expected but not written)
  makeExpectation({ recordType: "daily_log", date: "2025-01-28", fulfilled: false }),
  makeExpectation({ recordType: "daily_log", date: "2025-01-28", fulfilled: false }),

  // Incident expectations: 3 fulfilled
  makeExpectation({ recordType: "incident", date: "2025-01-08", fulfilled: true, recordId: "inc-01" }),
  makeExpectation({ recordType: "incident", date: "2025-01-14", fulfilled: true, recordId: "inc-02" }),
  makeExpectation({ recordType: "incident", date: "2025-01-22", fulfilled: true, recordId: "inc-03" }),

  // Restraint: 1 fulfilled
  makeExpectation({ recordType: "restraint", date: "2025-01-08", fulfilled: true, recordId: "rst-01" }),

  // Key-work: 6 fulfilled
  makeExpectation({ recordType: "key_work", date: "2025-01-06", fulfilled: true, recordId: "kw-01" }),
  makeExpectation({ recordType: "key_work", date: "2025-01-20", fulfilled: true, recordId: "kw-02" }),
  makeExpectation({ recordType: "key_work", date: "2025-01-07", fulfilled: true, recordId: "kw-03" }),
  makeExpectation({ recordType: "key_work", date: "2025-01-21", fulfilled: true, recordId: "kw-04" }),
  makeExpectation({ recordType: "key_work", date: "2025-01-09", fulfilled: true, recordId: "kw-05" }),
  makeExpectation({ recordType: "key_work", date: "2025-01-23", fulfilled: true, recordId: "kw-06" }),

  // Medication: 6 fulfilled + 1 missing
  makeExpectation({ recordType: "medication", date: "2025-01-05", fulfilled: true, recordId: "med-01" }),
  makeExpectation({ recordType: "medication", date: "2025-01-05", fulfilled: true, recordId: "med-02" }),
  makeExpectation({ recordType: "medication", date: "2025-01-10", fulfilled: true, recordId: "med-03" }),
  makeExpectation({ recordType: "medication", date: "2025-01-10", fulfilled: true, recordId: "med-04" }),
  makeExpectation({ recordType: "medication", date: "2025-01-15", fulfilled: true, recordId: "med-05" }),
  makeExpectation({ recordType: "medication", date: "2025-01-20", fulfilled: true, recordId: "med-06" }),
  makeExpectation({ recordType: "medication", date: "2025-01-25", fulfilled: false }),

  // Care plan reviews: 3 fulfilled
  makeExpectation({ recordType: "care_plan_review", date: "2025-01-10", fulfilled: true, recordId: "cpr-01" }),
  makeExpectation({ recordType: "care_plan_review", date: "2025-01-12", fulfilled: true, recordId: "cpr-02" }),
  makeExpectation({ recordType: "care_plan_review", date: "2025-01-14", fulfilled: true, recordId: "cpr-03" }),

  // Contact records: 4 fulfilled
  makeExpectation({ recordType: "contact_record", date: "2025-01-03", fulfilled: true, recordId: "con-01" }),
  makeExpectation({ recordType: "contact_record", date: "2025-01-10", fulfilled: true, recordId: "con-02" }),
  makeExpectation({ recordType: "contact_record", date: "2025-01-17", fulfilled: true, recordId: "con-03" }),
  makeExpectation({ recordType: "contact_record", date: "2025-01-24", fulfilled: true, recordId: "con-04" }),

  // Supervision: 2 fulfilled
  makeExpectation({ recordType: "supervision", date: "2025-01-07", fulfilled: true, recordId: "sup-01" }),
  makeExpectation({ recordType: "supervision", date: "2025-01-21", fulfilled: true, recordId: "sup-02" }),

  // Risk assessment: 1 fulfilled
  makeExpectation({ recordType: "risk_assessment", date: "2025-01-15", fulfilled: true, recordId: "ra-01" }),

  // Missing child: 1 fulfilled
  makeExpectation({ recordType: "missing_child", date: "2025-01-18", fulfilled: true, recordId: "mc-01" }),

  // Safeguarding: 1 fulfilled
  makeExpectation({ recordType: "safeguarding_referral", date: "2025-01-18", fulfilled: true, recordId: "sg-01" }),

  // Health assessment: 1 fulfilled
  makeExpectation({ recordType: "health_assessment", date: "2025-01-10", fulfilled: true, recordId: "ha-01" }),
];

// Total expectations: 16 daily_log + 3 incident + 1 restraint + 6 key_work + 7 medication +
//   3 care_plan_review + 4 contact + 2 supervision + 1 risk_assessment + 1 missing +
//   1 safeguarding + 1 health = 46
// Fulfilled: 43, Missing: 3 (2 daily_log on 28th + 1 medication on 25th)

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Record Quality — evaluateCompletion", () => {
  it("counts total expected records", () => {
    const result = evaluateCompletion(demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.totalExpected).toBe(46);
  });

  it("counts total fulfilled records", () => {
    const result = evaluateCompletion(demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.totalFulfilled).toBe(43);
  });

  it("calculates completion rate", () => {
    const result = evaluateCompletion(demoExpectations, PERIOD_START, PERIOD_END);
    // 43/46 = 93%
    expect(result.completionRate).toBe(93);
  });

  it("identifies missing records by type", () => {
    const result = evaluateCompletion(demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.missingByType.length).toBe(2); // daily_log and medication
    const dailyMissing = result.missingByType.find((t) => t.recordType === "daily_log");
    expect(dailyMissing?.missing).toBe(2);
    const medMissing = result.missingByType.find((t) => t.recordType === "medication");
    expect(medMissing?.missing).toBe(1);
  });

  it("returns perfect completion when all fulfilled", () => {
    const allFulfilled = demoExpectations.map((e) => ({ ...e, fulfilled: true }));
    const result = evaluateCompletion(allFulfilled, PERIOD_START, PERIOD_END);
    expect(result.completionRate).toBe(100);
    expect(result.missingByType.length).toBe(0);
  });

  it("handles empty expectations", () => {
    const result = evaluateCompletion([], PERIOD_START, PERIOD_END);
    expect(result.totalExpected).toBe(0);
    expect(result.completionRate).toBe(0);
  });

  it("excludes out-of-period expectations", () => {
    const outOfPeriod = [
      makeExpectation({ recordType: "daily_log", date: "2024-12-31", fulfilled: false }),
      makeExpectation({ recordType: "daily_log", date: "2025-02-01", fulfilled: false }),
    ];
    const result = evaluateCompletion(outOfPeriod, PERIOD_START, PERIOD_END);
    expect(result.totalExpected).toBe(0);
  });

  it("sorts missing by count descending", () => {
    const result = evaluateCompletion(demoExpectations, PERIOD_START, PERIOD_END);
    expect(result.missingByType[0].missing).toBeGreaterThanOrEqual(
      result.missingByType[result.missingByType.length - 1].missing,
    );
  });
});

describe("Record Quality — evaluateTimeliness", () => {
  it("counts total records in period", () => {
    const result = evaluateTimeliness(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(43);
  });

  it("calculates records within timescale", () => {
    const result = evaluateTimeliness(demoRecords, PERIOD_START, PERIOD_END);
    // All medication within 1h (0.08-0.25h delay), all daily logs within 4h,
    // incidents within 24h, key-work within 48h, etc.
    // Most records are within timescale — check it's high
    expect(result.withinTimescale).toBeGreaterThanOrEqual(38);
  });

  it("calculates timeliness rate above 80%", () => {
    const result = evaluateTimeliness(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.timelinessRate).toBeGreaterThanOrEqual(80);
  });

  it("calculates average delay hours", () => {
    const result = evaluateTimeliness(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.averageDelayHours).toBeGreaterThan(0);
  });

  it("identifies late records by type", () => {
    const result = evaluateTimeliness(demoRecords, PERIOD_START, PERIOD_END);
    // care_plan_review has 120h timescale, cpr-02 is 3 days late from Jan 12 to Jan 15 = 72h which is within 120h
    // daily_log has 4h, dl-08 Jan 12 to Jan 12 22:00 = date "2025-01-12" to "2025-01-12T22:00:00Z"
    // Most should be within timescale
    for (const late of result.lateByType) {
      expect(late.count).toBeGreaterThan(0);
      expect(late.avgDelayHours).toBeGreaterThan(0);
    }
  });

  it("handles no records", () => {
    const result = evaluateTimeliness([], PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(0);
    expect(result.timelinessRate).toBe(0);
    expect(result.averageDelayHours).toBe(0);
  });

  it("excludes out-of-period records", () => {
    const outOfPeriod = [
      makeRecord({ id: "oop-1", recordType: "daily_log", date: "2024-12-30", createdAt: "2024-12-30T14:00:00Z" }),
    ];
    const result = evaluateTimeliness(outOfPeriod, PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(0);
  });

  it("flags late medication as a concern when over 1h", () => {
    const lateRecord = makeRecord({
      id: "med-late",
      recordType: "medication",
      date: "2025-01-15T08:00:00Z",
      createdAt: "2025-01-15T12:00:00Z", // 4 hours late (max is 1h)
    });
    const result = evaluateTimeliness([lateRecord], PERIOD_START, PERIOD_END);
    expect(result.withinTimescale).toBe(0);
    expect(result.lateByType.some((t) => t.recordType === "medication")).toBe(true);
  });
});

describe("Record Quality — evaluateQuality", () => {
  it("counts total records", () => {
    const result = evaluateQuality(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(43);
  });

  it("calculates average field completion above 90%", () => {
    const result = evaluateQuality(demoRecords, PERIOD_START, PERIOD_END);
    // Most records have 100% field completion, inc-02 has 11/12, cpr-02 has 13/14, kw-03 has 7/8
    expect(result.averageFieldCompletion).toBeGreaterThanOrEqual(95);
  });

  it("calculates average word count", () => {
    const result = evaluateQuality(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.averageWordCount).toBeGreaterThan(0);
    expect(result.averageWordCount).toBeLessThan(500);
  });

  it("counts records below minimum word count", () => {
    const result = evaluateQuality(demoRecords, PERIOD_START, PERIOD_END);
    // Medication records are 20-30 words and min is 20, so they're fine
    // Contact records are 85-110 and min is 50, fine
    // No records should be below minimum in our demo
    expect(result.recordsBelowMinWords).toBe(0);
  });

  it("breaks down quality by record type", () => {
    const result = evaluateQuality(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.typeBreakdown.length).toBeGreaterThan(0);
    const dailyLogBreakdown = result.typeBreakdown.find((t) => t.recordType === "daily_log");
    expect(dailyLogBreakdown).toBeDefined();
    expect(dailyLogBreakdown!.count).toBe(14);
  });

  it("sorts type breakdown by count descending", () => {
    const result = evaluateQuality(demoRecords, PERIOD_START, PERIOD_END);
    for (let i = 1; i < result.typeBreakdown.length; i++) {
      expect(result.typeBreakdown[i - 1].count).toBeGreaterThanOrEqual(result.typeBreakdown[i].count);
    }
  });

  it("handles no records", () => {
    const result = evaluateQuality([], PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(0);
    expect(result.averageFieldCompletion).toBe(0);
    expect(result.averageWordCount).toBe(0);
  });

  it("detects records below minimum words", () => {
    const brief = makeRecord({
      id: "brief-1",
      recordType: "incident",
      wordCount: 30, // min for incident is 100
    });
    const result = evaluateQuality([brief], PERIOD_START, PERIOD_END);
    expect(result.recordsBelowMinWords).toBe(1);
  });

  it("calculates field completion with partial completions", () => {
    const partial = makeRecord({
      id: "partial-1",
      recordType: "daily_log",
      mandatoryFieldsTotal: 10,
      mandatoryFieldsCompleted: 5,
    });
    const result = evaluateQuality([partial], PERIOD_START, PERIOD_END);
    expect(result.averageFieldCompletion).toBe(50);
  });
});

describe("Record Quality — evaluateSignOff", () => {
  it("counts total records", () => {
    const result = evaluateSignOff(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(43);
  });

  it("counts signed off records", () => {
    const result = evaluateSignOff(demoRecords, PERIOD_START, PERIOD_END);
    // dl-08 and dl-14 are "completed" (not signed off), kw-04 is "completed"
    // 43 total - 3 completed = 40 signed off
    expect(result.signedOff).toBe(40);
  });

  it("calculates sign-off rate", () => {
    const result = evaluateSignOff(demoRecords, PERIOD_START, PERIOD_END);
    // 40/43 = 93%
    expect(result.signOffRate).toBe(93);
  });

  it("counts pending sign-off records", () => {
    const result = evaluateSignOff(demoRecords, PERIOD_START, PERIOD_END);
    // dl-08, dl-14, kw-04 are "completed" = pending
    expect(result.pendingSignOff).toBe(3);
  });

  it("counts queried records", () => {
    const result = evaluateSignOff(demoRecords, PERIOD_START, PERIOD_END);
    // No queried records in demo
    expect(result.queriedRecords).toBe(0);
  });

  it("provides type breakdown", () => {
    const result = evaluateSignOff(demoRecords, PERIOD_START, PERIOD_END);
    const dailyBreakdown = result.typeBreakdown.find((t) => t.recordType === "daily_log");
    expect(dailyBreakdown).toBeDefined();
    expect(dailyBreakdown!.total).toBe(14);
    expect(dailyBreakdown!.signedOff).toBe(12); // 14 - 2 completed = 12
  });

  it("handles queried records correctly", () => {
    const queriedRecord = makeRecord({
      id: "q-1",
      recordType: "daily_log",
      status: "queried",
    });
    const result = evaluateSignOff([queriedRecord], PERIOD_START, PERIOD_END);
    expect(result.queriedRecords).toBe(1);
    expect(result.signedOff).toBe(0);
    expect(result.pendingSignOff).toBe(0);
  });

  it("handles no records", () => {
    const result = evaluateSignOff([], PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(0);
    expect(result.signOffRate).toBe(0);
  });
});

describe("Record Quality — evaluateCrossReferencing", () => {
  it("counts total records", () => {
    const result = evaluateCrossReferencing(demoRecords, PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(43);
  });

  it("counts records with cross-references", () => {
    const result = evaluateCrossReferencing(demoRecords, PERIOD_START, PERIOD_END);
    // dl-05 → inc-01, inc-01 → dl-05, inc-03 → dl-11, rst-01 → [inc-01, dl-05],
    // cpr-01 → kw-01, cpr-02 → kw-03, cpr-03 → kw-05,
    // ra-01 → [inc-01, rst-01], mc-01 → sg-01, sg-01 → mc-01
    // = 10 records with cross-references
    expect(result.withCrossReferences).toBe(10);
  });

  it("calculates cross-reference rate", () => {
    const result = evaluateCrossReferencing(demoRecords, PERIOD_START, PERIOD_END);
    // 10/43 = 23%
    expect(result.crossReferenceRate).toBe(23);
  });

  it("detects incidents without daily log reference", () => {
    const result = evaluateCrossReferencing(demoRecords, PERIOD_START, PERIOD_END);
    // inc-01 references dl-05 ✓, inc-02 has no daily log ref ✗, inc-03 references dl-11 ✓
    expect(result.incidentsWithoutDailyLog).toBe(1);
  });

  it("detects restraints without incident reference", () => {
    const result = evaluateCrossReferencing(demoRecords, PERIOD_START, PERIOD_END);
    // rst-01 references inc-01 ✓
    expect(result.restraintsWithoutIncident).toBe(0);
  });

  it("detects missing child without safeguarding reference", () => {
    const result = evaluateCrossReferencing(demoRecords, PERIOD_START, PERIOD_END);
    // mc-01 references sg-01 ✓
    expect(result.missingWithoutSafeguarding).toBe(0);
  });

  it("handles no records", () => {
    const result = evaluateCrossReferencing([], PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(0);
    expect(result.crossReferenceRate).toBe(0);
    expect(result.incidentsWithoutDailyLog).toBe(0);
  });

  it("flags restraint without incident link", () => {
    const unlinkedRestraint = makeRecord({
      id: "rst-unlinked",
      recordType: "restraint",
      crossReferencedRecords: [], // no incident reference
    });
    const result = evaluateCrossReferencing([unlinkedRestraint], PERIOD_START, PERIOD_END);
    expect(result.restraintsWithoutIncident).toBe(1);
  });

  it("flags missing child without safeguarding link", () => {
    const unlinkedMissing = makeRecord({
      id: "mc-unlinked",
      recordType: "missing_child",
      crossReferencedRecords: [],
    });
    const result = evaluateCrossReferencing([unlinkedMissing], PERIOD_START, PERIOD_END);
    expect(result.missingWithoutSafeguarding).toBe(1);
  });
});

describe("Record Quality — buildStaffProfiles", () => {
  it("returns profiles for all staff", () => {
    const profiles = buildStaffProfiles(demoRecords, PERIOD_START, PERIOD_END);
    expect(profiles.length).toBe(4); // Sarah, Tom, Lisa, Darren
  });

  it("sorts profiles by total records descending", () => {
    const profiles = buildStaffProfiles(demoRecords, PERIOD_START, PERIOD_END);
    for (let i = 1; i < profiles.length; i++) {
      expect(profiles[i - 1].totalRecords).toBeGreaterThanOrEqual(profiles[i].totalRecords);
    }
  });

  it("calculates Sarah's record count correctly", () => {
    const profiles = buildStaffProfiles(demoRecords, PERIOD_START, PERIOD_END);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah).toBeDefined();
    // Sarah: dl-01, dl-05, dl-09, dl-13 (4 daily logs) +
    // inc-01, rst-01 (incident, restraint) + kw-01, kw-02 (key-work) +
    // cpr-01 (care plan) + con-01, con-04 (contact) + sg-01 (safeguarding) +
    // med-03 (medication) + ra-01 (risk assessment) = 14
    expect(sarah!.totalRecords).toBe(14);
  });

  it("calculates Tom's record count correctly", () => {
    const profiles = buildStaffProfiles(demoRecords, PERIOD_START, PERIOD_END);
    const tom = profiles.find((p) => p.staffId === "staff-tom");
    expect(tom).toBeDefined();
    // Tom: dl-02, dl-04, dl-07, dl-10, dl-12 (5 daily logs) +
    // inc-02 (incident) + kw-03, kw-04 (key-work) + med-02, med-04 (medication) +
    // cpr-02 (care plan) + con-02 (contact) + mc-01 (missing child) = 13
    expect(tom!.totalRecords).toBe(13);
  });

  it("calculates Lisa's record count correctly", () => {
    const profiles = buildStaffProfiles(demoRecords, PERIOD_START, PERIOD_END);
    const lisa = profiles.find((p) => p.staffId === "staff-lisa");
    expect(lisa).toBeDefined();
    // Lisa: dl-03, dl-06, dl-08, dl-11, dl-14 (5 daily logs) +
    // inc-03 (incident) + kw-05, kw-06 (key-work) + med-01, med-05, med-06 (medication) +
    // con-03 (contact) + cpr-03 (care plan) + ha-01 (health assessment) = 14
    expect(lisa!.totalRecords).toBe(14);
  });

  it("calculates Darren's profile as manager", () => {
    const profiles = buildStaffProfiles(demoRecords, PERIOD_START, PERIOD_END);
    const darren = profiles.find((p) => p.staffId === "staff-darren");
    expect(darren).toBeDefined();
    // Darren: sup-01, sup-02 (2 supervision records)
    expect(darren!.totalRecords).toBe(2);
    expect(darren!.staffName).toBe("Darren Laville");
  });

  it("calculates average field completion per staff", () => {
    const profiles = buildStaffProfiles(demoRecords, PERIOD_START, PERIOD_END);
    for (const profile of profiles) {
      expect(profile.averageFieldCompletion).toBeGreaterThanOrEqual(85);
      expect(profile.averageFieldCompletion).toBeLessThanOrEqual(100);
    }
  });

  it("calculates sign-off rate per staff", () => {
    const profiles = buildStaffProfiles(demoRecords, PERIOD_START, PERIOD_END);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    // All of Sarah's records are signed_off
    expect(sarah!.signOffRate).toBe(100);
  });

  it("handles no records", () => {
    const profiles = buildStaffProfiles([], PERIOD_START, PERIOD_END);
    expect(profiles.length).toBe(0);
  });
});

describe("Record Quality — generateRecordQualityIntelligence (integration)", () => {
  const result = generateRecordQualityIntelligence(
    demoRecords,
    demoExpectations,
    "oak-house",
    PERIOD_START,
    PERIOD_END,
  );

  it("returns complete structure", () => {
    expect(result).toHaveProperty("homeId", "oak-house");
    expect(result).toHaveProperty("periodStart", PERIOD_START);
    expect(result).toHaveProperty("periodEnd", PERIOD_END);
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("completion");
    expect(result).toHaveProperty("timeliness");
    expect(result).toHaveProperty("quality");
    expect(result).toHaveProperty("signOff");
    expect(result).toHaveProperty("crossReferencing");
    expect(result).toHaveProperty("staffProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForDevelopment");
    expect(result).toHaveProperty("immediateActions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("achieves good or outstanding rating with demo data", () => {
    expect(["good", "outstanding"]).toContain(result.rating);
  });

  it("scores at least 60 overall", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
  });

  it("produces inadequate rating with no data", () => {
    const empty = generateRecordQualityIntelligence([], [], "oak-house", PERIOD_START, PERIOD_END);
    expect(empty.rating).toBe("inadequate");
    expect(empty.overallScore).toBe(0);
  });

  it("produces lower score with poor completion", () => {
    const poorExpectations = demoExpectations.map((e) => ({ ...e, fulfilled: false }));
    const poor = generateRecordQualityIntelligence(
      demoRecords,
      poorExpectations,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(poor.overallScore).toBeLessThan(result.overallScore);
  });

  it("links to Reg 36 — Records", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 36"))).toBe(true);
  });

  it("links to Schedule 3 — Records to be maintained", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Schedule 3"))).toBe(true);
  });

  it("links to DPA 2018", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Data Protection"))).toBe(true);
  });

  it("identifies completion strength when above 95%", () => {
    const perfectExpectations = demoExpectations.map((e) => ({ ...e, fulfilled: true }));
    const perfect = generateRecordQualityIntelligence(
      demoRecords,
      perfectExpectations,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(perfect.strengths.some((s) => s.toLowerCase().includes("completion"))).toBe(true);
  });

  it("identifies sign-off strength when above 90%", () => {
    // Our demo has 93% sign-off rate
    expect(result.strengths.some((s) => s.toLowerCase().includes("sign") || s.toLowerCase().includes("oversight"))).toBe(true);
  });

  it("identifies field completion strength when high", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("field") || s.toLowerCase().includes("mandatory"))).toBe(true);
  });

  it("generates development area when completion below 90%", () => {
    const manyMissing = demoExpectations.map((e, i) => ({
      ...e,
      fulfilled: i < 30, // only 30 of 46 = 65%
    }));
    const low = generateRecordQualityIntelligence(
      demoRecords,
      manyMissing,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(low.areasForDevelopment.some((a) => a.toLowerCase().includes("completion"))).toBe(true);
  });

  it("generates urgent action for missing critical records", () => {
    const criticalMissing: RecordExpectation[] = [
      makeExpectation({ recordType: "restraint", date: "2025-01-15", fulfilled: false }),
      makeExpectation({ recordType: "safeguarding_referral", date: "2025-01-15", fulfilled: false }),
    ];
    const urgent = generateRecordQualityIntelligence(
      demoRecords,
      criticalMissing,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(urgent.immediateActions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates action for queried records", () => {
    const queriedRecords = demoRecords.map((r) =>
      r.id === "dl-08" ? { ...r, status: "queried" as const } : r,
    );
    const queried = generateRecordQualityIntelligence(
      queriedRecords,
      demoExpectations,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(queried.immediateActions.some((a) => a.includes("queried"))).toBe(true);
  });

  it("generates action for unlinked restraint records", () => {
    const unlinkedRecords = demoRecords.map((r) =>
      r.id === "rst-01" ? { ...r, crossReferencedRecords: [] } : r,
    );
    const unlinked = generateRecordQualityIntelligence(
      unlinkedRecords,
      demoExpectations,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(unlinked.immediateActions.some((a) => a.includes("restraint"))).toBe(true);
  });

  it("returns no urgent actions with good data", () => {
    // The demo data should have no urgent actions (no missing critical records)
    expect(result.immediateActions.some((a) => a.includes("URGENT"))).toBe(false);
  });

  it("includes 4 staff profiles", () => {
    expect(result.staffProfiles.length).toBe(4);
  });
});

describe("Record Quality — Labels", () => {
  it("returns Daily Log label", () => {
    expect(getRecordTypeLabel("daily_log")).toBe("Daily Log");
  });

  it("returns Incident Record label", () => {
    expect(getRecordTypeLabel("incident")).toBe("Incident Record");
  });

  it("returns Restraint Record label", () => {
    expect(getRecordTypeLabel("restraint")).toBe("Restraint Record");
  });

  it("returns Missing Child Record label", () => {
    expect(getRecordTypeLabel("missing_child")).toBe("Missing Child Record");
  });

  it("returns Key-Work Session label", () => {
    expect(getRecordTypeLabel("key_work")).toBe("Key-Work Session");
  });

  it("returns Risk Assessment label", () => {
    expect(getRecordTypeLabel("risk_assessment")).toBe("Risk Assessment");
  });

  it("returns Medication Record label", () => {
    expect(getRecordTypeLabel("medication")).toBe("Medication Record");
  });

  it("returns Care Plan Review label", () => {
    expect(getRecordTypeLabel("care_plan_review")).toBe("Care Plan Review");
  });

  it("returns Contact Record label", () => {
    expect(getRecordTypeLabel("contact_record")).toBe("Contact Record");
  });

  it("returns Supervision Record label", () => {
    expect(getRecordTypeLabel("supervision")).toBe("Supervision Record");
  });

  it("returns Safeguarding Referral label", () => {
    expect(getRecordTypeLabel("safeguarding_referral")).toBe("Safeguarding Referral");
  });

  it("returns Health Assessment label", () => {
    expect(getRecordTypeLabel("health_assessment")).toBe("Health Assessment");
  });
});

describe("Record Quality — Timescale Hours", () => {
  it("daily_log has 4h timescale", () => {
    expect(getTimescaleHours("daily_log")).toBe(4);
  });

  it("incident has 24h timescale", () => {
    expect(getTimescaleHours("incident")).toBe(24);
  });

  it("restraint has 24h timescale", () => {
    expect(getTimescaleHours("restraint")).toBe(24);
  });

  it("missing_child has 2h timescale", () => {
    expect(getTimescaleHours("missing_child")).toBe(2);
  });

  it("medication has 1h timescale", () => {
    expect(getTimescaleHours("medication")).toBe(1);
  });

  it("safeguarding_referral has 4h timescale", () => {
    expect(getTimescaleHours("safeguarding_referral")).toBe(4);
  });

  it("key_work has 48h timescale", () => {
    expect(getTimescaleHours("key_work")).toBe(48);
  });

  it("care_plan_review has 120h timescale", () => {
    expect(getTimescaleHours("care_plan_review")).toBe(120);
  });
});
