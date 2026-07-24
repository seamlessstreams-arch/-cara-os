import type { Metadata } from "next";
import { use } from "react";
import { YoungPersonViewTabs } from "@/components/young-person/young-person-view-tabs";

// Deliberately generic: record pages must never put a child's or staff
// member's name into the browser title (it persists in history/bookmarks).
export const metadata: Metadata = { title: "Young person · Cara" };

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <>
      <YoungPersonViewTabs childId={id} />
      {children}
    </>
  );
}
