import type { Metadata } from "next";

// Deliberately generic: record pages must never put a child's or staff
// member's name into the browser title (it persists in history/bookmarks).
export const metadata: Metadata = { title: "Young person · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
