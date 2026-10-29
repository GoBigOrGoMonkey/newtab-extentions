import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Extension Vault",
  description: "A simple store for sharing and updating Chrome extensions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
