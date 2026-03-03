import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const titleFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-title",
  weight: ["500", "700"]
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "NorthBridge Tax | Canada Filing",
  description:
    "Security-first, Canada-focused tax filing for individual, self-employed, and company workflows.",
  applicationName: "NorthBridge Tax",
  keywords: ["Canada tax", "CRA", "tax filing", "self-employed", "company tax", "secure tax app"],
  metadataBase: new URL("https://localhost:3000")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${titleFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
