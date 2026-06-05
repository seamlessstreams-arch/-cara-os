"use client";
import { useParams } from "next/navigation";
import { YoungPersonStoryView } from "@/components/domain/young-person-story-view";
import { RecordAnythingButton } from "@/components/forms/record-anything-button";

export default function ChildStoryPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <div className="flex justify-end px-4 pt-4">
        <RecordAnythingButton childId={id} />
      </div>
      <YoungPersonStoryView childId={id} />
    </div>
  );
}
