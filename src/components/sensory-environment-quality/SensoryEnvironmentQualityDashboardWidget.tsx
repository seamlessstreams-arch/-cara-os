"use client";

import React, { useEffect, useState } from "react";
import type {
  SensoryEnvironmentQualityIntelligence,
  ChildSensoryProfile,
} from "@/lib/sensory-environment-quality/sensory-environment-quality-engine";
import {
  getRatingLabel,
  getSensoryAreaLabel,
} from "@/lib/sensory-environment-quality/sensory-environment-quality-engine";

// ── Inline Components ───────────────────────────────────────────────────────

function ScoreBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium">
          {value}/{max}
        </span>
      </div>
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${pctVal}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 w-10 text-right">
          {pctVal}%
        </span>
      </div>
    </div>
  );
}

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
      >
        <span
          className={`transform transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          &#9654;
        </span>
        {title}
      </button>
      {expanded && <div className="mt-3">{children}</div>}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}
        {suffix}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

// ── Policy Item ─────────────────────────────────────────────────────────────

function PolicyItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${active ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}
      >
        {active ? "IN PLACE" : "NOT IN PLACE"}
      </span>
    </div>
  );
}

// ── Child Profile Card ──────────────────────────────────────────────────────

function ChildProfileCard({ profile }: { profile: ChildSensoryProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{profile.childName}</h4>
          <span className="text-xs text-gray-500">
            Score: {profile.overallScore}/10
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
            profile.overallScore >= 8
              ? "bg-green-100 text-green-700 border-green-200"
              : profile.overallScore >= 6
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : profile.overallScore >= 4
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-red-100 text-red-700 border-red-200"
          }`}
        >
          {profile.overallScore >= 8
            ? "WELL SUPPORTED"
            : profile.overallScore >= 6
              ? "SUPPORTED"
              : profile.overallScore >= 4
                ? "PARTIAL"
                : "NEEDS ATTENTION"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.assessmentCount}
          </span>
          <p className="text-xs text-gray-500">Assessments</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.effectivenessRate}%
          </span>
          <p className="text-xs text-gray-500">Effective</p>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">
            {profile.childFeedbackRate}%
          </span>
          <p className="text-xs text-gray-500">Positive</p>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2 text-center">
        {profile.areaDiversity} sensory area{profile.areaDiversity !== 1 ? "s" : ""}{" "}
        covered
      </div>
    </div>
  );
}

// ── Main Widget ─────────────────────────────────────────────────────────────

