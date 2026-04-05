import type { Metadata } from "next";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { fetchNepseStocks } from "@/lib/api";

export const metadata: Metadata = {
  title: "Portfolio (Virtual)",
  description: "View your virtual balance, holdings, and profit/loss for the NEPSELab simulator feature.",
};

export default async function PortfolioPage() {
  const stocks = await fetchNepseStocks();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          Virtual money only. Portfolio state is stored locally in your browser. This is a feature inside NEPSELab.
        </p>
      </header>
      <PortfolioSummary stocks={stocks} />
    </div>
  );
}
