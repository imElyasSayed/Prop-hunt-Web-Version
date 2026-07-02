import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

// SPLOTCH brand fonts: Baloo 2 (chunky display) + Nunito (body/labels).
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SPLOTCH — Blend in. Cash out.",
  description:
    "Paint your blob, hide in plain sight, and survive the Hunter. A SPLOTCH prototype.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${nunito.variable} h-full antialiased`}
    >
      <body
        className="min-h-full overflow-hidden"
        style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
