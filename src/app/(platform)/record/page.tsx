"use client";

// Landing page for the "Record" nav item. The record form itself lives at
// /record/[childId]; without this index the bare /record link 404'd. Pick a
// child here and go straight to their record form.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChildSelect } from "@/components/young-people/child-select";

export default function RecordChildIndexPage() {
  const router = useRouter();
  const [childId, setChildId] = useState("");

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[var(--cs-navy)]">Record for a Child</h1>
        <p className="text-sm text-[var(--cs-text-muted)]">
          Choose the child, then just write what happened. Cara will figure out the type and route it everywhere.
        </p>
      </div>
      <label htmlFor="record-child" className="text-sm font-medium mb-1 block">Child</label>
      <ChildSelect
        id="record-child"
        value={childId}
        onChange={(id) => { setChildId(id); if (id) router.push(`/record/${id}`); }}
        placeholder="Select a child to record about"
      />
    </div>
  );
}
