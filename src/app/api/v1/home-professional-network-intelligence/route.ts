// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PROFESSIONAL NETWORK INTELLIGENCE API ROUTE
// GET /api/v1/home-professional-network-intelligence
// Synthesises professional network contacts and multi-agency meetings to
// assess the strength, currency, and health of the professional support
// network around the children's home.
// CHR 2015 Reg 5, Reg 22. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeProfessionalNetwork,
  type ProfessionalContactInput,
  type MultiAgencyMeetingInput,
} from "@/lib/engines/home-professional-network-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const youngPeople = (store.youngPeople ?? []) as any[];
    const total_children = youngPeople.length;

    // Professional network contacts
    const rawContacts = (store.professionalNetworkContacts ?? []) as any[];
    const contacts: ProfessionalContactInput[] = rawContacts.map((c: any) => ({
      id: c.id ?? "",
      child_id: c.child_id ?? "",
      role: c.role ?? "",
      name: c.name ?? "",
      organisation: c.organisation ?? "",
      last_contact: c.last_contact ? c.last_contact.toString().slice(0, 10) : "",
      contact_frequency: c.contact_frequency ?? "",
      is_active: c.is_active !== false,
      has_email: !!(c.email && c.email.trim().length > 0),
      has_phone: !!(c.phone && c.phone.trim().length > 0),
      key_responsibilities_count: Array.isArray(c.key_responsibilities) ? c.key_responsibilities.length : 0,
    }));

    // Multi-agency meetings
    const rawMeetings = (store.multiAgencyMeetings ?? []) as any[];
    const meetings: MultiAgencyMeetingInput[] = rawMeetings.map((m: any) => ({
      id: m.id ?? "",
      child_id: m.child_id ?? "",
      meeting_type: m.meeting_type ?? "",
      meeting_status: m.meeting_status ?? "scheduled",
      date: (m.date ?? today).toString().slice(0, 10),
      attendees_count: Array.isArray(m.attendees) ? m.attendees.length : 0,
      attendees_present: Array.isArray(m.attendees) ? m.attendees.filter((a: any) => a.attended).length : 0,
      child_participated: !!(m.child_participation && m.child_participation.trim().length > 0),
      action_items_count: Array.isArray(m.action_items) ? m.action_items.length : 0,
      actions_completed: Array.isArray(m.action_items) ? m.action_items.filter((a: any) => a.status === "completed").length : 0,
      has_decisions: Array.isArray(m.decisions_reached) && m.decisions_reached.length > 0,
      has_next_date: !!(m.next_meeting_date && m.next_meeting_date.trim().length > 0),
    }));

    const result = computeProfessionalNetwork({ today, total_children, contacts, meetings });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
