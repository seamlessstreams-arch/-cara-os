import type { Metadata } from "next";

export const metadata: Metadata = { title: "Practice Quality · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
