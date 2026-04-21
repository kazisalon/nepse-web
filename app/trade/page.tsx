import type { Metadata } from "next";
import { TradePanel } from "@/components/TradePanel";
import { fetchNepseStocks } from "@/lib/api";

export const metadata: Metadata = {
  title: "Practice",
  description: "Practice buy/sell flows with virtual money. An optional NEPSELab tool alongside live market data and analysis.",
};

export default async function TradePage() {
  const stocks = await fetchNepseStocks();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          Optional tool: practice buy/sell with virtual money. Your balance and holdings update locally.
        </p>
      </header>
      <TradePanel stocks={stocks} />
    </div>
  );
}
