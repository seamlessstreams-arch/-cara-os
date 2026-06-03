"use client";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";
import { ClipboardCheck } from "lucide-react";
import { ComplianceRules, EvidenceBank, RecordingQuality, MedicationTrends, DuplicateDetection, ConflictDetection, EventRouting } from "@/components/dashboards/cards";

export default function ComplianceDashboardPage() {
  return (
    <RoleDashboard
      title="Home Compliance Dashboard"
      subtitle="Are we meeting the regulations — fixed rules, evidence coverage, record quality and data integrity"
      icon={<ClipboardCheck className="h-5 w-5" />}
      intro="The home's compliance posture, computed from events against fixed (non-ARIA) rules: which regulatory checks pass or fail, how completely each evidence area is covered, the quality of the underlying records, medication-error control, and the routing, de-duplication and conflict detection that keep the record set clean and internally consistent."
    >
      <ComplianceRules />
      <EvidenceBank />
      <RecordingQuality />
      <MedicationTrends />
      <DuplicateDetection />
      <ConflictDetection />
      <EventRouting />
    </RoleDashboard>
  );
}
