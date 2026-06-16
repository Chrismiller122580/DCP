import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Direct Connect Pay — Merchant Dashboard",
  description: "Manage invoices and payments — Multi-coin crypto gateway (XRPL, BTC, ETH, SOL, USDC, DOGE)",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/brand/cropped-dcp-icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/cropped-dcp-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/cropped-dcp-icon-192x192.png",
    shortcut: "/brand/cropped-dcp-icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-950 text-zinc-200 flex flex-col">
        {children}
      </body>
    </html>
  );
}