export default function SensoryEnvironmentQualityDashboardWidget() {
  const [data, setData] =
    useState<SensoryEnvironmentQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sensory-environment-quality")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-48 rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-800">
          Sensory Environment Quality Intelligence
        </h3>
        <p className="mt-2 text-sm text-red-600">Failed to load: {error}</p>
      </div>
    );
  }

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  const scoreColor = (score: number, max: number) => {
    const pctVal = max > 0 ? (score / max) * 100 : 0;
    if (pctVal >= 80) return "text-green-600";
    if (pctVal >= 60) return "text-blue-600";
    if (pctVal >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const ratingColorMap: Record<string, string> = {
    outstanding: "bg-green-100 text-green-800 border-green-300",
    good: "bg-blue-100 text-blue-800 border-blue-300",
    requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
    inadequate: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Sensory Environment Quality
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} · CHR 2015 Reg 6/9 · NMS 10
            · Equality Act 2010
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${ratingColorMap[data.rating] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}
        >
          {getRatingLabel(
            data.rating as
              | "outstanding"
              | "good"
              | "requires_improvement"
              | "inadequate",
          )}{" "}
          — {data.overallScore}/100
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat
          label="Overall Score"
          value={data.overallScore}
          suffix="/100"
          color={scoreColor(data.overallScore, 100)}
        />
        <Stat
          label="Sensory Quality"
          value={data.sensoryQuality.score}
          suffix="/25"
          color={scoreColor(data.sensoryQuality.score, 25)}
        />
        <Stat
          label="Compliance"
          value={data.sensoryCompliance.score}
          suffix="/25"
          color={scoreColor(data.sensoryCompliance.score, 25)}
        />
        <Stat
          label="Staff Readiness"
          value={data.staffReadiness.score}
          suffix="/25"
          color={scoreColor(data.staffReadiness.score, 25)}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat
          label="Effectiveness Rate"
          value={data.sensoryQuality.effectivenessRate}
          suffix="%"
          color={
            data.sensoryQuality.effectivenessRate >= 80
              ? "text-green-600"
              : "text-amber-600"
          }
        />
        <Stat
          label="Child Feedback"
          value={data.sensoryQuality.childFeedbackRate}
          suffix="%"
          color={
            data.sensoryQuality.childFeedbackRate >= 80
              ? "text-green-600"
              : "text-amber-600"
          }
        />
        <Stat
          label="Policy Score"
          value={data.sensoryPolicy.score}
          suffix="/25"
          color={scoreColor(data.sensoryPolicy.score, 25)}
        />
        <Stat
          label="Staff Competency"
          value={data.staffReadiness.averageCompetencyRate}
          suffix="%"
          color={
            data.staffReadiness.averageCompetencyRate >= 80
              ? "text-green-600"
              : "text-amber-600"
          }
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.sensoryQuality.effectivenessRate >= 80 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            HIGH EFFECTIVENESS
          </span>
        )}
        {data.sensoryQuality.childFeedbackRate >= 80 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            POSITIVE FEEDBACK
          </span>
        )}
        {data.sensoryPolicy.score === 25 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            FULL POLICY COMPLIANCE
          </span>
        )}
        {data.staffReadiness.averageCompetencyRate >= 80 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            HIGH STAFF COMPETENCY
          </span>
        )}
        {data.sensoryCompliance.reviewScheduledRate < 80 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            REVIEW SCHEDULING GAPS
          </span>
        )}
        {data.sensoryCompliance.staffImplementedRate < 80 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            IMPLEMENTATION CONCERNS
          </span>
        )}
      </div>

      {/* Child Profiles */}
      <Section
        title={`Child Sensory Profiles (${data.childProfiles.length})`}
        expanded={expandedSection === "profiles"}
        onToggle={() => toggle("profiles")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.childProfiles.map((profile) => (
            <ChildProfileCard key={profile.childId} profile={profile} />
          ))}
        </div>
      </Section>

      {/* Sensory Quality */}
      <Section
        title={`Sensory Quality (${data.sensoryQuality.score}/25)`}
        expanded={expandedSection === "quality"}
        onToggle={() => toggle("quality")}
      >
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <ScoreBar
            label="Effectiveness Rate"
            value={data.sensoryQuality.effectivenessRate}
            max={100}
            color="bg-purple-500"
          />
          <ScoreBar
            label="Child Feedback"
            value={data.sensoryQuality.childFeedbackRate}
            max={100}
            color="bg-blue-500"
          />
          <ScoreBar
            label="OT Involvement"
            value={data.sensoryQuality.occupationalTherapistRate}
            max={100}
            color="bg-green-500"
          />
          <ScoreBar
            label="Environment Adapted"
            value={data.sensoryQuality.environmentAdaptedRate}
            max={100}
            color="bg-orange-500"
          />
        </div>
      </Section>

      {/* Sensory Compliance */}
      <Section
        title={`Sensory Compliance (${data.sensoryCompliance.score}/25)`}
        expanded={expandedSection === "compliance"}
        onToggle={() => toggle("compliance")}
      >
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <ScoreBar
            label="Documented in Plan"
            value={data.sensoryCompliance.documentedRate}
            max={100}
            color="bg-purple-500"
          />
          <ScoreBar
            label="Staff Implemented"
            value={data.sensoryCompliance.staffImplementedRate}
            max={100}
            color="bg-blue-500"
          />
          <ScoreBar
            label="Review Scheduled"
            value={data.sensoryCompliance.reviewScheduledRate}
            max={100}
            color="bg-green-500"
          />
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-700">
              Sensory Area Diversity
            </span>
            <span className="text-lg font-bold text-purple-600">
              {data.sensoryCompliance.areaDiversity}/8
            </span>
          </div>
        </div>
      </Section>

      {/* Sensory Policy */}
      <Section
        title={`Sensory Policy (${data.sensoryPolicy.score}/25)`}
        expanded={expandedSection === "policy"}
        onToggle={() => toggle("policy")}
      >
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <PolicyItem
            label="Sensory Environment Policy"
            active={data.sensoryPolicy.sensoryEnvironmentPolicy}
          />
          <PolicyItem
            label="Sensory Assessment Process"
            active={data.sensoryPolicy.sensoryAssessmentProcess}
          />
          <PolicyItem
            label="Calm Space Provision"
            active={data.sensoryPolicy.calmSpaceProvision}
          />
          <PolicyItem
            label="Sensory Diet Guidance"
            active={data.sensoryPolicy.sensoryDietGuidance}
          />
          <PolicyItem
            label="Staff Training Requirement"
            active={data.sensoryPolicy.staffTrainingRequirement}
          />
          <PolicyItem
            label="Occupational Therapy Link"
            active={data.sensoryPolicy.occupationalTherapyLink}
          />
          <PolicyItem
            label="Regular Review"
            active={data.sensoryPolicy.regularReview}
          />
        </div>
      </Section>

      {/* Staff Readiness */}
      <Section
        title={`Staff Sensory Readiness (${data.staffReadiness.score}/25)`}
        expanded={expandedSection === "staff"}
        onToggle={() => toggle("staff")}
      >
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              Staff Assessed
            </span>
            <span className="text-lg font-bold text-gray-900">
              {data.staffReadiness.totalStaff}
            </span>
          </div>
          <ScoreBar
            label="Sensory Processing"
            value={data.staffReadiness.sensoryProcessingRate}
            max={100}
            color="bg-purple-500"
          />
          <ScoreBar
            label="Autism Awareness"
            value={data.staffReadiness.autismAwarenessRate}
            max={100}
            color="bg-blue-500"
          />
          <ScoreBar
            label="Calm Space Management"
            value={data.staffReadiness.calmSpaceManagementRate}
            max={100}
            color="bg-green-500"
          />
          <ScoreBar
            label="Sensory Diet Implementation"
            value={data.staffReadiness.sensoryDietImplementationRate}
            max={100}
            color="bg-orange-500"
          />
          <ScoreBar
            label="OT Support"
            value={data.staffReadiness.occupationalTherapySupportRate}
            max={100}
            color="bg-teal-500"
          />
          <ScoreBar
            label="Documentation Skills"
            value={data.staffReadiness.documentationSkillsRate}
            max={100}
            color="bg-pink-500"
          />
        </div>
      </Section>

      {/* Strengths / Actions */}
      <div className="space-y-4 mb-5">
        {data.actions.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">
              Actions Required
            </h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-sm text-red-700">
                  - {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.strengths.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">
              Strengths
            </h4>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-700">
                  - {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Regulatory Framework */}
      <Section
        title="Regulatory Framework"
        expanded={expandedSection === "regulatory"}
        onToggle={() => toggle("regulatory")}
      >
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <ul className="space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="text-xs text-gray-600">
                - {link}
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
}
