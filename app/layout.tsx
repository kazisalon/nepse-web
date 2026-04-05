import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { TradingProvider } from "@/components/TradingProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NEPSELab | Live NEPSE Market Data",
    template: "%s | NEPSELab",
  },
  description:
    "NEPSELab: live NEPSE stock prices, share price Nepal dashboards, movers, indices, and a simulator feature for learning and testing.",
  keywords: ["NEPSE stock price", "share price Nepal", "NEPSE live", "NEPSELab", "virtual trading Nepal", "NEPSE"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <TradingProvider>
          <Navbar />
          <main className="flex-1 bg-zinc-50 px-4 py-8 text-black dark:bg-black dark:text-white">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
          <footer className="border-t border-black/5 bg-white/80 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-black/40 dark:text-white/60">
            <div className="mx-auto w-full max-w-6xl">
              NEPSELab — live market data platform. Simulator is one feature.
            </div>
          </footer>
        </TradingProvider>
      </body>
    </html>
  );
}
