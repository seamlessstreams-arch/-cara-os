import type { Metadata } from "next";

export const metadata: Metadata = { title: "Care Events · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
