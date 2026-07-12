import type { Metadata } from "next";

export const metadata: Metadata = { title: "Visitor Log · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
