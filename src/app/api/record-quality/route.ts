// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Record Quality & Timeliness Intelligence API Route
//
// GET  → returns Oak House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateRecordQualityIntelligence,
} from "@/lib/record-quality/record-quality-engine";
import type {
  RecordEntry,
  RecordExpectation,
} from "@/lib/record-quality/record-quality-engine";

// ── Oak House Demo Data ──────────────────────────────────────────────────────
// Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (RSW), Darren Laville (RM)
// Children: Alex (14), Jordan (13), Morgan (15)
//
// Period: 1 Jan 2025 – 31 Jan 2025
// A realistic month of records at a well-run 3-bed children's home

function getDemoData(): {
  records: RecordEntry[];
  expectations: RecordExpectation[];
} {
  const records: RecordEntry[] = [
    // ── Daily Logs (14) ─────────────────────────────────────────────────
    // 2 per shift day across 7 sample days. Morning shift ~07:00-14:00, evening ~14:00-22:00
    {
      id: "dl-01", recordType: "daily_log", date: "2025-01-02T11:00:00Z", createdAt: "2025-01-02T14:15:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-03T09:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 180,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
      qualityNotes: "Detailed morning log. Alex attended school, Jordan had swimming, Morgan prayer time observed.",
    },
    {
      id: "dl-02", recordType: "daily_log", date: "2025-01-02T19:00:00Z", createdAt: "2025-01-02T22:10:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-03T09:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 155,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-03", recordType: "daily_log", date: "2025-01-05T11:00:00Z", createdAt: "2025-01-05T14:30:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-06T08:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 165,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-04", recordType: "daily_log", date: "2025-01-05T19:00:00Z", createdAt: "2025-01-05T22:20:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-06T08:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 140,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-05", recordType: "daily_log", date: "2025-01-08T11:00:00Z", createdAt: "2025-01-08T14:20:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-09T09:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 210,
      crossReferencedRecords: ["inc-01"], childIds: ["child-alex", "child-jordan", "child-morgan"],
      qualityNotes: "Incident with Alex cross-referenced. PACE approach used in debrief.",
    },
    {
      id: "dl-06", recordType: "daily_log", date: "2025-01-08T19:00:00Z", createdAt: "2025-01-08T22:15:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-09T09:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 175,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-07", recordType: "daily_log", date: "2025-01-12T11:00:00Z", createdAt: "2025-01-12T14:10:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-13T08:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 135,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-08", recordType: "daily_log", date: "2025-01-12T19:00:00Z", createdAt: "2025-01-12T22:00:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "completed",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 155,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
      qualityNotes: "Pending sign-off — Darren off-site.",
    },
    {
      id: "dl-09", recordType: "daily_log", date: "2025-01-15T11:00:00Z", createdAt: "2025-01-15T14:25:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-16T09:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 195,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-10", recordType: "daily_log", date: "2025-01-15T19:00:00Z", createdAt: "2025-01-15T22:05:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-16T09:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 145,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-11", recordType: "daily_log", date: "2025-01-20T11:00:00Z", createdAt: "2025-01-20T14:10:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-21T08:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 178,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-12", recordType: "daily_log", date: "2025-01-20T19:00:00Z", createdAt: "2025-01-20T22:00:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-21T08:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 138,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-13", recordType: "daily_log", date: "2025-01-25T11:00:00Z", createdAt: "2025-01-25T14:15:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-26T09:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 188,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
    },
    {
      id: "dl-14", recordType: "daily_log", date: "2025-01-25T19:00:00Z", createdAt: "2025-01-25T22:30:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "completed",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 162,
      crossReferencedRecords: [], childIds: ["child-alex", "child-jordan", "child-morgan"],
      qualityNotes: "Pending sign-off — weekend, Darren reviews Monday.",
    },

    // ── Incident Records (3) ────────────────────────────────────────────
    {
      id: "inc-01", recordType: "incident", date: "2025-01-08T16:30:00Z", createdAt: "2025-01-08T18:00:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-09T10:00:00Z",
      mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 12, wordCount: 285,
      crossReferencedRecords: ["dl-05"], childIds: ["child-alex"],
      qualityNotes: "Alex dysregulated after phone contact with mum. Staff used PACE. De-escalation successful. Debrief completed with Alex using therapeutic language. Sarah noted Alex's progress — he accepted co-regulation within 15 minutes.",
    },
    {
      id: "inc-02", recordType: "incident", date: "2025-01-14T19:00:00Z", createdAt: "2025-01-15T08:00:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-15T14:00:00Z",
      mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 11, wordCount: 215,
      crossReferencedRecords: [], childIds: ["child-jordan"],
      qualityNotes: "Jordan upset at bedtime — wanted mum. Agency staff on shift couldn't settle him. Lisa called in to talk to Jordan on phone. Settled by 22:00. One field (witness statement) pending.",
    },
    {
      id: "inc-03", recordType: "incident", date: "2025-01-22T11:00:00Z", createdAt: "2025-01-22T14:00:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-23T09:00:00Z",
      mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 12, wordCount: 255,
      crossReferencedRecords: ["dl-11"], childIds: ["child-morgan"],
      qualityNotes: "Morgan found a discriminatory comment on social media targeting his faith. Supported using PACE. Online safety plan reviewed. Morgan showed resilience and requested to speak to his imam.",
    },

    // ── Restraint Record (1) ────────────────────────────────────────────
    {
      id: "rst-01", recordType: "restraint", date: "2025-01-08T16:30:00Z", createdAt: "2025-01-08T19:00:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-09T10:00:00Z",
      mandatoryFieldsTotal: 15, mandatoryFieldsCompleted: 15, wordCount: 360,
      crossReferencedRecords: ["inc-01", "dl-05"], childIds: ["child-alex"],
      qualityNotes: "Brief hold (2 min) to prevent Alex harming himself. All 15 mandatory fields including de-escalation attempts, duration, child's account, medical check, and debrief completed. RI notified within 24h.",
    },

    // ── Key-Work Sessions (6) ───────────────────────────────────────────
    {
      id: "kw-01", recordType: "key_work", date: "2025-01-06T15:00:00Z", createdAt: "2025-01-06T17:00:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-07T09:00:00Z",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, wordCount: 325,
      crossReferencedRecords: [], childIds: ["child-alex"],
      qualityNotes: "Alex discussed school progress and new friendships. Used life-story work to explore identity. Alex drew a picture of 'where I feel safe'. Strength-based approach throughout.",
    },
    {
      id: "kw-02", recordType: "key_work", date: "2025-01-20T15:00:00Z", createdAt: "2025-01-21T10:00:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-22T09:00:00Z",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, wordCount: 295,
      crossReferencedRecords: [], childIds: ["child-alex"],
      qualityNotes: "Alex talked about contact with mum. Explored feelings using emotional literacy cards. Alex identified 'frustrated' and 'hopeful'. Linked to his care plan wishes.",
    },
    {
      id: "kw-03", recordType: "key_work", date: "2025-01-07T14:00:00Z", createdAt: "2025-01-07T16:00:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-08T08:00:00Z",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 7, wordCount: 265,
      crossReferencedRecords: [], childIds: ["child-jordan"],
      qualityNotes: "Jordan baked brownies — discussed favourite recipes from home. Talked about what he misses. One field (next session goals) not yet completed.",
    },
    {
      id: "kw-04", recordType: "key_work", date: "2025-01-21T15:00:00Z", createdAt: "2025-01-22T09:00:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "completed",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, wordCount: 245,
      crossReferencedRecords: [], childIds: ["child-jordan"],
      qualityNotes: "Jordan chose to play chess. Used game as therapeutic tool to discuss choices and consequences. Jordan initiated conversation about wanting to visit grandma.",
    },
    {
      id: "kw-05", recordType: "key_work", date: "2025-01-09T15:00:00Z", createdAt: "2025-01-09T17:00:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-10T08:00:00Z",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, wordCount: 315,
      crossReferencedRecords: [], childIds: ["child-morgan"],
      qualityNotes: "Morgan talked about Ramadan preparation. Discussed how home supports his faith. Made a plan for prayer times and fasting schedule. Morgan's voice clearly captured.",
    },
    {
      id: "kw-06", recordType: "key_work", date: "2025-01-23T15:00:00Z", createdAt: "2025-01-24T10:00:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-25T08:00:00Z",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, wordCount: 285,
      crossReferencedRecords: [], childIds: ["child-morgan"],
      qualityNotes: "Morgan discussed post-16 aspirations — wants to study engineering. Explored apprenticeship options. Lisa supported Morgan to research local colleges. Independence skills integrated.",
    },

    // ── Medication Records (6) ──────────────────────────────────────────
    // Morgan takes daily melatonin (AM + PM). Records contemporaneous.
    {
      id: "med-01", recordType: "medication", date: "2025-01-05T08:00:00Z", createdAt: "2025-01-05T08:05:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-05T14:00:00Z",
      mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, wordCount: 25,
      crossReferencedRecords: [], childIds: ["child-morgan"],
    },
    {
      id: "med-02", recordType: "medication", date: "2025-01-05T21:00:00Z", createdAt: "2025-01-05T21:05:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-06T08:00:00Z",
      mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, wordCount: 22,
      crossReferencedRecords: [], childIds: ["child-morgan"],
    },
    {
      id: "med-03", recordType: "medication", date: "2025-01-10T08:00:00Z", createdAt: "2025-01-10T08:10:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-10T14:00:00Z",
      mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, wordCount: 28,
      crossReferencedRecords: [], childIds: ["child-morgan"],
    },
    {
      id: "med-04", recordType: "medication", date: "2025-01-10T21:00:00Z", createdAt: "2025-01-10T21:10:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-11T09:00:00Z",
      mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, wordCount: 24,
      crossReferencedRecords: [], childIds: ["child-morgan"],
    },
    {
      id: "med-05", recordType: "medication", date: "2025-01-15T08:00:00Z", createdAt: "2025-01-15T08:15:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-15T14:00:00Z",
      mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, wordCount: 30,
      crossReferencedRecords: [], childIds: ["child-morgan"],
    },
    {
      id: "med-06", recordType: "medication", date: "2025-01-20T08:00:00Z", createdAt: "2025-01-20T08:05:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-20T14:00:00Z",
      mandatoryFieldsTotal: 6, mandatoryFieldsCompleted: 6, wordCount: 26,
      crossReferencedRecords: [], childIds: ["child-morgan"],
    },

    // ── Care Plan Reviews (3) ───────────────────────────────────────────
    {
      id: "cpr-01", recordType: "care_plan_review", date: "2025-01-10T10:00:00Z", createdAt: "2025-01-13T09:00:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-14T09:00:00Z",
      mandatoryFieldsTotal: 14, mandatoryFieldsCompleted: 14, wordCount: 455,
      crossReferencedRecords: ["kw-01"], childIds: ["child-alex"],
      qualityNotes: "Comprehensive review. Alex's views captured in his words. Progress on emotional regulation noted. Contact arrangements reviewed. Education targets updated.",
    },
    {
      id: "cpr-02", recordType: "care_plan_review", date: "2025-01-12T10:00:00Z", createdAt: "2025-01-15T10:00:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-16T09:00:00Z",
      mandatoryFieldsTotal: 14, mandatoryFieldsCompleted: 13, wordCount: 385,
      crossReferencedRecords: ["kw-03"], childIds: ["child-jordan"],
      qualityNotes: "Good review. Jordan's wishes and feelings recorded. One field (health update) pending GP report. Social worker attended.",
    },
    {
      id: "cpr-03", recordType: "care_plan_review", date: "2025-01-14T10:00:00Z", createdAt: "2025-01-16T11:00:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-17T09:00:00Z",
      mandatoryFieldsTotal: 14, mandatoryFieldsCompleted: 14, wordCount: 425,
      crossReferencedRecords: ["kw-05"], childIds: ["child-morgan"],
      qualityNotes: "Excellent review. Morgan's cultural and faith needs thoroughly addressed. Post-16 pathway discussed. Morgan chaired part of his own review — outstanding practice.",
    },

    // ── Contact Records (4) ─────────────────────────────────────────────
    {
      id: "con-01", recordType: "contact_record", date: "2025-01-03T10:00:00Z", createdAt: "2025-01-03T12:00:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-04T09:00:00Z",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, wordCount: 98,
      crossReferencedRecords: [], childIds: ["child-alex"],
      qualityNotes: "Alex's phone contact with mum. Mixed emotions afterwards. Sarah debriefed with Alex.",
    },
    {
      id: "con-02", recordType: "contact_record", date: "2025-01-10T14:00:00Z", createdAt: "2025-01-10T16:00:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-11T08:00:00Z",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, wordCount: 88,
      crossReferencedRecords: [], childIds: ["child-jordan"],
      qualityNotes: "Jordan's supervised contact with grandma at the park. Jordan happy and settled throughout.",
    },
    {
      id: "con-03", recordType: "contact_record", date: "2025-01-17T11:00:00Z", createdAt: "2025-01-17T15:00:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-18T09:00:00Z",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, wordCount: 112,
      crossReferencedRecords: [], childIds: ["child-morgan"],
      qualityNotes: "Morgan's uncle visited. Cultural conversation about family heritage. Morgan showed uncle his room and prayer space. Positive interaction.",
    },
    {
      id: "con-04", recordType: "contact_record", date: "2025-01-24T09:00:00Z", createdAt: "2025-01-24T11:00:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-25T09:00:00Z",
      mandatoryFieldsTotal: 8, mandatoryFieldsCompleted: 8, wordCount: 105,
      crossReferencedRecords: [], childIds: ["child-alex"],
      qualityNotes: "Alex's SW visit. Alex shared his views confidently. Discussed upcoming LAC review.",
    },

    // ── Supervision Records (2) ─────────────────────────────────────────
    {
      id: "sup-01", recordType: "supervision", date: "2025-01-07T14:00:00Z", createdAt: "2025-01-08T10:00:00Z",
      createdBy: "staff-darren", createdByName: "Darren Laville", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-08T14:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 255,
      crossReferencedRecords: [], childIds: [],
      qualityNotes: "Sarah's supervision. Discussed caseload, training needs, and Alex's incident. Reflective practice evidenced. Next supervision booked.",
    },
    {
      id: "sup-02", recordType: "supervision", date: "2025-01-21T14:00:00Z", createdAt: "2025-01-22T10:00:00Z",
      createdBy: "staff-darren", createdByName: "Darren Laville", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-22T14:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 285,
      crossReferencedRecords: [], childIds: [],
      qualityNotes: "Tom's supervision. Discussed key-work with Jordan and agency staff incident. Tom identified training need in therapeutic crisis intervention.",
    },

    // ── Risk Assessment (1) ─────────────────────────────────────────────
    {
      id: "ra-01", recordType: "risk_assessment", date: "2025-01-15T10:00:00Z", createdAt: "2025-01-17T09:00:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-18T09:00:00Z",
      mandatoryFieldsTotal: 16, mandatoryFieldsCompleted: 16, wordCount: 410,
      crossReferencedRecords: ["inc-01", "rst-01"], childIds: ["child-alex"],
      qualityNotes: "Updated Alex's risk assessment following Jan 8 incident and restraint. Cross-referenced to both records. Risk level adjusted. Management strategies reviewed with PACE principles.",
    },

    // ── Missing Child Record (1) ────────────────────────────────────────
    {
      id: "mc-01", recordType: "missing_child", date: "2025-01-18T17:30:00Z", createdAt: "2025-01-18T18:00:00Z",
      createdBy: "staff-tom", createdByName: "Tom Richards", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-18T21:00:00Z",
      mandatoryFieldsTotal: 10, mandatoryFieldsCompleted: 10, wordCount: 185,
      crossReferencedRecords: ["sg-01"], childIds: ["child-alex"],
      qualityNotes: "Alex left home without permission after argument with Jordan. Found at local park within 30 minutes. Police notified per protocol. Return interview completed. Alex said he needed space — PACE used in debrief.",
    },

    // ── Safeguarding Referral (1) ───────────────────────────────────────
    {
      id: "sg-01", recordType: "safeguarding_referral", date: "2025-01-18T18:00:00Z", createdAt: "2025-01-18T19:00:00Z",
      createdBy: "staff-sarah", createdByName: "Sarah Johnson", status: "signed_off",
      signedOffBy: "staff-darren", signedOffAt: "2025-01-19T09:00:00Z",
      mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 12, wordCount: 325,
      crossReferencedRecords: ["mc-01"], childIds: ["child-alex"],
      qualityNotes: "Notification to Ofsted and local authority following Alex's missing episode. All required notifications made within timescale. SW acknowledged same evening.",
    },

    // ── Health Assessment (1) ───────────────────────────────────────────
    {
      id: "ha-01", recordType: "health_assessment", date: "2025-01-10T10:00:00Z", createdAt: "2025-01-13T10:00:00Z",
      createdBy: "staff-lisa", createdByName: "Lisa Williams", status: "signed_off",
      signedOffBy: "staff-sarah", signedOffAt: "2025-01-14T08:00:00Z",
      mandatoryFieldsTotal: 12, mandatoryFieldsCompleted: 12, wordCount: 355,
      crossReferencedRecords: [], childIds: ["child-jordan"],
      qualityNotes: "Jordan's initial health assessment. GP check, dental, optician all booked. Emotional wellbeing baseline recorded. Jordan involved in identifying his health goals.",
    },
  ];

  const expectations: RecordExpectation[] = [
    // Daily logs: 14 fulfilled + 2 missing on 28th
    ...records
      .filter((r) => r.recordType === "daily_log")
      .map((r) => ({ recordType: "daily_log" as const, date: r.date.split("T")[0], fulfilled: true, recordId: r.id })),
    { recordType: "daily_log", date: "2025-01-28", fulfilled: false },
    { recordType: "daily_log", date: "2025-01-28", fulfilled: false },

    // Incidents: 3 fulfilled
    { recordType: "incident", date: "2025-01-08", fulfilled: true, recordId: "inc-01" },
    { recordType: "incident", date: "2025-01-14", fulfilled: true, recordId: "inc-02" },
    { recordType: "incident", date: "2025-01-22", fulfilled: true, recordId: "inc-03" },

    // Restraint: 1 fulfilled
    { recordType: "restraint", date: "2025-01-08", fulfilled: true, recordId: "rst-01" },

    // Key-work: 6 fulfilled
    { recordType: "key_work", date: "2025-01-06", fulfilled: true, recordId: "kw-01" },
    { recordType: "key_work", date: "2025-01-20", fulfilled: true, recordId: "kw-02" },
    { recordType: "key_work", date: "2025-01-07", fulfilled: true, recordId: "kw-03" },
    { recordType: "key_work", date: "2025-01-21", fulfilled: true, recordId: "kw-04" },
    { recordType: "key_work", date: "2025-01-09", fulfilled: true, recordId: "kw-05" },
    { recordType: "key_work", date: "2025-01-23", fulfilled: true, recordId: "kw-06" },

    // Medication: 6 fulfilled + 1 missing
    { recordType: "medication", date: "2025-01-05", fulfilled: true, recordId: "med-01" },
    { recordType: "medication", date: "2025-01-05", fulfilled: true, recordId: "med-02" },
    { recordType: "medication", date: "2025-01-10", fulfilled: true, recordId: "med-03" },
    { recordType: "medication", date: "2025-01-10", fulfilled: true, recordId: "med-04" },
    { recordType: "medication", date: "2025-01-15", fulfilled: true, recordId: "med-05" },
    { recordType: "medication", date: "2025-01-20", fulfilled: true, recordId: "med-06" },
    { recordType: "medication", date: "2025-01-25", fulfilled: false },

    // Care plan reviews: 3 fulfilled
    { recordType: "care_plan_review", date: "2025-01-10", fulfilled: true, recordId: "cpr-01" },
    { recordType: "care_plan_review", date: "2025-01-12", fulfilled: true, recordId: "cpr-02" },
    { recordType: "care_plan_review", date: "2025-01-14", fulfilled: true, recordId: "cpr-03" },

    // Contact: 4 fulfilled
    { recordType: "contact_record", date: "2025-01-03", fulfilled: true, recordId: "con-01" },
    { recordType: "contact_record", date: "2025-01-10", fulfilled: true, recordId: "con-02" },
    { recordType: "contact_record", date: "2025-01-17", fulfilled: true, recordId: "con-03" },
    { recordType: "contact_record", date: "2025-01-24", fulfilled: true, recordId: "con-04" },

    // Supervision: 2 fulfilled
    { recordType: "supervision", date: "2025-01-07", fulfilled: true, recordId: "sup-01" },
    { recordType: "supervision", date: "2025-01-21", fulfilled: true, recordId: "sup-02" },

    // Risk assessment: 1 fulfilled
    { recordType: "risk_assessment", date: "2025-01-15", fulfilled: true, recordId: "ra-01" },

    // Missing child: 1 fulfilled
    { recordType: "missing_child", date: "2025-01-18", fulfilled: true, recordId: "mc-01" },

    // Safeguarding: 1 fulfilled
    { recordType: "safeguarding_referral", date: "2025-01-18", fulfilled: true, recordId: "sg-01" },

    // Health assessment: 1 fulfilled
    { recordType: "health_assessment", date: "2025-01-10", fulfilled: true, recordId: "ha-01" },
  ];

  return { records, expectations };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { records, expectations } = getDemoData();
    const result = generateRecordQualityIntelligence(
      records,
      expectations,
      "oak-house",
      "2025-01-01",
      "2025-01-31",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate record quality intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records, expectations, homeId, periodStart, periodEnd } = body;

    if (!records || !expectations || !homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: records, expectations, homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(records) || !Array.isArray(expectations)) {
      return NextResponse.json(
        { error: "records and expectations must be arrays" },
        { status: 400 },
      );
    }

    const result = generateRecordQualityIntelligence(
      records,
      expectations,
      homeId,
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process record quality data", details: String(error) },
      { status: 500 },
    );
  }
}
