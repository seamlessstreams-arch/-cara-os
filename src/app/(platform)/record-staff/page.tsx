"use client";

// Landing page for the "Record Staff" nav item. The record form itself lives at
// /record-staff/[staffId]; without this index the bare /record-staff link
// 404'd. Pick a staff member here and go straight to their record form.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StaffSelect } from "@/components/staff/staff-select";

export default function RecordStaffIndexPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[var(--cs-navy)]">Record for a Staff Member</h1>
        <p className="text-sm text-[var(--cs-text-muted)]">
          Choose the staff member, then just write what happened. Cara will classify it and route it everywhere.
        </p>
      </div>
      <label htmlFor="record-staff" className="text-sm font-medium mb-1 block">Staff member</label>
      <StaffSelect
        id="record-staff"
        value={staffId}
        onChange={(id) => { setStaffId(id); if (id) router.push(`/record-staff/${id}`); }}
        placeholder="Select a staff member to record about"
      />
    </div>
  );
}
