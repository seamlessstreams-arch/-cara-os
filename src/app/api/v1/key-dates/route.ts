import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr, daysFromNow } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════════════════════
// KEY DATES API
// Returns upcoming important dates across the home:
// - Care plan reviews, LAC reviews, PEPs
// - Young people birthdays
// - Training expiry dates
// - Supervision due dates
// - Placement end dates
// - Probation end dates
// - Document expiry
// ══════════════════════════════════════════════════════════════════════════════

interface KeyDate {
  id: string;
  type: "birthday" | "training_expiry" | "supervision" | "probation_end" | "placement_review" | "document_expiry" | "care_review";
  title: string;
  date: string;
  entity_type: "young_person" | "staff" | "document" | "home";
  entity_id: string;
  entity_name: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  href: string;
  notes?: string;
}

function daysBetween(d1: string, d2: string): number {
  const ms = new Date(d1).getTime() - new Date(d2).getTime();
  return Math.round(ms / 86400000);
}

export async function GET(_req: NextRequest) {
  const today = todayStr();
  const in30Days = daysFromNow(30);
  const dates: KeyDate[] = [];

  // ── Young people birthdays ────────────────────────────────────────────
  const youngPeople = db.youngPeople.findAll().filter((yp) => yp.status === "current");
  for (const yp of youngPeople) {
    const dob = new Date(yp.date_of_birth);
    const thisYear = new Date().getFullYear();
    const birthday = new Date(thisYear, dob.getMonth(), dob.getDate());

    // If birthday has already passed this year, look at next year
    if (birthday < new Date()) {
      birthday.setFullYear(thisYear + 1);
    }

    const bStr = birthday.toISOString().slice(0, 10);
    const diff = daysBetween(bStr, today);

    if (diff >= 0 && diff <= 60) {
      const age = birthday.getFullYear() - dob.getFullYear();
      dates.push({
        id: `birthday_${yp.id}`,
        type: "birthday",
        title: `${yp.preferred_name || yp.first_name}'s ${age}th birthday`,
        date: bStr,
        entity_type: "young_person",
        entity_id: yp.id,
        entity_name: `${yp.first_name} ${yp.last_name}`,
        severity: diff <= 7 ? "medium" : "info",
        href: `/young-people/${yp.id}`,
        notes: diff === 0 ? "Today!" : undefined,
      });
    }
  }

  // ── Training expiry dates ─────────────────────────────────────────────
  const training = db.training.findAll();
  const staff = db.staff.findAll().filter((s) => s.is_active);

  for (const rec of training) {
    if (!rec.expiry_date) continue;
    const diff = daysBetween(rec.expiry_date, today);

    if (diff >= -7 && diff <= 30) {
      const member = staff.find((s) => s.id === rec.staff_id);
      if (!member) continue;

      dates.push({
        id: `training_${rec.id}`,
        type: "training_expiry",
        title: `${rec.course_name} expires`,
        date: rec.expiry_date,
        entity_type: "staff",
        entity_id: rec.staff_id,
        entity_name: member.full_name,
        severity: diff < 0 ? "critical" : diff <= 7 ? "high" : "medium",
        href: `/training`,
        notes: diff < 0 ? "Expired" : undefined,
      });
    }
  }

  // ── Supervision due dates ─────────────────────────────────────────────
  for (const member of staff) {
    if (!member.next_supervision_due || member.role === "responsible_individual") continue;
    const diff = daysBetween(member.next_supervision_due, today);

    if (diff >= -14 && diff <= 14) {
      dates.push({
        id: `supervision_${member.id}`,
        type: "supervision",
        title: `${member.first_name}'s supervision due`,
        date: member.next_supervision_due,
        entity_type: "staff",
        entity_id: member.id,
        entity_name: member.full_name,
        severity: diff < 0 ? "high" : diff <= 3 ? "medium" : "low",
        href: `/staff/${member.id}`,
        notes: diff < 0 ? "Overdue" : undefined,
      });
    }
  }

  // ── Probation end dates ───────────────────────────────────────────────
  for (const member of staff) {
    if (!member.probation_end_date) continue;
    const diff = daysBetween(member.probation_end_date, today);

    if (diff >= 0 && diff <= 30) {
      dates.push({
        id: `probation_${member.id}`,
        type: "probation_end",
        title: `${member.first_name}'s probation ends`,
        date: member.probation_end_date,
        entity_type: "staff",
        entity_id: member.id,
        entity_name: member.full_name,
        severity: diff <= 7 ? "medium" : "low",
        href: `/staff/${member.id}`,
      });
    }
  }

  // Sort by date ascending — nearest dates first
  dates.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    data: dates,
    meta: { total: dates.length, today },
  });
}
