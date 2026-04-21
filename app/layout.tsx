import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("nepselab_theme")?.value;
  const theme = themeCookie == "dark" ? "dark" : "light";
  const isDark = theme === "dark";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${isDark ? " dark" : ""}`}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-cyan-500/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.14),transparent_35%)]" />
        </div>
        <TradingProvider>
          <Navbar />
          <main className="flex-1 px-4 py-8 text-black dark:text-white">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
          <footer className="border-t border-black/5 bg-white/70 px-4 py-6 text-sm text-black/60 backdrop-blur dark:border-white/10 dark:bg-black/40 dark:text-white/60">
            <div className="mx-auto w-full max-w-7xl">
              NEPSELab — live NEPSE market data for tracking, charts, and analysis. Practice trading is optional.
            </div>
          </footer>
        </TradingProvider>
      </body>
    </html>
  );
}
