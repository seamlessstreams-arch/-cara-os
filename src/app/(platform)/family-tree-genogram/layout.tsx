import type { Metadata } from "next";

export const metadata: Metadata = { title: "Family Tree · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
