import type { Metadata } from "next";

export const metadata: Metadata = { title: "Weekly Overview · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
