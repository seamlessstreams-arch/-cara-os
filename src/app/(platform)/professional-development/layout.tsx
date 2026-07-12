import type { Metadata } from "next";

export const metadata: Metadata = { title: "Professional Development · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
