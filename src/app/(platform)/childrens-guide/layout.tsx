import type { Metadata } from "next";

export const metadata: Metadata = { title: "Children's Guide · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
