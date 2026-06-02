"use client";
import { useParams } from "next/navigation";
import { YoungPersonStoryView } from "@/components/domain/young-person-story-view";

export default function ChildStoryPage() {
  const { id } = useParams<{ id: string }>();
  return <YoungPersonStoryView childId={id} />;
}
