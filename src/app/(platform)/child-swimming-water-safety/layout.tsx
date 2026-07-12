import type { Metadata } from "next";

export const metadata: Metadata = { title: "Swimming · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
